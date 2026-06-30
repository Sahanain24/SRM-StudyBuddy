import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { SelfAssessment } from '@/lib/models/SelfAssessment';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();

    if (body.action === 'reset-password') {
      const user = await User.findById(params.id);
      if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      await User.findByIdAndUpdate(params.id, { password: user.rollNumber });
      return NextResponse.json({ success: true, message: 'Password reset to roll number' });
    }

    if (body.action === 'reset-assessment') {
      await Promise.all([
        User.findByIdAndUpdate(params.id, {
          selfAssessmentCompleted: false,
          isFirstLogin: true,
        }),
        // Allow the student to resubmit — this is what the submission gate checks
        SelfAssessment.findOneAndUpdate(
          { userId: params.id },
          { adminResetAllowed: true },
          { upsert: false }, // only update if document exists; no doc = first-timer, no block anyway
        ),
      ]);
      return NextResponse.json({ success: true, message: 'Assessment reset' });
    }

    // General field update — strip protected fields
    const { role, password, _id, ...updates } = body;
    const updated = await User.findByIdAndUpdate(params.id, updates, { new: true }).select('-password');
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await User.findByIdAndUpdate(params.id, { isActive: false });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
