// per-process snapshot of latest yjs doc content for each session.
// the vendored setupWSConnection updates this whenever an update arrives.

const snapshots = new Map();

export function recordSnapshot(sessionId, payload) {
  snapshots.set(sessionId, { ...payload, updatedAt: Date.now() });
}

export function getSnapshot(sessionId) {
  return snapshots.get(sessionId) || null;
}

export function clearSnapshot(sessionId) {
  snapshots.delete(sessionId);
}
