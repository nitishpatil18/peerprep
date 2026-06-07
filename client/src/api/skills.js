import api from "./client.js";

export async function getMySkillRatings() {
  const { data } = await api.get("/api/skills/me");
  return data.ratings;
}
