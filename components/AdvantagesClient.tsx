'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

export default function AdvantagesClient() {
  const prefersReduced = useReducedMotion();

  const advantages = [
    { icon: '/icons/camera.svg', text: 'Фото букета перед доставкой', alt: 'Camera' },
    { icon: '/icons/truck.svg',  text: 'Доставка от 60 минут',        alt: 'Truck'  },
    { icon: '/icons/dollar-sign.svg', text: 'Кешбэк до 15 %',         alt: 'Dollar' },
  ];

  return (
    /* min-h резервирует место, чтобы блок не «вскакивал» при hydration */
    <section
      className="py-6 sm:py-8 md:py-10 bg-white min-h-[200px]"
      aria-label="Преимущества KEY TO HEART"
    >
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <div
          className="
            grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3
            gap-4 sm:gap-6
          "
        >
          {advantages.map((advantage, index) => (
            <motion.div
              key={index}
              className="
                flex flex-col items-center text-center
                p-5 sm:p-6 bg-white rounded-2xl shadow
                h-full min-h-[140px] transition-shadow hover:shadow-md
              "
              role="listitem"
              {...(!prefersReduced && {
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: '-100px' },
                transition: { duration: 0.4, delay: index * 0.1 },
              })}
            >
              <motion.div
                className="mb-3 flex items-center justify-center"
                aria-hidden="true"
                whileHover={prefersReduced ? undefined : { scale: 1.13 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              >
                <Image
                  src={advantage.icon}
                  alt={advantage.alt}
                  width={48}
                  height={48}
                  priority={index === 0}
                />
              </motion.div>
              <p className="text-base sm:text-lg font-medium text-gray-800 leading-tight">
                {advantage.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
