import React, { useEffect, useRef, useState } from 'react';
import { User, MoreVertical, Pin, MessageSquare } from 'lucide-react';

const VideoFeed = ({ stream, isLocal = false, muted = false, name = "User", onPin, onMessage, objectFit = 'cover' }) => {
  const videoRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.warn("Autoplay blocked by browser:", err);
      });
    }
  }, [stream]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handlePin = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onPin) onPin();
  };

  const handleMessage = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onMessage) onMessage();
  };

  return (
    <div 
      className="relative w-full h-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 group shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-white/5"
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onPin) onPin();
      }}
    >
      <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal || muted}
            style={{
              width: '100%',
              height: '100%',
              objectFit: objectFit,
              transform: isLocal ? 'scaleX(-1)' : 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/40">
            <User size={32} className="text-neutral-500" />
          </div>
        )}
      </div>
      
      {/* Cinematic Name Tag */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        {isLocal && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,1)] animate-pulse" />}
        {name} {isLocal && <span className="text-neutral-400 font-medium ml-1">(You)</span>}
      </div>

      {/* 3-dots Menu Button */}
      {(!isLocal && (onPin || onMessage)) && (
        <button 
          onClick={handleMenuClick}
          className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
        >
          <MoreVertical size={16} />
        </button>
      )}

      {/* Context Menu Popup */}
      {showMenu && (
        <div className="absolute top-10 right-2 z-50 flex flex-col p-1.5 min-w-[140px] bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
          {onPin && (
            <button onClick={handlePin} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg transition-colors">
              <Pin size={14} className="text-neutral-400" /> Pin Video
            </button>
          )}
          {onMessage && (
            <button onClick={handleMessage} className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg transition-colors mt-1">
              <MessageSquare size={14} className="text-neutral-400" /> Direct Message
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
