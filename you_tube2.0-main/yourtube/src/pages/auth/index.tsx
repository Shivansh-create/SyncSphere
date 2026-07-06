import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/lib/AuthContext';
import axiosInstance from '@/lib/axiosinstance';
import { Mail, ArrowRight, ShieldCheck, X } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<React.ReactNode | null>(null);

  const router = useRouter();
  const { login } = useUser();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email.trim()) {
      setErrorMsg("Email is required");
      return;
    }
    setLoading(true);
    
    try {
      // Step 1: Request OTP
      const res = await axiosInstance.post('/user/login', { email, name: email.split('@')[0] });
      if (res.data.otpSent) {
        if (res.data.previewUrl) {
          setSuccessMsg(
            <span>
              OTP Sent! <a href={res.data.previewUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 hover:text-blue-800">Click here to view your email</a>
            </span>
          );
        } else {
          setSuccessMsg("Check your terminal logs for the OTP!");
        }
        setShowOtp(true);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    
    try {
      // Step 2: Verify OTP
      const res = await axiosInstance.post('/user/verify-otp', { email, otp });
      if (res.data.result) {
        const { result, token } = res.data;
        // AuthContext expects token and user object
        login(token, result);
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-gray-100 relative">
        <button 
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-600 mb-4 shadow-sm">
            {showOtp ? <ShieldCheck className="w-8 h-8" /> : <Mail className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {showOtp ? 'Enter Security Code' : 'Welcome to YourTube'}
          </h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            {showOtp 
              ? `We sent a code to ${email}` 
              : 'Sign in with your email to continue'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 text-center font-medium animate-pulse">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700 text-center font-medium">
            {successMsg}
          </div>
        )}

        {!showOtp ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50 transition-colors sm:text-sm font-medium text-gray-900"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? 'Sending...' : 'Continue with Email'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">6-Digit Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-50 transition-colors text-center text-lg tracking-widest font-bold text-gray-900"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
              {!loading && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setShowOtp(false); setSuccessMsg(null); }}
                className="text-sm text-gray-500 font-medium hover:text-red-600 transition-colors"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
