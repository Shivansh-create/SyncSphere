"use client";

import { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { useUser } from "@/lib/AuthContext";
import { Button } from "./ui/button";
import { Copy, Users } from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const socket = io(BACKEND_URL);

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const [showAd, setShowAd] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    }
  }, []);

  useEffect(() => {
    // Show an Ad if user is Free or Bronze, or not logged in
    const isPremium = user?.plan === 'SILVER' || user?.plan === 'GOLD';
    if (!isPremium) {
      setShowAd(true);
      const timer = setTimeout(() => setShowAd(false), 5000); // 5 sec unskippable ad
      return () => clearTimeout(timer);
    }
  }, [user, video?._id]);

  useEffect(() => {
    if (!video?._id) return;
    
    const roomId = video._id;
    socket.emit("join_room", roomId);

    socket.on("play_video", () => {
      videoRef.current?.play();
    });

    socket.on("pause_video", () => {
      videoRef.current?.pause();
    });

    socket.on("seek_video", (time) => {
      if (videoRef.current && Math.abs(videoRef.current.currentTime - time) > 1) {
        videoRef.current.currentTime = time;
      }
    });

    return () => {
      socket.off("play_video");
      socket.off("pause_video");
      socket.off("seek_video");
    };
  }, [video]);

  const handlePlay = () => socket.emit("play_video", video._id);
  const handlePause = () => socket.emit("pause_video", video._id);
  const handleSeek = (e: any) => socket.emit("seek_video", { roomId: video._id, time: e.target.currentTime });

  const copyInviteLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      alert("Watch Party invite link copied to clipboard!");
    }
  };

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group border dark:border-gray-800 shadow-xl transition-all">
      {/* Watch Party Controls */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.7)]' : 'bg-red-500'}`}></div>
          <span className="text-white text-xs font-medium tracking-wide">
            {isConnected ? 'Watch Party: Synced' : 'Disconnected'}
          </span>
        </div>
        <button 
          onClick={copyInviteLink}
          className="flex items-center gap-2 bg-blue-600/90 hover:bg-blue-600 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Users size={14} />
          <span className="text-xs font-bold">Invite Friends</span>
        </button>
      </div>

      {showAd && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white">
          <p className="text-yellow-400 font-bold text-xl mb-2">Advertisement</p>
          <p className="text-gray-300">Upgrade to Gold for an ad-free experience.</p>
          <div className="mt-4 text-sm bg-gray-800 px-4 py-2 rounded-full animate-pulse">Video will play in 5 seconds...</div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster={`/placeholder.svg?height=480&width=854`}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeek}
      >
        <source
          src={`${BACKEND_URL}/video/stream/${video?._id}`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
