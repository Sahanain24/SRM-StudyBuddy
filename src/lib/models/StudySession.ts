import mongoose from 'mongoose';

const StudySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: Number,
    required: true, // in seconds
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const StudySession = mongoose.models.StudySession || mongoose.model('StudySession', StudySessionSchema);
