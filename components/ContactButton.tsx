'use client';

import Image from 'next/image';

export default function ContactButton() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <a
        href="https://t.me/keytomyheart"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-800 hover:scale-105 transition-all duration-300"
        onClick={() => {
          window.gtag?.('event', 'contact_telegram', {
            event_category: 'payment_page',
            event_label: 'Telegram Contact Click',
            value: 1,
          });
          window.ym?.(96644553, 'reachGoal', 'contact_telegram', {
            source: 'payment_page',
          });
        }}
        aria-label="Связаться через Telegram"
      >
        <Image src="/icons/telegram.svg" alt="Telegram" width={20} height={20} />
        Написать в Telegram
      </a>
      <a
        href="https://wa.me/79886033821"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-800 hover:scale-105 transition-all duration-300"
        onClick={() => {
          window.gtag?.('event', 'contact_whatsapp', {
            event_category: 'payment_page',
            event_label: 'WhatsApp Contact Click',
            value: 1,
          });
          window.ym?.(96644553, 'reachGoal', 'contact_whatsapp', {
            source: 'payment_page',
          });
        }}
        aria-label="Связаться через WhatsApp"
      >
        <Image src="/icons/whatsapp.svg" alt="WhatsApp" width={20} height={20} />
        Написать в WhatsApp
      </a>
    </div>
  );
}