import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useProfileStore } from "../store/profileStore.js";

export default function Home() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold">welcome, {user?.name}</h1>
        <p className="mt-2 text-zinc-400">
          {profile?.isComplete
            ? "your profile is complete. matchmaking comes next."
            : "complete your profile to enable matchmaking."}
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/profile"
            className="block p-5 border border-zinc-800 rounded hover:bg-zinc-900"
          >
            <div className="text-zinc-100 font-medium">profile</div>
            <div className="text-sm text-zinc-400 mt-1">
              target role, skills, topics, availability
            </div>
          </Link>
          <div className="block p-5 border border-zinc-800 rounded opacity-50">
            <div className="text-zinc-100 font-medium">find a peer</div>
            <div className="text-sm text-zinc-400 mt-1">
              coming in phase 3
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
