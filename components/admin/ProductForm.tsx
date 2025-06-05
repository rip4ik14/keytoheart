'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabasePublic } from '@/lib/supabase/client';
import { slugify, validateProduct, type ProductData } from '@/lib/utils';
import type { Tables } from '@/lib/supabase/types_new';
import Image from 'next/image';

interface ProductFormProps {
  product?: Tables<'products'> | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    price: product?.price || 0,
    description: product?.description || '',
    short_desc: product?.short_desc || '',
    composition: product?.composition || '',
    in_stock: product?.in_stock ?? true,
    is_visible: product?.is_visible ?? true,
    is_popular: product?.is_popular ?? false,
    image_url: product?.image_url || '',
    images: product?.images || [],
    category_ids: [] as number[],
    subcategory_ids: [] as number[],
    discount_percent: product?.discount_percent || 0,
    original_price: product?.original_price || '',
    order_index: product?.order_index || 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Tables<'categories'>[]>([]);
  const [subcategories, setSubcategories] = useState<Tables<'subcategories'>[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    if (product) {
      fetchProductCategories();
      fetchProductSubcategories();
    }
  }, [product]);

  const fetchCategories = async () => {
    const { data, error } = await supabasePublic
      .from('categories')
      .select('*')
      .eq('is_visible', true);

    if (error) {
      process.env.NODE_ENV !== "production" && console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data);
  };

  const fetchSubcategories = async () => {
    const { data, error } = await supabasePublic
      .from('subcategories')
      .select('*')
      .eq('is_visible', true);

    if (error) {
      process.env.NODE_ENV !== "production" && console.error('Error fetching subcategories:', error);
      return;
    }

    setSubcategories(data);
  };

  const fetchProductCategories = async () => {
    if (!product) return;
    const { data, error } = await supabasePublic
      .from('product_categories')
      .select('category_id')
      .eq('product_id', product.id);

    if (error) {
      process.env.NODE_ENV !== "production" && console.error('Error fetching product categories:', error);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      category_ids: data.map((item) => item.category_id),
    }));
  };

  const fetchProductSubcategories = async () => {
    if (!product) return;
    const { data, error } = await supabasePublic
      .from('product_subcategories')
      .select('subcategory_id')
      .eq('product_id', product.id);

    if (error) {
      process.env.NODE_ENV !== "production" && console.error('Error fetching product subcategories:', error);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      subcategory_ids: data.map((item) => item.subcategory_id),
    }));
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error } = await supabasePublic.storage
      .from('products')
      .upload(fileName, file);

    if (error) {
      setError('Ошибка при загрузке изображения');
      return null;
    }

    const { data: urlData } = supabasePublic.storage
      .from('products')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateProduct(formData as ProductData);
    if (validationError) {
      setError(validationError);
      return;
    }

    let newImageUrl = formData.image_url;
    if (imageFile) {
      const uploadedUrl = await handleImageUpload(imageFile);
      if (!uploadedUrl) return;
      newImageUrl = uploadedUrl;
    }

    const productData = {
      title: formData.title,
      price: formData.price,
      description: formData.description,
      short_desc: formData.short_desc,
      composition: formData.composition,
      in_stock: formData.in_stock,
      is_visible: formData.is_visible,
      is_popular: formData.is_popular,
      image_url: newImageUrl || '', // Используем пустую строку, если newImageUrl null
      images: formData.images,
      slug: slugify(formData.title),
      discount_percent: formData.discount_percent,
      original_price: formData.original_price,
      order_index: formData.order_index,
    };

    let error;
    let productId = product?.id;
    if (product) {
      ({ error } = await supabasePublic
        .from('products')
        .update(productData)
        .eq('id', product.id));
    } else {
      const { data, error: insertError } = await supabasePublic
        .from('products')
        .insert(productData)
        .select('id')
        .single();
      error = insertError;
      productId = data?.id;
    }

    if (error) {
      setError('Ошибка при сохранении товара');
      return;
    }

    if (productId) {
      // Обновление категорий
      await supabasePublic
        .from('product_categories')
        .delete()
        .eq('product_id', productId);
      if (formData.category_ids.length > 0) {
        const categoryInserts = formData.category_ids.map((category_id) => ({
          product_id: productId,
          category_id,
        }));
        const { error: categoryError } = await supabasePublic
          .from('product_categories')
          .insert(categoryInserts);
        if (categoryError) {
          setError('Ошибка при привязке категорий');
          return;
        }
      }

      // Обновление подкатегорий
      await supabasePublic
        .from('product_subcategories')
        .delete()
        .eq('product_id', productId);
      if (formData.subcategory_ids.length > 0) {
        const subcategoryInserts = formData.subcategory_ids.map((subcategory_id) => ({
          product_id: productId,
          subcategory_id,
        }));
        const { error: subcategoryError } = await supabasePublic
          .from('product_subcategories')
          .insert(subcategoryInserts);
        if (subcategoryError) {
          setError('Ошибка при привязке подкатегорий');
          return;
        }
      }
    }

    onSave();
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white p-6 rounded-lg w-full max-w-lg overflow-y-auto max-h-[90vh]"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-sans font-bold mb-4">
          {product ? 'Редактировать товар' : 'Создать товар'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Название
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              required
              aria-describedby={error ? 'title-error' : undefined}
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Цена (₽)
            </label>
            <input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              required
              min="0"
            />
          </div>
          <div>
            <label htmlFor="original_price" className="block text-sm font-medium text-gray-700">
              Исходная цена (₽)
            </label>
            <input
              id="original_price"
              type="text"
              value={formData.original_price}
              onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="discount_percent" className="block text-sm font-medium text-gray-700">
              Скидка (%)
            </label>
            <input
              id="discount_percent"
              type="number"
              value={formData.discount_percent}
              onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label htmlFor="order_index" className="block text-sm font-medium text-gray-700">
              Порядок сортировки
            </label>
            <input
              id="order_index"
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              min="0"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Описание
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              rows={4}
            />
          </div>
          <div>
            <label htmlFor="short_desc" className="block text-sm font-medium text-gray-700">
              Краткое описание
            </label>
            <input
              id="short_desc"
              type="text"
              value={formData.short_desc}
              onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="composition" className="block text-sm font-medium text-gray-700">
              Состав
            </label>
            <input
              id="composition"
              type="text"
              value={formData.composition}
              onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Изображение
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {formData.image_url && (
              <div className="mt-2">
                <Image
                  src={formData.image_url}
                  alt="Превью товара"
                  width={100}
                  height={100}
                  className="rounded-md"
                  loading="lazy"
                />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="categories" className="block text-sm font-medium text-gray-700">
              Категории
            </label>
            <select
              id="categories"
              multiple
              value={formData.category_ids.map(String)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category_ids: Array.from(e.target.selectedOptions, (option) => Number(option.value)),
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subcategories" className="block text-sm font-medium text-gray-700">
              Подкатегории
            </label>
            <select
              id="subcategories"
              multiple
              value={formData.subcategory_ids.map(String)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subcategory_ids: Array.from(e.target.selectedOptions, (option) => Number(option.value)),
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
            >
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name} (Категория: {categories.find(c => c.id === subcategory.category_id)?.name || 'Без категории'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.in_stock}
                onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="ml-2 text-sm text-gray-700">В наличии</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_visible}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="ml-2 text-sm text-gray-700">Видимый</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_popular}
                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                className="rounded border-gray-300 text-black focus:ring-black"
              />
              <span className="ml-2 text-sm text-gray-700">Популярный</span>
            </label>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex justify-end space-x-2">
            <motion.button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Отмена
            </motion.button>
            <motion.button
              type="submit"
              className="py-2 px-4 rounded-md bg-black text-white hover:bg-gray-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Сохранить
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}