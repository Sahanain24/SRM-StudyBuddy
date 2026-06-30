import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema({
  name:     { type: String },
  url:      { type: String }, // /uploads/classroom/<filename>
  mimeType: { type: String },
  size:     { type: Number }, // bytes
}, { _id: false });

const PollOptionSchema = new mongoose.Schema({
  text:    { type: String, required: true },
  voterIds: [{ type: String }], // userId strings
}, { _id: true });

const ClassPostSchema = new mongoose.Schema({
  batchId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  teacherName: { type: String },

  type: {
    type: String,
    enum: ['announcement', 'material', 'assignment', 'poll'],
    required: true,
  },

  title:   { type: String, required: true },
  content: { type: String, default: '' }, // body text / description

  // Materials & assignments
  attachments: [AttachmentSchema],
  topic:       { type: String, default: '' }, // e.g. "Unit 3 - Trees"

  // Assignment-specific
  dueDate:    { type: Date },
  totalMarks: { type: Number },

  // Poll-specific
  pollOptions:   [PollOptionSchema],
  pollClosedAt:  { type: Date },

  isPinned:      { type: Boolean, default: false },
  allowComments: { type: Boolean, default: true },
}, { timestamps: true });

ClassPostSchema.index({ batchId: 1, createdAt: -1 });

export const ClassPost = mongoose.models.ClassPost ||
  mongoose.model('ClassPost', ClassPostSchema);
