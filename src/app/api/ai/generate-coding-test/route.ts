import { NextRequest, NextResponse } from 'next/server';
import { generateCodingTestFlow } from '@/ai/flows/generate-coding-test-flow';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, difficulty, language, numProblems } = body;

    if (!topic) {
      return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    }

    const output = await generateCodingTestFlow({ topic, difficulty, language, numProblems });
    return NextResponse.json(output);
  } catch (e: any) {
    console.error('AI generate-coding-test error:', e?.message);
    return NextResponse.json({ error: e?.message || 'AI generation failed' }, { status: 500 });
  }
}
