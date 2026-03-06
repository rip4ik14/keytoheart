import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';

import EditProductPageClient from './EditProductPageClient';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token || !verifyAdminJwt(token)) redirect('/admin/login');
}

export default async function EditProductPage() {
  await requireAdmin();
  return <EditProductPageClient />;
}
