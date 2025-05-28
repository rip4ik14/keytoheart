'use client';

import { motion } from 'framer-motion';
import ClientAnimatedSection from '@components/ClientAnimatedSection';
import TrackedLink from '@components/TrackedLink';
import ContactLink from '@components/ContactLink';
import { useEffect } from 'react';

export default function ContactsPageClient() {
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // Подключение Yandex Maps API
  useEffect(() => {
    const loadYandexMapScript = () => {
      if (document.querySelector('script[src*="api-maps.yandex.ru"]')) return;
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=07876a08-9ab2-4886-9159-2f07d80f8ef5&lang=ru_RU';
      script.async = true;
      script.onload = () => {
        // Проверяем, что window.ymaps существует и имеет метод ready
        if (window.ymaps && 'ready' in window.ymaps) {
          // Утверждаем тип window.ymaps как YandexMaps
          const ymaps = window.ymaps as YandexMaps;
          ymaps.ready(() => {
            // Дополнительная проверка на наличие Map и Placemark
            if ('Map' in ymaps && 'Placemark' in ymaps) {
              const map = new ymaps.Map('map', {
                center: [45.099153, 38.965618], // Координаты: г. Краснодар, ул. Героев-Разведчиков, 17/1
                zoom: 16,
                controls: ['zoomControl', 'fullscreenControl'],
              });

              const placemark = new ymaps.Placemark(
                [45.099153, 38.965618],
                {
                  balloonContent: 'г. Краснодар, ул. Героев-Разведчиков, 17/1',
                },
                {
                  preset: 'islands#redDotIcon',
                }
              );

              map.geoObjects.add(placemark);
            } else {
              console.error('Yandex Maps API не содержит необходимые методы (Map или Placemark)');
            }
          });
        } else {
          console.error('Yandex Maps API не загрузился корректно: метод ready отсутствует');
        }
      };
      script.onerror = () => {
        console.error('Не удалось загрузить Яндекс.Карты');
      };
      document.body.appendChild(script);
    };

    loadYandexMapScript();

    return () => {
      const script = document.querySelector('script[src*="api-maps.yandex.ru"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <ClientAnimatedSection>
      <section className="max-w-3xl mx-auto space-y-8">
        <motion.h1
          className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-center"
          role="heading"
          aria-level={1}
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Контакты
        </motion.h1>
        <motion.p
          className="text-base sm:text-lg leading-relaxed text-center text-gray-600"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Мы всегда рады ответить на ваши вопросы и помочь с выбором идеального букета!
        </motion.p>
        <motion.ul
          className="list-disc pl-5 space-y-2 text-base sm:text-lg"
          role="list"
          aria-label="Контактная информация"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <li role="listitem">
            <strong>Телефон:</strong>{' '}
            <ContactLink
              href="tel:+79886033821"
              label="Позвонить по номеру +7 (988) 603-38-21"
              type="phone"
            />
          </li>
          <li role="listitem">
            <strong>Email:</strong>{' '}
            <ContactLink
              href="mailto:info@keytoheart.ru"
              label="Отправить письмо на info@keytoheart.ru"
              type="email"
            />
          </li>
          <li role="listitem">
            <strong>Адрес:</strong> г. Краснодар, ул. Героев-Разведчиков, 17/1
          </li>
          <li role="listitem">
            <strong>Часы работы:</strong> Пн-Вс, 08:00–22:00
          </li>
        </motion.ul>
        {/* Карта */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="w-full h-96"
        >
          <div id="map" className="w-full h-full rounded-lg shadow-md"></div>
        </motion.div>
        <motion.p
          className="text-sm text-gray-600"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Ознакомьтесь с нашей{' '}
          <TrackedLink
            href="/policy"
            ariaLabel="Перейти к политике конфиденциальности"
            category="Navigation"
            action="Click Policy Link"
            label="Contacts Page"
            className="underline hover:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
          >
            Политикой конфиденциальности
          </TrackedLink>
          .
        </motion.p>
      </section>
    </ClientAnimatedSection>
  );
}