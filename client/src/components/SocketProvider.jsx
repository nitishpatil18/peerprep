import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket, disconnectSocket } from "../socket.js";
import { useAuthStore } from "../store/authStore.js";
import { useMatchStore } from "../store/matchStore.js";

export default function SocketProvider({ children }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();

  useEffect(() => {
    if (!token || !user) return;
    const socket = connectSocket(token);

    function onProposal(p) {
      useMatchStore.getState().setProposal(p);
    }
    function onPeerAccepted() {
      useMatchStore.setState({
        proposal: { ...useMatchStore.getState().proposal, peerAccepted: true },
      });
    }
    function onConfirmed(p) {
      useMatchStore.getState().clearProposal();
      useMatchStore.getState().setLastSessionId(p.sessionId);
      useMatchStore.setState({ queueState: null });
      nav(`/session/${p.sessionId}`);
    }
    function onCancelled(p) {
      useMatchStore.getState().clearProposal();
      useMatchStore.setState({
        error: `match cancelled: ${p.reason}`,
        queueState: null,
      });
      setTimeout(() => useMatchStore.setState({ error: null }), 4000);
    }

    socket.on("match:proposal", onProposal);
    socket.on("match:peer-accepted", onPeerAccepted);
    socket.on("match:confirmed", onConfirmed);
    socket.on("match:cancelled", onCancelled);

    return () => {
      socket.off("match:proposal", onProposal);
      socket.off("match:peer-accepted", onPeerAccepted);
      socket.off("match:confirmed", onConfirmed);
      socket.off("match:cancelled", onCancelled);
    };
  }, [token, user, nav]);

  useEffect(() => {
    if (!token) disconnectSocket();
  }, [token]);

  return children;
}
