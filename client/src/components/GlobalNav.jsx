import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Compass, PlayCircle, HardDrive, CreditCard, MonitorPlay, Shield, Sun, Moon, Laptop } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';

const GlobalNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isJoined } = useRoomStore();
  const { theme, setTheme } = useAuthStore();

  const [regionDisplay, setRegionDisplay] = useState('Detecting...');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const city = res.data.city || res.data.locality || 'Unknown City';
            setRegionDisplay(`${city}`);
          } catch (err) {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setRegionDisplay(tz.split('/')[1]?.replace('_', ' ') || tz);
          }
        },
        () => {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setRegionDisplay(tz.split('/')[1]?.replace('_', ' ') || tz);
        }
      );
    } else {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setRegionDisplay(tz.split('/')[1]?.replace('_', ' ') || tz);
    }

    return () => clearInterval(timer);
  }, []);

  // Determine active segment based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'hub';
    if (path.startsWith('/syncsphere') || path.startsWith('/app') || path.startsWith('/room')) return 'task1';
    if (path.startsWith('/vault') || path.startsWith('/auth') || path.startsWith('/dashboard')) return 'task2';
    if (path.startsWith('/pricing')) return 'task3';
    if (path.startsWith('/player-demo')) return 'task4';
    if (path.startsWith('/security-demo')) return 'task5';
    return null;
  };

  const activeTab = getActiveTab();

  const tabs = [
    { id: 'hub', label: 'Hub', icon: Compass, path: '/' },
    { id: 'task1', label: 'SyncSphere', icon: PlayCircle, path: '/syncsphere' },
    { id: 'task2', label: 'Video Vault', icon: HardDrive, path: '/vault' },
    { id: 'task3', label: 'Billing', icon: CreditCard, path: '/pricing' },
    { id: 'task4', label: 'Player', icon: MonitorPlay, path: '/player-demo' },
    { id: 'task5', label: 'Security', icon: Shield, path: '/security-demo' },
  ];

  // Hide the global nav entirely when inside an active Watch Party room
  if (isJoined || location.pathname.startsWith('/room')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '16px' : '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      padding: '6px',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--glass-border)',
      borderRadius: '100px',
      boxShadow: '0 8px 32px var(--glass-shadow)',
      gap: '4px'
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: isMobile ? '8px 12px' : '10px 20px',
              borderRadius: '100px',
              border: 'none',
              cursor: 'pointer',
              background: isActive 
                ? 'linear-gradient(90deg, rgba(168, 85, 247, 0.2), rgba(56, 189, 248, 0.2))' 
                : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? '700' : '500',
              fontSize: isMobile ? '13px' : '14px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive ? 'inset 0 0 0 1px var(--glass-border)' : 'none'
            }}
            onMouseOver={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--glass-hover)';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <Icon size={isMobile ? 16 : 18} color={isActive ? (tab.id === 'task1' ? '#a855f7' : tab.id === 'task2' ? '#38bdf8' : tab.id === 'task5' ? '#10b981' : '#fff') : 'currentColor'} />
            {(!isMobile || isActive) && <span>{tab.label}</span>}
          </button>
        );
      })}

      {/* Live Geofenced Clock */}
      <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 4px' }} />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 8px', color: 'var(--text-primary)'
      }}>
        <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          {regionDisplay}
        </div>
        <div style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'monospace' }}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Manual Theme Override Toggle */}
      <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 4px' }} />
      <button
        onClick={() => {
          if (theme === 'auto') setTheme('light');
          else if (theme === 'light') setTheme('dark');
          else setTheme('auto');
        }}
        title={`Theme: ${theme.toUpperCase()}`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: isMobile ? '32px' : '38px', height: isMobile ? '32px' : '38px',
          borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--glass-hover)',
          color: 'var(--text-primary)', transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'var(--glass-border-hover)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
      >
        {theme === 'light' ? <Sun size={18} color="#eab308" /> : 
         theme === 'dark' ? <Moon size={18} color="#38bdf8" /> : 
         <Laptop size={18} color="#a3a3a3" />}
      </button>

    </div>
  );
};

export default GlobalNav;
