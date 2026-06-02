import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import VideoTile from "../components/VideoTile.jsx";
import CallControls from "../components/CallControls.jsx";
import CollabEditor from "../components/CollabEditor.jsx";
import CollabWhiteboard from "../components/CollabWhiteboard.jsx";
import SessionTabs from "../components/SessionTabs.jsx";
import SessionTimer from "../components/SessionTimer.jsx";
import EndSessionButton from "../components/EndSessionButton.jsx";
import QuestionPanel from "../components/QuestionPanel.jsx";
import QuestionPicker from "../components/QuestionPicker.jsx";
import { Container, Badge } from "../components/ui";
import { useWebRTC } from "../hooks/useWebRTC.js";
import { useVoiceActivity } from "../hooks/useVoiceActivity.js";
import { fetchSession, endSession } from "../api/sessions.js";
import { getSocket } from "../socket.js";

export default function Session() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [loadErr, setLoadErr] = useState(null);
  const [peerStatus, setPeerStatus] = useState("present");
  const [ending, setEnding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [questionSlug, setQuestionSlug] = useState(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [activeTab, setActiveTab] = useState("code");

  const setQuestionFnRef = useRef(null);
  const setTabFnRef = useRef(null);

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
    function onPeerLeft() { setPeerStatus("left"); }
    function onPeerJoined() { setPeerStatus("present"); }

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
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    peerIsSharing,
  } = useWebRTC({ sessionId, enabled: !!session && !ending });

  const localSpeaking = useVoiceActivity(localStream);
  const remoteSpeaking = useVoiceActivity(remoteStream);

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

  const handleQuestionSlugChange = useCallback((slug) => {
    setQuestionSlug(slug);
  }, []);

  const handlePickQuestionExpose = useCallback((fn) => {
    setQuestionFnRef.current = fn;
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleSetTabExpose = useCallback((fn) => {
    setTabFnRef.current = fn;
  }, []);

  function handleTabClick(tab) {
    setActiveTab(tab);
    if (setTabFnRef.current) {
      setTabFnRef.current(tab);
    }
  }

  function handlePick(slug) {
    setPickerOpen(false);
    if (setQuestionFnRef.current) {
      setQuestionFnRef.current({ slug });
    }
  }

  function handleToggleAudioWrapped() {
    const enabled = toggleAudio();
    setAudioMuted(!enabled);
    return enabled;
  }
  function handleToggleVideoWrapped() {
    const enabled = toggleVideo();
    setVideoOff(!enabled);
    return enabled;
  }

  async function handleToggleScreenShare() {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }

  if (loadErr) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <Container size="md" className="py-16 text-center">
          <p className="text-red-400">{loadErr}</p>
          <Link to="/home" className="inline-flex items-center gap-1.5 mt-4 text-sm text-zinc-300 underline">
            <ArrowLeft className="h-3.5 w-3.5" /> back to home
          </Link>
        </Container>
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

  const connectionTone =
    connectionState === "connected" ? "success" :
    connectionState === "failed" ? "danger" : "info";

  const someoneSharing = isScreenSharing || peerIsSharing;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <Container size="xl" className="py-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              mock interview with {peer?.name || "peer"}
            </h1>
            <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <SessionTimer startedAt={session.startedAt || session.createdAt} />
              <span>·</span>
              <Badge tone={connectionTone}>{connectionState}</Badge>
              {peerStatus === "left" && <Badge tone="warning">peer left</Badge>}
              {peerIsSharing && <Badge tone="brand">peer sharing screen</Badge>}
              {isScreenSharing && <Badge tone="brand">you are sharing</Badge>}
            </div>
          </div>
          <EndSessionButton onConfirm={handleEnd} disabled={ending} />
        </div>

        {someoneSharing ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 space-y-3">
              <div className="aspect-video w-full">
                <VideoTile
                  stream={peerIsSharing ? remoteStream : localStream}
                  label={peerIsSharing ? `${peer?.name || "peer"} (screen)` : "your screen"}
                  isSharing
                  muted={isScreenSharing}
                  mirror={false}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <VideoTile
                  stream={localStream}
                  label={`you${me?.name ? ` (${me.name})` : ""}`}
                  muted
                  mirror={!isScreenSharing}
                  audioMuted={audioMuted}
                  videoOff={videoOff && !isScreenSharing}
                  speaking={localSpeaking}
                />
                <VideoTile
                  stream={remoteStream}
                  label={peer?.name || "peer"}
                  speaking={remoteSpeaking}
                />
              </div>
            </div>

            <div className="space-y-3">
              <QuestionPanel
                slug={questionSlug}
                onChange={() => setPickerOpen(true)}
              />
              {rtcError && (
                <p className="text-xs text-red-400 text-center">{rtcError}</p>
              )}
              <CallControls
                onToggleAudio={handleToggleAudioWrapped}
                onToggleVideo={handleToggleVideoWrapped}
                onEndCall={handleEnd}
                onToggleScreenShare={handleToggleScreenShare}
                isScreenSharing={isScreenSharing}
                screenShareEnabled={connectionState === "connected"}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              <QuestionPanel
                slug={questionSlug}
                onChange={() => setPickerOpen(true)}
              />
              <div className="flex items-center justify-between">
                <SessionTabs active={activeTab} onChange={handleTabClick} />
              </div>
              <div className={activeTab === "code" ? "block" : "hidden"}>
                <CollabEditor
                  sessionId={sessionId}
                  onQuestionSlugChange={handleQuestionSlugChange}
                  onPickQuestion={handlePickQuestionExpose}
                  onTabChange={handleTabChange}
                  onSetTab={handleSetTabExpose}
                />
              </div>
              <div className={activeTab === "whiteboard" ? "block" : "hidden"}>
                <CollabWhiteboard sessionId={sessionId} />
              </div>
            </div>

            <div className="space-y-3">
              <VideoTile
                stream={localStream}
                label={`you${me?.name ? ` (${me.name})` : ""}`}
                muted
                mirror
                audioMuted={audioMuted}
                videoOff={videoOff}
                speaking={localSpeaking}
              />
              <VideoTile
                stream={remoteStream}
                label={peer?.name || "peer"}
                speaking={remoteSpeaking}
              />
              {rtcError && (
                <p className="text-xs text-red-400 text-center">{rtcError}</p>
              )}
              <CallControls
                onToggleAudio={handleToggleAudioWrapped}
                onToggleVideo={handleToggleVideoWrapped}
                onEndCall={handleEnd}
                onToggleScreenShare={handleToggleScreenShare}
                isScreenSharing={isScreenSharing}
                screenShareEnabled={connectionState === "connected"}
              />
            </div>
          </div>
        )}

        {someoneSharing && (
          <div className="hidden">
            <CollabEditor
              sessionId={sessionId}
              onQuestionSlugChange={handleQuestionSlugChange}
              onPickQuestion={handlePickQuestionExpose}
              onTabChange={handleTabChange}
              onSetTab={handleSetTabExpose}
            />
          </div>
        )}
      </Container>

      <QuestionPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePick}
      />
    </div>
  );
}
