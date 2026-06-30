import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Batch } from '@/lib/models/Batch';
import { User } from '@/lib/models/User';

// POST — add students by program+year+section (bulk enroll) or by studentId
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();

    if (body.studentId) {
      // Add a single student
      await Batch.findByIdAndUpdate(params.id, {
        $addToSet: { studentIds: body.studentId },
      });
      return NextResponse.json({ success: true });
    }

    if (body.enrollByFilter) {
      // Auto-enroll all students matching program + year + section
      const { program, year, section } = body.enrollByFilter;
      const filter: any = { role: 'student', program, year: Number(year), isActive: true };
      if (section) filter.section = section;

      const students = await User.find(filter).select('_id').lean();
      const ids = students.map((s: any) => s._id);

      await Batch.findByIdAndUpdate(params.id, {
        $addToSet: { studentIds: { $each: ids } },
      });
      return NextResponse.json({ added: ids.length });
    }

    return NextResponse.json({ error: 'Provide studentId or enrollByFilter' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — remove a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { studentId } = await request.json();
    await Batch.findByIdAndUpdate(params.id, {
      $pull: { studentIds: studentId },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
