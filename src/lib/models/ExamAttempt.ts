import mongoose from 'mongoose';

const ExamAttemptSchema = new mongoose.Schema({
  examId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNumber:  { type: String },
  studentName: { type: String },
  program:     { type: String },
  department:  { type: String },
  year:        { type: Number },

  startedAt:     { type: Date },
  submittedAt:   { type: Date },
  timeTakenSecs: { type: Number },

  answers: [{
    questionId:     { type: String },
    selectedOption: { type: String },
    isCorrect:      { type: Boolean },
    marksAwarded:   { type: Number },
  }],

  score:      { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  isPassed:   { type: Boolean, default: false },
  status:     { type: String, enum: ['in_progress','submitted','timed_out'], default: 'in_progress' },

  tabSwitchCount: { type: Number, default: 0 },
  ipAddress:      { type: String },
  selfAssessmentCompleted: { type: Boolean, default: false },
}, { timestamps: true });

ExamAttemptSchema.index({ examId: 1, userId: 1 });

export const ExamAttempt = mongoose.models.ExamAttempt ||
  mongoose.model('ExamAttempt', ExamAttemptSchema);