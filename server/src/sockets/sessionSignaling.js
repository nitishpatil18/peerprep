import Session from "../models/Session.js";

const roomKey = (sessionId) => `session:${sessionId}`;

export function registerSessionHandlers(io, socket) {
  socket.on("session:join", async ({ sessionId }, ack) => {
    try {
      if (!sessionId) return ack?.({ error: "sessionId required" });
      const session = await Session.findById(sessionId).lean();
      if (!session) return ack?.({ error: "session not found" });
      const participantIds = session.participants.map((p) => p.toString());
      if (!participantIds.includes(socket.userId)) {
        return ack?.({ error: "not a participant" });
      }

      socket.join(roomKey(sessionId));
      socket.sessionId = sessionId;

      const room = io.sockets.adapter.rooms.get(roomKey(sessionId));
      const otherSocketsInRoom = [];
      if (room) {
        for (const sid of room) {
          if (sid !== socket.id) {
            const other = io.sockets.sockets.get(sid);
            if (other?.userId && other.userId !== socket.userId) {
              otherSocketsInRoom.push({ socketId: sid, userId: other.userId });
            }
          }
        }
      }

      socket.to(roomKey(sessionId)).emit("session:peer-joined", {
        peerUserId: socket.userId,
        peerSocketId: socket.id,
      });

      ack?.({ ok: true, peersInRoom: otherSocketsInRoom });
    } catch (e) {
      ack?.({ error: e.message });
    }
  });

  socket.on("session:leave", ({ sessionId }) => {
    if (!sessionId) return;
    socket.leave(roomKey(sessionId));
    socket.to(roomKey(sessionId)).emit("session:peer-left", {
      peerUserId: socket.userId,
      peerSocketId: socket.id,
    });
    socket.sessionId = null;
  });

  socket.on("rtc:signal", ({ sessionId, to, type, data }) => {
    if (!sessionId || !to || !type) return;
    if (socket.sessionId !== sessionId) return;
    io.to(to).emit("rtc:signal", {
      from: socket.id,
      fromUserId: socket.userId,
      type,
      data,
    });
  });

  socket.on("disconnecting", () => {
    if (socket.sessionId) {
      socket.to(roomKey(socket.sessionId)).emit("session:peer-left", {
        peerUserId: socket.userId,
        peerSocketId: socket.id,
      });
    }
  });
}
