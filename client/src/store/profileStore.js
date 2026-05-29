import { create } from "zustand";
import api from "../api/client.js";

export const useProfileStore = create((set) => ({
  profile: null,
  loading: false,
  error: null,

  async fetchProfile() {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get("/api/profile/me");
      set({ profile: data.profile, loading: false });
    } catch (e) {
      set({ error: e.response?.data?.error || "failed to load profile", loading: false });
    }
  },

  async updateProfile(patch) {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put("/api/profile/me", patch);
      set({ profile: data.profile, loading: false });
      return data.profile;
    } catch (e) {
      set({ error: e.response?.data?.error || "failed to update profile", loading: false });
      throw e;
    }
  },
}));
