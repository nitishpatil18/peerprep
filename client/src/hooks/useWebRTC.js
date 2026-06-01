import { useEffect, useRef, useState, useCallback } from "react";
import { ICE_SERVERS } from "../utils/webrtcConfig.js";
import { getSocket } from "../socket.js";

export function useWebRTC({ sessionId, enabled }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("idle");
  const [peerUserId, setPeerUserId] = useState(null);
  const [error, setError] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peerIsSharing, setPeerIsSharing] = useState(false);

  const pcRef = useRef(null);
  const peerSocketIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const screenStreamRef = useRef(null);
  const videoSenderRef = useRef(null);
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
    cameraTrackRef.current = stream.getVideoTracks()[0];
    setLocalStream(stream);
    return stream;
  }, []);

  const createPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => {
      const sender = pc.addTrack(track, stream);
      if (track.kind === "video") videoSenderRef.current = sender;
    });

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
      try { await getOrCreateLocalStream(); } catch (e) { setError(e.message); }
      peerSocketIdRef.current = peerSocketId;
    }

    function handlePeerLeft() {
      setRemoteStream(null);
      setConnectionState("disconnected");
      setPeerIsSharing(false);
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

    function handleScreenShare({ sharing }) {
      setPeerIsSharing(!!sharing);
    }

    socket.on("session:peer-joined", handlePeerJoined);
    socket.on("session:peer-left", handlePeerLeft);
    socket.on("rtc:signal", handleSignal);
    socket.on("session:screen-share", handleScreenShare);

    socket.emit("session:join", { sessionId }, async (resp) => {
      if (cancelled) return;
      if (resp?.error) {
        setError(resp.error);
        return;
      }
      try { await getOrCreateLocalStream(); } catch (e) { setError(e.message); }
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
      socket.off("session:screen-share", handleScreenShare);
      socket.emit("session:leave", { sessionId });
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        cameraTrackRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
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

  const startScreenShare = useCallback(async () => {
    if (isScreenSharing) return;
    const sender = videoSenderRef.current;
    if (!sender) {
      setError("not connected yet");
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      await sender.replaceTrack(screenTrack);

      // also update local preview
      const localStream = localStreamRef.current;
      if (localStream) {
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(screenTrack);
        setLocalStream(new MediaStream(localStream.getTracks()));
      }

      setIsScreenSharing(true);
      getSocket()?.emit("session:screen-share", { sessionId, sharing: true });

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (e) {
      if (e.name !== "NotAllowedError") {
        setError(`screen share: ${e.message}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScreenSharing, sessionId]);

  const stopScreenShare = useCallback(async () => {
    const sender = videoSenderRef.current;
    if (!sender) return;
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }

      const cameraTrack = cameraTrackRef.current;
      if (cameraTrack) {
        await sender.replaceTrack(cameraTrack);

        const localStream = localStreamRef.current;
        if (localStream) {
          const oldVideoTrack = localStream.getVideoTracks()[0];
          if (oldVideoTrack && oldVideoTrack !== cameraTrack) {
            localStream.removeTrack(oldVideoTrack);
          }
          if (!localStream.getVideoTracks().includes(cameraTrack)) {
            localStream.addTrack(cameraTrack);
          }
          setLocalStream(new MediaStream(localStream.getTracks()));
        }
      }

      setIsScreenSharing(false);
      getSocket()?.emit("session:screen-share", { sessionId, sharing: false });
    } catch (e) {
      setError(`stop screen share: ${e.message}`);
    }
  }, [sessionId]);

  const endCall = useCallback(() => {
    cleanupRef.current();
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("ended");
    setIsScreenSharing(false);
    setPeerIsSharing(false);
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
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    peerIsSharing,
  };
}
