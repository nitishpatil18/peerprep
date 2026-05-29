import Navbar from "../components/Navbar.jsx";
import { useAuthStore } from "../store/authStore.js";

export default function Home() {
  const { user } = useAuthStore();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold">welcome, {user?.name}</h1>
        <p className="mt-2 text-zinc-400">
          phase 1 done. profile, matchmaking, and video coming next.
        </p>
      </div>
    </div>
  );
}
