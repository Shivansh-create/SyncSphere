"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useState } from "react";

export default function VideoCard({ video }: any) {
  const [duration, setDuration] = useState("0:00");

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Link href={`/watch/${video?._id}`} className="group block outline-none">
      <div className="flex flex-col gap-3">
        {/* Thumbnail Container */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 transition-transform duration-300 group-hover:-translate-y-1">
          
          <video
            src={`http://localhost:3001/video/stream/${video?._id}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onLoadedMetadata={(e) => setDuration(formatDuration(e.currentTarget.duration))}
          />
          
          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[12px] font-medium text-white tracking-wide">
            {duration}
          </div>
        </div>

        {/* Video Info */}
        <div className="flex gap-3 px-1">
          <Avatar className="w-10 h-10 flex-shrink-0 mt-0.5 border border-gray-200 dark:border-white/10">
            <AvatarFallback className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-sm">
              {video?.videochanel?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {video?.videotitle || "Untitled Video"}
            </h3>
            <p className="text-[14px] text-gray-600 dark:text-gray-400 font-medium mt-1">
              {video?.videochanel || "Unknown Channel"}
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-500 font-medium mt-0.5">
              {video?.views?.toLocaleString()} views •{" "}
              {video?.createdAt ? formatDistanceToNow(new Date(video.createdAt)) + " ago" : ""}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
