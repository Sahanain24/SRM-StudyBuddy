import mongoose from 'mongoose';

const SelfAssessmentSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNumber:  { type: String },
  studentName: { type: String },
  submittedAt: { type: Date, default: Date.now },
  adminResetAllowed: { type: Boolean, default: false },
  ipAddress:   { type: String },

  // Section A
  sectionA: {
    program:          { type: String, required: true },
    yearOfStudy:      { type: Number, required: true },
    cgpa:             { type: Number, required: true },
    careerAspiration: { type: String, required: true },
  },

  // Section B — 1 to 5 scale
  sectionB: {
    communicationSkills:   { type: Number, min: 1, max: 5 },
    problemSolving:        { type: Number, min: 1, max: 5 },
    technicalKnowledge:    { type: Number, min: 1, max: 5 },
    teamworkCollaboration: { type: Number, min: 1, max: 5 },
    timeManagement:        { type: Number, min: 1, max: 5 },
    leadershipSkills:      { type: Number, min: 1, max: 5 },
    criticalThinking:      { type: Number, min: 1, max: 5 },
    emotionalIntelligence: { type: Number, min: 1, max: 5 },
    industryReadiness:     { type: Number, min: 1, max: 5 },
  },

  // Section C
  sectionC: {
    preferredSector: { type: String },
  },

  // Section D
  sectionD: {
    curriculumJobRelevance: { type: Number, min: 1, max: 5 },
  },

  // Section E
  sectionE: {
    trainingNeeds: [{ type: String }],
    trainingMode:  { type: String },
  },

  // Section F
  sectionF: {
    skillGapOpinion:       { type: String },
    institutionSuggestion: { type: String },
  },

  // Computed
  employabilityScore: { type: Number },  // 0–100
  readinessLevel:     { type: String },  // 'Low' | 'Moderate' | 'High' | 'Very High'
}, { timestamps: true });

SelfAssessmentSchema.index({ userId: 1 }, { unique: true });

export const SelfAssessment = mongoose.models.SelfAssessment ||
  mongoose.model('SelfAssessment', SelfAssessmentSchema);