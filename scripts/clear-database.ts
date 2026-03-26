import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';
import { User } from '../src/lib/models/User';
import { StudyLog } from '../src/lib/models/StudyLog';
import { StudySession } from '../src/lib/models/StudySession';
import { QuizResult } from '../src/lib/models/QuizResult';
import { CodingSubmission } from '../src/lib/models/CodingSubmission';
import { CommunicationHistory } from '../src/lib/models/CommunicationHistory';
import { TeacherFeedback } from '../src/lib/models/TeacherFeedback';

async function clearDatabase() {
  try {
    await connectDB();
    
    console.log('Clearing all data from database...');
    
    // Clear all collections
    await User.deleteMany({});
    await StudyLog.deleteMany({});
    await StudySession.deleteMany({});
    await QuizResult.deleteMany({});
    await CodingSubmission.deleteMany({});
    await CommunicationHistory.deleteMany({});
    await TeacherFeedback.deleteMany({});
    
    console.log('✅ Database cleared successfully!');
    console.log('📝 All default data has been removed.');
    console.log('🚀 Your application will now only store data you create through the UI.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the clear function
clearDatabase();
