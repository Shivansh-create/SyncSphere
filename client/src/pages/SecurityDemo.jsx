import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, Sun, Moon, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { useMediaQuery } from '../hooks/useMediaQuery';

const SecurityDemo = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { theme, setTheme } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  
  // OTP Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!isLogin) {
      // Registration Flow
      try {
        const res = await axios.post('/auth/register-secure', { email, password });
        if (res.data.requireOtp) {
          setFingerprint(res.data.fingerprint);
          setPreviewUrl(res.data.previewUrl || null);
          setShowOtp(true);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      // Hit the isolated Task 5 endpoint
      const res = await axios.post('/auth/login-secure', { email, password });
      
      if (res.data.requireOtp) {
        setFingerprint(res.data.fingerprint);
        setPreviewUrl(res.data.previewUrl || null);
        setShowOtp(true);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await axios.post('/auth/verify-otp', { email, otp, fingerprint });
      if (res.data.token) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isLight = theme === 'light' || (theme === 'auto' && new Date().getHours() >= 10 && new Date().getHours() < 12);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: isLight ? '#f8fafc' : '#050505',
      color: isLight ? '#0f172a' : '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      transition: 'background 0.5s ease, color 0.5s ease',
      overflowX: 'hidden'
    }}>
      
      {/* Background Mesh */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isLight 
          ? 'radial-gradient(circle at 0% 0%, #e0e7ff 0%, transparent 50%), radial-gradient(circle at 100% 100%, #c7d2fe 0%, transparent 50%)'
          : 'radial-gradient(circle at 0% 0%, #1e1b4b 0%, transparent 50%), radial-gradient(circle at 100% 100%, #312e81 0%, transparent 50%)',
        opacity: 0.8,
        zIndex: 0,
        pointerEvents: 'none',
        transition: 'background 0.5s ease'
      }} />

      {/* Navbar */}
      <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '24px' : '40px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: 'transparent', border: 'none', 
            color: isLight ? '#475569' : '#94a3b8', 
            cursor: 'pointer', fontSize: '15px', fontWeight: '600' 
          }}
        >
          <ArrowLeft size={20} /> Back to Hub
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '100px' }}>
          <Clock size={16} color={isLight ? '#4f46e5' : '#8b5cf6'} />
          <button 
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            style={{ 
              marginLeft: '8px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: isLight ? '#0f172a' : '#fff'
            }}
            title="Override Theme for Demo"
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : '40px', zIndex: 10 }}>
        
        <div style={{ 
          width: '100%', 
          maxWidth: '440px', 
          padding: isMobile ? '32px 24px' : '48px 40px',
          background: isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 15, 20, 0.45)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '24px',
          boxShadow: isLight ? '0 20px 40px rgba(0,0,0,0.05)' : '0 20px 40px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative',
          transition: 'all 0.5s ease'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ 
              width: '64px', height: '64px', borderRadius: '20px', 
              background: isLight ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(67, 56, 202, 0.1))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
              border: `1px solid ${isLight ? 'rgba(79, 70, 229, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: isLight ? '0 10px 25px rgba(79, 70, 229, 0.2)' : '0 10px 25px rgba(16, 185, 129, 0.2)'
            }}>
              <Shield size={32} color={isLight ? "#4f46e5" : "#10b981"} />
            </div>
            <h1 style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              {success ? 'Verified' : (showOtp ? 'Device OTP' : (isLogin ? 'Secure Sign In' : 'Create Account'))}
            </h1>
            <p style={{ color: isLight ? '#475569' : '#94a3b8', fontSize: '15px', lineHeight: '1.5' }}>
              {success ? 'Your device is now securely registered.' : (showOtp ? 'A new device was detected. Please enter the code sent to your email.' : (isLogin ? 'Sign in to access your secure media vault.' : 'Create an account to test the security features.'))}
            </p>
          </div>

          {error && (
            <div style={{ 
              padding: '14px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px',
              color: '#ef4444', fontSize: '14px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <div style={{ width: '4px', height: '16px', backgroundColor: '#ef4444', borderRadius: '4px' }} />
              {error}
            </div>
          )}

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                <Lock size={24} color="#fff" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Security Demo Passed</h2>
              <button 
                onClick={() => { setSuccess(false); setShowOtp(false); }}
                style={{ marginTop: '20px', background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '10px 20px', borderRadius: '100px', cursor: 'pointer', fontWeight: '600' }}
              >
                Reset Demo
              </button>
            </div>
          ) : showOtp ? (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {previewUrl && (
                <div style={{ padding: '12px', background: isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${isLight ? 'rgba(79, 70, 229, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', color: isLight ? '#4f46e5' : '#10b981', fontWeight: '600' }}>[DEV MODE] Test Email Sent: </span>
                  <a href={previewUrl} target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: isLight ? '#0f172a' : '#fff', textDecoration: 'underline' }}>
                    Click to view OTP
                  </a>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <Lock size={18} color={isLight ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  style={{ 
                    width: '100%', padding: '0 44px', height: '52px', fontSize: '20px', letterSpacing: '4px', textAlign: 'center', fontWeight: '700',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: isLight ? '#0f172a' : '#fff'
                  }}
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading || otp.length !== 6}
                style={{ 
                  height: '56px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: isLight ? '#4f46e5' : '#10b981', color: '#fff', border: 'none', boxShadow: isLight ? '0 10px 25px rgba(79, 70, 229, 0.3)' : '0 10px 25px rgba(16, 185, 129, 0.2)'
                }}
              >
                {isLoading ? 'Verifying...' : 'Verify Device'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color={isLight ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ 
                    width: '100%', paddingLeft: '44px', height: '52px', fontSize: '15px', fontWeight: '500',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: isLight ? '#0f172a' : '#fff'
                  }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color={isLight ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ 
                    width: '100%', paddingLeft: '44px', height: '52px', fontSize: '15px', fontWeight: '500',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: isLight ? '#0f172a' : '#fff'
                  }}
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading || !email || !password}
                style={{ 
                  height: '56px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: isLight ? '#4f46e5' : '#10b981', color: '#fff', border: 'none', boxShadow: isLight ? '0 10px 25px rgba(79, 70, 229, 0.3)' : '0 10px 25px rgba(16, 185, 129, 0.2)'
                }}
              >
                {isLoading ? (isLogin ? 'Scanning Device...' : 'Creating...') : (isLogin ? 'Secure Login' : 'Create Account')}
              </button>

              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <button 
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(null); }}
                  style={{ 
                    color: isLight ? '#64748b' : '#94a3b8', 
                    fontSize: '14px', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer'
                  }}
                >
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default SecurityDemo;
