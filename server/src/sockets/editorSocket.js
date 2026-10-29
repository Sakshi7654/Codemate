//debounced autosave-> not persist to database on every keystroke, instead a timer

//keep a in-memory timer registry to debounce db persistence per room

//connects socketio and mongodb and debounced logic
//when a user joins, backend loasds the existing code form mongodb

//when the session recording is uploaded, everyone in the room is notified

import Room from '../models/Room.js';

const saveTimers = new Map(); //roomid->pending timer

//save the latest code to db
const persistRoomCode = async (roomId, code, language) => {
  try {
    // findOneAndUpdate with timestamps: true auto-updates updatedAt
    await Room.findOneAndUpdate(
      { roomId },
      { code, language },
      { upsert: true, // if no matching, create one
         new: true } //return the updated doc rather than the previous one
    ); //other fields remain same
    console.log(`[DB Persisted] Room ${roomId} autosaved at ${new Date().toISOString()}`);
  } catch (err) {
    console.error(`[DB Error] Autosave failed for ${roomId}:`, err);
  }
};

//registers editor's Socket.IO event handlers
export const registerEditorHandlers = (io, socket) => { //io is the server instance and the socket is the connection belonging to one particular client
    //whenever client connects, these handlers...like in iane socket setup...io.on(connection,...registereditrohandlers)

  // event1-> Join Room & Fetch Complete State.....on frontent....socket.emit('room:join',{roomid,username,title})
  socket.on('room:join', async ({ roomId, username, title }) => {
    socket.join(roomId);

    // Find or create the room with metadata
    let room = await Room.findOne({ roomId });
    if (!room) {
      room = await Room.create({
        roomId,
        title: title || 'Untitled Doubt Session',
        createdBy: username || 'Anonymous Mentor',
      });
    }

    // Send complete session state to the joining client..not to everyone
    socket.emit('room:initial-state', {
      roomId: room.roomId,
      title: room.title,
      createdBy: room.createdBy,
      recordingUrl: room.recordingUrl,
      updatedAt: room.updatedAt,
      language: room.language,
      code: room.code,
    });

    // Notify peers in the room
    socket.to(roomId).emit('room:user-joined', {
      userId: socket.id,
      username: username || 'Anonymous Peer',
    });
  });

  // event2-> Real-Time Code Sync with Debounce
  socket.on('editor:code-change', ({ roomId, code, language }) => {
    socket.to(roomId).emit('editor:code-update', { code }); //isko chodke sabko

    if (saveTimers.has(roomId)) {
      clearTimeout(saveTimers.get(roomId));
    }

    const timer = setTimeout(() => {
      persistRoomCode(roomId, code, language);
      saveTimers.delete(roomId);
    }, 3000);

    saveTimers.set(roomId, timer); //so that next code-hange event can cancel it
  });

  // 3. Room Title Rename Sync
  socket.on('room:update-title', async ({ roomId, title }) => {
    socket.to(roomId).emit('room:title-updated', { title });
    await Room.updateOne({ roomId }, { title });
  });

//   // 4. Session Recording Complete Event
//   socket.on('room:recording-uploaded', async ({ roomId, recordingUrl }) => {
//     await Room.updateOne({ roomId }, { recordingUrl });
//     io.to(roomId).emit('room:recording-available', { recordingUrl });
//   });
};