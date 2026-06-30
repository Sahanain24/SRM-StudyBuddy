import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AssignmentSubmission } from '@/lib/models/AssignmentSubmission';

// PATCH — teacher grades a submission
// Body: { grade, feedback, gradedBy }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; subId: string } }
) {
  try {
    await connectDB();
    const { grade, feedback, gradedBy } = await request.json();

    const sub = await AssignmentSubmission.findByIdAndUpdate(
      params.subId,
      {
        grade: Number(grade),
        feedback: feedback || '',
        gradedBy: gradedBy || '',
        gradedAt: new Date(),
        status: 'graded',
      },
      { new: true }
    );

    if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    return NextResponse.json(sub);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
