import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const program    = searchParams.get('program');
    const year       = searchParams.get('year');
    const batch      = searchParams.get('batch');
    const department = searchParams.get('department');

    const query: any = { role: 'student', isActive: true };
    if (program)    query.program    = program;
    if (year)       query.year       = parseInt(year);
    if (batch)      query.batch      = batch;
    if (department) query.department = department;

    const students = await User.find(query)
      .select('-password')
      .sort({ rollNumber: 1 });

    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // Bulk import — array of students
    if (Array.isArray(body)) {
      const results = { created: 0, skipped: 0, errors: [] as string[] };

      for (const s of body) {
        const roll = s.rollNumber?.toString().toUpperCase().trim();
        if (!roll || !s.name) {
          results.errors.push(`Missing rollNumber or name`);
          continue;
        }
        try {
          const existing = await User.findOne({ rollNumber: roll });
          if (existing) { results.skipped++; continue; }

          await User.create({
            name:       s.name.toString().trim(),
            rollNumber: roll,
            password:   roll,
            email:      s.email?.toString().trim() || '',
            role:       'student',
            program:    s.program?.toString().trim()    || '',
            department: s.department?.toString().trim() || '',
            year:       parseInt(s.year)               || 1,
            batch:      s.batch?.toString().trim()      || '',
            section:    s.section?.toString().trim()    || '',
            isFirstLogin:            true,
            selfAssessmentCompleted: false,
            isActive:                true,
          });
          results.created++;
        } catch (err: any) {
          results.errors.push(`${roll}: ${err.message}`);
        }
      }
      return NextResponse.json(results, { status: 201 });
    }

    // Single student
    const roll = body.rollNumber?.toUpperCase().trim();
    if (!roll || !body.name) {
      return NextResponse.json({ error: 'Name and roll number are required' }, { status: 400 });
    }

    const existing = await User.findOne({ rollNumber: roll });
    if (existing) {
      return NextResponse.json({ error: 'Roll number already exists' }, { status: 409 });
    }

    const student = await User.create({
      name:       body.name.trim(),
      rollNumber: roll,
      password:   roll,
      email:      body.email?.trim() || '',
      role:       'student',
      program:    body.program?.trim()    || '',
      department: body.department?.trim() || '',
      year:       parseInt(body.year)     || 1,
      batch:      body.batch?.trim()      || '',
      section:    body.section?.trim()    || '',
      isFirstLogin:            true,
      selfAssessmentCompleted: false,
      isActive:                true,
    });

    const { password: _pw, ...safe } = student.toObject();
    return NextResponse.json(safe, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
