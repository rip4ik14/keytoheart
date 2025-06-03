// components/NewProductPage.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import CSRFToken from '@components/CSRFToken';
import Compressor from 'compressorjs';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number | null;
}

interface ImageFile {
  id: string;
  file: File;
}

export default function NewProductPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Основные данные
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [subcategoryIds, setSubcategoryIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [productionTime, setProductionTime] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [bonus, setBonus] = useState('0'); // Начальное значение
  const [images, setImages] = useState<ImageFile[]>([]);
  const [inStock, setInStock] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Вычисляем бонус автоматически (2.5% от цены)
  const calcBonus = (val: string): string => {
    const priceNum = parseFloat(val);
    return priceNum && priceNum > 0 ? (Math.round(priceNum * 2.5) / 100).toString() : '0';
  };

  // Обновляем бонус при изменении цены
  useEffect(() => {
    const calculatedBonus = calcBonus(price);
    setBonus(calculatedBonus);
  }, [price]);

  // Мультитач чекбоксы (категории/подкатегории)
  const handleCategoryChange = (id: number, checked: boolean) => {
    setCategoryIds(prev =>
      checked ? [...prev, id] : prev.filter(cid => cid !== id)
    );
  };

  const handleSubcategoryChange = (id: number, checked: boolean) => {
    setSubcategoryIds(prev =>
      checked ? [...prev, id] : prev.filter(sid => sid !== id)
    );
  };

  // Фильтруем подкатегории под выбранные категории
  useEffect(() => {
    if (categoryIds.length > 0) {
      const filtered = subcategories.filter(
        sub => sub.category_id && categoryIds.includes(sub.category_id)
      );
      setFilteredSubcategories(filtered);
      setSubcategoryIds(prev => prev.filter(id => filtered.some(sub => sub.id === id)));
    } else {
      setFilteredSubcategories([]);
      setSubcategoryIds([]);
    }
  }, [categoryIds, subcategories]);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Загрузка категорий/подкатегорий
  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name', { ascending: true });
        if (categoriesError) throw new Error(categoriesError.message);
        setCategories(categoriesData || []);

        const { data: subcategoriesData, error: subcategoriesError } = await supabase
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
        if (!res.ok || !data.success) throw new Error(data.message || 'Доступ запрещён');
        setIsAuthenticated(true);
      } catch {
        toast.error('Доступ запрещён');
        router.push(`/admin/login?from=${encodeURIComponent('/admin/products/new')}`);
      }
    };
    checkAuth();
  }, [router]);

  // Загрузка/обработка изображений
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length + images.length > 7) {
      toast.error('Максимум 7 изображений');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const oversizedFiles = files.filter(file => file.size > maxSize);
    const invalidTypeFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (oversizedFiles.length > 0) {
      toast.error('Некоторые файлы превышают 5MB');
      return;
    }
    if (invalidTypeFiles.length > 0) {
      toast.error('Поддерживаются только JPEG, PNG, WebP');
      return;
    }
    const newImages = files.map(file => ({
      id: uuidv4(),
      file,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Очистка формы
  const resetForm = () => {
    setTitle('');
    setPrice('');
    setOriginalPrice('');
    setDiscountPercent('');
    setCategoryIds([]);
    setSubcategoryIds([]);
    setProductionTime('');
    setShortDesc('');
    setDescription('');
    setComposition('');
    setBonus('0'); // Сбрасываем бонус
    setImages([]);
    setInStock(true);
    setIsVisible(true);
    setIsPopular(false);
    titleInputRef.current?.focus();
  };

  // Сжатие изображений
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        mimeType: 'image/webp',
        success(result: File) {
          resolve(result);
        },
        error(err) {
          reject(new Error('Ошибка сжатия изображения: ' + err.message));
        },
      });
    });
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent, csrfToken: string) => {
    e.preventDefault();
    const toastId = toast.loading('Добавление товара...');
    setLoading(true);

    try {
      if (title.trim().length < 3) throw new Error('Название должно быть ≥ 3 символов');
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) throw new Error('Цена должна быть > 0');
      
      // Проверка для originalPrice (необязательное поле)
      let originalPriceNum: number | undefined;
      if (originalPrice) {
        originalPriceNum = parseFloat(originalPrice);
        if (isNaN(originalPriceNum) || originalPriceNum <= 0) {
          throw new Error('Старая цена должна быть > 0, если указана');
        }
      } else {
        originalPriceNum = undefined; // Если поле пустое, передаём undefined
      }

      if (categoryIds.length === 0) throw new Error('Необходимо выбрать хотя бы одну категорию');
      const discountNum = discountPercent ? parseFloat(discountPercent) : 0;
      if (discountNum < 0 || discountNum > 100) throw new Error('Скидка должна быть от 0 до 100%');
      const productionTimeNum = productionTime ? parseInt(productionTime) : null;
      if (productionTime && (isNaN(productionTimeNum!) || productionTimeNum! < 0)) {
        throw new Error('Время изготовления должно быть ≥ 0');
      }
      const bonusNum = parseFloat(bonus);
      if (isNaN(bonusNum) || bonusNum < 0) {
        throw new Error('Бонус должен быть ≥ 0');
      }

      // Проверяем название категорий (для лейбла)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name, slug')
        .in('id', categoryIds);
      if (categoriesError || !categoriesData) throw new Error('Ошибка получения категорий');

      // Запрещаем шарики/открытки в популярных
      if (isPopular && categoriesData.some(cat => ['balloon', 'postcard'].includes(cat.slug))) {
        throw new Error('Шарики и открытки нельзя сделать популярными товарами');
      }

      // Загрузка картинок
      let imageUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          const compressedImage = await compressImage(image.file);
          const fileName = `${uuidv4()}-${compressedImage.name}`;
          const { error } = await supabase.storage
            .from('product-image')
            .upload(fileName, compressedImage);
          if (error) throw new Error('Ошибка загрузки изображения: ' + error.message);
          const { data: publicData } = supabase.storage
            .from('product-image')
            .getPublicUrl(fileName);
          if (publicData?.publicUrl) {
            imageUrls.push(publicData.publicUrl);
          } else {
            throw new Error('Не удалось получить публичный URL изображения');
          }
        }
      }

      const payload = {
        title: title.trim(),
        price: priceNum,
        original_price: originalPriceNum, // Может быть undefined
        discount_percent: discountNum,
        category: categoriesData.map(cat => cat.name).join(', '),
        category_ids: categoryIds,
        subcategory_ids: subcategoryIds,
        production_time: productionTimeNum,
        short_desc: shortDesc.trim(),
        description: description.trim(),
        composition: composition.trim(),
        bonus: bonusNum,
        images: imageUrls,
        in_stock: inStock,
        is_visible: isVisible,
        is_popular: isPopular,
        order_index: 0,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка создания товара');
      toast.success('Товар успешно добавлен', { id: toastId });
      router.push('/admin/products');
    } catch (err: any) {
      toast.error('Ошибка: ' + err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-600">Проверка авторизации...</div>;
  }
  if (!isAuthenticated) return null;

  // ————— СТАРТ РЕНДЕРА —————
  return (
    <CSRFToken>
      {(csrfToken) => (
        <motion.div
          className="max-w-3xl mx-auto p-4 sm:p-8 bg-white rounded-2xl shadow-xl my-8 animate-in fade-in duration-200"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">Добавить новый товар</h1>
          <form onSubmit={e => handleSubmit(e, csrfToken)} className="space-y-8">
            {/* ——— Основная информация ——— */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Основная информация</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="title" className="block mb-1 font-medium text-gray-600">Название:</label>
                  <input
                    id="title"
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black shadow"
                    placeholder="Название товара (мин. 3 символа)"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-600">Категории:</label>
                  {isCategoriesLoading ? (
                    <p className="text-gray-400">Загрузка...</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <label
                          key={cat.id}
                          className={`flex items-center px-2 py-1 bg-gray-100 rounded-lg cursor-pointer select-none hover:bg-gray-200 transition text-gray-700 text-sm ${categoryIds.includes(cat.id) ? 'border border-black font-bold' : 'border border-transparent'}`}
                        >
                          <input
                            type="checkbox"
                            checked={categoryIds.includes(cat.id)}
                            onChange={e => handleCategoryChange(cat.id, e.target.checked)}
                            className="mr-2 accent-black"
                          />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block mb-1 font-medium text-gray-600">Подкатегории:</label>
                  {filteredSubcategories.length === 0 ? (
                    <p className="text-gray-400">Сначала выберите категории</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredSubcategories.map(sub => (
                        <label
                          key={sub.id}
                          className={`flex items-center px-2 py-1 bg-gray-100 rounded-lg cursor-pointer select-none hover:bg-gray-200 transition text-gray-700 text-sm ${subcategoryIds.includes(sub.id) ? 'border border-black font-bold' : 'border border-transparent'}`}
                        >
                          <input
                            type="checkbox"
                            checked={subcategoryIds.includes(sub.id)}
                            onChange={e => handleSubcategoryChange(sub.id, e.target.checked)}
                            className="mr-2 accent-black"
                          />
                          {sub.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ——— Цены, скидки, бонусы ——— */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Цены и бонусы</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="price" className="block mb-1 font-medium text-gray-600">Цена (₽):</label>
                  <input
                    id="price"
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black shadow"
                    placeholder="Цена"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="originalPrice" className="block mb-1 font-medium text-gray-600">Старая цена (₽, опционально):</label>
                  <input
                    id="originalPrice"
                    type="number"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black shadow"
                    placeholder="Старая цена (необязательно)"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="discountPercent" className="block mb-1 font-medium text-gray-600">Скидка (%):</label>
                  <input
                    id="discountPercent"
                    type="number"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black shadow"
                    placeholder="Скидка (0-100)"
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                <div>
                  <label htmlFor="bonus" className="block mb-1 font-medium text-gray-600">Бонус (2,5%):</label>
                  <input
                    id="bonus"
                    type="number"
                    value={bonus}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="productionTime" className="block mb-1 font-medium text-gray-600">Время изготовления (ч):</label>
                  <input
                    id="productionTime"
                    type="number"
                    value={productionTime}
                    onChange={e => setProductionTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black shadow"
                    placeholder="Время изготовления"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </section>

            {/* ——— Описание ——— */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Описание</h2>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label htmlFor="shortDesc" className="block mb-1 font-medium text-gray-600">Краткое описание:</label>
                  <textarea
                    id="shortDesc"
                    value={shortDesc}
                    onChange={e => setShortDesc(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black shadow"
                    placeholder="Краткое описание"
                    rows={2}
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block mb-1 font-medium text-gray-600">Полное описание:</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black shadow"
                    placeholder="Полное описание"
                    rows={4}
                  />
                </div>
                <div>
                  <label htmlFor="composition" className="block mb-1 font-medium text-gray-600">Состав:</label>
                  <textarea
                    id="composition"
                    value={composition}
                    onChange={e => setComposition(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black shadow"
                    placeholder="Состав товара (ингредиенты и пр.)"
                    rows={2}
                  />
                </div>
              </div>
            </section>

            {/* ——— Изображения и настройки ——— */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Изображения и параметры</h2>
              <div>
                <label htmlFor="images" className="block mb-1 font-medium text-gray-600">Изображения:</label>
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full p-2 border border-gray-300 rounded-lg mb-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <p className="text-sm text-gray-500 mb-2">Максимум 7 файлов (JPEG, PNG, WebP, ≤5MB)</p>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {images.map(image => (
                      <div key={image.id} className="relative group w-24 h-24 border rounded-lg overflow-hidden shadow-sm bg-gray-50">
                        <Image
                          src={URL.createObjectURL(image.file)}
                          alt={image.file.name}
                          fill
                          className="object-cover rounded-lg pointer-events-none"
                        />
                        <button
                          onClick={() => handleRemoveImage(image.id)}
                          type="button"
                          className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 border border-gray-200 hover:bg-red-500 hover:text-white transition z-10 shadow"
                          aria-label="Удалить изображение"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <label className="inline-flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={e => setInStock(e.target.checked)}
                    className="w-5 h-5 accent-black"
                  />
                  В наличии
                </label>
                <label className="inline-flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={e => setIsVisible(e.target.checked)}
                    className="w-5 h-5 accent-black"
                  />
                  Показать товар
                </label>
                <label className="inline-flex items-center gap-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={e => setIsPopular(e.target.checked)}
                    className="w-5 h-5 accent-black"
                  />
                  Популярный
                </label>
              </div>
            </section>

            {/* ——— Кнопки ——— */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 text-lg font-bold bg-black text-white rounded-xl shadow-md hover:bg-gray-900 transition-all disabled:bg-gray-400"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Добавить товар"
              >
                {loading ? 'Добавление...' : 'Добавить товар'}
              </motion.button>
              <motion.button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 text-lg font-semibold bg-gray-200 text-gray-700 rounded-xl shadow hover:bg-gray-300 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
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