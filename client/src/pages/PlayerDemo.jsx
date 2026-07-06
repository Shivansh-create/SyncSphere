import React, { useEffect } from 'react';
import SyncPlayer from '../components/SyncPlayer';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store/useRoomStore';

const PlayerDemo = () => {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#000' }}>
      
      {/* Back Button Overlay */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 100 }}>
        <button 
          onClick={() => navigate('/')}
          className="glass-panel"
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.5)' }}
        >
          <ArrowLeft size={16} /> Back to Hub
        </button>
      </div>

      <SyncPlayer initialVideoUrl="http://localhost:3001/static/videos/Video%201.mp4" />
    </div>
  );
};

export default PlayerDemo;
