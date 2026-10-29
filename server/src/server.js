import express from 'express';
import { createServer } from 'http'; //nodejs http server that can host express and socketio together
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv'; // loads env variables
import { connectDB } from './config/db.js';
import { registerEditorHandlers } from './sockets/editorSocket.js';
import authRoutes from './routes/authRoutes.js';
import { socketAuthMiddleware } from './middleware/socketAuth.js';


// two types of communication-http, for login and all...and socket.io for real time collaboration

dotenv.config(); //load env var
connectDB(); // connect to db

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json()); // Parses incoming JSON bodies (req.body)

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRoutes);



// Socket.IO Setup
const httpServer = createServer(app); // creating a node js http server and passing express application to it

const io = new Server(httpServer, { // io is socketio server instance
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'], //two way comm and polling provides an alternative when a WebSocket connection cannot be established
});

// Enforce JWT check during initial handshake
io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  registerEditorHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`[Server] Live on http://localhost:${PORT}`);
});


/// !!!!!!!
// app.listen automatically creates server and starts server(listen)
//
//but 
//httpserver not, so explicitely, createServer
//
// but we used here second one, bcz we want socket io also