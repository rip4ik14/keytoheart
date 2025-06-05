'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import toast from 'react-hot-toast';

interface FormData {
  name: string;
  company: string;
  phone: string;
  email: string;
  message: string;
}

interface Settings {
  title: string;
  description: string;
}

interface SupabaseSetting {
  key: string;
  value: string;
}

export default function CorporateForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    phone: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    title: 'Оставьте заявку',
    description: 'Мы свяжемся с вами в течение 15 минут для обсуждения деталей.',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setSettingsLoading(true);
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['corporate_form_title', 'corporate_form_description']);

        if (error) throw error;

        if (!data || data.length === 0) return;

        const newSettings = data.reduce(
          (acc: Settings, item: SupabaseSetting) => {
            acc[item.key === 'corporate_form_title' ? 'title' : 'description'] = item.value;
            return acc;
          },
          { title: 'Оставьте заявку', description: settings.description }
        );
        setSettings(newSettings);
      } catch {
        setError('Ошибка загрузки настроек формы');
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Функция для форматирования номера телефона (для отображения пользователю)
  const displayPhone = (phone: string) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11 && cleanPhone.startsWith('7')) {
      const digits = cleanPhone.slice(1); // Убираем 7
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
    }
    return phone;
  };

  // Обработчик изменения номера телефона
  const handlePhoneChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    let formattedValue = cleanValue;
    if (cleanValue.length === 10) {
      formattedValue = '+7' + cleanValue;
    } else if (cleanValue.length === 11 && cleanValue.startsWith('7')) {
      formattedValue = '+7' + cleanValue.slice(1);
    }
    setFormData((prev) => ({ ...prev, phone: formattedValue }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      handlePhoneChange(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.name || !formData.phone || !formData.email) {
      setError('Пожалуйста, заполните все обязательные поля.');
      setLoading(false);
      return;
    }

    // Дополнительная валидация номера телефона
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('7')) {
      setError('Введите корректный номер телефона в формате +7xxxxxxxxxx');
      setLoading(false);
      return;
    }

    try {
      
      const response = await fetch('/api/corporate-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Ошибка отправки заявки');
      }

      // Устанавливаем submitted только после успешного ответа
      setSubmitted(true);
      setFormData({ name: '', company: '', phone: '', email: '', message: '' });
      toast.success('Заявка отправлена');
      window.gtag?.('event', 'corporate_form_submit', { event_category: 'corporate' });
      window.ym?.(96644553, 'reachGoal', 'corporate_form_submit');
    } catch (err: any) {
      process.env.NODE_ENV !== "production" && console.error('Error submitting form:', err);
      setError(err.message || 'Произошла ошибка при отправке заявки');
      toast.error(err.message || 'Ошибка отправки заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="form"
      className="py-16 px-4 md:px-8 bg-white text-black max-w-4xl mx-auto"
      aria-labelledby="corporate-form-title"
    >
      {settingsLoading ? (
        <motion.p
          className="text-center text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Загрузка настроек...
        </motion.p>
      ) : (
        <>
          <motion.h2
            id="corporate-form-title"
            className="text-3xl md:text-4xl font-bold mb-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {settings.title}
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600 text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {settings.description}
          </motion.p>
        </>
      )}

      {submitted ? (
        <motion.div
          className="text-center text-black text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          role="alert"
        >
          Спасибо! Мы скоро свяжемся с вами.
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Форма заявки на корпоративные подарки">
          {error && (
            <motion.div
              className="text-center text-black text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              role="alert"
            >
              {error}
            </motion.div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ваше имя *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Ваше имя"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                aria-required="true"
                aria-invalid={error && !formData.name ? 'true' : 'false'}
                aria-describedby={error && !formData.name ? 'name-error' : undefined}
              />
              {error && !formData.name && (
                <p id="name-error" className="text-black text-sm mt-1">
                  Это поле обязательно
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Компания
              </label>
              <input
                type="text"
                id="company"
                name="company"
                placeholder="Название компании"
                value={formData.company}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Телефон *
              </label>
              <div className="flex gap-2 items-center">
                <span className="pt-2 text-gray-600">+7</span>
                <div className="relative flex-1">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="(xxx) xxx-xx-xx"
                    value={formData.phone ? displayPhone(formData.phone) : ''}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    required
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                    aria-required="true"
                    aria-invalid={error && !formData.phone ? 'true' : 'false'}
                    aria-describedby={error && !formData.phone ? 'phone-error' : undefined}
                  />
                </div>
              </div>
              {error && !formData.phone && (
                <p id="phone-error" className="text-black text-sm mt-1">
                  Это поле обязательно
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                E-mail *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="example@domain.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                aria-required="true"
                aria-invalid={error && !formData.email ? 'true' : 'false'}
                aria-describedby={error && !formData.email ? 'email-error' : undefined}
              />
              {error && !formData.email && (
                <p id="email-error" className="text-black text-sm mt-1">
                  Это поле обязательно
                </p>
              )}
            </div>
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Комментарий или пожелания
            </label>
            <textarea
              id="message"
              name="message"
              placeholder="Ваши пожелания к заказу"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition-colors"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full border border-[#bdbdbd] rounded-[10px] px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-tight text-center 
              bg-white text-[#535353] transition-all duration-200 shadow-sm
              hover:bg-[#535353] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd] ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            aria-label="Отправить заявку"
          >
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </motion.button>
        </form>
      )}
    </section>
  );
}