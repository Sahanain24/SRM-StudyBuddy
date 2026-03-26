import mongoose from 'mongoose';

const QuizResultSchema = new mongoose.Schema({
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
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 1,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const QuizResult = mongoose.models.QuizResult || mongoose.model('QuizResult', QuizResultSchema);
