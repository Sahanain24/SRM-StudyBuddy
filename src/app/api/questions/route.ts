import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Question } from '@/lib/models/Question';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const bankId    = searchParams.get('bankId');
    const teacherId = searchParams.get('teacherId');

    const query: any = {};
    if (bankId)    query.bankId    = bankId;
    if (teacherId) query.teacherId = teacherId;

    const questions = await Question.find(query).sort({ createdAt: 1 });
    return NextResponse.json(questions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.questionText || !body.teacherId) {
      return NextResponse.json({ error: 'questionText and teacherId are required' }, { status: 400 });
    }

    const normalised = body.questionText.trim().toLowerCase().replace(/\s+/g, ' ');
    const duplicate  = await Question.findOne({
      bankId:      body.bankId,
      $expr: {
        $eq: [{ $toLower: { $trim: { input: '$questionText' } } }, normalised],
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: 'duplicate' }, { status: 409 });
    }

    const question = await Question.create({
      bankId:       body.bankId,
      teacherId:    body.teacherId,
      questionText: body.questionText.trim(),
      questionType: body.questionType || 'MCQ',
      options:      body.options      || [],
      explanation:  body.explanation?.trim() || '',
      marks:        body.marks        || 1,
      difficulty:   body.difficulty   || 'Medium',
      topic:        body.topic?.trim() || '',
      tags:         body.tags         || [],
    });

    return NextResponse.json(question, { status: 201 });
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

    await Question.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
