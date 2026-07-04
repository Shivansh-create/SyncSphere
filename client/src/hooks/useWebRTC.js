import { useEffect, useRef, useState } from 'react';
import { useRoomStore } from '../store/useRoomStore';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = () => {
  const { socket, roomId } = useRoomStore();
  const [localStream, setLocalStream] = useState(null);
  const streamRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peersRef = useRef({}); // Store RTCPeerConnections mapped by userId
  const mediaPromiseRef = useRef(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    // 1. Get Local Media Stream safely (prevent concurrent calls)
    const initLocalMedia = async () => {
      if (streamRef.current) return streamRef.current;
      if (mediaPromiseRef.current) return await mediaPromiseRef.current;

      mediaPromiseRef.current = new Promise(async (resolve) => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          setLocalStream(stream);
          resolve(stream);
        } catch (err) {
          console.error('Failed to get local media', err);
          resolve(null);
        }
      });

      return await mediaPromiseRef.current;
    };

    const createPeer = (userId, stream) => {
      const peer = new RTCPeerConnection(STUN_SERVERS);

      // Add local tracks to peer
      if (stream) {
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      }

      // Handle remote tracks
      peer.ontrack = (event) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [userId]: event.streams[0],
        }));
      };

      // Handle ICE candidates
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', {
            roomId,
            candidate: event.candidate,
            targetId: userId,
          });
        }
      };

      return peer;
    };

    // When a new user signals they are fully mounted and ready to receive offers
    const handleUserWebrtcReady = async (data) => {
      const { userId } = data;
      const stream = streamRef.current || await initLocalMedia();
      
      const peer = createPeer(userId, stream);
      peersRef.current[userId] = peer;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit('offer', {
        roomId,
        sdp: offer,
        targetId: userId,
      });
    };
    socket.on('user_webrtc_ready', handleUserWebrtcReady);

    // Handle incoming offer
    const handleOffer = async (data) => {
      const { sdp, senderId } = data;
      const stream = streamRef.current || await initLocalMedia();

      const peer = createPeer(senderId, stream);
      peersRef.current[senderId] = peer;

      await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('answer', {
        roomId,
        sdp: answer,
        targetId: senderId,
      });
    };
    socket.on('offer', handleOffer);

    // Handle incoming answer
    const handleAnswer = async (data) => {
      const { sdp, senderId } = data;
      const peer = peersRef.current[senderId];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };
    socket.on('answer', handleAnswer);

    // Handle incoming ICE candidate
    const handleIceCandidate = async (data) => {
      const { candidate, senderId } = data;
      const peer = peersRef.current[senderId];
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };
    socket.on('ice_candidate', handleIceCandidate);

    // Handle user leaving (to remove ghost streams)
    const handleUserLeft = (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setRemoteStreams((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };
    socket.on('user_left', handleUserLeft);

    // Cleanup
    return () => {
      socket.off('user_webrtc_ready', handleUserWebrtcReady);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('user_left', handleUserLeft);
    };
  }, [socket, roomId, localStream]);

  // Signal to existing users that we are ready to receive offers
  useEffect(() => {
    if (socket && roomId) {
      socket.emit('webrtc_ready', { roomId });
    }
  }, [socket, roomId]);

  // Expose methods to start media manually if not auto-started
  const startLocalMedia = async () => {
    if (streamRef.current) return;
    if (mediaPromiseRef.current) return await mediaPromiseRef.current;

    mediaPromiseRef.current = new Promise(async (resolve) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setLocalStream(stream);
        resolve(stream);
      } catch (err) {
        console.error('Error starting media', err);
        resolve(null);
      }
    });
    
    return await mediaPromiseRef.current;
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track for all peers
      Object.values(peersRef.current).forEach(peer => {
        const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });
      
      // Update local stream to show screen
      const newStream = new MediaStream([screenTrack, localStream.getAudioTracks()[0]]);
      setLocalStream(newStream);

      screenTrack.onended = () => {
        // Stop screen sharing and revert back to camera
        startLocalMedia();
      };
    } catch (err) {
      console.error('Error sharing screen', err);
      alert('Screen sharing failed. Please ensure you are on a desktop browser (tablets and mobile devices do not natively support screen sharing).');
    }
  };

  return { localStream, remoteStreams, startLocalMedia, toggleAudio, toggleVideo, startScreenShare };
};
