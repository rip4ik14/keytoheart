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

type Product = Database['public']['Tables']['products']['Row'];

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
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
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

      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, original_price, discount_percent, category, category_id, subcategory_id, production_time, short_desc, description, composition, bonus, images, in_stock, is_visible, is_popular, order_index, created_at, image_url, slug')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Ошибка загрузки товара:', error);
        toast.error('Ошибка загрузки товара: ' + error.message);
        router.push('/admin/products');
        return;
      }

      if (!data) {
        toast.error('Товар не найден');
        router.push('/admin/products');
        return;
      }

      const normalizedData: Product = {
        bonus: data.bonus ?? 0,
        category: data.category ?? '',
        category_id: data.category_id ?? null,
        composition: data.composition ?? '',
        created_at: data.created_at ?? null,
        description: data.description ?? '',
        discount_percent: data.discount_percent ?? null,
        id: data.id,
        image_url: data.image_url ?? null,
        images: data.images ?? [],
        in_stock: data.in_stock ?? true,
        is_popular: data.is_popular ?? false,
        is_visible: data.is_visible ?? true,
        original_price: data.original_price ?? null,
        price: data.price,
        production_time: data.production_time ?? null,
        short_desc: data.short_desc ?? '',
        slug: data.slug ?? null,
        subcategory_id: data.subcategory_id ?? null,
        title: data.title,
        order_index: data.order_index ?? 0,
      };

      if (normalizedData.category_id === null) {
        toast.error('Категория товара не указана');
        router.push('/admin/products');
        return;
      }

      // Явное преобразование значений для устранения ошибок TypeScript
      const shortDescValue: string = normalizedData.short_desc ?? '';
      const descriptionValue: string = normalizedData.description ?? '';
      const compositionValue: string = normalizedData.composition ?? '';
      const imagesValue: string[] = normalizedData.images ?? [];
      const inStockValue: boolean = normalizedData.in_stock ?? true;
      const isVisibleValue: boolean = normalizedData.is_visible ?? true;
      const isPopularValue: boolean = normalizedData.is_popular ?? false;

      setProduct(normalizedData);
      setTitle(normalizedData.title);
      setPrice(normalizedData.price.toString());
      setOriginalPrice(normalizedData.original_price?.toString() ?? normalizedData.price.toString());
      setDiscountPercent(normalizedData.discount_percent?.toString() ?? '0');
      setCategoryId(normalizedData.category_id);
      setSubcategoryId(normalizedData.subcategory_id);
      setProductionTime(normalizedData.production_time?.toString() ?? '');
      setShortDesc(shortDescValue);
      setDescription(descriptionValue);
      setComposition(compositionValue);
      setBonus(normalizedData.bonus?.toString() ?? '0');
      setExistingImages(imagesValue);
      setInStock(inStockValue);
      setIsVisible(isVisibleValue);
      setIsPopular(isPopularValue);
    };

    loadProduct();
  }, [isAuthenticated, id, router]);

  // Фильтрация подкатегорий при выборе категории
  useEffect(() => {
    if (categoryId) {
      const filtered = subcategories.filter((sub) => sub.category_id === categoryId);
      setFilteredSubcategories(filtered);
      if (product) {
        setSubcategoryId(product.subcategory_id);
      } else {
        setSubcategoryId(null);
      }
    } else {
      setFilteredSubcategories([]);
      setSubcategoryId(null);
    }
  }, [categoryId, subcategories, product]);

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
          else return; // Пропускаем, если img не найден
        }
      });

      setExistingImages(newExistingImages);
      setImages(newImages);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      console.log('Starting compression for file:', file.name, 'Size:', file.size, 'Type:', file.type);
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        mimeType: 'image/webp',
        success(result) {
          const resultName = result instanceof File ? result.name : 'compressed-image.webp';
          console.log('Compression successful:', resultName, 'Size:', result.size);
          resolve(result as File);
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
      if (!categoryId) {
        throw new Error('Категория обязательна');
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

      const sanitizedTitle = title.trim();
      const sanitizedShortDesc = shortDesc.trim();
      const sanitizedDescription = description.trim();
      const sanitizedComposition = composition.trim();

      let imageUrls = [...existingImages];
      if (images.length > 0) {
        for (const image of images) {
          console.log('Compressing image:', image.file.name);
          const compressedImage = await compressImage(image.file);
          const fileName = `${uuidv4()}-${compressedImage.name}`;
          console.log('Uploading image to Supabase:', fileName);
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
            console.log('Image uploaded:', publicData.publicUrl);
          } else {
            throw new Error('Не удалось получить публичный URL изображения');
          }
        }
      }

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('id', categoryId)
        .single();

      if (categoryError || !categoryData) {
        throw new Error('Категория не найдена');
      }

      const categoryName = categoryData.name;
      const categorySlug = categoryData.slug;

      if (isPopular && ['balloon', 'postcard'].includes(categorySlug)) {
        throw new Error('Шарики и открытки нельзя сделать популярными товарами');
      }

      const updatedProduct: Partial<Product> = {
        title: sanitizedTitle,
        price: priceNum,
        original_price: originalPriceNum,
        discount_percent: discountNum,
        category: categoryName,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        production_time: productionTimeNum,
        short_desc: sanitizedShortDesc,
        description: sanitizedDescription,
        composition: sanitizedComposition,
        bonus: bonusNum,
        images: imageUrls,
        in_stock: inStock,
        is_visible: isVisible,
        is_popular: isPopular,
        order_index: product?.order_index ?? 0,
      };

      console.log('Updating product with payload:', updatedProduct);

      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          id: productId,
          ...updatedProduct,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Ошибка обновления товара');
      }

      console.log('Product updated successfully:', json);
      toast.success('Товар успешно обновлён. Изменения в разделе "Популярное" появятся в течение 30 секунд.');
      router.push('/admin/products');
    } catch (err: any) {
      console.error('Error updating product:', err);
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
                <label htmlFor="category" className="block mb-1 font-medium text-gray-600">
                  Категория:
                </label>
                {isCategoriesLoading ? (
                  <p className="text-gray-500">Загрузка категорий...</p>
                ) : (
                  <motion.select
                    id="category"
                    value={categoryId || ''}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    required
                    aria-describedby="category-desc"
                    whileFocus={{ scale: 1.01 }}
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
                <label htmlFor="subcategory" className="block mb-1 font-medium text-gray-600">
                  Подкатегория:
                </label>
                <motion.select
                  id="subcategory"
                  value={subcategoryId ?? ''}
                  onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  disabled={!categoryId || filteredSubcategories.length === 0}
                  aria-describedby="subcategory-desc"
                  whileFocus={{ scale: 1.01 }}
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