import api from "./client.js";

export async function fetchSession(id) {
  const { data } = await api.get(`/api/sessions/${id}`);
  return data.session;
}
