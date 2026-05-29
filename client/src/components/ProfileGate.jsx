import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useProfileStore } from "../store/profileStore.js";

export default function ProfileGate({ children }) {
  const { profile, loading, fetchProfile } = useProfileStore();
  const location = useLocation();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, [profile, fetchProfile]);

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        loading profile...
      </div>
    );
  }
  if (profile && !profile.isComplete && location.pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }
  return children;
}
