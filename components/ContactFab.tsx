// ✅ Путь: components/ContactFab.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

type ContactItem = {
  id: 'whatsapp' | 'telegram' | 'max' | 'call';
  title: string;
  subtitle?: string;
  href: string;
  icon: string; // path in /public/icons
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const OPEN_AFTER_MS = 40_000; // 40 секунд
const SESSION_KEY = 'kth_contactfab_autoshown_v1';

export default function ContactFab() {
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  // для “не открывать, если пользователь перешел на другую страницу”
  const initialPathRef = useRef<string | null>(null);

  // drag-to-close
  const dragY = useRef(0);

  // ✅ цели метрики как в StickyHeader
  const trackContact = (kind: ContactItem['id'], meta?: Record<string, unknown>) => {
    const eventName =
      kind === 'whatsapp'
        ? 'contact_whatsapp'
        : kind === 'telegram'
          ? 'contact_telegram'
          : kind === 'max'
            ? 'contact_max'
            : 'contact_call';

    // (опционально) GA4 - пусть тоже летит
    window.gtag?.('event', eventName, {
      event_category: 'contact_fab',
      event_label: `ContactFab: ${kind}`,
      value: 1,
    });

    // ✅ Яндекс.Метрика
    if (YM_ID !== undefined) {
      callYm(YM_ID, 'reachGoal', eventName, {
        source: 'contact_fab',
        ...meta,
      });
    }
  };

  const items: ContactItem[] = useMemo(
    () => [
      {
        id: 'whatsapp',
        title: 'WhatsApp',
        subtitle: 'Быстрый ответ',
        href: 'https://wa.me/79886033821',
        icon: '/icons/whatsapp.svg',
      },
      {
        id: 'telegram',
        title: 'Telegram',
        subtitle: 'Написать в чат',
        href: 'https://t.me/keytomyheart',
        icon: '/icons/telegram.svg',
      },
      {
        id: 'max',
        title: 'MAX',
        subtitle: 'Написать в чат',
        href: 'https://max.ru/u/f9LHodD0cOI-9oT8wIMLqNgL9blgVvmWzHwla0t-q1TLriNRDUJsOEIedDk',
        icon: '/icons/max.svg',
      },
      {
        id: 'call',
        title: 'Позвонить',
        subtitle: '+7 (988) 603-38-21',
        href: 'tel:+79886033821',
        icon: '/icons/phone.svg',
      },
    ],
    [],
  );

  // запоминаем "страницу входа" (первый путь), чтобы если пользователь навигируется - автооткрытие отменить
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!initialPathRef.current) initialPathRef.current = window.location.pathname;
  }, []);

  // авто-открытие через 40 секунд (только один раз за сессию и только если не было переходов)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const already = sessionStorage.getItem(SESSION_KEY);
    if (already === '1') return;

    const t = window.setTimeout(() => {
      // если путь изменился - не открываем
      const currentPath = window.location.pathname;
      const initialPath = initialPathRef.current;
      if (!initialPath || currentPath !== initialPath) return;

      sessionStorage.setItem(SESSION_KEY, '1');

      // ✅ цель: авто-показ FAB
      trackContact('telegram', { type: 'autoshown_hint' }); // мягкая "служебная" цель, если хочешь можно убрать
      if (YM_ID !== undefined) {
        callYm(YM_ID, 'reachGoal', 'contact_autoshown', { source: 'contact_fab' });
      }

      setOpen(true);
    }, OPEN_AFTER_MS);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // закрытие по Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggle = () => {
    // micro “haptic”
    setPressed(true);
    window.setTimeout(() => setPressed(false), 140);

    setOpen((v) => {
      const next = !v;

      // ✅ цель: открытие/закрытие виджета
      if (next) {
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'contact_open', { source: 'contact_fab' });
      } else {
        if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'contact_close', { source: 'contact_fab' });
      }

      return next;
    });
  };

  const close = () => {
    setOpen(false);
    if (YM_ID !== undefined) callYm(YM_ID, 'reachGoal', 'contact_close', { source: 'contact_fab' });
  };

  const onDragEnd = () => {
    // если потянули вниз сильно - закрываем
    if (dragY.current > 90) close();
    dragY.current = 0;
  };

  return (
    <>
      {/* FAB button: видна и на мобилке и на десктопе */}
      <div className="fixed z-[9998] bottom-4 right-4 sm:bottom-6 sm:right-6">
        <motion.button
          type="button"
          onClick={toggle}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          className={cn(
            'select-none',
            'rounded-full border border-black/10 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.14)]',
            'px-4 py-3 sm:px-5 sm:py-3.5',
            'flex items-center gap-2',
            'text-black',
            'active:scale-[0.98]',
          )}
          animate={{ scale: pressed ? 0.98 : 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          aria-label="Открыть чат"
        >
          <span
            className={cn('inline-flex h-10 w-10 items-center justify-center rounded-full', 'bg-black text-white')}
            aria-hidden="true"
          >
            <Image src="/icons/chat.svg" alt="" width={18} height={18} />
          </span>

          <div className="flex flex-col leading-tight text-left">
            <span className="text-sm sm:text-[15px] font-semibold tracking-tight">Чат</span>
            <span className="text-xs text-black/55 hidden sm:block">Поможем выбрать, оформить</span>
          </div>
        </motion.button>
      </div>

      {/* Overlay + Sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[9997] bg-black/35 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              aria-hidden="true"
            />

            {/* iOS-like sheet */}
            <motion.div
              className={cn(
                'fixed z-[9999]',
                'left-0 right-0 bottom-0',
                'mx-auto w-full',
                'sm:left-auto sm:right-6 sm:bottom-20 sm:w-[380px]',
              )}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            >
              <motion.div
                className={cn(
                  'rounded-t-3xl sm:rounded-3xl',
                  'border border-black/10 bg-white',
                  'shadow-[0_22px_70px_rgba(0,0,0,0.22)]',
                  'overflow-hidden',
                )}
                drag="y"
                dragConstraints={{ top: 0, bottom: 220 }}
                dragElastic={0.18}
                onDrag={(e, info) => {
                  dragY.current = Math.max(0, info.offset.y);
                }}
                onDragEnd={onDragEnd}
              >
                <div className="px-4 pt-3 pb-2 sm:px-5 sm:pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] sm:text-base font-semibold tracking-tight text-black">Написать нам</div>
                      <div className="text-xs sm:text-sm text-black/55 mt-1">Обычно отвечаем быстро</div>
                    </div>

                    <button
                      type="button"
                      onClick={close}
                      className="rounded-full border border-black/10 bg-white p-2 hover:bg-black/[0.04] active:scale-[0.98]"
                      aria-label="Закрыть"
                    >
                      <Image src="/icons/x.svg" alt="" width={18} height={18} />
                    </button>
                  </div>

                  {/* drag handle */}
                  <div className="mt-3 flex justify-center sm:hidden">
                    <div className="h-1 w-10 rounded-full bg-black/10" />
                  </div>
                </div>

                {/* compact one-row like iOS share sheet */}
                <div className="px-4 pb-4 sm:px-5">
                  <div className="grid grid-cols-4 gap-2">
                    {items.map((it) => (
                      <a
                        key={it.id}
                        href={it.href}
                        target={it.href.startsWith('http') ? '_blank' : undefined}
                        rel={it.href.startsWith('http') ? 'nofollow noopener noreferrer' : undefined}
                        className={cn(
                          'rounded-2xl border border-black/10 bg-white',
                          'px-2 py-3',
                          'hover:bg-black/[0.03] active:scale-[0.99]',
                          'transition',
                          'flex flex-col items-center justify-center gap-2',
                        )}
                        aria-label={it.title}
                        onClick={() => {
                          // ✅ цель: клик по каналу из FAB
                          trackContact(it.id);
                          // закрываем виджет после клика (как обычно в share-sheet)
                          close();
                        }}
                      >
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                          <Image src={it.icon} alt={it.title} width={22} height={22} />
                        </span>
                        <span className="text-[11px] font-semibold text-black leading-none">{it.title}</span>
                      </a>
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl border border-black/10 bg-black/[0.02] px-3 py-2">
                    <div className="text-xs text-black/60">
                      Подсказка: можно написать в любой мессенджер, поможем выбрать и оформить заказ.
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}