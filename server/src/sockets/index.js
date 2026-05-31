import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { registerSessionHandlers } from "./sessionSignaling.js";

let io = null;

export function initSocket(httpServer) {
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
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
    if (process.env.NODE_ENV !== "production") {
      console.log(`socket connected: user=${socket.userId} sid=${socket.id}`);
    }

    registerSessionHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`socket disconnected: user=${socket.userId} reason=${reason}`);
      }
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
