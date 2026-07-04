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
      className="glass-panel" 
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onPin) onPin();
      }}
      style={{ 
        position: 'relative', width: '100%', height: '100%', overflow: 'visible', 
        backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 'inherit' }}>
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
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={32} color="var(--text-secondary)" />
          </div>
        )}
      </div>
      
      {/* Cinematic Name Tag */}
      <div style={{ 
        position: 'absolute', 
        bottom: '8px', 
        left: '8px', 
        backgroundColor: 'rgba(0, 0, 0, 0.6)', 
        padding: '6px 12px', 
        borderRadius: '8px', 
        fontSize: '12px',
        fontWeight: '500',
        color: 'var(--text-primary)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {isLocal && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-base)', boxShadow: '0 0 8px var(--accent-base)' }} />}
        {name} {isLocal && <span style={{ color: 'var(--text-secondary)' }}>(You)</span>}
      </div>

      {/* 3-dots Menu Button */}
      {(!isLocal && (onPin || onMessage)) && (
        <button 
          onClick={handleMenuClick}
          style={{
            position: 'absolute', top: '8px', right: '8px', padding: '4px',
            backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '6px', backdropFilter: 'blur(4px)'
          }}
        >
          <MoreVertical size={16} color="var(--text-primary)" />
        </button>
      )}

      {/* Context Menu Popup */}
      {showMenu && (
        <div className="glass-panel fade-in" style={{ 
          position: 'absolute', top: '36px', right: '8px', zIndex: 100,
          display: 'flex', flexDirection: 'column', padding: '4px', minWidth: '140px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          {onPin && (
            <button onClick={handlePin} style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '13px', borderRadius: '6px' }} className="btn-secondary">
              <Pin size={14} /> Pin Video
            </button>
          )}
          {onMessage && (
            <button onClick={handleMessage} style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', marginTop: '4px' }} className="btn-secondary">
              <MessageSquare size={14} /> Direct Message
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoFeed;
