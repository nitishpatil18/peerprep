import { create } from "zustand";
import api from "../api/client.js";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: true,

  async hydrate() {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const { data } = await api.get("/api/auth/me");
      set({ user: data.user, token, loading: false });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null, loading: false });
    }
  },

  async signup(name, email, password) {
    const { data } = await api.post("/api/auth/signup", { name, email, password });
    localStorage.setItem("token", data.token);
    set({ user: data.user, token: data.token });
  },

  async login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    set({ user: data.user, token: data.token });
  },

  async googleLogin(credential) {
    const { data } = await api.post("/api/auth/google", { credential });
    localStorage.setItem("token", data.token);
    set({ user: data.user, token: data.token });
  },

  logout() {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));
