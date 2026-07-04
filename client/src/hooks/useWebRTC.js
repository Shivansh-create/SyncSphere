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
  const [remoteStreams, setRemoteStreams] = useState({});
  const peersRef = useRef({}); // Store RTCPeerConnections mapped by userId

  useEffect(() => {
    if (!socket || !roomId) return;

    // 1. Get Local Media Stream
    const initLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        return stream;
      } catch (err) {
        console.error('Failed to get local media', err);
        return null;
      }
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

    // When a new user joins, we (the existing user) create an offer and send it to them.
    socket.on('user_joined', async (data) => {
      const { userId } = data;
      const stream = localStream || await initLocalMedia();
      
      const peer = createPeer(userId, stream);
      peersRef.current[userId] = peer;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit('offer', {
        roomId,
        sdp: offer,
        targetId: userId,
      });
    });

    // Handle incoming offer
    socket.on('offer', async (data) => {
      const { sdp, senderId } = data;
      const stream = localStream || await initLocalMedia();

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
    });

    // Handle incoming answer
    socket.on('answer', async (data) => {
      const { sdp, senderId } = data;
      const peer = peersRef.current[senderId];
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    });

    // Handle incoming ICE candidate
    socket.on('ice_candidate', async (data) => {
      const { candidate, senderId } = data;
      const peer = peersRef.current[senderId];
      if (peer) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Cleanup
    return () => {
      socket.off('user_joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice_candidate');
      // localStream?.getTracks().forEach(track => track.stop());
    };
  }, [socket, roomId, localStream]);

  // Expose methods to start media manually if not auto-started
  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
    } catch (err) {
      console.error('Error starting media', err);
    }
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
