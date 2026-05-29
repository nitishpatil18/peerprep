import { create } from "zustand";
import api from "../api/client.js";

export const useMatchStore = create((set, get) => ({
  queueState: null,
  queueSize: 0,
  proposal: null,
  loading: false,
  error: null,
  lastSessionId: null,

  async fetchState() {
    try {
      const { data } = await api.get("/api/matchmaking/state");
      set({ queueState: data.state, queueSize: data.queueSize });
    } catch (e) {
      set({ error: e.response?.data?.error || "failed to load state" });
    }
  },

  async joinQueue() {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/api/matchmaking/join");
      set({ queueState: data.state, loading: false });
    } catch (e) {
      set({ error: e.response?.data?.error || "failed to join queue", loading: false });
    }
  },

  async leaveQueue() {
    set({ loading: true, error: null });
    try {
      await api.post("/api/matchmaking/leave");
      set({ queueState: null, loading: false });
    } catch (e) {
      set({ error: e.response?.data?.error || "failed to leave queue", loading: false });
    }
  },

  async respondToProposal(proposalId, accept) {
    try {
      await api.post("/api/matchmaking/respond", { proposalId, accept });
      if (!accept) set({ proposal: null, queueState: null });
    } catch (e) {
      set({ error: e.response?.data?.error || "failed to respond" });
    }
  },

  setProposal(proposal) {
    set({ proposal });
  },

  clearProposal() {
    set({ proposal: null });
  },

  setLastSessionId(id) {
    set({ lastSessionId: id });
  },
}));
