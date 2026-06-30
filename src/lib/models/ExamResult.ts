import mongoose from 'mongoose';

// Stores full questions so teachers can do per-question review
// XP removed. Difficulty removed (fixed by teacher per course).
// firstAttempt flag lets teacher see only first scores per subject.
const ExamResultSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:       { type: String, required: true },
  courseId:       { type: String, required: true },
  courseName:     { type: String, required: true },
  subjectName:    { type: String, required: true },
  score:          { type: Number, required: true },
  total:          { type: Number, required: true },
  percentage:     { type: Number, required: true },
  timeTaken:      { type: Number, required: true },   // seconds
  answers:        [{ type: Number }],                  // student's chosen indices
  correctAnswers: [{ type: Number }],                  // correct indices
  questions:      [{ type: mongoose.Schema.Types.Mixed }], // full question objects
  isFirstAttempt: { type: Boolean, default: false },   // true if first ever attempt for this user+course+subject
  tabViolations:  { type: Number, default: 0 },         // tab-switch count during the exam
  date:           { type: String, required: true },
}, { timestamps: true });

export const ExamResult = mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema);