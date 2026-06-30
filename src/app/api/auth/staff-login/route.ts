import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      role: { $in: ['teacher', 'hod', 'dean', 'deputy_dean', 'pro_vc', 'admin'] },
      isActive: true,
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Default password is the user's email if no password set
    const expectedPassword = user.password || user.email;
    if (password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const role = user.role;
    let redirect = '/dashboard';
    if (['dean', 'deputy_dean', 'pro_vc', 'hod'].includes(role)) {
      redirect = '/dashboard/dean';
    }

    return NextResponse.json({
      success: true,
      redirect,
      user: {
        _id:  user._id.toString(),
        id:   user._id.toString(),
        name: user.name,
        role: user.role,
        email: user.email,
        assignedPrograms:    user.assignedPrograms,
        assignedDepartments: user.assignedDepartments,
      },
    });
  } catch (error: any) {
    console.error('Staff login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
