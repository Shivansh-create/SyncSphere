import React, { useEffect, useState, useRef } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { useRecorder } from '../hooks/useRecorder';
import { useMediaQuery } from '../hooks/useMediaQuery';
import VideoFeed from '../components/VideoFeed';
import SyncPlayer from '../components/SyncPlayer';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mic, MicOff, Video, VideoOff, MonitorUp, Send, MessageSquare, Circle, X, Users, Pin, Maximize, Minimize, Shield, UserMinus, Copy, CheckCircle2, Link, Hash } from 'lucide-react';

const Room = () => {
  const { roomId, userName, userId, leaveRoom, participants, messages, sendMessage, activeChatTarget, setActiveChatTarget, isHost, joinRequests, kickUser, approveJoin, denyJoin } = useRoomStore();
  const { localStream, remoteStreams, startLocalMedia, toggleAudio, toggleVideo, startScreenShare } = useWebRTC();
  const { isRecording, toggleRecording } = useRecorder();
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showPanel, setShowPanel] = useState(!isMobile); // Hidden by default on mobile
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'participants'
  const [showUI, setShowUI] = useState(true);
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hoverTimeout = useRef(null);
  const isChatFocusedRef = useRef(false);
  const navigate = useNavigate();

  const handleLeave = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    leaveRoom();
    navigate('/', { state: { message: 'You have successfully left the theater.' } });
  };
  
  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/?room=${roomId}`;
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
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = async (e) => {
    if (e) e.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error attempting to toggle fullscreen:", err);
    }
  };

  useEffect(() => {
    startLocalMedia().catch(console.error);
  }, []);

  // Auto-unpin if the pinned remote user leaves the room
  useEffect(() => {
    if (pinnedUserId && pinnedUserId !== 'local') {
      const isStillHere = participants.some(p => p.id === pinnedUserId);
      if (!isStillHere) {
        setPinnedUserId(null);
      }
    }
  }, [participants, pinnedUserId]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showPanel, activeTab]);

  const handleToggleAudio = () => {
    toggleAudio();
    setAudioEnabled(!audioEnabled);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setVideoEnabled(!videoEnabled);
  };

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

  const getParticipantName = (id) => {
    const p = participants.find(p => p.id === id);
    return p ? p.name : 'User';
  };

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
      style={{ position: 'relative', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
      onDoubleClick={toggleFullScreen}
      onMouseLeave={() => {
        if (!isChatFocusedRef.current) setShowUI(false);
      }}
    >
      
      {/* Host Approval Modals */}
      {isHost && joinRequests && joinRequests.length > 0 && (
        <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {joinRequests.map((req, idx) => (
            <div key={idx} className="glass-panel fade-in" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--accent-base)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              <div>
                <span style={{ fontWeight: '600', color: '#fff' }}>{req.userName}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginLeft: '6px' }}>wants to re-join.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => denyJoin(req.targetSocketId, req.targetToken)} style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>Deny</button>
                <button className="btn-primary" onClick={() => approveJoin(req.targetSocketId, req.targetToken)} style={{ padding: '6px 12px', fontSize: '12px', height: 'auto' }}>Approve</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Absolute Background Video Player */}
      <SyncPlayer />

      {/* Pinned Video Stage */}
      {pinnedUserId && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, backgroundColor: 'var(--bg-base)' }}>
          {pinnedUserId === 'local' ? (
            <VideoFeed stream={localStream} isLocal={true} name={userName} muted={true} objectFit="contain" />
          ) : (
            <VideoFeed 
              stream={remoteStreams[pinnedUserId]} 
              name={getParticipantName(pinnedUserId)} 
              objectFit="contain" 
            />
          )}
          
          {/* Unpin Button */}
          <div style={{ position: 'absolute', top: isMobile ? '80px' : '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 30, opacity: showUI ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: showUI ? 'auto' : 'none' }}>
            <button className="btn-secondary glass-panel" onClick={() => setPinnedUserId(null)} style={{ padding: isMobile ? '0 16px' : '0 24px', height: isMobile ? '36px' : '44px', fontWeight: '600', fontSize: isMobile ? '13px' : '14px' }}>
              Unpin / Back to Movie
            </button>
          </div>
        </div>
      )}

      {/* Cinematic Vignette Overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.8) 100%)', zIndex: 10 }} />

      {/* Wake-up Overlay for UI (Catches mouse over cross-origin iframes when UI is hidden) */}
      {!showUI && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 15 }} onMouseMove={handleMouseMove} />
      )}

      {/* Top Left: Room Info */}
      <div className="glass-panel" style={{ 
        position: 'absolute', top: isMobile ? '16px' : '24px', left: isMobile ? '16px' : '32px', zIndex: 20, 
        padding: isMobile ? '6px 12px' : '8px 16px', display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px',
        opacity: showUI ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: showUI ? 'auto' : 'none'
      }}>
        <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ROOM {roomId}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={handleCopyCode} 
              title="Copy Room Code" 
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              {copiedCode ? <CheckCircle2 size={14} color="#22c55e" /> : <Hash size={14} color="var(--text-secondary)" />}
            </button>
            <button 
              onClick={handleCopyLink} 
              title="Copy Invite Link" 
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              {copiedLink ? <CheckCircle2 size={14} color="#22c55e" /> : <Link size={14} color="var(--text-secondary)" />}
            </button>
          </div>
        </span>
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)' }} />
        <span style={{ fontSize: isMobile ? '11px' : '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {participants.length + 1} User{participants.length + 1 !== 1 ? 's' : ''}
        </span>
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--glass-border)' }} />
        <span style={{ fontSize: isMobile ? '12px' : '14px', color: 'var(--text-secondary)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userName}
        </span>
      </div>

      {/* Top Right: Toggle Buttons & Leave */}
      <div 
        onDoubleClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'absolute', top: isMobile ? '16px' : '24px', right: isMobile ? '16px' : '32px', zIndex: 20, display: 'flex', gap: '8px',
          opacity: showUI ? 1 : 0, transition: 'opacity 0.5s ease', pointerEvents: showUI ? 'auto' : 'none'
        }}
      >
        <button 
          className="btn-icon" 
          onClick={toggleFullScreen} 
          style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', borderRadius: '12px' }} 
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={isMobile ? 16 : 18} /> : <Maximize size={isMobile ? 16 : 18} />}
        </button>

        {!showPanel && (
          <>
            <button className="glass-panel" style={{ padding: isMobile ? '8px' : '10px', height: isMobile ? '36px' : '40px' }} onClick={() => openPanelToTab('participants')} title="Participants">
              <Users size={isMobile ? 16 : 18} />
            </button>
            <button className="glass-panel" style={{ padding: isMobile ? '8px' : '10px', height: isMobile ? '36px' : '40px' }} onClick={() => openPanelToTab('chat')} title="Chat">
              <MessageSquare size={isMobile ? 16 : 18} />
            </button>
          </>
        )}
        <button className="btn-danger glass-panel" style={{ height: isMobile ? '36px' : '40px', padding: isMobile ? '0 12px' : '0 16px', fontSize: isMobile ? '13px' : '14px', border: '1px solid rgba(239, 68, 68, 0.4)' }} onClick={handleLeave}>
          <LogOut size={16} /> {!isMobile && "Leave"}
        </button>
      </div>

      {/* Floating Side Panel (Chat & Participants) */}
      {showPanel && (
        <div className="glass-panel" style={{ 
          position: 'absolute', 
          top: isMobile ? 'auto' : '80px', 
          bottom: isMobile ? 0 : '110px', 
          right: isMobile ? 0 : '24px', 
          left: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : '340px', 
          height: isMobile ? '60vh' : 'auto',
          zIndex: 40,
          borderBottomLeftRadius: isMobile ? 0 : undefined,
          borderBottomRightRadius: isMobile ? 0 : undefined,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          opacity: showUI || isMobile ? 1 : 0,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
          pointerEvents: showUI || isMobile ? 'auto' : 'none',
          transform: isMobile && !showPanel ? 'translateY(100%)' : 'translateY(0)'
        }}>
          {/* Panel Header & Tabs */}
          <div style={{ padding: '12px 16px 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setActiveTab('chat')}
                style={{ 
                  background: 'none', border: 'none', padding: '8px 4px 12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'chat' ? '2px solid var(--accent-base)' : '2px solid transparent'
                }}
              >
                Chat
              </button>
              <button 
                onClick={() => setActiveTab('participants')}
                style={{ 
                  background: 'none', border: 'none', padding: '8px 4px 12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  color: activeTab === 'participants' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'participants' ? '2px solid var(--accent-base)' : '2px solid transparent'
                }}
              >
                Participants ({participants.length + 1})
              </button>
            </div>
            <button onClick={() => setShowPanel(false)} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', marginTop: '2px' }}>
              <X size={16} color="var(--text-secondary)" />
            </button>
          </div>
          
          {/* Chat Content */}
          {activeTab === 'chat' && (
            <>
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === userId || msg.userName === userName;
                  const isPrivate = msg.isDirect;
                  return (
                    <div key={i} className="fade-in" style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                      {!isMe && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', marginLeft: '4px', fontWeight: '500' }}>
                          {msg.userName} {isPrivate && <span style={{ color: '#d8b4fe', fontWeight: '600' }}>(Whisper)</span>}
                        </span>
                      )}
                      {isMe && isPrivate && (
                        <span style={{ fontSize: '11px', color: '#d8b4fe', marginBottom: '4px', marginRight: '4px', fontWeight: '600' }}>
                          To {msg.toUserName || 'Private'} (Whisper)
                        </span>
                      )}
                      <div style={{ 
                        background: isPrivate ? (isMe ? '#9333ea' : 'rgba(168, 85, 247, 0.2)') : (isMe ? 'linear-gradient(135deg, var(--accent-base), #8b5cf6)' : 'rgba(255,255,255,0.08)'),
                        backdropFilter: isMe ? 'none' : 'blur(10px)',
                        border: isPrivate ? '1px solid rgba(168, 85, 247, 0.4)' : (isMe ? 'none' : '1px solid rgba(255,255,255,0.1)'),
                        color: '#fff',
                        padding: '10px 16px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        maxWidth: '85%',
                        boxShadow: isMe && !isPrivate ? '0 4px 15px rgba(99, 102, 241, 0.3)' : (isPrivate && isMe ? '0 4px 15px rgba(168, 85, 247, 0.4)' : '0 4px 15px rgba(0,0,0,0.1)')
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', borderTop: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {activeChatTarget && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(168, 85, 247, 0.15)', padding: '6px 12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    <span style={{ fontSize: '12px', color: '#d8b4fe', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Whispering to {activeChatTarget.name}
                    </span>
                    <button type="button" onClick={() => setActiveChatTarget(null)} style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={14} color="#d8b4fe" />
                    </button>
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder={activeChatTarget ? `Message ${activeChatTarget.name}...` : "Say something..."} 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onFocus={() => { isChatFocusedRef.current = true; setShowUI(true); }}
                    onBlur={() => { isChatFocusedRef.current = false; handleMouseMove(); }}
                    style={{ 
                      paddingRight: '44px', 
                      backgroundColor: activeChatTarget ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.05)', 
                      border: activeChatTarget ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--glass-border)',
                      height: isMobile ? '40px' : '44px',
                      fontSize: '14px'
                    }}
                  />
                  <button 
                    type="submit" 
                    style={{ 
                      position: 'absolute', right: '4px', top: '4px', width: isMobile ? '32px' : '36px', height: isMobile ? '32px' : '36px', borderRadius: '8px', 
                      backgroundColor: activeChatTarget ? '#a855f7' : 'var(--text-primary)', 
                      color: activeChatTarget ? '#fff' : 'var(--bg-base)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                      opacity: chatInput.trim() ? 1 : 0.5 
                    }}
                    disabled={!chatInput.trim()}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Participants Content */}
          {activeTab === 'participants' && (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Local User */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {userName} <span style={{ color: 'var(--text-secondary)' }}>(You)</span>
                    {isHost && <Shield size={14} color="var(--accent-base)" title="Host" />}
                  </span>
                </div>
                <button 
                  onClick={() => setPinnedUserId('local')}
                  style={{ padding: '8px', borderRadius: '8px', backgroundColor: pinnedUserId === 'local' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
                  title="Pin Video"
                >
                  <Pin size={16} color={pinnedUserId === 'local' ? 'var(--text-primary)' : 'var(--text-secondary)'} />
                </button>
              </div>
              
              {/* Remote Users */}
              {participants.map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={16} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {isHost && (
                      <button 
                        onClick={() => kickUser(p.token)}
                        style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                        title="Kick User"
                      >
                        <UserMinus size={16} color="#ef4444" />
                      </button>
                    )}
                    <button 
                      onClick={() => setPinnedUserId(p.id)}
                      style={{ padding: '8px', borderRadius: '8px', backgroundColor: pinnedUserId === p.id ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
                      title="Pin Video"
                    >
                      <Pin size={16} color={pinnedUserId === p.id ? 'var(--text-primary)' : 'var(--text-secondary)'} />
                    </button>
                    <button 
                      onClick={() => handleDirectMessageClick(p.id, p.name)}
                      style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                      title="Direct Message"
                    >
                      <MessageSquare size={16} color="var(--text-secondary)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Video Feeds */}
      <div style={{ 
        position: 'absolute', 
        bottom: isMobile ? '90px' : '110px', 
        left: isMobile ? 0 : '32px', 
        width: isMobile ? '100vw' : 'auto',
        maxWidth: isMobile ? '100vw' : 'calc(100vw - 400px)',
        zIndex: 20,
        display: 'flex', gap: isMobile ? '12px' : '16px', 
        overflowX: 'auto', 
        padding: isMobile ? '0 16px 8px 16px' : '0 0 8px 0',
        opacity: (showUI && !showPanel) || (showUI && !isMobile) ? 1 : 0, 
        transition: 'opacity 0.5s ease', 
        pointerEvents: (showUI && !showPanel) || (showUI && !isMobile) ? 'auto' : 'none'
      }}>
        {localStream && pinnedUserId !== 'local' && (
          <div style={{ width: isMobile ? '160px' : '220px', height: isMobile ? '100px' : '140px', flexShrink: 0 }}>
            <VideoFeed 
              stream={localStream} 
              isLocal={true} 
              name={userName} 
              muted={true} 
              onPin={() => setPinnedUserId('local')} 
            />
          </div>
        )}
        {Object.entries(remoteStreams).map(([streamUserId, stream]) => {
          if (streamUserId === pinnedUserId) return null;
          return (
            <div key={streamUserId} style={{ width: isMobile ? '160px' : '220px', height: isMobile ? '100px' : '140px', flexShrink: 0 }}>
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

      {/* Floating Control Dock */}
      <div className="glass-panel" style={{ 
        position: 'absolute', bottom: isMobile ? '16px' : '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 30,
        display: 'flex', gap: isMobile ? '12px' : '16px', 
        padding: isMobile ? '8px 16px' : '12px 24px', 
        borderRadius: '24px',
        opacity: (showUI && !showPanel) || (showUI && !isMobile) ? 1 : 0, 
        transition: 'opacity 0.5s ease', 
        pointerEvents: (showUI && !showPanel) || (showUI && !isMobile) ? 'auto' : 'none'
      }}>
        <button className={`btn-icon ${!audioEnabled ? 'danger' : ''}`} onClick={handleToggleAudio} style={isMobile ? {width:'36px', height:'36px'} : {}}>
          {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button className={`btn-icon ${!videoEnabled ? 'danger' : ''}`} onClick={handleToggleVideo} style={isMobile ? {width:'36px', height:'36px'} : {}}>
          {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        {!isMobile && (
          <button className="btn-icon" onClick={startScreenShare} title="Share Screen">
            <MonitorUp size={18} />
          </button>
        )}
        <div style={{ width: '1px', backgroundColor: 'var(--glass-border)', margin: '0 4px' }} />
        <button className="btn-icon" onClick={toggleRecording} title={isRecording ? "Stop Recording" : "Record Session"} style={isMobile ? {width:'36px', height:'36px'} : {}}>
          <Circle size={18} fill={isRecording ? "var(--danger-base)" : "none"} color={isRecording ? "var(--danger-base)" : "var(--text-primary)"} />
        </button>
      </div>

    </div>
  );
};

export default Room;
