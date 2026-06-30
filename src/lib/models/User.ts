import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  rollNumber:   { type: String, trim: true, uppercase: true }, // students only
  password: { type: String },   

  role: {
    type: String,
    enum: ['student','teacher','hod','dean','deputy_dean','pro_vc','admin'],
    required: true,
  },

  // Student fields
  program:  { type: String },   // 'BCA' | 'BCA(DS)' | 'BCom' | 'MSc(ADS)' | 'MCom' | 'MCA' | 'MCA GenAI'
  department: { type: String },
  year:     { type: Number },   // 1 | 2 | 3
  batch:    { type: String },   // e.g. '2022-2025'
  section:  { type: String },

  // Auth state
  isFirstLogin:             { type: Boolean, default: true },
  selfAssessmentCompleted:  { type: Boolean, default: false },
  selfAssessmentId:         { type: mongoose.Schema.Types.ObjectId, ref: 'SelfAssessment' },
  isActive:                 { type: Boolean, default: true },

  // Teacher fields
  assignedPrograms:    [{ type: String }],
  assignedDepartments: [{ type: String }],

  // Timestamps
  lastLoginAt: { type: Date },
}, { timestamps: true });

// Indexes for fast lookup
UserSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 1 },      { unique: true, sparse: true });
UserSchema.index({ role: 1 });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);