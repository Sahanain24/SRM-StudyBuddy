import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AptitudeResult } from '@/lib/models/AptitudeResult';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const query  = userId ? { userId } : {};
    const results = await AptitudeResult.find(query).sort({ createdAt: -1 });
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body   = await request.json();
    const result = new AptitudeResult(body);
    await result.save();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}