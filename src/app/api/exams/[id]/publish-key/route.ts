import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Question } from '@/lib/models/Question';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const bankId = searchParams.get('bankId');
    const query  = bankId ? { bankId } : {};
    const questions = await Question.find(query).sort({ createdAt: -1 });
    return NextResponse.json(questions);
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const q = new Question(body);
    await q.save();
    return NextResponse.json(q, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}