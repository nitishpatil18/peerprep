import api from "./client.js";

export async function listQuestions(params = {}) {
  const { data } = await api.get("/api/questions", { params });
  return data.questions;
}

export async function fetchQuestion(slug) {
  const { data } = await api.get(`/api/questions/${slug}`);
  return data.question;
}

export async function fetchTopics() {
  const { data } = await api.get("/api/questions/topics");
  return data.topics;
}
