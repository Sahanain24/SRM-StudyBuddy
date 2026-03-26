import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { StudyLog } from '@/lib/models/StudyLog';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let logs;
    if (userId) {
      logs = await StudyLog.find({ userId }).populate('userId');
    } else {
      logs = await StudyLog.find({}).populate('userId');
    }
    
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch study logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const studyLog = new StudyLog(body);
    await studyLog.save();
    await studyLog.populate('userId');
    return NextResponse.json(studyLog, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create study log' }, { status: 500 });
  }
}
