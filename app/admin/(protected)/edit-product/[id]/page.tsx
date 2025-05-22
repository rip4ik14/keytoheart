'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase/public';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import CSRFToken from '@components/CSRFToken';
import Compressor from 'compressorjs';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X, Image as ImageIcon } from 'lucide-react';
import { Product } from '@/types/product';

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number | null;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
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
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [accordionOpen, setAccordionOpen] = useState({
    main: true,
    pricing: true,
    description: true,
    images: true,
  });

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin-session', { credentials: 'include' });
        const data = await res.json();
        console.log('[EditProductPage] Admin session response:', data);
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Доступ запрещён');
        }
        setIsAuthenticated(true);
      } catch (err: any) {
        console.error('[EditProductPage] Auth error:', err.message);
        toast.error('Войдите как администратор');
        router.push(`/admin/login?from=${encodeURIComponent(`/admin/edit-product/${id}`)}`);
      }
    };
    checkAuth();
  }, [router, id]);

  // Загрузка категорий и подкатегорий
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCategoriesAndSubcategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const { data: categoriesData, error: categoriesError } = await supabasePublic
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true })
          .neq('id', 38);

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
  }, [isAuthenticated]);

  // Загрузка данных товара
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProduct = async () => {
      try {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          throw new Error('Неверный ID товара');
        }

        const { data, error } = await supabasePublic
          .from('products')
          .select(`
            id,
            title,
            price,
            original_price,
            short_desc,
            description,
            composition,
            images,
            in_stock,
            is_visible,
            is_popular,
            discount_percent,
            slug,
            bonus,
            image_url,
            created_at,
            production_time,
            order_index
          `)
          .eq('id', numericId)
          .single();

        if (error || !data) {
          throw new Error(error?.message || 'Товар не найден');
        }

        const { data: categoryData, error: categoryError } = await supabasePublic
          .from('product_categories')
          .select('category_id')
          .eq('product_id', numericId);

        if (categoryError) {
          throw new Error('Ошибка загрузки категорий товара: ' + categoryError.message);
        }

        const productCategoryIds = categoryData.map((item) => item.category_id);

        const { data: subcategoryData, error: subcategoryError } = await supabasePublic
          .from('product_subcategories')
          .select('subcategory_id')
          .eq('product_id', numericId);

        if (subcategoryError) {
          throw new Error('Ошибка загрузки подкатегорий товара: ' + subcategoryError.message);
        }

        const productSubcategoryIds = subcategoryData.map((item) => item.subcategory_id);

        const normalizedData: Product = {
          id: data.id,
          title: data.title || '',
          price: data.price || 0,
          original_price: data.original_price ?? null,
          category_ids: productCategoryIds,
          subcategory_ids: productSubcategoryIds,
          subcategory_names: [],
          short_desc: data.short_desc || '',
          description: data.description || '',
          composition: data.composition || '',
          images: data.images || [],
          in_stock: data.in_stock ?? false,
          is_visible: data.is_visible ?? false,
          is_popular: data.is_popular ?? false,
          discount_percent: data.discount_percent ?? 0,
          slug: data.slug || null,
          bonus: data.bonus || null,
          image_url: data.image_url || null,
          created_at: data.created_at || null,
          production_time: data.production_time || null,
          order_index: data.order_index || null,
        };

        setProduct(normalizedData);
        setTitle(normalizedData.title);
        setPrice(normalizedData.price.toString());
        setOriginalPrice(normalizedData.original_price?.toString() || normalizedData.price.toString());
        setDiscountPercent(normalizedData.discount_percent?.toString() || '0');
        setCategoryIds(normalizedData.category_ids);
        setSubcategoryIds(normalizedData.subcategory_ids);
        setShortDesc(normalizedData.short_desc || '');
        setDescription(normalizedData.description || '');
        setComposition(normalizedData.composition || '');
        setExistingImages(normalizedData.images || []);
        setInStock(normalizedData.in_stock ?? false);
        setIsVisible(normalizedData.is_visible ?? false);
        setIsPopular(normalizedData.is_popular ?? false);
      } catch (err: any) {
        toast.error(err.message);
        router.push('/admin/products');
      }
    };

    fetchProduct();
  }, [isAuthenticated, id, router]);

  // Фильтрация подкатегорий
  useEffect(() => {
    if (categoryIds.length > 0) {
      const filtered = subcategories.filter((sub) => sub.category_id && categoryIds.includes(sub.category_id));
      setFilteredSubcategories(filtered);
      setSubcategoryIds((prev) => prev.filter((id) => filtered.some((sub) => sub.id === id)));
    } else {
      setFilteredSubcategories([]);
      setSubcategoryIds([]);
    }
  }, [categoryIds, subcategories]);

  // Предварительный просмотр новых изображений
  useEffect(() => {
    const previews = images.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [images]);

  // Валидация формы
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (title.trim().length < 3) {
      newErrors.title = 'Название должно быть ≥ 3 символов';
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'Цена должна быть > 0';
    }
    const originalPriceNum = parseFloat(originalPrice);
    if (isNaN(originalPriceNum) || originalPriceNum <= 0) {
      newErrors.originalPrice = 'Старая цена должна быть > 0';
    }
    if (categoryIds.length === 0) {
      newErrors.categoryIds = 'Необходимо выбрать хотя бы одну категорию';
    }
    const discountNum = discountPercent ? parseFloat(discountPercent) : 0;
    if (discountNum < 0 || discountNum > 100) {
      newErrors.discountPercent = 'Скидка должна быть от 0 до 100%';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Отправка формы
  async function handleSubmit(csrfToken: string) {
    try {
      if (!validateForm()) {
        throw new Error('Пожалуйста, исправьте ошибки в форме');
      }
      setLoading(true);

      const priceNum = parseFloat(price);
      const originalPriceNum = parseFloat(originalPrice);
      const discountNum = discountPercent ? parseFloat(discountPercent) : 0;

      let imageUrls = [...existingImages];
      if (images.length > 0) {
        for (const image of images) {
          const compressedImage = await compressImage(image);
          const fileName = `${uuidv4()}-${compressedImage.name}`;
          const { error } = await supabasePublic.storage
            .from('product-image')
            .upload(fileName, compressedImage);

          if (error) {
            throw new Error('Ошибка загрузки изображения: ' + error.message);
          }

          const { data: publicData } = supabasePublic.storage
            .from('product-image')
            .getPublicUrl(fileName);

          if (publicData?.publicUrl) {
            imageUrls.push(publicData.publicUrl);
          } else {
            throw new Error('Не удалось получить публичный URL изображения');
          }
        }
      }

      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          id: parseInt(id),
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
        }),
      });

      console.log('[EditProductPage] PATCH /api/products status:', res.status);

      const data = await res.json();
      if (!res.ok) {
        console.error('[EditProductPage] PATCH /api/products error response:', data);
        throw new Error(data.error || 'Ошибка обновления товара');
      }

      toast.success('Товар успешно обновлён');
      router.push('/admin/products');
    } catch (err: any) {
      console.error('[EditProductPage] Submit error:', err.message);
      toast.error('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Удаление изображения
  async function handleRemoveImage(imageUrl: string) {
    try {
      const fileName = decodeURIComponent(imageUrl.split('/').pop()!);
      const { error } = await supabasePublic.storage
        .from('product-image')
        .remove([fileName]);

      if (error) {
        throw new Error('Ошибка удаления изображения: ' + error.message);
      }

      setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
      toast.success('Изображение удалено');
    } catch (err: any) {
      toast.error('Ошибка: ' + err.message);
    }
  }

  // Сжатие изображения
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        mimeType: 'image/webp',
        success(result) {
          resolve(result as File);
        },
        error(err) {
          reject(new Error('Ошибка сжатия изображения: ' + err.message));
        },
      });
    });
  };

  // Обработка загрузки изображений
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length + existingImages.length > 5) {
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

  // Обработка выбора категорий
  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    if (checked) {
      setCategoryIds((prev) => [...prev, categoryId]);
    } else {
      setCategoryIds((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  // Обработка выбора подкатегорий
  const handleSubcategoryChange = (subcategoryId: number, checked: boolean) => {
    if (checked) {
      setSubcategoryIds((prev) => [...prev, subcategoryId]);
    } else {
      setSubcategoryIds((prev) => prev.filter((id) => id !== subcategoryId));
    }
  };

  // Переключение аккордеона
  const toggleAccordion = (section: keyof typeof accordionOpen) => {
    setAccordionOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Проверка авторизации...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <CSRFToken>
      {(csrfToken) => (
        <motion.div
          className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Редактировать товар #{id}</h1>
            <motion.button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              aria-label="Вернуться к списку товаров"
            >
              Назад
            </motion.button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(csrfToken);
            }}
            className="space-y-6"
          >
            {/* Основная информация */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                type="button"
                onClick={() => toggleAccordion('main')}
                className="w-full flex justify-between items-center p-4 text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Основная информация
                {accordionOpen.main ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <AnimatePresence>
                {accordionOpen.main && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 space-y-4"
                  >
                    <div>
                      <label htmlFor="title" className="block mb-1 text-sm font-medium text-gray-600">
                        Название
                      </label>
                      <motion.input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.title ? 'border-red-500' : ''
                        }`}
                        placeholder="Введите название товара (мин. 3 символа)"
                        required
                        aria-describedby="title-desc"
                        whileFocus={{ scale: 1.02 }}
                      />
                      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                      <p id="title-desc" className="text-xs text-gray-500 mt-1">
                        Название товара, отображаемое на сайте.
                      </p>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-600">
                        Категории
                      </label>
                      {isCategoriesLoading ? (
                        <p className="text-gray-500 text-sm">Загрузка категорий...</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {categories.map((cat) => (
                            <label key={cat.id} className="flex items-center text-sm">
                              <input
                                type="checkbox"
                                checked={categoryIds.includes(cat.id)}
                                onChange={(e) => handleCategoryChange(cat.id, e.target.checked)}
                                className="mr-2"
                              />
                              {cat.name}
                            </label>
                          ))}
                        </div>
                      )}
                      {errors.categoryIds && <p className="text-red-500 text-xs mt-1">{errors.categoryIds}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        Выберите категории для товара.
                      </p>
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-600">
                        Подкатегории
                      </label>
                      {filteredSubcategories.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                          Выберите категории, чтобы увидеть доступные подкатегории.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {filteredSubcategories.map((sub) => (
                            <label key={sub.id} className="flex items-center text-sm">
                              <input
                                type="checkbox"
                                checked={subcategoryIds.includes(sub.id)}
                                onChange={(e) => handleSubcategoryChange(sub.id, e.target.checked)}
                                className="mr-2"
                              />
                              {sub.name}
                            </label>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Выберите подкатегории для товара (опционально).
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Цены и скидки */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                type="button"
                onClick={() => toggleAccordion('pricing')}
                className="w-full flex justify-between items-center p-4 text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Цены и скидки
                {accordionOpen.pricing ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <AnimatePresence>
                {accordionOpen.pricing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 space-y-4"
                  >
                    <div>
                      <label htmlFor="price" className="block mb-1 text-sm font-medium text-gray-600">
                        Цена (₽)
                      </label>
                      <motion.input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.price ? 'border-red-500' : ''
                        }`}
                        placeholder="Введите цену"
                        required
                        min="0.01"
                        step="0.01"
                        aria-describedby="price-desc"
                        whileFocus={{ scale: 1.02 }}
                      />
                      {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                      <p id="price-desc" className="text-xs text-gray-500 mt-1">
                        Текущая цена товара в рублях.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="originalPrice" className="block mb-1 text-sm font-medium text-gray-600">
                        Старая цена (₽)
                      </label>
                      <motion.input
                        id="originalPrice"
                        type="number"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value)}
                        className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.originalPrice ? 'border-red-500' : ''
                        }`}
                        placeholder="Введите старую цену"
                        required
                        min="0.01"
                        step="0.01"
                        aria-describedby="originalPrice-desc"
                        whileFocus={{ scale: 1.02 }}
                      />
                      {errors.originalPrice && <p className="text-red-500 text-xs mt-1">{errors.originalPrice}</p>}
                      <p id="originalPrice-desc" className="text-xs text-gray-500 mt-1">
                        Цена до скидки (для отображения скидки).
                      </p>
                    </div>
                    <div>
                      <label htmlFor="discountPercent" className="block mb-1 text-sm font-medium text-gray-600">
                        Скидка (%)
                      </label>
                      <motion.input
                        id="discountPercent"
                        type="number"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.discountPercent ? 'border-red-500' : ''
                        }`}
                        placeholder="Введите скидку (0-100)"
                        min="0"
                        max="100"
                        step="1"
                        aria-describedby="discountPercent-desc"
                        whileFocus={{ scale: 1.02 }}
                      />
                      {errors.discountPercent && (
                        <p className="text-red-500 text-xs mt-1">{errors.discountPercent}</p>
                      )}
                      <p id="discountPercent-desc" className="text-xs text-gray-500 mt-1">
                        Процент скидки (если применимо).
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Описание */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                type="button"
                onClick={() => toggleAccordion('description')}
                className="w-full flex justify-between items-center p-4 text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Описание
                {accordionOpen.description ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <AnimatePresence>
                {accordionOpen.description && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 space-y-4"
                  >
                    <div>
                      <label htmlFor="shortDesc" className="block mb-1 text-sm font-medium text-gray-600">
                        Краткое описание
                      </label>
                      <motion.textarea
                        id="shortDesc"
                        value={shortDesc}
                        onChange={(e) => setShortDesc(e.target.value)}
                        className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Введите краткое описание"
                        rows={3}
                        aria-describedby="shortDesc-desc"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <p id="shortDesc-desc" className="text-xs text-gray-500 mt-1">
                        Краткое описание для карточки товара.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-600">
                        Полное описание
                      </label>
                      <motion.textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Введите полное описание"
                        rows={5}
                        aria-describedby="description-desc"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <p id="description-desc" className="text-xs text-gray-500 mt-1">
                        Подробное описание товара.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="composition" className="block mb-1 text-sm font-medium text-gray-600">
                        Состав
                      </label>
                      <motion.textarea
                        id="composition"
                        value={composition}
                        onChange={(e) => setComposition(e.target.value)}
                        className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Введите состав"
                        rows={3}
                        aria-describedby="composition-desc"
                        whileFocus={{ scale: 1.02 }}
                      />
                      <p id="composition-desc" className="text-xs text-gray-500 mt-1">
                        Состав товара (например, ингредиенты).
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Изображения и настройки */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                type="button"
                onClick={() => toggleAccordion('images')}
                className="w-full flex justify-between items-center p-4 text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Изображения и настройки
                {accordionOpen.images ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <AnimatePresence>
                {accordionOpen.images && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 space-y-4"
                  >
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-600">
                        Существующие изображения
                      </label>
                      {existingImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                          {existingImages.map((url, index) => (
                            <motion.div
                              key={index}
                              className="relative"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <img
                                src={url}
                                alt={`Изображение ${index + 1}`}
                                className="w-full h-32 object-cover rounded-md"
                                loading="lazy"
                              />
                              <motion.button
                                type="button"
                                onClick={() => handleRemoveImage(url)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                                whileHover={{ scale: 1.1 }}
                                aria-label={`Удалить изображение ${index + 1}`}
                              >
                                <X size={16} />
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Изображения отсутствуют</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="images" className="block mb-1 text-sm font-medium text-gray-600">
                        Добавить новые изображения
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="images"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon size={24} className="text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              Перетащите изображения или кликните для выбора (макс. 5)
                            </p>
                          </div>
                          <input
                            id="images"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            aria-describedby="images-desc"
                          />
                        </label>
                      </div>
                      <p id="images-desc" className="text-xs text-gray-500 mt-1">
                        Поддерживаются JPEG, PNG, WebP. Максимум 5MB на файл.
                      </p>
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                          {imagePreviews.map((url, index) => (
                            <motion.div
                              key={index}
                              className="relative"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <img
                                src={url}
                                alt={`Новое изображение ${index + 1}`}
                                className="w-full h-32 object-cover rounded-md"
                                loading="lazy"
                              />
                              <motion.button
                                type="button"
                                onClick={() => {
                                  setImages((prev) => prev.filter((_, i) => i !== index));
                                  setImagePreviews((prev) => prev.filter((_, i) => i !== index));
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                                whileHover={{ scale: 1.1 }}
                                aria-label={`Удалить новое изображение ${index + 1}`}
                              >
                                <X size={16} />
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label htmlFor="inStock" className="flex items-center text-sm">
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
                      <label htmlFor="isVisible" className="flex items-center text-sm">
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
                      <label htmlFor="isPopular" className="flex items-center text-sm">
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
                    </div>
                    <p id="inStock-desc" className="text-xs text-gray-500 mt-1">
                      Настройки отображения и доступности товара.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-black text-white rounded-md hover:opacity-90 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed text-sm"
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                aria-label="Сохранить изменения"
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Отмена"
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