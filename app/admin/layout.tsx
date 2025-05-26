import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { verifyAdminJwt } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_session')?.value;
  const isAuthed = token ? verifyAdminJwt(token) : false;

  if (!isAuthed) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login?error=no-session';
    }
    // SSR Fallback (ничего не рендерим)
    return null;
  }

  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
}
