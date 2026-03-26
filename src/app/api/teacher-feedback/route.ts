import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { TeacherFeedback } from '@/lib/models/TeacherFeedback';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    let feedback;
    if (studentId) {
      // Handle both string and ObjectId formats with better error handling
      try {
        feedback = await TeacherFeedback.find({ 
          studentId: {
            $or: [
              { studentId: studentId },
              { studentId: new mongoose.Types.ObjectId(studentId) }
            ]
          }
        })
        .populate('teacherId')
        .populate('studentId')
        .sort({ date: -1 });
      } catch (objectIdError) {
        // If ObjectId conversion fails, try with string only
        console.warn('ObjectId conversion failed, using string:', studentId);
        feedback = await TeacherFeedback.find({ studentId })
          .populate('teacherId')
          .populate('studentId')
          .sort({ date: -1 });
      }
    } else {
      feedback = await TeacherFeedback.find({})
        .populate('teacherId')
        .populate('studentId')
        .sort({ date: -1 });
    }
    
    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Fetch teacher feedback error:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher feedback' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Convert string IDs to ObjectIds if needed
    if (body.teacherId && typeof body.teacherId === 'string') {
      try {
        body.teacherId = new mongoose.Types.ObjectId(body.teacherId);
      } catch (e) {
        // If conversion fails, keep as string
      }
    }
    
    if (body.studentId && typeof body.studentId === 'string') {
      try {
        body.studentId = new mongoose.Types.ObjectId(body.studentId);
      } catch (e) {
        // If conversion fails, keep as string
      }
    }
    
    const feedback = new TeacherFeedback(body);
    await feedback.save();
    await feedback.populate('teacherId').populate('studentId');
    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Create teacher feedback error:', error);
    return NextResponse.json({ error: 'Failed to create teacher feedback' }, { status: 500 });
  }
}
