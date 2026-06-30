import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true }, // e.g. "BCA 2023 - Section A"
  program:     { type: String, required: true }, // 'BCA', 'MCA', etc.
  year:        { type: Number, required: true }, // 1 | 2 | 3
  section:     { type: String, default: '' },    // 'A' | 'B' | ''
  subject:     { type: String, default: '' },    // optional subject context
  description: { type: String, default: '' },

  teacherIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  studentIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

BatchSchema.index({ program: 1, year: 1, section: 1 });

export const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
