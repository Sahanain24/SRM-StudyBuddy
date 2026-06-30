import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Exam } from '@/lib/models/Exam';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const query = teacherId ? { teacherId } : {};
    const exams = await Exam.find(query).sort({ createdAt: -1 });
    return NextResponse.json(exams);
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const exam = new Exam({ ...body, status: 'draft' });
    await exam.save();
    return NextResponse.json(exam, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}