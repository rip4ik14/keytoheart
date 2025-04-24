// Путь: app/admin/promo/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import AdminLayout from '../layout';
import toast from 'react-hot-toast';

const staticHrefOptions = [
  { label: 'Клубничные букеты', value: '/category/klubnichnye-bukety' },
  { label: 'Клубничные боксы', value: '/category/klubnichnye-boksy' },
  { label: 'Цветы', value: '/category/flowers' },
  { label: 'Комбо-наборы', value: '/category/combo' },
  { label: 'Premium', value: '/category/premium' },
  { label: 'Корзинки', value: '/category/korzinki' },
  { label: 'Повод', value: '/category/povod' },
  { label: 'Подарки', value: '/category/podarki' },
  { label: 'Доставка', value: '/delivery' },
  { label: 'Корпоративным клиентам', value: '/corporate' },
  { label: 'Часто задаваемые вопросы', value: '/faq' },
  { label: 'Оплата', value: '/payment' },
  { label: 'Возврат', value: '/return' },
  { label: 'Программа лояльности', value: '/loyalty' },
  { label: 'О нас', value: '/about' },
  { label: 'Видео', value: '/video' },
  { label: 'Контакты', value: '/contacts' },
  { label: 'Новости', value: '/news' },
  { label: 'Статьи', value: '/articles' },
  { label: 'Праздники', value: '/prazdniki' },
];

interface PromoBlock {
  id: number;
  title: string;
  subtitle?: string;
  button_text?: string;
  href: string;
  image_url: string;
  type: 'card' | 'banner';
  order_index: number;
}

export default function PromoAdminPage() {
  const [blocks, setBlocks] = useState<PromoBlock[]>([]);
  const [form, setForm] = useState<Partial<PromoBlock>>({
    type: 'card',
    order_index: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchBlocks();
  }, []);

  async function fetchBlocks() {
    const { data, error } = await supabase
      .from('promo_blocks')
      .select('*')
      .order('order_index');
    if (error) {
      console.error('Ошибка загрузки промоблоков:', error.message);
    } else {
      setBlocks(data || []);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === 'order_index') {
      setForm((f) => ({ ...f, [name]: Number(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreviewImage(URL.createObjectURL(f));
  }

  function clearImage() {
    setFile(null);
    setPreviewImage(null);
    setForm((f) => ({ ...f, image_url: '' }));
  }

  function handleEdit(block: PromoBlock) {
    setForm(block);
    setEditingId(block.id);
    setPreviewImage(block.image_url);
    setFile(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить блок?')) return;
    await supabase.from('promo_blocks').delete().eq('id', id);
    fetchBlocks();
  }

  async function handleSubmit() {
    try {
      let image_url = form.image_url || '';
      // Если загружен новый файл — закинуть в Supabase Storage
      if (file) {
        const filename = `${uuidv4()}.${file.name.split('.').pop()}`;
        const { data: up, error: uploadError } = await supabase.storage
          .from('promo-images')
          .upload(filename, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('promo-images')
          .getPublicUrl(up.path);
        image_url = urlData.publicUrl;
      }

      const payload = {
        ...form,
        image_url,
      };

      if (editingId) {
        await supabase.from('promo_blocks').update(payload).eq('id', editingId);
      } else {
        await supabase.from('promo_blocks').insert(payload);
      }

      toast.success(editingId ? 'Блок обновлён' : 'Блок добавлен');
      setForm({ type: 'card', order_index: 0 });
      setFile(null);
      setPreviewImage(null);
      setEditingId(null);
      fetchBlocks();
    } catch (err: any) {
      console.error('Ошибка при сохранении блока:', err.message);
      toast.error('Не удалось сохранить блок');
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Промо‑блоки на главной</h1>

        {/* Форма создания/редактирования */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* ... ту же форму, что вы используете, но без createClient() */}
          {/* Например, поле для title: */}
          <div>
            <label className="font-medium">Название</label>
            <input
              name="title"
              value={form.title || ''}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          {/* остальные поля: subtitle, button_text, href, type, order_index, загрузка файла */}
          {/* ... */}
          <div>
            <label className="font-medium">Загрузить изображение</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="w-full border p-2 rounded"
            />
            {previewImage && (
              <div className="mt-2 relative inline-block">
                <Image
                  src={previewImage}
                  alt="preview"
                  width={120}
                  height={80}
                  className="rounded object-cover"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-0 right-0 bg-white text-red-500 px-1 rounded-full text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
        >
          {editingId ? 'Сохранить изменения' : 'Добавить блок'}
        </button>

        {/* Список блоков */}
        <div className="mt-10 space-y-4">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="border p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{block.title}</h3>
                <p className="text-sm text-gray-500">
                  Тип: {block.type}, порядок: {block.order_index}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(block)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(block.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
