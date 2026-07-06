import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Users, DownloadCloud, CreditCard, Shield, Activity, Zap, MonitorPlay } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuthStore } from '../store/useAuthStore';

const Hub = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="ambient-bg" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Cinematic Vignette */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0%, var(--bg-base) 100%)', zIndex: 0 }} />

      {/* Navbar Minimal */}
      <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '80px 20px 16px' : '100px 48px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800', letterSpacing: '2px', background: 'linear-gradient(to right, var(--text-primary), var(--accent-base))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            INTERNSHIP PORTFOLIO
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : '40px', gap: '40px' }}>
        
        <div style={{ textAlign: 'center', maxWidth: '600px' }} className="fade-in">
          <h1 style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
            Select a Project Task
          </h1>
          <p style={{ fontSize: isMobile ? '16px' : '18px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
            Welcome to the centralized hub. Select which part of the web application you'd like to evaluate.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '24px', width: '100%', maxWidth: '1200px' }}>
        
        {/* Task 1 Card */}
        <div 
          className="glass-panel fade-in" 
          style={{ padding: isMobile ? '32px 24px' : '40px', display: 'flex', flexDirection: 'column', gap: '24px', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s' }}
          onClick={() => navigate('/app')}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(168, 85, 247, 0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px var(--glass-shadow), inset 0 1px 0 var(--glass-shadow-inset)'; }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.1))', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MonitorPlay size={32} color="var(--accent-base)" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-base)', letterSpacing: '1px', textTransform: 'uppercase' }}>Task 1</span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>SyncSphere</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              A Real-Time Watch Party Platform. Create rooms, invite friends, and watch videos perfectly synchronized together.
            </p>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
            Launch Task 1 <ArrowRight size={18} />
          </div>
        </div>

        {/* Task 2 Card */}
        <div 
          className="glass-panel fade-in" 
          style={{ padding: isMobile ? '32px 24px' : '40px', display: 'flex', flexDirection: 'column', gap: '24px', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s', animationDelay: '0.1s' }}
          onClick={() => navigate('/vault')}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(56, 189, 248, 0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px var(--glass-shadow), inset 0 1px 0 var(--glass-shadow-inset)'; }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.1))', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DownloadCloud size={32} color="#38bdf8" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase' }}>Task 2</span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Video Vault</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              Secure Media Dashboard. Dynamic thumbnail extraction, quota management, and persistent download history.
            </p>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
            Launch Task 2 <ArrowRight size={18} />
          </div>
        </div>

        {/* Task 3 Card */}
        <div 
          className="glass-panel fade-in" 
          style={{ padding: isMobile ? '32px 24px' : '40px', display: 'flex', flexDirection: 'column', gap: '24px', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s', animationDelay: '0.2s' }}
          onClick={() => navigate('/pricing')}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px var(--glass-shadow), inset 0 1px 0 var(--glass-shadow-inset)'; }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={32} color="#10b981" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase' }}>Task 3</span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Razorpay Billing</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              Test integration of a complete SaaS checkout flow. Purchase plans securely and receive automated HTML email invoices.
            </p>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
            Launch Task 3 <ArrowRight size={18} />
          </div>
        </div>

        {/* Task 4 Card */}
        <div 
          className="glass-panel fade-in" 
          style={{ padding: isMobile ? '32px 24px' : '40px', display: 'flex', flexDirection: 'column', gap: '24px', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s', animationDelay: '0.3s' }}
          onClick={() => navigate('/player-demo')}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px var(--glass-shadow), inset 0 1px 0 var(--glass-shadow-inset)'; }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 40, 217, 0.1))', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MonitorPlay size={32} color="#8b5cf6" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '1px', textTransform: 'uppercase' }}>Task 4</span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Cinematic Player</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              Custom video player overlay with gesture controls, seamless scrubbing, and global queue sync.
            </p>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
            Test Player <ArrowRight size={18} />
          </div>
        </div>

        {/* Task 5 Card */}
        <div 
          className="glass-panel fade-in" 
          style={{ padding: isMobile ? '32px 24px' : '40px', display: 'flex', flexDirection: 'column', gap: '24px', cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s', animationDelay: '0.4s' }}
          onClick={() => navigate('/security-demo')}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.2)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px var(--glass-shadow), inset 0 1px 0 var(--glass-shadow-inset)'; }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={32} color="#10b981" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase' }}>Task 5</span>
            <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Security & UX</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
              Time-based Light/Dark themes and geospatial device fingerprinting with OTP validation.
            </p>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
            Test Security <ArrowRight size={18} />
          </div>
        </div>

      </div>
      </div>
    </div>
  );
};

export default Hub;
