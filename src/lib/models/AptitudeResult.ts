import mongoose from 'mongoose';

const AptitudeResultSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, required: true },
  topic:     { type: String, required: true },       // e.g. "Time & Work"
  score:     { type: Number, required: true },
  total:     { type: Number, required: true },
  percentage:{ type: Number, required: true },
  timeTaken: { type: Number, required: true },        // seconds
  answers:        [{ type: Number }],
  correctAnswers: [{ type: Number }],
  questions:      [{ type: mongoose.Schema.Types.Mixed }], // full Q+options+explanation+steps
  date:      { type: String, required: true },
}, { timestamps: true });

export const AptitudeResult = mongoose.models.AptitudeResult || mongoose.model('AptitudeResult', AptitudeResultSchema);