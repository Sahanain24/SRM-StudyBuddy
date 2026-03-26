import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { QuizResult } from '@/lib/models/QuizResult';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let results;
    if (userId) {
      // Handle both string and ObjectId formats
      results = await QuizResult.find({ 
        $or: [
          { userId: userId },
          { userId: new mongoose.Types.ObjectId(userId) }
        ]
      }).populate('userId');
    } else {
      results = await QuizResult.find({}).populate('userId');
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Fetch quiz results error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz results' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const quizResult = new QuizResult(body);
    await quizResult.save();
    await quizResult.populate('userId');
    return NextResponse.json(quizResult, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create quiz result' }, { status: 500 });
  }
}
