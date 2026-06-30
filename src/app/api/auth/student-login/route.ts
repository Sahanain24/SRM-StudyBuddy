import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { AuditLog } from '@/lib/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { rollNumber, password } = await request.json();

    if (!rollNumber) {
      return NextResponse.json({ error: 'Roll number is required' }, { status: 400 });
    }

    // Find student by roll number
    const user = await User.findOne({
      rollNumber: rollNumber.toUpperCase().trim(),
      isActive: true,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid roll number or password' },
        { status: 401 }
      );
    }

    // Simple password check — default password is the roll number itself
    const expectedPassword = user.password || user.rollNumber;
    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Invalid roll number or password' },
        { status: 401 }
      );
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    // Audit log — non-blocking
    AuditLog.create({
      userId: user._id, userName: user.name, userRole: 'student',
      action: 'LOGIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date(),
    }).catch(() => {});

    const redirect = user.selfAssessmentCompleted ? '/dashboard' : '/onboarding';

    return NextResponse.json({
      success: true,
      redirect,
      user: {
        _id:  user._id.toString(),
        id:   user._id.toString(),
        name: user.name,
        role: user.role,
        rollNumber:  user.rollNumber,
        program:     user.program,
        year:        user.year,
        batch:       user.batch,
        section:     user.section,
        selfAssessmentCompleted: user.selfAssessmentCompleted,
      },
    });
  } catch (error: any) {
    console.error('Student login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
