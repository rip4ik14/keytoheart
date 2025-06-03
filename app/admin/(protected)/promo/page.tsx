'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '../layout';  
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import CSRFToken from '@components/CSRFToken';
import DOMPurify from 'dompurify';

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

interface HrefOption {
  label: string;
  value: string;
}

export default function PromoAdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [blocks, setBlocks] = useState<PromoBlock[]>([]);
  const [hrefOptions, setHrefOptions] = useState<HrefOption[]>([]);
  const [form, setForm] = useState<Partial<PromoBlock>>({
    type: 'card',
    order_index: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

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
      } catch (err: any) {
        toast.error('Доступ запрещён');
        router.push(`/admin/login?from=${encodeURIComponent('/admin/promo')}`);
      }
    };
    checkAuth();
  }, [router]);

  // Загрузка промо-блоков и списка страниц
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBlocks();
    fetchHrefOptions();
  }, [isAuthenticated]);

  async function fetchBlocks() {
    try {
      const res = await fetch('/api/promo');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки промо-блоков');
      setBlocks(data || []);
    } catch (err: any) {
      toast.error('Ошибка загрузки промо-блоков: ' + err.message);
    }
  }

  async function fetchHrefOptions() {
    try {
      const res = await fetch('/api/site-pages');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки списка страниц');
      const options = data.map((page: { label: string; href: string }) => ({
        label: page.label,
        value: page.href,
      }));
      setHrefOptions(options);
    } catch (err: any) {
      toast.error('Ошибка загрузки списка страниц: ' + err.message);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === 'order_index' ? Number(value) : value,
    }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    if (f) {
      // Проверка размера (макс. 5MB) и формата
      if (f.size > 5 * 1024 * 1024) {
        toast.error('Изображение слишком большое (макс. 5MB)');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        toast.error('Поддерживаются только JPEG, PNG, WebP');
        return;
      }
      setFile(f);
      setPreviewImage(URL.createObjectURL(f));
    }
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
    try {
      const block = blocks.find((b) => b.id === id);
      if (!block) throw new Error('Блок не найден');

      const res = await fetch('/api/promo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, image_url: block.image_url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления блока');

      toast.success('Блок удалён');
      fetchBlocks();
    } catch (err: any) {
      toast.error('Ошибка при удалении блока: ' + err.message);
    }
  }

  async function handleSubmit(csrfToken: string) {
    try {
      if (!form.title?.trim()) throw new Error('Название обязательно');
      if (!form.href) throw new Error('Ссылка (href) обязательна');
      if (!form.image_url && !file) throw new Error('Изображение обязательно');

      // Санитизация ввода
      const sanitizedTitle = DOMPurify.sanitize(form.title?.trim() || '');
      const sanitizedSubtitle = DOMPurify.sanitize(form.subtitle?.trim() || '');
      const sanitizedButtonText = DOMPurify.sanitize(form.button_text?.trim() || '');

      let image_url = form.image_url || '';
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (editingId && form.image_url) {
          formData.append('oldImageUrl', form.image_url);
        }

        const uploadRes = await fetch('/api/promo/upload-image', {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrfToken },
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Ошибка загрузки изображения');
        image_url = uploadData.image_url;
      }

      const payload: { id?: number; title: string; subtitle: string; button_text: string; href: string; image_url: string; type: "card" | "banner"; order_index: number } = {
        title: sanitizedTitle,
        subtitle: sanitizedSubtitle,
        button_text: sanitizedButtonText,
        href: form.href,
        image_url,
        type: form.type || 'card',
        order_index: form.order_index || 0,
      };

      if (editingId) {
        payload.id = editingId;
        const res = await fetch('/api/promo', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка обновления блока');
        toast.success('Блок обновлён');
      } else {
        const res = await fetch('/api/promo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ошибка добавления блока');
        toast.success('Блок добавлен');
      }

      setForm({ type: 'card', order_index: 0 });
      setFile(null);
      setPreviewImage(null);
      setEditingId(null);
      fetchBlocks();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const resetForm = () => {
    setForm({ type: 'card', order_index: 0 });
    setFile(null);
    setPreviewImage(null);
    setEditingId(null);
  };

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Проверка авторизации...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <CSRFToken>
        {(csrfToken) => (
          <motion.div
            className="max-w-4xl mx-auto py-10 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl font-bold mb-6">Промо-блоки на главной</h1>

            {/* Форма создания/редактирования */}
            <div className="space-y-8 mb-6">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2 className="col-span-full text-xl font-semibold">Основная информация</h2>
                <div>
                  <label htmlFor="title" className="font-medium">
                    Название
                  </label>
                  <motion.input
                    id="title"
                    name="title"
                    value={form.title || ''}
                    onChange={handleChange}
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите название"
                    required
                    aria-describedby="title-desc"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <p id="title-desc" className="text-sm text-gray-500 mt-1">
                    Название промо-блока, отображаемое на сайте.
                  </p>
                </div>
                <div>
                  <label htmlFor="subtitle" className="font-medium">
                    Подзаголовок
                  </label>
                  <motion.input
                    id="subtitle"
                    name="subtitle"
                    value={form.subtitle || ''}
                    onChange={handleChange}
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите подзаголовок (опционально)"
                    aria-describedby="subtitle-desc"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <p id="subtitle-desc" className="text-sm text-gray-500 mt-1">
                    Дополнительный текст для промо-блока.
                  </p>
                </div>
                <div>
                  <label htmlFor="button_text" className="font-medium">
                    Текст кнопки
                  </label>
                  <motion.input
                    id="button_text"
                    name="button_text"
                    value={form.button_text || ''}
                    onChange={handleChange}
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Текст кнопки (опционально)"
                    aria-describedby="button_text-desc"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <p id="button_text-desc" className="text-sm text-gray-500 mt-1">
                    Текст кнопки в промо-блоке.
                  </p>
                </div>
                <div>
                  <label htmlFor="href" className="font-medium">
                    Ссылка (href)
                  </label>
                  <motion.select
                    id="href"
                    name="href"
                    value={form.href || ''}
                    onChange={handleChange}
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-describedby="href-desc"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <option value="">Выберите ссылку</option>
                    {hrefOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </motion.select>
                  <p id="href-desc" className="text-sm text-gray-500 mt-1">
                    Ссылка, на которую ведёт промо-блок.
                  </p>
                </div>
                <div>
                  <label htmlFor="type" className="font-medium">
                    Тип блока
                  </label>
                  <motion.select
                    id="type"
                    name="type"
                    value={form.type || 'card'}
                    onChange={handleChange}
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-describedby="type-desc"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <option value="card">Карточка</option>
                    <option value="banner">Баннер</option>
                  </motion.select>
                  <p id="type-desc" className="text-sm text-gray-500 mt-1">
                    Формат промо-блока (карточка или баннер).
                  </p>
                </div>
                <div>
                  <label htmlFor="order_index" className="font-medium">
                    Порядок (order_index)
                  </label>
                  <motion.input
                    id="order_index"
                    type="number"
                    name="order_index"
                    value={form.order_index || 0}
                    onChange={handleChange}
                    className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    aria-describedby="order_index-desc"
                    whileFocus={{ scale: 1.02 }}
                  />
                  <p id="order_index-desc" className="text-sm text-gray-500 mt-1">
                    Порядок отображения блока на странице.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Изображение</h2>
                <div>
                  <label htmlFor="image" className="font-medium">
                    Изображение
                  </label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="w-full border p-2 rounded"
                    aria-describedby="image-desc"
                  />
                  <p id="image-desc" className="text-sm text-gray-500 mt-1">
                    Выберите изображение (JPEG, PNG, WebP, макс. 5MB).
                  </p>
                  {previewImage && (
                    <div className="mt-2 relative inline-block">
                      <Image
                        src={previewImage}
                        alt="Предпросмотр промо-блока"
                        width={120}
                        height={80}
                        className="rounded object-cover"
                        loading="lazy"
                      />
                      <motion.button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-0 right-0 bg-white text-red-500 px-1 rounded-full text-xs"
                        whileHover={{ scale: 1.1 }}
                        aria-label="Удалить изображение"
                      >
                        ✕
                      </motion.button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Предварительный просмотр */}
            {form.title && previewImage && (
              <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Предпросмотр</h2>
                <motion.div
                  className={`border rounded p-4 ${form.type === 'card' ? 'max-w-sm' : 'w-full'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={previewImage}
                    alt={form.title}
                    width={form.type === 'card' ? 200 : 600}
                    height={form.type === 'card' ? 150 : 200}
                    className="rounded object-cover mb-2"
                    loading="lazy"
                  />
                  <h3 className="text-lg font-semibold">{form.title}</h3>
                  {form.subtitle && <p className="text-sm text-gray-500">{form.subtitle}</p>}
                  {form.button_text && (
                    <button className="mt-2 px-4 py-2 bg-black text-white rounded">
                      {form.button_text}
                    </button>
                  )}
                </motion.div>
              </section>
            )}

            {/* Кнопки */}
            <div className="flex gap-4">
              <motion.button
                onClick={() => handleSubmit(csrfToken)}
                className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={editingId ? 'Сохранить изменения промо-блока' : 'Добавить новый промо-блок'}
              >
                {editingId ? 'Сохранить изменения' : 'Добавить блок'}
              </motion.button>
              <motion.button
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Сбросить форму"
              >
                Сбросить
              </motion.button>
            </div>

            {/* Список блоков */}
            <section className="mt-10">
              <h2 className="text-xl font-semibold mb-4">Список промо-блоков</h2>
              {blocks.length === 0 ? (
                <p className="text-gray-500">Промо-блоки отсутствуют</p>
              ) : (
                <ul className="space-y-4">
                  {blocks.map((block) => (
                    <motion.li
                      key={block.id}
                      className="border p-4 rounded shadow flex justify-between items-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-4">
                        {block.image_url && (
                          <Image
                            src={block.image_url}
                            alt={block.title}
                            width={80}
                            height={60}
                            className="rounded object-cover"
                            loading="lazy"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{block.title}</h3>
                          <p className="text-sm text-gray-500">
                            Тип: {block.type === 'card' ? 'Карточка' : 'Баннер'}, порядок: {block.order_index}
                          </p>
                          <p className="text-sm text-gray-500">Ссылка: {block.href}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => handleEdit(block)}
                          className="text-blue-600 hover:underline text-sm"
                          whileHover={{ scale: 1.05 }}
                          aria-label={`Редактировать промо-блок ${block.title}`}
                        >
                          Редактировать
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(block.id)}
                          className="text-red-600 hover:underline text-sm"
                          whileHover={{ scale: 1.05 }}
                          aria-label={`Удалить промо-блок ${block.title}`}
                        >
                          Удалить
                        </motion.button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </section>
          </motion.div>
        )}
      </CSRFToken>
    </AdminLayout>
  );
}