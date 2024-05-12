import { Server as SocketIO } from 'socket.io';
import User from '../models/User.js';  // Adjust the path as necessary

const initializeSocket = (server) => {
  const io = new SocketIO(server, {
    cors: {
      origin: 'http://localhost:3000',
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
        const messageToSend = {
          ...message,
          senderName: user ? user.name : "Unknown user"
        };
        // Emit to all sockets in the room except the sender
        socket.to(message.conversationId).emit('messageReceived', messageToSend);
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
