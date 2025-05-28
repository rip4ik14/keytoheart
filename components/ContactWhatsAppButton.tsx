'use client';

import Image from 'next/image';

export default function ContactWhatsAppButton() {
  return (
    <a
      href="https://wa.me/79886033821"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-800 transition-all duration-300"
      onClick={() => {
        window.gtag?.('event', 'contact_whatsapp', { event_category: 'payment_page' });
        window.ym?.(96644553, 'reachGoal', 'contact_whatsapp');
      }}
      aria-label="Связаться через WhatsApp"
    >
      <Image
        src="/icons/whatsapp.svg"
        alt="WhatsApp Icon"
        width={20}
        height={20}
        className="inline-block"
      />
      Написать в WhatsApp
    </a>
  );
}