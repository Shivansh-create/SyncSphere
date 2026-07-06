import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, Zap, Home, DownloadCloud } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

const plans = [
  {
    name: 'FREE',
    price: 0,
    features: ['1 Download/Day', 'Standard Watch Quality', 'Community Support'],
    buttonText: 'Downgrade to Free',
    highlight: false
  },
  {
    name: 'BRONZE',
    price: 0,
    features: ['5 Downloads/Day', 'Ad-Free Viewing', 'Email Support'],
    buttonText: 'Upgrade to Bronze',
    highlight: false
  },
  {
    name: 'SILVER',
    price: 0,
    features: ['20 Downloads/Day', 'Premium Support', 'Exclusive Content'],
    buttonText: 'Upgrade to Silver',
    highlight: true
  },
  {
    name: 'GOLD',
    price: 0,
    features: ['Unlimited Downloads', '24/7 Priority Support', '4K Watch Parties', 'Early Access Features'],
    buttonText: 'Upgrade to Gold',
    highlight: false
  }
];

const Pricing = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user, initAuth } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState('');

  useEffect(() => {
    // Load Razorpay Script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const [showMockModal, setShowMockModal] = useState(false);
  const [selectedPlanForMock, setSelectedPlanForMock] = useState(null);

  const handlePayment = async (plan) => {
    if (plan.name === 'FREE') return;
    if (loadingPlan) return;
    
    setSelectedPlanForMock(plan);
    setShowMockModal(true);
  };

  const executeMockPayment = async () => {
    setLoadingPlan(selectedPlanForMock.name);
    setShowMockModal(false);
    
    try {
      // 1. Hit backend to simulate order generation
      const orderRes = await axios.post('/payments/create-order', { planName: selectedPlanForMock.name }).catch(() => ({ data: { id: 'mock_order_123' } }));
      
      // 2. Instantly verify with mock bypass token
      const verifyRes = await axios.post('/payments/verify', {
        razorpay_order_id: orderRes.data?.id || 'mock_order_123',
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}`,
        razorpay_signature: 'mock_signature_for_testing',
        planName: selectedPlanForMock.name
      });

      if (verifyRes.data.success) {
        await initAuth();
        setInvoiceUrl(verifyRes.data.invoicePreviewUrl);
        alert(`Successfully upgraded to ${selectedPlanForMock.name} Plan! Invoice sent to email.`);
      }
    } catch (error) {
      console.error(error);
      alert('Mock Payment Failed. Contact Support.');
    } finally {
      setLoadingPlan(null);
      setSelectedPlanForMock(null);
    }
  };

  return (
    <div className="ambient-bg" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 0%, var(--bg-base) 100%)', zIndex: 0 }} />

      {/* Navbar */}
      <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '80px 20px 16px' : '100px 48px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-icon" onClick={() => navigate('/')} title="Back to Hub">
            <Home size={18} />
          </button>
          <span style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '800', letterSpacing: '2px', background: 'linear-gradient(to right, #fff, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PRICING & UPGRADES
          </span>
        </div>
      </div>

      <div className="fade-in" style={{ flex: 1, padding: isMobile ? '20px' : '40px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '600px' }}>
          <h1 style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: '800', margin: '0 0 16px 0', background: 'linear-gradient(135deg, var(--text-primary), var(--accent-base))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Unlock the Full Power of SyncSphere
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.6' }}>
            Current Plan: <strong style={{ color: 'var(--text-primary)' }}>{user?.plan || 'Loading...'}</strong>. Choose a premium tier below to unlock increased download quotas, 4K streaming, and ad-free viewing.
          </p>
          
          {invoiceUrl && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
              <p style={{ color: '#10b981', margin: '0 0 8px 0', fontWeight: '600' }}>Payment Successful!</p>
              <a href={invoiceUrl} target="_blank" rel="noreferrer" style={{ color: '#6ee7b7', textDecoration: 'underline' }}>
                View your Invoice Receipt here
              </a>
            </div>
          )}
        </div>

        {/* Pricing Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', maxWidth: '1200px', width: '100%' }}>
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className="glass-panel" 
              style={{ 
                flex: '1 1 250px', 
                maxWidth: '300px',
                padding: '32px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '24px',
                border: plan.highlight ? '1px solid var(--accent-base)' : '1px solid var(--glass-border)',
                boxShadow: plan.highlight ? '0 0 40px var(--accent-glow)' : 'none',
                transform: plan.highlight && !isMobile ? 'scale(1.05)' : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {plan.highlight && (
                <div style={{ position: 'absolute', top: '12px', right: '-30px', background: 'var(--accent-base)', color: '#fff', fontSize: '12px', fontWeight: '800', padding: '4px 40px', transform: 'rotate(45deg)' }}>
                  POPULAR
                </div>
              )}

              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: plan.highlight ? 'var(--accent-base)' : 'var(--text-primary)' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: '800' }}>₹{plan.price}</span>
                  {plan.price > 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>/mo</span>}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                {plan.features.map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px', borderRadius: '50%' }}>
                      <Check size={14} color="#10b981" />
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handlePayment(plan)}
                disabled={user?.plan === plan.name || loadingPlan === plan.name}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: user?.plan === plan.name ? 'var(--glass-border-hover)' : (plan.highlight ? 'var(--accent-base)' : 'var(--glass-border-hover)'),
                  color: user?.plan === plan.name ? 'var(--text-secondary)' : (plan.highlight ? '#ffffff' : 'var(--text-primary)'),
                  fontWeight: '700',
                  cursor: user?.plan === plan.name ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loadingPlan === plan.name 
                  ? 'Processing...' 
                  : user?.plan === plan.name 
                    ? 'Current Plan' 
                    : plan.buttonText
                }
                {plan.price > 0 && user?.plan !== plan.name && <Shield size={16} />}
              </button>
            </div>
          ))}
        </div>

      </div>
      
      {/* 1-Click Mock Checkout Modal */}
      {showMockModal && selectedPlanForMock && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
          <div className="fade-in glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--glass-border)', borderRadius: '16px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <div style={{ backgroundColor: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', border: '1px solid var(--glass-border)' }}>
                <Zap size={32} color="var(--accent-base)" />
              </div>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>Confirm Free Upgrade</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                You are about to simulate a Razorpay transaction to securely upgrade your account to the <strong style={{ color: 'var(--text-primary)' }}>{selectedPlanForMock.name}</strong> tier.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button 
                onClick={() => setShowMockModal(false)}
                style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'transparent', color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={executeMockPayment}
                style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--accent-base)', color: '#fff', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px var(--accent-glow)' }}
              >
                Complete Upgrade
              </button>
            </div>
            
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', fontWeight: '600', letterSpacing: '1px' }}>
              TEST ENVIRONMENT • NO CARDS REQUIRED
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Pricing;
