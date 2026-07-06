import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
// mongoose removed
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
dotenv.config();
const app = express();
import path from "path";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("Client connected to Watch Party:", socket.id);
  
  // Room Management
  socket.on('join_room', (data) => {
    // Check if data is string (new logic) or object (legacy logic)
    if (typeof data === 'string') {
      socket.join(data);
      return;
    }
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
    io.to(data.targetId).emit('receive_message', messagePayload);
    socket.emit('receive_message', { ...messagePayload, toUserName: data.targetName, toUserId: data.targetId });
  });

  // Video Sync Events (Legacy + New)
  socket.on('video_sync', (data) => {
    socket.to(data.roomId).emit('video_sync', data);
  });
  
  socket.on("play_video", (roomId) => socket.to(roomId).emit("play_video"));
  socket.on("pause_video", (roomId) => socket.to(roomId).emit("pause_video"));
  socket.on("seek_video", (data) => socket.to(data.roomId || data).emit("seek_video", data.time || data));

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

httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

// Server running
