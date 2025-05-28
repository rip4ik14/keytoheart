'use client';

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
  showSuggestions: boolean;
  isLoadingSuggestions: boolean;
  addressSuggestions: string[];
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
  showSuggestions,
  isLoadingSuggestions,
  addressSuggestions,
  onFormChange,
  handleAddressChange,
  handleSelectAddress,
}: Props) {
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
          <div className="space-y-1">
            <label htmlFor="street" className="block text-xs text-gray-500">
              Улица
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Image src="/icons/map-marker-alt.svg" alt="Улица" width={16} height={16} />
              </div>
              <input
                id="street"
                name="street"
                value={form.street}
                onChange={handleAddressChange}
                placeholder="Введите улицу"
                className={`w-full pl-10 pr-3 py-2 border rounded-md ${
                  addressError ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-black`}
                aria-invalid={!!addressError}
                aria-autocomplete="list"
              />
              {addressError && <p className="text-red-500 text-xs">{addressError}</p>}
              {showSuggestions && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-sm max-h-48 overflow-auto">
                  {isLoadingSuggestions ? (
                    <li className="p-2 text-gray-500 flex items-center gap-2">
                      <Image src="/icons/spinner.svg" alt="..." width={16} height={16} className="animate-spin" />
                      Загрузка...
                    </li>
                  ) : addressSuggestions.length > 0 ? (
                    addressSuggestions.map((s, i) => (
                      <li
                        key={i}
                        onClick={() => handleSelectAddress(s)}
                        className="p-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        {s}
                      </li>
                    ))
                  ) : (
                    <li className="p-2 text-gray-500">Ничего не найдено</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {['house', 'apartment', 'entrance'].map((field, i) => (
              <div key={field} className="flex-1 space-y-1">
                <label htmlFor={field} className="block text-xs text-gray-500">
                  {field === 'house' ? 'Дом' : field === 'apartment' ? 'Квартира' : 'Подъезд'}
                </label>
                <input
                  id={field}
                  name={field}
                  value={(form as any)[field]}
                  onChange={onFormChange}
                  placeholder={field === 'house' ? 'Дом' : field === 'apartment' ? 'Кв.' : 'Подъезд'}
                  className="w-full pl-3 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            ))}
          </div>

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