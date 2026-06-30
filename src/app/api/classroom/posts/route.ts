import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClassPost } from '@/lib/models/ClassPost';

// GET /api/classroom/posts?batchId=&type=&topic=
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const type    = searchParams.get('type');
    const topic   = searchParams.get('topic');

    if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

    const query: any = { batchId };
    if (type)  query.type  = type;
    if (topic) query.topic = topic;

    const posts = await ClassPost.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(posts);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/classroom/posts — create a post
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      batchId, teacherId, teacherName, type,
      title, content, attachments, topic,
      dueDate, totalMarks, pollOptions, allowComments,
    } = body;

    if (!batchId || !teacherId || !type || !title) {
      return NextResponse.json({ error: 'batchId, teacherId, type, title required' }, { status: 400 });
    }

    const postData: any = {
      batchId, teacherId, teacherName: teacherName || '',
      type, title, content: content || '',
      attachments: attachments || [],
      topic: topic || '',
      allowComments: allowComments !== false,
    };

    if (type === 'assignment') {
      if (dueDate)    postData.dueDate    = new Date(dueDate);
      if (totalMarks) postData.totalMarks = Number(totalMarks);
    }

    if (type === 'poll' && Array.isArray(pollOptions)) {
      postData.pollOptions = pollOptions.map((text: string) => ({ text, voterIds: [] }));
    }

    const post = await ClassPost.create(postData);
    return NextResponse.json(post, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
