// ✅  components/LogoutButton.tsx
'use client';
import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/admin-logout', { method: 'POST' });
    window.location.href = '/admin/login';
    window.gtag?.('event', 'admin_logout', { event_category: 'admin' });
    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', 'admin_logout');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-black text-sm underline hover:text-gray-800 transition focus:outline-none focus:ring-2 focus:ring-black"
      aria-label="Выйти из админ-панели"
    >
      Выйти
    </button>
  );
}
