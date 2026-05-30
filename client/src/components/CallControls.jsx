import { useState } from "react";

export default function CallControls({ onToggleAudio, onToggleVideo, onEndCall }) {
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  function handleAudio() {
    const enabled = onToggleAudio();
    setAudioOn(enabled);
  }

  function handleVideo() {
    const enabled = onToggleVideo();
    setVideoOn(enabled);
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={handleAudio}
        className={`px-4 py-2 rounded text-sm font-medium ${
          audioOn ? "bg-zinc-800 text-zinc-100" : "bg-red-500/20 text-red-300 border border-red-500/40"
        }`}
      >
        {audioOn ? "mute" : "unmute"}
      </button>
      <button
        onClick={handleVideo}
        className={`px-4 py-2 rounded text-sm font-medium ${
          videoOn ? "bg-zinc-800 text-zinc-100" : "bg-red-500/20 text-red-300 border border-red-500/40"
        }`}
      >
        {videoOn ? "camera off" : "camera on"}
      </button>
      <button
        onClick={onEndCall}
        className="px-4 py-2 rounded bg-red-500 text-white text-sm font-medium hover:bg-red-600"
      >
        end call
      </button>
    </div>
  );
}
