import React, { useState, useEffect, useRef } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import YouTube from 'react-youtube';
import { Link2, HardDrive, MonitorPlay, Download, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipForward, Loader2, FastForward, Rewind } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUser } from '@/lib/AuthContext';
import { useRouter } from 'next/router';
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
  const [isReady, setIsReady] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const { user } = useUser();
  const controlsTimeoutRef = useRef(null);
  
  const router = useRouter();
  
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [ripple, setRipple] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [downloadMsg, setDownloadMsg] = useState(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (!videoUrl) return;
      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault(); handlePlayPause(); break;
        case 'ArrowRight':
          e.preventDefault(); handleRelativeSeek(10, 'right'); break;
        case 'ArrowLeft':
          e.preventDefault(); handleRelativeSeek(-10, 'left'); break;
        case 'f':
        case 'F':
          e.preventDefault(); toggleFullscreen(); break;
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
        setIsBuffering(true);
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
      if (elem.requestFullscreen) elem.requestFullscreen().catch(err => console.error(err));
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
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
    const rawName = videoUrl.split('/').pop().split('?')[0];
    const currentName = decodeURIComponent(rawName);
    const idx = OFFICIAL_VIDEOS.indexOf(currentName);
    
    if (idx !== -1 && idx < OFFICIAL_VIDEOS.length - 1) {
      nextIndex = idx + 1;
    }
    
    const apiUrl = 'http://localhost:3001/api';
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
    if (!user) {
      router.push('/auth');
      return;
    }
    try {
      setDownloadMsg({ text: 'Processing download...', type: 'info' });
      const res = await axios.post('/api/downloads/request', {
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
      controls: 0,
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
      className="absolute inset-0 bg-[#050510] z-0 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (!isInputFocusedRef.current && playing) setShowControls(false);
      }}
    >
      {/* Empty State Overlay */}
      {!videoUrl ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050510] gap-6">
          {/* Subtle animated background */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-[120px]" />
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="relative bg-white/[0.04] p-10 rounded-full border border-white/[0.06]">
               <MonitorPlay size={64} className="text-white/15" />
            </div>
          </div>
          <div className="text-center px-5 max-w-sm relative z-10">
            <h2 className="text-2xl font-bold text-white/50 mb-3 tracking-tight">Waiting for a movie...</h2>
            <p className="text-sm text-white/25 leading-relaxed">
              Paste a YouTube link or upload a local file to start perfectly synced playback.
            </p>
          </div>
        </div>
      ) : videoUrl.startsWith('blob:') || !getYouTubeId(videoUrl) ? (
        <video
          ref={nativePlayerRef}
          src={videoUrl}
          controls={false}
          className="absolute top-0 left-0 w-full h-full bg-black object-contain"
          onPlay={() => { setIsBuffering(false); if (!playing) { setPlaying(true); emitSync('play'); } }}
          onPause={() => { if (playing) { setPlaying(false); emitSync('pause'); } }}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onEnded={() => setPlaying(false)}
          onClick={handlePlayPause}
        />
      ) : (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <YouTube 
            videoId={getYouTubeId(videoUrl)} 
            opts={opts} 
            onReady={onYouTubeReady}
            onStateChange={onYouTubeStateChange}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      {/* Buffering Spinner */}
      {videoUrl && isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <Loader2 size={56} className="text-white animate-spin drop-shadow-2xl" />
        </div>
      )}

      {/* Gesture Zones */}
      {videoUrl && (
        <div className="absolute inset-0 flex z-20">
          <div 
            className="flex-1 relative cursor-pointer" 
            onClick={!getYouTubeId(videoUrl) ? undefined : handlePlayPause}
            onDoubleClick={(e) => { e.stopPropagation(); handleRelativeSeek(-10, 'left'); }}
          >
            {ripple?.side === 'left' && (
              <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md rounded-full p-6 flex flex-col items-center animate-in zoom-in duration-300">
                <Rewind size={36} className="text-white drop-shadow-md" />
                <span className="text-white font-black mt-2 tracking-wider">-10s</span>
              </div>
            )}
          </div>
          <div 
            className="flex-1 relative cursor-pointer" 
            onClick={!getYouTubeId(videoUrl) ? undefined : handlePlayPause}
            onDoubleClick={(e) => { e.stopPropagation(); handleRelativeSeek(10, 'right'); }}
          >
            {ripple?.side === 'right' && (
              <div className="absolute top-1/2 right-[30%] translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md rounded-full p-6 flex flex-col items-center animate-in zoom-in duration-300">
                <FastForward size={36} className="text-white drop-shadow-md" />
                <span className="text-white font-black mt-2 tracking-wider">+10s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Bottom Control Bar */}
      {videoUrl && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3 z-30 transition-all duration-300 ${
            showControls || !playing ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
          } ${isMobile ? 'p-4 pb-4' : 'p-6 pb-6'}`}
        >
          {/* Progress Bar */}
          <div className="flex items-center gap-3 w-full group">
            <span className="text-white text-xs font-bold w-12 text-right tracking-wider">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all"
            />
            <span className="text-white/70 text-xs font-bold w-12 tracking-wider">{formatTime(duration)}</span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between w-full mt-1">
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={handlePlayPause} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95">
                {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
              </button>
              
              <button onClick={() => handleRelativeSeek(-10)} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95">
                <Rewind size={22} />
              </button>
              
              <button onClick={() => handleRelativeSeek(10)} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95">
                <FastForward size={22} />
              </button>
              
              {!isMobile && (
                <div className="flex items-center gap-2 ml-4 group">
                  <button onClick={() => handleVolumeChange(isMuted ? 1 : 0)} className="p-2 text-white/80 hover:text-white rounded-full transition-all">
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" 
                    value={isMuted ? 0 : volume} 
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white transition-all duration-300"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={handleNextVideo}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
              >
                <SkipForward size={16} /> {!isMobile && "Next"}
              </button>
              
              <button onClick={toggleFullscreen} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95">
                {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Top Input Bar Overlay */}
      <div 
        onDoubleClick={(e) => e.stopPropagation()}
        className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-[92%] sm:w-auto sm:min-w-[600px] transition-all duration-500 ${
          showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        {downloadMsg && (
          <div className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg animate-in slide-in-from-top-2 ${
            downloadMsg.type === 'error' ? 'bg-red-500/90' : (downloadMsg.type === 'success' ? 'bg-green-500/90' : 'bg-blue-500/90')
          }`}>
            {downloadMsg.text}
          </div>
        )}
        
        <div className="w-full flex items-center gap-2 p-2 bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-3xl border border-white/[0.06] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex-1 relative flex items-center">
            <Link2 size={16} className="absolute left-4 text-neutral-400" />
            <input 
              type="text" 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlSubmit(); } }}
              onFocus={() => { isInputFocusedRef.current = true; setShowControls(true); }}
              onBlur={() => { isInputFocusedRef.current = false; handleMouseMove(); }}
              placeholder={isMobile ? "YouTube Link" : "Paste YouTube Link"}
              className="w-full h-10 pl-11 pr-4 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          
          <button 
            onClick={handleUrlSubmit}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-95"
          >
            Play
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleLocalUpload}
              className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
              title="Upload Local Video"
            />
            <button className="h-10 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all">
              <HardDrive size={16} /> {!isMobile && "Local"}
            </button>
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button 
            onClick={handleDownload}
            disabled={!videoUrl || getYouTubeId(videoUrl) || videoUrl.startsWith('blob:')}
            title={!videoUrl ? "No video" : (getYouTubeId(videoUrl) ? "YT downloads not supported" : "Download Video")}
            className="h-10 px-4 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 disabled:hover:bg-white/5 border border-white/10 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <Download size={16} /> {!isMobile && "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncPlayer;
