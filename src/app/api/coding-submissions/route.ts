import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { CodingSubmission } from '@/lib/models/CodingSubmission';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let submissions;
    if (userId) {
      // Handle both string and ObjectId formats
      submissions = await CodingSubmission.find({ 
        $or: [
          { userId: userId },
          { userId: new mongoose.Types.ObjectId(userId) }
        ]
      }).populate('userId');
    } else {
      submissions = await CodingSubmission.find({}).populate('userId');
    }
    
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Fetch coding submissions error:', error);
    return NextResponse.json({ error: 'Failed to fetch coding submissions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const submission = new CodingSubmission(body);
    await submission.save();
    await submission.populate('userId');
    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create coding submission' }, { status: 500 });
  }
}
