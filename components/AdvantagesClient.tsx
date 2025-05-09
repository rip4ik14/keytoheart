'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function AdvantagesClient() {
  const advantages = [
    { icon: '/icons/camera.svg', text: 'Фото букета перед доставкой', alt: 'Camera' },
    { icon: '/icons/truck.svg', text: 'Доставка от 2ч', alt: 'Truck' },
    { icon: '/icons/shield-alt.svg', text: 'Гарантия на цветы 3 дня', alt: 'Shield' },
    { icon: '/icons/dollar-sign.svg', text: 'Кешбэк с каждого заказа до 15%', alt: 'Dollar Sign' },
  ];

  return (
    <section className="py-12 bg-white" aria-labelledby="advantages-title">
      <div className="container mx-auto px-4">
        <motion.h2
          id="advantages-title"
          className="text-center text-2xl md:text-3xl font-sans font-bold mb-8 text-black"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          С нами выгодно
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {advantages.map((advantage, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
              role="listitem"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="mb-2"
                aria-hidden="true"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Image
                  src={advantage.icon}
                  alt={advantage.alt}
                  width={32}
                  height={32}
                  className="text-black"
                />
              </motion.div>
              <p className="text-sm text-gray-700">{advantage.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}