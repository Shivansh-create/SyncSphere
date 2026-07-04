import React, { useState, useEffect, useRef } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import YouTube from 'react-youtube';
import { Link2, HardDrive } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

const SyncPlayer = () => {
  const { socket, roomId } = useRoomStore();
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  const [inputUrl, setInputUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const youtubePlayerRef = useRef(null);
  const nativePlayerRef = useRef(null);
  const isInputFocusedRef = useRef(false);
  const lastAction = useRef({ type: 'pause', time: 0 });
  const hoverTimeout = useRef(null);

  const getYouTubeId = (url) => {
    if (!url || url.startsWith('blob:')) return null;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.searchParams.get('v');
    } catch {
      return null;
    }
  };

  const getCurrentTime = () => {
    if (videoUrl.startsWith('blob:')) {
      return nativePlayerRef.current?.currentTime || 0;
    }
    return youtubePlayerRef.current?.getCurrentTime() || 0;
  };

  const seekTo = (time) => {
    if (videoUrl.startsWith('blob:')) {
      if (nativePlayerRef.current) nativePlayerRef.current.currentTime = time;
    } else {
      if (youtubePlayerRef.current) youtubePlayerRef.current.seekTo(time, true);
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('video_sync', (data) => {
      const { type, time, url } = data;
      
      let finalUrl = url;
      if (finalUrl && finalUrl.includes('youtu.be/')) {
        const videoId = finalUrl.split('youtu.be/')[1].split('?')[0];
        finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      } else if (finalUrl && finalUrl.includes('youtube.com/watch') && finalUrl.includes('&')) {
        finalUrl = finalUrl.split('&')[0];
      }

      if (finalUrl && finalUrl !== videoUrl && !finalUrl.startsWith('blob:')) {
        setVideoUrl(finalUrl);
      }
      
      lastAction.current = { type, time };
      
      if (Math.abs(getCurrentTime() - time) > 2.0) {
        seekTo(time);
      }
      
      if (type === 'play') setPlaying(true);
      else if (type === 'pause') setPlaying(false);
    });
    return () => socket.off('video_sync');
  }, [socket, videoUrl]);

  // Handle programmatic play/pause for YouTube Iframe
  useEffect(() => {
    if (!videoUrl.startsWith('blob:') && youtubePlayerRef.current) {
      if (playing) {
        youtubePlayerRef.current.playVideo();
      } else {
        youtubePlayerRef.current.pauseVideo();
      }
    }
  }, [playing, videoUrl]);

  const emitSync = (type) => {
    if (!socket) return;
    const time = getCurrentTime();
    
    // Prevent echo loops
    if (lastAction.current.type === type && Math.abs(lastAction.current.time - time) < 1.0) {
      return;
    }
    
    lastAction.current = { type, time };
    socket.emit('video_sync', { roomId, type, time, url: videoUrl });
  };

  const handlePlay = () => {
    setPlaying(true);
    emitSync('play');
  };

  const handlePause = () => {
    setPlaying(false);
    emitSync('pause');
  };

  const handleSeek = (time) => {
    emitSync('seek');
  };

  const handleUrlSubmit = () => {
    let finalUrl = inputUrl.trim();
    if (!finalUrl) return;
    
    // Auto-inject https:// if missing
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('blob:')) {
      finalUrl = 'https://' + finalUrl;
    }

    // Aggressively sanitize youtu.be links
    if (finalUrl.includes('youtu.be/')) {
      const videoId = finalUrl.split('youtu.be/')[1].split('?')[0];
      finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (finalUrl.includes('youtube.com/watch') && finalUrl.includes('&')) {
      finalUrl = finalUrl.split('&')[0];
    }

    if (finalUrl !== videoUrl) {
      setVideoUrl(finalUrl);
      setPlaying(true); // Force auto-play
      if (socket) {
        socket.emit('video_sync', { roomId, type: 'play', time: 0, url: finalUrl });
      }
      setInputUrl('');
    }
  };

  const handleLocalUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setVideoUrl(fileUrl);
      setPlaying(true);
      // We don't sync local blob URLs to others because they don't have the file
      setInputUrl('');
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (!isInputFocusedRef.current) setShowControls(false);
    }, 4000);
  };

  const onYouTubeReady = (event) => {
    youtubePlayerRef.current = event.target;
    if (playing) {
      event.target.playVideo();
    }
  };

  const onYouTubeStateChange = (event) => {
    // YouTube Player States:
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued).
    if (event.data === 1) { // Playing
      handlePlay();
    } else if (event.data === 2) { // Paused
      handlePause();
    }
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: playing ? 1 : 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0 // Disable native fullscreen to force using the Room UI fullscreen
    },
  };

  return (
    <div 
      style={{ position: 'absolute', inset: 0, backgroundColor: '#000', zIndex: 0 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (!isInputFocusedRef.current) setShowControls(false);
      }}
    >
      {videoUrl.startsWith('blob:') ? (
        <video
          ref={nativePlayerRef}
          src={videoUrl}
          controls
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#000', objectFit: 'contain' }}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={(e) => handleSeek(e.target.currentTime)}
        />
      ) : (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <YouTube 
            videoId={getYouTubeId(videoUrl)} 
            opts={opts} 
            onReady={onYouTubeReady}
            onStateChange={onYouTubeStateChange}
            className="youtube-container"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      {/* Wake-up Overlay for URL Bar (Catches mouse moves over the iframe when controls are hidden) */}
      {!showControls && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} onMouseMove={handleMouseMove} />
      )}

      <div 
        onDoubleClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'absolute', 
          top: isMobile ? '80px' : '24px', 
          left: '50%', 
          transform: `translateX(-50%) translateY(${showControls ? '0' : '-20px'})`,
          opacity: showControls ? 1 : 0,
          transition: 'all 0.3s ease',
          zIndex: 50,
          pointerEvents: showControls ? 'auto' : 'none',
          width: isMobile ? '92%' : 'auto',
          maxWidth: '600px'
        }}
      >
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', padding: isMobile ? '6px' : '8px', borderRadius: '12px', width: '100%' }}>
          <div style={{ display: 'flex', position: 'relative', flex: 1 }}>
            <Link2 size={isMobile ? 14 : 16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUrlSubmit();
                }
              }}
              onFocus={() => { isInputFocusedRef.current = true; setShowControls(true); }}
              onBlur={() => { isInputFocusedRef.current = false; handleMouseMove(); }}
              placeholder={isMobile ? "YouTube Link" : "Paste YouTube Link"}
              style={{ paddingLeft: isMobile ? '32px' : '36px', height: isMobile ? '36px' : '40px', fontSize: isMobile ? '13px' : '14px', width: '100%' }}
            />
          </div>
          
          <button 
            className="btn-primary" 
            onClick={handleUrlSubmit}
            style={{ height: isMobile ? '36px' : '40px', padding: isMobile ? '0 12px' : '0 16px', fontSize: isMobile ? '13px' : '14px', borderRadius: '8px' }}
          >
            Play
          </button>
          
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleLocalUpload}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10, width: '100%' }}
              title="Upload Local Video"
            />
            <button className="btn-secondary" style={{ height: isMobile ? '36px' : '40px', padding: isMobile ? '0 10px' : '0 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '12px' : '14px', fontWeight: '600' }}>
              <HardDrive size={isMobile ? 14 : 16} /> {!isMobile && "Local"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncPlayer;
