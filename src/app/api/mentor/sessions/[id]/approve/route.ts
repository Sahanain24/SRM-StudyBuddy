import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MentorSession } from '@/lib/models/MentorSession';

const DAILY_API_KEY = process.env.DAILY_API_KEY || '';
const DAILY_DOMAIN  = process.env.DAILY_DOMAIN  || '';

async function createDailyRoom(sessionId: string): Promise<{ name: string; url: string }> {
  const roomName = `mentor-${sessionId}`;
  const res = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: {
        enable_recording:         'cloud',
        enable_chat:              true,
        enable_screenshare:       true,
        start_video_off:          false,
        start_audio_off:          false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // expires in 24h
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Daily.co room creation failed: ${err.error || res.statusText}`);
  }

  const data = await res.json();
  return { name: data.name, url: data.url };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    const { action } = body; // 'approve' | 'reject'

    if (action === 'reject') {
      const session = await MentorSession.findByIdAndUpdate(
        params.id, { status: 'rejected' }, { new: true }
      );
      return NextResponse.json(session);
    }

    // Approve: create Daily.co room
    if (!DAILY_API_KEY || !DAILY_DOMAIN) {
      return NextResponse.json(
        { error: 'DAILY_API_KEY and DAILY_DOMAIN env vars are not configured' },
        { status: 500 }
      );
    }

    const { name, url } = await createDailyRoom(params.id);

    const session = await MentorSession.findByIdAndUpdate(
      params.id,
      { status: 'approved', roomName: name, roomUrl: url },
      { new: true }
    );

    return NextResponse.json(session);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
