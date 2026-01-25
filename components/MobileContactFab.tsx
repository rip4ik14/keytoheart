// ✅ Путь: components/MobileContactFab.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

type Channel = 'telegram' | 'whatsapp' | 'max';

const PHONE = '+79886033821';
const MAX_LINK =
  'https://max.ru/u/f9LHodD0cOI-9oT8wIMLqNgL9blgVvmWzHwla0t-q1TLriNRDUJsOEIedDk';

function track(channel: Channel) {
  const gtagEvent =
    channel === 'telegram'
      ? 'contact_telegram'
      : channel === 'whatsapp'
        ? 'contact_whatsapp'
        : 'contact_max';

  window.gtag?.('event', gtagEvent, {
    event_category: 'contact',
    event_label: `MobileContactFab: ${channel}`,
    value: 1,
  });

  if (YM_ID !== undefined) {
    callYm(YM_ID, 'reachGoal', gtagEvent, { source: 'mobile_fab' });
  }
}

// “псевдо-хаптик” - микровибрация если доступно, иначе просто ничего
function haptic(light = true) {
  try {
    // На iOS Safari обычно не работает, но на Android - да
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // легкий/короткий
      (navigator as any).vibrate(light ? 10 : 18);
    }
  } catch {}
}

export default function MobileContactFab() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const links = useMemo(() => {
    return {
      telegram: 'https://t.me/keytomyheart',
      whatsapp: 'https://wa.me/79886033821',
      max: MAX_LINK,
    };
  }, []);

  // Подсказка 1 раз в сутки, через 10 секунд
  useEffect(() => {
    const KEY = 'kth_contactfab_hint_ts';
    const last = Number(localStorage.getItem(KEY) || '0');
    const day = 24 * 60 * 60 * 1000;

    if (Date.now() - last < day) return;

    const t = window.setTimeout(() => {
      if (!open) setShowHint(true);
      localStorage.setItem(KEY, String(Date.now()));
      window.setTimeout(() => setShowHint(false), 4500);
    }, 10_000);

    return () => window.clearTimeout(t);
  }, [open]);

  // ESC close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const openSheet = () => {
    haptic(true);
    setOpen(true);
    setShowHint(false);
  };

  const closeSheet = () => {
    haptic(false);
    setOpen(false);
  };

  const Item = ({
    title,
    subtitle,
    iconSrc,
    href,
    channel,
  }: {
    title: string;
    subtitle: string;
    iconSrc: string;
    href: string;
    channel: Channel;
  }) => {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          haptic(true);
          track(channel);
          setOpen(false);
        }}
        className="
          group
          flex flex-col items-center justify-center
          gap-2
          rounded-3xl
          border border-black/10
          bg-white
          px-3 py-3
          shadow-[0_10px_30px_rgba(0,0,0,0.06)]
          active:scale-[0.98]
          transition
          w-full
        "
        aria-label={`Написать в ${title}`}
      >
        <div
          className="
            h-14 w-14 rounded-[22px]
            bg-black/5
            grid place-items-center
            group-active:scale-[0.98]
            transition
          "
        >
          <Image src={iconSrc} alt={title} width={26} height={26} />
        </div>

        <div className="text-center leading-tight">
          <p className="text-sm font-semibold text-black">{title}</p>
          <p className="text-[11px] text-black/55 mt-0.5">{subtitle}</p>
        </div>
      </a>
    );
  };

  return (
    <>
      {/* ✅ FAB: “Чат” (понятно даже для тупых) */}
      <div className="fixed bottom-4 right-4 z-[9999] sm:hidden">
        <div className="relative">
          {/* Hint bubble */}
          <AnimatePresence>
            {showHint && !open && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="
                  absolute -top-12 right-0
                  rounded-2xl border border-black/10
                  bg-white/90 backdrop-blur
                  px-3 py-2
                  shadow-[0_10px_30px_rgba(0,0,0,0.10)]
                  text-xs font-medium text-black/80
                  whitespace-nowrap
                "
              >
                Нужна помощь? Жми “Чат”
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={openSheet}
            aria-label="Открыть чат"
            whileTap={{ scale: 0.98 }}
            className="
              flex items-center gap-2
              h-14
              rounded-full
              px-4
              bg-white/88 backdrop-blur
              border border-black/10
              shadow-[0_12px_35px_rgba(0,0,0,0.18)]
              transition
            "
          >
            <div className="h-10 w-10 rounded-full bg-black/5 grid place-items-center">
              <Image src="/icons/help-circle.svg" alt="Чат" width={22} height={22} />
            </div>
            <div className="leading-tight text-left">
              <p className="text-sm font-semibold text-black">Чат</p>
              <p className="text-[11px] text-black/55 -mt-0.5">поможем с выбором</p>
            </div>
          </motion.button>
        </div>
      </div>

      {/* ✅ Overlay + sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Закрыть чат"
              onClick={closeSheet}
              className="fixed inset-0 z-[9998] bg-black/35 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              ref={sheetRef}
              className="
                fixed left-0 right-0 bottom-0 z-[9999] sm:hidden
                rounded-t-[28px]
                bg-white
                border-t border-black/10
                shadow-[0_-18px_60px_rgba(0,0,0,0.18)]
              "
              initial={{ y: 520 }}
              animate={{ y: 0 }}
              exit={{ y: 520 }}
              transition={{ type: 'spring', stiffness: 420, damping: 42 }}
              role="dialog"
              aria-label="Чат"
              drag="y"
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 520 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                // если протянули вниз достаточно - закрываем
                if (info.offset.y > 120 || info.velocity.y > 900) {
                  closeSheet();
                }
              }}
            >
              {/* drag handle */}
              <div
                className="pt-2 pb-1"
                onPointerDown={(e) => {
                  // начать drag только с “ручки”, как в iOS
                  dragControls.start(e);
                }}
              >
                <div className="mx-auto h-1.5 w-12 rounded-full bg-black/15" />
              </div>

              <div className="px-4 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold tracking-tight text-black">Чат с нами</p>
                    <p className="text-xs text-black/55 mt-0.5">
                      Выберите мессенджер - ответим быстро
                    </p>
                  </div>

                  <motion.button
                    type="button"
                    aria-label="Закрыть"
                    onClick={closeSheet}
                    whileTap={{ scale: 0.98 }}
                    className="
                      h-10 w-10 rounded-full
                      border border-black/10
                      bg-white
                      grid place-items-center
                      transition
                    "
                  >
                    <X className="h-5 w-5 text-black/70" />
                  </motion.button>
                </div>

                {/* ✅ iOS-share-sheet style row */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Item
                    title="Telegram"
                    subtitle="быстро"
                    iconSrc="/icons/telegram.svg"
                    href={links.telegram}
                    channel="telegram"
                  />
                  <Item
                    title="WhatsApp"
                    subtitle="удобно"
                    iconSrc="/icons/whatsapp.svg"
                    href={links.whatsapp}
                    channel="whatsapp"
                  />
                  <Item
                    title="MAX"
                    subtitle="актуально"
                    iconSrc="/icons/max.svg"
                    href={links.max}
                    channel="max"
                  />
                </div>

                <div className="mt-4 text-[11px] leading-4 text-black/45">
                  Можно написать по любому вопросу - поможем выбрать, уточнить состав и доставку
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
