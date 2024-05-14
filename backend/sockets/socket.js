import { Server as SocketIO } from 'socket.io';
import User from '../models/User.js';

const initializeSocket = (server) => {
  const io = new SocketIO(server, {
    cors: {
      origin: function (origin, callback) {
        // List of valid origins
        const allowedOrigins = ['http://localhost:3000', 'https://chattenv1.vercel.app'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.error(`Blocked by CORS: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User joined conversation ${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
      console.log(`User left conversation ${conversationId}`);
    });

    socket.on('newMessage', async (message) => {
      try {
        const user = await User.findById(message.senderId);
        if (!user) {
          console.error('User not found:', message.senderId);
          return;
        }
        const messageToSend = {
          ...message,
          senderName: user.name
        };
        socket.to(message.conversationId).emit('messageReceived', messageToSend);
        console.log(`Message sent to conversation ${message.conversationId}`);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

export default initializeSocket;
