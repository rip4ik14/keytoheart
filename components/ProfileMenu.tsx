'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';

export default function ProfileMenu() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [bonus, setBonus] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) {
      setBonus(null);
      return;
    }

    async function loadBonuses(session: NonNullable<ReturnType<typeof useSession>>) {
      const { data, error } = await supabase
        .from('bonuses')
        .select('bonus_balance')
        .eq('phone', session.user.user_metadata.phone)
        .single();
      if (!error && data) setBonus(data.bonus_balance);
    }

    loadBonuses(session);
  }, [session, supabase]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (session === undefined) {
    return null;
  }

  return (
    <div ref={ref} className="relative">
      {session ? (
        <>
          <button
            onClick={() => {
              setOpen((prev) => !prev);
              window.gtag?.('event', 'profile_menu_toggle', { event_category: 'profile' });
              window.ym?.(96644553, 'reachGoal', 'profile_menu_toggle');
            }}
            className="flex items-center gap-2 px-4 py-1 border rounded-full hover:bg-gray-100"
            aria-label="Открыть меню профиля"
            aria-expanded={open}
          >
            {bonus !== null && (
              <span className="rounded-full border px-2 py-[2px] text-xs font-semibold">
                {bonus}
              </span>
            )}
            Профиль
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-md z-50"
              role="menu"
              aria-label="Меню профиля"
            >
              <Link
                href="/account"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  setOpen(false);
                  window.gtag?.('event', 'profile_menu_account', { event_category: 'profile' });
                  window.ym?.(96644553, 'reachGoal', 'profile_menu_account');
                }}
                role="menuitem"
              >
                История заказов
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setOpen(false);
                  toast.success('Вы вышли из аккаунта');
                  window.gtag?.('event', 'profile_menu_signout', { event_category: 'profile' });
                  window.ym?.(96644553, 'reachGoal', 'profile_menu_signout');
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                role="menuitem"
                aria-label="Выйти из аккаунта"
              >
                Выйти
              </button>
            </div>
          )}
        </>
      ) : (
        <Link
          href="/account"
          className="px-4 py-1 border rounded-full hover:bg-gray-100 flex items-center gap-1"
          onClick={() => {
            window.gtag?.('event', 'profile_menu_login', { event_category: 'profile' });
            window.ym?.(96644553, 'reachGoal', 'profile_menu_login');
          }}
          aria-label="Войти в аккаунт"
        >
          <Image
            src="/icons/user.svg"
            alt="User Icon"
            width={16}
            height={16}
            className="inline-block"
          />
          Вход
        </Link>
      )}
    </div>
  );
}