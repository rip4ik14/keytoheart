// ✅ Путь: components/BurgerMenu.tsx
'use client';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hideButton?: boolean;
};

const NAV_H_VAR = '--kth-bottom-nav-h';

// Слои:
// - overlay: 20000
// - drawer: 21000
// - bottom nav: 30000 (в MobileBottomNav)
export default function BurgerMenu({ open, onOpenChange, hideButton }: Props) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ✅ важно для гидрации: портал начинаем рендерить только после маунта
  const [mounted, setMounted] = useState(false);

  // ✅ чтобы был плавный slide-out, держим drawer в DOM чуть-чуть после закрытия
  const [shouldRenderLayer, setShouldRenderLayer] = useState(false);

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
    setMounted(true);
  }, []);

  // управляем "присутствием" слоя, чтобы:
  // - при первом рендере на клиенте не появлялся лишний DOM (иначе hydration mismatch)
  // - при закрытии была анимация
  useEffect(() => {
    if (!mounted) return;

    if (open) {
      setShouldRenderLayer(true);
      return;
    }

    if (!open && shouldRenderLayer) {
      const t = window.setTimeout(() => setShouldRenderLayer(false), 280);
      return () => window.clearTimeout(t);
    }
  }, [open, mounted, shouldRenderLayer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onOpenChange]);

  // свайп влево закрывает
  useEffect(() => {
    if (!open) return;

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
  }, [onOpenChange, open]);

  // блокируем скролл страницы при открытом меню
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const trackOpen = () => {
    window.gtag?.('event', 'open_burger_menu', { event_category: 'navigation' });
    if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'open_burger_menu');
  };

  const trackLink = (name: string) => {
    window.gtag?.('event', 'burger_menu_link', { event_category: 'navigation', link: name });
    if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'burger_menu_link', { link: name });
  };

  // ✅ ключ: если не mounted - вообще не рендерим портал (совпадет с SSR)
  // ✅ если меню закрыто и анимация уже закончилась - тоже не рендерим слой
  const canRenderPortal = mounted && shouldRenderLayer;

  const layer = (
    <>
      {/* overlay - до нижней панели */}
      {open && (
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => onOpenChange(false)}
          className="fixed bg-black/40"
          style={{
            inset: `0 0 var(${NAV_H_VAR}, 0px) 0`,
            zIndex: 20000,
          }}
        />
      )}

      {/* drawer - тоже до нижней панели */}
      <div
        ref={menuRef}
        className={`
          fixed left-0 top-0 w-72 bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          bottom: `var(${NAV_H_VAR}, 0px)`,
          zIndex: 21000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        role="dialog"
        aria-label="Меню навигации"
        aria-modal={open ? true : undefined}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-sm font-semibold">Меню</span>
          <button onClick={() => onOpenChange(false)} aria-label="Закрыть меню навигации">
            <Image src="/icons/times.svg" alt="Close" width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <nav className="p-4 space-y-1" aria-label="Основная навигация">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                onClick={() => {
                  onOpenChange(false);
                  trackLink(link.name);
                }}
                className="block py-2 text-black hover:bg-gray-100 transition-colors rounded"
                tabIndex={open ? 0 : -1}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 flex gap-4 text-xl text-black border-t">
          <a href="https://vk.com/key_to_heart_store" target="_blank" rel="noopener noreferrer" aria-label="Перейти в ВКонтакте">
            <Image src="/icons/vk.svg" alt="VK" width={24} height={24} />
          </a>
          <a href="https://t.me/keytomyheart" target="_blank" rel="noopener noreferrer" aria-label="Перейти в Telegram">
            <Image src="/icons/telegram.svg" alt="Telegram" width={24} height={24} />
          </a>
          <a href="https://wa.me/79886033821" target="_blank" rel="noopener noreferrer" aria-label="Перейти в WhatsApp">
            <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={24} height={24} />
          </a>
        </div>
      </div>
    </>
  );

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

      {canRenderPortal ? createPortal(layer, document.body) : null}
    </>
  );
}
