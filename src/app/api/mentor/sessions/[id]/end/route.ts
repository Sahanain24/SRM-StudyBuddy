import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MentorSession } from '@/lib/models/MentorSession';

const DAILY_API_KEY = process.env.DAILY_API_KEY || '';

// POST — mark session as completed, optionally fetch recording URL
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const session = await MentorSession.findById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const endedAt = new Date();
    session.status  = 'completed';
    session.endedAt = endedAt;

    // Try to retrieve recording from Daily.co (may not be ready immediately)
    if (DAILY_API_KEY && session.roomName) {
      try {
        const res = await fetch(
          `https://api.daily.co/v1/recordings?room_name=${session.roomName}`,
          { headers: { Authorization: `Bearer ${DAILY_API_KEY}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const recs = data.data || [];
          if (recs.length > 0) {
            // Most recent recording
            session.recordingUrl = recs[0].download_link || recs[0].s3key || '';
          }
        }
      } catch { /* non-blocking */ }
    }

    await session.save();
    return NextResponse.json(session);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
