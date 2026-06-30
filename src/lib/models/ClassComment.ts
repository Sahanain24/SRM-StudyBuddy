import mongoose from 'mongoose';

const ClassCommentSchema = new mongoose.Schema({
  postId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ClassPost', required: true },
  userId:   { type: String, required: true },
  userName: { type: String, required: true },
  role:     { type: String, default: 'student' }, // 'student' | 'teacher'
  content:  { type: String, required: true },
}, { timestamps: true });

ClassCommentSchema.index({ postId: 1, createdAt: 1 });

export const ClassComment = mongoose.models.ClassComment ||
  mongoose.model('ClassComment', ClassCommentSchema);
