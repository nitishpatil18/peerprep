import { useEffect, useRef } from "react";
import { Monitor, MicOff, VideoOff } from "lucide-react";

export default function VideoTile({
  stream,
  label,
  muted = false,
  mirror = false,
  isSharing = false,
  audioMuted = false,
  videoOff = false,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden aspect-video">
      {stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full ${isSharing ? "object-contain bg-black" : "object-cover"} ${mirror && !isSharing ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
          {label}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-100">{label}</span>
          <div className="flex items-center gap-1.5">
            {audioMuted && (
              <span className="h-5 w-5 rounded bg-red-500/20 border border-red-500/30 text-red-300 flex items-center justify-center">
                <MicOff className="h-3 w-3" />
              </span>
            )}
            {videoOff && (
              <span className="h-5 w-5 rounded bg-red-500/20 border border-red-500/30 text-red-300 flex items-center justify-center">
                <VideoOff className="h-3 w-3" />
              </span>
            )}
            {isSharing && (
              <span className="px-1.5 py-0.5 rounded bg-brand-500/20 border border-brand-500/30 text-brand-300 text-[10px] font-medium flex items-center gap-1">
                <Monitor className="h-2.5 w-2.5" /> sharing
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
