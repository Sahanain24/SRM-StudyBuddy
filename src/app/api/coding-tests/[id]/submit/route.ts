import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CodingTest } from '@/lib/models/CodingTest';
import { CodingTestSubmission } from '@/lib/models/CodingTestSubmission';
import { runTestCases } from '@/lib/judge';

// POST /api/coding-tests/[id]/submit — final submission, runs ALL test cases (incl. hidden) for every problem
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { studentId, studentName, rollNumber, program, year, section, answers } = body;

    if (!studentId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'studentId and answers are required' }, { status: 400 });
    }

    const test = await CodingTest.findById(id).lean() as any;
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    let totalMarks = 0;
    let obtainedMarks = 0;
    const evaluated = [];

    for (const problem of test.problems) {
      totalMarks += problem.marks || 0;
      const ans = answers.find((a: any) => a.problemId === problem.problemId);
      const code = ans?.code || '';
      const language = ans?.language || problem.language;

      let passedCount = 0;
      const totalCount = (problem.testCases || []).length;
      if (code.trim() && totalCount > 0) {
        const result = await runTestCases(language, code, problem.testCases);
        passedCount = result.passedCount;
      }

      const marksAwarded = totalCount > 0 ? Math.round((passedCount / totalCount) * (problem.marks || 0)) : 0;
      obtainedMarks += marksAwarded;

      evaluated.push({
        problemId: problem.problemId,
        code, language, passedCount, totalCount, marksAwarded,
      });
    }

    const submission = await CodingTestSubmission.findOneAndUpdate(
      { testId: id, studentId },
      {
        testId: id, studentId, studentName, rollNumber, program, year, section,
        answers: evaluated, totalMarks, obtainedMarks, submittedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(submission, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
