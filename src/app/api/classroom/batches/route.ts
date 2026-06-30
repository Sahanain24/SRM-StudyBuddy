import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Batch } from '@/lib/models/Batch';
import { User } from '@/lib/models/User';

// GET /api/classroom/batches?teacherId=&studentId=
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const studentId = searchParams.get('studentId');

    let query: any = {};
    if (teacherId) query.teacherIds = teacherId;
    if (studentId) query.studentIds = studentId;

    const batches = await Batch.find(query).sort({ createdAt: -1 }).lean();

    // Attach student count without fetching all user docs
    const enriched = batches.map((b: any) => ({
      ...b,
      studentCount: b.studentIds?.length ?? 0,
    }));

    return NextResponse.json(enriched);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/classroom/batches — teacher creates a batch
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, program, year, section, subject, description, teacherId } = body;

    if (!name || !program || !year || !teacherId) {
      return NextResponse.json({ error: 'name, program, year, teacherId are required' }, { status: 400 });
    }

    // Prevent duplicate batches for the same program/year/section by this teacher
    const existing = await Batch.findOne({
      teacherIds: teacherId,
      program,
      year: Number(year),
      section: section || '',
    }).lean();
    if (existing) {
      return NextResponse.json({ error: 'A batch for this program, year and section already exists' }, { status: 409 });
    }

    // Auto-enroll all matching students at creation time so posts are
    // immediately visible to the right batch without a manual step.
    const filter: any = { role: 'student', program, year: Number(year), isActive: true };
    if (section) filter.section = section;
    const matchingStudents = await User.find(filter).select('_id').lean();

    const batch = await Batch.create({
      name, program, year: Number(year),
      section: section || '',
      subject: subject || '',
      description: description || '',
      teacherIds: [teacherId],
      studentIds: matchingStudents.map((s: any) => s._id),
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
