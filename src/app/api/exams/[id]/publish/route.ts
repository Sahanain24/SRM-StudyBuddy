import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { QuestionBank } from '@/lib/models/QuestionBank';
import { Question } from '@/lib/models/Question';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const query = teacherId ? { teacherId, isActive: true } : { isActive: true };
    const banks = await QuestionBank.find(query).sort({ createdAt: -1 });

    // Attach question count
    const enriched = await Promise.all(banks.map(async b => {
      const count = await Question.countDocuments({ bankId: b._id });
      return { ...b.toObject(), questionCount: count };
    }));
    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const bank = new QuestionBank(body);
    await bank.save();
    return NextResponse.json(bank, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}