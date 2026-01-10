// ✅ Путь: app/cart/components/steps/Step2RecipientDetails.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { UpsellItem } from '../../types';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  form: {
    recipient: string;
    recipientPhone: string; // храним НОРМАЛИЗОВАННО: +7XXXXXXXXXX (или пусто / частично во время ввода)
    anonymous: boolean;
  };
  name: string;
  userPhone: string;
  recipientError: string;
  recipientPhoneError: string;

  postcardText: string;
  setPostcardText: (text: string) => void;

  occasion: string;
  setOccasion: (v: string) => void;

  selectedUpsells: UpsellItem[];
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25 },
  }),
};

function digitsOnly(v: string) {
  return (v || '').replace(/\D/g, '');
}

function toLocal10FromStoredPhone(stored: string) {
  const d = digitsOnly(stored);
  if (!d) return '';

  if (d.startsWith('7')) return d.slice(1, 11);
  if (d.startsWith('8')) return d.slice(1, 11);

  if (d.length > 10) return d.slice(-10);
  return d.slice(0, 10);
}

function formatLocalRu(local10: string) {
  const d = digitsOnly(local10).slice(0, 10);

  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 8);
  const e = d.slice(8, 10);

  if (!d) return '';
  if (d.length <= 3) return `(${a}`;
  if (d.length <= 6) return `(${a}) ${b}`;
  if (d.length <= 8) return `(${a}) ${b}-${c}`;
  return `(${a}) ${b}-${c}-${e}`;
}

export default function Step2RecipientDetails({
  form,
  name,
  userPhone,
  recipientError,
  recipientPhoneError,
  postcardText,
  setPostcardText,
  occasion,
  setOccasion,
  selectedUpsells,
  onFormChange,
}: Props) {
  const [showSuggest, setShowSuggest] = useState(false);
  const [showAnonTip, setShowAnonTip] = useState(false);

  const [recipientPhoneUi, setRecipientPhoneUi] = useState<string>('');
  const isFocusedRef = useRef(false);

  const local10FromForm = useMemo(
    () => toLocal10FromStoredPhone(form.recipientPhone),
    [form.recipientPhone],
  );

  useEffect(() => {
    const uiDigits = digitsOnly(recipientPhoneUi);
    const nextDigits = digitsOnly(local10FromForm);

    if (isFocusedRef.current && uiDigits === nextDigits) return;
    if (isFocusedRef.current && uiDigits.length > 0 && nextDigits.startsWith(uiDigits)) return;

    setRecipientPhoneUi(formatLocalRu(local10FromForm));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local10FromForm]);

  const suggestions = useMemo(() => {
    return [
      `Поздравляю с ...! Желаю реализации всех мечт и исполнения всех заветных желаний. Обнимаю ❤️`,
      `Поздравляю с ...! Пусть жизнь всегда играет яркими красками, каждый день будет насыщенным, интересным и не похожим на предыдущий. Очень ценю тебя ❤️`,
      `С праздником! Желаю, чтобы гармония и удача стали повседневными спутниками, и все получалось легко и красиво ❤️`,
      `С годовщиной! Стукнул ... год, как мы вместе :) не верится, что время летит так быстро. Я очень счастлив/счастлива быть с тобой ❤️ целую, обнимаю!`,
      `Просто решил/решила напомнить, как сильно я тебя люблю ❤️ целую!!`,
      `Скорее выздоравливай! Очень скучаю и жду встречи ❤️`,
    ];
  }, []);

  const hasPostcard = selectedUpsells.some((u) => u.category === 'postcard');

  return (
    <div className="space-y-4">
      {/* Я получатель */}
      <motion.label
        className="flex items-center gap-3 pt-1"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          checked={
            form.recipient === name && digitsOnly(form.recipientPhone) === digitsOnly(userPhone)
          }
          onChange={(e) => {
            if (e.target.checked) {
              onFormChange({ target: { name: 'recipient', value: name } } as any);
              onFormChange({ target: { name: 'recipientPhone', value: userPhone } } as any);
            } else {
              onFormChange({ target: { name: 'recipient', value: '' } } as any);
              onFormChange({ target: { name: 'recipientPhone', value: '' } } as any);
            }
          }}
          className="h-5 w-5 rounded border-[#bdbdbd] text-black focus:ring-black"
          aria-label="Я получатель"
        />
        <span className="text-[13px] text-[#2f2f2f]">Я получатель</span>
      </motion.label>

      {/* Имя получателя */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        <input
          id="recipient"
          name="recipient"
          value={form.recipient}
          onChange={onFormChange}
          placeholder="Имя:"
          className={`w-full rounded-[18px] border px-4 py-4 text-[15px] outline-none transition ${
            recipientError ? 'border-red-500' : 'border-[#bdbdbd]'
          } focus:border-black`}
          aria-invalid={!!recipientError}
          required
          inputMode="text"
          autoComplete="name"
        />
        {recipientError && <p className="text-red-500 text-xs">{recipientError}</p>}
      </motion.div>

      {/* Телефон получателя */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        custom={2}
        variants={containerVariants}
      >
        <div className="grid grid-cols-[92px_1fr] gap-3">
          <div className="rounded-[18px] border border-[#bdbdbd] px-3 py-4 flex items-center justify-between">
            <span className="text-[15px] font-medium">+7</span>
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <input
            id="recipientPhone"
            name="recipientPhone_ui"
            value={recipientPhoneUi}
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={() => {
              isFocusedRef.current = false;
            }}
            onChange={(e) => {
              const d10 = digitsOnly(e.target.value).slice(0, 10);

              setRecipientPhoneUi(formatLocalRu(d10));

              const next = d10.length ? `+7${d10}` : '';
              onFormChange({ target: { name: 'recipientPhone', value: next } } as any);
            }}
            placeholder="(___) ___-__-__"
            className={`w-full rounded-[18px] border px-4 py-4 text-[15px] outline-none transition ${
              recipientPhoneError ? 'border-red-500' : 'border-[#bdbdbd]'
            } focus:border-black`}
            aria-invalid={!!recipientPhoneError}
            required
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        {recipientPhoneError && <p className="text-red-500 text-xs">{recipientPhoneError}</p>}
      </motion.div>

      {/* Текст открытки */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        custom={3}
        variants={containerVariants}
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-black">Текст открытки:</span>
          <button
            type="button"
            onClick={() => setShowSuggest(true)}
            className="text-[11px] font-bold uppercase tracking-tight underline text-[#2f2f2f]"
          >
            Предложить текст
          </button>
        </div>

        <textarea
          id="postcardText"
          value={postcardText}
          onChange={(e) => setPostcardText(e.target.value)}
          placeholder="Текст открытки:"
          className="w-full rounded-[18px] border border-[#bdbdbd] px-4 py-4 text-[14px] outline-none focus:border-black min-h-[120px] resize-none"
          aria-label="Текст открытки"
        />

        <p className="text-[11px] text-[#6f6f6f]">
          {hasPostcard
            ? 'Мы аккуратно перепишем текст на открытку. Если поле пустое - вложим открытку без подписи.'
            : 'Если вы добавите открытку, мы перепишем этот текст на неё.'}
        </p>
      </motion.div>

      {/* Повод покупки */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        custom={4}
        variants={containerVariants}
      >
        <span className="text-[13px] font-semibold text-black">Выберите повод покупки:</span>

        <div className="relative">
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="w-full appearance-none rounded-[18px] border border-[#bdbdbd] px-4 py-4 text-[15px] bg-white outline-none focus:border-black"
            aria-label="Повод покупки"
          >
            <option value="">Не указан</option>
            <option value="birthday">День рождения</option>
            <option value="wedding">Свадьба</option>
            <option value="anniversary">Годовщина</option>
            <option value="childbirth">Рождение ребенка</option>
            <option value="no_reason">Просто так (без повода)</option>
            <option value="treat_self">Себя порадовать</option>
            <option value="colleague">Поздравление коллеге</option>
            <option value="other">Прочее</option>
          </select>

          <svg
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </motion.div>

      {/* Анонимный заказ */}
      <motion.div
        className="pt-1"
        initial="hidden"
        animate="visible"
        custom={5}
        variants={containerVariants}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="anonymous"
            checked={form.anonymous}
            onChange={onFormChange}
            className="h-5 w-5 rounded border-[#bdbdbd] text-black focus:ring-black"
            aria-label="Анонимный заказ"
          />

          <span className="text-[13px] text-[#2f2f2f]">Анонимный заказ</span>

          <button
            type="button"
            onClick={() => setShowAnonTip((v) => !v)}
            className="w-5 h-5 rounded-full bg-[#e9e9e9] text-black flex items-center justify-center text-[12px] font-bold"
            aria-label="Что такое анонимный заказ"
          >
            ?
          </button>
        </div>

        <AnimatePresence>
          {showAnonTip && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="mt-2 rounded-[14px] border border-[#bdbdbd] bg-white p-3 text-[12px] text-[#4b4b4b]"
            >
              Мы не передадим получателю никаких данных о вас.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Модалка с вариантами текста */}
      <AnimatePresence>
        {showSuggest && (
          <motion.div
            className="fixed inset-0 z-[999] bg-black/30 flex items-center justify-center px-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSuggest(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-[18px] bg-white border border-[#bdbdbd] p-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-black">Варианты текста</p>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[#6f6f6f]"
                  onClick={() => setShowSuggest(false)}
                >
                  Закрыть
                </button>
              </div>

              <div className="mt-3 max-h-[300px] overflow-auto rounded-[14px] border border-[#e5e5e5]">
                {suggestions.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPostcardText(t);
                      setShowSuggest(false);
                    }}
                    className="w-full text-left px-4 py-3 text-[13px] leading-snug hover:bg-[#f5f5f5] border-b border-[#efefef] last:border-b-0"
                  >
                    {t}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-[11px] text-[#6f6f6f]">
                Нажмите на вариант - он вставится в поле текста открытки.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
