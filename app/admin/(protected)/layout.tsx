import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';

import AdminProtectedLayoutClient from './AdminProtectedLayoutClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function isAuthed() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  return !!token && verifyAdminJwt(token);
}

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  if (!(await isAuthed())) redirect('/admin/login');
  return <AdminProtectedLayoutClient>{children}</AdminProtectedLayoutClient>;
}
