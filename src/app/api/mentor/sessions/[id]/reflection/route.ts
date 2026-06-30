import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MentorSession } from '@/lib/models/MentorSession';

// POST — student submits their self-reflection
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { sessionRating, helpfulness, notes } = await request.json();

    const session = await MentorSession.findByIdAndUpdate(
      params.id,
      {
        studentReflection: {
          sessionRating: Number(sessionRating),
          helpfulness:   Number(helpfulness),
          notes:         notes || '',
          submittedAt:   new Date(),
        },
      },
      { new: true }
    );

    return NextResponse.json(session);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
