// sockets/socket.js
import { Server as SocketIO } from 'socket.io';
import User from '../models/User.js';

const initializeSocket = (server) => {
  const io = new SocketIO(server, {
    cors: {
      origin: function (origin, callback) {
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
        const sender = await User.findById(message.senderId);
        const conversation = await Conversation.findById(message.conversationId).populate('participants');
        
        if (!sender || !conversation) {
          console.error('Sender or conversation not found');
          return;
        }

        const recipient = conversation.participants.find(participant => participant._id.toString() !== sender._id.toString());
        
        if (recipient && recipient.blockedUsers.includes(sender._id)) {
          console.log(`Message blocked because ${recipient.name} has blocked ${sender.name}`);
          return;
        }

        const messageToSend = {
          ...message,
          senderName: sender.name
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
