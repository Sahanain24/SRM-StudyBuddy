import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MentorSession } from '@/lib/models/MentorSession';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await MentorSession.findById(params.id).lean();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    return NextResponse.json(session);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — update notes, assessment, status, goalForm, actionItems
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();

    // Build a flat update from allowed fields
    const update: any = {};
    const scalar = ['notes', 'status', 'topic', 'durationMins', 'recordingUrl', 'aiSummary'];
    for (const key of scalar) if (body[key] !== undefined) update[key] = body[key];

    if (body.assessment)        update.assessment        = body.assessment;
    if (body.goalForm)          update.goalForm          = body.goalForm;
    if (body.actionItems)       update.actionItems       = body.actionItems;
    if (body.studentReflection) update.studentReflection = body.studentReflection;

    const session = await MentorSession.findByIdAndUpdate(params.id, update, { new: true });
    return NextResponse.json(session);
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
    await MentorSession.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
