// ✅ Путь: app/admin/(protected)/promo-codes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import CSRFToken from '@components/CSRFToken';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

interface PromoCode {
  id: string; // ✅ UUID
  code: string;
  discount_value: number;
  discount_type: 'percentage' | 'fixed';
  expires_at: string | null; // ISO строка или null
  is_active: boolean;
}

export default function PromoCodesAdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [form, setForm] = useState<{
    code: string;
    discount_value: number;
    discount_type: 'percentage' | 'fixed';
    expires_at: string | null; // YYYY-MM-DD из input type="date"
    is_active: boolean;
  }>({
    code: '',
    discount_value: 0,
    discount_type: 'percentage',
    expires_at: null,
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin-session', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Доступ запрещён');
        }
        setIsAuthenticated(true);
      } catch {
        toast.error('Доступ запрещён');
        router.push(`/admin/login?from=${encodeURIComponent('/admin/promo-codes')}`);
      }
    };
    checkAuth();
  }, [router]);

  // Загрузка промокодов
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPromoCodes();
  }, [isAuthenticated]);

  async function fetchPromoCodes() {
    try {
      const res = await fetch('/api/promo-codes', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки промокодов');
      setPromoCodes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error('Ошибка загрузки промокодов: ' + err.message);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;

    setForm((f) => {
      if (name === 'discount_value') {
        return { ...f, discount_value: Number(value) };
      }

      if (name === 'discount_type') {
        return { ...f, discount_type: value as 'percentage' | 'fixed' };
      }

      if (name === 'is_active') {
        return { ...f, is_active: value === 'true' };
      }

      if (name === 'expires_at') {
        return { ...f, expires_at: value ? value : null }; // YYYY-MM-DD или null
      }

      return { ...f, [name]: value };
    });
  }

  function resetForm() {
    setForm({ code: '', discount_value: 0, discount_type: 'percentage', expires_at: null, is_active: true });
    setEditingId(null);
  }

  function handleEdit(promoCode: PromoCode) {
    setForm({
      code: promoCode.code,
      discount_value: promoCode.discount_value,
      discount_type: promoCode.discount_type,
      expires_at: promoCode.expires_at ? promoCode.expires_at.split('T')[0] : null,
      is_active: promoCode.is_active,
    });
    setEditingId(promoCode.id);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => toast.success('Код скопирован'));
  }

  async function handleSubmit(csrfToken: string) {
    try {
      const rawCode = form.code?.trim();
      if (!rawCode) throw new Error('Код обязателен');

      if (!form.discount_value || form.discount_value <= 0) {
        throw new Error('Скидка должна быть больше 0');
      }

      // sanitize + upper
      const sanitizedCode = DOMPurify.sanitize(rawCode).toUpperCase();
      if (!/^[A-Z0-9_-]+$/.test(sanitizedCode)) {
        throw new Error('Код должен содержать только буквы, цифры, дефис или подчёркивание');
      }

      // дата: из YYYY-MM-DD делаем ISO (или null)
      let expiresAt: string | null = null;
      if (form.expires_at) {
        const d = new Date(form.expires_at);
        if (Number.isNaN(d.getTime())) throw new Error('Некорректная дата истечения');
        if (d.getTime() < Date.now()) throw new Error('Дата истечения должна быть в будущем');
        expiresAt = d.toISOString();
      }

      // быстрая проверка уникальности на клиенте (для UX)
      if (promoCodes.some((p) => p.code === sanitizedCode && (!editingId || p.id !== editingId))) {
        throw new Error('Код уже существует');
      }

      const payload = {
        code: sanitizedCode,
        discount_value: Number(form.discount_value),
        discount_type: form.discount_type,
        expires_at: expiresAt,
        is_active: form.is_active,
        ...(editingId ? { id: editingId } : {}),
      };

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch('/api/promo-codes', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (editingId ? 'Ошибка обновления промокода' : 'Ошибка добавления промокода'));

      toast.success(editingId ? 'Промокод обновлён' : 'Промокод добавлен');
      resetForm();
      fetchPromoCodes();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id: string, csrfToken: string) {
    if (!confirm('Удалить промокод?')) return;

    try {
      const res = await fetch('/api/promo-codes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления промокода');

      toast.success('Промокод удалён');
      fetchPromoCodes();
    } catch (err: any) {
      toast.error('Ошибка при удалении промокода: ' + err.message);
    }
  }

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Проверка авторизации...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <CSRFToken>
      {(csrfToken) => (
        <motion.div
          className="max-w-4xl mx-auto py-10 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold mb-6">Промокоды</h1>

          <div className="space-y-8 mb-6">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h2 className="col-span-full text-xl font-semibold">
                {editingId ? 'Редактирование промокода' : 'Новый промокод'}
              </h2>

              <div>
                <label htmlFor="code" className="font-medium">Код</label>
                <motion.input
                  id="code"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите код (например, SAVE10)"
                  whileFocus={{ scale: 1.02 }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Уникальный код (буквы, цифры, дефис, подчёркивание).
                </p>
              </div>

              <div>
                <label htmlFor="discount_value" className="font-medium">Значение скидки</label>
                <motion.input
                  id="discount_value"
                  name="discount_value"
                  type="number"
                  value={form.discount_value}
                  onChange={handleChange}
                  className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите значение"
                  min="0"
                  step="1"
                  whileFocus={{ scale: 1.02 }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Размер скидки (в % или ₽, в зависимости от типа).
                </p>
              </div>

              <div>
                <label htmlFor="discount_type" className="font-medium">Тип скидки</label>
                <motion.select
                  id="discount_type"
                  name="discount_type"
                  value={form.discount_type}
                  onChange={handleChange}
                  className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  whileFocus={{ scale: 1.02 }}
                >
                  <option value="percentage">Процент</option>
                  <option value="fixed">Фиксированная сумма</option>
                </motion.select>
                <p className="text-sm text-gray-500 mt-1">
                  Процент от суммы или фиксированная сумма.
                </p>
              </div>

              <div>
                <label htmlFor="expires_at" className="font-medium">Дата истечения</label>
                <motion.input
                  id="expires_at"
                  name="expires_at"
                  type="date"
                  value={form.expires_at || ''}
                  onChange={handleChange}
                  className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  whileFocus={{ scale: 1.02 }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Опционально.
                </p>
              </div>

              <div>
                <label htmlFor="is_active" className="font-medium">Статус</label>
                <motion.select
                  id="is_active"
                  name="is_active"
                  value={form.is_active ? 'true' : 'false'}
                  onChange={handleChange}
                  className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  whileFocus={{ scale: 1.02 }}
                >
                  <option value="true">Активен</option>
                  <option value="false">Неактивен</option>
                </motion.select>
              </div>
            </section>
          </div>

          <div className="flex gap-4 mb-6">
            <motion.button
              onClick={() => handleSubmit(csrfToken)}
              className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {editingId ? 'Сохранить изменения' : 'Добавить промокод'}
            </motion.button>

            <motion.button
              onClick={resetForm}
              className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Сбросить
            </motion.button>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4">Список промокодов</h2>

            {promoCodes.length === 0 ? (
              <p className="text-gray-500">Промокоды отсутствуют</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Код</th>
                      <th className="p-2">Скидка</th>
                      <th className="p-2">Тип</th>
                      <th className="p-2">Истекает</th>
                      <th className="p-2">Статус</th>
                      <th className="p-2">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((promo) => (
                      <motion.tr
                        key={promo.id}
                        className="border-t hover:bg-gray-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                      >
                        <td className="p-2">{promo.code}</td>
                        <td className="p-2">
                          {promo.discount_type === 'percentage'
                            ? `${promo.discount_value}%`
                            : `${promo.discount_value} ₽`}
                        </td>
                        <td className="p-2">
                          {promo.discount_type === 'percentage' ? 'Процент' : 'Фиксированная'}
                        </td>
                        <td className="p-2">
                          {promo.expires_at
                            ? format(new Date(promo.expires_at), 'dd.MM.yyyy', { locale: ru })
                            : '-'}
                        </td>
                        <td className="p-2">
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${
                              promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {promo.is_active ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td className="p-2 flex gap-2">
                          <motion.button
                            onClick={() => copyCode(promo.code)}
                            className="text-gray-600 hover:text-black text-sm"
                            whileHover={{ scale: 1.05 }}
                          >
                            Копировать
                          </motion.button>

                          <motion.button
                            onClick={() => handleEdit(promo)}
                            className="text-blue-600 hover:underline text-sm"
                            whileHover={{ scale: 1.05 }}
                          >
                            Редактировать
                          </motion.button>

                          <motion.button
                            onClick={() => handleDelete(promo.id, csrfToken)}
                            className="text-red-600 hover:underline text-sm"
                            whileHover={{ scale: 1.05 }}
                          >
                            Удалить
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </motion.div>
      )}
    </CSRFToken>
  );
}
