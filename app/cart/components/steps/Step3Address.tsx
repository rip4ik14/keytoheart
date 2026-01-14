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
    askAddressFromRecipient: boolean;
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
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function iosBlurFix() {
  if (typeof window === 'undefined') return;
  setTimeout(() => {
    try {
      const y = window.scrollY;
      window.scrollTo(0, y);
      window.scrollTo(0, y + 1);
      window.scrollTo(0, y);
    } catch {
      // noop
    }
  }, 60);
}

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
    onFormChange(
      ({
        target: { name: 'deliveryInstructions', value: clean },
      } as unknown) as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    );
  };

  const isDelivery = form.deliveryMethod === 'delivery';
  const askFromRecipient = form.askAddressFromRecipient;

  const inputCls =
    'w-full rounded-[18px] border border-[#bdbdbd] px-4 py-4 text-[16px] sm:text-[15px] outline-none focus:border-black transition';

  return (
    <div className="space-y-4">
      {/* Переключатель */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="deliveryMethod"
              value="pickup"
              checked={form.deliveryMethod === 'pickup'}
              onChange={onFormChange}
              className="h-5 w-5 text-black border-[#bdbdbd] focus:ring-black"
            />
            <span className="text-[13px] text-[#2f2f2f]">Самовывоз</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="deliveryMethod"
              value="delivery"
              checked={form.deliveryMethod === 'delivery'}
              onChange={onFormChange}
              className="h-5 w-5 text-black border-[#bdbdbd] focus:ring-black"
            />
            <span className="text-[13px] text-[#2f2f2f]">Доставка</span>
          </label>
        </div>

        {!isDelivery && (
          <p className="text-[13px] text-[#2f2f2f]">
            Адрес самовывоза: ул. Героев Разведчиков, 17/1
          </p>
        )}
      </motion.div>

      {isDelivery ? (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Чекбокс "не знаю адрес" */}
          <div className="space-y-2">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="askAddressFromRecipient"
                checked={askFromRecipient}
                onChange={onFormChange}
                className="mt-[2px] h-5 w-5 rounded border-[#bdbdbd] text-black focus:ring-black"
              />
              <span className="text-[13px] text-[#2f2f2f]">
                Я не знаю точный адрес, уточните его у получателя по телефону
              </span>
            </label>

            <p className="text-[11px] text-[#6f6f6f]">
              Если вы не знаете адрес, мы аккуратно свяжемся с получателем, уточним адрес и время доставки.
              Если знаете хотя бы часть адреса - заполните поля ниже, это ускорит доставку.
            </p>
          </div>

          {!askFromRecipient && (
            <>
              {/* Улица */}
              <div className="space-y-2">
                <input
                  id="street"
                  name="street"
                  value={form.street}
                  onChange={handleAddressChange}
                  onBlur={iosBlurFix}
                  placeholder="Улица:"
                  className={`${inputCls} ${addressError ? 'border-red-500' : ''}`}
                  aria-invalid={!!addressError}
                  aria-autocomplete="list"
                  inputMode="text"
                  autoComplete="street-address"
                />
                {addressError && <p className="text-red-500 text-xs">{addressError}</p>}

                {showSuggestions && (
                  <ul className="relative z-10 w-full bg-white border border-[#bdbdbd] rounded-[14px] shadow-sm max-h-48 overflow-auto">
                    {isLoadingSuggestions ? (
                      <li className="px-4 py-3 text-[#6f6f6f] flex items-center gap-2">
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
                          className="px-4 py-3 text-[#2f2f2f] hover:bg-[#f5f5f5] cursor-pointer"
                        >
                          {s}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-3 text-[#6f6f6f]">Ничего не найдено</li>
                    )}
                  </ul>
                )}
              </div>

              {/* Дом/кв/подъезд */}
              <div className="grid grid-cols-3 gap-3">
                <input
                  id="house"
                  name="house"
                  value={form.house}
                  onChange={onFormChange}
                  onBlur={iosBlurFix}
                  placeholder="Дом:"
                  className={inputCls}
                  inputMode="numeric"
                />
                <input
                  id="apartment"
                  name="apartment"
                  value={form.apartment}
                  onChange={onFormChange}
                  onBlur={iosBlurFix}
                  placeholder="Кв.:"
                  className={inputCls}
                  inputMode="numeric"
                />
                <input
                  id="entrance"
                  name="entrance"
                  value={form.entrance}
                  onChange={onFormChange}
                  onBlur={iosBlurFix}
                  placeholder="Подъезд:"
                  className={inputCls}
                  inputMode="text"
                />
              </div>
            </>
          )}
        </motion.div>
      ) : null}

      {/* Пожелания - ВСЕГДА, как на Labberry */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <span className="text-[13px] font-semibold text-black">Пожелания:</span>

        <textarea
          id="deliveryInstructions"
          name="deliveryInstructions"
          value={form.deliveryInstructions}
          onChange={handleInstr}
          onBlur={iosBlurFix}
          placeholder={
            isDelivery
              ? askFromRecipient
                ? 'Например: позвонить получателю в день доставки, представиться курьером сервиса и аккуратно уточнить адрес, не раскрывая деталей сюрприза.'
                : 'Например: не звонить получателю заранее, это сюрприз; позвонить сначала вам; позвонить за 10-15 минут до приезда.'
              : 'Например: подготовьте, пожалуйста, букет к 18:00; можно подписать открытку.'
          }
          className="w-full rounded-[18px] border border-[#bdbdbd] px-4 py-4 text-[16px] sm:text-[14px] outline-none focus:border-black min-h-[110px] resize-none"
        />
      </motion.div>
    </div>
  );
}
