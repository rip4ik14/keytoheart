import type { ReactNode } from "react";
import AdminShell from ".(protected)/AdminShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
