import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profilePhotoUrl: { type: String },
  blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Added this line
}, {
  timestamps: true,
});

const User = model('User', userSchema);

export default User;
