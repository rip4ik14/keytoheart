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

// CSS var, чтобы MobileContactFab автоматически поднимался выше баннера
const CSS_VAR = '--kth-cookie-banner-h';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);

  // singleton (чтобы баннер не смонтировался дважды)
  const isPrimaryRef = useRef(true);

  const setBannerHeightVar = (px: number) => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty(CSS_VAR, `${Math.max(0, px)}px`);
  };

  const clearBannerHeightVar = () => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty(CSS_VAR, '0px');
  };

  // mount + singleton + initial check
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // measure height while visible
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
      setBannerHeightVar(el.offsetHeight);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    if (rootRef.current) ro.observe(rootRef.current);

    window.addEventListener('resize', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

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
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="
            fixed left-0 right-0 bottom-0 mx-auto
            z-[10010]
            px-3 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3
            sm:left-auto sm:right-4 sm:bottom-4 sm:px-0 sm:pb-0 sm:pt-0
          "
          role="dialog"
          aria-modal="true"
          aria-describedby="cookie-banner-desc"
          data-cookie-banner="true"
        >
          <div
            className="
              mx-auto w-full max-w-[520px]
              rounded-3xl
              bg-white/82 backdrop-blur-xl
              border border-black/10
              shadow-[0_22px_70px_rgba(0,0,0,0.18)]
              overflow-hidden
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
                  aria-label="Перейти к политике cookies"
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
                    bg-white/88 backdrop-blur
                    border border-black/10
                    shadow-[0_12px_35px_rgba(0,0,0,0.12)]
                    text-sm font-semibold text-black
                    transition
                    hover:bg-white
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
