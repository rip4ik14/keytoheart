// ✅ Путь: app/admin/(protected)/layout.tsx
import type { ReactNode } from 'react';
import AdminProtectedLayoutClient from './AdminProtectedLayoutClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return <AdminProtectedLayoutClient>{children}</AdminProtectedLayoutClient>;
}
