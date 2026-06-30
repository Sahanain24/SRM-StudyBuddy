import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Batch } from '@/lib/models/Batch';
import { User } from '@/lib/models/User';

// GET /api/classroom/batches/[id] — batch details + students list
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    let batch = await Batch.findById(params.id).lean() as any;
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    // Keep enrollment in sync — pick up any students who match this batch's
    // program/year/section but were registered after the batch was created.
    const filter: any = { role: 'student', program: batch.program, year: batch.year, isActive: true };
    if (batch.section) filter.section = batch.section;
    const matchingIds = (await User.find(filter).select('_id').lean()).map((s: any) => s._id);

    if (matchingIds.length > 0) {
      batch = await Batch.findByIdAndUpdate(
        params.id,
        { $addToSet: { studentIds: { $each: matchingIds } } },
        { new: true }
      ).lean() as any;
    }

    // Fetch students
    const students = await User.find({ _id: { $in: batch.studentIds } })
      .select('_id name rollNumber program year section email')
      .lean();

    return NextResponse.json({ ...batch, students });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/classroom/batches/[id] — update batch metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    const allowed = ['name', 'subject', 'description', 'section'];
    const update: any = {};
    for (const key of allowed) if (body[key] !== undefined) update[key] = body[key];

    const batch = await Batch.findByIdAndUpdate(params.id, update, { new: true });
    return NextResponse.json(batch);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/classroom/batches/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    await Batch.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
