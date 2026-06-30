import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { AuditLog } from '@/lib/models/AuditLog';
import { SelfAssessment } from '@/lib/models/SelfAssessment';

// GET /api/admin/overview — system-wide stats for the admin dashboard
export async function GET() {
  try {
    await connectDB();

    const roleCounts = await User.aggregate([
      { $group: { _id: '$role', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      { $sort: { _id: 1 } },
    ]);

    const [totalUsers, activeUsers, inactiveUsers, totalAssessments, recentLogs, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      SelfAssessment.countDocuments(),
      AuditLog.find().sort({ timestamp: -1 }).limit(10).lean(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role rollNumber createdAt').lean(),
    ]);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalAssessments,
      roleCounts: roleCounts.map((r: any) => ({ role: r._id, total: r.total, active: r.active })),
      recentLogs,
      recentUsers,
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
