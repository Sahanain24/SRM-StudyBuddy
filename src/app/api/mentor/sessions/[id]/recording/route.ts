import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MentorSession } from '@/lib/models/MentorSession';

const DAILY_API_KEY = process.env.DAILY_API_KEY || '';

// GET — poll Daily.co for recording and save URL to session
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await MentorSession.findById(params.id);
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!DAILY_API_KEY || !session.roomName) {
      return NextResponse.json({ recordingUrl: session.recordingUrl || null });
    }

    // Fetch recordings for this room from Daily.co
    const res  = await fetch(
      `https://api.daily.co/v1/recordings?room_name=${session.roomName}`,
      { headers: { Authorization: `Bearer ${DAILY_API_KEY}` } }
    );

    if (!res.ok) {
      return NextResponse.json({ recordingUrl: session.recordingUrl || null });
    }

    const data = await res.json();
    const recs = data.data || [];

    if (recs.length > 0) {
      const url = recs[0].download_link || '';
      if (url && url !== session.recordingUrl) {
        session.recordingUrl = url;
        await session.save();
      }
      return NextResponse.json({ recordingUrl: url, recordings: recs });
    }

    return NextResponse.json({ recordingUrl: session.recordingUrl || null, recordings: [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
