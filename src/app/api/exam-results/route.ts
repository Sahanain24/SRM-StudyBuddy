import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ExamResult } from '@/lib/models/ExamResult';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId      = searchParams.get('userId');
    const courseId    = searchParams.get('courseId');
    const leaderboard = searchParams.get('leaderboard');
    const firstOnly   = searchParams.get('firstOnly'); // for teacher first-attempt view

    if (leaderboard) {
      // Best score per user per subject
      const results = await ExamResult.aggregate([
        { $sort: { percentage: -1, timeTaken: 1 } },
        { $group: {
            _id: { userId: '$userId', courseId: '$courseId', subjectName: '$subjectName' },
            userName:    { $first: '$userName' },
            courseName:  { $first: '$courseName' },
            subjectName: { $first: '$subjectName' },
            bestScore:   { $max: '$percentage' },
            attempts:    { $sum: 1 },
        }},
        { $sort: { bestScore: -1 } },
        { $limit: 50 },
      ]);
      return NextResponse.json(results);
    }

    let query: any = {};
    if (userId)    query.userId  = userId;
    if (courseId)  query.courseId = courseId;
    if (firstOnly === '1') query.isFirstAttempt = true;

    const results = await ExamResult.find(query).sort({ createdAt: -1 });
    return NextResponse.json(results);
  } catch (error) {
    console.error('GET exam-results:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Check if this is the student's first attempt for this course+subject
    const existing = await ExamResult.findOne({
      userId:      body.userId,
      courseId:    body.courseId,
      subjectName: body.subjectName,
    });
    body.isFirstAttempt = !existing;

    const result = new ExamResult(body);
    await result.save();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST exam-result:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}