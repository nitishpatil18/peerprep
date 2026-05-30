import { WebSocketServer } from "ws";
import { setupWSConnection } from "./yjs-vendor/setupWSConnection.js";
import { verifyToken } from "../utils/jwt.js";
import Session from "../models/Session.js";
import url from "url";

export function attachYWebsocket(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, req, sessionId) => {
    setupWSConnection(ws, req, { docName: `session:${sessionId}` });
  });

  httpServer.on("upgrade", async (req, socket, head) => {
    const parsed = url.parse(req.url, true);
    if (!parsed.pathname?.startsWith("/yjs/")) return;

    const sessionId = parsed.pathname.replace("/yjs/", "");
    const token = parsed.query.token;

    if (!sessionId || !token) {
      socket.destroy();
      return;
    }

    try {
      const payload = verifyToken(token);
      const userId = payload.sub;

      const session = await Session.findById(sessionId).lean();
      if (!session) {
        socket.destroy();
        return;
      }
      const participantIds = session.participants.map((p) => p.toString());
      if (!participantIds.includes(userId)) {
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req, sessionId);
      });
    } catch (e) {
      console.error("yjs upgrade auth failed:", e.message);
      socket.destroy();
    }
  });

  console.log("y-websocket mounted at /yjs/:sessionId");
}
