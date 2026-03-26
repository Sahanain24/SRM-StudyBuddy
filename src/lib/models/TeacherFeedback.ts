import mongoose from 'mongoose';

const TeacherFeedbackSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export const TeacherFeedback = mongoose.models.TeacherFeedback || mongoose.model('TeacherFeedback', TeacherFeedbackSchema);
