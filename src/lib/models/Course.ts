import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  syllabus: { type: String, required: true }, // Free-text syllabus, used as AI prompt context
  topics: [{ type: String }],                 // Optional topic tags
});

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String, required: true },
  subjects: [SubjectSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);