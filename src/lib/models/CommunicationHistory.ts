import mongoose from 'mongoose';

const CommunicationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  transcription: {
    type: String,
    required: true,
  },
  sentiment: {
    type: String,
    required: true,
    trim: true,
  },
  overallFeedback: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const CommunicationHistory = mongoose.models.CommunicationHistory || mongoose.model('CommunicationHistory', CommunicationHistorySchema);
