'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase/public';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import CSRFToken from '@components/CSRFToken';
import DOMPurify from 'dompurify';
import Compressor from 'compressorjs';
import { motion } from 'framer-motion';

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number | null; // Исправляем тип, чтобы соответствовать схеме
}

export default function AddProductPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [inStock, setInStock] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Загрузка категорий и подкатегорий
  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const { data: categoriesData, error: categoriesError } = await supabasePublic
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true });

        if (categoriesError) throw new Error(categoriesError.message);
        setCategories(categoriesData || []);

        const { data: subcategoriesData, error: subcategoriesError } = await supabasePublic
          .from('subcategories')
          .select('id, name, category_id')
          .order('name', { ascending: true });

        if (subcategoriesError) throw new Error(subcategoriesError.message);
        setSubcategories(subcategoriesData || []);
      } catch (err: any) {
        toast.error('Ошибка загрузки категорий: ' + err.message);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategoriesAndSubcategories();
  }, []);

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
        router.push(`/admin/login?from=${encodeURIComponent('/admin/add-product')}`);
      }
    };
    checkAuth();
  }, [router]);

  // Фильтрация подкатегорий при выборе категории
  useEffect(() => {
    if (categoryId) {
      const filtered = subcategories.filter((sub) => sub.category_id === categoryId);
      setFilteredSubcategories(filtered);
      setSubcategoryId(null);
    } else {
      setFilteredSubcategories([]);
      setSubcategoryId(null);
    }
  }, [categoryId, subcategories]);

  // Обновление списка изображений
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 5) {
      toast.error('Максимум 5 изображений');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    const invalidTypeFiles = files.filter((file) => !allowedTypes.includes(file.type));

    if (oversizedFiles.length > 0) {
      toast.error('Некоторые файлы превышают 5MB');
      return;
    }
    if (invalidTypeFiles.length > 0) {
      toast.error('Поддерживаются только JPEG, PNG, WebP');
      return;
    }
    setImages(files);
  };

  // Очистка формы
  const resetForm = () => {
    setTitle('');
    setPrice('');
    setOriginalPrice('');
    setDiscountPercent('');
    setCategoryId(null);
    setSubcategoryId(null);
    setShortDesc('');
    setDescription('');
    setComposition('');
    setImages([]);
    setInStock(true);
    setIsVisible(true);
    setIsPopular(false);
    titleInputRef.current?.focus();
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      console.log('Starting compression for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        mimeType: 'image/webp',
        success(result: File) {
          console.log('Compression successful:', result.name, 'Size:', result.size);
          resolve(result);
        },
        error(err) {
          console.error('Compression error:', err.message);
          reject(new Error('Ошибка сжатия изображения: ' + err.message));
        },
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent, csrfToken: string) => {
    e.preventDefault();
    const toastId = toast.loading('Добавление товара...');
    setLoading(true);

    try {
      console.log('Form Data:', {
        title,
        price,
        originalPrice,
        discountPercent,
        categoryId,
        subcategoryId,
        shortDesc,
        description,
        composition,
        images,
        inStock,
        isVisible,
        isPopular,
      });

      if (title.trim().length < 3) throw new Error('Название должно быть ≥ 3 символов');
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) throw new Error('Цена должна быть > 0');
      const originalPriceNum = parseFloat(originalPrice);
      if (isNaN(originalPriceNum) || originalPriceNum <= 0) throw new Error('Старая цена должна быть > 0');
      if (!categoryId) throw new Error('Категория обязательна');
      const discountNum = discountPercent ? parseFloat(discountPercent) : 0;
      if (discountNum < 0 || discountNum > 100) throw new Error('Скидка должна быть от 0 до 100%');

      const sanitizedTitle = DOMPurify.sanitize(title.trim());
      const sanitizedShortDesc = DOMPurify.sanitize(shortDesc.trim());
      const sanitizedDescription = DOMPurify.sanitize(description.trim());
      const sanitizedComposition = DOMPurify.sanitize(composition.trim());

      let imageUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          console.log('Compressing image:', image.name);
          const compressedImage = await compressImage(image);
          const fileName = `${uuidv4()}-${compressedImage.name}`;
          console.log('Uploading image to Supabase:', fileName);
          const { data, error } = await supabasePublic.storage
            .from('product-image')
            .upload(fileName, compressedImage);
          if (error) throw new Error('Ошибка загрузки изображения: ' + error.message);

          const { data: publicData } = supabasePublic.storage
            .from('product-image')
            .getPublicUrl(fileName);
          if (publicData?.publicUrl) {
            imageUrls.push(publicData.publicUrl);
            console.log('Image uploaded:', publicData.publicUrl);
          } else {
            throw new Error('Не удалось получить публичный URL изображения');
          }
        }
      }

      console.log('Sending request to /api/products with payload:', {
        title: sanitizedTitle,
        price: priceNum,
        original_price: originalPriceNum,
        discount_percent: discountNum,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        short_desc: sanitizedShortDesc,
        description: sanitizedDescription,
        composition: sanitizedComposition,
        images: imageUrls,
        in_stock: inStock,
        is_visible: isVisible,
        is_popular: isPopular,
      });

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          title: sanitizedTitle,
          price: priceNum,
          original_price: originalPriceNum,
          discount_percent: discountNum,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          short_desc: sanitizedShortDesc,
          description: sanitizedDescription,
          composition: sanitizedComposition,
          images: imageUrls,
          in_stock: inStock,
          is_visible: isVisible,
          is_popular: isPopular,
        }),
      });

      const json = await res.json();
      console.log('Response from /api/products:', json);
      if (!res.ok) throw new Error(json.error || 'Ошибка создания товара');

      toast.success('Товар успешно добавлен', { id: toastId });
      router.push('/admin/products');
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      toast.error('Ошибка: ' + err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Проверка авторизации...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <CSRFToken>
      {(csrfToken) => (
        <motion.div
          className="max-w-6xl mx-auto p-6 space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold">Добавить товар</h1>
          <form onSubmit={(e) => handleSubmit(e, csrfToken)} className="space-y-8">
            {/* Основная информация */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Основная информация</h2>
              <div>
                <label htmlFor="title" className="block mb-1 font-medium">
                  Название:
                </label>
                <motion.input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите название товара (мин. 3 символа)"
                  required
                  aria-describedby="title-desc"
                  ref={titleInputRef}
                  whileFocus={{ scale: 1.02 }}
                />
                <p id="title-desc" className="text-sm text-gray-500 mt-1">
                  Название товара, отображаемое на сайте.
                </p>
              </div>
              <div>
                <label htmlFor="category" className="block mb-1 font-medium">
                  Категория:
                </label>
                {isCategoriesLoading ? (
                  <p className="text-gray-500">Загрузка категорий...</p>
                ) : (
                  <motion.select
                    id="category"
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-describedby="category-desc"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </motion.select>
                )}
                <p id="category-desc" className="text-sm text-gray-500 mt-1">
                  Категория товара.
                </p>
              </div>
              <div>
                <label htmlFor="subcategory" className="block mb-1 font-medium">
                  Подкатегория:
                </label>
                <motion.select
                  id="subcategory"
                  value={subcategoryId || ''}
                  onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!categoryId || filteredSubcategories.length === 0}
                  aria-describedby="subcategory-desc"
                  whileFocus={{ scale: 1.02 }}
                >
                  <option value="">Выберите подкатегорию</option>
                  {filteredSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </motion.select>
                <p id="subcategory-desc" className="text-sm text-gray-500 mt-1">
                  Подкатегория товара (опционально).
                </p>
              </div>
            </section>

            {/* Цены и скидки */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Цены и скидки</h2>
              <div>
                <label htmlFor="price" className="block mb-1 font-medium">
                  Цена (₽):
                </label>
                <motion.input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите цену"
                  required
                  min="0.01"
                  step="0.01"
                  aria-describedby="price-desc"
                  whileFocus={{ scale: 1.02 }}
                />
                <p id="price-desc" className="text-sm text-gray-500 mt-1">
                  Текущая цена товара в рублях.
                </p>
              </div>
              <div>
                <label htmlFor="originalPrice" className="block mb-1 font-medium">
                  Старая цена (₽):
                </label>
                <motion.input
                  id="originalPrice"
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите старую цену"
                  required
                  min="0.01"
                  step="0.01"
                  aria-describedby="originalPrice-desc"
                  whileFocus={{ scale: 1.02 }}
                />
                <p id="originalPrice-desc" className="text-sm text-gray-500 mt-1">
                  Цена до скидки (для отображения скидки).
                </p>
              </div>
              <div>
                <label htmlFor="discountPercent" className="block mb-1 font-medium">
                  Скидка (%):
                </label>
                <motion.input
                  id="discountPercent"
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите скидку (0-100)"
                  min="0"
                  max="100"
                  step="1"
                  aria-describedby="discountPercent-desc"
                  whileFocus={{ scale: 1.02 }}
                />
                <p id="discountPercent-desc" className="text-sm text-gray-500 mt-1">
                  Процент скидки (если применимо).
                </p>
              </div>
            </section>

            {/* Описание */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Описание</h2>
              <div>
                <label htmlFor="shortDesc" className="block mb-1 font-medium">
                  Краткое описание:
                </label>
                <motion.textarea
                  id="shortDesc"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите краткое описание"
                  rows={3}
                  aria-describedby="shortDesc-desc"
                  whileFocus={{ scale: 1.02 }}
                />
                <p id="shortDesc-desc" className="text-sm text-gray-500 mt-1">
                  Краткое описание для карточки товара.
                </p>
              </div>
              <div>
                <label htmlFor="description" className="block mb-1 font-medium">
                  Полное описание:
                </label>
                <motion.textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите полное описание"
                  rows={5}
                  aria-describedby="description-desc"
                  whileFocus={{ scale: 1.02 }}
                />
                <p id="description-desc" className="text-sm text-gray-500 mt-1">
                  Подробное описание товара.
                </p>
              </div>
              <div>
                <label htmlFor="composition" className="block mb-1 font-medium">
                  Состав:
                </label>
                <motion.textarea
                  id="composition"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите состав"
                  rows={3}
                  aria-describedby="composition-desc"
                  whileFocus={{ scale: 1.02 }}
                />
                <p id="composition-desc" className="text-sm text-gray-500 mt-1">
                  Состав товара (например, ингредиенты).
                </p>
              </div>
            </section>

            {/* Изображения и настройки */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Изображения и настройки</h2>
              <div>
                <label htmlFor="images" className="block mb-1 font-medium">
                  Изображения:
                </label>
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 border rounded"
                  aria-describedby="images-desc"
                />
                <p id="images-desc" className="text-sm text-gray-500 mt-1">
                  Выберите изображения товара (максимум 5).
                </p>
                {images.length > 0 && (
                  <div className="mt-2">
                    <p>Выбрано изображений: {images.length}</p>
                    <ul className="list-disc pl-5">
                      {images.map((image, index) => (
                        <li key={index}>{image.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="inStock" className="flex items-center">
                  <input
                    id="inStock"
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="mr-2"
                    aria-describedby="inStock-desc"
                  />
                  В наличии
                </label>
                <p id="inStock-desc" className="text-sm text-gray-500 mt-1">
                  Укажите, доступен ли товар для заказа.
                </p>
              </div>
              <div>
                <label htmlFor="isVisible" className="flex items-center">
                  <input
                    id="isVisible"
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="mr-2"
                    aria-describedby="isVisible-desc"
                  />
                  Показать товар
                </label>
                <p id="isVisible-desc" className="text-sm text-gray-500 mt-1">
                  Укажите, виден ли товар на сайте.
                </p>
              </div>
              <div>
                <label htmlFor="isPopular" className="flex items-center">
                  <input
                    id="isPopular"
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="mr-2"
                    aria-describedby="isPopular-desc"
                  />
                  Популярный товар
                </label>
                <p id="isPopular-desc" className="text-sm text-gray-500 mt-1">
                  Укажите, отображать ли товар в разделе "Популярное".
                </p>
              </div>
            </section>

            {/* Кнопки */}
            <div className="flex gap-4">
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-black text-white rounded hover:opacity-90 transition disabled:bg-gray-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Добавить новый товар"
              >
                {loading ? 'Добавление...' : 'Добавить товар'}
              </motion.button>
              <motion.button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Сбросить форму"
              >
                Сбросить
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}
    </CSRFToken>
  );
}