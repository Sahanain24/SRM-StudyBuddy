import mongoose from 'mongoose';

const QuestionBankSchema = new mongoose.Schema({
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  subject:     { type: String },
  programs:    [{ type: String }],
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

export const QuestionBank = mongoose.models.QuestionBank ||
  mongoose.model('QuestionBank', QuestionBankSchema);