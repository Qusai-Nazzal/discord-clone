const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for development
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Online users registry (socket.id => user details)
const onlineUsers = {};

// Helper to broadcast unique online users
const sendOnlineUsersList = () => {
  const uniqueUsers = {};
  Object.values(onlineUsers).forEach(u => {
    uniqueUsers[u.id] = u;
  });
  io.emit('online-users-list', Object.values(uniqueUsers));
};

// Initialize DB and Routes
const startServer = async () => {
  // Connect to DB (with JSON DB fallback)
  await connectDB();

  // Load models to ensure DB structure/setup runs
  require('./models');

  // API Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/channels', require('./routes/channels'));
  app.use('/api/messages', require('./routes/messages'));

  // Health check endpoint
  app.get('/health', (req, res) => {
    const { getIsFallback } = require('./config/db');
    res.json({
      status: 'healthy',
      database: getIsFallback() ? 'JSON Fallback' : 'MongoDB'
    });
  });

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`Socket connection established: ${socket.id}`);

    // Register user profile on socket connection
    socket.on('user-connected', (user) => {
      if (user && user.id) {
        onlineUsers[socket.id] = {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          status: user.status || 'online'
        };
        console.log(`User logged in: ${user.username} (Socket: ${socket.id})`);
        sendOnlineUsersList();
      }
    });

    // Room management
    socket.on('join-channel', (channelId) => {
      socket.join(channelId);
      console.log(`Socket ${socket.id} joined room/channel: ${channelId}`);
    });

    socket.on('leave-channel', (channelId) => {
      socket.leave(channelId);
      console.log(`Socket ${socket.id} left room/channel: ${channelId}`);
    });

    // Sending/receiving messages
    socket.on('send-message', async (data) => {
      const { channelId, senderId, content } = data;
      if (!content || !channelId || !senderId) return;

      try {
        const { Message } = require('./models');
        
        let message = await Message.create({
          sender: senderId,
          channel: channelId,
          content: content.trim()
        });

        // Fetch complete message with sender details
        message = await Message.findById(message._id).populate('sender');

        // Distribute to all clients listening in that room/channel
        io.to(channelId).emit('receive-message', message);
      } catch (err) {
        console.error('Socket error saving message:', err.message);
      }
    });

    // Typing status indicators
    socket.on('typing', (data) => {
      // data: { channelId, username, isTyping }
      if (data && data.channelId) {
        socket.to(data.channelId).emit('user-typing', data);
      }
    });

    // Dynamic channel additions
    socket.on('channel-created', (newChannel) => {
      io.emit('new-channel', newChannel);
    });

    // Status shifts
    socket.on('status-change', (status) => {
      if (onlineUsers[socket.id]) {
        onlineUsers[socket.id].status = status;
        console.log(`User ${onlineUsers[socket.id].username} set status to: ${status}`);
        sendOnlineUsersList();
      }
    });

    // Cleanup on user exit
    socket.on('disconnect', () => {
      if (onlineUsers[socket.id]) {
        console.log(`User logged out/disconnected: ${onlineUsers[socket.id].username}`);
        delete onlineUsers[socket.id];
        sendOnlineUsersList();
      }
    });
  });

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    const { getIsFallback } = require('./config/db');
    console.log(`\n======================================================`);
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
    console.log(`Database state: ${getIsFallback() ? 'USING FALLBACK JSON STORAGE' : 'USING MONGODB'}`);
    console.log(`======================================================\n`);
  });
};

startServer();
