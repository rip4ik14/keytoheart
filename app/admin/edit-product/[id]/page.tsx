import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminJwt } from '@/lib/auth';

import EditProductPageClient from './EditProductPageClient';

function requireAdmin() {
  const token = cookies().get('admin_session')?.value;
  if (!token || !verifyAdminJwt(token)) redirect('/admin/login');
}

export default function EditProductPage() {
  requireAdmin();
  return <EditProductPageClient />;
}
