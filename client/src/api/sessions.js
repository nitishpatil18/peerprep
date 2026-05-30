import api from "./client.js";

export async function fetchSession(id) {
  const { data } = await api.get(`/api/sessions/${id}`);
  return data.session;
}

export async function endSession(id) {
  const { data } = await api.post(`/api/sessions/${id}/end`);
  return data.session;
}

export async function listSessions() {
  const { data } = await api.get(`/api/sessions`);
  return data.sessions;
}
