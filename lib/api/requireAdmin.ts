import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminJwt } from '@/lib/auth';

export async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  if (!token || !verifyAdminJwt(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
