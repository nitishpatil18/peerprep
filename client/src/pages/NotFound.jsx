import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { Container, Button } from "../components/ui";
import { useAuthStore } from "../store/authStore.js";

export default function NotFound() {
  const { user } = useAuthStore();
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <Container size="md" className="py-20 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mb-4">
          <Compass className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">page not found</h1>
        <p className="mt-2 text-zinc-400 max-w-md mx-auto">
          the page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-6">
          <Link to={user ? "/home" : "/"}>
            <Button size="lg">
              {user ? "back to dashboard" : "back to home"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}
