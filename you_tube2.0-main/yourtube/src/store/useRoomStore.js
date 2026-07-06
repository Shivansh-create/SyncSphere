import { create } from 'zustand';
import { io } from 'socket.io-client';

const getClientToken = () => {
  if (typeof window === 'undefined') return 'server_token';
  let token = sessionStorage.getItem('syncsphere_client_token');
  if (!token) {
    token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('syncsphere_client_token', token);
  }
  return token;
};

export const useRoomStore = create((set, get) => ({
  socket: null,
  clientToken: getClientToken(),
  roomId: typeof window !== 'undefined' ? sessionStorage.getItem('roomId') || null : null,
  userId: null,
  userName: typeof window !== 'undefined' ? sessionStorage.getItem('userName') || '' : '',
  participants: [], // Array of { id, name, token }
  messages: [],
  isJoined: false, // We don't auto-set this to true yet until socket connects
  isHost: false,
  isWaiting: false,
  joinRequests: [],
  activeChatTarget: null, 

  setActiveChatTarget: (target) => set({ activeChatTarget: target }),
  setUserName: (name) => {
    set({ userName: name });
    sessionStorage.setItem('userName', name);
  },

  initSocket: () => {
    if (get().socket) return;
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      set({ userId: socket.id });
    });

    socket.on('room_participants', (data) => {
      set({ 
        participants: data.participants.filter(p => p.id !== socket.id),
        isHost: data.hostToken === get().clientToken
      });
    });

    socket.on('user_joined', (data) => {
      set((state) => {
        if (state.participants.find(p => p.id === data.userId)) return state;
        return {
          participants: [...state.participants, { id: data.userId, name: data.userName, token: data.token }]
        };
      });
    });

    socket.on('receive_message', (message) => {
      set((state) => ({
        messages: [...state.messages, message]
      }));
    });

    socket.on('user_left', (userId) => {
      set((state) => ({
        participants: state.participants.filter(p => p.id !== userId)
      }));
    });

    // Host & Kicking events
    socket.on('in_waiting_room', () => {
      set({ isWaiting: true, isJoined: false });
    });

    socket.on('you_were_kicked', () => {
      sessionStorage.removeItem('roomId');
      set({ roomId: null, isJoined: false, participants: [], messages: [], isHost: false });
      window.location.href = '/';
    });

    socket.on('join_request', (data) => {
      set((state) => ({ joinRequests: [...state.joinRequests, data] }));
    });

    socket.on('join_approved', () => {
      set({ isWaiting: false });
      // Re-trigger join
      get().joinRoom(get().roomId);
    });

    socket.on('join_denied', () => {
      sessionStorage.removeItem('roomId');
      set({ isWaiting: false, roomId: null, isJoined: false });
      window.location.href = '/';
    });

    set({ socket });
  },

  joinRoom: (roomId) => {
    const { socket, userName, clientToken } = get();
    if (socket) {
      socket.emit('join_room', { roomId, userName: userName || 'Anonymous', clientToken });
      sessionStorage.setItem('roomId', roomId);
      sessionStorage.setItem('userName', userName);
      set({ roomId, isJoined: true });
    }
  },

  leaveRoom: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('leave_room', roomId);
    }
    sessionStorage.removeItem('roomId');
    set({ roomId: null, isJoined: false, participants: [], messages: [], isHost: false, isWaiting: false });
  },

  kickUser: (targetToken) => {
    const { socket, roomId, isHost } = get();
    if (socket && roomId && isHost) {
      socket.emit('kick_user', { roomId, targetToken });
    }
  },

  approveJoin: (targetSocketId, targetToken) => {
    const { socket, roomId, isHost } = get();
    if (socket && roomId && isHost) {
      socket.emit('approve_join', { roomId, targetSocketId, targetToken });
      set((state) => ({ joinRequests: state.joinRequests.filter(r => r.targetToken !== targetToken) }));
    }
  },

  denyJoin: (targetSocketId, targetToken) => {
    const { socket, roomId, isHost } = get();
    if (socket && roomId && isHost) {
      socket.emit('deny_join', { roomId, targetSocketId });
      set((state) => ({ joinRequests: state.joinRequests.filter(r => r.targetToken !== targetToken) }));
    }
  },

  sendMessage: (text) => {
    const { socket, roomId, userName, userId, activeChatTarget } = get();
    if (socket && roomId) {
      if (activeChatTarget) {
        socket.emit('send_direct_message', { 
          targetId: activeChatTarget.id, 
          targetName: activeChatTarget.name,
          text, 
          userName: userName || userId.substring(0, 5) 
        });
      } else {
        socket.emit('send_message', { roomId, text, userName: userName || userId.substring(0, 5) });
      }
    }
  }
}));
