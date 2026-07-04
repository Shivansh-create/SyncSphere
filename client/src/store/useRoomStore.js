import { create } from 'zustand';
import { io } from 'socket.io-client';

export const useRoomStore = create((set, get) => ({
  socket: null,
  roomId: null,
  userId: null,
  userName: '',
  participants: [], // Array of { id, name }
  messages: [],
  isJoined: false,
  activeChatTarget: null, // { id, name }

  setActiveChatTarget: (target) => set({ activeChatTarget: target }),
  setUserName: (name) => set({ userName: name }),

  initSocket: () => {
    if (get().socket) return;
    const socket = io('/', { path: '/socket.io' });

    socket.on('connect', () => {
      set({ userId: socket.id });
    });

    socket.on('room_participants', (participantsArray) => {
      set({ participants: participantsArray.filter(p => p.id !== socket.id) });
    });

    socket.on('user_joined', (data) => {
      set((state) => {
        // Prevent duplicates
        if (state.participants.find(p => p.id === data.userId)) return state;
        return {
          participants: [...state.participants, { id: data.userId, name: data.userName }]
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

    set({ socket });
  },

  joinRoom: (roomId) => {
    const { socket, userName } = get();
    if (socket) {
      socket.emit('join_room', { roomId, userName: userName || 'Anonymous' });
      set({ roomId, isJoined: true });
    }
  },

  leaveRoom: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('leave_room', roomId);
    }
    set({ roomId: null, isJoined: false, participants: [], messages: [] });
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
