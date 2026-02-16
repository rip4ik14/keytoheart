'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hideButton?: boolean;
};

const NAV_H_VAR = '--kth-bottom-nav-h';

export default function BurgerMenu({ open, onOpenChange, hideButton }: Props) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navLinks = useMemo(
    () => [
      { name: 'Каталог', href: '/#catalog' },
      { name: 'О нас', href: '/about' },
      { name: 'Доставка', href: '/dostavka' },
      { name: 'Часто задаваемые вопросы', href: '/faq' },
      { name: 'Оплата', href: '/payment' },
      { name: 'Программа лояльности', href: '/loyalty' },
      { name: 'Корпоративным клиентам', href: '/corporate' },
      { name: 'Новости', href: '/news' },
      { name: 'Статьи', href: '/articles' },
      { name: 'Праздники', href: '/occasions' },
      { name: 'Контакты', href: '/contacts' },
    ],
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onOpenChange]);

  // свайп влево закрывает
  useEffect(() => {
    let startX = 0;
    const menu = menuRef.current;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (startX - e.changedTouches[0].clientX > 50) onOpenChange(false);
    };

    if (menu) {
      menu.addEventListener('touchstart', onTouchStart, { passive: true });
      menu.addEventListener('touchend', onTouchEnd, { passive: true });
    }
    return () => {
      if (menu) {
        menu.removeEventListener('touchstart', onTouchStart);
        menu.removeEventListener('touchend', onTouchEnd);
      }
    };
  }, [onOpenChange]);

  const trackOpen = () => {
    window.gtag?.('event', 'open_burger_menu', { event_category: 'navigation' });
    if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'open_burger_menu');
  };

  const trackLink = (name: string) => {
    window.gtag?.('event', 'burger_menu_link', { event_category: 'navigation', link: name });
    if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'burger_menu_link', { link: name });
  };

  return (
    <>
      {!hideButton && (
        <button
          onClick={() => {
            const next = !open;
            onOpenChange(next);
            if (next) trackOpen();
          }}
          className="p-2 hover:bg-gray-100 rounded"
          aria-label="Открыть меню навигации"
        >
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* overlay - НЕ перекрывает нижнее меню */}
      {open && (
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => onOpenChange(false)}
          className="fixed left-0 right-0 top-0 z-[1090] bg-black/40"
          style={{
            bottom: `var(${NAV_H_VAR}, 0px)`,
          }}
        />
      )}

      {/* drawer - НЕ перекрывает нижнее меню */}
      <div
        ref={menuRef}
        className={`
          fixed top-0 left-0 z-[1100] w-72 bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          height: `calc(100dvh - var(${NAV_H_VAR}, 0px))`,
          bottom: `var(${NAV_H_VAR}, 0px)`,
        }}
        role="dialog"
        aria-label="Меню навигации"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-sm font-semibold">Меню</span>
          <button onClick={() => onOpenChange(false)} aria-label="Закрыть меню навигации">
            <Image src="/icons/times.svg" alt="Close" width={20} height={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1" aria-label="Основная навигация">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={() => {
                onOpenChange(false);
                trackLink(link.name);
              }}
              className="block py-2 text-black hover:bg-gray-100 transition-colors"
              tabIndex={open ? 0 : -1}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4 flex gap-4 text-xl text-black">
          <a
            href="https://vk.com/key_to_heart_store"
            target="_blank"
            rel="noopener noreferrer"
            title="ВКонтакте"
            aria-label="Перейти в ВКонтакте"
          >
            <Image src="/icons/vk.svg" alt="VK" width={24} height={24} />
          </a>
          <a
            href="https://t.me/keytomyheart"
            target="_blank"
            rel="noopener noreferrer"
            title="Telegram"
            aria-label="Перейти в Telegram"
          >
            <Image src="/icons/telegram.svg" alt="Telegram" width={24} height={24} />
          </a>
          <a
            href="https://wa.me/79886033821"
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            aria-label="Перейти в WhatsApp"
          >
            <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={24} height={24} />
          </a>
        </div>
      </div>
    </>
  );
}
