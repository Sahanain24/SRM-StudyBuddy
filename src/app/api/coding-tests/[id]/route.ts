import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CodingTest } from '@/lib/models/CodingTest';

// GET /api/coding-tests/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === 'true';

    const test = await CodingTest.findById(id).lean() as any;
    if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Hide test cases marked `hidden` (and their expected outputs) unless explicitly
    // requested with ?full=true (teacher/grading use only) — students must not see them.
    if (!full) {
      test.problems = test.problems.map((p: any) => ({
        ...p,
        testCases: (p.testCases || []).filter((tc: any) => !tc.hidden),
      }));
    }

    return NextResponse.json(test);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
