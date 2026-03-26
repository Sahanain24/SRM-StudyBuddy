import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { CommunicationHistory } from '@/lib/models/CommunicationHistory';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let history;
    if (userId) {
      // Handle both string and ObjectId formats
      history = await CommunicationHistory.find({ 
        $or: [
          { userId: userId },
          { userId: new mongoose.Types.ObjectId(userId) }
        ]
      }).populate('userId');
    } else {
      history = await CommunicationHistory.find({}).populate('userId');
    }
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Fetch communication history error:', error);
    return NextResponse.json({ error: 'Failed to fetch communication history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const entry = new CommunicationHistory(body);
    await entry.save();
    await entry.populate('userId');
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create communication entry' }, { status: 500 });
  }
}
