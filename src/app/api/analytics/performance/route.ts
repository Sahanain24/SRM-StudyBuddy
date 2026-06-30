import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AptitudeResult } from '@/lib/models/AptitudeResult';
import { CodingTestSubmission } from '@/lib/models/CodingTestSubmission';
import { User } from '@/lib/models/User';

// GET /api/analytics/performance
// "Exam" KPIs now come from AptitudeResult (Aptitude Arena), since Exam Arena was removed.
// Pass ?teacherId=<id> to scope the overview to that teacher's own students
// (matched by the teacher's assignedPrograms/assignedDepartments). All other
// roles (admin, hod, dean, deputy_dean, pro_vc) get the overall figures.
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const teacherId = request.nextUrl.searchParams.get('teacherId');
    let studentIds: any[] | null = null;

    if (teacherId) {
      const teacher = await User.findById(teacherId).lean() as any;
      const programs    = teacher?.assignedPrograms    || [];
      const departments = teacher?.assignedDepartments || [];
      if (programs.length || departments.length) {
        const students = await User.find({
          role: 'student',
          $or: [
            ...(programs.length    ? [{ program: { $in: programs } }]       : []),
            ...(departments.length ? [{ department: { $in: departments } }] : []),
          ],
        }).select('_id').lean();
        studentIds = students.map((s: any) => s._id);
      } else {
        studentIds = [];
      }
    }

    const examMatch   = studentIds ? [{ $match: { userId:    { $in: studentIds } } }] : [];
    const codingMatch = studentIds ? [{ $match: { studentId: { $in: studentIds } } }] : [];

    // ── Overview ──────────────────────────────────────────────────────────────
    const examAgg = await AptitudeResult.aggregate([
      ...examMatch,
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: '$percentage' },
          totalAttempts: { $sum: 1 },
          passCount: { $sum: { $cond: [{ $gte: ['$percentage', 50] }, 1, 0] } },
        },
      },
    ]);

    // First attempt per student per topic
    const firstAttemptAgg = await AptitudeResult.aggregate([
      ...examMatch,
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: { userId: '$userId', topic: '$topic' },
          firstPct: { $first: '$percentage' },
        },
      },
      {
        $group: {
          _id: null,
          avgFirstAttempt: { $avg: '$firstPct' },
          count: { $sum: 1 },
        },
      },
    ]);

    const codingAgg = await CodingTestSubmission.aggregate([
      ...codingMatch,
      {
        $group: {
          _id: null,
          avgPct: { $avg: { $cond: [{ $gt: ['$totalMarks', 0] }, { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] }, 0] } },
          totalSubmissions: { $sum: 1 },
        },
      },
    ]);

    const e  = examAgg[0]        || {};
    const fe = firstAttemptAgg[0] || {};
    const c  = codingAgg[0]       || {};

    const overview = {
      examAvgAll:          Math.round(e.avgPercentage   || 0),
      examAvgFirstAttempt: Math.round(fe.avgFirstAttempt || 0),
      examTotalAttempts:   e.totalAttempts  || 0,
      examPassRate: e.totalAttempts ? Math.round((e.passCount / e.totalAttempts) * 100) : 0,
      codingAvg:               Math.round(c.avgPct || 0),
      codingTotalSubmissions:  c.totalSubmissions || 0,
    };

    // ── Program-wise ──────────────────────────────────────────────────────────
    const examByProgram = await AptitudeResult.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      { $match: { 'user.program': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$user.program',
          examAvg:  { $avg: '$percentage' },
          attempts: { $sum: 1 },
          students: { $addToSet: '$user._id' },
        },
      },
    ]);

    const codingByProgram = await CodingTestSubmission.aggregate([
      { $match: { program: { $exists: true, $ne: '' }, totalMarks: { $gt: 0 } } },
      {
        $group: {
          _id: '$program',
          codingAvg:   { $avg: { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] } },
          submissions: { $sum: 1 },
          students:    { $addToSet: '$studentId' },
        },
      },
    ]);

    const programMap: Record<string, any> = {};
    examByProgram.forEach((r: any) => {
      programMap[r._id] = {
        program: r._id, examAvg: Math.round(r.examAvg || 0), examAttempts: r.attempts,
        students: r.students.length, codingAvg: 0, codingSubmissions: 0,
      };
    });
    codingByProgram.forEach((r: any) => {
      if (!programMap[r._id]) programMap[r._id] = { program: r._id, examAvg: 0, examAttempts: 0, students: r.students.length, codingAvg: 0, codingSubmissions: 0 };
      programMap[r._id].codingAvg         = Math.round(r.codingAvg || 0);
      programMap[r._id].codingSubmissions  = r.submissions;
      programMap[r._id].students           = Math.max(programMap[r._id].students, r.students.length);
    });
    const byProgram = Object.values(programMap).sort((a: any, b: any) => a.program.localeCompare(b.program));

    // ── Batch-wise ────────────────────────────────────────────────────────────
    const examByBatch = await AptitudeResult.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      { $match: { 'user.batch': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$user.batch',
          examAvg:  { $avg: '$percentage' },
          attempts: { $sum: 1 },
          students: { $addToSet: '$user._id' },
        },
      },
    ]);

    const codingByBatch = await CodingTestSubmission.aggregate([
      { $match: { totalMarks: { $gt: 0 } } },
      { $lookup: { from: 'users', localField: 'studentId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      { $match: { 'user.batch': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$user.batch',
          codingAvg:   { $avg: { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] } },
          submissions: { $sum: 1 },
          students:    { $addToSet: '$user._id' },
        },
      },
    ]);

    const batchMap: Record<string, any> = {};
    examByBatch.forEach((r: any) => {
      batchMap[r._id] = { batch: r._id, examAvg: Math.round(r.examAvg || 0), examAttempts: r.attempts, students: r.students.length, codingAvg: 0, codingSubmissions: 0 };
    });
    codingByBatch.forEach((r: any) => {
      if (!batchMap[r._id]) batchMap[r._id] = { batch: r._id, examAvg: 0, examAttempts: 0, students: r.students.length, codingAvg: 0, codingSubmissions: 0 };
      batchMap[r._id].codingAvg        = Math.round(r.codingAvg || 0);
      batchMap[r._id].codingSubmissions = r.submissions;
      batchMap[r._id].students          = Math.max(batchMap[r._id].students, r.students.length);
    });
    const byBatch = Object.values(batchMap).sort((a: any, b: any) => a.batch.localeCompare(b.batch));

    // ── Section-wise ──────────────────────────────────────────────────────────
    const examBySection = await AptitudeResult.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      { $match: { 'user.section': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: { program: '$user.program', year: '$user.year', section: '$user.section' },
          examAvg:  { $avg: '$percentage' },
          attempts: { $sum: 1 },
          students: { $addToSet: '$user._id' },
        },
      },
    ]);

    const codingBySection = await CodingTestSubmission.aggregate([
      { $match: { section: { $exists: true, $ne: '' }, totalMarks: { $gt: 0 } } },
      {
        $group: {
          _id: { program: '$program', year: '$year', section: '$section' },
          codingAvg:   { $avg: { $multiply: [{ $divide: ['$obtainedMarks', '$totalMarks'] }, 100] } },
          submissions: { $sum: 1 },
          students:    { $addToSet: '$studentId' },
        },
      },
    ]);

    const sectionKey = (k: any) => `${k.program || '—'}|${k.year || '—'}|${k.section || '—'}`;
    const sectionMap: Record<string, any> = {};
    examBySection.forEach((r: any) => {
      const key = sectionKey(r._id);
      sectionMap[key] = {
        program: r._id.program || '—', year: r._id.year || '—', section: r._id.section || '—',
        examAvg: Math.round(r.examAvg || 0), examAttempts: r.attempts,
        students: r.students.length, codingAvg: 0, codingSubmissions: 0,
      };
    });
    codingBySection.forEach((r: any) => {
      const key = sectionKey(r._id);
      if (!sectionMap[key]) sectionMap[key] = { program: r._id.program || '—', year: r._id.year || '—', section: r._id.section || '—', examAvg: 0, examAttempts: 0, students: r.students.length, codingAvg: 0, codingSubmissions: 0 };
      sectionMap[key].codingAvg        = Math.round(r.codingAvg || 0);
      sectionMap[key].codingSubmissions = r.submissions;
      sectionMap[key].students          = Math.max(sectionMap[key].students, r.students.length);
    });
    const bySection = Object.values(sectionMap).sort((a: any, b: any) =>
      a.program.localeCompare(b.program) || (a.year - b.year) || a.section.localeCompare(b.section)
    );

    // ── Attempt-wise comparison (avg % per 1st, 2nd, 3rd... attempt per topic) ─
    const attemptSeries = await AptitudeResult.aggregate([
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: { userId: '$userId', topic: '$topic' },
          percentages: { $push: '$percentage' },
        },
      },
      { $unwind: { path: '$percentages', includeArrayIndex: 'attemptIdx' } },
      {
        $group: {
          _id: '$attemptIdx',
          avgPercentage: { $avg: '$percentages' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 5 },
    ]);
    const attemptComparison = attemptSeries.map((r: any) => ({
      attempt: r._id + 1,
      avgPercentage: Math.round(r.avgPercentage || 0),
      count: r.count,
    }));

    return NextResponse.json({ overview, byProgram, byBatch, bySection, attemptComparison });
  } catch (error) {
    console.error('Analytics performance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch performance analytics' }, { status: 500 });
  }
}
