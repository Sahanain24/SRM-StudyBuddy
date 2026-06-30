import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  bankId:       { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank' },
  teacherId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionText: { type: String, required: true },
  questionType: { type: String, enum: ['MCQ','TrueFalse'], default: 'MCQ' },
  options: [{
    label:     { type: String },  // 'A' | 'B' | 'C' | 'D'
    text:      { type: String },
    isCorrect: { type: Boolean },
  }],
  explanation: { type: String },  // shown after answer key published
  marks:       { type: Number, default: 1 },
  difficulty:  { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' },
  topic:       { type: String },
  tags:        [{ type: String }],
}, { timestamps: true });

export const Question = mongoose.models.Question ||
  mongoose.model('Question', QuestionSchema);