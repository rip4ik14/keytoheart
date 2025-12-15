import { Toaster } from 'react-hot-toast';
import type { ReactNode } from 'react';

export const dynamic = "force-dynamic";
export const revalidate = 0;


export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
}
