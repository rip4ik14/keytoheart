'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number | null;
}

interface Product {
  id: number;
  title: string;
  price: number;
  original_price: number | null;
  category_ids: number[];
  subcategory_ids: number[];
  short_desc: string | null;
  description: string | null;
  composition: string | null;
  images: string[];
  in_stock: boolean;
  is_visible: boolean;
  is_popular: boolean;
  discount_percent: number;
  production_time: number | null;
  bonus?: number | null;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  // Стейт формы
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [subcategoryIds, setSubcategoryIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [productionTime, setProductionTime] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Вычисляем бонус автоматически от цены (2.5%)
  const calcBonus = (val: string) => {
    const priceNum = parseFloat(val);
    return priceNum && priceNum > 0 ? Math.round(priceNum * 2.5) / 100 : 0;
  };
  const bonus = calcBonus(price);

  // Функции для перестановки существующих изображений
  const moveImage = (from: number, to: number) => {
    setExistingImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };
  const moveImageLeft = (idx: number) => {
    if (idx > 0) moveImage(idx, idx - 1);
  };
  const moveImageRight = (idx: number) => {
    if (idx < existingImages.length - 1) moveImage(idx, idx + 1);
  };

  // Авторизация
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin-session', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error();
        setIsAuthenticated(true);
      } catch {
        toast.error('Доступ запрещён');
        setTimeout(() => {
          router.push(`/admin/login?from=${encodeURIComponent(`/admin/edit-product/${id || ''}`)}`);
        }, 100);
      }
    };
    checkAuth();
  }, [router, id]);

  // Категории/подкатегории
  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
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

  // Данные товара
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(
            'id, title, price, original_price, short_desc, description, composition, images, in_stock, is_visible, is_popular, discount_percent, production_time, bonus'
          )
          .eq('id', parseInt(id))
          .single();
        if (error) throw new Error('Ошибка загрузки товара: ' + error.message);
        if (!data) throw new Error('Товар не найден');

        const { data: categoryData } = await supabase
          .from('product_categories')
          .select('category_id')
          .eq('product_id', parseInt(id));
        const productCategoryIds = categoryData
          ? categoryData.map((item: any) => item.category_id)
          : [];

        const { data: subcategoryData } = await supabase
          .from('product_subcategories')
          .select('subcategory_id')
          .eq('product_id', parseInt(id));
        const productSubcategoryIds = subcategoryData
          ? subcategoryData.map((item: any) => item.subcategory_id)
          : [];

        const normalizedData: Product = {
          id: data.id,
          title: data.title,
          price: data.price,
          original_price: data.original_price ?? null,
          category_ids: productCategoryIds,
          subcategory_ids: productSubcategoryIds,
          short_desc: data.short_desc ?? '',
          description: data.description ?? '',
          composition: data.composition ?? '',
          images: data.images || [],
          in_stock: data.in_stock ?? false,
          is_visible: data.is_visible ?? false,
          is_popular: data.is_popular ?? false,
          discount_percent: data.discount_percent ?? 0,
          production_time: data.production_time ?? null,
          bonus: data.bonus ?? null,
        };

        setProduct(normalizedData);
        setTitle(normalizedData.title);
        setPrice(normalizedData.price.toString());
        setOriginalPrice(
          normalizedData.original_price !== null
            ? normalizedData.original_price.toString()
            : ''
        );
        setDiscountPercent(
          normalizedData.discount_percent
            ? normalizedData.discount_percent.toString()
            : '0'
        );
        setCategoryIds(normalizedData.category_ids);
        setSubcategoryIds(normalizedData.subcategory_ids);
        setShortDesc(normalizedData.short_desc ?? '');
        setDescription(normalizedData.description ?? '');
        setComposition(normalizedData.composition ?? '');
        setProductionTime(
          normalizedData.production_time !== null
            ? normalizedData.production_time.toString()
            : ''
        );
        setExistingImages(normalizedData.images);
        setInStock(normalizedData.in_stock);
        setIsVisible(normalizedData.is_visible);
        setIsPopular(normalizedData.is_popular);
      } catch (err: any) {
        toast.error(err.message);
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      }
    };
    fetchProduct();
  }, [isAuthenticated, id, router]);

  // Фильтрация подкатегорий
  useEffect(() => {
    if (categoryIds.length > 0) {
      const filtered = subcategories.filter(sub =>
        sub.category_id && categoryIds.includes(sub.category_id)
      );
      setFilteredSubcategories(filtered);
      setSubcategoryIds(prev =>
        prev.filter(id => filtered.some(sub => sub.id === id))
      );
    } else {
      setFilteredSubcategories([]);
      setSubcategoryIds([]);
    }
  }, [categoryIds, subcategories]);

  // Обработка новых файлов
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 5) {
      toast.error('Максимум 5 изображений');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (files.some(f => f.size > maxSize)) {
      toast.error('Некоторые файлы превышают 5MB');
      return;
    }
    if (files.some(f => !allowed.includes(f.type))) {
      toast.error('Поддерживаются только JPEG, PNG, WebP');
      return;
    }
    setImages(files);
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      const fileName = decodeURIComponent(imageUrl.split('/').pop()!);
      const { error } = await supabase.storage
        .from('product-image')
        .remove([fileName]);
      if (error) throw new Error(error.message);
      setExistingImages(prev => prev.filter(u => u !== imageUrl));
      toast.success('Изображение удалено');
    } catch (err: any) {
      toast.error('Ошибка: ' + err.message);
    }
  };

  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve, reject) =>
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        mimeType: 'image/webp',
        success(result) {
          resolve(result as File);
        },
        error(err) {
          reject(new Error(err.message));
        },
      })
    );

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    setCategoryIds(prev =>
      checked ? [...prev, categoryId] : prev.filter(id => id !== categoryId)
    );
  };
  const handleSubcategoryChange = (
    subcategoryId: number,
    checked: boolean
  ) => {
    setSubcategoryIds(prev =>
      checked ? [...prev, subcategoryId] : prev.filter(id => id !== subcategoryId)
    );
  };

  const handleSubmit = async (e: React.FormEvent, csrfToken: string) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (title.trim().length < 3)
        throw new Error('Название должно быть ≥ 3 символов');
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0)
        throw new Error('Цена должна быть > 0');
      let originalPriceNum: number | undefined;
      if (originalPrice) {
        originalPriceNum = parseFloat(originalPrice);
        if (isNaN(originalPriceNum) || originalPriceNum <= 0)
          throw new Error('Старая цена должна быть > 0, если указана');
      }

      if (categoryIds.length === 0)
        throw new Error('Необходимо выбрать хотя бы одну категорию');
      const discountNum = discountPercent ? parseFloat(discountPercent) : 0;
      if (discountNum < 0 || discountNum > 100)
        throw new Error('Скидка должна быть от 0 до 100%');
      const productionTimeNum = productionTime
        ? Number(productionTime)
        : null;

      // Загрузка новых изображений
      let imageUrls = [...existingImages];
      if (images.length > 0) {
        for (const image of images) {
          const compressed = await compressImage(image);
          const fileName = `${uuidv4()}-${compressed.name}`;
          const { error } = await supabase.storage
            .from('product-image')
            .upload(fileName, compressed);
          if (error) throw new Error(error.message);
          const { data: publicData } = supabase.storage
            .from('product-image')
            .getPublicUrl(fileName);
          if (publicData?.publicUrl) imageUrls.push(publicData.publicUrl);
          else throw new Error('Не удалось получить URL изображения');
        }
      }

      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          id: parseInt(id!),
          title: title.trim(),
          price: priceNum,
          original_price: originalPriceNum,
          category_ids: categoryIds,
          subcategory_ids: subcategoryIds,
          short_desc: shortDesc.trim(),
          description: description.trim(),
          composition: composition.trim(),
          images: imageUrls,
          discount_percent: discountNum,
          in_stock: inStock,
          is_visible: isVisible,
          is_popular: isPopular,
          production_time: productionTimeNum,
          bonus,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка обновления товара');

      toast.success(
        'Товар успешно обновлён. Изменения появятся на сайте в течение 30 секунд.'
      );
      router.push('/admin/products');
    } catch (err: any) {
      toast.error('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null || !product || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Загрузка...
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <CSRFToken>
      {csrfToken => (
        <motion.div
          className="max-w-4xl mx-auto p-4 sm:p-8 bg-white rounded-2xl shadow-xl my-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">
            Редактировать товар #{id}
          </h1>
          <form onSubmit={e => handleSubmit(e, csrfToken)} className="space-y-8">
            {/* Основная информация */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Основная информация</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium text-gray-600">Название</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-gray-600">Цена (₽)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-600">Старая цена (₽)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={originalPrice}
                      onChange={e => setOriginalPrice(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-600">Скидка (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-600">Бонус (₽)</label>
                  <input
                    type="number"
                    value={bonus}
                    readOnly
                    className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Категории и подкатегории */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Категории</h2>
              {isCategoriesLoading ? (
                <p>Загрузка категорий...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium text-gray-600">Категории</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <label
                          key={category.id}
                          className={`flex items-center px-2 py-1 bg-gray-100 rounded-lg cursor-pointer select-none hover:bg-gray-200 transition text-gray-700 text-sm ${categoryIds.includes(category.id) ? 'border border-black font-bold' : 'border border-transparent'}`}
                        >
                          <input
                            type="checkbox"
                            checked={categoryIds.includes(category.id)}
                            onChange={e => handleCategoryChange(category.id, e.target.checked)}
                            className="mr-2 accent-black"
                          />
                          {category.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium text-gray-600">Подкатегории</label>
                    {filteredSubcategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {filteredSubcategories.map(subcategory => (
                          <label
                            key={subcategory.id}
                            className={`flex items-center px-2 py-1 bg-gray-100 rounded-lg cursor-pointer select-none hover:bg-gray-200 transition text-gray-700 text-sm ${subcategoryIds.includes(subcategory.id) ? 'border border-black font-bold' : 'border border-transparent'}`}
                          >
                            <input
                              type="checkbox"
                              checked={subcategoryIds.includes(subcategory.id)}
                              onChange={e => handleSubcategoryChange(subcategory.id, e.target.checked)}
                              className="mr-2 accent-black"
                            />
                            {subcategory.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Выберите категории для отображения подкатегорий</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Описание */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Описание</h2>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium text-gray-600">Краткое описание</label>
                  <textarea
                    value={shortDesc}
                    onChange={e => setShortDesc(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-600">Полное описание</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-600">Состав</label>
                  <textarea
                    value={composition}
                    onChange={e => setComposition(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </section>

            {/* Изображения и настройки */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Изображения и параметры</h2>
              <div>
                <label className="block mb-1 font-medium text-gray-600">Существующие изображения:</label>
                {existingImages.length > 0 ? (
                  <div
                    className="flex flex-wrap gap-2 mb-4"
                    onDragOver={e => e.preventDefault()}
                  >
                    {existingImages.map((url, index) => (
                      <div
                        key={url}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('index', index.toString())}
                        onDrop={e => {
                          const fromIndex = parseInt(e.dataTransfer.getData('index'));
                          if (fromIndex !== index) {
                            moveImage(fromIndex, index);
                          }
                        }}
                        className="relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 shadow-sm cursor-move"
                      >
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover rounded-lg pointer-events-none"
                        />
                        <div className="absolute top-1 left-1 flex space-x-1 z-10">
                          <button
                            type="button"
                            onClick={() => moveImageLeft(index)}
                            disabled={index === 0}
                            className="bg-white bg-opacity-80 rounded-full p-1 border border-gray-200 disabled:opacity-50"
                            aria-label="Переместить влево"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImageRight(index)}
                            disabled={index === existingImages.length - 1}
                            className="bg-white bg-opacity-80 rounded-full p-1 border border-gray-200 disabled:opacity-50"
                            aria-label="Переместить вправо"
                          >
                            →
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url)}
                          className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 border border-gray-200 hover:bg-red-500 hover:text-white transition z-10 shadow"
                          aria-label={`Удалить изображение ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Изображения отсутствуют</p>
                )}
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Добавить новые изображения (максимум 5):
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {images.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Выбрано {images.length} файл(ов)
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Время производства (дней)
                  </label>
                  <input
                    type="number"
                    value={productionTime}
                    onChange={e => setProductionTime(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={e => setInStock(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="font-medium text-gray-600">В наличии</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={e => setIsVisible(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="font-medium text-gray-600">Видимый</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={e => setIsPopular(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="font-medium text-gray-600">Популярный</label>
                </div>
              </div>
            </section>

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-black text-white rounded-xl shadow-md hover:bg-gray-900 transition-all disabled:bg-gray-400"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl shadow hover:bg-gray-300 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Отмена
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}
    </CSRFToken>
  );
}