import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import VideoTile from "../components/VideoTile.jsx";
import CallControls from "../components/CallControls.jsx";
import CollabEditor from "../components/CollabEditor.jsx";
import SessionTimer from "../components/SessionTimer.jsx";
import EndSessionButton from "../components/EndSessionButton.jsx";
import { useWebRTC } from "../hooks/useWebRTC.js";
import { fetchSession, endSession } from "../api/sessions.js";
import { getSocket } from "../socket.js";

export default function Session() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [loadErr, setLoadErr] = useState(null);
  const [peerStatus, setPeerStatus] = useState("present");
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    fetchSession(sessionId)
      .then(setSession)
      .catch((e) => setLoadErr(e.response?.data?.error || "failed to load session"));
  }, [sessionId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function onEnded({ sessionId: endedId }) {
      if (endedId !== sessionId) return;
      nav("/sessions");
    }
    function onPeerLeft() {
      setPeerStatus("left");
    }
    function onPeerJoined() {
      setPeerStatus("present");
    }

    socket.on("session:ended", onEnded);
    socket.on("session:peer-left", onPeerLeft);
    socket.on("session:peer-joined", onPeerJoined);
    return () => {
      socket.off("session:ended", onEnded);
      socket.off("session:peer-left", onPeerLeft);
      socket.off("session:peer-joined", onPeerJoined);
    };
  }, [sessionId, nav]);

  const {
    localStream,
    remoteStream,
    connectionState,
    error: rtcError,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useWebRTC({ sessionId, enabled: !!session && !ending });

  const me = session?.participants.find((p) => p.isMe);
  const peer = session?.participants.find((p) => !p.isMe);

  async function handleEnd() {
    setEnding(true);
    try {
      await endSession(sessionId);
      endCall();
      nav("/sessions");
    } catch (e) {
      setEnding(false);
      alert(e.response?.data?.error || "failed to end session");
    }
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
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-semibold">
              mock interview with {peer?.name || "peer"}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              <SessionTimer startedAt={session.startedAt || session.createdAt} />
              <span className="mx-2">·</span>
              call: <span className="text-zinc-300">{connectionState}</span>
              {peerStatus === "left" && (
                <span className="ml-2 text-amber-400">· peer left</span>
              )}
            </p>
          </div>
          <EndSessionButton onConfirm={handleEnd} disabled={ending} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <CollabEditor sessionId={sessionId} />
          </div>

          <div className="space-y-3">
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
            {rtcError && (
              <p className="text-xs text-red-400 text-center">{rtcError}</p>
            )}
            <CallControls
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onEndCall={handleEnd}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
