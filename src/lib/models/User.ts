import mongoose from 'mongoose';

export type UserRole = 'student' | 'teacher';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    required: true,
  },
}, {
  timestamps: true,
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
