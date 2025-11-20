// ✅ Путь: app/cart/hooks/useCheckoutForm.ts
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
};

// Нормализация только для валидации / отправки
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

  // Подгружаем черновик (без телефона)
  useEffect(() => {
    const savedForm = localStorage.getItem('checkoutForm');
    if (savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        setForm(prev => ({
          ...prev,
          ...parsedForm,
          date: '',
          time: '',
          agreedToTerms: false,
        }));
      } catch (error) {
        process.env.NODE_ENV !== 'production' &&
          console.error('Error parsing saved form:', error);
      }
    }
  }, []);

  // Сохраняем черновик (кроме телефона)
  useEffect(() => {
    const { phone, ...formWithoutPhone } = form;
    localStorage.setItem('checkoutForm', JSON.stringify(formWithoutPhone));
  }, [form]);

  const onFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
      if (name === 'agreedToTerms' && checked) {
        setAgreedToTermsError('');
      }
    } else {
      // Никакой нормализации телефона здесь — только сырая строка
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateStep1 = () => {
    let isValid = true;

    const normalized = normalizePhoneForRu(form.phone);
    if (!normalized) {
      setPhoneError('Введите номер в формате 8(9xx)… или +7(9xx)…');
      isValid = false;
    } else {
      setPhoneError('');
      setForm(prev => ({ ...prev, phone: normalized }));
    }

    if (!form.name.trim()) {
      setNameError('Введите ваше имя');
      isValid = false;
    } else {
      setNameError('');
    }

    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      setEmailError('Введите корректный email');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!form.agreedToTerms) {
      setAgreedToTermsError(
        'Необходимо согласиться с пользовательским соглашением и политикой конфиденциальности',
      );
      toast.error(
        'Необходимо согласиться с пользовательским соглашением и политикой конфиденциальности',
      );
      isValid = false;
    } else {
      setAgreedToTermsError('');
    }

    return isValid;
  };

  const validateStep2 = () => {
    let isValid = true;

    if (!form.recipient.trim()) {
      setRecipientError('Введите имя получателя');
      isValid = false;
    } else {
      setRecipientError('');
    }

    const normalized = normalizePhoneForRu(form.recipientPhone);
    if (!normalized) {
      setRecipientPhoneError(
        'Введите номер получателя в формате 8(9xx)… или +7(9xx)…',
      );
      isValid = false;
    } else {
      setRecipientPhoneError('');
      setForm(prev => ({ ...prev, recipientPhone: normalized }));
    }

    return isValid;
  };

  const validateStep3 = () => {
    if (form.deliveryMethod === 'pickup') {
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
    let isValid = true;

    if (!form.date) {
      setDateError('Выберите дату доставки');
      isValid = false;
    } else {
      setDateError('');
    }

    if (!form.time) {
      setTimeError('Выберите время доставки');
      isValid = false;
    } else {
      setTimeError('');
    }

    return isValid;
  };

  const validateStep5 = (agreed: boolean) => {
    if (!agreed) {
      toast.error('Пожалуйста, согласитесь с условиями');
      return false;
    }
    return true;
  };

  const validateAllSteps = () => {
    let isValid = true;

    if (!validateStep1()) {
      setStep(1);
      isValid = false;
    }
    if (!validateStep2()) {
      setStep(2);
      isValid = false;
    }
    if (!validateStep3()) {
      setStep(3);
      isValid = false;
    }
    if (!validateStep4()) {
      setStep(4);
      isValid = false;
    }

    return isValid;
  };

  const nextStep = () => {
    let isValid = true;

    if (step === 1) isValid = validateStep1();
    else if (step === 2) isValid = validateStep2();
    else if (step === 3) isValid = validateStep3();
    else if (step === 4) isValid = validateStep4();

    if (isValid) {
      setStep(prev => {
        const next = (prev + 1) as 1 | 2 | 3 | 4 | 5;
        const safeNext = next > 5 ? 5 : next;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return safeNext;
      });
    }
  };

  const prevStep = () => {
    setStep(prev => {
      const prevStep = (prev - 1) as 1 | 2 | 3 | 4 | 5;
      const safePrev = prevStep < 1 ? 1 : prevStep;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return safePrev;
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
    validateAllSteps,
    resetForm,
  };
}
