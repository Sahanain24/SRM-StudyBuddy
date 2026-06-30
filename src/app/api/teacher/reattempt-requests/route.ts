import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Exam } from '@/lib/models/Exam';

export const dynamic = 'force-dynamic';

// GET — all re-attempt requests across every scheduled AI exam
export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    // Fetch every exam document (we need all — teacher filtering happens on the client)
    const exams = await Exam.find({})
      .select('_id title subject examDate startTime teacherId reAttemptRequests')
      .lean() as any[];

    console.log(`[reattempt-requests GET] total exams=${exams.length}`);

    // Flatten into one list; skip exams with no requests
    const requests: any[] = [];
    for (const exam of exams) {
      const reqs = exam.reAttemptRequests;
      if (!Array.isArray(reqs) || reqs.length === 0) continue;

      for (const r of reqs) {
        requests.push({
          _id:         r._id?.toString() || '',
          userId:      r.userId      || '',
          userName:    r.userName    || '',
          requestedAt: r.requestedAt || new Date().toISOString(),
          status:      r.status      || 'pending',
          note:        r.note        || '',
          examId:      exam._id.toString(),
          examTitle:   exam.title    || '',
          examSubject: exam.subject  || '',
          examDate:    exam.examDate || '',
          startTime:   exam.startTime || '',
          teacherId:   exam.teacherId?.toString() || '',
        });
      }
    }

    console.log(`[reattempt-requests GET] total requests=${requests.length}`);
    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('[reattempt-requests GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
