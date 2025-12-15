// app/admin/(protected)/layout.tsx
import type { ReactNode } from 'react';
import AdminShell from './AdminShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
