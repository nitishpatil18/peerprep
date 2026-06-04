import api from "./client.js";

export async function submitFeedback(sessionId, payload) {
  const { data } = await api.post(`/api/sessions/${sessionId}/feedback`, payload);
  return data.feedback;
}

export async function getMyFeedback(sessionId) {
  const { data } = await api.get(`/api/sessions/${sessionId}/feedback/me`);
  return data.feedback;
}
