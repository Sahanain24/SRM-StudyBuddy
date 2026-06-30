import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Exam } from '@/lib/models/Exam';

// POST — grant a re-attempt to a student
// Body: { userId: string, userName: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { userId, userName } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const exam = await Exam.findById(id);
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    // Remove any existing (used or unused) permission for this user, then add a fresh one
    exam.reAttemptPermissions = (exam.reAttemptPermissions || []).filter(
      (p: any) => p.userId !== userId
    );
    exam.reAttemptPermissions.push({ userId, userName, grantedAt: new Date(), used: false });
    await exam.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — revoke an unused re-attempt permission
// Body: { userId: string }
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    await Exam.findByIdAndUpdate(id, {
      $pull: { reAttemptPermissions: { userId, used: false } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
