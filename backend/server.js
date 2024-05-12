import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import http from 'http';
import passport from './config/passport-setup.js';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import conversationRoutes from './routes/conversationsRoutes.js';
import connectDB from './config/mongoose.setup.js';
import userRoutes from './routes/userRoutes.js';
import initializeSocket from './sockets/socket.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

// Socket.IO setup
initializeSocket(server);

// Middlewares for CORS and session
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
connectDB();
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: true,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: {
    maxAge: 1800000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);
app.use('/messages', messageRoutes);
app.use('/conversations', conversationRoutes);
app.use('/users', userRoutes);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
