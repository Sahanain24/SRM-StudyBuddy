import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PlacementUpdate } from '@/lib/models/PlacementUpdate';

// GET /api/placements?studentId=&program=&status=
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const program    = searchParams.get('program');
    const status     = searchParams.get('status');

    const query: any = {};
    if (studentId) query.studentId = studentId;
    if (program)    query.program  = program;
    if (status)     query.status   = status;

    const updates = await PlacementUpdate.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(updates);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/placements — teacher or HOD reports a placement update
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      studentId, studentName, rollNumber, program, year, section,
      status, companyName, role, packageLPA, notes,
      reportedById, reportedByName, reportedByRole,
    } = body;

    if (!studentId || !studentName || !status || !companyName || !reportedById) {
      return NextResponse.json({ error: 'studentId, studentName, status, companyName, reportedById are required' }, { status: 400 });
    }

    const update = await PlacementUpdate.create({
      studentId, studentName, rollNumber, program, year: year ? Number(year) : undefined, section,
      status, companyName, role, packageLPA: packageLPA ? Number(packageLPA) : undefined, notes,
      reportedById, reportedByName, reportedByRole,
    });

    return NextResponse.json(update, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
