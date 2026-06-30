import mongoose from 'mongoose';

const PlacementUpdateSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  rollNumber:  { type: String },
  program:     { type: String },
  year:        { type: Number },
  section:     { type: String },

  status:      { type: String, enum: ['shortlisted', 'placed', 'offer_received', 'not_placed'], required: true },
  companyName: { type: String, required: true },
  role:        { type: String },
  packageLPA:  { type: Number },
  notes:       { type: String },

  reportedById:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedByName: { type: String, required: true },
  reportedByRole: { type: String }, // 'teacher' | 'hod'
}, { timestamps: true });

PlacementUpdateSchema.index({ studentId: 1 });
PlacementUpdateSchema.index({ createdAt: -1 });

export const PlacementUpdate = mongoose.models.PlacementUpdate || mongoose.model('PlacementUpdate', PlacementUpdateSchema);
