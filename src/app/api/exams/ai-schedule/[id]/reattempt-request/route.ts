import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Exam } from '@/lib/models/Exam';

export const dynamic = 'force-dynamic';

// POST — student submits a re-attempt request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { userId, userName, note } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const exam = await Exam.findById(id).lean() as any;
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Block duplicate pending requests
    const existing = (exam.reAttemptRequests || []).find(
      (r: any) => r.userId === userId && r.status === 'pending'
    );
    if (existing) {
      return NextResponse.json({ error: 'You already have a pending request.' }, { status: 409 });
    }

    // Remove any old request for this user, then push a fresh pending one
    await Exam.findByIdAndUpdate(id, { $pull: { reAttemptRequests: { userId } } });
    await Exam.findByIdAndUpdate(id, {
      $push: {
        reAttemptRequests: {
          userId,
          userName,
          requestedAt: new Date(),
          status: 'pending',
          note: note || '',
        },
      },
    });

    // Verify save
    const check = await Exam.findById(id).select('reAttemptRequests').lean() as any;
    console.log(
      `[reattempt POST] exam=${id} userId=${userId} requests_count=${(check?.reAttemptRequests || []).length}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[reattempt POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — teacher approves or declines a request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { userId, action } = await request.json();

    if (!userId || !['approve', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'userId and action (approve|decline) required' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'declined';

    // Update request status
    await Exam.findByIdAndUpdate(
      id,
      { $set: { 'reAttemptRequests.$[el].status': newStatus } },
      { arrayFilters: [{ 'el.userId': userId }] }
    );

    // If approved, grant a re-attempt permission
    if (action === 'approve') {
      const exam = await Exam.findById(id).select('reAttemptRequests reAttemptPermissions').lean() as any;
      const req  = (exam?.reAttemptRequests || []).find((r: any) => r.userId === userId);
      await Exam.findByIdAndUpdate(id, { $pull: { reAttemptPermissions: { userId } } });
      await Exam.findByIdAndUpdate(id, {
        $push: {
          reAttemptPermissions: {
            userId,
            userName: req?.userName || '',
            grantedAt: new Date(),
            used: false,
          },
        },
      });
    }

    console.log(`[reattempt PATCH] exam=${id} userId=${userId} action=${action}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[reattempt PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
