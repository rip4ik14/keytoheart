// ✅ Путь: app/cart/hooks/useCheckoutForm.ts
'use client';

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import toast from 'react-hot-toast';

interface FormState {
  phone: string;
  email: string;
  name: string;
  recipient: string;
  recipientPhone: string;
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  deliveryMethod: 'pickup' | 'delivery';
  date: string;
  time: string;
  payment: 'cash' | 'online';
  deliveryInstructions: string;
  anonymous: boolean;
  whatsapp: boolean;
  agreedToTerms: boolean;
  askAddressFromRecipient: boolean;

  slotValid: boolean;
  slotReason: string;
}

const initialFormState: FormState = {
  phone: '',
  email: '',
  name: '',
  recipient: '',
  recipientPhone: '',
  street: '',
  house: '',
  apartment: '',
  entrance: '',
  deliveryMethod: 'pickup',
  date: '',
  time: '',
  payment: 'online',
  deliveryInstructions: '',
  anonymous: false,
  whatsapp: false,
  agreedToTerms: false,
  askAddressFromRecipient: false,

  slotValid: false,
  slotReason: 'Выберите дату и время',
};

const digitsOnly = (v: string) => (v || '').replace(/\D/g, '');

// Строгая нормализация на подтверждение шага
const normalizePhoneForRuStrict = (raw: string): string | null => {
  const d = digitsOnly(raw);
  if (!d) return null;

  // если вставили длиннее (например, +7, 007, 7 7..., и т.д.) - берем последние 10 и делаем +7
  if (d.length > 11) {
    const last10 = d.slice(-10);
    return `+7${last10}`;
  }

  // уже 7XXXXXXXXXX (11 цифр)
  if (d.length === 11 && d.startsWith('7')) return `+7${d.slice(1)}`;

  // 8XXXXXXXXXX (11 цифр)
  if (d.length === 11 && d.startsWith('8')) return `+7${d.slice(1)}`;

  // 10 цифр - просто дописываем +7
  if (d.length === 10) return `+7${d}`;

  return null;
};

export default function useCheckoutForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [form, setForm] = useState<FormState>(initialFormState);

  const [phoneError, setPhoneError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [recipientError, setRecipientError] = useState<string>('');
  const [recipientPhoneError, setRecipientPhoneError] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');
  const [agreedToTermsError, setAgreedToTermsError] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('checkoutForm');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setForm((prev) => ({
        ...prev,
        ...parsed,
        date: '',
        time: '',
        agreedToTerms: false,
        slotValid: false,
        slotReason: 'Выберите дату и время',
      }));
    } catch (e) {
      console.error('Invalid saved form:', e);
    }
  }, []);

  useEffect(() => {
    const { phone, recipientPhone, ...draft } = form;
    localStorage.setItem('checkoutForm', JSON.stringify(draft));
  }, [form]);

  const onFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
      if (name === 'agreedToTerms' && checked) setAgreedToTermsError('');
      return;
    }

    const value = (e.target as HTMLInputElement).value;

    // спец поля из Step4DateTime
    if (name === 'slotValid') {
      setForm((prev) => ({ ...prev, slotValid: value === 'true' }));
      return;
    }
    if (name === 'slotReason') {
      setForm((prev) => ({ ...prev, slotReason: value || '' }));
      return;
    }

    // ✅ телефоны НЕ нормализуем здесь, чтобы не было "залипания"
    if (name === 'phone') {
      setForm((prev) => ({ ...prev, phone: value }));
      if (phoneError) setPhoneError('');
      return;
    }

    if (name === 'recipientPhone') {
      setForm((prev) => ({ ...prev, recipientPhone: value }));
      if (recipientPhoneError) setRecipientPhoneError('');
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    let ok = true;

    const normalized = normalizePhoneForRuStrict(form.phone);
    if (!normalized) {
      setPhoneError('Введите номер в формате 8(9xx)… или +7(9xx)…');
      ok = false;
    } else {
      setPhoneError('');
      setForm((prev) => ({ ...prev, phone: normalized }));
    }

    if (!form.name.trim()) {
      setNameError('Введите ваше имя');
      ok = false;
    } else {
      setNameError('');
    }

    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      setEmailError('Введите корректный email');
      ok = false;
    } else {
      setEmailError('');
    }

    if (!form.agreedToTerms) {
      const msg =
        'Необходимо согласиться с пользовательским соглашением и политикой конфиденциальности';
      setAgreedToTermsError(msg);
      toast.error(msg);
      ok = false;
    } else {
      setAgreedToTermsError('');
    }

    return ok;
  };

  const validateStep2 = () => {
    let ok = true;

    if (!form.recipient.trim()) {
      setRecipientError('Введите имя получателя');
      ok = false;
    } else {
      setRecipientError('');
    }

    const normalized = normalizePhoneForRuStrict(form.recipientPhone);
    if (!normalized) {
      setRecipientPhoneError('Введите номер получателя в формате 8(9xx)… или +7(9xx)…');
      ok = false;
    } else {
      setRecipientPhoneError('');
      setForm((prev) => ({ ...prev, recipientPhone: normalized }));
    }

    return ok;
  };

  const validateStep3 = () => {
    if (form.deliveryMethod === 'pickup') {
      setAddressError('');
      return true;
    }

    if (form.askAddressFromRecipient) {
      setAddressError('');
      return true;
    }

    if (!form.street.trim()) {
      setAddressError('Введите улицу');
      return false;
    }

    setAddressError('');
    return true;
  };

  const validateStep4 = () => {
    let ok = true;

    if (!form.date) {
      setDateError('Выберите дату доставки');
      ok = false;
    } else {
      const selected = new Date(form.date);
      const today = new Date();
      selected.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (Number.isNaN(selected.getTime())) {
        setDateError('Укажите корректную дату доставки');
        ok = false;
      } else if (selected < today) {
        setDateError('Нельзя выбрать дату в прошлом');
        ok = false;
      } else {
        setDateError('');
      }
    }

    if (!form.time) {
      setTimeError('Выберите время доставки');
      ok = false;
    } else {
      const [hh, mm] = form.time.split(':').map(Number);
      if (
        Number.isNaN(hh) ||
        Number.isNaN(mm) ||
        hh < 0 ||
        hh > 23 ||
        mm < 0 ||
        mm > 59
      ) {
        setTimeError('Укажите корректное время доставки');
        ok = false;
      } else {
        setTimeError('');
      }
    }

    if (!form.slotValid) {
      const msg =
        form.slotReason ||
        'На выбранную дату и время заказ не успеваем выполнить, выберите другую дату.';
      setDateError(msg);
      setTimeError(msg);
      toast.error(msg);
      ok = false;
    }

    return ok;
  };

  const validateStep5 = (_agreed: boolean) => true;

  const nextStep = () => {
    let ok = true;

    if (step === 1) ok = validateStep1();
    else if (step === 2) ok = validateStep2();
    else if (step === 3) ok = validateStep3();
    else if (step === 4) ok = validateStep4();

    if (!ok) return;

    setStep((prev) => {
      const next = (prev + 1) as 1 | 2 | 3 | 4 | 5;
      const safe = next > 5 ? 5 : next;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return safe;
    });
  };

  const prevStep = () => {
    setStep((prev) => {
      const p = (prev - 1) as 1 | 2 | 3 | 4 | 5;
      const safe = p < 1 ? 1 : p;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return safe;
    });
  };

  const resetForm = () => {
    setForm(initialFormState);
    setPhoneError('');
    setEmailError('');
    setNameError('');
    setRecipientError('');
    setRecipientPhoneError('');
    setAddressError('');
    setDateError('');
    setTimeError('');
    setAgreedToTermsError('');
    setStep(1);
    localStorage.removeItem('checkoutForm');
  };

  return {
    step,
    setStep,
    form,
    phoneError,
    emailError,
    nameError,
    recipientError,
    recipientPhoneError,
    addressError,
    dateError,
    timeError,
    agreedToTermsError,
    setPhoneError,
    setEmailError,
    setNameError,
    setRecipientError,
    setRecipientPhoneError,
    setAddressError,
    setDateError,
    setTimeError,
    setAgreedToTermsError,
    onFormChange,
    nextStep,
    prevStep,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
    resetForm,
  };
}
