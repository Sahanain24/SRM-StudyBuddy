import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Exam } from '@/lib/models/Exam';
import { ExamResult } from '@/lib/models/ExamResult';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';

    const exam = await Exam.findById(params.id).lean() as any;
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    if (exam.status !== 'published') {
      return NextResponse.json({ error: 'Exam is not available' }, { status: 403 });
    }

    // Enforce one-attempt rule
    if (userId) {
      const existing = await ExamResult.findOne({
        userId,
        courseId: params.id,
      }).lean();

      if (existing) {
        // Check for an unused re-attempt permission
        const permIndex = (exam.reAttemptPermissions || []).findIndex(
          (p: any) => p.userId === userId && !p.used
        );

        if (permIndex === -1) {
          return NextResponse.json(
            { error: 'You have already attempted this exam. Re-attempt is not permitted.', code: 'ALREADY_ATTEMPTED' },
            { status: 403 }
          );
        }

        // Consume the permission (mark as used)
        await Exam.findByIdAndUpdate(params.id, {
          $set: { [`reAttemptPermissions.${permIndex}.used`]: true },
        });
      }
    }

    return NextResponse.json(exam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
