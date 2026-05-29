import { useEffect, useState } from "react";
import { useMatchStore } from "../store/matchStore.js";

export default function ProposalModal() {
  const { proposal, respondToProposal } = useMatchStore();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [responded, setResponded] = useState(false);

  useEffect(() => {
    if (!proposal) {
      setResponded(false);
      return;
    }
    setSecondsLeft(Math.ceil((proposal.expiresInMs || 30000) / 1000));
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [proposal]);

  if (!proposal) return null;

  async function handleAccept() {
    if (responded) return;
    setResponded(true);
    await respondToProposal(proposal.proposalId, true);
  }

  async function handleDecline() {
    if (responded) return;
    setResponded(true);
    await respondToProposal(proposal.proposalId, false);
  }

  const breakdown = proposal.breakdown || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">match found</h2>
          <span className="text-sm text-zinc-400">{secondsLeft}s</span>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          match score: <span className="text-zinc-200 font-medium">{(proposal.score * 100).toFixed(0)}%</span>
        </p>

        <div className="mt-4 space-y-1 text-xs text-zinc-500">
          <div>topics overlap: {(breakdown.topicSim * 100).toFixed(0)}%</div>
          <div>level fit: {(breakdown.levelSim * 100).toFixed(0)}%</div>
          <div>language overlap: {(breakdown.langSim * 100).toFixed(0)}%</div>
          <div>role fit: {(breakdown.roleSim * 100).toFixed(0)}%</div>
          <div>skills overlap: {(breakdown.skillSim * 100).toFixed(0)}%</div>
        </div>

        {proposal.peerAccepted && (
          <p className="mt-4 text-sm text-green-400">peer has accepted, waiting for you.</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDecline}
            disabled={responded}
            className="flex-1 py-2 rounded border border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
          >
            decline
          </button>
          <button
            onClick={handleAccept}
            disabled={responded}
            className="flex-1 py-2 rounded bg-zinc-100 text-zinc-900 font-medium disabled:opacity-40"
          >
            {responded ? "waiting..." : "accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
