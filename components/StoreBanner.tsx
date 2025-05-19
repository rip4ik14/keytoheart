'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types_new';
import { usePathname } from 'next/navigation';

export default function StoreBanner() {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [isBannerActive, setIsBannerActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  // Проверяем, был ли баннер уже показан в текущей сессии
  useEffect(() => {
    const hasSeenBanner = localStorage.getItem('hasSeenBanner');
    if (!hasSeenBanner && isBannerActive && bannerMessage) {
      setIsModalOpen(true);
      localStorage.setItem('hasSeenBanner', 'true');
    }
  }, [isBannerActive, bannerMessage]);

  const fetchBannerSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('banner_message, banner_active')
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        setBannerMessage(null);
        setIsBannerActive(false);
        return;
      }

      setBannerMessage(data.banner_message);
      setIsBannerActive(data.banner_active ?? false);
    } catch (error: any) {
      setBannerMessage(null);
      setIsBannerActive(false);
    }
  };

  useEffect(() => {
    fetchBannerSettings();

    if (process.env.NODE_ENV === 'production') {
      const subscription = supabase
        .channel('store_settings_channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'store_settings' },
          (payload) => {
            const { banner_message, banner_active } = payload.new;
            setBannerMessage(banner_message);
            setIsBannerActive(banner_active ?? false);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [supabase]);

  useEffect(() => {
    fetchBannerSettings();
  }, [pathname]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!isBannerActive || !bannerMessage) {
    return null;
  }

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-label="Уведомление магазина"
          onClick={handleCloseModal}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 text-center relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-700 text-lg mb-4">{bannerMessage}</p>
            <button
              onClick={handleCloseModal}
              className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              aria-label="Закрыть уведомление"
            >
              Закрыть
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}