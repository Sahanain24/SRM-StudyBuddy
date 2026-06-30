import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MentorSession } from '@/lib/models/MentorSession';

// PATCH — student marks an action item complete / teacher edits it
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    await connectDB();
    const { status } = await request.json();

    const session = await MentorSession.findById(params.id);
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const item = session.actionItems.id(params.itemId);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    item.status      = status;
    item.completedAt = status === 'completed' ? new Date() : undefined;
    await session.save();

    return NextResponse.json(session);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
