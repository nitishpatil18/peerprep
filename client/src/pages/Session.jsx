import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function Session() {
  const { sessionId } = useParams();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold">session room</h1>
        <p className="mt-2 text-zinc-400">session id: <span className="font-mono text-zinc-300">{sessionId}</span></p>

        <div className="mt-8 p-6 border border-dashed border-zinc-700 rounded text-center">
          <p className="text-zinc-300 font-medium">phase 4 will live here</p>
          <p className="text-sm text-zinc-500 mt-2">webrtc video call + collaborative code editor coming next.</p>
        </div>

        <Link to="/" className="inline-block mt-6 text-sm text-zinc-400 underline hover:text-zinc-200">
          ← back to home
        </Link>
      </div>
    </div>
  );
}
