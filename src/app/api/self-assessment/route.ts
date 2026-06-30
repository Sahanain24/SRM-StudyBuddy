import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SelfAssessment } from '@/lib/models/SelfAssessment';
import { User } from '@/lib/models/User';
import { AuditLog } from '@/lib/models/AuditLog';
import { computeEmployabilityScore, getReadinessLevel } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, sectionA, sectionB, sectionC, sectionD, sectionE, sectionF } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already submitted (and admin has not reset it)
    const existing = await SelfAssessment.findOne({ userId });
    if (existing && !existing.adminResetAllowed) {
      return NextResponse.json(
        { error: 'Assessment already submitted. Contact your administrator to reset.' },
        { status: 409 }
      );
    }

    // Compute employability score from Section B
    const employabilityScore = computeEmployabilityScore(sectionB || {});
    const readinessLevel = getReadinessLevel(employabilityScore);

    // Save or update assessment
    const assessment = await SelfAssessment.findOneAndUpdate(
      { userId },
      {
        userId,
        rollNumber:  user.rollNumber || '',
        studentName: user.name,
        submittedAt: new Date(),
        adminResetAllowed: false,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        sectionA,
        sectionB,
        sectionC,
        sectionD,
        sectionE,
        sectionF,
        employabilityScore,
        readinessLevel,
      },
      { upsert: true, new: true }
    );

    // Mark user as having completed the assessment
    await User.findByIdAndUpdate(userId, {
      isFirstLogin: false,
      selfAssessmentCompleted: true,
      selfAssessmentId: assessment._id,
      program: sectionA?.program   || user.program,
      year:    sectionA?.yearOfStudy || user.year,
    });

    // Write audit log
    await AuditLog.create({
      userId:   user._id,
      userName: user.name,
      userRole: 'student',
      action:   'SELF_ASSESSMENT_SUBMIT',
      resource: 'selfassessments',
      details:  { assessmentId: assessment._id, employabilityScore },
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Self-assessment POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save assessment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const program     = searchParams.get('program');
    const year        = searchParams.get('year');
    const sector      = searchParams.get('sector');
    const aspiration  = searchParams.get('aspiration');

    const query: Record<string, any> = {};
    if (program)    query['sectionA.program']          = program;
    if (year)       query['sectionA.yearOfStudy']      = parseInt(year);
    if (sector)     query['sectionC.preferredSector']  = sector;
    if (aspiration) query['sectionA.careerAspiration'] = aspiration;

    const assessments = await SelfAssessment.find(query).sort({ submittedAt: -1 });
    return NextResponse.json(assessments);

  } catch (error: any) {
    console.error('Self-assessment GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}