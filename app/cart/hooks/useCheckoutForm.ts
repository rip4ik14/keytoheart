'use client';

import { useState, useEffect } from 'react';
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
};

// Нормализация для проверки
const normalizePhoneForRu = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 10 && digits.startsWith('9')) {
    return `+7${digits}`;
  }

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

  // Загружаем черновик
  useEffect(() => {
    const saved = localStorage.getItem('checkoutForm');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setForm(prev => ({
        ...prev,
        ...parsed,
        date: '',
        time: '',
        agreedToTerms: false,
      }));
    } catch (e) {
      console.error('Invalid saved form:', e);
    }
  }, []);

  // Сохраняем черновик
  useEffect(() => {
    const { phone, ...draft } = form;
    localStorage.setItem('checkoutForm', JSON.stringify(draft));
  }, [form]);

  const onFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
      if (name === 'agreedToTerms' && checked) {
        setAgreedToTermsError('');
      }
      return;
    }

    setForm(prev => ({ ...prev, [name]: e.target.value }));
  };

  // STEP 1
  const validateStep1 = () => {
    let ok = true;

    const normalized = normalizePhoneForRu(form.phone);
    if (!normalized) {
      setPhoneError('Введите номер в формате 8(9xx)… или +7(9xx)…');
      ok = false;
    } else {
      setPhoneError('');
      setForm(prev => ({ ...prev, phone: normalized }));
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

  // STEP 2
  const validateStep2 = () => {
    let ok = true;

    if (!form.recipient.trim()) {
      setRecipientError('Введите имя получателя');
      ok = false;
    } else {
      setRecipientError('');
    }

    const normalized = normalizePhoneForRu(form.recipientPhone);
    if (!normalized) {
      setRecipientPhoneError(
        'Введите номер получателя в формате 8(9xx)… или +7(9xx)…',
      );
      ok = false;
    } else {
      setRecipientPhoneError('');
      setForm(prev => ({ ...prev, recipientPhone: normalized }));
    }

    return ok;
  };

  // STEP 3
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

  // STEP 4 — обновлённая строгая версия
  const validateStep4 = () => {
    let ok = true;

    // Дата
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

    // Время
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

    return ok;
  };

  // STEP 5
  const validateStep5 = (agreed: boolean) => {
    if (!agreed) {
      toast.error('Пожалуйста, согласитесь с условиями');
      return false;
    }
    return true;
  };

  // MOVE NEXT
  const nextStep = () => {
    let ok = true;

    if (step === 1) ok = validateStep1();
    else if (step === 2) ok = validateStep2();
    else if (step === 3) ok = validateStep3();
    else if (step === 4) ok = validateStep4();

    if (!ok) return;

    setStep(prev => {
      const next = (prev + 1) as 1 | 2 | 3 | 4 | 5;
      const safe = next > 5 ? 5 : next;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return safe;
    });
  };

  // MOVE BACK
  const prevStep = () => {
    setStep(prev => {
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
