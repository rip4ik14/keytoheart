'use client';

import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import toast from 'react-hot-toast';

interface FormState {
  phone: string;
  email: string;
  name: string;

  contactMethod: 'call' | 'whatsapp' | 'telegram' | 'max';

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
  agreedToTerms: boolean;
  askAddressFromRecipient: boolean;

  slotValid: boolean;
  slotReason: string;
}

const initialFormState: FormState = {
  phone: '',
  email: '',
  name: '',

  contactMethod: 'call',

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
  agreedToTerms: false,
  askAddressFromRecipient: false,

  slotValid: false,
  slotReason: 'Выберите дату и время',
};

const STORAGE_KEY = 'checkoutForm_v2';

const digitsOnly = (v: string) => (v || '').replace(/\D/g, '');

const normalizePhoneForRuStrict = (raw: string): string | null => {
  const d = digitsOnly(raw);
  if (!d) return null;

  if (d.length > 11) {
    const last10 = d.slice(-10);
    return `+7${last10}`;
  }

  if (d.length === 11 && d.startsWith('7')) return `+7${d.slice(1)}`;
  if (d.length === 11 && d.startsWith('8')) return `+7${d.slice(1)}`;
  if (d.length === 10) return `+7${d}`;

  return null;
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

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
    if (typeof window === 'undefined') return;

    const legacy = safeParse<any>(window.localStorage.getItem('checkoutForm'));
    const v2 = safeParse<any>(window.localStorage.getItem(STORAGE_KEY));

    const parsed = v2 || legacy;
    if (!parsed) return;

    const migratedContactMethod: FormState['contactMethod'] = (() => {
      const cm = parsed?.contactMethod;
      if (cm === 'call' || cm === 'whatsapp' || cm === 'telegram' || cm === 'max') return cm;

      if (typeof parsed?.whatsapp === 'boolean') {
        return parsed.whatsapp ? 'whatsapp' : 'call';
      }

      return initialFormState.contactMethod;
    })();

    setForm((prev) => ({
      ...prev,
      ...parsed,
      contactMethod: migratedContactMethod,

      slotValid: typeof parsed.slotValid === 'boolean' ? parsed.slotValid : prev.slotValid,
      slotReason: typeof parsed.slotReason === 'string' ? parsed.slotReason : prev.slotReason,
    }));

    if (parsed.step && Number.isFinite(parsed.step)) {
      const s = Number(parsed.step);
      if (s >= 1 && s <= 5) setStep(s as 1 | 2 | 3 | 4 | 5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const t = window.setTimeout(() => {
      const payload = {
        ...form,
        step,
        updatedAt: Date.now(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.localStorage.removeItem('checkoutForm');
    }, 150);

    return () => window.clearTimeout(t);
  }, [form, step]);

  const onFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
      if (name === 'agreedToTerms' && checked) setAgreedToTermsError('');
      return;
    }

    const value = (e.target as HTMLInputElement).value;

    if (name === 'slotValid') {
      setForm((prev) => ({ ...prev, slotValid: value === 'true' }));
      return;
    }
    if (name === 'slotReason') {
      setForm((prev) => ({ ...prev, slotReason: value || '' }));
      return;
    }

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

    if (name === 'contactMethod') {
      const v = value as FormState['contactMethod'];
      if (v === 'call' || v === 'whatsapp' || v === 'telegram' || v === 'max') {
        setForm((prev) => ({ ...prev, contactMethod: v }));
      }
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

    setNameError('');

    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      setEmailError('Введите корректный email');
      ok = false;
    } else {
      setEmailError('');
    }

    if (!form.contactMethod) {
      setForm((prev) => ({ ...prev, contactMethod: 'call' }));
    }

    if (!form.agreedToTerms) {
      const msg = 'Необходимо согласиться с пользовательским соглашением и политикой конфиденциальности';
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
      if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
        setTimeError('Укажите корректное время доставки');
        ok = false;
      } else {
        setTimeError('');
      }
    }

    if (!form.slotValid) {
      const msg =
        form.slotReason || 'На выбранную дату и время заказ не успеваем выполнить, выберите другую дату.';
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

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem('checkoutForm');
    }
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
