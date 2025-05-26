// Путь: app/admin/layout.tsx
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
