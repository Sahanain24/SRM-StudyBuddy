import mongoose from 'mongoose';

const ActionItemSchema = new mongoose.Schema({
  text:        { type: String, required: true },
  dueDate:     { type: Date },
  status:      { type: String, enum: ['pending', 'completed'], default: 'pending' },
  completedAt: { type: Date },
}, { timestamps: true });

const MentorSessionSchema = new mongoose.Schema({
  // Participants
  studentId:   { type: String, required: true },
  studentName: { type: String },
  rollNumber:  { type: String },
  program:     { type: String },
  year:        { type: Number },
  section:     { type: String, default: '' },

  teacherId:   { type: String, required: true },
  teacherName: { type: String },

  // Scheduling
  scheduledAt:  { type: Date, required: true },
  durationMins: { type: Number, default: 30 },
  topic:        { type: String, default: '' }, // what student wants to discuss

  status: {
    type: String,
    enum: ['requested', 'approved', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'requested',
  },

  // Student pre-session form
  goalForm: {
    goals:     { type: String, default: '' },  // what they want to achieve
    questions: { type: String, default: '' },  // specific questions for the teacher
    mood:      { type: Number, min: 1, max: 5 }, // 1=very low, 5=confident
  },

  // Daily.co room
  roomName:     { type: String },
  roomUrl:      { type: String },
  recordingUrl: { type: String },

  // Session timeline
  startedAt: { type: Date },
  endedAt:   { type: Date },

  // Teacher notes (editable during/after call)
  notes: { type: String, default: '' },

  // Post-session mentor assessment
  assessment: {
    communication:    { type: Number, min: 1, max: 5 },
    confidence:       { type: Number, min: 1, max: 5 },
    technicalClarity: { type: Number, min: 1, max: 5 },
    problemSolving:   { type: Number, min: 1, max: 5 },
    overall:          { type: Number, min: 1, max: 5 },
    strengths:        { type: String, default: '' },
    areasToImprove:   { type: String, default: '' },
    remarks:          { type: String, default: '' },
  },

  // Action items assigned by teacher
  actionItems: [ActionItemSchema],

  // AI-generated summary (from notes + assessment)
  aiSummary: { type: String, default: '' },

  // Student self-reflection (after session)
  studentReflection: {
    sessionRating:  { type: Number, min: 1, max: 5 },
    helpfulness:    { type: Number, min: 1, max: 5 },
    notes:          { type: String, default: '' },
    submittedAt:    { type: Date },
  },
}, { timestamps: true });

MentorSessionSchema.index({ teacherId: 1, scheduledAt: -1 });
MentorSessionSchema.index({ studentId: 1, scheduledAt: -1 });

export const MentorSession = mongoose.models.MentorSession ||
  mongoose.model('MentorSession', MentorSessionSchema);
