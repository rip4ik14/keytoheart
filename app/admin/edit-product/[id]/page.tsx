'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase/public';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import CSRFToken from '@components/CSRFToken';
import Compressor from 'compressorjs';
import { motion } from 'framer-motion';

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
  const [productionTime, setProductionTime] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin-session', {
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Доступ запрещён: требуется роль администратора');
        }
        setIsAuthenticated(true);
      } catch (err: any) {
        toast.error('Доступ запрещён: требуется роль администратора');
        setTimeout(() => {
          router.push(`/admin/login?from=${encodeURIComponent(`/admin/edit-product/${id}`)}`);
        }, 100);
      }
    };
    checkAuth();
  }, [router, id]);

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

  // Загрузка данных товара
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabasePublic
          .from('products')
          .select(
            'id, title, price, original_price, short_desc, description, composition, images, in_stock, is_visible, is_popular, discount_percent, production_time'
          )
          .eq('id', parseInt(id))
          .single();
        if (error) throw new Error('Ошибка загрузки товара: ' + error.message);
        if (!data) throw new Error('Товар не найден');

        // Получаем связанные категории
        const { data: categoryData, error: categoryError } = await supabasePublic
          .from('product_categories')
          .select('category_id')
          .eq('product_id', parseInt(id));
        if (categoryError) throw new Error('Ошибка загрузки категорий товара: ' + categoryError.message);
        const productCategoryIds = categoryData.map(item => item.category_id);

        // Получаем связанные подкатегории
        const { data: subcategoryData, error: subcategoryError } = await supabasePublic
          .from('product_subcategories')
          .select('subcategory_id')
          .eq('product_id', parseInt(id));
        if (subcategoryError) throw new Error('Ошибка загрузки подкатегорий товара: ' + subcategoryError.message);
        const productSubcategoryIds = subcategoryData.map(item => item.subcategory_id);

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
        };

        setProduct(normalizedData);
        setTitle(normalizedData.title);
        setPrice(normalizedData.price.toString());
        setOriginalPrice(
          normalizedData.original_price !== null
            ? normalizedData.original_price.toString()
            : normalizedData.price.toString()
        );
        setDiscountPercent(normalizedData.discount_percent ? normalizedData.discount_percent.toString() : '0');
        setCategoryIds(normalizedData.category_ids);
        setSubcategoryIds(normalizedData.subcategory_ids);
        setShortDesc(normalizedData.short_desc ?? '');
        setDescription(normalizedData.description ?? '');
        setComposition(normalizedData.composition ?? '');
        setProductionTime(normalizedData.production_time !== null ? normalizedData.production_time.toString() : '');
        setExistingImages(normalizedData.images);
        setInStock(normalizedData.in_stock);
        setIsVisible(normalizedData.is_visible);
        setIsPopular(normalizedData.is_popular);
      } catch (err: any) {
        toast.error(err.message);
        router.push('/admin/products');
      }
    };
    fetchProduct();
  }, [isAuthenticated, id, router]);

  // Фильтрация подкатегорий на основе выбранных категорий
  useEffect(() => {
    if (categoryIds.length > 0) {
      const filtered = subcategories.filter((sub) => sub.category_id && categoryIds.includes(sub.category_id));
      setFilteredSubcategories(filtered);
      setSubcategoryIds(prev => prev.filter(id => filtered.some(sub => sub.id === id)));
    } else {
      setFilteredSubcategories([]);
      setSubcategoryIds([]);
    }
  }, [categoryIds, subcategories]);

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent, csrfToken: string) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (title.trim().length < 3) throw new Error('Название должно быть ≥ 3 символов');
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) throw new Error('Цена должна быть > 0');
      const originalPriceNum = parseFloat(originalPrice);
      if (isNaN(originalPriceNum) || originalPriceNum <= 0) throw new Error('Старая цена должна быть > 0');
      if (categoryIds.length === 0) throw new Error('Необходимо выбрать хотя бы одну категорию');
      const discountNum = discountPercent ? parseFloat(discountPercent) : 0;
      if (discountNum < 0 || discountNum > 100) throw new Error('Скидка должна быть от 0 до 100%');
      const productionTimeNum =
        productionTime && !isNaN(Number(productionTime)) ? Number(productionTime) : null;

      // Получаем названия категорий
      const { data: categoriesData, error: categoriesError } = await supabasePublic
        .from('categories')
        .select('name')
        .in('id', categoryIds);
      if (categoriesError || !categoriesData) throw new Error('Ошибка получения названий категорий: ' + categoriesError.message);
      const categoryNames = categoriesData.map(cat => cat.name).join(', ');

      let imageUrls = [...existingImages];
      if (images.length > 0) {
        for (const image of images) {
          const compressedImage = await compressImage(image);
          const fileName = `${uuidv4()}-${compressedImage.name}`;
          const { error } = await supabasePublic.storage
            .from('product-image')
            .upload(fileName, compressedImage);
          if (error) throw new Error('Ошибка загрузки изображения: ' + error.message);

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

      // Обновление товара через API
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          id: parseInt(id),
          title: title.trim(),
          price: priceNum,
          original_price: originalPriceNum,
          category: categoryNames,
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
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ошибка обновления товара');

      toast.success('Товар успешно обновлён. Изменения появятся на сайте в течение 30 секунд.');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Удаление существующего изображения
  const handleRemoveImage = async (imageUrl: string) => {
    try {
      const fileName = decodeURIComponent(imageUrl.split('/').pop()!);
      const { error } = await supabasePublic.storage
        .from('product-image')
        .remove([fileName]);
      if (error) throw new Error('Ошибка удаления изображения: ' + error.message);
      setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
      toast.success('Изображение удалено');
    } catch (err: any) {
      toast.error('Ошибка: ' + err.message);
    }
  };

  // Обработка сжатия изображения
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

  // Обработка изменения списка изображений
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 5) {
      toast.error('Максимум 5 изображений');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (files.some((file) => file.size > maxSize)) {
      toast.error('Некоторые файлы превышают 5MB');
      return;
    }
    if (files.some((file) => !allowedTypes.includes(file.type))) {
      toast.error('Поддерживаются только JPEG, PNG, WebP');
      return;
    }
    setImages(files);
  };

  // Обработчик выбора категорий
  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    if (checked) {
      setCategoryIds(prev => [...prev, categoryId]);
    } else {
      setCategoryIds(prev => prev.filter(id => id !== categoryId));
    }
  };

  // Обработчик выбора подкатегорий
  const handleSubcategoryChange = (subcategoryId: number, checked: boolean) => {
    if (checked) {
      setSubcategoryIds(prev => [...prev, subcategoryId]);
    } else {
      setSubcategoryIds(prev => prev.filter(id => id !== subcategoryId));
    }
  };

  if (isAuthenticated === null || !product) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <CSRFToken>
      {(csrfToken) => (
        <motion.div
          className="max-w-6xl mx-auto p-6 space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold">Редактировать товар #{id}</h1>
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
                  whileFocus={{ scale: 1.02 }}
                />
                <p id="title-desc" className="text-sm text-gray-500 mt-1">
                  Название товара, отображаемое на сайте.
                </p>
              </div>
              <div>
                <label className="block mb-1 font-medium">Категории:</label>
                {isCategoriesLoading ? (
                  <p className="text-gray-500">Загрузка категорий...</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center">
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
                <p className="text-sm text-gray-500 mt-1">
                  Выберите категории для товара.
                </p>
              </div>
              <div>
                <label className="block mb-1 font-medium">Подкатегории:</label>
                {filteredSubcategories.length === 0 ? (
                  <p className="text-gray-500">Выберите категории, чтобы увидеть доступные подкатегории.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredSubcategories.map((sub) => (
                      <label key={sub.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={subcategoryIds.includes(sub.id)}
                          onChange={(e) => handleSubcategoryChange(sub.id, e.target.checked)}
                          className="mr-2"
                        />
                        {sub.name} (Категория: {categories.find(cat => cat.id === sub.category_id)?.name})
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Выберите подкатегории для товара (опционально).
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
              <div>
                <label htmlFor="productionTime" className="block mb-1 font-medium">
                  Время изготовления (минут):
                </label>
                <motion.input
                  id="productionTime"
                  type="number"
                  value={productionTime}
                  onChange={(e) => setProductionTime(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите время изготовления (например, 60)"
                  min="0"
                  step="1"
                  aria-describedby="productionTime-desc"
                  whileFocus={{ scale: 1.02 }}
                />
                <p id="productionTime-desc" className="text-sm text-gray-500 mt-1">
                  Сколько минут потребуется на изготовление (может отображаться клиенту).
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
                <p id="composition-desc" className="text.sm text-gray-500 mt-1">
                  Состав товара (например, ингредиенты).
                </p>
              </div>
            </section>

            {/* Изображения и настройки */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Изображения и настройки</h2>
              <div>
                <label className="block mb-1 font-medium">Существующие изображения:</label>
                {existingImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 mb-4">
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
                          alt={`Image ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <motion.button
                          type="button"
                          onClick={() => handleRemoveImage(url)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          whileHover={{ scale: 1.1 }}
                          aria-label={`Удалить изображение ${index + 1}`}
                        >
                          ×
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Изображения отсутствуют</p>
                )}
              </div>
              <div>
                <label htmlFor="images" className="block mb-1 font-medium">
                  Добавить новые изображения:
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
                    <p>Выбрано новых изображений: {images.length}</p>
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
                aria-label="Сохранить изменения"
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
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
