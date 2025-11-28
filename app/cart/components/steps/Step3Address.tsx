// ✅ Путь: app/cart/components/steps/Step3Address.tsx
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
    askAddressFromRecipient: boolean; // 🔹 флаг "адрес уточнить у получателя"
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

  const isDelivery = form.deliveryMethod === 'delivery';
  const askFromRecipient = form.askAddressFromRecipient;

  return (
    <div className="space-y-4">
      {/* Переключатель доставка / самовывоз */}
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

      {isDelivery ? (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* 🔹 Чекбокс "я не знаю адрес" */}
          <div className="space-y-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="askAddressFromRecipient"
                checked={askFromRecipient}
                onChange={onFormChange}
                className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <span className="text-sm text-gray-700">
                Я не знаю точный адрес, уточните его у получателя по телефону
              </span>
            </label>
            <p className="text-[11px] text-gray-500">
              Если вы не знаете адрес, мы аккуратно свяжемся с получателем, уточним адрес и время доставки.
              Если знаете хотя бы часть адреса - заполните поля ниже, это ускорит доставку.
            </p>
          </div>

          {/* Если клиент сам знает адрес – показываем поля и подсказки */}
          {!askFromRecipient && (
            <>
              <div className="space-y-1">
                <label htmlFor="street" className="block text-xs text-gray-500">
                  Улица
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    <Image src="/icons/map-marker-alt.svg" alt="Улица" width={16} height={16} />
                  </div>
                  <input
                    id="street"
                    name="street"
                    value={form.street}
                    onChange={handleAddressChange}
                    placeholder="Введите улицу"
                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-base sm:text-sm ${
                      addressError ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-black`}
                    aria-invalid={!!addressError}
                    aria-autocomplete="list"
                    inputMode="text"
                    autoComplete="street-address"
                  />
                  {addressError && <p className="text-red-500 text-xs">{addressError}</p>}

                  {showSuggestions && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-sm max-h-48 overflow-auto">
                      {isLoadingSuggestions ? (
                        <li className="p-2 text-gray-500 flex items-center gap-2">
                          <Image
                            src="/icons/spinner.svg"
                            alt="..."
                            width={16}
                            height={16}
                            className="animate-spin"
                          />
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
                      placeholder={field === 'house' ? 'Дом' : field === 'apartment' ? 'Кв.' : 'Подъезд'}
                      className="w-full pl-3 pr-3 py-2 border rounded-md text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      inputMode={field === 'apartment' || field === 'house' ? 'numeric' : 'text'}
                      autoComplete={field === 'house' ? 'address-line2' : undefined}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Инструкции для доставки – всегда доступны, но текст под сценарий */}
          <div className="space-y-1">
            <label htmlFor="deliveryInstructions" className="block text-xs text-gray-500">
              Инструкции для доставки
            </label>
            <textarea
              id="deliveryInstructions"
              name="deliveryInstructions"
              value={form.deliveryInstructions}
              onChange={handleInstr}
              placeholder={
                askFromRecipient
                  ? 'Например: позвонить получателю в день доставки, представиться курьером сервиса и аккуратно уточнить адрес, не раскрывая деталей сюрприза.'
                  : 'Например: не звонить получателю заранее, это сюрприз; позвонить сначала вам; позвонить за 10–15 минут до приезда.'
              }
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black min-h-[80px] text-base sm:text-sm"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              {askFromRecipient
                ? 'Так как адрес будем уточнять у получателя, укажите, пожалуйста, в какое время лучше звонить и как сохранить эффект сюрприза.'
                : 'Если это сюрприз, опишите, как с вами лучше связаться и как курьеру себя вести (звонок заранее, только сообщение и т.п.).'}
            </p>
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
