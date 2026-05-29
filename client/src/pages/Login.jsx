import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "../store/authStore.js";

export default function Login() {
  const { login, googleLogin } = useAuthStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, password);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.error || "login failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle(resp) {
    setErr("");
    try {
      await googleLogin(resp.credential);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.error || "google login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6">login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-zinc-600"
            required
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-zinc-600"
            required
          />
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded bg-zinc-100 text-zinc-900 font-medium disabled:opacity-50"
          >
            {busy ? "logging in..." : "login"}
          </button>
        </form>
        <div className="my-4 text-center text-zinc-500 text-sm">or</div>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogle}
            onError={() => setErr("google login failed")}
            theme="filled_black"
          />
        </div>
        <p className="mt-6 text-sm text-zinc-400 text-center">
          no account? <Link to="/signup" className="text-zinc-100 underline">signup</Link>
        </p>
      </div>
    </div>
  );
}
