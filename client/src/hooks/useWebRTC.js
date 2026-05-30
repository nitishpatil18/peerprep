import { useEffect, useRef, useState, useCallback } from "react";
import { ICE_SERVERS } from "../utils/webrtcConfig.js";
import { getSocket } from "../socket.js";

export function useWebRTC({ sessionId, enabled }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("idle");
  const [peerUserId, setPeerUserId] = useState(null);
  const [error, setError] = useState(null);

  const pcRef = useRef(null);
  const peerSocketIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const remoteDescSetRef = useRef(false);
  const cleanupRef = useRef(() => {});

  const sendSignal = useCallback((type, data) => {
    const socket = getSocket();
    if (!socket || !peerSocketIdRef.current) return;
    socket.emit("rtc:signal", {
      sessionId,
      to: peerSocketIdRef.current,
      type,
      data,
    });
  }, [sessionId]);

  const getOrCreateLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const createPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal("ice", event.candidate);
    };

    pc.ontrack = (event) => {
      const [remote] = event.streams;
      setRemoteStream(remote);
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    return pc;
  }, [sendSignal]);

  const initiateOffer = useCallback(async (peerSocketId) => {
    peerSocketIdRef.current = peerSocketId;
    remoteDescSetRef.current = false;
    pendingCandidatesRef.current = [];
    try {
      const stream = await getOrCreateLocalStream();
      const pc = createPeerConnection(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal("offer", offer);
    } catch (e) {
      setError(e.message);
      setConnectionState("failed");
    }
  }, [getOrCreateLocalStream, createPeerConnection, sendSignal]);

  useEffect(() => {
    if (!enabled || !sessionId) return;
    const socket = getSocket();
    if (!socket) return;

    let cancelled = false;

    async function handlePeerJoined({ peerSocketId, peerUserId: pUserId }) {
      if (cancelled) return;
      setPeerUserId(pUserId);
      try {
        await getOrCreateLocalStream();
      } catch (e) {
        setError(e.message);
      }
      peerSocketIdRef.current = peerSocketId;
    }

    function handlePeerLeft() {
      setRemoteStream(null);
      setConnectionState("disconnected");
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      peerSocketIdRef.current = null;
      remoteDescSetRef.current = false;
    }

    async function handleSignal({ from, fromUserId, type, data }) {
      try {
        if (type === "offer") {
          peerSocketIdRef.current = from;
          setPeerUserId(fromUserId);
          const stream = await getOrCreateLocalStream();
          if (!pcRef.current) createPeerConnection(stream);
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
          remoteDescSetRef.current = true;
          for (const c of pendingCandidatesRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidatesRef.current = [];
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          sendSignal("answer", answer);
        } else if (type === "answer") {
          if (pcRef.current && pcRef.current.signalingState === "have-local-offer") {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
            remoteDescSetRef.current = true;
            for (const c of pendingCandidatesRef.current) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidatesRef.current = [];
          }
        } else if (type === "ice") {
          if (pcRef.current && remoteDescSetRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data));
          } else {
            pendingCandidatesRef.current.push(data);
          }
        }
      } catch (e) {
        setError(`signaling: ${e.message}`);
      }
    }

    socket.on("session:peer-joined", handlePeerJoined);
    socket.on("session:peer-left", handlePeerLeft);
    socket.on("rtc:signal", handleSignal);

    socket.emit("session:join", { sessionId }, async (resp) => {
      if (cancelled) return;
      if (resp?.error) {
        setError(resp.error);
        return;
      }
      try {
        await getOrCreateLocalStream();
      } catch (e) {
        setError(e.message);
      }
      if (resp.peersInRoom?.length > 0) {
        setConnectionState("connecting");
        const peer = resp.peersInRoom[0];
        setPeerUserId(peer.userId);
        await initiateOffer(peer.socketId);
      } else {
        setConnectionState("waiting-for-peer");
      }
    });

    cleanupRef.current = () => {
      cancelled = true;
      socket.off("session:peer-joined", handlePeerJoined);
      socket.off("session:peer-left", handlePeerLeft);
      socket.off("rtc:signal", handleSignal);
      socket.emit("session:leave", { sessionId });
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      peerSocketIdRef.current = null;
    };

    return () => cleanupRef.current();
  }, [enabled, sessionId, getOrCreateLocalStream, createPeerConnection, initiateOffer, sendSignal]);

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const track = stream.getAudioTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return track.enabled;
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const track = stream.getVideoTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return track.enabled;
  }, []);

  const endCall = useCallback(() => {
    cleanupRef.current();
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("ended");
  }, []);

  return {
    localStream,
    remoteStream,
    connectionState,
    peerUserId,
    error,
    toggleAudio,
    toggleVideo,
    endCall,
  };
}
