// ✅ Путь: app/admin/layout.tsx
import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
}
