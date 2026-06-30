import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { QuestionBank } from '@/lib/models/QuestionBank';
import { Question } from '@/lib/models/Question';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    const query: any = { isActive: true };
    if (teacherId) query.teacherId = teacherId;

    const banks = await QuestionBank.find(query).sort({ createdAt: -1 });

    // Attach question count to each bank
    const withCounts = await Promise.all(
      banks.map(async (b) => {
        const count = await Question.countDocuments({ bankId: b._id });
        return { ...b.toObject(), questionCount: count };
      })
    );

    return NextResponse.json(withCounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.teacherId || !body.title) {
      return NextResponse.json({ error: 'teacherId and title are required' }, { status: 400 });
    }

    const bank = await QuestionBank.create({
      teacherId:   body.teacherId,
      title:       body.title.trim(),
      subject:     body.subject?.trim()     || '',
      programs:    body.programs            || [],
      description: body.description?.trim() || '',
      isActive:    true,
    });

    return NextResponse.json(bank, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await QuestionBank.findByIdAndUpdate(id, { isActive: false });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
