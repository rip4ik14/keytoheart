'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileContactFab() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50 md:hidden">
      {/* Кнопка FAB */}
      <button
        className="w-14 h-14 rounded-full bg-white/80 border border-gray-300 flex items-center justify-center shadow-lg backdrop-blur hover:bg-white transition"
        onClick={() => setOpen((v) => !v)}
        aria-label="Связаться с нами"
      >
        <Image src="/icons/message.svg" alt="Связаться" width={30} height={30} />
      </button>

      {/* Кнопки мессенджеров */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.23 }}
            className="flex flex-col gap-2 mt-2"
          >
            <a
              href="https://wa.me/79886033821"
              target="_blank"
              rel="nofollow noopener"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white font-semibold shadow hover:scale-105 transition"
            >
              <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={20} height={20} />
              Написать в WhatsApp
            </a>
            <a
              href="https://t.me/keytomyheart"
              target="_blank"
              rel="nofollow noopener"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#229ED9] text-white font-semibold shadow hover:scale-105 transition"
            >
              <Image src="/icons/telegram.svg" alt="Telegram" width={20} height={20} />
              Написать в Telegram
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
