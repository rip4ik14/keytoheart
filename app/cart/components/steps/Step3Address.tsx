// ✅ Путь: app/cart/components/steps/Step3Address.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
  showSuggestions: boolean;
  isLoadingSuggestions: boolean;
  addressSuggestions: string[];
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectAddress: (address: string) => void;
  isYmapsReady: boolean;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

export default function Step3Address({
  form,
  addressError,
  showSuggestions,
  isLoadingSuggestions,
  addressSuggestions,
  onFormChange,
  handleAddressChange,
  handleSelectAddress,
  isYmapsReady,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Инициализация карты
  useEffect(() => {
    if (!isYmapsReady || !window.ymaps || form.deliveryMethod !== 'delivery') return;

    const initMap = async () => {
      // Проверяем, что mapContainerRef.current существует
      if (!mapContainerRef.current) {
        console.error('Контейнер карты не найден');
        return;
      }

      try {
        // Создаём карту с центром в Краснодаре
        mapInstanceRef.current = new window.ymaps.Map(mapContainerRef.current, {
          center: [45.0355, 38.9753], // Центр Краснодара
          zoom: 12,
          controls: ['zoomControl'], // Теперь свойство controls типизировано
        });

        // Если адрес уже введён, геокодируем его
        if (form.street) {
          const fullAddress = `Краснодар, ${form.street}${form.house ? `, д. ${form.house}` : ''}`;
          const geocodeResult = await window.ymaps.geocode(fullAddress, {
            boundedBy: [[45.0, 38.9], [45.2, 39.1]],
            strictBounds: true,
          });

          const firstGeoObject = geocodeResult.geoObjects.get(0);
          if (firstGeoObject) {
            const coords = firstGeoObject.geometry.getCoordinates();
            mapInstanceRef.current.setCenter(coords, 16);
            mapInstanceRef.current.geoObjects.add(firstGeoObject);
          }
        }
      } catch (error) {
        console.error('Ошибка инициализации карты:', error);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [isYmapsReady, form.deliveryMethod, form.street, form.house]);

  // Обновление карты при изменении адреса
  useEffect(() => {
    if (!isYmapsReady || !window.ymaps || !mapInstanceRef.current || !form.street) return;

    const updateMap = async () => {
      try {
        mapInstanceRef.current.geoObjects.removeAll();
        const fullAddress = `Краснодар, ${form.street}${form.house ? `, д. ${form.house}` : ''}`;
        const geocodeResult = await window.ymaps.geocode(fullAddress, {
          boundedBy: [[45.0, 38.9], [45.2, 39.1]],
          strictBounds: true,
        });

        const firstGeoObject = geocodeResult.geoObjects.get(0);
        if (firstGeoObject) {
          const coords = firstGeoObject.geometry.getCoordinates();
          mapInstanceRef.current.setCenter(coords, 16);
          mapInstanceRef.current.geoObjects.add(firstGeoObject);
        } else {
          mapInstanceRef.current.setCenter([45.0355, 38.9753], 12);
        }
      } catch (error) {
        console.error('Ошибка обновления карты:', error);
      }
    };

    updateMap();
  }, [isYmapsReady, form.street, form.house]);

  return (
    <div className="space-y-4">
      <motion.div className="mb-4" variants={containerVariants}>
        <label className="flex items-center gap-2 mb-2">
          <input
            type="radio"
            name="deliveryMethod"
            value="pickup"
            checked={form.deliveryMethod === 'pickup'}
            onChange={onFormChange}
            className="form-radio h-4 w-4 text-black focus:ring-2 focus:ring-offset-2 focus:ring-black"
            aria-label="Самовывоз"
          />
          <Image src="/icons/store.svg" alt="Самовывоз" width={16} height={16} className="text-gray-600" />
          Самовывоз
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="deliveryMethod"
            value="delivery"
            checked={form.deliveryMethod === 'delivery'}
            onChange={onFormChange}
            className="form-radio h-4 w-4 text-black focus:ring-2 focus:ring-offset-2 focus:ring-black"
            aria-label="Доставка"
          />
          <Image src="/icons/truck.svg" alt="Доставка" width={16} height={16} className="text-gray-600" />
          Доставка
        </label>
      </motion.div>
      {form.deliveryMethod === 'delivery' ? (
        <motion.div className="space-y-4" variants={containerVariants}>
          <div className="relative">
            <label htmlFor="street" className="text-sm font-medium mb-1 block text-gray-700">
              Улица
            </label>
            <motion.div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 mt-4"
              whileHover={{ scale: 1.1 }}
            >
              <Image src="/icons/map-marker-alt.svg" alt="Адрес" width={16} height={16} />
            </motion.div>
            <input
              id="street"
              name="street"
              value={form.street}
              onChange={handleAddressChange}
              placeholder="Улица"
              className={`w-full rounded-lg border border-gray-300 p-2 pl-10 ${
                addressError ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
              aria-label="Введите улицу"
              aria-invalid={addressError ? 'true' : 'false'}
              aria-autocomplete="list"
              aria-controls="address-suggestions"
              aria-expanded={showSuggestions}
            />
            {addressError && <p className="text-red-500 text-xs mt-1">{addressError}</p>}
            {showSuggestions && (
              <ul
                id="address-suggestions"
                className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg"
                role="listbox"
                aria-label="Предложения адресов"
              >
                {isLoadingSuggestions ? (
                  <li className="p-2 text-sm text-gray-500 flex items-center gap-2">
                    <Image src="/icons/spinner.svg" alt="Загрузка" width={16} height={16} className="animate-spin" />
                    Загрузка...
                  </li>
                ) : addressSuggestions.length > 0 ? (
                  addressSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleSelectAddress(suggestion)}
                      className="p-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                      role="option"
                      aria-selected={false}
                    >
                      {suggestion}
                    </li>
                  ))
                ) : (
                  <li className="p-2 text-sm text-gray-500">
                    Адреса не найдены
                  </li>
                )}
              </ul>
            )}
          </div>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <label htmlFor="house" className="text-sm font-medium mb-1 block text-gray-700">
                Дом
              </label>
              <input
                id="house"
                name="house"
                value={form.house}
                onChange={onFormChange}
                placeholder="Дом"
                className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                aria-label="Введите номер дома"
              />
            </div>
            <div className="relative flex-1">
              <label htmlFor="apartment" className="text-sm font-medium mb-1 block text-gray-700">
                Квартира
              </label>
              <input
                id="apartment"
                name="apartment"
                value={form.apartment}
                onChange={onFormChange}
                placeholder="Квартира"
                className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                aria-label="Введите номер квартиры"
              />
            </div>
          </div>
          <div className="relative">
            <label htmlFor="entrance" className="text-sm font-medium mb-1 block text-gray-700">
              Подъезд
            </label>
            <input
              id="entrance"
              name="entrance"
              value={form.entrance}
              onChange={onFormChange}
              placeholder="Подъезд"
              className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              aria-label="Введите номер подъезда"
            />
          </div>
          <div className="relative">
            <label
              htmlFor="deliveryInstructions"
              className="text-sm font-medium mb-1 block text-gray-700"
            >
              Инструкции для доставки
            </label>
            <textarea
              id="deliveryInstructions"
              name="deliveryInstructions"
              value={form.deliveryInstructions}
              onChange={onFormChange}
              placeholder="Например: позвонить за 30 минут до доставки"
              className="w-full rounded-lg border border-gray-300 p-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              aria-label="Введите инструкции для доставки"
            />
          </div>
          {/* Карта */}
          <div className="relative">
            <label className="text-sm font-medium mb-1 block text-gray-700">
              Местоположение на карте
            </label>
            <div
              ref={mapContainerRef}
              className="w-full h-[300px] rounded-lg border border-gray-300"
              aria-label="Карта с выбранным адресом доставки"
            />
            {!isYmapsReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
                <p className="text-gray-500">Загрузка карты...</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Заявки принимаются до 15:00, доставка возможна через 41TEM
          </p>
        </motion.div>
      ) : (
        <motion.p className="text-sm text-gray-600" variants={containerVariants}>
          Адрес самовывоза: г. Краснодар, ул. Героев Разведчиков, 17/1 (с 10:00 до 20:00)
        </motion.p>
      )}
    </div>
  );
}