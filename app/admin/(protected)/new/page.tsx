// ✅ Путь: app/(protected)/new/page.tsx

import { redirect } from 'next/navigation';

export default function AdminNewRedirect() {
  redirect('/admin/products/new');
}
