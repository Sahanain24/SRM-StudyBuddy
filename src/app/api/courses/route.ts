import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Course } from '@/lib/models/Course';

// GET all active courses (optionally filter by teacherId)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    const query = teacherId ? { teacherId, isActive: true } : { isActive: true };
    const courses = await Course.find(query).sort({ createdAt: -1 });
    return NextResponse.json(courses);
  } catch (error) {
    console.error('GET courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST create a new course
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const course = new Course(body);
    await course.save();
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('POST course error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}