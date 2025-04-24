// Путь: app/admin/promos/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import toast from 'react-hot-toast';

interface Promo {
  id: string;
  code: string;
  discount: number;
  type: '₽' | '%';
  expires_at: string | null;
  max_usage: number;
  used: number;
  active: boolean;
}

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: '',
    discount: 0,
    type: '%',
    expires_at: '',
    max_usage: 10,
    active: true,
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка загрузки промокодов:', error.message);
    } else if (data) {
      setPromos(data as Promo[]);
    }
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    const { error } = await supabase
      .from('promo_codes')
      .update({ active: !current })
      .eq('id', id);

    if (error) {
      toast.error('Не удалось изменить статус');
      console.error('toggleActive error:', error.message);
    } else {
      setPromos((prev) =>
        prev.map((promo) =>
          promo.id === id ? { ...promo, active: !current } : promo
        )
      );
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      ...form,
      discount: Number(form.discount),
      max_usage: Number(form.max_usage),
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
    };

    const { error } = await supabase.from('promo_codes').insert([payload]);

    if (error) {
      toast.error('Ошибка при создании промокода');
      console.error('insert promo_codes error:', error.message);
    } else {
      toast.success('Промокод добавлен');
      setForm({
        code: '',
        discount: 0,
        type: '%',
        expires_at: '',
        max_usage: 10,
        active: true,
      });
      setShowForm(false);
      fetchPromos();
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Промокоды</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-4 py-2 rounded text-sm"
        >
          + Новый промокод
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : promos.length === 0 ? (
        <p className="text-gray-500">Промокоды пока не добавлены.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Код</th>
                <th className="p-2 text-left">Скидка</th>
                <th className="p-2 text-left">Срок</th>
                <th className="p-2 text-left">Использован</th>
                <th className="p-2 text-left">Статус</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo.id} className="border-t hover:bg-gray-50">
                  <td className="p-2 font-mono">{promo.code}</td>
                  <td className="p-2">
                    {promo.discount} {promo.type}
                  </td>
                  <td className="p-2">
                    {promo.expires_at
                      ? format(
                          new Date(promo.expires_at),
                          'dd.MM.yyyy',
                          { locale: ru }
                        )
                      : '∞'}
                  </td>
                  <td className="p-2">
                    {promo.used} / {promo.max_usage}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => toggleActive(promo.id, promo.active)}
                      className={`text-xs px-2 py-1 rounded-full transition ${
                        promo.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                    >
                      {promo.active ? 'Активен' : 'Неактивен'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl"
          >
            <h2 className="text-xl font-bold mb-4">Добавить промокод</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="code"
                placeholder="Код"
                value={form.code}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <input
                name="discount"
                type="number"
                placeholder="Скидка"
                value={form.discount}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              >
                <option value="%">%</option>
                <option value="₽">₽</option>
              </select>
              <input
                name="max_usage"
                type="number"
                placeholder="Макс. количество"
                value={form.max_usage}
                onChange={handleChange}
                required
                className="border p-2 rounded w-full"
              />
              <input
                name="expires_at"
                type="date"
                value={form.expires_at}
                onChange={handleChange}
                className="border p-2 rounded w-full col-span-2"
              />
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input
                  name="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={handleChange}
                  className="mr-2"
                />
                Активен
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
