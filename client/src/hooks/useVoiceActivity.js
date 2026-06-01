import { useEffect, useState } from "react";

const THRESHOLD = 0.05;
const SMOOTHING = 0.85;
const SPEAKING_HOLD_MS = 250;

export function useVoiceActivity(stream) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!stream) {
      setSpeaking(false);
      return;
    }
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    let ctx, analyser, source, raf, stopAt = 0;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
      source = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = SMOOTHING;
      source.connect(analyser);

      const buf = new Uint8Array(analyser.frequencyBinCount);

      function tick() {
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        const avg = sum / buf.length / 255;

        const now = performance.now();
        if (avg > THRESHOLD) {
          stopAt = now + SPEAKING_HOLD_MS;
          setSpeaking(true);
        } else if (now >= stopAt) {
          setSpeaking(false);
        }
        raf = requestAnimationFrame(tick);
      }
      tick();
    } catch (e) {
      console.warn("voice activity init failed:", e.message);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      try { source?.disconnect(); } catch {}
      try { ctx?.close(); } catch {}
    };
  }, [stream]);

  return speaking;
}
