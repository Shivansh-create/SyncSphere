import React, { useEffect, useState } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { MonitorPlay, LogIn, Plus, Clock } from 'lucide-react';
import Room from './Room';
import { useMediaQuery } from '../hooks/useMediaQuery';
import '../App.css';

function AppEntry() {
  const { initSocket, isJoined, isWaiting, joinRoom, leaveRoom, userName, setUserName } = useRoomStore();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [hasAttemptedRejoin, setHasAttemptedRejoin] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    initSocket();
    
    const params = new URLSearchParams(window.location.search);
    const inviteRoomId = params.get('room');
    if (inviteRoomId && !roomIdInput) {
      setRoomIdInput(inviteRoomId);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const savedRoomId = sessionStorage.getItem('roomId');
    if (savedRoomId && !hasAttemptedRejoin) {
      joinRoom(savedRoomId);
      setHasAttemptedRejoin(true);
    }
  }, [initSocket, joinRoom, hasAttemptedRejoin, roomIdInput]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomIdInput.trim() && userName.trim()) {
      joinRoom(roomIdInput.trim());
    }
  };

  const handleCreate = () => {
    if (!userName.trim()) return;
    const newRoomId = Math.random().toString(36).substring(2, 9);
    joinRoom(newRoomId);
  };

  if (isWaiting) {
    return (
      <div className="ambient-bg" style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0%, rgba(5,5,5,0.85) 100%)', zIndex: 0 }} />
        <div className="fade-in glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', zIndex: 10, maxWidth: '340px' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '50%', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
             <Clock size={40} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '24px', margin: 0, textAlign: 'center' }}>Waiting for Host...</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>
            You have been placed in the waiting room. The host must approve your entry before you can join.
          </p>
          <button className="btn-secondary" onClick={() => { leaveRoom(); window.location.href='/'; }} style={{ marginTop: '10px' }}>
            Cancel Request
          </button>
        </div>
      </div>
    );
  }

  if (isJoined) {
    return <Room />;
  }

  return (
    <div className="ambient-bg" style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Cinematic Vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0%, rgba(5,5,5,0.85) 100%)', zIndex: 0 }} />
      
      <div className="fade-in" style={{ width: '100%', maxWidth: '400px', zIndex: 10, padding: isMobile ? '0 16px' : '0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--accent-base)', borderRadius: '16px', boxShadow: '0 0 20px var(--accent-glow)' }}>
              <MonitorPlay size={isMobile ? 28 : 32} color="#fff" />
            </div>
            <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '800', letterSpacing: '-1px', margin: 0, background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SyncSphere
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '14px' : '16px', margin: 0 }}>Create a theater or join a friend.</p>
        </div>

        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: isMobile ? '20px' : '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
          
          <div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter your display name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoFocus
              style={{ textAlign: 'center', fontSize: '16px', padding: isMobile ? '14px 12px' : '18px 16px', letterSpacing: '1px' }}
            />
          </div>

          <form onSubmit={handleJoin} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Paste Room Code"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              style={{ flex: 1, textTransform: 'uppercase', textAlign: 'center', padding: isMobile ? '14px 12px' : '18px 16px', fontSize: '16px', letterSpacing: '2px' }}
              maxLength={7}
            />
            <button type="submit" className="btn-secondary" disabled={!roomIdInput.trim() || !userName.trim()} style={{ width: isMobile ? '60px' : '70px', padding: 0 }}>
              <LogIn size={20} />
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--glass-border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '1px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--glass-border)' }} />
          </div>

          <button onClick={handleCreate} className="btn-primary" style={{ width: '100%', fontSize: '16px', letterSpacing: '1px', padding: isMobile ? '14px 12px' : '18px 16px', fontWeight: '700' }} disabled={!userName.trim()}>
            <Plus size={20} />
            Create Theater
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppEntry;
