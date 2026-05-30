import { useState } from "react";

export default function EndSessionButton({ onConfirm, disabled }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <button disabled className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 text-sm">
        ending...
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded text-sm font-medium ${
        confirming
          ? "bg-red-500 text-white hover:bg-red-600"
          : "border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
      } disabled:opacity-40`}
    >
      {confirming ? "click again to end" : "end session"}
    </button>
  );
}
