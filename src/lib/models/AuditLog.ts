import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName:  { type: String },
  userRole:  { type: String },
  action:    { type: String, required: true },
  resource:  { type: String },
  details:   { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
});

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.models.AuditLog ||
  mongoose.model('AuditLog', AuditLogSchema);