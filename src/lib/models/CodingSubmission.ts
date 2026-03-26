import mongoose from 'mongoose';

const CodingSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problemId: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  result: {
    type: String,
    enum: ['passed', 'failed'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export const CodingSubmission = mongoose.models.CodingSubmission || mongoose.model('CodingSubmission', CodingSubmissionSchema);
