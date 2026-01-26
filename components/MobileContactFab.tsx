'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';

import { callYm } from '@/utils/metrics';
import { YM_ID } from '@/utils/ym';

type Channel = 'telegram' | 'whatsapp' | 'max' | 'call';

const PHONE = '+79886033821';
const MAX_LINK =
  'https://max.ru/u/f9LHodD0cOI-9oT8wIMLqNgL9blgVvmWzHwla0t-q1TLriNRDUJsOEIedDk';

// UX keys
const FIRST_HINT_KEY = 'kth_contactfab_first_visit_hint_v1';
const DAILY_HINT_KEY = 'kth_contactfab_hint_ts';
const PRODUCT_HINT_KEY = 'kth_contactfab_product_hint_ts';

// умное авто-открытие: 1 раз за сессию и только если юзер "завис" без действий
const AUTO_OPEN_SESSION_KEY = 'kth_contactfab_autoopened_v2';
const AUTO_OPEN_AFTER_MS = 32_000;
const AUTO_OPEN_IDLE_MS = 8_000;
const AUTO_OPEN_MIN_SCROLL_PX = 260;

// CSS var, которую выставляет CookieBanner
const COOKIE_BANNER_VAR = '--kth-cookie-banner-h';
const BOTTOM_UI_VAR = '--kth-bottom-ui-h';

function track(channel: Channel) {
  const gtagEvent =
    channel === 'telegram'
      ? 'contact_telegram'
      : channel === 'whatsapp'
        ? 'contact_whatsapp'
        : channel === 'max'
          ? 'contact_max'
          : 'contact_call';

  window.gtag?.('event', gtagEvent, {
    event_category: 'contact',
    event_label: `ContactFab: ${channel}`,
    value: 1,
  });

  if (YM_ID !== undefined) {
    callYm(YM_ID, 'reachGoal', gtagEvent, { source: 'fab' });
  }
}

// “псевдо-хаптик”
function haptic(light = true) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      (navigator as any).vibrate(light ? 10 : 18);
    }
  } catch {}
}

export default function MobileContactFab() {
  const pathname = usePathname() || '/';

  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState<string>('Нужна помощь? Жми "Чат"');

  // чтобы авто-открытие не срабатывало, если человек начал ходить по страницам
  const initialPathRef = useRef<string | null>(null);

  // desktop режим
  const [isDesktop, setIsDesktop] = useState(false);

  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // поведение (умный триггер)
  const mountedAtRef = useRef<number>(Date.now());
  const lastInteractionRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);
  const suppressedRef = useRef<boolean>(false); // если был явный "интент покупки"
  const lastPathRef = useRef<string>(pathname);

  const links = useMemo(() => {
    return {
      telegram: 'https://t.me/keytomyheart',
      whatsapp: 'https://wa.me/79886033821',
      max: MAX_LINK,
      tel: `tel:${PHONE}`,
    };
  }, []);

  const isProductPage = useMemo(() => {
    return pathname === '/product' || pathname.startsWith('/product/');
  }, [pathname]);

  const isHighIntentPage = useMemo(() => {
    return (
      pathname.startsWith('/cart') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/order') ||
      pathname.startsWith('/payment')
    );
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onResize = () => setIsDesktop(window.matchMedia('(min-width: 640px)').matches);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // запоминаем первую страницу входа
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!initialPathRef.current) initialPathRef.current = window.location.pathname;
  }, []);

  // если человек ушёл на cart/checkout - не надо больше пытаться авто-открывать в этой сессии
  useEffect(() => {
    if (isHighIntentPage) {
      suppressedRef.current = true;
      try {
        sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, '1');
      } catch {}
    }
  }, [isHighIntentPage]);

  // трекинг взаимодействий: чтобы авто-открытие было только при "простое"
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const markInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    const onScroll = () => {
      markInteraction();
      maxScrollRef.current = Math.max(maxScrollRef.current, window.scrollY || 0);
    };

    const onPointer = () => markInteraction();
    const onKey = () => markInteraction();

    // "интент покупки" по кликам
    const onClickCapture = (e: MouseEvent) => {
      markInteraction();

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const el = target.closest('button, a') as HTMLElement | null;
      if (!el) return;

      const text = (el.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();

      const looksLikeAdd =
        text.includes('в корзину') ||
        aria.includes('в корзину') ||
        text.includes('оформ') ||
        aria.includes('оформ') ||
        text.includes('перейти в корзину') ||
        aria.includes('перейти в корзину');

      const looksLikeCart =
        (el as HTMLAnchorElement).getAttribute?.('href')?.includes('/cart') ||
        text.includes('корзин') ||
        aria.includes('корзин');

      if (looksLikeAdd || looksLikeCart) {
        suppressedRef.current = true;
        try {
          sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, '1');
        } catch {}
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClickCapture, { capture: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClickCapture, { capture: true } as any);
    };
  }, []);

  // не раздражающий "первый визит" hint (1 раз на устройство)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let already = false;
    try {
      already = localStorage.getItem(FIRST_HINT_KEY) === '1';
    } catch {}

    if (already) return;

    const t = window.setTimeout(() => {
      if (open) return;

      setHintText('Есть поддержка - поможем выбрать в чате');
      setShowHint(true);

      try {
        localStorage.setItem(FIRST_HINT_KEY, '1');
      } catch {}

      window.setTimeout(() => setShowHint(false), 6500);
    }, 2800);

    return () => window.clearTimeout(t);
  }, [open]);

  // "умный" hint на карточке товара (1 раз в сутки)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isProductPage) return;

    const day = 24 * 60 * 60 * 1000;
    let last = 0;
    try {
      last = Number(localStorage.getItem(PRODUCT_HINT_KEY) || '0');
    } catch {}

    if (Date.now() - last < day) return;

    const t = window.setTimeout(() => {
      if (open) return;

      setHintText('Вопрос по составу или доставке? Напиши - ответим быстро');
      setShowHint(true);

      try {
        localStorage.setItem(PRODUCT_HINT_KEY, String(Date.now()));
      } catch {}

      window.setTimeout(() => setShowHint(false), 7000);
    }, 8500);

    return () => window.clearTimeout(t);
  }, [isProductPage, open]);

  // общий daily hint
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let firstShown = false;
    try {
      firstShown = localStorage.getItem(FIRST_HINT_KEY) === '1';
    } catch {}

    if (isProductPage) return;

    const day = 24 * 60 * 60 * 1000;
    let last = 0;
    try {
      last = Number(localStorage.getItem(DAILY_HINT_KEY) || '0');
    } catch {}

    if (Date.now() - last < day) return;

    const t = window.setTimeout(() => {
      if (open) return;
      if (!firstShown) return;

      setHintText('Нужна помощь? Жми "Чат"');
      setShowHint(true);

      try {
        localStorage.setItem(DAILY_HINT_KEY, String(Date.now()));
      } catch {}

      window.setTimeout(() => setShowHint(false), 4500);
    }, 12_000);

    return () => window.clearTimeout(t);
  }, [open, isProductPage]);

  // умное авто-открытие
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (open) return;
    if (isHighIntentPage) return;

    let already = false;
    try {
      already = sessionStorage.getItem(AUTO_OPEN_SESSION_KEY) === '1';
    } catch {}
    if (already) return;

    if (suppressedRef.current) return;

    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      mountedAtRef.current = Date.now();
      lastInteractionRef.current = Date.now();
      maxScrollRef.current = window.scrollY || 0;
    }

    const timer = window.setTimeout(() => {
      const initialPath = initialPathRef.current;
      const currentPath = window.location.pathname;

      const allowByContext = isProductPage;
      if (!allowByContext) {
        if (!initialPath || currentPath !== initialPath) return;
      }

      if (open) return;
      if (suppressedRef.current) return;

      const now = Date.now();
      const idleFor = now - lastInteractionRef.current;
      const timeOnPage = now - mountedAtRef.current;
      const scrolled = maxScrollRef.current;

      const ok =
        timeOnPage >= AUTO_OPEN_AFTER_MS &&
        idleFor >= AUTO_OPEN_IDLE_MS &&
        (isProductPage || scrolled >= AUTO_OPEN_MIN_SCROLL_PX);

      if (!ok) return;

      try {
        sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, '1');
      } catch {}

      setOpen(true);
      setShowHint(false);
    }, AUTO_OPEN_AFTER_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, open, isProductPage, isHighIntentPage]);

  // ESC close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // lock body scroll when open (только для мобилки)
  useEffect(() => {
    if (!open) return;
    if (isDesktop) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isDesktop]);

  const openSheet = () => {
    haptic(true);
    setOpen(true);
    setShowHint(false);

    try {
      sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, '1');
    } catch {}
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
    const isCall = channel === 'call';

    return (
      <a
        href={href}
        target={isCall ? undefined : '_blank'}
        rel={isCall ? undefined : 'noopener noreferrer'}
        onClick={() => {
          haptic(true);
          track(channel);
          setOpen(false);

          try {
            sessionStorage.setItem(AUTO_OPEN_SESSION_KEY, '1');
          } catch {}
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
        aria-label={isCall ? title : `Написать в ${title}`}
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
      {/* ✅ FAB: один единственный (раньше у тебя был дубль) */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="kth-fab"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="fixed right-4 z-[20000]"
            style={{
              bottom: `calc(1rem + env(safe-area-inset-bottom) + var(${COOKIE_BANNER_VAR}, 0px) + var(${BOTTOM_UI_VAR}, 0px))`,
            }}
          >
            <div className="relative">
              <AnimatePresence>
                {showHint && (
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
                    {hintText}
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
                <div
                  className="
                    h-10 w-10 rounded-full
                    bg-white/85 backdrop-blur
                    border border-black/10
                    shadow-[0_10px_26px_rgba(0,0,0,0.10)]
                    grid place-items-center
                  "
                  aria-hidden="true"
                >
                  <HelpCircle className="h-5 w-5 text-black/75" />
                </div>

                <div className="leading-tight text-left">
                  <p className="text-sm font-semibold text-black">Чат</p>
                  <p className="text-[11px] text-black/55 -mt-0.5">поможем с выбором</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE: Overlay + bottom sheet */}
      <AnimatePresence>
        {open && !isDesktop && (
          <>
            <motion.button
              type="button"
              aria-label="Закрыть чат"
              onClick={closeSheet}
              className="fixed inset-0 z-[19998] bg-black/35 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              ref={sheetRef}
              className="
                fixed left-0 right-0 bottom-0 z-[19999] sm:hidden
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
                if (info.offset.y > 120 || info.velocity.y > 900) {
                  closeSheet();
                }
              }}
            >
              <div
                className="pt-2 pb-1"
                onPointerDown={(e) => {
                  dragControls.start(e);
                }}
              >
                <div className="mx-auto h-1.5 w-12 rounded-full bg-black/15" />
              </div>

              <div className="px-4 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold tracking-tight text-black">Чат с нами</p>
                    <p className="text-xs text-black/55 mt-0.5">Выберите способ связи - ответим быстро</p>
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

                {/* ✅ было 3 - добавили 4 (включая звонок) */}
                <div className="mt-4 grid grid-cols-2 gap-2">
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
                  <Item
                    title="Звонок"
                    subtitle="с 09:00 до 22:00"
                    iconSrc="/icons/phone.svg"
                    href={links.tel}
                    channel="call"
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

      {/* DESKTOP: popover справа снизу */}
      <AnimatePresence>
        {open && isDesktop && (
          <>
            <motion.button
              type="button"
              aria-label="Закрыть чат"
              onClick={closeSheet}
              className="fixed inset-0 z-[19998] bg-black/25 hidden sm:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="
                fixed z-[19999]
                right-4 bottom-20
                hidden sm:block
                w-[360px]
              "
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              role="dialog"
              aria-label="Чат"
            >
              <div
                className="
                  rounded-3xl
                  bg-white
                  border border-black/10
                  shadow-[0_22px_70px_rgba(0,0,0,0.22)]
                  overflow-hidden
                "
              >
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-semibold tracking-tight text-black">Чат с нами</p>
                      <p className="text-xs text-black/55 mt-1">Выберите мессенджер - ответим быстро</p>
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
                        hover:bg-black/[0.03]
                        transition
                      "
                    >
                      <X className="h-5 w-5 text-black/70" />
                    </motion.button>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="grid grid-cols-4 gap-2">
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
                    <Item
                      title="Звонок"
                      subtitle="с 09:00 до 22:00"
                      iconSrc="/icons/phone.svg"
                      href={links.tel}
                      channel="call"
                    />
                  </div>

                  <div className="mt-3 rounded-2xl border border-black/10 bg-black/[0.02] px-3 py-2">
                    <div className="text-xs text-black/60">
                      Можно написать по любому вопросу - поможем выбрать, уточнить состав и доставку
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
