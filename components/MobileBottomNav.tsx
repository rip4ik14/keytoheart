// ✅ Путь: components/MobileBottomNav.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCart } from '@context/CartContext';
import { useEffect, useMemo, useState } from 'react';

const NAV_H_VAR = '--kth-bottom-nav-h';

function cls(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(' ');
}

export default function MobileBottomNav({
  isMenuOpen,
  onToggleMenu,
}: {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}) {
  const pathname = usePathname() || '/';
  const { items } = useCart() as { items: { quantity: number }[] };

  const totalItems = useMemo(() => items.reduce((s, i) => s + (i.quantity || 0), 0), [items]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // ✅ как в StickyHeader - вычисляем реальную высоту нижнего UI и кладём в CSS var
  const [navH, setNavH] = useState<number>(0);
  const navRef = useMemo(() => ({ current: null as HTMLElement | null }), []);
  // (без useRef, чтобы не пересоздавать в строгом режиме - тут нам нужен стабильный объект)
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      setNavH(h);
      document.documentElement.style.setProperty(NAV_H_VAR, `${h}px`);
    };

    apply();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => apply());
      ro.observe(el);
    }

    window.addEventListener('resize', apply);
    const t = window.setTimeout(apply, 200);

    return () => {
      window.removeEventListener('resize', apply);
      if (ro) ro.disconnect();
      window.clearTimeout(t);
    };
  }, [navRef]);

  const Item = ({
    href,
    label,
    icon,
    active,
    badge,
  }: {
    href: string;
    label: string;
    icon: string;
    active: boolean;
    badge?: number;
  }) => (
    <Link
      href={href}
      className={cls(
        'relative flex-1',
        'h-[54px]',
        'flex flex-col items-center justify-center',
        'rounded-[18px]',
        'transition-all duration-200',
        active
          ? 'bg-white/58 text-black shadow-[0_10px_26px_rgba(0,0,0,0.08)]'
          : 'text-black/60 active:bg-white/35',
      )}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <span className="relative flex items-center justify-center">
        <Image src={icon} alt="" width={22} height={22} className="w-[22px] h-[22px]" />

        {typeof badge === 'number' && badge > 0 && (
          <span
            className={cls(
              'absolute -top-2 -right-3',
              'min-w-5 h-5 px-1',
              'rounded-full',
              'bg-black text-white',
              'text-[10px] font-bold',
              'flex items-center justify-center',
              'border border-white',
            )}
          >
            {badge}
          </span>
        )}
      </span>

      <span className={cls('mt-1 text-[10px] font-semibold leading-none', active ? 'text-black' : 'text-black/60')}>
        {label}
      </span>
    </Link>
  );

  return (
    <nav
      // @ts-expect-error - мы используем стабильный объект под ref
      ref={(node) => (navRef.current = node)}
      className={cls('sm:hidden', 'fixed left-0 right-0 bottom-0 z-[1200] kth-sticky-surface', 'px-3')}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
      }}
      aria-label="Нижняя навигация"
    >
      {/* ✅ fallback var на случай, если ref ещё не измерился (первый кадр) */}
      <style>
        {`:root{${NAV_H_VAR}: ${
          navH > 0 ? `${navH}px` : 'calc(84px + max(env(safe-area-inset-bottom), 10px))'
        };}`}
      </style>

      <div
        className={cls(
          'relative',
          'mx-auto',
          'w-full',
          'max-w-[520px]',
          'rounded-[26px]',
          // ✅ тот же “телега-стекло”, что в StickyHeader
          'kth-glass kth-sticky-surface',
          'border border-black/10',
          'shadow-[0_18px_55px_rgba(0,0,0,0.12)]',
          'overflow-hidden',
        )}
      >
        {/* ✅ подсветка стекла - 1в1 как в StickyHeader */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70 kth-glass-highlight"
          aria-hidden="true"
        />

        <div className="relative px-2 py-2">
          <div className="grid grid-cols-5 gap-2">
            <Item href="/" label="Главная" icon="/icons/home.svg" active={isActive('/')} />
            <Item href="/catalog" label="Каталог" icon="/icons/catalog.svg" active={isActive('/catalog')} />
            <Item href="/cart" label="Корзина" icon="/icons/shopping-cart.svg" active={isActive('/cart')} badge={totalItems} />
            <Item href="/account" label="Кабинет" icon="/icons/user.svg" active={isActive('/account')} />

            <button
              type="button"
              onClick={onToggleMenu}
              className={cls(
                'relative flex-1',
                'h-[54px]',
                'flex flex-col items-center justify-center',
                'rounded-[18px]',
                'transition-all duration-200',
                isMenuOpen
                  ? 'bg-white/58 text-black shadow-[0_10px_26px_rgba(0,0,0,0.08)]'
                  : 'text-black/60 active:bg-white/35',
              )}
              aria-label="Меню"
              aria-pressed={isMenuOpen}
            >
              <Image src="/icons/menu.svg" alt="" width={22} height={22} className="w-[22px] h-[22px]" />
              <span className={cls('mt-1 text-[10px] font-semibold leading-none', isMenuOpen ? 'text-black' : 'text-black/60')}>
                Меню
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
