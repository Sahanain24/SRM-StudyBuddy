import mongoose from 'mongoose';

const SubmissionAttachmentSchema = new mongoose.Schema({
  name:     { type: String },
  url:      { type: String },
  mimeType: { type: String },
  size:     { type: Number },
}, { _id: false });

const AssignmentSubmissionSchema = new mongoose.Schema({
  postId:      { type: mongoose.Schema.Types.ObjectId, ref: 'ClassPost', required: true },
  batchId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Batch',     required: true },
  studentId:   { type: String, required: true },
  studentName: { type: String },
  rollNumber:  { type: String },

  content:     { type: String, default: '' }, // text answer
  attachments: [SubmissionAttachmentSchema],

  submittedAt: { type: Date, default: Date.now },

  // Grading
  grade:       { type: Number },          // marks awarded
  feedback:    { type: String, default: '' },
  gradedAt:    { type: Date },
  gradedBy:    { type: String },          // teacher name

  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted',
  },
}, { timestamps: true });

AssignmentSubmissionSchema.index({ postId: 1, studentId: 1 }, { unique: true });
AssignmentSubmissionSchema.index({ postId: 1 });
AssignmentSubmissionSchema.index({ batchId: 1, studentId: 1 });

export const AssignmentSubmission = mongoose.models.AssignmentSubmission ||
  mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
