import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { StudySession } from '@/lib/models/StudySession';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let sessions;
    if (userId) {
      sessions = await StudySession.find({ userId }).populate('userId');
    } else {
      sessions = await StudySession.find({}).populate('userId');
    }
    
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch study sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const studySession = new StudySession(body);
    await studySession.save();
    await studySession.populate('userId');
    return NextResponse.json(studySession, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create study session' }, { status: 500 });
  }
}
