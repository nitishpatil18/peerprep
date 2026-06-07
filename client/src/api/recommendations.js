import api from "./client.js";

export async function getRecommendations() {
  const { data } = await api.get("/api/recommendations");
  return data;
}
