import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MentorSession } from '@/lib/models/MentorSession';

// GET /api/mentor/sessions?teacherId=&studentId=&status=
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');
    const status    = searchParams.get('status');

    const query: any = {};
    if (teacherId) query.teacherId = teacherId;
    if (studentId) query.studentId = studentId;
    if (status)    query.status    = status;

    const sessions = await MentorSession.find(query)
      .sort({ scheduledAt: -1 })
      .lean();

    return NextResponse.json(sessions);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/mentor/sessions — teacher schedules a session with a student
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      studentId, studentName, rollNumber, program, year, section,
      teacherId, teacherName,
      scheduledAt, durationMins, topic,
    } = body;

    if (!studentId || !teacherId || !scheduledAt) {
      return NextResponse.json({ error: 'studentId, teacherId, scheduledAt required' }, { status: 400 });
    }

    const session = await MentorSession.create({
      studentId, studentName, rollNumber, program, year: Number(year), section: section || '',
      teacherId, teacherName,
      scheduledAt: new Date(scheduledAt),
      durationMins: durationMins || 30,
      topic: topic || '',
      status: 'requested',
    });

    return NextResponse.json(session, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
