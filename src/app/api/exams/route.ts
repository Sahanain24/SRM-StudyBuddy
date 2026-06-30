import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SelfAssessment } from '@/lib/models/SelfAssessment';
import { User } from '@/lib/models/User';
import { ExamAttempt } from '@/lib/models/ExamAttempt';
import { Exam } from '@/lib/models/Exam';
import { Question } from '@/lib/models/Question';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      bankId, teacherId, title, subject, description,
      examDate, startTime, durationMins,
      totalMarks, passingMarks,
      shuffleQuestions, shuffleOptions, showResultImmediately,
      targetPrograms, targetYears, targetBatches,
    } = body;

    if (!teacherId || !title || !durationMins || !bankId) {
      return NextResponse.json(
        { error: 'teacherId, title, durationMins, and bankId are required' },
        { status: 400 }
      );
    }

    // Pull all questions from the bank and embed them in the exam
    const questions = await Question.find({ bankId }).lean();
    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Question bank has no questions. Add questions before scheduling.' },
        { status: 400 }
      );
    }

    const computedTotalMarks = totalMarks || questions.reduce((s: number, q: any) => s + (q.marks || 1), 0);

    const exam = await Exam.create({
      teacherId,
      title:       title.trim(),
      subject:     subject?.trim()     || '',
      description: description?.trim() || '',
      examDate:    examDate            || '',
      startTime:   startTime           || '',
      durationMins: Number(durationMins),
      totalQuestions:      questions.length,
      totalMarks:          computedTotalMarks,
      passingMarks:        passingMarks || Math.ceil(computedTotalMarks * 0.4),
      shuffleQuestions:    !!shuffleQuestions,
      shuffleOptions:      !!shuffleOptions,
      showResultImmediately: showResultImmediately !== false,
      targetPrograms:  targetPrograms  || [],
      targetYears:     targetYears     || [],
      targetBatches:   targetBatches   || [],
      questions,
      status: 'published',
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error: any) {
    console.error('Create exam error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

    if (type === 'summary') {
      const [totalStudents, totalAssessed, allAttempts, allAssessments] = await Promise.all([
        User.countDocuments({ role: 'student', isActive: true }),
        SelfAssessment.countDocuments(),
        ExamAttempt.find({ status: 'submitted' }),
        SelfAssessment.find(),
      ]);

      const completionRate = totalStudents > 0
        ? Math.round((totalAssessed / totalStudents) * 100) : 0;

      const avgEmployability = allAssessments.length > 0
        ? Math.round(allAssessments.reduce((a, s) => a + (s.employabilityScore || 0), 0) / allAssessments.length)
        : 0;

      const examPassRate = allAttempts.length > 0
        ? Math.round((allAttempts.filter(a => a.isPassed).length / allAttempts.length) * 100)
        : 0;

      return NextResponse.json({ totalStudents, totalAssessed, completionRate, avgEmployability, examPassRate });
    }

    if (type === 'program-wise') {
      const data = await SelfAssessment.aggregate([
        { $group: {
            _id: '$sectionA.program',
            avgScore:   { $avg: '$employabilityScore' },
            count:      { $sum: 1 },
            avgCGPA:    { $avg: '$sectionA.cgpa' },
            avgComm:    { $avg: '$sectionB.communicationSkills' },
            avgTech:    { $avg: '$sectionB.technicalKnowledge' },
            avgLead:    { $avg: '$sectionB.leadershipSkills' },
        }},
        { $sort: { avgScore: -1 } },
      ]);
      return NextResponse.json(data);
    }

    if (type === 'skill-heatmap') {
      const data = await SelfAssessment.aggregate([
        { $group: {
            _id: '$sectionA.program',
            communication:   { $avg: '$sectionB.communicationSkills' },
            problemSolving:  { $avg: '$sectionB.problemSolving' },
            technical:       { $avg: '$sectionB.technicalKnowledge' },
            teamwork:        { $avg: '$sectionB.teamworkCollaboration' },
            timeManagement:  { $avg: '$sectionB.timeManagement' },
            leadership:      { $avg: '$sectionB.leadershipSkills' },
            criticalThinking:{ $avg: '$sectionB.criticalThinking' },
            emotional:       { $avg: '$sectionB.emotionalIntelligence' },
            industry:        { $avg: '$sectionB.industryReadiness' },
        }},
      ]);
      return NextResponse.json(data);
    }

    if (type === 'career-aspirations') {
      const data = await SelfAssessment.aggregate([
        { $group: { _id: '$sectionA.careerAspiration', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      return NextResponse.json(data);
    }

    if (type === 'training-demand') {
      const data = await SelfAssessment.aggregate([
        { $unwind: '$sectionE.trainingNeeds' },
        { $group: { _id: '$sectionE.trainingNeeds', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      return NextResponse.json(data);
    }

    if (type === 'readiness-distribution') {
      const data = await SelfAssessment.aggregate([
        { $group: { _id: '$readinessLevel', count: { $sum: 1 } } },
      ]);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Analytics failed' }, { status: 500 });
  }
}