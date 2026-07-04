import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SyncSphere API is running' });
});

// Centralized room state
// rooms[roomId] = { hostToken: string, participants: [{ id, name, token }], kickedTokens: Set }
const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Room Management
  socket.on('join_room', (data) => {
    const { roomId, userName, clientToken } = data;
    
    if (!rooms[roomId]) {
      rooms[roomId] = {
        hostToken: clientToken,
        participants: [],
        kickedTokens: new Set()
      };
    }

    const room = rooms[roomId];

    if (room.kickedTokens.has(clientToken)) {
      socket.emit('in_waiting_room');
      const hostSocket = room.participants.find(p => p.token === room.hostToken)?.id;
      if (hostSocket) {
        io.to(hostSocket).emit('join_request', { targetSocketId: socket.id, targetToken: clientToken, userName });
      }
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = userName;
    socket.clientToken = clientToken;
    
    const existingIndex = room.participants.findIndex(p => p.token === clientToken);
    if (existingIndex === -1) {
      room.participants.push({ id: socket.id, name: userName, token: clientToken });
    } else {
      room.participants[existingIndex].id = socket.id;
      room.participants[existingIndex].name = userName;
    }

    console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);
    
    socket.emit('room_participants', {
      participants: room.participants,
      hostToken: room.hostToken
    });
    
    socket.to(roomId).emit('user_joined', { userId: socket.id, userName, token: clientToken });
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].participants = rooms[roomId].participants.filter(p => p.id !== socket.id);
    }
    socket.to(roomId).emit('user_left', socket.id);
  });

  socket.on('kick_user', ({ roomId, targetToken }) => {
    if (rooms[roomId] && rooms[roomId].hostToken === socket.clientToken) {
      rooms[roomId].kickedTokens.add(targetToken);
      const targetParticipant = rooms[roomId].participants.find(p => p.token === targetToken);
      if (targetParticipant) {
        rooms[roomId].participants = rooms[roomId].participants.filter(p => p.token !== targetToken);
        io.to(targetParticipant.id).emit('you_were_kicked');
        io.in(targetParticipant.id).socketsLeave(roomId);
        socket.to(roomId).emit('user_left', targetParticipant.id);
      }
    }
  });

  socket.on('approve_join', ({ roomId, targetSocketId, targetToken }) => {
    if (rooms[roomId] && rooms[roomId].hostToken === socket.clientToken) {
      rooms[roomId].kickedTokens.delete(targetToken);
      io.to(targetSocketId).emit('join_approved');
    }
  });

  socket.on('deny_join', ({ roomId, targetSocketId }) => {
    if (rooms[roomId] && rooms[roomId].hostToken === socket.clientToken) {
      io.to(targetSocketId).emit('join_denied');
    }
  });

  // WebRTC Signaling
  socket.on('offer', (data) => {
    socket.to(data.targetId).emit('offer', {
      sdp: data.sdp,
      senderId: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.targetId).emit('answer', {
      sdp: data.sdp,
      senderId: socket.id
    });
  });

  socket.on('ice_candidate', (data) => {
    socket.to(data.targetId).emit('ice_candidate', {
      candidate: data.candidate,
      senderId: socket.id
    });
  });

  socket.on('webrtc_ready', ({ roomId }) => {
    socket.to(roomId).emit('user_webrtc_ready', { userId: socket.id });
  });

  // Chat
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', {
      senderId: socket.id,
      userName: data.userName,
      text: data.text,
      timestamp: Date.now()
    });
  });

  // Direct Messaging
  socket.on('send_direct_message', (data) => {
    const messagePayload = {
      senderId: socket.id,
      userName: data.userName,
      text: data.text,
      isDirect: true,
      timestamp: Date.now()
    };
    // Send to target
    io.to(data.targetId).emit('receive_message', messagePayload);
    // Send back to sender so they see it in their chat history
    socket.emit('receive_message', { ...messagePayload, toUserName: data.targetName, toUserId: data.targetId });
  });

  // Video Sync Events
  socket.on('video_sync', (data) => {
    socket.to(data.roomId).emit('video_sync', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    if (socket.roomId && rooms[socket.roomId]) {
      rooms[socket.roomId].participants = rooms[socket.roomId].participants.filter(p => p.id !== socket.id);
      socket.to(socket.roomId).emit('user_left', socket.id);
      
      if (rooms[socket.roomId].participants.length === 0) {
        delete rooms[socket.roomId];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
