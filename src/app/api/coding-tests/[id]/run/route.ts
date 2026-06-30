import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CodingTest } from '@/lib/models/CodingTest';
import { runTestCases } from '@/lib/judge';

// POST /api/coding-tests/[id]/run — run code against the *visible* (non-hidden) test cases of one problem
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const { problemId, code, language } = await request.json();

    const test = await CodingTest.findById(id).lean() as any;
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    const problem = test.problems.find((p: any) => p.problemId === problemId);
    if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });

    const visibleCases = (problem.testCases || []).filter((tc: any) => !tc.hidden);
    const result = await runTestCases(language || problem.language, code, visibleCases);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
