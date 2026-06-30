import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AssignmentSubmission } from '@/lib/models/AssignmentSubmission';

// GET — teacher fetches all submissions for a post, or student fetches their own
// ?studentId= for student's own; no param = all (teacher)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    const query: any = { postId: params.id };
    if (studentId) query.studentId = studentId;

    const subs = await AssignmentSubmission.find(query).sort({ submittedAt: -1 }).lean();
    return NextResponse.json(subs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — student submits assignment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    const { batchId, studentId, studentName, rollNumber, content, attachments } = body;

    if (!studentId || !batchId) {
      return NextResponse.json({ error: 'studentId and batchId required' }, { status: 400 });
    }

    // Upsert — student can update their submission before grading
    const sub = await AssignmentSubmission.findOneAndUpdate(
      { postId: params.id, studentId },
      {
        postId: params.id,
        batchId, studentId, studentName, rollNumber,
        content: content || '',
        attachments: attachments || [],
        submittedAt: new Date(),
        status: 'submitted',
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(sub, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
