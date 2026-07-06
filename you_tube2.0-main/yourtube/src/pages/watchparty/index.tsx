import React, { useEffect, useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { MonitorPlay, LogIn, Plus, Clock, ArrowLeft, Tv } from 'lucide-react';
import LegacyRoom from './LegacyRoom';
import { useUser } from '@/lib/AuthContext';
import { useRouter } from 'next/router';

export default function WatchPartyIndex() {
  const { initSocket, isJoined, isWaiting, joinRoom, leaveRoom, userName, setUserName } = useRoomStore();
  const { user } = useUser();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [hasAttemptedRejoin, setHasAttemptedRejoin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user?.name && !userName) {
      setUserName(user.name);
    }
  }, [user]);

  useEffect(() => {
    initSocket();
    
    if (router.query.room && !roomIdInput) {
      setRoomIdInput(router.query.room as string);
    }

    const savedRoomId = typeof window !== 'undefined' ? sessionStorage.getItem('roomId') : null;
    if (savedRoomId && !hasAttemptedRejoin) {
      joinRoom(savedRoomId);
      setHasAttemptedRejoin(true);
    }
  }, [initSocket, joinRoom, hasAttemptedRejoin, roomIdInput, router.query.room]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomIdInput.trim() && userName.trim()) {
      joinRoom(roomIdInput.trim());
    }
  };

  const handleCreate = () => {
    if (!userName.trim()) return;
    const newRoomId = Math.random().toString(36).substring(2, 9);
    joinRoom(newRoomId);
  };

  if (isWaiting) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f0f0f]">
        <div className="p-8 flex flex-col items-center gap-6 max-w-md w-full mx-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
          <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
             <Clock size={32} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Waiting for Host</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              You&apos;ve been placed in the waiting room. The host will let you in shortly.
            </p>
          </div>
          <button 
            className="w-full py-3 rounded-lg border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-semibold transition-colors"
            onClick={() => { leaveRoom(); router.push('/'); }}
          >
            Cancel & Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isJoined) {
    return <LegacyRoom />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f0f] relative">
      
      {/* Back Button */}
      <button 
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 font-medium transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      {/* MAIN CONTENT */}
      <div className="w-full max-w-md px-6">
        
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4">
            <Tv size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Watch Party
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Sync perfectly. Watch together.
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
          
          {/* Display Name */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
            <input 
              type="text" 
              className="w-full h-12 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" 
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Join Room */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Join a Room</label>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 h-12 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 text-center text-gray-900 dark:text-white font-bold text-lg tracking-widest uppercase placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" 
                placeholder="CODE"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                maxLength={7}
              />
              <button 
                type="submit" 
                disabled={!roomIdInput.trim() || !userName.trim()}
                className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <LogIn size={20} />
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          </div>

          {/* Create Button */}
          <button 
            onClick={handleCreate} 
            disabled={!userName.trim()}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Plus size={18} />
            Create Theater
          </button>
        </div>
      </div>
    </div>
  );
}
