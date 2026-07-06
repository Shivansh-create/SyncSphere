import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  LogOut, Crown, Download, History, Home, Clock, AlertCircle, Search, DownloadCloud
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useMediaQuery } from '../hooks/useMediaQuery';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuthStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [quota, setQuota] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: '/dashboard' } } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, page, searchQuery]); 

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [quotaRes, historyRes] = await Promise.all([
        axios.get('/downloads/quota'),
        axios.get(`/downloads/history?page=${page}&limit=6&search=${searchQuery}`)
      ]);
      
      setQuota(quotaRes.data);
      setHistory(historyRes.data.data);
      setPagination(historyRes.data.pagination);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (authLoading || (!isAuthenticated && loading)) {
    return (
      <div className="ambient-bg" style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-base)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await axios.post('/auth/upgrade');
      await fetchDashboardData(); // Refresh the dashboard with new unlimited quotas
    } catch (error) {
      console.error('Error upgrading:', error);
      alert('Failed to upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ambient-bg" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      
      {/* Cinematic Vignette */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0%, var(--bg-base) 100%)', zIndex: 0 }} />
      
      {/* Navbar Minimal */}
      <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '80px 20px 16px' : '100px 48px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/vault')}>
          <DownloadCloud size={isMobile ? 24 : 28} color="#38bdf8" />
          <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800', letterSpacing: '2px', color: '#38bdf8' }}>
            VIDEO VAULT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <div style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-base), var(--accent-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: isMobile ? '14px' : '16px', boxShadow: '0 4px 12px var(--accent-glow)' }}>
              {user?.email?.[0].toUpperCase()}
            </div>
            {!isMobile && <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>{user?.email}</span>}
          </div>
          <button className="btn-secondary" onClick={handleLogout} style={{ padding: isMobile ? '6px 12px' : '8px 16px', borderRadius: '100px', fontSize: '14px' }}>
            <LogOut size={16} />
            {!isMobile && <span style={{ marginLeft: '8px' }}>Log Out</span>}
          </button>
        </div>
      </div>

      <main className="fade-in" style={{ position: 'relative', zIndex: 10, flex: 1, width: '100%', maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '10px 16px 40px' : '20px 48px 60px', display: 'flex', flexDirection: 'column', gap: isMobile ? '20px' : '32px' }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Vault Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: isMobile ? '14px' : '16px' }}>Manage your account, view quotas, and securely manage your media downloads.</p>
        </div>

        {/* Top Widgets Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: isMobile ? '24px' : '32px' }}>
          
          {/* Subscription Widget */}
          <div className="glass-panel" style={{ padding: isMobile ? '20px' : '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '16px', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <Crown size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Current Plan</h3>
              </div>
              <span style={{ 
                padding: '6px 14px', 
                borderRadius: '100px', 
                fontSize: '13px', 
                fontWeight: '700',
                letterSpacing: '0.5px',
                background: quota?.currentPlan === 'FREE' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--accent-base), #c084fc)',
                color: 'white',
                boxShadow: quota?.currentPlan !== 'FREE' ? '0 4px 15px rgba(168, 85, 247, 0.3)' : 'none'
              }}>
                {quota?.currentPlan || 'FREE'}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '42px', fontWeight: '800' }}>{quota?.isUnlimited ? 'Unlimited' : quota?.dailyLimit}</h2>
              <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Downloads allowed per day</span>
            </div>
            
            {quota?.currentPlan === 'FREE' && (
              <button onClick={handleUpgrade} className="btn-primary" style={{ width: '100%', marginTop: 'auto', padding: '14px', borderRadius: '100px', fontSize: '15px' }}>
                <Crown size={18} style={{ marginRight: '8px' }} />
                Upgrade to Premium
              </button>
            )}
          </div>

          {/* Quota Widget */}
          <div className="glass-panel" style={{ padding: isMobile ? '20px' : '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <Download size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Daily Quota</h3>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '42px', fontWeight: '800' }}>
                {quota?.isUnlimited ? '∞' : quota?.remainingDownloads} 
              </h2>
              <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Remaining downloads today</span>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                {!quota?.isUnlimited && (
                  <div style={{ 
                    height: '100%', 
                    width: `${(quota?.downloadsUsedToday / quota?.dailyLimit) * 100}%`,
                    background: 'linear-gradient(90deg, var(--accent-base), #38bdf8)',
                    borderRadius: '100px',
                    boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
                  }} />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>
                <Clock size={14} color="#60a5fa" />
                <span>Resets at {quota?.nextQuotaReset ? format(new Date(quota.nextQuotaReset), 'h:mm a') : 'Midnight'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download History Section */}
        <div className="glass-panel" style={{ padding: isMobile ? '20px' : '32px' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <History size={24} color="var(--accent-base)" />
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Download History</h2>
            </div>

            <div style={{ position: 'relative', width: isMobile ? '100%' : '260px' }}>
              <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search videos..."
                className="input-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '44px', height: '44px', borderRadius: '100px', fontSize: '14px' }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-base)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '80px 0', color: 'var(--text-secondary)' }}>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }}>
                <AlertCircle size={40} style={{ opacity: 0.6 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '18px' }}>No downloads found</h3>
                <p style={{ margin: 0, fontSize: '15px' }}>{searchQuery ? "No matches found for your search term." : "Join a watch party and download videos to see them here."}</p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '32px' }}>
                {history.map((item) => (
                  <div key={item.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: '16/9', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      backgroundImage: `url(${item.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                        {item.title}
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {format(new Date(item.downloadedAt), 'MMM d, yyyy')}
                        </span>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '100px', 
                          background: 'rgba(168, 85, 247, 0.1)', 
                          color: '#d8b4fe',
                          fontSize: '11px',
                          fontWeight: '700',
                          letterSpacing: '0.5px'
                        }}>
                          {item.planAtTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
                  <button 
                    className="btn-secondary" 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '14px', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Page <span style={{ color: 'var(--text-primary)' }}>{page}</span> of {pagination.totalPages}
                  </span>
                  <button 
                    className="btn-secondary" 
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '14px', opacity: page === pagination.totalPages ? 0.5 : 1, cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
