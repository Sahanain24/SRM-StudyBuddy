import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';
import { User } from '../src/lib/models/User';
import { StudyLog } from '../src/lib/models/StudyLog';
import { StudySession } from '../src/lib/models/StudySession';
import { QuizResult } from '../src/lib/models/QuizResult';
import { CodingSubmission } from '../src/lib/models/CodingSubmission';
import { CommunicationHistory } from '../src/lib/models/CommunicationHistory';
import { TeacherFeedback } from '../src/lib/models/TeacherFeedback';

async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await StudyLog.deleteMany({});
    await StudySession.deleteMany({});
    await QuizResult.deleteMany({});
    await CodingSubmission.deleteMany({});
    await CommunicationHistory.deleteMany({});
    await TeacherFeedback.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create sample users
    const studentUser = new User({
      name: 'Alex Student',
      email: 'alex@srm.edu',
      role: 'student',
    });
    
    const teacherUser = new User({
      name: 'Dr. Smith',
      email: 'smith@srm.edu',
      role: 'teacher',
    });
    
    await studentUser.save();
    await teacherUser.save();
    
    console.log('Created sample users');
    
    // Create sample study logs
    const studyLog1 = new StudyLog({
      userId: studentUser._id,
      title: 'Introduction to React',
      content: 'React is a JavaScript library for building user interfaces. It uses components and virtual DOM for efficient rendering.',
      subject: 'Computer Science',
      date: new Date(),
    });
    
    const studyLog2 = new StudyLog({
      userId: studentUser._id,
      title: 'Data Structures Overview',
      content: 'Arrays, linked lists, stacks, queues, trees, and graphs are fundamental data structures in computer science.',
      subject: 'Data Structures',
      date: new Date(Date.now() - 86400000), // 1 day ago
    });
    
    await studyLog1.save();
    await studyLog2.save();
    
    console.log('Created sample study logs');
    
    // Create sample study sessions
    const session1 = new StudySession({
      userId: studentUser._id,
      subject: 'React Development',
      duration: 3600, // 1 hour in seconds
      date: new Date(),
    });
    
    const session2 = new StudySession({
      userId: studentUser._id,
      subject: 'Data Structures',
      duration: 5400, // 1.5 hours in seconds
      date: new Date(Date.now() - 86400000), // 1 day ago
    });
    
    await session1.save();
    await session2.save();
    
    console.log('Created sample study sessions');
    
    // Create sample quiz results
    const quiz1 = new QuizResult({
      userId: studentUser._id,
      subject: 'React Fundamentals',
      score: 8,
      total: 10,
      date: new Date(),
    });
    
    const quiz2 = new QuizResult({
      userId: studentUser._id,
      subject: 'Data Structures',
      score: 7,
      total: 10,
      date: new Date(Date.now() - 86400000), // 1 day ago
    });
    
    await quiz1.save();
    await quiz2.save();
    
    console.log('Created sample quiz results');
    
    // Create sample coding submissions
    const coding1 = new CodingSubmission({
      userId: studentUser._id,
      problemId: 'react-components-101',
      code: 'function Welcome(props) { return <h1>Hello, {props.name}</h1>; }',
      result: 'passed',
      date: new Date(),
    });
    
    const coding2 = new CodingSubmission({
      userId: studentUser._id,
      problemId: 'linked-list-reverse',
      code: 'function reverseLinkedList(head) { /* implementation */ }',
      result: 'failed',
      date: new Date(Date.now() - 86400000), // 1 day ago
    });
    
    await coding1.save();
    await coding2.save();
    
    console.log('Created sample coding submissions');
    
    // Create sample communication history
    const comm1 = new CommunicationHistory({
      userId: studentUser._id,
      transcription: 'Today I learned about React components and props. They are reusable pieces of UI that accept input called props.',
      sentiment: 'positive',
      overallFeedback: 'Good explanation of React concepts. Clear and concise.',
      date: new Date(),
    });
    
    await comm1.save();
    
    console.log('Created sample communication history');
    
    // Create sample teacher feedback
    const feedback1 = new TeacherFeedback({
      teacherId: teacherUser._id,
      studentId: studentUser._id,
      message: 'Great progress on React concepts! Keep practicing component composition.',
      date: new Date(),
      read: false,
    });
    
    const feedback2 = new TeacherFeedback({
      teacherId: teacherUser._id,
      studentId: studentUser._id,
      message: 'Your data structures understanding is improving. Try implementing more algorithms.',
      date: new Date(Date.now() - 86400000), // 1 day ago
      read: true,
    });
    
    await feedback1.save();
    await feedback2.save();
    
    console.log('Created sample teacher feedback');
    
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed function
seedDatabase();
