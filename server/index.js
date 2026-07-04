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
const rooms = {}; // roomId -> Array of { id, name }

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Room Management
  socket.on('join_room', (data) => {
    const { roomId, userName } = data;
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = userName;
    
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    
    // Check if user is already in the array (prevent duplicates on reconnect)
    const existingIndex = rooms[roomId].findIndex(p => p.id === socket.id);
    if (existingIndex === -1) {
      rooms[roomId].push({ id: socket.id, name: userName });
    } else {
      rooms[roomId][existingIndex].name = userName;
    }

    console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);
    
    // Send the current list of participants to the user who just joined
    socket.emit('room_participants', rooms[roomId]);
    
    // Broadcast to others in the room that a user joined
    socket.to(roomId).emit('user_joined', { userId: socket.id, userName });
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(p => p.id !== socket.id);
    }
    socket.to(roomId).emit('user_left', socket.id);
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
      rooms[socket.roomId] = rooms[socket.roomId].filter(p => p.id !== socket.id);
      socket.to(socket.roomId).emit('user_left', socket.id);
      
      // Clean up empty rooms
      if (rooms[socket.roomId].length === 0) {
        delete rooms[socket.roomId];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
