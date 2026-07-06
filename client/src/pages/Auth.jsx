import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, UserPlus, ArrowRight, X, DownloadCloud } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useMediaQuery } from '../hooks/useMediaQuery';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const [localError, setLocalError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // If already authenticated, redirect to origin or dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setLocalLoading(true);
    
    try {
      import('axios').then(async (axios) => {
        try {
          const endpoint = isLogin ? '/auth/login-secure' : '/auth/register-secure';
          const res = await axios.default.post(endpoint, { email, password });
          
          if (res.data.requireOtp) {
            setFingerprint(res.data.fingerprint);
            setPreviewUrl(res.data.previewUrl || null);
            setShowOtp(true);
          } else {
            // Already trusted
            const { token, user } = res.data;
            localStorage.setItem('syncsphere_auth_token', token);
            axios.default.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            useAuthStore.setState({ user, token, isAuthenticated: true, error: null });
          }
        } catch (err) {
          setLocalError(err.response?.data?.error || 'Authentication failed');
        } finally {
          setLocalLoading(false);
        }
      });
    } catch (err) {
      setLocalLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setLocalLoading(true);
    
    try {
      import('axios').then(async (axios) => {
        try {
          const res = await axios.default.post('/auth/verify-otp', { email, otp, fingerprint });
          const { token, user } = res.data;
          localStorage.setItem('syncsphere_auth_token', token);
          axios.default.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          useAuthStore.setState({ user, token, isAuthenticated: true, error: null });
        } catch (err) {
          setLocalError(err.response?.data?.error || 'Invalid OTP');
        } finally {
          setLocalLoading(false);
        }
      });
    } catch (err) {
      setLocalLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setLocalError(null);
    setEmail('');
    setPassword('');
    setShowOtp(false);
    setOtp('');
  };

  return (
    <div className="ambient-bg" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Cinematic Vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0%, var(--bg-base) 100%)', zIndex: 0 }} />

      {/* Navbar Minimal */}
      <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '80px 20px 16px' : '100px 48px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/vault')}>
          <DownloadCloud size={isMobile ? 24 : 28} color="#38bdf8" />
          <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800', letterSpacing: '2px', color: '#38bdf8' }}>
            VIDEO VAULT
          </span>
        </div>
        <button 
          className="btn-icon" 
          onClick={() => navigate('/vault')}
          title="Back to Vault"
          style={{ width: isMobile ? '36px' : '44px', height: isMobile ? '36px' : '44px' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : '40px', zIndex: 10 }}>
        
        <div className="glass-panel fade-in" style={{ 
          width: '100%', 
          maxWidth: '440px', 
          padding: isMobile ? '32px 24px' : '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '20px', 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.1))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.2)'
            }}>
              {isLogin ? <LogIn size={32} color="var(--accent-base)" /> : <UserPlus size={32} color="var(--accent-base)" />}
            </div>
            <h1 style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              {showOtp ? 'Verify Device' : (isLogin ? 'Welcome Back' : 'Create Account')}
            </h1>
            {!showOtp && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>
                {isLogin ? 'Sign in to manage your Video Vault quotas and downloads.' : 'Join Video Vault to securely download premium media.'}
              </p>
            )}
          </div>

          {(error || localError) && (
            <div className="fade-in" style={{ 
              padding: '14px 16px', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ width: '4px', height: '16px', backgroundColor: '#ef4444', borderRadius: '4px' }} />
              {error || localError}
            </div>
          )}

          {showOtp ? (
            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', textAlign: 'center' }}>
                We've sent a 6-digit verification code to your email. Please verify to continue.
              </p>
              
              {previewUrl && (
                <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '600' }}>[DEV MODE] Test Email Sent: </span>
                  <a href={previewUrl} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: 'var(--text-primary)', textDecoration: 'underline' }}>
                    Click to view OTP
                  </a>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Enter 6-digit OTP"
                  className="input-field"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  style={{ paddingLeft: '44px', height: '52px', fontSize: '20px', letterSpacing: '4px', textAlign: 'center', fontWeight: '600' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={localLoading || otp.length !== 6}
                style={{ marginTop: '12px', height: '56px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {localLoading ? <div className="spin" style={{ width: '20px', height: '20px', border: '2px solid var(--glass-border-hover)', borderTopColor: 'var(--text-primary)', borderRadius: '50%' }} /> : (
                  <>Verify <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                placeholder="Email address"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '44px', height: '52px', fontSize: '15px' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                placeholder="Password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingLeft: '44px', height: '52px', fontSize: '15px' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={localLoading || !email || !password}
              style={{ 
                marginTop: '12px', 
                height: '56px',
                fontSize: '16px',
                letterSpacing: '0.5px',
                boxShadow: '0 10px 30px var(--accent-glow)'
              }}
            >
              {localLoading ? (
                <div style={{ width: '24px', height: '24px', border: '3px solid var(--glass-border-hover)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>
          )}

          {!showOtp && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button 
                onClick={toggleMode}
                style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  padding: '8px 16px',
                  borderRadius: '100px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
