import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("auth required"));
    try {
      const payload = verifyToken(token);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error("invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    console.log(`socket connected: user=${socket.userId} sid=${socket.id}`);

    socket.on("disconnect", (reason) => {
      console.log(`socket disconnected: user=${socket.userId} reason=${reason}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("socket.io not initialized");
  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}
