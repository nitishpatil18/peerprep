// vendored from y-websocket-server (MIT). adapted for our auth flow + snapshot hook.
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync.js";
import * as awarenessProtocol from "y-protocols/awareness.js";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as map from "lib0/map";
import { recordSnapshot, clearSnapshot } from "../../services/sessionDocStore.js";

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const pingTimeout = 30000;
const messageSync = 0;
const messageAwareness = 1;

const docs = new Map();

function extractSessionId(docName) {
  return docName.startsWith("session:") ? docName.slice("session:".length) : null;
}

class WSSharedDoc extends Y.Doc {
  constructor(name) {
    super({ gc: true });
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    const awarenessChangeHandler = ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed);
      if (conn !== null) {
        const connControlledIDs = this.conns.get(conn);
        if (connControlledIDs !== undefined) {
          added.forEach((clientID) => connControlledIDs.add(clientID));
          removed.forEach((clientID) => connControlledIDs.delete(clientID));
        }
      }
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );
      const buff = encoding.toUint8Array(encoder);
      this.conns.forEach((_, c) => send(this, c, buff));
    };
    this.awareness.on("update", awarenessChangeHandler);
    this.on("update", updateHandler);
  }

  snapshot() {
    const code = this.getText("code").toString();
    const meta = this.getMap("meta").toJSON();
    return {
      code,
      language: meta.language || "python",
      questionSlug: meta.questionSlug || null,
    };
  }
}

function updateHandler(update, origin, doc) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  const message = encoding.toUint8Array(encoder);
  doc.conns.forEach((_, conn) => send(doc, conn, message));

  const sessionId = extractSessionId(doc.name);
  if (sessionId) recordSnapshot(sessionId, doc.snapshot());
}

function getYDoc(docname) {
  return map.setIfUndefined(docs, docname, () => {
    const doc = new WSSharedDoc(docname);
    docs.set(docname, doc);
    return doc;
  });
}

function messageListener(conn, doc, message) {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);
        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness:
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
    }
  } catch (err) {
    console.error("yjs message error:", err);
    doc.emit("error", [err]);
  }
}

function closeConn(doc, conn) {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);
    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );
    if (doc.conns.size === 0) {
      const sessionId = extractSessionId(doc.name);
      if (sessionId) recordSnapshot(sessionId, doc.snapshot());
      docs.delete(doc.name);
      doc.destroy();
    }
  }
  conn.close();
}

function send(doc, conn, m) {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn);
    return;
  }
  try {
    conn.send(m, (err) => {
      if (err) closeConn(doc, conn);
    });
  } catch (e) {
    closeConn(doc, conn);
  }
}

export function setupWSConnection(conn, req, { docName }) {
  conn.binaryType = "arraybuffer";
  const doc = getYDoc(docName);
  doc.conns.set(conn, new Set());

  conn.on("message", (message) => {
    messageListener(conn, doc, new Uint8Array(message));
  });

  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) closeConn(doc, conn);
      clearInterval(pingInterval);
      return;
    }
    if (doc.conns.has(conn)) {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        closeConn(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, pingTimeout);

  conn.on("close", () => {
    closeConn(doc, conn);
    clearInterval(pingInterval);
  });
  conn.on("pong", () => {
    pongReceived = true;
  });

  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    send(doc, conn, encoding.toUint8Array(encoder));
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const e2 = encoding.createEncoder();
      encoding.writeVarUint(e2, messageAwareness);
      encoding.writeVarUint8Array(
        e2,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      send(doc, conn, encoding.toUint8Array(e2));
    }
  }
}

export function getInMemoryDoc(sessionId) {
  return docs.get(`session:${sessionId}`) || null;
}

export function dropInMemoryDoc(sessionId) {
  const doc = docs.get(`session:${sessionId}`);
  if (doc) {
    for (const conn of doc.conns.keys()) {
      try { conn.close(); } catch {}
    }
    docs.delete(`session:${sessionId}`);
    doc.destroy();
  }
  clearSnapshot(sessionId);
}
