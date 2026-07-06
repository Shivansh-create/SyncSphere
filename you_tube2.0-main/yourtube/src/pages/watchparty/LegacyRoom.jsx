import React, { useEffect, useState, useRef } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useRecorder } from '../../hooks/useRecorder';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useUser } from '@/lib/AuthContext';
import VideoFeed from '../../components/VideoFeed';
import SyncPlayer from '../../components/SyncPlayer';
import { useRouter } from 'next/router';
import { LogOut, Mic, MicOff, Video, VideoOff, MonitorUp, Send, MessageSquare, Circle, X, Users, Pin, Maximize, Minimize, Shield, UserMinus, CheckCircle2, Link, Hash } from 'lucide-react';

const LegacyRoom = () => {
  const { roomId, userName, userId, leaveRoom, participants, messages, sendMessage, activeChatTarget, setActiveChatTarget, isHost, joinRequests, kickUser, approveJoin, denyJoin } = useRoomStore();
  const { user } = useUser();
  const { localStream, remoteStreams, startLocalMedia, toggleAudio, toggleVideo, startScreenShare } = useWebRTC();
  const { isRecording, toggleRecording } = useRecorder();
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showPanel, setShowPanel] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('chat');
  const [showUI, setShowUI] = useState(true);
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hoverTimeout = useRef(null);
  const isChatFocusedRef = useRef(false);
  const router = useRouter();

  const handleLeave = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    leaveRoom();
    router.push('/');
  };
  
  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/watchparty?room=${roomId}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = async (e) => {
    if (e) e.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    startLocalMedia().catch(console.error);
  }, []);

  useEffect(() => {
    if (pinnedUserId && pinnedUserId !== 'local') {
      if (!participants.some(p => p.id === pinnedUserId)) setPinnedUserId(null);
    }
  }, [participants, pinnedUserId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showPanel, activeTab]);

  const handleToggleAudio = () => { toggleAudio(); setAudioEnabled(!audioEnabled); };
  const handleToggleVideo = () => { toggleVideo(); setVideoEnabled(!videoEnabled); };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handleMouseMove = () => {
    setShowUI(true);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (!isChatFocusedRef.current) setShowUI(false);
    }, 4000);
  };

  const getParticipantName = (id) => participants.find(p => p.id === id)?.name || 'User';

  const openPanelToTab = (tab) => {
    setActiveTab(tab);
    setShowPanel(true);
  };

  const handleDirectMessageClick = (targetId, targetName) => {
    setActiveChatTarget({ id: targetId, name: targetName });
    setActiveTab('chat');
    if (!showPanel) setShowPanel(true);
  };

  return (
    <div 
      className="relative h-screen w-screen bg-[#050510] overflow-hidden select-none"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
      onDoubleClick={toggleFullScreen}
      onMouseLeave={() => { if (!isChatFocusedRef.current) setShowUI(false); }}
    >
      
      {/* Host Approval Modals */}
      {isHost && joinRequests?.length > 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-auto">
          {joinRequests.map((req, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-3xl border border-blue-500/50 p-4 rounded-2xl flex items-center gap-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
              <div>
                <span className="font-bold text-white tracking-wide">{req.userName}</span>
                <span className="text-neutral-400 text-sm ml-2">wants to join.</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => denyJoin(req.targetSocketId, req.targetToken)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-100 text-sm rounded-xl transition-all">Deny</button>
                <button onClick={() => approveJoin(req.targetSocketId, req.targetToken)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all">Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Video Player Area */}
      <div className="absolute inset-0 z-0">
        <SyncPlayer />
      </div>

      {/* Pinned User Stage */}
      {pinnedUserId && (
        <div className="absolute inset-0 z-[5] bg-black">
          {pinnedUserId === 'local' ? (
            <VideoFeed stream={localStream} isLocal={true} name={userName} muted={true} objectFit="contain" />
          ) : (
            <VideoFeed stream={remoteStreams[pinnedUserId]} name={getParticipantName(pinnedUserId)} objectFit="contain" />
          )}
          <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[30] transition-opacity duration-500 ${showUI ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <button onClick={() => setPinnedUserId(null)} className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white rounded-full font-bold shadow-lg transition-all active:scale-95">
              Unpin / Back to Movie
            </button>
          </div>
        </div>
      )}

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.8)_100%)] z-10" />

      {/* Wake-up overlay */}
      {!showUI && <div className="absolute inset-0 z-15" onMouseMove={handleMouseMove} />}

      {/* Top Left: Room Info */}
      <div className={`absolute top-6 left-6 z-20 flex items-center gap-3 p-2 pr-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl transition-opacity duration-500 ${showUI ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <span className="text-white text-xs font-bold tracking-widest bg-white/10 px-3 py-1.5 rounded-xl border border-white/5">
            ROOM {roomId}
          </span>
          <button onClick={handleCopyCode} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-neutral-400 hover:text-white" title="Copy Code">
            {copiedCode ? <CheckCircle2 size={16} className="text-green-400" /> : <Hash size={16} />}
          </button>
          <button onClick={handleCopyLink} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-neutral-400 hover:text-white" title="Copy Link">
            {copiedLink ? <CheckCircle2 size={16} className="text-green-400" /> : <Link size={16} />}
          </button>
        </div>
        <div className="w-1 h-1 rounded-full bg-neutral-600" />
        <span className="text-neutral-400 text-sm font-medium">{participants.length + 1} User{participants.length + 1 !== 1 ? 's' : ''}</span>
      </div>

      {/* Top Right: Actions */}
      <div 
        onDoubleClick={(e) => e.stopPropagation()}
        className={`absolute top-6 right-6 z-20 flex gap-3 transition-opacity duration-500 ${showUI ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <button onClick={toggleFullScreen} className="p-3 bg-black/40 backdrop-blur-2xl hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all">
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
        {!showPanel && (
          <>
            <button onClick={() => openPanelToTab('participants')} className="p-3 bg-black/40 backdrop-blur-2xl hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all">
              <Users size={20} />
            </button>
            <button onClick={() => openPanelToTab('chat')} className="p-3 bg-black/40 backdrop-blur-2xl hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all">
              <MessageSquare size={20} />
            </button>
          </>
        )}
        <button onClick={handleLeave} className="flex items-center gap-2 px-5 py-3 bg-red-500/20 backdrop-blur-2xl hover:bg-red-500/40 border border-red-500/50 rounded-2xl text-red-100 font-bold transition-all">
          <LogOut size={18} /> {!isMobile && "Leave"}
        </button>
      </div>

      {/* Floating Side Panel (Chat & Participants) */}
      <div className={`absolute z-40 flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.6)] transition-all duration-500 ${
        isMobile 
          ? 'left-0 right-0 bottom-0 h-[55vh] rounded-t-[28px] bg-[#0a0a14]/95 backdrop-blur-3xl border-t border-white/[0.08]' 
          : 'top-[90px] bottom-[130px] right-6 w-[340px] rounded-[24px] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-3xl border border-white/[0.06]'
      } ${showPanel && (showUI || isMobile) ? 'opacity-100 translate-y-0 translate-x-0 pointer-events-auto' : (isMobile ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-0 translate-x-10 pointer-events-none')}`}>
        
        {/* Tabs */}
        <div className="flex items-center justify-between px-4 pt-4 border-b border-white/10">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition-colors ${activeTab === 'chat' ? 'text-white border-blue-500' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}
            >
              CHAT
            </button>
            <button 
              onClick={() => setActiveTab('participants')}
              className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition-colors ${activeTab === 'participants' ? 'text-white border-blue-500' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}
            >
              PEOPLE ({participants.length + 1})
            </button>
          </div>
          <button onClick={() => setShowPanel(false)} className="p-2 mb-3 text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Chat Content */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === userId || msg.userName === userName;
                const isPrivate = msg.isDirect;
                return (
                  <div key={i} className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-[11px] text-neutral-500 font-bold mb-1 ml-1 tracking-wide">
                        {msg.userName} {isPrivate && <span className="text-purple-400">(Whisper)</span>}
                      </span>
                    )}
                    {isMe && isPrivate && (
                      <span className="text-[11px] text-purple-400 font-bold mb-1 mr-1 tracking-wide">
                        To {msg.toUserName || 'Private'} (Whisper)
                      </span>
                    )}
                    <div className={`px-4 py-3 text-sm leading-relaxed max-w-[85%] ${
                      isPrivate 
                        ? (isMe ? 'bg-purple-600 text-white rounded-[20px_20px_4px_20px] shadow-[0_4px_15px_rgba(147,51,234,0.3)]' : 'bg-purple-500/20 border border-purple-500/30 text-white rounded-[20px_20px_20px_4px]') 
                        : (isMe ? 'bg-blue-600 text-white rounded-[20px_20px_4px_20px] shadow-[0_4px_15px_rgba(37,99,235,0.3)]' : 'bg-white/10 border border-white/5 text-white rounded-[20px_20px_20px_4px]')
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10">
              {activeChatTarget && (
                <div className="flex justify-between items-center bg-purple-500/20 border border-purple-500/30 px-3 py-2 rounded-xl mb-3">
                  <span className="text-xs text-purple-300 font-bold tracking-wide truncate">Whispering to {activeChatTarget.name}</span>
                  <button type="button" onClick={() => setActiveChatTarget(null)} className="p-1 text-purple-400 hover:text-white"><X size={14} /></button>
                </div>
              )}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={activeChatTarget ? `Message ${activeChatTarget.name}...` : "Say something..."} 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onFocus={() => { isChatFocusedRef.current = true; setShowUI(true); }}
                  onBlur={() => { isChatFocusedRef.current = false; handleMouseMove(); }}
                  className={`w-full pr-12 pl-4 h-12 text-sm text-white placeholder-neutral-500 rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                    activeChatTarget ? 'bg-purple-500/10 border border-purple-500/30 focus:ring-purple-500/50' : 'bg-black/50 border border-white/10 focus:ring-blue-500/50'
                  }`}
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim()}
                  className={`absolute right-1.5 top-1.5 bottom-1.5 w-9 flex items-center justify-center rounded-xl transition-all ${
                    chatInput.trim() ? (activeChatTarget ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:scale-105' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:scale-105') : 'bg-white/10 text-neutral-500'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        )}

        {/* Participants Content */}
        {activeTab === 'participants' && (
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
            
            {/* Local User */}
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex flex-shrink-0 items-center justify-center text-blue-400">
                  <Users size={18} />
                </div>
                <span className="text-sm font-bold text-white tracking-wide truncate flex items-center gap-2">
                  {userName} <span className="text-neutral-500 font-medium">(You)</span>
                  {isHost && <Shield size={14} className="text-blue-500" title="Host" />}
                </span>
              </div>
              <button 
                onClick={() => setPinnedUserId('local')}
                className={`p-2 rounded-xl transition-all ${pinnedUserId === 'local' ? 'bg-white/20 text-white' : 'text-neutral-500 hover:bg-white/10 hover:text-white'}`}
                title="Pin Video"
              >
                <Pin size={16} />
              </button>
            </div>
            
            {/* Remote Users */}
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex flex-shrink-0 items-center justify-center text-neutral-400 group-hover:text-white transition-colors">
                    <Users size={18} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide truncate">
                    {p.name}
                  </span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {isHost && (
                    <button onClick={() => kickUser(p.token)} className="p-2 rounded-xl text-neutral-500 hover:bg-red-500/20 hover:text-red-400 transition-all" title="Kick User">
                      <UserMinus size={16} />
                    </button>
                  )}
                  <button onClick={() => setPinnedUserId(p.id)} className={`p-2 rounded-xl transition-all ${pinnedUserId === p.id ? 'bg-white/20 text-white' : 'text-neutral-500 hover:bg-white/10 hover:text-white'}`} title="Pin Video">
                    <Pin size={16} />
                  </button>
                  <button onClick={() => handleDirectMessageClick(p.id, p.name)} className="p-2 rounded-xl text-neutral-500 hover:bg-white/10 hover:text-white transition-all" title="Direct Message">
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Video Feeds (Bottom Left) */}
      <div className={`absolute z-20 flex gap-3 overflow-x-auto pb-3 transition-all duration-500 ${
        isMobile 
          ? 'bottom-[100px] left-4 right-4'
          : `bottom-[120px] left-8 ${showPanel ? 'right-[380px]' : 'right-8'}`
      } ${(showUI && !showPanel) || (showUI && !isMobile) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {localStream && pinnedUserId !== 'local' && (
          <div className="w-[240px] h-[150px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-black/50">
            <VideoFeed stream={localStream} isLocal={true} name={userName} muted={true} />
          </div>
        )}
        {Object.entries(remoteStreams).map(([streamUserId, stream]) => {
          if (streamUserId === pinnedUserId) return null;
          return (
            <div key={streamUserId} className="w-[240px] h-[150px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-black/50">
              <VideoFeed 
                stream={stream} 
                name={getParticipantName(streamUserId)} 
                onPin={() => setPinnedUserId(streamUserId)} 
                onMessage={() => handleDirectMessageClick(streamUserId, getParticipantName(streamUserId))}
              />
            </div>
          );
        })}
      </div>

      {/* Floating Control Dock (Bottom Center) */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-2 bg-gradient-to-b from-white/[0.08] to-white/[0.04] backdrop-blur-3xl border border-white/[0.06] rounded-full shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-500 ${showUI ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <button 
          onClick={handleToggleAudio}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${audioEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
        >
          {audioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
        <button 
          onClick={handleToggleVideo}
          className={`w-14 h-14 ml-2 flex items-center justify-center rounded-full transition-all ${videoEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
        >
          {videoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
        
        <div className="w-px h-8 bg-white/10 mx-4" />
        
        {!isMobile && (
          <button onClick={startScreenShare} className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all mr-2" title="Share Screen">
            <MonitorUp size={22} />
          </button>
        )}
        
        <button 
          onClick={toggleRecording} 
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${isRecording ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'}`} 
          title={isRecording ? "Stop Recording" : "Record Session"}
        >
          <Circle size={22} fill={isRecording ? "currentColor" : "none"} />
        </button>
      </div>

    </div>
  );
};

export default LegacyRoom;
