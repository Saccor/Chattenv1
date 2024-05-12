import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  participantNames: [{ // Array of names for search functionality
    type: String,
    required: true
  }],
  messages: [{ // Reference to messages
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a text index on the participantNames field
conversationSchema.index({ participantNames: 'text' });

const Conversation = model('Conversation', conversationSchema);

export default Conversation;
