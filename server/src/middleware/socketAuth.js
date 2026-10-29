// Currently, any random client could connect to your WebSocket server. We need to implement handshake authentication: when a client tries to open a WebSocket connection, they must send their JWT. The server checks the token; if it's invalid or missing, it rejects the connection before the socket is established.

import jwt from 'jsonwebtoken';

export const socketAuthMiddleware = (socket, next) => {
  // Grab the token passed in socket handshake auth object
  const token = socket.handshake.auth?.token;

  if (!token) {
    // Aborts connection during handshake
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_codemate_jwt_key_12345'
    );
    
    // Attach decoded user data { id, role } to the socket instance
    socket.data.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
};