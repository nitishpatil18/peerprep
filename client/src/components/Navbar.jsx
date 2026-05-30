import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import Logo from "./Logo.jsx";
import { useAuthStore } from "../store/authStore.js";
import { disconnectSocket } from "../socket.js";
import { cn } from "./ui/cn.js";

const NAV_LINKS = [
  { to: "/find-peer", label: "find peer" },
  { to: "/sessions", label: "sessions" },
  { to: "/profile", label: "profile" },
];

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "text-zinc-100 bg-zinc-900"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
        )
      }
    >
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    disconnectSocket();
    logout();
    nav("/login");
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-14 flex items-center justify-between">
        <Logo />

        {user && (
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <NavItem key={l.to} to={l.to} label={l.label} />
            ))}
          </div>
        )}

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-zinc-500">{user.name}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
              >
                login
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center h-9 px-4 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                get started
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-100"
          onClick={() => setOpen((v) => !v)}
          aria-label="toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                {NAV_LINKS.map((l) => (
                  <NavItem key={l.to} to={l.to} label={l.label} onClick={() => setOpen(false)} />
                ))}
                <div className="pt-2 mt-2 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{user.name}</span>
                  <button
                    onClick={() => { handleLogout(); setOpen(false); }}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100"
                  >
                    <LogOut className="h-3.5 w-3.5" /> logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block px-2 py-2 text-sm text-zinc-300">login</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="block px-2 py-2 text-sm text-brand-400">get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
