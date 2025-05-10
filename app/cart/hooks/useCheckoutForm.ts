'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { phoneMask } from '@utils/phoneMask';

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

  const [smsCode, setSmsCode] = useState<string>('');
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const authData = localStorage.getItem('auth');
    const savedForm = localStorage.getItem('checkoutForm');
    if (authData) {
      try {
        const { phone: storedPhone, isAuthenticated: storedAuth } = JSON.parse(authData);
        if (storedAuth && storedPhone) {
          setIsAuthenticated(true);
          setIsCodeSent(true);
          const formattedPhone = phoneMask(storedPhone);
          setForm((prev) => ({ ...prev, phone: formattedPhone }));
          setStep(1);
          document.cookie = `auth=${JSON.stringify({ phone: storedPhone, isAuthenticated: true })}; path=/; max-age=604800; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
          console.log('Cookie set in useCheckoutForm:', document.cookie);
        }
      } catch (error) {
        console.error('Ошибка парсинга auth из localStorage:', error);
        localStorage.removeItem('auth');
        setIsAuthenticated(false);
        setIsCodeSent(false);
      }
    }
    if (savedForm) {
      try {
        const parsedForm = JSON.parse(savedForm);
        setForm((prev) => ({
          ...prev,
          ...parsedForm,
          date: '',
          time: '',
          phone: prev.phone || parsedForm.phone || '',
        }));
      } catch (error) {
        console.error('Error parsing saved form:', error);
      }
    }
  }, []);

  useEffect(() => {
    const { phone, ...formWithoutPhone } = form;
    localStorage.setItem('checkoutForm', JSON.stringify(formWithoutPhone));
  }, [form]);

  const onFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateStep1 = () => {
    let isValid = true;

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!form.phone || cleanPhone.length !== 10) {
      setPhoneError('Введите корректный номер телефона (10 цифр)');
      isValid = false;
    } else if (!cleanPhone.startsWith('9')) {
      setPhoneError('Номер телефона должен начинаться с 9 после +7');
      isValid = false;
    } else {
      setPhoneError('');
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

    // Проверяем авторизацию только по состоянию isAuthenticated
    if (!isAuthenticated) {
      toast.error('Пожалуйста, авторизуйтесь с помощью SMS-кода');
      isValid = false;
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

    const cleanRecipientPhone = form.recipientPhone.replace(/\D/g, '');
    if (!cleanRecipientPhone || form.recipientPhone === '(___) ___-__-__') {
      setRecipientPhoneError('Введите номер телефона получателя');
      isValid = false;
    } else if (cleanRecipientPhone.length !== 10) {
      setRecipientPhoneError('Введите корректный номер телефона (10 цифр)');
      isValid = false;
    } else {
      setRecipientPhoneError('');
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

    if (step === 1) {
      isValid = validateStep1();
    } else if (step === 2) {
      isValid = validateStep2();
    } else if (step === 3) {
      isValid = validateStep3();
    } else if (step === 4) {
      isValid = validateStep4();
    }

    if (isValid) {
      setStep((prev) => {
        const next = (prev + 1) as 1 | 2 | 3 | 4 | 5;
        if (next <= 5) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return next > 5 ? 5 : next;
      });
    }
  };

  const prevStep = () => {
    setStep((prev) => {
      const prevStep = (prev - 1) as 1 | 2 | 3 | 4 | 5;
      if (prevStep >= 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return prevStep < 1 ? 1 : prevStep;
    });
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
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
    setSmsCode('');
    setIsCodeSent(false);
    setIsSendingCode(false);
    setIsVerifyingCode(false);
    setIsAuthenticated(false);
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
    smsCode,
    isCodeSent,
    isSendingCode,
    isVerifyingCode,
    isAuthenticated,
    setPhoneError,
    setEmailError,
    setNameError,
    setRecipientError,
    setRecipientPhoneError,
    setAddressError,
    setDateError,
    setTimeError,
    setSmsCode,
    setIsCodeSent,
    setIsSendingCode,
    setIsVerifyingCode,
    setIsAuthenticated,
    onFormChange,
    nextStep,
    prevStep,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep5,
    validateAllSteps,
    getMinDate,
    resetForm,
  };
}