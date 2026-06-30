import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name:       String,
  email:      String,
  rollNumber: String,
  password:   String,   // plain text — default = roll number for students
  role:       String,
  program:    String,
  year:       Number,
  isFirstLogin:            { type: Boolean, default: true  },
  selfAssessmentCompleted: { type: Boolean, default: false },
  isActive:                { type: Boolean, default: true  },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const accounts = [
    { name: 'System Administrator', email: 'admin@srm.edu.in',   password: 'Admin@123',    role: 'admin',        isFirstLogin: false, selfAssessmentCompleted: true  },
    { name: 'HOD',                  email: 'hod@srm.edu.in',     password: 'Hod@123',      role: 'hod',          isFirstLogin: false, selfAssessmentCompleted: true  },
    { name: 'Dean',                 email: 'dean@srm.edu.in',    password: 'Dean@123',     role: 'dean',         isFirstLogin: false, selfAssessmentCompleted: true  },
    { name: 'Deputy Dean',          email: 'dydean@srm.edu.in',  password: 'DyDean@123',   role: 'deputy_dean',  isFirstLogin: false, selfAssessmentCompleted: true  },
    { name: 'Pro-Vice Chancellor',  email: 'provc@srm.edu.in',   password: 'ProVC@123',    role: 'pro_vc',       isFirstLogin: false, selfAssessmentCompleted: true  },
    { name: 'Demo Teacher',         email: 'teacher@srm.edu.in', password: 'Teacher@123',  role: 'teacher',      isFirstLogin: false, selfAssessmentCompleted: true  },
  ];

  for (const acc of accounts) {
    await User.findOneAndUpdate(
      { email: acc.email },
      { ...acc, isActive: true },
      { upsert: true, new: true }
    );
    console.log(`✓ ${acc.role.padEnd(14)} → ${acc.email.padEnd(25)} / ${acc.password}`);
  }

  // Demo student — password = roll number
  const roll = 'RA2211003010001';
  await User.findOneAndUpdate(
    { rollNumber: roll },
    {
      name: 'Demo Student', rollNumber: roll,
      password: roll,   // default password = roll number
      role: 'student', program: 'BCA', year: 2,
      isFirstLogin: true, selfAssessmentCompleted: false, isActive: true,
    },
    { upsert: true, new: true }
  );
  console.log(`✓ student        → Roll: ${roll} / Password: ${roll}`);

  await mongoose.disconnect();
  console.log('\nDone. Disconnected from MongoDB.');
}

seed().catch(err => { console.error(err); process.exit(1); });