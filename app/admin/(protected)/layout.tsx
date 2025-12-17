export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { ReactNode } from 'react';
import AdminProtectedLayoutClient from './AdminProtectedLayoutClient';

export default function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminProtectedLayoutClient>{children}</AdminProtectedLayoutClient>;
}
