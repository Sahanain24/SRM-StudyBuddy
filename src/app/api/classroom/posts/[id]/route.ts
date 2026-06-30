import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClassPost } from '@/lib/models/ClassPost';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    const allowed = ['title', 'content', 'isPinned', 'allowComments', 'pollClosedAt', 'topic', 'dueDate', 'totalMarks'];
    const update: any = {};
    for (const key of allowed) if (body[key] !== undefined) update[key] = body[key];
    const post = await ClassPost.findByIdAndUpdate(params.id, update, { new: true });
    return NextResponse.json(post);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    await ClassPost.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
