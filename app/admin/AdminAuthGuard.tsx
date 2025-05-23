// app/admin/AdminAuthGuard.tsx
'use client';

import { ReactNode } from "react";
import { redirect } from "next/navigation";

// Этот компонент будет обёрнут внутри async Layout

export default function AdminAuthGuardWrapper({ isAuthed, children }: { isAuthed: boolean, children: ReactNode }) {
  if (!isAuthed) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
