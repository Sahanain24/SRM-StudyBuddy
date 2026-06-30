import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClassComment } from '@/lib/models/ClassComment';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const comments = await ClassComment.find({ postId: params.id })
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json(comments);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { userId, userName, role, content } = await request.json();
    if (!userId || !content) {
      return NextResponse.json({ error: 'userId and content required' }, { status: 400 });
    }
    const comment = await ClassComment.create({
      postId: params.id, userId, userName, role: role || 'student', content,
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
