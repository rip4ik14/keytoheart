'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

const SortableImage = ({ image, onRemove }: { image: ImageFile; onRemove: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id });

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
        <Image
          src={URL.createObjectURL(image.file)}
          alt={image.file.name}
          fill
          className="object-cover rounded-lg"
        />
        <button
          onClick={() => onRemove(image.id)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          aria-label={`Удалить изображение ${image.file.name}`}
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

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]); // Массив категорий
  const [subcategoryIds, setSubcategoryIds] = useState<number[]>([]); // Массив подкатегорий
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [productionTime, setProductionTime] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [composition, setComposition] = useState('');
  const [bonus, setBonus] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [inStock, setInStock] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

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

  // Фильтрация подкатегорий при выборе категорий
  useEffect(() => {
    if (categoryIds.length > 0) {
      const filtered = subcategories.filter((sub) => sub.category_id && categoryIds.includes(sub.category_id));
      setFilteredSubcategories(filtered);
      // Сбрасываем подкатегории, если выбранные подкатегории больше не принадлежат текущим категориям
      setSubcategoryIds(prev => prev.filter(id => filtered.some(sub => sub.id === id)));
    } else {
      setFilteredSubcategories([]);
      setSubcategoryIds([]);
    }
  }, [categoryIds, subcategories]);

  // Обновление списка изображений
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length + images.length > 7) {
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

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setImages(prev => {
        const oldIndex = prev.findIndex(img => img.id === active.id);
        const newIndex = prev.findIndex(img => img.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
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
    setBonus('');
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
        categoryIds,
        subcategoryIds,
        productionTime,
        shortDesc,
        description,
        composition,
        bonus,
        images,
        inStock,
        isVisible,
        isPopular,
      });

      if (title.trim().length < 3) throw new Error('Название должно быть ≥ 3 символов');
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) throw new Error('Цена должна быть > 0');
      // Старая цена теперь необязательна, используем priceNum, если не заполнена
      const originalPriceNum = originalPrice ? parseFloat(originalPrice) : priceNum;
      if (originalPrice && (isNaN(originalPriceNum) || originalPriceNum <= 0)) {
        throw new Error('Старая цена должна быть > 0, если указана');
      }
      if (categoryIds.length === 0) throw new Error('Необходимо выбрать хотя бы одну категорию');
      const discountNum = discountPercent ? parseFloat(discountPercent) : 0;
      if (discountNum < 0 || discountNum > 100) throw new Error('Скидка должна быть от 0 до 100%');
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

      let imageUrls: string[] = [];
      if (images.length > 0) {
        for (const image of images) {
          console.log('Compressing image:', image.file.name);
          const compressedImage = await compressImage(image.file);
          const fileName = `${uuidv4()}-${compressedImage.name}`;
          console.log('Uploading image to Supabase:', fileName);
          const { data, error } = await supabase.storage
            .from('product-image')
            .upload(fileName, compressedImage);
          if (error) throw new Error('Ошибка загрузки изображения: ' + error.message);

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

      // Получаем названия категорий
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name, slug')
        .in('id', categoryIds);

      if (categoriesError || !categoriesData) {
        throw new Error('Ошибка получения категорий: ' + (categoriesError?.message || 'Неизвестная ошибка'));
      }

      const categoryNames = categoriesData.map(cat => cat.name).join(', ');
      const categorySlugs = categoriesData.map(cat => cat.slug);

      if (isPopular && categorySlugs.some(slug => ['balloon', 'postcard'].includes(slug))) {
        throw new Error('Шарики и открытки нельзя сделать популярными товарами');
      }

      console.log('Sending request to /api/products with payload:', {
        title: sanitizedTitle,
        price: priceNum,
        original_price: originalPriceNum,
        discount_percent: discountNum,
        category_names: categoryNames,
        category_ids: categoryIds,
        subcategory_ids: subcategoryIds,
        production_time: productionTimeNum,
        short_desc: sanitizedShortDesc,
        description: sanitizedDescription,
        composition: sanitizedComposition,
        bonus: bonusNum,
        images: imageUrls,
        in_stock: inStock,
        is_visible: isVisible,
        is_popular: isPopular,
        order_index: 0,
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
          category_names: categoryNames,
          category_ids: categoryIds,
          subcategory_ids: subcategoryIds,
          production_time: productionTimeNum,
          short_desc: sanitizedShortDesc,
          description: sanitizedDescription,
          composition: sanitizedComposition,
          bonus: bonusNum,
          images: imageUrls,
          in_stock: inStock,
          is_visible: isVisible,
          is_popular: isPopular,
          order_index: 0,
        }),
      });

      console.log('Response status:', res.status, res.statusText);
      const responseText = await res.text();
      console.log('Response body:', responseText);

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (err) {
        throw new Error('Failed to parse JSON response: ' + responseText);
      }

      console.log('Parsed JSON response:', json);
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

  return (
    <CSRFToken>
      {(csrfToken) => (
        <motion.div
          className="max-w-6xl mx-auto p-6 space-y-6 bg-gray-50 rounded-lg shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-gray-800">Добавить товар</h1>
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
                  ref={titleInputRef}
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
                  placeholder="Введите старую цену (необязательно)"
                  min="0.01"
                  step="0.01"
                  aria-describedby="originalPrice-desc"
                  whileFocus={{ scale: 1.01 }}
                />
                <p id="originalPrice-desc" className="text-sm text-gray-500 mt-1">
                  Цена до скидки (для отображения скидки, необязательно).
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
                <label htmlFor="images" className="block mb-1 font-medium text-gray-600">
                  Изображения:
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
                {images.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={images.map(img => img.id)}>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {images.map((image) => (
                          <SortableImage
                            key={image.id}
                            image={image}
                            onRemove={handleRemoveImage}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
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
                aria-label="Добавить новый товар"
              >
                {loading ? 'Добавление...' : 'Добавить товар'}
              </motion.button>
              <motion.button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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