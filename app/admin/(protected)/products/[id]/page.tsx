'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import CSRFToken from '@components/CSRFToken';
import Compressor from 'compressorjs';
import { motion } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import type { Database } from '@/lib/supabase/types_new';

type Product = {
  id: number;
  title: string;
  price: number;
  original_price?: number | null;
  discount_percent: number | null;
  production_time: number | null;
  short_desc: string;
  description: string;
  composition: string;
  bonus: number;
  images: string[];
  in_stock: boolean;
  is_visible: boolean;
  is_popular: boolean;
  order_index: number;
  created_at: string | null;
  image_url: string | null;
  slug: string | null;
  category_ids: number[];
  subcategory_ids: number[];
};

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

const SortableImage = ({
  image,
  onRemove,
  isExisting,
  url,
}: {
  image?: ImageFile;
  onRemove: (id: string) => void;
  isExisting: boolean;
  url?: string;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image?.id || url! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-24 h-24">
        {isExisting ? (
          <Image
            src={url!}
            alt="Existing Image"
            fill
            className="object-cover rounded-lg"
          />
        ) : (
          <Image
            src={URL.createObjectURL(image!.file)}
            alt={image!.file.name}
            fill
            className="object-cover rounded-lg"
          />
        )}
        <button
          onClick={() => onRemove(image?.id || url!)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          aria-label={`Удалить изображение ${image?.file.name || url}`}
        >
          <Trash2 size={16} />
        </button>
        <div {...attributes} {...listeners} className="absolute top-1 left-1 cursor-grab">
          <GripVertical size={16} className="text-gray-500" />
        </div>
      </div>
    </motion.div>
  );
};

export default function EditProductPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

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
  const [productionTime, setProductionTime] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [bonus, setBonus] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        router.push(`/admin/login?from=${encodeURIComponent(`/admin/products/${id}`)}`);
      }
    };
    checkAuth();
  }, [router, id]);

  // Загрузка категорий и подкатегорий
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

  // Загрузка данных товара
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadProduct = async () => {
      if (!id) {
        toast.error('Ошибка: ID товара не указан');
        router.push('/admin/products');
        return;
      }

      const productId = parseInt(id, 10);
      if (isNaN(productId)) {
        toast.error('Ошибка: Неверный ID товара');
        router.push('/admin/products');
        return;
      }

      // Загружаем данные товара
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, title, price, original_price, discount_percent, production_time, short_desc, description, composition, bonus, images, in_stock, is_visible, is_popular, order_index, created_at, image_url, slug')
        .eq('id', productId)
        .single();

      if (productError) {
        process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки товара:', productError);
        toast.error('Ошибка загрузки товара: ' + productError.message);
        router.push('/admin/products');
        return;
      }

      if (!productData) {
        toast.error('Товар не найден');
        router.push('/admin/products');
        return;
      }

      // Загружаем категории товара
      const { data: categoryData, error: categoryError } = await supabase
        .from('product_categories')
        .select('category_id')
        .eq('product_id', productId);

      if (categoryError) {
        process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки категорий:', categoryError);
        toast.error('Ошибка загрузки категорий: ' + categoryError.message);
        router.push('/admin/products');
        return;
      }

      const categoryIds = categoryData.map(item => item.category_id);

      // Загружаем подкатегории товара
      const { data: subcategoryData, error: subcategoryError } = await supabase
        .from('product_subcategories')
        .select('subcategory_id')
        .eq('product_id', productId);

      if (subcategoryError) {
        process.env.NODE_ENV !== "production" && console.error('Ошибка загрузки подкатегорий:', subcategoryError);
        toast.error('Ошибка загрузки подкатегорий: ' + subcategoryError.message);
        router.push('/admin/products');
        return;
      }

      const subcategoryIds = subcategoryData.map(item => item.subcategory_id);

      const normalizedData: Product = {
        id: productData.id,
        title: productData.title,
        price: productData.price,
        original_price: productData.original_price ?? null,
        discount_percent: productData.discount_percent ?? null,
        production_time: productData.production_time ?? null,
        short_desc: productData.short_desc ?? '',
        description: productData.description ?? '',
        composition: productData.composition ?? '',
        bonus: productData.bonus ?? 0,
        images: productData.images ?? [],
        in_stock: productData.in_stock ?? true,
        is_popular: productData.is_popular ?? false,
        is_visible: productData.is_visible ?? true,
        order_index: productData.order_index ?? 0,
        created_at: productData.created_at ?? null,
        image_url: productData.image_url ?? null,
        slug: productData.slug ?? null,
        category_ids: categoryIds,
        subcategory_ids: subcategoryIds,
      };

      setProduct(normalizedData);
      setTitle(normalizedData.title);
      setPrice(normalizedData.price.toString());
      setOriginalPrice(normalizedData.original_price?.toString() ?? normalizedData.price.toString());
      setDiscountPercent(normalizedData.discount_percent?.toString() ?? '0');
      setCategoryIds(normalizedData.category_ids);
      setSubcategoryIds(normalizedData.subcategory_ids);
      setProductionTime(normalizedData.production_time?.toString() ?? '');
      setShortDesc(normalizedData.short_desc);
      setDescription(normalizedData.description);
      setComposition(normalizedData.composition);
      setBonus(normalizedData.bonus.toString());
      setExistingImages(normalizedData.images);
      setInStock(normalizedData.in_stock);
      setIsVisible(normalizedData.is_visible);
      setIsPopular(normalizedData.is_popular);
    };

    loadProduct();
  }, [isAuthenticated, id, router]);

  // Фильтрация подкатегорий при выборе категорий
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

  // Обработка изменения списка изображений
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length + images.length + existingImages.length > 7) {
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

    const newImages = files.map(file => ({
      id: uuidv4(),
      file,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = async (id: string, isExisting: boolean) => {
    if (isExisting) {
      try {
        const fileName = decodeURIComponent(id.split('/').pop()!);
        const { error } = await supabase.storage
          .from('product-image')
          .remove([fileName]);

        if (error) {
          throw new Error('Ошибка удаления изображения: ' + error.message);
        }

        setExistingImages((prev) => prev.filter((url) => url !== id));
        toast.success('Изображение удалено');
      } catch (err: any) {
        toast.error('Ошибка: ' + err.message);
      }
    } else {
      setImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const allImages = [
        ...existingImages.map(url => ({ id: url, isExisting: true })),
        ...images.map(img => ({ id: img.id, isExisting: false })),
      ];

      const oldIndex = allImages.findIndex(img => img.id === active.id);
      const newIndex = allImages.findIndex(img => img.id === over.id);
      const newOrder = arrayMove(allImages, oldIndex, newIndex);

      const newExistingImages: string[] = [];
      const newImages: ImageFile[] = [];

      newOrder.forEach(item => {
        if (item.isExisting) {
          newExistingImages.push(item.id);
        } else {
          const img = images.find((img: ImageFile) => img.id === item.id);
          if (img) newImages.push(img);
        }
      });

      setExistingImages(newExistingImages);
      setImages(newImages);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      process.env.NODE_ENV !== "production" && console.log('Starting compression for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        mimeType: 'image/webp',
        success(result) {
          const resultName = result instanceof File ? result.name : 'compressed-image.webp';
          process.env.NODE_ENV !== "production" && console.log('Compression successful:', resultName, 'Size:', result.size);
          resolve(result as File);
        },
        error(err) {
          process.env.NODE_ENV !== "production" && console.error('Compression error:', err.message);
          reject(new Error('Ошибка сжатия изображения: ' + err.message));
        },
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent, csrfToken: string) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!id) {
        throw new Error('ID товара не указан');
      }

      const productId = parseInt(id, 10);
      if (isNaN(productId)) {
        throw new Error('Неверный ID товара');
      }

      if (title.trim().length < 3) {
        throw new Error('Название должно быть ≥ 3 символов');
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Цена должна быть > 0');
      }
      const originalPriceNum = parseFloat(originalPrice);
      if (isNaN(originalPriceNum) || originalPriceNum <= 0) {
        throw new Error('Старая цена должна быть > 0');
      }
      if (categoryIds.length === 0) {
        throw new Error('Необходимо выбрать хотя бы одну категорию');
      }
      const discountNum = discountPercent ? parseFloat(discountPercent) : 0;
      if (discountNum < 0 || discountNum > 100) {
        throw new Error('Скидка должна быть от 0 до 100%');
      }
      const productionTimeNum = productionTime ? parseInt(productionTime) : null;
      if (productionTime && (isNaN(productionTimeNum!) || productionTimeNum! < 0)) {
        throw new Error('Время изготовления должно быть ≥ 0');
      }
      const bonusNum = bonus ? parseFloat(bonus) : 0;
      if (bonus && (isNaN(bonusNum) || bonusNum < 0)) {
        throw new Error('Бонус должен быть ≥ 0');
      }

      // Получаем названия категорий
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name, slug')
        .in('id', categoryIds);

      if (categoriesError || !categoriesData) {
        throw new Error('Ошибка получения категорий: ' + categoriesError.message);
      }

      const categoryNames = categoriesData.map(cat => cat.name).join(', ');
      const categorySlugs = categoriesData.map(cat => cat.slug);

      if (isPopular && categorySlugs.some(slug => ['balloon', 'postcard'].includes(slug))) {
        throw new Error('Шарики и открытки нельзя сделать популярными товарами');
      }

      let imageUrls = [...existingImages];
      if (images.length > 0) {
        for (const image of images) {
          process.env.NODE_ENV !== "production" && console.log('Compressing image:', image.file.name);
          const compressedImage = await compressImage(image.file);
          const fileName = `${uuidv4()}-${compressedImage.name}`;
          process.env.NODE_ENV !== "production" && console.log('Uploading image to Supabase:', fileName);
          const { data, error } = await supabase.storage
            .from('product-image')
            .upload(fileName, compressedImage);

          if (error) {
            throw new Error('Ошибка загрузки изображения: ' + error.message);
          }

          const { data: publicData } = supabase.storage
            .from('product-image')
            .getPublicUrl(fileName);

          if (publicData?.publicUrl) {
            imageUrls.push(publicData.publicUrl);
            process.env.NODE_ENV !== "production" && console.log('Image uploaded:', publicData.publicUrl);
          } else {
            throw new Error('Не удалось получить публичный URL изображения');
          }
        }
      }

      const updatedProduct: Partial<Product> = {
        title: title.trim(),
        price: priceNum,
        original_price: originalPriceNum,
        discount_percent: discountNum,
        production_time: productionTimeNum,
        short_desc: shortDesc.trim(),
        description: description.trim(),
        composition: composition.trim(),
        bonus: bonusNum,
        images: imageUrls,
        in_stock: inStock,
        is_visible: isVisible,
        is_popular: isPopular,
        order_index: product?.order_index ?? 0,
      };

      process.env.NODE_ENV !== "production" && console.log('Updating product with payload:', updatedProduct);

      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          id: productId,
          ...updatedProduct,
          category: categoryNames,
          category_ids: categoryIds,
          subcategory_ids: subcategoryIds,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Ошибка обновления товара');
      }

      process.env.NODE_ENV !== "production" && console.log('Product updated successfully:', json);
      toast.success('Товар успешно обновлён. Изменения в разделе "Популярное" появятся в течение 30 секунд.');
      router.push('/admin/products');
    } catch (err: any) {
      process.env.NODE_ENV !== "production" && console.error('Error updating product:', err);
      toast.error('Ошибка: ' + err.message);
    } finally {
      setLoading(false);
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
          className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 rounded-lg shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-gray-800">Редактировать товар #{id}</h1>
          <form onSubmit={(e) => handleSubmit(e, csrfToken)} className="space-y-8">
            {/* Основная информация */}
            <section className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-700">Основная информация</h2>
              <div>
                <label htmlFor="title" className="block mb-1 font-medium text-gray-600">
                  Название:
                </label>
                <motion.input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Введите название товара (мин. 3 символа)"
                  required
                  aria-describedby="title-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="title-desc" className="text-sm text-gray-500 mt-1">
                  Название товара, отображаемое на сайте.
                </p>
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Категории:
                </label>
                {isCategoriesLoading ? (
                  <p className="text-gray-500">Загрузка категорий...</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={categoryIds.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCategoryIds(prev => [...prev, cat.id]);
                            } else {
                              setCategoryIds(prev => prev.filter(id => id !== cat.id));
                            }
                          }}
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
                <label className="block mb-1 font-medium text-gray-600">
                  Подкатегории:
                </label>
                {filteredSubcategories.length === 0 ? (
                  <p className="text-gray-500">Выберите категории, чтобы увидеть доступные подкатегории.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredSubcategories.map((sub) => (
                      <label key={sub.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={subcategoryIds.includes(sub.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSubcategoryIds(prev => [...prev, sub.id]);
                            } else {
                              setSubcategoryIds(prev => prev.filter(id => id !== sub.id));
                            }
                          }}
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

            {/* Цены, скидки и бонусы */}
            <section className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-700">Цены, скидки и бонусы</h2>
              <div>
                <label htmlFor="price" className="block mb-1 font-medium text-gray-600">
                  Цена (₽):
                </label>
                <motion.input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Введите цену"
                  required
                  min="0.01"
                  step="0.01"
                  aria-describedby="price-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="price-desc" className="text-sm text-gray-500 mt-1">
                  Текущая цена товара в рублях.
                </p>
              </div>
              <div>
                <label htmlFor="originalPrice" className="block mb-1 font-medium text-gray-600">
                  Старая цена (₽):
                </label>
                <motion.input
                  id="originalPrice"
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Введите старую цену"
                  required
                  min="0.01"
                  step="0.01"
                  aria-describedby="originalPrice-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="originalPrice-desc" className="text-sm text-gray-500 mt-1">
                  Цена до скидки (для отображения скидки).
                </p>
              </div>
              <div>
                <label htmlFor="discountPercent" className="block mb-1 font-medium text-gray-600">
                  Скидка (%):
                </label>
                <motion.input
                  id="discountPercent"
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Введите скидку (0-100)"
                  min="0"
                  max="100"
                  step="1"
                  aria-describedby="discountPercent-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="discountPercent-desc" className="text-sm text-gray-500 mt-1">
                  Процент скидки (если применимо).
                </p>
              </div>
              <div>
                <label htmlFor="bonus" className="block mb-1 font-medium text-gray-600">
                  Бонус (₽):
                </label>
                <motion.input
                  id="bonus"
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Введите бонус"
                  min="0"
                  step="0.01"
                  aria-describedby="bonus-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="bonus-desc" className="text-sm text-gray-500 mt-1">
                  Бонус, начисляемый за покупку товара.
                </p>
              </div>
              <div>
                <label htmlFor="productionTime" className="block mb-1 font-medium text-gray-600">
                  Время изготовления (часы):
                </label>
                <motion.input
                  id="productionTime"
                  type="number"
                  value={productionTime}
                  onChange={(e) => setProductionTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Введите время изготовления"
                  min="0"
                  step="1"
                  aria-describedby="productionTime-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="productionTime-desc" className="text-sm text-gray-500 mt-1">
                  Время, необходимое для изготовления товара (в часах).
                </p>
              </div>
            </section>

            {/* Описание */}
            <section className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-700">Описание</h2>
              <div>
                <label htmlFor="shortDesc" className="block mb-1 font-medium text-gray-600">
                  Краткое описание:
                </label>
                <motion.textarea
                  id="shortDesc"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Введите краткое описание"
                  rows={3}
                  aria-describedby="shortDesc-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="shortDesc-desc" className="text-sm text-gray-500 mt-1">
                  Краткое описание для карточки товара.
                </p>
              </div>
              <div>
                <label htmlFor="description" className="block mb-1 font-medium text-gray-600">
                  Полное описание:
                </label>
                <motion.textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Введите полное описание"
                  rows={5}
                  aria-describedby="description-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="description-desc" className="text-sm text-gray-500 mt-1">
                  Подробное описание товара.
                </p>
              </div>
              <div>
                <label htmlFor="composition" className="block mb-1 font-medium text-gray-600">
                  Состав:
                </label>
                <motion.textarea
                  id="composition"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  placeholder="Введите состав"
                  rows={3}
                  aria-describedby="composition-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="composition-desc" className="text-sm text-gray-500 mt-1">
                  Состав товара (например, ингредиенты).
                </p>
              </div>
            </section>

            {/* Изображения и настройки */}
            <section className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-700">Изображения и настройки</h2>
              <div>
                <label className="block mb-1 font-medium text-gray-600">Существующие изображения:</label>
                {existingImages.length + images.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={[...existingImages, ...images.map(img => img.id)]}>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {existingImages.map((url) => (
                          <SortableImage
                            key={url}
                            url={url}
                            onRemove={(id) => handleRemoveImage(id, true)}
                            isExisting={true}
                          />
                        ))}
                        {images.map((image) => (
                          <SortableImage
                            key={image.id}
                            image={image}
                            onRemove={(id) => handleRemoveImage(id, false)}
                            isExisting={false}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <p className="text-gray-500">Изображения отсутствуют</p>
                )}
              </div>
              <div>
                <label htmlFor="images" className="block mb-1 font-medium text-gray-600">
                  Добавить новые изображения:
                </label>
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  aria-describedby="images-desc"
                />
                <p id="images-desc" className="text-sm text-gray-500 mt-1">
                  Выберите изображения товара (максимум 7).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="inStock"
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  aria-describedby="inStock-desc"
                />
                <label htmlFor="inStock" className="font-medium text-gray-600">
                  В наличии
                </label>
                <p id="inStock-desc" className="text-sm text-gray-500">
                  Укажите, доступен ли товар для заказа.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isVisible"
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  aria-describedby="isVisible-desc"
                />
                <label htmlFor="isVisible" className="font-medium text-gray-600">
                  Показать товар
                </label>
                <p id="isVisible-desc" className="text-sm text-gray-500">
                  Укажите, виден ли товар на сайте.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isPopular"
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  aria-describedby="isPopular-desc"
                />
                <label htmlFor="isPopular" className="font-medium text-gray-600">
                  Популярный товар
                </label>
                <p id="isPopular-desc" className="text-sm text-gray-500">
                  Укажите, отображать ли товар в разделе "Популярное".
                </p>
              </div>
            </section>

            {/* Кнопки */}
            <div className="flex gap-4">
              <motion.button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Сохранить изменения"
              >
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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