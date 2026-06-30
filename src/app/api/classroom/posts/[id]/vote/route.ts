import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClassPost } from '@/lib/models/ClassPost';

// POST — cast or retract a poll vote
// Body: { userId, optionId }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { userId, optionId } = await request.json();
    if (!userId || !optionId) {
      return NextResponse.json({ error: 'userId and optionId required' }, { status: 400 });
    }

    const post = await ClassPost.findById(params.id);
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.type !== 'poll') return NextResponse.json({ error: 'Not a poll' }, { status: 400 });
    if (post.pollClosedAt && new Date() > post.pollClosedAt) {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 403 });
    }

    // Remove user from all options first (one vote per poll)
    for (const opt of post.pollOptions) {
      opt.voterIds = opt.voterIds.filter((id: string) => id !== userId);
    }

    // Add vote to chosen option
    const chosen = post.pollOptions.id(optionId);
    if (!chosen) return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    if (!chosen.voterIds.includes(userId)) chosen.voterIds.push(userId);

    await post.save();
    return NextResponse.json(post);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
