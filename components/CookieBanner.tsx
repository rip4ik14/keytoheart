'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let hasAccepted: string | null = null;
    try {
      hasAccepted = localStorage.getItem('cookieConsent');
    } catch (e) {
      console.error('localStorage is not available:', e);
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

  const handleAccept = () => {
    try {
      localStorage.setItem('cookieConsent', 'accepted');
    } catch (e) {
      console.error('Failed to set cookieConsent in localStorage:', e);
    }
    setIsVisible(false);
    trackEvent({
      category: 'cookie_banner',
      action: 'cookie_accept',
      type: 'banner',
    });
    if (typeof window !== 'undefined') {
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    }
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('cookieConsent', 'declined');
    } catch (e) {
      console.error('Failed to set cookieConsent in localStorage:', e);
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
        Мы используем cookies для улучшения работы сайта и аналитики. Необходимые cookies обеспечивают базовую функциональность и не могут быть отключены. Вы можете управлять другими cookies через этот баннер или настройки браузера. Подробнее в{' '}
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
        </Link>
        .
      </p>
      <div className="flex gap-4">
        <button
          onClick={handleAccept}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-describedby="cookie-banner-desc"
        >
          Принять
        </button>
        <button
          onClick={handleDecline}
          className="bg-gray-100 border border-gray-300 px-4 py-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-describedby="cookie-banner-desc"
        >
          Отклонить
        </button>
      </div>
    </motion.div>
  );
}