import express from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js'; // Ensure User model is imported if needed
import isAuthenticated from '../middleware/isAuthenticated.js';

const router = express.Router();

// GET endpoint to fetch all conversations for a user with the last message details
router.get('/', isAuthenticated, async (req, res) => {
    const userId = req.user._id;
    const searchTerm = req.query.search || '';
  
    try {
      const conversations = await Conversation.find({
        participants: userId,
        participantNames: { $regex: searchTerm, $options: 'i' } // case-insensitive search
      })
        .populate('participants', 'name profilePhotoUrl')
        .lean();
  
      const conversationsWithLastMessage = await Promise.all(
        conversations.map(async (conversation) => {
          const lastMessage = await Message.findOne({ conversationId: conversation._id }).sort({ timestamp: -1 }).lean();
          return {
            ...conversation,
            lastMessage: lastMessage ? {
              text: lastMessage.text,
              timestamp: lastMessage.timestamp,
              senderId: lastMessage.senderId
            } : null
          };
        })
      );
  
      res.json(conversationsWithLastMessage);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Server Error: Unable to fetch conversations.' });
    }
});

// POST endpoint to create a new conversation
router.post('/', isAuthenticated, async (req, res) => {
    const { participants } = req.body;
    console.log("Received participant IDs:", participants); // Debug output

    if (!participants || participants.length === 0) {
        return res.status(400).json({ error: 'Participants required' });
    }

    if (!participants.every(id => mongoose.Types.ObjectId.isValid(id))) {
        console.log("Invalid ID detected"); // Debug output
        return res.status(400).json({ error: "Invalid participant IDs" });
    }

    const participantCount = await User.countDocuments({_id: {$in: participants}});
    if (participantCount !== participants.length) {
        console.log("Some IDs do not match existing users"); // Debug output
        return res.status(400).json({ error: "One or more participants not found" });
    }

    try {
        // Check if a conversation already exists between the participants
        const existingConversation = await Conversation.findOne({ participants: { $all: participants } });

        if (existingConversation) {
            return res.status(400).json({ error: 'Conversation already exists' });
        }

        // Fetch participant names
        const participantNames = await User.find({ _id: { $in: participants } }).distinct('name');
        
        // Create a new conversation with participant names
        const newConversation = await Conversation.create({ participants, participantNames });
        
        res.status(201).json(newConversation);
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET endpoint to fetch all conversations for a user with the last message details and earlier messages
router.get('/earlier', isAuthenticated, async (req, res) => {
    const userId = req.user._id;
  
    try {
      const conversations = await Conversation.find({ participants: userId })
        .populate('participants', 'name profilePhotoUrl') // Populate participant details if needed
        .populate({
          path: 'messages',
          options: { sort: { timestamp: -1 }, limit: 1 }, // Populate last message details
          populate: { path: 'senderId', select: 'name profilePhotoUrl' } // Populate sender details for the last message
        })
        .lean();
  
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Server Error: Unable to fetch conversations.' });
    }
});

// Delete a conversation by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    console.log(`Attempting to delete conversation with ID: ${req.params.id}`);
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      console.log('Conversation not found');
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (!conversation.participants.includes(req.user._id)) {
      console.log('User not authorized to delete this conversation');
      return res.status(403).json({ error: 'Not authorized' });
    }
    await Conversation.deleteOne({ _id: req.params.id });
    console.log('Conversation deleted successfully');
    res.status(200).json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



export default router;
