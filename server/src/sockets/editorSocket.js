//debounced autosave-> not persist to database on every keystroke, instead a timer

//keep a in-memory timer registry to debounce db persistence per room

//connects socketio and mongodb and debounced logic
//when a user joins, backend loasds the existing code form mongodb

//when the session recording is uploaded, everyone in the room is notified

import Room from '../models/Room.js';

const saveTimers = new Map(); //roomid->pending timer

// roomId -> Value: latest code string
// for new joiner, so that he receives the latest code, not from the db but from this buffer
const activeCodeBuffer = new Map();

//registers editor's Socket.IO event handlers
export const registerEditorHandlers = (io, socket) => { //io is the server instance and the socket is the connection belonging to one particular client
    //whenever client connects, these handlers...like in iane socket setup...io.on(connection,...registereditrohandlers)

  // event1-> Join Room & Fetch Complete State.....on frontend....socket.emit('room:join',{roomid,username,title})

  const currentUser=socket.data.user; // username from handshake
  socket.on('room:join', async ({ roomId,title }) => {
   try {
      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }
    // Find or create the room with metadata 
    let room = await Room.findOne({ roomId }).populate('host',         'username email role');
    if (!room) {
      room = await Room.create({
        roomId,
        title: title || 'Untitled Doubt Session',
        host: currentUser.id,
        code: '// Welcome to CodeMate\n',
      });
      await room.populate('host', 'username email role');
    }
    socket.join(roomId);

    // Serve buffered in-memory code if an edit is pending, otherwise use MongoDB state
      const initialCode = activeCodeBuffer.has(roomId) ? activeCodeBuffer.get(roomId) : room.code;

    // Send complete session state to the joining client..not to everyone
    socket.emit('room:initial-state', {
      roomId: room.roomId,
      title: room.title,
      recordingUrl: room.recordingUrl,
      updatedAt: room.updatedAt,
      language: room.language,
      code: initialCode,
      host: room.host,
      currentUser: {
          id: currentUser.id,
          role: currentUser.role,
        },
    });

    // Notify peers in the room
    socket.to(roomId).emit('room:user-joined', {
      userId: currentUser.id,
      role: currentUser.role,
    });
    console.log(`[Socket] User ${currentUser.id} (${currentUser.role}) joined room: ${roomId}`);
  } catch(error){
    console.error('[Socket Join Error]:', error);
    socket.emit('error', { message: 'Failed to join room' });
  }
  });

  // event2-> Real-Time Code Sync with Debounce
  socket.on('editor:code-change', ({ roomId, code, language }) => {
    if (!roomId || typeof code !== 'string') return;

    // Buffer latest in-memory code for immediate consistency
    activeCodeBuffer.set(roomId, code);

    socket.to(roomId).emit('editor:code-update', { code,language }); //isko chodke sabko

    if (saveTimers.has(roomId)) {
      clearTimeout(saveTimers.get(roomId));
    }

    const timer = setTimeout(async() => {
      try{
        const latestCode=activeCodeBuffer.get(roomId);
        //why fetching from buffer and not from closure variable code bcz closures capture the value at the exact momnet setTimeout is declared
        await Room.findOneAndUpdate(
          {roomId},
          {
            code:latestCode,...(language && { language }) // if language is undefined, then this expression evaluates to false and nohting added to payload
            //Benefit: It prevents overwriting the room's existing language in MongoDB with undefined when an editor edit event only sends character changes.
          },
          {new:true} // return updated doc
        );
        console.log(`[DB Auto-Save] Persisted snapshot for room: ${roomId}`);
        saveTimers.delete(roomId);
      } catch (err) {
        console.error(`[DB Auto-Save Error] Room ${roomId}:`, err);
      }
    }, 3000);

    saveTimers.set(roomId, timer); //so that next code-hange event can cancel it
  });

  // 3. Room Title Rename Sync
  socket.on('room:update-title', async ({ roomId, title }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return socket.emit('error', { message: 'Room not found' });

      // RBAC check
      const hostId = room.host._id ? room.host._id.toString() : room.host.toString();
      const isHost = hostId === currentUser.id;
      const isMentor = currentUser.role === 'mentor';

      if (!isHost && !isMentor) {
        return socket.emit('error', {
          message: 'Permission denied: Only the host or a mentor can update room details.',
        });
      }

      room.title = title;
      await room.save();

      io.in(roomId).emit('room:title-updated', { title });
    } catch (error) {
      socket.emit('error', { message: 'Failed to update title' });
    }
  });

  // 4. Disconnect Handler
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('room:user-left', {
          userId: currentUser.id,
        });
      }
    }
    console.log(`[Socket] Disconnected: ${currentUser.id}`);
  });

//   // 4. Session Recording Complete Event
//   socket.on('room:recording-uploaded', async ({ roomId, recordingUrl }) => {
//     await Room.updateOne({ roomId }, { recordingUrl });
//     io.to(roomId).emit('room:recording-available', { recordingUrl });
//   });
};