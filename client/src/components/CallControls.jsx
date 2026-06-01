import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff } from "lucide-react";
import { cn } from "./ui/cn.js";

function ControlButton({ active, onClick, icon: Icon, label, tone = "default", className }) {
  const tones = {
    default: active
      ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
      : "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30",
    brand: active
      ? "bg-brand-500/20 border border-brand-500/30 text-brand-300 hover:bg-brand-500/30"
      : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center transition-colors focus-ring",
        tones[tone],
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export default function CallControls({
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onToggleScreenShare,
  isScreenSharing = false,
  screenShareEnabled = true,
}) {
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
    <div className="flex items-center justify-center gap-2 p-2 rounded-full bg-zinc-900 border border-zinc-800 w-fit mx-auto">
      <ControlButton
        active={audioOn}
        onClick={handleAudio}
        icon={audioOn ? Mic : MicOff}
        label={audioOn ? "mute" : "unmute"}
      />
      <ControlButton
        active={videoOn}
        onClick={handleVideo}
        icon={videoOn ? Video : VideoOff}
        label={videoOn ? "camera off" : "camera on"}
      />
      {onToggleScreenShare && (
        <ControlButton
          tone="brand"
          active={isScreenSharing}
          onClick={onToggleScreenShare}
          icon={isScreenSharing ? MonitorOff : Monitor}
          label={isScreenSharing ? "stop sharing" : "share screen"}
          className={!screenShareEnabled ? "opacity-50 cursor-not-allowed" : ""}
        />
      )}
      <ControlButton
        tone="danger"
        onClick={onEndCall}
        icon={PhoneOff}
        label="end call"
      />
    </div>
  );
}
