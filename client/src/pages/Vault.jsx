import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Download, CheckCircle2, Film, Home, Lock, AlertCircle, FileVideo, HardDrive } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useMediaQuery } from '../hooks/useMediaQuery';

const Vault = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isAuthenticated, user } = useAuthStore();
  
  const [downloadMsg, setDownloadMsg] = useState(null);
  const [downloadingUrl, setDownloadingUrl] = useState(null);

  const [videosData, setVideosData] = useState([
    { id: 1, name: 'Official Video 1', filename: 'Video 1.mp4', thumbnail: null, duration: '...', size: '7.2 MB', format: 'MP4', isPremium: false },
    { id: 2, name: 'Official Video 2 (4K HDR)', filename: 'Video 2.mp4', thumbnail: null, duration: '...', size: '13.1 MB', format: 'MP4', isPremium: true },
    { id: 3, name: 'Official Video 3', filename: 'Video 3.mp4', thumbnail: null, duration: '...', size: '11.1 MB', format: 'MP4', isPremium: false },
    { id: 4, name: 'Official Video 4 (Extended Cut)', filename: 'Video 4.mp4', thumbnail: null, duration: '...', size: '15.0 MB', format: 'MP4', isPremium: true },
    { id: 5, name: 'Official Video 5', filename: 'Video 5.mp4', thumbnail: null, duration: '...', size: '17.6 MB', format: 'MP4', isPremium: false },
  ]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '/static/videos/');

    videosData.forEach((vid, index) => {
      const videoEl = document.createElement('video');
      videoEl.crossOrigin = 'anonymous';
      videoEl.preload = 'metadata';
      videoEl.src = baseUrl + encodeURIComponent(vid.filename);

      videoEl.onloadedmetadata = () => {
        const mins = Math.floor(videoEl.duration / 60);
        const secs = Math.floor(videoEl.duration % 60).toString().padStart(2, '0');
        
        setVideosData(prev => {
          const newArr = [...prev];
          newArr[index].duration = `${mins}:${secs}`;
          return newArr;
        });

        // Seek to 1.5 seconds to capture a frame (avoiding blank black frames at 0s)
        videoEl.currentTime = Math.min(1.5, videoEl.duration / 2);
      };

      videoEl.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth || 640;
        canvas.height = videoEl.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        
        setVideosData(prev => {
          const newArr = [...prev];
          newArr[index].thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          return newArr;
        });
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = async (video) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (video.isPremium && (!user || user.plan === 'FREE')) {
      setDownloadMsg({ text: 'Upgrade to Bronze or higher to unlock this Premium video.', type: 'error' });
      setTimeout(() => setDownloadMsg(null), 4000);
      return;
    }

    try {
      setDownloadingUrl(video.filename);
      setDownloadMsg(null);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const fileUrl = apiUrl.replace('/api', '/static/videos/') + encodeURIComponent(video.filename);

      const reqRes = await axios.post('/downloads/request', {
        videoUrl: fileUrl,
        videoTitle: video.name,
        thumbnailUrl: video.thumbnail
      });

      const { downloadUrl } = reqRes.data;

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch video file');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = video.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadMsg({ text: `Successfully downloaded ${video.filename}`, type: 'success' });
      setTimeout(() => setDownloadMsg(null), 4000);
    } catch (error) {
      const msg = error.response?.data?.error || 'Download failed';
      setDownloadMsg({ text: msg, type: 'error' });
      setTimeout(() => setDownloadMsg(null), 5000);
    } finally {
      setDownloadingUrl(null);
    }
  };

  return (
    <div className="ambient-bg" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Subtle Technical Grid Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(var(--glass-border) 1px, transparent 1px), linear-gradient(90deg, var(--glass-border) 1px, transparent 1px)', backgroundSize: '50px 50px', zIndex: 0, opacity: 0.5 }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0%, var(--bg-base) 100%)', zIndex: 1, opacity: 0.9 }} />

      {/* Navbar */}
      <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '80px 20px 16px' : '100px 48px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'var(--glass-bg)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-icon" onClick={() => navigate('/')} title="Back to Hub">
            <Home size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={22} color="#38bdf8" />
            <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '800', letterSpacing: '2px', color: '#38bdf8' }}>
              VIDEO VAULT
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
          >
            {isAuthenticated ? 'Manage Quotas' : 'Sign In'}
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, padding: isMobile ? '20px' : '40px 60px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        <div className="fade-in" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: '40px', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Official Media Assets</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 }}>
              Securely access and download high-quality official media files based on your subscription tier.
            </p>
          </div>
        </div>

        {downloadMsg && (
          <div className="fade-in" style={{ 
            marginBottom: '30px', padding: '16px', 
            backgroundColor: downloadMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
            border: `1px solid ${downloadMsg.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`, 
            borderRadius: '8px',
            color: downloadMsg.type === 'error' ? '#fca5a5' : '#86efac',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            {downloadMsg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span style={{ fontWeight: '500' }}>{downloadMsg.text}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '32px' }}>
          {videosData.map((video, index) => (
            <div 
              key={video.id} 
              className="glass-panel fade-in"
              style={{ 
                animationDelay: `${index * 0.05}s`,
                display: 'flex', flexDirection: 'column',
                padding: '16px', borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px var(--glass-shadow)'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              {/* Sleek Thumbnail */}
              <div style={{ 
                width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative',
                backgroundColor: 'var(--glass-hover)',
                marginBottom: '20px'
              }}>
                <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#111' }}>
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Film size={32} color="#333" />
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                    {video.duration}
                  </div>
                  {video.isPremium && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#8b5cf6', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                      <Lock size={12} /> PREMIUM
                    </div>
                  )}
                </div>
              </div>

              {/* Data & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{video.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <FileVideo size={14} />
                    <span>{video.filename}</span>
                    <span style={{ margin: '0 4px' }}>•</span>
                    <span>{video.size}</span>
                  </div>
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex' }}>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleDownload(video)}
                    disabled={downloadingUrl === video.filename}
                    style={{ 
                      width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px', fontWeight: '600',
                      backgroundColor: video.isPremium && (!user || user.plan === 'FREE') ? 'var(--glass-border-hover)' : 'var(--accent-base)',
                      color: video.isPremium && (!user || user.plan === 'FREE') ? 'var(--text-secondary)' : '#ffffff',
                      border: 'none',
                      cursor: video.isPremium && (!user || user.plan === 'FREE') ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {downloadingUrl === video.filename ? (
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : !isAuthenticated ? (
                      <Lock size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                    {downloadingUrl === video.filename ? 'Processing Download...' : !isAuthenticated ? 'Sign In to Download' : 'Download Asset'}
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Vault;
