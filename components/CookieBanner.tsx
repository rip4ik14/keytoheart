'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Проверка доступности localStorage
    let hasAccepted: string | null = null;
    try {
      hasAccepted = localStorage.getItem('cookieConsent');
    } catch (e) {
      console.error('localStorage is not available:', e);
    }

    if (!hasAccepted) {
      setIsVisible(true);

      // Аналитика: событие показа баннера cookie
      window.gtag?.('event', 'cookie_banner_view', { event_category: 'cookie_banner' });
      window.ym?.(12345678, 'reachGoal', 'cookie_banner_view');
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('cookieConsent', 'accepted');
    } catch (e) {
      console.error('Failed to set cookieConsent in localStorage:', e);
    }
    setIsVisible(false);
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    window.ym?.(12345678, 'reachGoal', 'cookie_accept');
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('cookieConsent', 'declined');
    } catch (e) {
      console.error('Failed to set cookieConsent in localStorage:', e);
    }
    setIsVisible(false);
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    window.ym?.(12345678, 'reachGoal', 'cookie_decline');
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-white text-black p-6 rounded-lg shadow-lg z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <h2
        id="cookie-banner-title"
        className="text-lg font-sans font-semibold mb-2"
      >
        Мы используем cookie
      </h2>
      <p id="cookie-banner-desc" className="text-sm mb-4">
        Мы используем cookie для улучшения работы сайта и аналитики. Необходимые cookie нельзя отключить, так как они обеспечивают базовую функциональность сайта. Подробнее в{' '}
        <Link
          href="/policy"
          className="underline hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
          onClick={() => {
            window.gtag?.('event', 'cookie_policy_click', {
              event_category: 'cookie_banner',
            });
            window.ym?.(12345678, 'reachGoal', 'cookie_policy_click');
          }}
          aria-label="Перейти к политике конфиденциальности"
        >
          Политике конфиденциальности
        </Link>
        .
      </p>
      <div className="flex gap-4">
        <button
          onClick={handleAccept}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-label="Принять cookie"
        >
          Принять
        </button>
        <button
          onClick={handleDecline}
          className="bg-transparent border border-black px-4 py-2 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-label="Отклонить аналитические cookie"
        >
          Отклонить
        </button>
      </div>
    </motion.div>
  );
}