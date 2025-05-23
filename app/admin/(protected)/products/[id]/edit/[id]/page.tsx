// ✅ Путь: app/admin/(protected)/edit-product/[id]/page.tsx

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
        const res = await fetch('/api/admin-session', { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await res.json();
        console.log('[EditProductPage] Admin session response:', data);
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Доступ запрещён');
        }
        setIsAuthenticated(true);
      } catch (err: any) {
        console.error('[EditProductPage] Auth error:', err.message);
        toast.error('Необходима авторизация администратора');
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
        console.error('Error loading categories:', err);
        toast.error('Ошибка загрузки категорий: ' + err.message);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategoriesAndSubcategories();
  }, [isAuthenticated]);

  // Загрузка данных товара
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const fetchProduct = async () => {
      try {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          throw new Error('Неверный ID товара');
        }

        // Получаем данные товара
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
            bonus,
            production_time
          `)
          .eq('id', numericId)
          .single();

        if (error || !data) {
          throw new Error(error?.message || 'Товар не найден');
        }

        // Получаем категории товара
        const { data: categoryData, error: categoryError } = await supabasePublic
          .from('product_categories')
          .select('category_id')
          .eq('product_id', numericId);

        if (categoryError) {
          throw new Error('Ошибка загрузки категорий товара: ' + categoryError.message);
        }

        const productCategoryIds = categoryData.map((item) => item.category_id);

        // Получаем подкатегории товара
        const { data: subcategoryData, error: subcategoryError } = await supabasePublic
          .from('product_subcategories')
          .select('subcategory_id')
          .eq('product_id', numericId);

        if (subcategoryError) {
          throw new Error('Ошибка загрузки подкатегорий товара: ' + subcategoryError.message);
        }

        const productSubcategoryIds = subcategoryData.map((item) => item.subcategory_id);

        // Заполняем форму данными
        setTitle(data.title || '');
        setPrice(data.price.toString());
        setOriginalPrice(data.original_price?.toString() || data.price.toString());
        setDiscountPercent(data.discount_percent?.toString() || '0');
        setCategoryIds(productCategoryIds);
        setSubcategoryIds(productSubcategoryIds);
        setShortDesc(data.short_desc || '');
        setDescription(data.description || '');
        setComposition(data.composition || '');
        setExistingImages(Array.isArray(data.images) ? data.images : []);
        setInStock(data.in_stock ?? true);
        setIsVisible(data.is_visible ?? true);
        setIsPopular(data.is_popular ?? false);

        console.log('Product data loaded:', {
          id: numericId,
          title: data.title,
          categories: productCategoryIds,
          subcategories: productSubcategoryIds
        });

      } catch (err: any) {
        console.error('Error loading product:', err);
        toast.error(err.message);
        router.push('/admin/products');
      }
    };

    fetchProduct();
  }, [isAuthenticated, id, router]);

  // Фильтрация подкатегорий
  useEffect(() => {
    if (categoryIds.length > 0) {
      const filtered = subcategories.filter((sub) => 
        sub.category_id && categoryIds.includes(sub.category_id)
      );
      setFilteredSubcategories(filtered);
      setSubcategoryIds((prev) => 
        prev.filter((id) => filtered.some((sub) => sub.id === id))
      );
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

  // Отправка формы
  const handleSubmit = async (csrfToken: string) => {
    const toastId = toast.loading('Обновление товара...');
    
    try {
      if (!validateForm()) {
        throw new Error('Пожалуйста, исправьте ошибки в форме');
      }
      
      setLoading(true);

      const priceNum = parseFloat(price);
      const originalPriceNum = parseFloat(originalPrice);
      const discountNum = discountPercent ? parseFloat(discountPercent) : 0;

      // Загружаем новые изображения
      let imageUrls = [...existingImages];
      if (images.length > 0) {
        for (const image of images) {
          console.log('Compressing and uploading image:', image.name);
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
            console.log('Image uploaded successfully:', publicData.publicUrl);
          } else {
            throw new Error('Не удалось получить публичный URL изображения');
          }
        }
      }

      // Отправляем данные на сервер
      const requestBody = {
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
      };

      console.log('Sending PATCH request with data:', requestBody);

      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      console.log('[EditProductPage] PATCH /api/products status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[EditProductPage] PATCH /api/products error response:', errorText);
        
        let errorMessage = 'Ошибка обновления товара';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log('Product updated successfully:', data);

      toast.success('Товар успешно обновлён', { id: toastId });
      router.push('/admin/products');
      
    } catch (err: any) {
      console.error('[EditProductPage] Submit error:', err);
      toast.error('Ошибка: ' + err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Удаление изображения
  const handleRemoveImage = async (imageUrl: string) => {
    try {
      const fileName = decodeURIComponent(imageUrl.split('/').pop()!);
      const { error } = await supabasePublic.storage
        .from('product-image')
        .remove([fileName]);

      if (error) {
        console.error('Storage deletion error:', error);
        // Не блокируем удаление из UI при ошибке Storage
      }

      setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
      toast.success('Изображение удалено');
    } catch (err: any) {
      console.error('Image removal error:', err);
      toast.error('Ошибка удаления изображения: ' + err.message);
    }
  };

  // Обработка загрузки изображений
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const totalImages = files.length + existingImages.length;
    
    if (totalImages > 7) {
      toast.error('Максимум 7 изображений');
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

  // Показываем загрузку до проверки авторизации
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован, ничего не показываем (произойдет редирект)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <CSRFToken>
      {(csrfToken) => (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Заголовок */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Редактировать товар
                  </h1>
                  <p className="text-gray-600 mt-1">ID: {id}</p>
                </div>
                <motion.button
                  type="button"
                  onClick={() => router.push('/admin/products')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  aria-label="Вернуться к списку товаров"
                >
                  ← Назад к товарам
                </motion.button>
              </div>

              {/* Форма */}
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
                    className="w-full flex justify-between items-center p-6 text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
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
                        className="px-6 pb-6 space-y-4"
                      >
                        {/* Название */}
                        <div>
                          <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700">
                            Название товара <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                              errors.title ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Введите название товара (мин. 3 символа)"
                            required
                          />
                          {errors.title && (
                            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                          )}
                        </div>

                        {/* Категории */}
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            Категории <span className="text-red-500">*</span>
                          </label>
                          {isCategoriesLoading ? (
                            <p className="text-gray-500">Загрузка категорий...</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {categories.map((cat) => (
                                <label key={cat.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={categoryIds.includes(cat.id)}
                                    onChange={(e) => handleCategoryChange(cat.id, e.target.checked)}
                                    className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-700">{cat.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {errors.categoryIds && (
                            <p className="text-red-500 text-sm mt-1">{errors.categoryIds}</p>
                          )}
                        </div>

                        {/* Подкатегории */}
                        {filteredSubcategories.length > 0 && (
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                              Подкатегории
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {filteredSubcategories.map((sub) => (
                                <label key={sub.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={subcategoryIds.includes(sub.id)}
                                    onChange={(e) => handleSubcategoryChange(sub.id, e.target.checked)}
                                    className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-700">{sub.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Цены и скидки */}
                <section className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('pricing')}
                    className="w-full flex justify-between items-center p-6 text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
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
                        className="px-6 pb-6 space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Цена */}
                          <div>
                            <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-700">
                              Цена (₽) <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="price"
                              type="number"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                                errors.price ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="0"
                              required
                              min="0.01"
                              step="0.01"
                            />
                            {errors.price && (
                              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                            )}
                          </div>

                          {/* Старая цена */}
                          <div>
                            <label htmlFor="originalPrice" className="block mb-2 text-sm font-medium text-gray-700">
                              Старая цена (₽) <span className="text-red-500">*</span>
                            </label>
                            <input
                              id="originalPrice"
                              type="number"
                              value={originalPrice}
                              onChange={(e) => setOriginalPrice(e.target.value)}
                              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                                errors.originalPrice ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="0"
                              required
                              min="0.01"
                              step="0.01"
                            />
                            {errors.originalPrice && (
                              <p className="text-red-500 text-sm mt-1">{errors.originalPrice}</p>
                            )}
                          </div>

                          {/* Скидка */}
                          <div>
                            <label htmlFor="discountPercent" className="block mb-2 text-sm font-medium text-gray-700">
                              Скидка (%)
                            </label>
                            <input
                              id="discountPercent"
                              type="number"
                              value={discountPercent}
                              onChange={(e) => setDiscountPercent(e.target.value)}
                              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                                errors.discountPercent ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="0"
                              min="0"
                              max="100"
                              step="1"
                            />
                            {errors.discountPercent && (
                              <p className="text-red-500 text-sm mt-1">{errors.discountPercent}</p>
                            )}
                          </div>
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
                    className="w-full flex justify-between items-center p-6 text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
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
                        className="px-6 pb-6 space-y-4"
                      >
                        {/* Краткое описание */}
                        <div>
                          <label htmlFor="shortDesc" className="block mb-2 text-sm font-medium text-gray-700">
                            Краткое описание
                          </label>
                          <textarea
                            id="shortDesc"
                            value={shortDesc}
                            onChange={(e) => setShortDesc(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                            placeholder="Краткое описание для карточки товара"
                            rows={3}
                          />
                        </div>

                        {/* Полное описание */}
                        <div>
                          <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
                            Полное описание
                          </label>
                          <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                            placeholder="Подробное описание товара"
                            rows={5}
                          />
                        </div>

                        {/* Состав */}
                        <div>
                          <label htmlFor="composition" className="block mb-2 text-sm font-medium text-gray-700">
                            Состав
                          </label>
                          <textarea
                            id="composition"
                            value={composition}
                            onChange={(e) => setComposition(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                            placeholder="Состав товара (например, ингредиенты)"
                            rows={3}
                          />
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
                    className="w-full flex justify-between items-center p-6 text-lg font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
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
                        className="px-6 pb-6 space-y-6"
                      >
                        {/* Существующие изображения */}
                        <div>
                          <label className="block mb-3 text-sm font-medium text-gray-700">
                            Текущие изображения
                          </label>
                          {existingImages.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {existingImages.map((url, index) => (
                                <motion.div
                                  key={index}
                                  className="relative group"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                      src={url}
                                      alt={`Изображение ${index + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      loading="lazy"
                                    />
                                  </div>
                                  <motion.button
                                    type="button"
                                    onClick={() => handleRemoveImage(url)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    aria-label={`Удалить изображение ${index + 1}`}
                                  >
                                    <X size={14} />
                                  </motion.button>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
                              <p className="text-gray-500">Изображения отсутствуют</p>
                            </div>
                          )}
                        </div>

                        {/* Добавить новые изображения */}
                        <div>
                          <label htmlFor="images" className="block mb-3 text-sm font-medium text-gray-700">
                            Добавить новые изображения
                          </label>
                          <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="images"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <ImageIcon size={32} className="text-gray-400 mb-3" />
                                <p className="text-sm text-gray-500 text-center">
                                  <span className="font-medium">Нажмите для выбора</span> или перетащите файлы
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  JPEG, PNG, WebP (макс. 5MB каждый)
                                </p>
                              </div>
                              <input
                                id="images"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                          
                          {/* Предварительный просмотр новых изображений */}
                          {imagePreviews.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700 mb-3">Новые изображения:</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {imagePreviews.map((url, index) => (
                                  <motion.div
                                    key={index}
                                    className="relative group"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                      <img
                                        src={url}
                                        alt={`Новое изображение ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        loading="lazy"
                                      />
                                    </div>
                                    <motion.button
                                      type="button"
                                      onClick={() => {
                                        setImages((prev) => prev.filter((_, i) => i !== index));
                                      }}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      aria-label={`Удалить новое изображение ${index + 1}`}
                                    >
                                      <X size={14} />
                                    </motion.button>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Настройки товара */}
                        <div>
                          <label className="block mb-3 text-sm font-medium text-gray-700">
                            Настройки товара
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={inStock}
                                onChange={(e) => setInStock(e.target.checked)}
                                className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-700">В наличии</span>
                                <p className="text-xs text-gray-500">Товар доступен для заказа</p>
                              </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={(e) => setIsVisible(e.target.checked)}
                                className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Отображать</span>
                                <p className="text-xs text-gray-500">Показывать на сайте</p>
                              </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isPopular}
                                onChange={(e) => setIsPopular(e.target.checked)}
                                className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-700">Популярный</span>
                                <p className="text-xs text-gray-500">В разделе "Популярное"</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Кнопки управления */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-6 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Сохранение...
                      </div>
                    ) : (
                      'Сохранить изменения'
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => router.push('/admin/products')}
                    className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Отмена
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </CSRFToken>
  );
}