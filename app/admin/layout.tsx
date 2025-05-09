import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
}