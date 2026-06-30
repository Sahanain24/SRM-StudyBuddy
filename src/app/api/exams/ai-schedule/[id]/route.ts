import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Exam } from '@/lib/models/Exam';

export const dynamic = 'force-dynamic';

// PATCH — teacher reschedules the exam (update date/time)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { examDate, startTime, endTime } = await request.json();

    const update: Record<string, string> = {};
    if (examDate)  update.examDate  = examDate;
    if (startTime) update.startTime = startTime;
    if (endTime)   update.endTime   = endTime;

    const exam = await Exam.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(exam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    // Always include reAttemptPermissions; exclude only the heavy questions array
    const exam = await Exam.findById(id).select('-questions').lean();
    if (!exam) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(exam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
