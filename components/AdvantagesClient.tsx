'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function AdvantagesClient() {
  const advantages = [
    { icon: '/icons/camera.svg', text: 'Фото букета перед доставкой', alt: 'Camera' },
    { icon: '/icons/truck.svg', text: 'Доставка от 2ч', alt: 'Truck' },
    { icon: '/icons/dollar-sign.svg', text: 'Кешбэк с каждого заказа до 15%', alt: 'Dollar Sign' },
  ];

  return (
    <section className="py-8 sm:py-10 md:py-12 bg-white" aria-labelledby="advantages-title">
      <div className="container mx-auto px-4">
        <motion.h2
          id="advantages-title"
          className="text-center text-2xl md:text-3xl font-sans font-bold mb-8 text-black"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          
        </motion.h2>
        <div className="
          grid 
          grid-cols-1 
          xs:grid-cols-2 
          sm:grid-cols-2 
          md:grid-cols-3 
          gap-4
          sm:gap-6
          max-w-2xl
          mx-auto
        ">
          {advantages.map((advantage, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
              role="listitem"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="mb-3"
                aria-hidden="true"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Image
                  src={advantage.icon}
                  alt={advantage.alt}
                  width={38}
                  height={38}
                  className="text-black"
                  priority={index === 0}
                />
              </motion.div>
              <p className="text-base font-medium text-gray-800">{advantage.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
