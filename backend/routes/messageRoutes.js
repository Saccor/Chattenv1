import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import Conversation from '../models/Conversation.js';

const router = express.Router();

router.post('/', isAuthenticated, async (req, res) => {
  console.log("Received message data: ", req.body);
  const { text, conversationId } = req.body;
  const senderId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(senderId)) {
    return res.status(400).send('Invalid IDs provided');
  }

  try {
    let conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      // If conversation doesn't exist, create a new one
      conversation = await Conversation.create({
        participants: [senderId],
        messages: [] // Initialize messages array
      });
    }

    const newMessage = new Message({
      senderId,
      text,
      conversationId  // Make sure this is included and correct
    });
    
    // Save the message to the database
    await newMessage.save();

    // Push the message to the conversation's messages array
    conversation.messages.push(newMessage);
    await conversation.save();

    res.status(201).send('Message saved');
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).send(error.message);
  }
});

// GET messages for a specific conversation
router.get('/:conversationId', isAuthenticated, async (req, res) => {
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).send('Invalid conversation ID');
  }

  try {
    const messages = await Message.find({ conversationId: conversationId }).populate('senderId', 'name profilePhotoUrl');
    if (!messages) {
      return res.status(404).send('No messages found for this conversation');
    }
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
