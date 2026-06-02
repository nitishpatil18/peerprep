import { WebSocketServer } from "ws";
import { setupWSConnection } from "./yjs-vendor/setupWSConnection.js";
import { verifyToken } from "../utils/jwt.js";
import Session from "../models/Session.js";
import url from "url";

const ALLOWED_NAMESPACES = new Set(["code", "whiteboard"]);

export function attachYWebsocket(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, req, docName) => {
    setupWSConnection(ws, req, { docName });
  });

  httpServer.on("upgrade", async (req, socket, head) => {
    const parsed = url.parse(req.url, true);
    if (!parsed.pathname?.startsWith("/yjs/")) return;

    const sessionId = parsed.pathname.replace("/yjs/", "");
    const token = parsed.query.token;
    const ns = parsed.query.ns || "code";

    if (!sessionId || !token) {
      socket.destroy();
      return;
    }
    if (!ALLOWED_NAMESPACES.has(ns)) {
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

      const docName = `session:${sessionId}:${ns}`;

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req, docName);
      });
    } catch (e) {
      console.error("yjs upgrade auth failed:", e.message);
      socket.destroy();
    }
  });

  console.log("y-websocket mounted at /yjs/:sessionId?ns=code|whiteboard");
}
