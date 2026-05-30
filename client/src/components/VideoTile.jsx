import { useEffect, useRef } from "react";

export default function VideoTile({ stream, label, muted = false, mirror = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-zinc-900 border border-zinc-800 rounded overflow-hidden aspect-video">
      {stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${mirror ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
          {label} (no video)
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-zinc-100 text-xs rounded">
        {label}
      </div>
    </div>
  );
}
