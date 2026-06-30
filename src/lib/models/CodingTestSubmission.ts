import mongoose from 'mongoose';

const CodingTestSubmissionSchema = new mongoose.Schema({
  testId:      { type: mongoose.Schema.Types.ObjectId, ref: 'CodingTest', required: true },
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String },
  rollNumber:  { type: String },
  program:     { type: String },
  year:        { type: Number },
  section:     { type: String },

  answers: [{
    problemId:    { type: String, required: true },
    code:         { type: String, default: '' },
    language:     { type: String, default: 'javascript' },
    passedCount:  { type: Number, default: 0 },
    totalCount:   { type: Number, default: 0 },
    marksAwarded: { type: Number, default: 0 },
  }],

  totalMarks:    { type: Number, default: 0 },
  obtainedMarks: { type: Number, default: 0 },

  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

CodingTestSubmissionSchema.index({ testId: 1, studentId: 1 }, { unique: true });

export const CodingTestSubmission = mongoose.models.CodingTestSubmission || mongoose.model('CodingTestSubmission', CodingTestSubmissionSchema);
