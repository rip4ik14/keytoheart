'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types_new';
import { usePathname } from 'next/navigation';

export default function StoreBanner() {
  // Логируем переменные окружения для отладки
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
    // Проверяем наличие переменных окружения
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      setBannerMessage(null);
      setIsBannerActive(false);
      return;
    }

    try {
      console.log('Fetching banner settings...');
      const start = Date.now();
      const { data, error } = await supabase
        .from('store_settings')
        .select('banner_message, banner_active')
        .single();
      console.log('Supabase query duration in StoreBanner:', Date.now() - start, 'ms');
      console.log('Supabase fetch result in StoreBanner:', { data, error });

      if (error) {
        throw new Error(`Supabase error: ${error.message || 'Unknown error'} (code: ${error.code || 'N/A'}, details: ${error.details || 'N/A'}, hint: ${error.hint || 'N/A'})`);
      }

      if (!data) {
        console.warn('No banner settings found in store_settings table');
        setBannerMessage(null);
        setIsBannerActive(false);
        return;
      }

      console.log('Banner settings fetched:', { banner_message: data.banner_message, banner_active: data.banner_active });
      setBannerMessage(data.banner_message);
      setIsBannerActive(data.banner_active ?? false); // Преобразуем null в false
    } catch (error: any) {
      console.error('Fetch banner settings error:', error.message || error);
      setBannerMessage(null);
      setIsBannerActive(false);
    }
  };

  useEffect(() => {
    fetchBannerSettings();

    // Подписка на изменения включается только в продакшене
    if (process.env.NODE_ENV === 'production') {
      const subscription = supabase
        .channel('store_settings_channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'store_settings' },
          (payload) => {
            console.log('Store settings updated:', payload);
            const { banner_message, banner_active } = payload.new;
            setBannerMessage(banner_message);
            setIsBannerActive(banner_active ?? false); // Преобразуем null в false
          }
        )
        .subscribe((status, error) => {
          if (error) {
            console.error('Supabase subscription error:', error);
          }
          console.log('Supabase subscription status:', status);
        });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [supabase]); // Добавляем supabase в зависимости

  useEffect(() => {
    fetchBannerSettings();
  }, [pathname]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!isBannerActive || !bannerMessage) {
    console.log('Banner not displayed:', { isBannerActive, bannerMessage });
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