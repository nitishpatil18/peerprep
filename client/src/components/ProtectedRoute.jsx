import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
