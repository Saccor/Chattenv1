// routes/userRoutes.js
import express from 'express';
import User from '../models/User.js';
import isAuthenticated from '../middleware/isAuthenticated.js';

const router = express.Router();

// Fetch all users
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const users = await User.find({}, 'name profilePhotoUrl').lean();
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Block a user
router.post('/block', isAuthenticated, async (req, res) => {
  const { contactId } = req.body;
  const userId = req.user._id;

  try {
    await User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: contactId } });
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// Unblock a user
router.post('/unblock', isAuthenticated, async (req, res) => {
  const { contactId } = req.body;
  const userId = req.user._id;

  try {
    await User.findByIdAndUpdate(userId, { $pull: { blockedUsers: contactId } });
    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

export default router;
