// Путь: app/admin/add-product/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import Image from 'next/image';

// Список категорий (можно расширить)
const CATEGORY_OPTIONS = [
  'Клубничные букеты',
  'Клубничные боксы',
  'Цветы',
  'Комбо-наборы',
  'Premium',
  'Коллекции',
  'Повод',
  'Подарки',
];

export default function AddProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка изображений
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);

    for (const file of Array.from(e.target.files)) {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('product-image')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Ошибка при загрузке:', uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('product-image')
        .getPublicUrl(fileName);

      if (urlData.publicUrl) {
        setImages((prev) => [...prev, urlData.publicUrl]);
      }
    }

    setLoading(false);
  };

  // Удалить фото из превью
  const handleRemoveImage = (url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  };

  // Сохранение товара
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !price || !category) {
      alert('Пожалуйста, заполните все обязательные поля (Название, Цена, Категория).');
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase
      .from('products')
      .insert({
        title,
        price: Number(price),
        category,
        short_desc: shortDesc,
        description,
        composition,
        images,
        in_stock: true,
      });

    setLoading(false);

    if (insertError) {
      alert('Ошибка при добавлении товара: ' + insertError.message);
      console.error(insertError);
    } else {
      alert('✅ Товар успешно добавлен!');
      router.push('/admin/products');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Добавить товар</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Название */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Название товара <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            className="w-full border rounded px-3 py-2"
            placeholder="Например: Букет #12"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Цена */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Цена (₽) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            type="number"
            className="w-full border rounded px-3 py-2"
            placeholder="Например: 3990"
            value={price}
            onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
        </div>

        {/* Категория */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Выберите категорию <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            className="w-full border rounded px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">— выбрать —</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Краткое описание */}
        <div>
          <label htmlFor="shortDesc" className="block text-sm font-medium text-gray-700 mb-1">
            Краткое описание (под кнопкой)
          </label>
          <textarea
            id="shortDesc"
            className="w-full border rounded px-3 py-2"
            placeholder="Коротко о товаре, например: «Самый популярный букет сезона»"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            rows={2}
          />
        </div>

        {/* Описание */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание (подробно о товаре)
          </label>
          <textarea
            id="description"
            className="w-full border rounded px-3 py-2"
            placeholder="Например: «В составе букет из клубники и нежных роз... Упакован в красивую коробку»"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Состав */}
        <div>
          <label htmlFor="composition" className="block text-sm font-medium text-gray-700 mb-1">
            Состав (ингредиенты)
          </label>
          <textarea
            id="composition"
            className="w-full border rounded px-3 py-2"
            placeholder="Например: «Шоколад бельгийский, клубника, розы...»"
            value={composition}
            onChange={(e) => setComposition(e.target.value)}
            rows={2}
          />
        </div>

        {/* Изображения */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Изображения
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="block mb-2"
          />
          <p className="text-xs text-gray-400 mb-4">
            Можно выбрать несколько фото. JPG или PNG.
          </p>

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {images.map((url) => (
                <div key={url} className="relative border rounded overflow-hidden">
                  <Image
                    src={url}
                    alt="Фото товара"
                    width={200}
                    height={200}
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка сохранить */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition font-semibold"
          >
            {loading ? 'Сохраняю...' : 'Добавить товар'}
          </button>
        </div>
      </form>
    </div>
  );
}
