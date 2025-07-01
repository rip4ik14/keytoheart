'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsCookies, setAnalyticsCookies] = useState(false);
  const [functionalCookies, setFunctionalCookies] = useState(false);

  useEffect(() => {
    let hasAccepted: string | null = null;
    try {
      hasAccepted = localStorage.getItem('cookieConsent');
    } catch (e) {
      process.env.NODE_ENV !== "production" && console.error('localStorage is not available:', e);
    }

    if (!hasAccepted) {
      setIsVisible(true);
      trackEvent({
        category: 'cookie_banner',
        action: 'cookie_banner_view',
        type: 'banner',
      });
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('cookieConsent', 'accepted');
      localStorage.setItem('analyticsCookies', 'true');
      localStorage.setItem('functionalCookies', 'true');
    } catch (e) {
      process.env.NODE_ENV !== "production" && console.error('Failed to set cookieConsent in localStorage:', e);
    }
    setIsVisible(false);
    trackEvent({
      category: 'cookie_banner',
      action: 'cookie_accept_all',
      type: 'banner',
    });
    if (typeof window !== 'undefined') {
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    }
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('cookieConsent', 'custom');
      localStorage.setItem('analyticsCookies', analyticsCookies ? 'true' : 'false');
      localStorage.setItem('functionalCookies', functionalCookies ? 'true' : 'false');
    } catch (e) {
      process.env.NODE_ENV !== "production" && console.error('Failed to set cookie settings in localStorage:', e);
    }
    setIsVisible(false);
    trackEvent({
      category: 'cookie_banner',
      action: 'cookie_save_settings',
      type: 'banner',
      label: `Analytics: ${analyticsCookies}, Functional: ${functionalCookies}`, // Передаём настройки как строку в label
    });
    if (typeof window !== 'undefined') {
      window.gtag?.('consent', 'update', { analytics_storage: analyticsCookies ? 'granted' : 'denied' });
    }
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('cookieConsent', 'declined');
      localStorage.setItem('analyticsCookies', 'false');
      localStorage.setItem('functionalCookies', 'false');
    } catch (e) {
      process.env.NODE_ENV !== "production" && console.error('Failed to set cookieConsent in localStorage:', e);
    }
    setIsVisible(false);
    trackEvent({
      category: 'cookie_banner',
      action: 'cookie_decline',
      type: 'banner',
    });
    if (typeof window !== 'undefined') {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-white text-black p-6 rounded-lg shadow-lg z-50 border border-gray-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <h2 id="cookie-banner-title" className="text-lg font-sans font-semibold mb-2">
        Мы используем cookies
      </h2>
      <p id="cookie-banner-desc" className="text-base mb-4">
        Мы используем cookies для улучшения работы сайта и аналитики. Необходимые cookies обеспечивают базовую функциональность и не могут быть отключены. Вы можете настроить аналитические и функциональные cookies ниже или отклонить их. Подробнее в{' '}
        <Link
          href="/cookie-policy"
          className="underline hover:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
          onClick={() =>
            trackEvent({
              category: 'cookie_banner',
              action: 'cookie_policy_click',
              type: 'link',
            })
          }
          aria-label="Перейти к политике использования cookies"
        >
          Политике использования cookies
        </Link>.
      </p>

      {showSettings ? (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="analytics-cookies"
              checked={analyticsCookies}
              onChange={(e) => setAnalyticsCookies(e.target.checked)}
              className="mr-2"
              aria-label="Разрешить аналитические cookies"
            />
            <label htmlFor="analytics-cookies" className="text-sm">
              Аналитические cookies (Яндекс.Метрика)
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="functional-cookies"
              checked={functionalCookies}
              onChange={(e) => setFunctionalCookies(e.target.checked)}
              className="mr-2"
              aria-label="Разрешить функциональные cookies"
            />
            <label htmlFor="functional-cookies" className="text-sm">
              Функциональные cookies (предпочтения, регион доставки)
            </label>
          </div>
        </div>
      ) : null}

      <div className="flex gap-4 flex-wrap">
        <button
          onClick={handleAcceptAll}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-describedby="cookie-banner-desc"
        >
          Принять все
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-gray-100 border border-gray-300 px-4 py-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-describedby="cookie-banner-desc"
        >
          {showSettings ? 'Скрыть настройки' : 'Настроить'}
        </button>
        {showSettings ? (
          <button
            onClick={handleSaveSettings}
            className="bg-gray-100 border border-gray-300 px-4 py-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            aria-describedby="cookie-banner-desc"
          >
            Сохранить
          </button>
        ) : (
          <button
            onClick={handleDecline}
            className="bg-gray-100 border border-gray-300 px-4 py-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            aria-describedby="cookie-banner-desc"
          >
            Отклонить
          </button>
        )}
      </div>
    </motion.div>
  );
}