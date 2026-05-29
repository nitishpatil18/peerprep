import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();

  function handleLogout() {
    logout();
    nav("/login");
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-zinc-100 font-semibold">peerprep</Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-400">{user.name}</span>
            <button onClick={handleLogout} className="text-zinc-300 hover:text-white">
              logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
