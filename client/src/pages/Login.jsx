import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, AlertCircle } from "lucide-react";
import Logo from "../components/Logo.jsx";
import { Button, Input, Spinner } from "../components/ui";
import { useAuthStore } from "../store/authStore.js";
import AuthBrandPanel from "../components/AuthBrandPanel.jsx";

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
      nav("/home");
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
      nav("/home");
    } catch (e) {
      setErr(e.response?.data?.error || "google login failed");
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-zinc-950 text-zinc-100">
      <div className="flex flex-col px-6 md:px-10 py-8">
        <Logo to="/" />

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm py-12">
            <h1 className="text-2xl font-semibold tracking-tight">welcome back</h1>
            <p className="mt-1 text-sm text-zinc-400">login to your peerprep account</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {err && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{err}</span>
                </div>
              )}

              <Button type="submit" disabled={busy} className="w-full">
                {busy ? (
                  <>
                    <Spinner size="sm" /> logging in...
                  </>
                ) : (
                  <>
                    login <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex-1 h-px bg-zinc-800" />
              <span>or</span>
              <span className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogle}
                onError={() => setErr("google login failed")}
                theme="filled_black"
                shape="rectangular"
                size="large"
                width="320"
              />
            </div>

            <p className="mt-8 text-sm text-zinc-400 text-center">
              no account?{" "}
              <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">
                signup
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-500">peerprep · built for engineers</p>
      </div>

      <AuthBrandPanel />
    </div>
  );
}
