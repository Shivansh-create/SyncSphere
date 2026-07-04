import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MonitorPlay, Radio, MessageSquare, Zap, CheckCircle2 } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState(location.state?.message || '');
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (toast) {
      // Clear the router state so it doesn't persist on page refresh
      window.history.replaceState({}, document.title);
      const t = setTimeout(() => setToast(''), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <div className="ambient-bg" style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Cinematic Vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0%, rgba(5,5,5,0.85) 100%)', zIndex: 0 }} />

      {/* Navbar */}
      <div style={{ position: 'relative', zIndex: 10, padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MonitorPlay size={28} color="var(--accent-base)" />
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '2px', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SYNCOSPHERE
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '80px 16px 40px 16px' : '120px 20px 80px 20px', zIndex: 10 }}>
        
        <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '8px 20px', borderRadius: '100px', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: isMobile ? '16px' : '24px', display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(10px)' }}>
          <Zap size={14} color="var(--accent-base)" />
          <span style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: '700', letterSpacing: '1px' }}>VERSION 2.0 IS LIVE</span>
        </div>

        <h1 style={{ fontSize: isMobile ? 'clamp(32px, 8vw, 42px)' : 'clamp(32px, 5vw, 64px)', fontWeight: '800', textAlign: 'center', margin: '0 0 20px 0', lineHeight: '1.1', maxWidth: '800px', letterSpacing: '-0.5px' }}>
          Experience Movies Together, <br/>
          <span style={{ background: 'linear-gradient(135deg, var(--accent-base), #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            No Matter The Distance.
          </span>
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '14px' : 'clamp(15px, 1.5vw, 18px)', textAlign: 'center', maxWidth: '650px', lineHeight: '1.6', marginBottom: isMobile ? '32px' : '40px', padding: isMobile ? '0 10px' : '0' }}>
          SyncSphere is a real-time watch party platform. Paste a YouTube link or upload a local file, and watch perfectly synced with your friends while chatting face-to-face over WebRTC.
        </p>

        <button 
          className="btn-primary" 
          onClick={() => navigate('/app')}
          style={{ padding: isMobile ? '14px 32px' : '16px 40px', fontSize: isMobile ? '15px' : '16px', letterSpacing: '1px', borderRadius: '100px', boxShadow: '0 10px 40px var(--accent-glow)', width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '300px' : 'none' }}
        >
          <MonitorPlay size={20} style={{ marginRight: '12px' }} />
          Watch together now!
        </button>

        {/* Feature Cards */}
        <div style={{ display: 'flex', gap: isMobile ? '16px' : '24px', marginTop: isMobile ? '60px' : '80px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px', width: '100%' }}>
          
          <div className="glass-panel" style={{ flex: '1 1 280px', padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Zap size={20} color="var(--accent-base)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px' }}>Millisecond Sync</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '14px' }}>
              Our dedicated YouTube engine and local file parsers ensure that when you pause, everyone pauses. Perfectly synced.
            </p>
          </div>

          <div className="glass-panel" style={{ flex: '1 1 280px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Radio size={20} color="var(--accent-base)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px' }}>WebRTC Video & Audio</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '14px' }}>
              See their reactions in real-time. High-fidelity audio and video streaming built directly into the theater experience.
            </p>
          </div>

          <div className="glass-panel" style={{ flex: '1 1 280px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <MessageSquare size={20} color="var(--accent-base)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', letterSpacing: '0.5px' }}>Private Whispers</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '14px' }}>
              Need to say something without interrupting the movie? Pin anyone's video to instantly send them a private direct message.
            </p>
          </div>

        </div>

      </div>

      {/* Toast Popup */}
      {toast && (
        <div className="fade-in" style={{ 
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', 
          background: 'linear-gradient(135deg, var(--accent-base), var(--accent-hover))', 
          backdropFilter: 'blur(10px)',
          color: '#fff', padding: '14px 24px', borderRadius: '100px', zIndex: 100, 
          boxShadow: '0 10px 30px var(--accent-glow)', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <CheckCircle2 size={18} color="#fff" />
          {toast}
        </div>
      )}

    </div>
  );
};

export default Landing;
