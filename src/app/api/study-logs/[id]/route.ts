import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { StudyLog } from '@/lib/models/StudyLog';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;
    
    const deletedLog = await StudyLog.findByIdAndDelete(id);
    
    if (!deletedLog) {
      return NextResponse.json({ error: 'Study log not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Study log deleted successfully' });
  } catch (error) {
    console.error('Delete study log error:', error);
    return NextResponse.json({ error: 'Failed to delete study log' }, { status: 500 });
  }
}
