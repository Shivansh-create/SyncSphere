import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Hub from './pages/Hub';
import Vault from './pages/Vault';
import AppEntry from './pages/AppEntry';
import Room from './pages/Room';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import PlayerDemo from './pages/PlayerDemo';
import SecurityDemo from './pages/SecurityDemo';
import GlobalNav from './components/GlobalNav';
import { useAuthStore } from './store/useAuthStore';
import { useEffect } from 'react';
import './App.css';

function App() {
  const { initAuth, theme } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Global Geofenced Theme Engine
  useEffect(() => {
    const applyTheme = () => {
      if (window.location.pathname.startsWith('/room')) {
        document.body.classList.toggle('light-theme', false);
        return;
      }

      let isLight = false;
      if (theme === 'light') isLight = true;
      else if (theme === 'dark') isLight = false;
      else {
        // Auto (Geofenced Daytime Detection)
        const hours = new Date().getHours();
        // Light theme only between 10 AM and 12 PM (noon)
        isLight = hours >= 10 && hours < 12;
      }
      document.body.classList.toggle('light-theme', isLight);
    };

    applyTheme();
    // Check every minute if in auto mode
    const timer = setInterval(applyTheme, 60000);
    return () => clearInterval(timer);
  }, [theme]);

  return (
    <Router>
      <div className="app-container">
        <GlobalNav />
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/syncsphere" element={<Landing />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/app" element={<AppEntry />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/player-demo" element={<PlayerDemo />} />
          <Route path="/security-demo" element={<SecurityDemo />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
