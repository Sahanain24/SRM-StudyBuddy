import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AuditLog } from '@/lib/models/AuditLog';

// GET /api/admin/audit-logs — paginated, filterable audit trail
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const role   = searchParams.get('role');
    const search = searchParams.get('search');
    const limit  = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    const query: any = {};
    if (action) query.action   = action;
    if (role)   query.userRole = role;
    if (search) query.userName = { $regex: search, $options: 'i' };

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(limit).lean();
    const actions = await AuditLog.distinct('action');

    return NextResponse.json({ logs, actions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
