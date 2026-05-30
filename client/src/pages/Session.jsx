import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import VideoTile from "../components/VideoTile.jsx";
import CallControls from "../components/CallControls.jsx";
import { useWebRTC } from "../hooks/useWebRTC.js";
import { fetchSession } from "../api/sessions.js";

export default function Session() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [loadErr, setLoadErr] = useState(null);

  useEffect(() => {
    fetchSession(sessionId)
      .then(setSession)
      .catch((e) => setLoadErr(e.response?.data?.error || "failed to load session"));
  }, [sessionId]);

  const {
    localStream,
    remoteStream,
    connectionState,
    error: rtcError,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useWebRTC({ sessionId, enabled: !!session });

  const me = session?.participants.find((p) => p.isMe);
  const peer = session?.participants.find((p) => !p.isMe);

  function handleEnd() {
    endCall();
    nav("/");
  }

  if (loadErr) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-red-400">{loadErr}</p>
          <Link to="/" className="inline-block mt-4 text-sm text-zinc-300 underline">
            back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        loading session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">mock interview session</h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">{sessionId}</p>
          </div>
          <div className="text-xs text-zinc-400">
            status: <span className="text-zinc-200">{connectionState}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <VideoTile
            stream={localStream}
            label={`you${me?.name ? ` (${me.name})` : ""}`}
            muted
            mirror
          />
          <VideoTile
            stream={remoteStream}
            label={peer?.name || "peer"}
          />
        </div>

        {rtcError && (
          <p className="text-sm text-red-400 mb-3 text-center">{rtcError}</p>
        )}

        <CallControls
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onEndCall={handleEnd}
        />

        <div className="mt-8 p-5 border border-dashed border-zinc-700 rounded text-center text-sm text-zinc-500">
          collaborative code editor coming in phase 4b.
        </div>
      </div>
    </div>
  );
}
