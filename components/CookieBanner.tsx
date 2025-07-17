'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsCookies, setAnalyticsCookies] = useState(false);
  const [functionalCookies, setFunctionalCookies] = useState(false);
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    let hasAccepted: string | null = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        hasAccepted = localStorage.getItem('cookieConsent');
      }
    } catch (e) {
      // ignore
    }

    if (!hasAccepted) {
      setIsVisible(true);
      try {
        trackEvent({
          category: 'cookie_banner',
          action: 'cookie_banner_view',
          type: 'banner',
        });
      } catch (e) { }
    }

    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAcceptAll = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('cookieConsent', 'accepted');
        localStorage.setItem('analyticsCookies', 'true');
        localStorage.setItem('functionalCookies', 'true');
      }
    } catch (e) {}
    setIsVisible(false);
    try {
      trackEvent({
        category: 'cookie_banner',
        action: 'cookie_accept_all',
        type: 'banner',
      });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', { analytics_storage: 'granted' });
      }
    } catch (e) {}
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  const handleSaveSettings = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('cookieConsent', 'custom');
        localStorage.setItem('analyticsCookies', analyticsCookies ? 'true' : 'false');
        localStorage.setItem('functionalCookies', functionalCookies ? 'true' : 'false');
      }
    } catch (e) {}
    setIsVisible(false);
    try {
      trackEvent({
        category: 'cookie_banner',
        action: 'cookie_save_settings',
        type: 'banner',
        label: `Analytics: ${analyticsCookies}, Functional: ${functionalCookies}`,
      });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', { analytics_storage: analyticsCookies ? 'granted' : 'denied' });
      }
    } catch (e) {}
  };

  const handleDecline = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('cookieConsent', 'declined');
        localStorage.setItem('analyticsCookies', 'false');
        localStorage.setItem('functionalCookies', 'false');
      }
    } catch (e) {}
    setIsVisible(false);
    try {
      trackEvent({
        category: 'cookie_banner',
        action: 'cookie_decline',
        type: 'banner',
      });
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', { analytics_storage: 'denied' });
      }
    } catch (e) {}
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="
        fixed z-50 left-0 right-0 bottom-0 w-full mx-auto
        bg-white text-black p-4 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.10)]
        border-t border-gray-200 flex flex-col items-center gap-3
        sm:max-w-md sm:left-auto sm:right-4 sm:bottom-4 sm:rounded-xl
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <p id="cookie-banner-desc" className="text-sm text-center px-1">
        Мы используем cookies для улучшения работы сайта и аналитики. Подробнее в{' '}
        <Link
          href="/cookie-policy"
          className="underline hover:text-gray-600 transition-colors"
          aria-label="Перейти к политике использования cookies"
          onClick={() =>
            trackEvent({
              category: 'cookie_banner',
              action: 'cookie_policy_click',
              type: 'link',
            })
          }
        >
          Политике использования cookies
        </Link>
        .
      </p>
      {!showSettings ? (
        <div className="flex w-full gap-3 mt-1">
          <button
            onClick={handleShowSettings}
            className="flex-1 py-3 rounded-xl bg-gray-100 border border-gray-300 text-black text-base font-bold hover:bg-gray-200 transition-colors"
          >
            Подробнее
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 py-3 rounded-xl bg-black text-white text-base font-bold shadow hover:bg-gray-900 transition-colors"
          >
            Принять все
          </button>
        </div>
      ) : (
        <div className="w-full mt-2">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="analytics-cookies"
              checked={analyticsCookies}
              onChange={e => setAnalyticsCookies(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="analytics-cookies" className="text-sm">
              Аналитические cookies (Яндекс.Метрика)
            </label>
          </div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="functional-cookies"
              checked={functionalCookies}
              onChange={e => setFunctionalCookies(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="functional-cookies" className="text-sm">
              Функциональные cookies (предпочтения, регион доставки)
            </label>
          </div>
          <div className="flex w-full gap-3">
            <button
              onClick={handleSaveSettings}
              className="flex-1 py-3 rounded-xl bg-black text-white text-base font-bold hover:bg-gray-900 transition-colors"
            >
              Сохранить
            </button>
            <button
              onClick={handleDecline}
              className="flex-1 py-3 rounded-xl bg-gray-100 border border-gray-300 text-black text-base font-bold hover:bg-gray-200 transition-colors"
            >
              Отклонить
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
