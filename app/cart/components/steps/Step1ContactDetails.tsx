// ✅ Путь: app/cart/components/steps/Step1ContactDetails.tsx
'use client';

import { motion } from 'framer-motion';
import TrackedLink from '@components/TrackedLink';
import AuthWithCall from '@components/AuthWithCall';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  form: {
    phone: string;
    name: string;

    // обязательная галка (оферта/соглашение/политика) - должна быть true для продолжения
    agreedToTerms?: boolean;

    // необязательная галка (маркетинг)
    agreedToMarketing?: boolean;

    contactMethod: 'call' | 'whatsapp' | 'telegram' | 'max';
  };
  phoneError: string;
  nameError: string;
  agreedToTermsError: string;

  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  isAuthenticated?: boolean;
  authChecked?: boolean;
  bonusBalance?: number;
  showAuthPanel?: boolean;
  setShowAuthPanel?: (v: boolean) => void;
  onAuthSuccess?: (phone: string) => void;
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

function extractLocal10FromAnyInput(raw: string) {
  const d = digitsOnly(raw);
  if (!d) return '';

  if (d.length >= 11 && (d.startsWith('7') || d.startsWith('8'))) {
    return d.slice(1, 11);
  }

  if (d.length > 10) return d.slice(-10);
  return d.slice(0, 10);
}

function toLocal10FromStoredPhone(stored: string) {
  const d = digitsOnly(stored);
  if (!d) return '';

  if (d.startsWith('7')) return d.slice(1, 11);
  if (d.startsWith('8')) return d.slice(1, 11);

  if (d.length > 10) return d.slice(-10);
  return d.slice(0, 10);
}

function formatLocal10ForInput(local10: string) {
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

function countDigitsBeforePos(s: string, pos: number) {
  let c = 0;
  for (let i = 0; i < Math.min(pos, s.length); i++) {
    if (/\d/.test(s[i])) c++;
  }
  return c;
}

function posForDigitIndex(formatted: string, digitIndex: number) {
  if (digitIndex <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen >= digitIndex) return i + 1;
    }
  }
  return formatted.length;
}

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

function ContactMethodButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-[14px] border px-3 py-[9px] text-[11px] sm:text-[11px] font-bold uppercase tracking-tight transition',
        'active:scale-[0.99]',
        active
          ? 'bg-white border-black text-black'
          : 'bg-white border-[#bdbdbd] text-[#2f2f2f] hover:border-black',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export default function Step1ContactDetails({
  form,
  phoneError,
  nameError,
  agreedToTermsError,
  onFormChange,

  isAuthenticated = false,
  authChecked = true,
  bonusBalance = 0,
  showAuthPanel,
  setShowAuthPanel,
  onAuthSuccess,
}: Props) {
  const canToggleAuth =
    typeof setShowAuthPanel === 'function' && typeof showAuthPanel === 'boolean';

  const [phoneUi, setPhoneUi] = useState<string>('');
  const phoneUiRef = useRef<string>('');
  const isFocusedRef = useRef(false);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  const local10FromForm = useMemo(() => toLocal10FromStoredPhone(form.phone), [form.phone]);

  const emit = (name: string, value: string) => {
    onFormChange(
      ({
        target: { name, value },
      } as unknown) as React.ChangeEvent<HTMLInputElement>,
    );
  };

  useEffect(() => {
    const uiDigits = digitsOnly(phoneUi);
    const nextDigits = digitsOnly(local10FromForm);

    if (isFocusedRef.current && uiDigits === nextDigits) return;
    if (isFocusedRef.current && uiDigits.length > 0 && nextDigits.startsWith(uiDigits)) return;

    const nextUi = formatLocal10ForInput(local10FromForm);
    phoneUiRef.current = nextUi;
    setPhoneUi(nextUi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local10FromForm]);

  useEffect(() => {
    if (!form.contactMethod) emit('contactMethod', 'call');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={containerVariants}
      >
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={onFormChange}
          onBlur={iosBlurFix}
          placeholder="Ваше имя"
          className={`w-full rounded-[18px] border px-4 py-4 text-[16px] sm:text-[15px] outline-none transition ${
            nameError ? 'border-red-500' : 'border-[#bdbdbd]'
          } focus:border-black`}
          autoComplete="name"
          aria-invalid={!!nameError}
        />
        {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
      </motion.div>

      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        custom={1}
        variants={containerVariants}
      >
        <div className="grid grid-cols-[92px_1fr] gap-3">
          <div className="rounded-[18px] border border-[#bdbdbd] px-3 py-4 flex items-center justify-between">
            <span className="text-[16px] sm:text-[15px] font-medium">+7</span>
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <input
            ref={phoneInputRef}
            id="phone"
            name="phone_ui"
            value={phoneUi}
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={() => {
              isFocusedRef.current = false;
              iosBlurFix();
            }}
            onChange={(e) => {
              const rawUi = e.target.value;

              const caret = e.target.selectionStart ?? rawUi.length;
              const digitIndexRaw = countDigitsBeforePos(rawUi, caret);

              const d10 = extractLocal10FromAnyInput(rawUi);
              const formatted = formatLocal10ForInput(d10);

              phoneUiRef.current = formatted;
              setPhoneUi(formatted);

              const normalized = d10.length ? `+7${d10}` : '';
              emit('phone', normalized);

              requestAnimationFrame(() => {
                const el = phoneInputRef.current;
                if (!el) return;

                const digitsCount = digitsOnly(formatted).length;
                const digitIndex = Math.max(0, Math.min(digitIndexRaw, digitsCount));

                const nextPos = posForDigitIndex(formatted, digitIndex);
                try {
                  el.setSelectionRange(nextPos, nextPos);
                } catch {
                  // noop
                }
              });
            }}
            placeholder="(___) ___-__-__"
            className={`w-full rounded-[18px] border px-4 py-4 text-[16px] sm:text-[15px] outline-none transition ${
              phoneError ? 'border-red-500' : 'border-[#bdbdbd]'
            } focus:border-black`}
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={!!phoneError}
          />
        </div>

        {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}

        <p className="text-[12px] text-[#6f6f6f]">Текст открытки можно написать далее</p>
      </motion.div>

      <motion.div
        className="space-y-2 pt-1"
        initial="hidden"
        animate="visible"
        custom={2}
        variants={containerVariants}
      >
        <p className="text-[13px] font-semibold text-black">Как с вами связаться по заказу?</p>

        <div className="grid grid-cols-2 gap-2">
          <ContactMethodButton
            active={form.contactMethod === 'call'}
            label="Позвонить"
            onClick={() => emit('contactMethod', 'call')}
          />
          <ContactMethodButton
            active={form.contactMethod === 'telegram'}
            label="Написать в Telegram"
            onClick={() => emit('contactMethod', 'telegram')}
          />
          <ContactMethodButton
            active={form.contactMethod === 'whatsapp'}
            label="Написать в WhatsApp"
            onClick={() => emit('contactMethod', 'whatsapp')}
          />
          <ContactMethodButton
            active={form.contactMethod === 'max'}
            label="Написать в MAX"
            onClick={() => emit('contactMethod', 'max')}
          />
        </div>

        <p className="text-[11px] text-[#6f6f6f] leading-snug">
          Если выберете мессенджер - мы напишем туда по номеру телефона из заказа. При выборе
          мессенджера вы переходите в сторонний сервис, который обрабатывает данные по своим
          правилам.
        </p>
      </motion.div>

      <motion.div
        className="mt-2 rounded-[22px] border border-[#bdbdbd] p-4 bg-white space-y-2"
        initial="hidden"
        animate="visible"
        custom={3}
        variants={containerVariants}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-black">Бонусы и личный кабинет</p>

            {isAuthenticated ? (
              <>
                <p className="text-[12px] text-[#6f6f6f]">
                  Вы вошли, бонусы начисляются автоматически
                </p>
                <p className="text-[12px] text-[#6f6f6f]">
                  Баланс: <span className="font-semibold text-black">{bonusBalance}</span>
                </p>
              </>
            ) : !authChecked ? (
              <p className="text-[12px] text-[#6f6f6f]">Проверяем авторизацию...</p>
            ) : (
              <p className="text-[12px] text-[#6f6f6f]">
                Вход по звонку нужен только для бонусов и истории заказов. Оформить заказ можно без
                входа.
              </p>
            )}
          </div>

          {!isAuthenticated && authChecked && canToggleAuth && (
            <button
              type="button"
              onClick={() => setShowAuthPanel(!showAuthPanel)}
              className="shrink-0 rounded-[14px] border border-[#bdbdbd] px-3 py-2 text-[10px] font-bold uppercase tracking-tight bg-white text-[#4b4b4b] active:scale-[0.99]"
            >
              {showAuthPanel ? 'Скрыть' : 'Войти для бонусов'}
            </button>
          )}
        </div>

        {!isAuthenticated && authChecked && canToggleAuth && showAuthPanel && (
          <div className="pt-2">
            <AuthWithCall
              onSuccess={(p: string) => {
                onAuthSuccess?.(p);
              }}
            />
          </div>
        )}
      </motion.div>

      {/* ✅ Обязательная галочка (оферта/соглашение/политика) */}
      <motion.div
        className={`flex items-start gap-3 mt-2 ${
          agreedToTermsError ? 'text-red-500' : 'text-[#2f2f2f]'
        }`}
        initial="hidden"
        animate="visible"
        custom={4}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          name="agreedToTerms"
          checked={form.agreedToTerms || false}
          onChange={onFormChange}
          className="mt-[2px] h-5 w-5 rounded border-[#bdbdbd] text-black focus:ring-black"
          aria-label="Согласие с документами"
          required
        />
        <span className="text-[12px] leading-snug">
          Нажимая кнопку "Продолжить", вы подтверждаете согласие с{' '}
          <TrackedLink
            href="/policy"
            className="underline text-black"
            ariaLabel="Открыть политику конфиденциальности"
            category="checkout"
            action="open_legal"
            label="policy"
          >
            политикой обработки персональных данных
          </TrackedLink>
          ,{' '}
          <TrackedLink
            href="/offer"
            className="underline text-black"
            ariaLabel="Открыть пользовательское соглашение"
            category="checkout"
            action="open_legal"
            label="offer"
          >
            пользовательским соглашением
          </TrackedLink>{' '}
          и{' '}
          <TrackedLink
            href="/offer"
            className="underline text-black"
            ariaLabel="Открыть публичную оферту купли-продажи"
            category="checkout"
            action="open_legal"
            label="public_offer"
          >
            публичной офертой
          </TrackedLink>
          .
        </span>
      </motion.div>

      {agreedToTermsError && <p className="text-red-500 text-xs">{agreedToTermsError}</p>}

      {/* ✅ Необязательная галочка (маркетинг) */}
      <motion.div
        className="flex items-start gap-3 mt-1 text-[#2f2f2f]"
        initial="hidden"
        animate="visible"
        custom={5}
        variants={containerVariants}
      >
        <input
          type="checkbox"
          name="agreedToMarketing"
          checked={form.agreedToMarketing || false}
          onChange={onFormChange}
          className="mt-[2px] h-5 w-5 rounded border-[#bdbdbd] text-black focus:ring-black"
          aria-label="Согласие на рекламную рассылку"
        />
        <span className="text-[12px] leading-snug">
          Хочу получать акции и предложения (можно отказаться в любой момент). Условия -{' '}
          <TrackedLink
            href="/offer"
            className="underline text-black"
            ariaLabel="Открыть согласие на рассылку"
            category="checkout"
            action="open_legal"
            label="marketing_offer"
          >
            здесь
          </TrackedLink>
          .
        </span>
      </motion.div>
    </div>
  );
}