import React, { useState, useEffect, useRef } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import YouTube from 'react-youtube';
import { Link2, HardDrive, MonitorPlay, Download, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipForward, Loader2, FastForward, Rewind } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OFFICIAL_VIDEOS = [
  'Video 1.mp4',
  'Video 2.mp4',
  'Video 3.mp4',
  'Video 4.mp4',
  'Video 5.mp4'
];

const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return '0:00';
  const h = Math.floor(timeInSeconds / 3600);
  const m = Math.floor((timeInSeconds % 3600) / 60);
  const s = Math.floor(timeInSeconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const SyncPlayer = ({ initialVideoUrl = '' }) => {
  const { socket, roomId } = useRoomStore();
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [inputUrl, setInputUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [downloadMsg, setDownloadMsg] = useState(null);
  
  // Custom Player States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [ripple, setRipple] = useState(null); // { side: 'left'|'right', id: Date.now() }
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  const playerContainerRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const nativePlayerRef = useRef(null);
  const isInputFocusedRef = useRef(false);
  const lastAction = useRef({ type: 'pause', time: 0 });
  const hoverTimeout = useRef(null);
  const progressInterval = useRef(null);

  const getYouTubeId = (url) => {
    if (!url || url.startsWith('blob:')) return null;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.searchParams.get('v');
    } catch {
      return null;
    }
  };

  const getActualCurrentTime = () => {
    if (!videoUrl) return 0;
    if (videoUrl.startsWith('blob:') || !getYouTubeId(videoUrl)) {
      return nativePlayerRef.current?.currentTime || 0;
    }
    return youtubePlayerRef.current?.getCurrentTime() || 0;
  };

  const getActualDuration = () => {
    if (!videoUrl) return 0;
    if (videoUrl.startsWith('blob:') || !getYouTubeId(videoUrl)) {
      return nativePlayerRef.current?.duration || 0;
    }
    return youtubePlayerRef.current?.getDuration() || 0;
  };

  const seekTo = (time) => {
    if (!videoUrl) return;
    if (videoUrl.startsWith('blob:') || !getYouTubeId(videoUrl)) {
      if (nativePlayerRef.current) nativePlayerRef.current.currentTime = time;
    } else {
      if (youtubePlayerRef.current) youtubePlayerRef.current.seekTo(time, true);
    }
    setCurrentTime(time);
  };

  // Setup Progress Interval
  useEffect(() => {
    if (playing && !isBuffering) {
      progressInterval.current = setInterval(() => {
        setCurrentTime(getActualCurrentTime());
        setDuration(getActualDuration());
      }, 500);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [playing, isBuffering, videoUrl]);

  // Listen to Fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      
      if (!videoUrl) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleRelativeSeek(10, 'right');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleRelativeSeek(-10, 'left');
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing, videoUrl, duration]);

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
        setIsBuffering(true); // Reset buffering on URL change
      }
      
      lastAction.current = { type, time };
      
      if (Math.abs(getActualCurrentTime() - time) > 2.0) {
        seekTo(time);
      }
      
      if (type === 'play') setPlaying(true);
      else if (type === 'pause') setPlaying(false);
    });
    return () => socket.off('video_sync');
  }, [socket, videoUrl]);

  // Handle programmatic play/pause for YouTube Iframe
  useEffect(() => {
    if (videoUrl && getYouTubeId(videoUrl) && youtubePlayerRef.current) {
      if (playing) {
        youtubePlayerRef.current.playVideo();
      } else {
        youtubePlayerRef.current.pauseVideo();
      }
    }
  }, [playing, videoUrl]);

  const emitSync = (type, forcedTime = null) => {
    if (!socket) return;
    const time = forcedTime !== null ? forcedTime : getActualCurrentTime();
    
    // Prevent echo loops
    if (lastAction.current.type === type && Math.abs(lastAction.current.time - time) < 1.0) {
      return;
    }
    
    lastAction.current = { type, time };
    socket.emit('video_sync', { roomId, type, time, url: videoUrl });
  };

  const handlePlayPause = () => {
    if (playing) {
      setPlaying(false);
      emitSync('pause');
      if (videoUrl && !getYouTubeId(videoUrl) && nativePlayerRef.current) {
        nativePlayerRef.current.pause();
      }
    } else {
      setPlaying(true);
      emitSync('play');
      if (videoUrl && !getYouTubeId(videoUrl) && nativePlayerRef.current) {
        nativePlayerRef.current.play().catch(e => console.error("Play prevented", e));
      }
    }
  };

  const handleSeek = (newTime) => {
    seekTo(newTime);
    emitSync('play', newTime);
  };

  const handleRelativeSeek = (seconds, side) => {
    let newTime = getActualCurrentTime() + seconds;
    if (newTime < 0) newTime = 0;
    if (newTime > duration && duration > 0) newTime = duration;
    
    seekTo(newTime);
    emitSync('play', newTime);

    if (side) {
      setRipple({ side, id: Date.now() });
      setTimeout(() => setRipple(null), 500);
    }
  };

  const toggleFullscreen = () => {
    const elem = playerContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.error(err));
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
      }
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (nativePlayerRef.current) {
      nativePlayerRef.current.volume = newVolume;
    }
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume(newVolume * 100);
    }
  };

  const handleNextVideo = () => {
    let nextIndex = 0;
    // Safely parse out query parameters if any exist
    const rawName = videoUrl.split('/').pop().split('?')[0];
    const currentName = decodeURIComponent(rawName);
    const idx = OFFICIAL_VIDEOS.indexOf(currentName);
    
    if (idx !== -1 && idx < OFFICIAL_VIDEOS.length - 1) {
      nextIndex = idx + 1;
    }
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '/static/videos/');
    const nextUrl = baseUrl + encodeURIComponent(OFFICIAL_VIDEOS[nextIndex]);
    
    setVideoUrl(nextUrl);
    setPlaying(true);
    setIsBuffering(true);
    if (socket) {
      socket.emit('video_sync', { roomId, type: 'play', time: 0, url: nextUrl });
    }
  };

  const handleUrlSubmit = () => {
    let finalUrl = inputUrl.trim();
    if (!finalUrl) return;
    
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('blob:')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (finalUrl.includes('youtu.be/')) {
      const videoId = finalUrl.split('youtu.be/')[1].split('?')[0];
      finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (finalUrl.includes('youtube.com/watch') && finalUrl.includes('&')) {
      finalUrl = finalUrl.split('&')[0];
    }

    if (finalUrl !== videoUrl) {
      setVideoUrl(finalUrl);
      setPlaying(true);
      setIsBuffering(true);
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
      setIsBuffering(true);
      setInputUrl('');
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (!isInputFocusedRef.current && playing) setShowControls(false);
    }, 4000);
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    try {
      setDownloadMsg({ text: 'Processing download...', type: 'info' });
      const res = await axios.post('/downloads/request', {
        videoUrl,
        title: 'Watch Party Video'
      });
      setDownloadMsg({ text: 'Download started!', type: 'success' });
      const link = document.createElement('a');
      link.href = res.data.downloadUrl;
      link.download = 'video.mp4';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => setDownloadMsg(null), 3000);
    } catch (error) {
      const msg = error.response?.data?.error || 'Download failed';
      setDownloadMsg({ text: msg, type: 'error' });
      setTimeout(() => setDownloadMsg(null), 5000);
    }
  };

  const onYouTubeReady = (event) => {
    youtubePlayerRef.current = event.target;
    youtubePlayerRef.current.setVolume(volume * 100);
    if (playing) {
      event.target.playVideo();
    }
  };

  const onYouTubeStateChange = (event) => {
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (event.data === 1) { 
      setIsBuffering(false);
      if (!playing) {
        setPlaying(true);
        emitSync('play');
      }
    } else if (event.data === 2) { 
      if (playing) {
        setPlaying(false);
        emitSync('pause');
      }
    } else if (event.data === 3) {
      setIsBuffering(true);
    }
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: playing ? 1 : 0,
      controls: 0, // Ditch native YT controls
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0,
      disablekb: 1,
      iv_load_policy: 3
    },
  };

  return (
    <div 
      ref={playerContainerRef}
      style={{ position: 'absolute', inset: 0, backgroundColor: '#000', zIndex: 0, overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (!isInputFocusedRef.current && playing) setShowControls(false);
      }}
    >
      {/* Video Layers */}
      {!videoUrl ? (
        <div className="fade-in" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', gap: '20px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '28px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }}>
             <MonitorPlay size={48} color="rgba(255,255,255,0.2)" />
          </div>
          <div style={{ textAlign: 'center', padding: '0 20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0', color: 'rgba(255,255,255,0.6)' }}>Waiting for a movie...</h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: '320px', lineHeight: '1.5' }}>
              Paste a YouTube link above or upload a local video file to begin perfectly synced playback.
            </p>
          </div>
        </div>
      ) : videoUrl.startsWith('blob:') || !getYouTubeId(videoUrl) ? (
        <video
          ref={nativePlayerRef}
          src={videoUrl}
          controls={false} // Hide native controls
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#000', objectFit: 'contain' }}
          onPlay={() => { setIsBuffering(false); if (!playing) { setPlaying(true); emitSync('play'); } }}
          onPause={() => { if (playing) { setPlaying(false); emitSync('pause'); } }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onEnded={() => setPlaying(false)}
          onClick={handlePlayPause}
        />
      ) : (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
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

      {/* Buffering Spinner */}
      {videoUrl && isBuffering && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <Loader2 size={48} color="#fff" className="spin" style={{ opacity: 0.8 }} />
        </div>
      )}

      {/* Gesture Zones */}
      {videoUrl && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 20 }}>
          <div 
            style={{ flex: 1, position: 'relative' }} 
            onClick={!getYouTubeId(videoUrl) ? undefined : handlePlayPause} // native handles it directly
            onDoubleClick={(e) => { e.stopPropagation(); handleRelativeSeek(-10, 'left'); }}
          >
            {ripple?.side === 'left' && (
              <div className="ripple-effect fade-in" style={{ position: 'absolute', top: '50%', left: '30%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Rewind size={32} color="#fff" />
                <span style={{ color: '#fff', fontWeight: '800', marginTop: '8px' }}>-10s</span>
              </div>
            )}
          </div>
          <div 
            style={{ flex: 1, position: 'relative' }} 
            onClick={!getYouTubeId(videoUrl) ? undefined : handlePlayPause}
            onDoubleClick={(e) => { e.stopPropagation(); handleRelativeSeek(10, 'right'); }}
          >
            {ripple?.side === 'right' && (
              <div className="ripple-effect fade-in" style={{ position: 'absolute', top: '50%', right: '30%', transform: 'translate(50%, -50%)', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FastForward size={32} color="#fff" />
                <span style={{ color: '#fff', fontWeight: '800', marginTop: '8px' }}>+10s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Bottom Control Bar */}
      {videoUrl && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{ 
            position: 'absolute', bottom: 0, left: 0, right: 0, 
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
            padding: isMobile ? '32px 16px 16px 16px' : '48px 24px 24px 24px',
            display: 'flex', flexDirection: 'column', gap: '12px',
            opacity: showControls || !playing ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 30,
            pointerEvents: showControls || !playing ? 'auto' : 'none'
          }}
        >
          {/* Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500', width: '45px', textAlign: 'right' }}>
              {formatTime(currentTime)}
            </span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              style={{ flex: 1, height: '4px', accentColor: '#8b5cf6', cursor: 'pointer' }}
            />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '500', width: '45px' }}>
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
              <button className="btn-icon" onClick={handlePlayPause} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%' }}>
                {playing ? <Pause size={20} fill="#fff" color="#fff" /> : <Play size={20} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />}
              </button>
              
              <button className="btn-icon" onClick={() => handleRelativeSeek(-10)} title="Rewind 10s">
                <Rewind size={20} color="#fff" />
              </button>
              
              <button className="btn-icon" onClick={() => handleRelativeSeek(10)} title="Skip 10s">
                <FastForward size={20} color="#fff" />
              </button>
              
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                  <button className="btn-icon" onClick={() => handleVolumeChange(isMuted ? 1 : 0)}>
                    {isMuted || volume === 0 ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
                  </button>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" 
                    value={isMuted ? 0 : volume} 
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    style={{ width: '80px', height: '4px', accentColor: '#fff', cursor: 'pointer' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
              <button 
                className="btn-secondary" 
                onClick={handleNextVideo}
                style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.5)', color: '#fff' }}
              >
                <SkipForward size={14} /> {!isMobile && "Next Video"}
              </button>
              
              <button className="btn-icon" onClick={toggleFullscreen} title="Fullscreen">
                {isFullscreen ? <Minimize size={20} color="#fff" /> : <Maximize size={20} color="#fff" />}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Top Input Bar Overlay (Only when controls show) */}
      <div 
        onDoubleClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'absolute', 
          top: isMobile ? '100px' : '90px', 
          left: '50%', 
          transform: `translateX(-50%) translateY(${showControls ? '0' : '-20px'})`,
          opacity: showControls ? 1 : 0,
          transition: 'all 0.3s ease',
          zIndex: 50,
          pointerEvents: showControls ? 'auto' : 'none',
          width: isMobile ? '92%' : 'auto',
          maxWidth: '650px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {downloadMsg && (
          <div style={{ 
            padding: '8px 16px', 
            borderRadius: '20px', 
            fontSize: '13px', 
            fontWeight: '600',
            backgroundColor: downloadMsg.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : (downloadMsg.type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(59, 130, 246, 0.9)'),
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.3s ease'
          }}>
            {downloadMsg.text}
          </div>
        )}
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', padding: isMobile ? '6px' : '8px', borderRadius: '12px', width: '100%', backgroundColor: 'rgba(0,0,0,0.6)' }}>
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
              style={{ paddingLeft: isMobile ? '32px' : '36px', height: isMobile ? '36px' : '40px', fontSize: isMobile ? '13px' : '14px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
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
            <button className="btn-secondary" style={{ height: isMobile ? '36px' : '40px', padding: isMobile ? '0 10px' : '0 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: isMobile ? '12px' : '14px', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}>
              <HardDrive size={isMobile ? 14 : 16} /> {!isMobile && "Local"}
            </button>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          <button 
            className={videoUrl && !getYouTubeId(videoUrl) && !videoUrl.startsWith('blob:') ? "btn-secondary" : ""}
            onClick={handleDownload}
            disabled={!videoUrl || getYouTubeId(videoUrl) || videoUrl.startsWith('blob:')}
            title={!videoUrl ? "No video to download" : (getYouTubeId(videoUrl) ? "YouTube downloads not supported" : "Download Video")}
            style={{ 
              height: isMobile ? '36px' : '40px', 
              padding: isMobile ? '0 10px' : '0 16px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: isMobile ? '12px' : '14px', 
              fontWeight: '600',
              backgroundColor: (!videoUrl || getYouTubeId(videoUrl) || videoUrl.startsWith('blob:')) ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              color: (!videoUrl || getYouTubeId(videoUrl) || videoUrl.startsWith('blob:')) ? 'rgba(255,255,255,0.3)' : '#fff',
              border: 'none',
              cursor: (!videoUrl || getYouTubeId(videoUrl) || videoUrl.startsWith('blob:')) ? 'not-allowed' : 'pointer'
            }}
          >
            <Download size={isMobile ? 14 : 16} /> {!isMobile && "Download"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncPlayer;
