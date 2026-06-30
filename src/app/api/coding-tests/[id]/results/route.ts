import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CodingTestSubmission } from '@/lib/models/CodingTestSubmission';

// GET /api/coding-tests/[id]/results — all student submissions for a test
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    const query: any = { testId: id };
    if (studentId) query.studentId = studentId;

    const results = await CodingTestSubmission.find(query).sort({ obtainedMarks: -1 }).lean();
    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
