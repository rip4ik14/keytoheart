'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

declare global {
  interface Window {
    __cookieBannerMounted?: boolean;
  }
}

const CONSENT_KEY = 'cookieConsent';
const CSS_VAR = '--kth-cookie-banner-h';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const isPrimaryRef = useRef(true);
  const lastHeightRef = useRef<number>(0);

  const setBannerHeightVar = (px: number) => {
    if (typeof document === 'undefined') return;

    const v = Math.max(0, Math.round(px));
    if (lastHeightRef.current === v) return;
    lastHeightRef.current = v;

    document.documentElement.style.setProperty(CSS_VAR, `${v}px`);
  };

  const clearBannerHeightVar = () => {
    if (typeof document === 'undefined') return;
    lastHeightRef.current = 0;
    document.documentElement.style.setProperty(CSS_VAR, '0px');
  };

  /* ---------------- mount + singleton ---------------- */

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.__cookieBannerMounted) {
        isPrimaryRef.current = false;
        setIsVisible(false);
        clearBannerHeightVar();
        return;
      }
      window.__cookieBannerMounted = true;
      isPrimaryRef.current = true;
    }

    let hasAccepted: string | null = null;
    try {
      hasAccepted = localStorage.getItem(CONSENT_KEY);
    } catch {}

    if (!hasAccepted) {
      setIsVisible(true);
      try {
        trackEvent({ category: 'cookie_banner', action: 'cookie_banner_view', type: 'banner' });
      } catch {}
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY && e.newValue) setIsVisible(false);
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearBannerHeightVar();
      if (typeof window !== 'undefined' && isPrimaryRef.current) {
        window.__cookieBannerMounted = false;
      }
    };
    // eslint-disable-next-line
  }, []);

  /* ---------------- измеряем высоту ---------------- */

  useLayoutEffect(() => {
    if (!isPrimaryRef.current) {
      clearBannerHeightVar();
      return;
    }

    if (!isVisible) {
      clearBannerHeightVar();
      return;
    }

    const measure = () => {
      const el = rootRef.current;
      if (!el) return;
      const h = el.getBoundingClientRect().height;
      setBannerHeightVar(h);
    };

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      if (rootRef.current) ro.observe(rootRef.current);
    }

    window.addEventListener('resize', measure);
    const t = window.setTimeout(measure, 180);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line
  }, [isVisible]);

  /* ---------------- accept ---------------- */

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {}
    setIsVisible(false);
    try {
      trackEvent({ category: 'cookie_banner', action: 'cookie_accept', type: 'banner' });
    } catch {}
  };

  if (!isPrimaryRef.current) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={rootRef}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.2 }}
          className="
            fixed left-0 right-0 mx-auto
            z-[35000]
            px-3 pt-3
            sm:left-auto sm:right-4 sm:bottom-4 sm:px-0 sm:pt-0
            kth-sticky-surface
          "
          style={{
            // 🔥 ГЛАВНЫЙ ФИКС
            // поднимаем баннер НАД нижним меню
            bottom:
              'calc(var(--kth-bottom-nav-h, 0px) + env(safe-area-inset-bottom) + 12px)',
          }}
          role="dialog"
          aria-modal="true"
          aria-describedby="cookie-banner-desc"
        >
          <div
            className="
              mx-auto w-full max-w-[520px]
              rounded-3xl
              border border-black/10
              shadow-[0_22px_70px_rgba(0,0,0,0.18)]
              overflow-hidden
              kth-glass kth-sticky-surface
            "
          >
            <div className="px-4 pt-3.5 pb-3">
              <p
                id="cookie-banner-desc"
                className="text-[13px] leading-snug text-black/80 text-center"
              >
                Мы используем{' '}
                <Link
                  href="/cookie-policy"
                  className="underline underline-offset-2 text-black/80 hover:text-black transition-colors"
                  onClick={() =>
                    trackEvent({
                      category: 'cookie_banner',
                      action: 'cookie_policy_click',
                      type: 'link',
                    })
                  }
                >
                  cookies
                </Link>{' '}
                для улучшения работы сайта и аналитики.
              </p>

              <div className="mt-3">
                <motion.button
                  type="button"
                  onClick={accept}
                  whileTap={{ scale: 0.98 }}
                  className="
                    w-full
                    h-12
                    rounded-2xl
                    border border-black/10
                    shadow-[0_12px_35px_rgba(0,0,0,0.12)]
                    text-sm font-semibold text-black
                    transition
                    hover:bg-white
                    kth-glass kth-sticky-surface
                  "
                >
                  Согласен
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
