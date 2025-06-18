// ✅ path: app/cart/components/steps/Step3Address.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import sanitizeHtml from 'sanitize-html';

interface Props {
  form: {
    deliveryMethod: 'delivery' | 'pickup';
    street: string;
    house: string;
    apartment: string;
    entrance: string;
    deliveryInstructions: string;
  };
  addressError: string;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectAddress: (address: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

export default function Step3Address({
  form,
  addressError,
  onFormChange,
  handleAddressChange,
  handleSelectAddress,
}: Props) {
  const streetRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Обратите внимание на "&load=package.suggest"
    const ymapsUrl = `https://api-maps.yandex.ru/2.1/` +
                     `?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}` +
                     `&lang=ru_RU` +
                     `&load=package.suggest`;

    let cancelled = false;

    function initSuggest() {
      if (
        typeof window !== 'undefined' &&
        (window as any).ymaps &&
        (window as any).ymaps.ready &&
        streetRef.current
      ) {
        ;(window as any).ymaps.ready(() => {
          if (cancelled) return;
          // @ts-ignore
          new (window as any).ymaps.SuggestView(streetRef.current, {
            // Границы по Краснодарскому краю
            boundedBy: [
              [44.3, 38.3],
              [46.0, 40.3],
            ],
            strictBounds: true,
          });
        });
      }
    }

    if (!document.querySelector(`script[src^="${ymapsUrl}"]`)) {
      const script = document.createElement('script');
      script.src = ymapsUrl;
      script.async = true;
      script.onload = initSuggest;
      script.onerror = () => {
        console.error('Не удалось загрузить скрипт Яндекс.Карт');
      };
      document.head.appendChild(script);
    } else {
      initSuggest();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const handleInstr = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const clean = sanitizeHtml(e.target.value, { allowedTags: [], allowedAttributes: {} });
    onFormChange({ target: { name: 'deliveryInstructions', value: clean } } as any);
  };

  return (
    <div className="space-y-4">
      <motion.div
        className="flex gap-6 border-b pb-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="deliveryMethod"
            value="pickup"
            checked={form.deliveryMethod === 'pickup'}
            onChange={onFormChange}
            className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          />
          <Image src="/icons/store.svg" alt="Самовывоз" width={16} height={16} />
          <span className="text-sm text-gray-700">Самовывоз</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="deliveryMethod"
            value="delivery"
            checked={form.deliveryMethod === 'delivery'}
            onChange={onFormChange}
            className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          />
          <Image src="/icons/truck.svg" alt="Доставка" width={16} height={16} />
          <span className="text-sm text-gray-700">Доставка</span>
        </label>
      </motion.div>

      {form.deliveryMethod === 'delivery' ? (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Улица с автодополнением */}
          <div className="space-y-1">
            <label htmlFor="street" className="block text-xs text-gray-500">
              Улица
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                <Image src="/icons/map-marker-alt.svg" alt="Улица" width={16} height={16} />
              </div>
              <input
                ref={streetRef}
                id="street"
                name="street"
                value={form.street}
                onChange={handleAddressChange}
                placeholder="Начните вводить улицу"
                className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                  addressError ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-black`}
                aria-invalid={!!addressError}
                autoComplete="off"
              />
              {addressError && (
                <p className="text-red-500 text-xs mt-1">{addressError}</p>
              )}
            </div>
          </div>

          {/* Дом, кв., подъезд */}
          <div className="flex gap-4">
            {['house', 'apartment', 'entrance'].map((field) => (
              <div key={field} className="flex-1 space-y-1">
                <label htmlFor={field} className="block text-xs text-gray-500">
                  {field === 'house' ? 'Дом' : field === 'apartment' ? 'Квартира' : 'Подъезд'}
                </label>
                <input
                  id={field}
                  name={field}
                  value={(form as any)[field]}
                  onChange={onFormChange}
                  placeholder={
                    field === 'house'
                      ? 'Дом'
                      : field === 'apartment'
                      ? 'Квартира'
                      : 'Подъезд'
                  }
                  className="w-full pl-3 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            ))}
          </div>

          {/* Инструкции */}
          <div className="space-y-1">
            <label htmlFor="deliveryInstructions" className="block text-xs text-gray-500">
              Инструкции для доставки
            </label>
            <textarea
              id="deliveryInstructions"
              name="deliveryInstructions"
              value={form.deliveryInstructions}
              onChange={handleInstr}
              placeholder="Например: позвонить за 30 минут"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black min-h-[80px]"
            />
          </div>
        </motion.div>
      ) : (
        <motion.p
          className="text-sm text-gray-700"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          Самовывоз: г. Краснодар, ул. Героев Разведчиков, 17/1
        </motion.p>
      )}
    </div>
  );
}
