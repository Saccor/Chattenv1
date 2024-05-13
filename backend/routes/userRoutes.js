import express from 'express';
import User from '../models/User.js';
import isAuthenticated from '../middleware/isAuthenticated.js';

const router = express.Router();

// Fetch all users
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const users = await User.find({}, 'name profilePhotoUrl').lean(); // Select only the name and profile photo URL for privacy
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
