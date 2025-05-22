'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, CheckCircle, XCircle, Eye, EyeOff, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  title: string;
  price: number;
  original_price?: number | null;
  discount_percent: number | null;
  images: string[];
  in_stock: boolean;
  is_visible: boolean;
  is_popular: boolean;
  order_index: number;
  category_ids: number[];
  isSelected?: boolean;
}

interface Category {
  id: number;
  name: string;
}

type ViewMode = 'table' | 'cards';

interface ProductTableProps {
  products: Product[];
  toggleInStock: (id: number, current: boolean | null) => void;
  deleteProduct: (id: number) => void;
  viewMode: ViewMode;
  onReorder: (newProducts: Product[]) => void;
  onSelect: (id: number) => void;
}

interface SortableProductProps {
  product: Product;
  toggleInStock: (id: number, current: boolean | null) => void;
  deleteProduct: (id: number) => void;
  categoriesMap: Map<number, string>;
  onSelect: (id: number) => void;
}

interface ProductActionsProps {
  product: Product;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isTableView?: boolean;
}

const ProductActions = ({
  product,
  onEdit,
  onDelete,
  isTableView = false,
}: ProductActionsProps) => (
  <div className={`flex gap-2 ${isTableView ? 'justify-start' : 'justify-center sm:justify-start'}`}>
    <Link
      href={`/admin/edit-product/${product.id}`}
      onClick={() => onEdit(product.id)}
      className={`p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isTableView ? 'text-sm' : ''
      }`}
      aria-label={`Редактировать товар ${product.title}`}
    >
      <Edit size={isTableView ? 14 : 18} />
    </Link>
    <motion.button
      onClick={() => onDelete(product.id)}
      className={`p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
        isTableView ? 'text-sm' : ''
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={`Удалить товар ${product.title}`}
    >
      <Trash2 size={isTableView ? 14 : 18} />
    </motion.button>
  </div>
);

const SortableProduct = ({
  product,
  toggleInStock,
  deleteProduct,
  categoriesMap,
  onSelect,
}: SortableProductProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: !product.is_popular,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  const categoryNames = product.category_ids
    .map((id) => categoriesMap.get(id) || '—')
    .join(', ');

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="listitem"
    >
      <input
        type="checkbox"
        checked={product.isSelected || false}
        onChange={() => onSelect(product.id)}
        className="mr-2"
        aria-label={`Выбрать товар ${product.title}`}
      />
      {product.is_popular && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={20} className="text-gray-400 hover:text-gray-600" />
        </div>
      )}
      <div className="flex-shrink-0">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            width={120}
            height={120}
            className="object-cover rounded-md"
            loading="lazy"
          />
        ) : (
          <div className="w-[120px] h-[120px] bg-gray-100 rounded-md flex items-center justify-center">
            <span className="text-gray-400 text-sm">Нет фото</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="text-lg font-semibold text-gray-800 truncate" title={product.title}>
          {product.title}
        </h3>
        <p className="text-gray-600 font-medium">
          {product.discount_percent != null && product.discount_percent > 0
            ? `${Math.round(product.price * (1 - product.discount_percent / 100))} ₽`
            : `${product.price} ₽`}
        </p>
        <div className="flex flex-wrap gap-2">
          <motion.button
            onClick={() => toggleInStock(product.id, product.in_stock ?? false)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
              product.in_stock
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            } focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500`}
            whileHover={{ scale: 1.05 }}
            aria-label={
              product.in_stock
                ? `Убрать товар ${product.title} из наличия`
                : `Добавить товар ${product.title} в наличие`
            }
          >
            {product.in_stock ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {product.in_stock ? 'В наличии' : 'Нет в наличии'}
          </motion.button>
          <span
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              product.is_visible ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {product.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
            {product.is_visible ? 'Видимый' : 'Скрыт'}
          </span>
          <span
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              product.is_popular ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {product.is_popular ? <Star size={12} /> : <Star size={12} className="opacity-50" />}
            {product.is_popular ? 'Популярный' : 'Обычный'}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate" title={categoryNames}>
          Категории: {categoryNames}
        </p>
      </div>
      <ProductActions product={product} onEdit={() => {}} onDelete={deleteProduct} />
    </motion.div>
  );
};

export default function ProductTable({
  products,
  toggleInStock,
  deleteProduct,
  viewMode,
  onReorder,
  onSelect,
}: ProductTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [categoriesMap, setCategoriesMap] = useState<Map<number, string>>(new Map());
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const allCategoryIds = Array.from(
        new Set(products.flatMap((product) => product.category_ids))
      );
      if (allCategoryIds.length === 0) return;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', allCategoryIds);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        toast.error('Ошибка загрузки категорий');
        return;
      }

      const map = new Map<number, string>();
      categoriesData.forEach((cat) => map.set(cat.id, cat.name));
      setCategoriesMap(map);
    };

    fetchCategories();
  }, [products]);

  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          const changedProductId = payload.new?.id || payload.old?.id;
          if (products.some((p) => p.id === changedProductId)) {
            console.log('Products change detected:', payload);
            onReorder(products);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [products, onReorder]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as number;
    if (activeId === overId) return;

    const oldIndex = products.findIndex((p) => p.id === activeId);
    const newIndex = products.findIndex((p) => p.id === overId);
    const activeProduct = products[oldIndex];
    const overProduct = products[newIndex];

    if (!activeProduct.is_popular || !overProduct.is_popular) {
      toast.error('Перетаскивать можно только популярные товары');
      return;
    }

    const newProducts = arrayMove(products, oldIndex, newIndex);
    const updatedProducts = newProducts.map((p, idx) => ({
      ...p,
      order_index: p.is_popular ? idx : p.order_index,
    }));

    onReorder(updatedProducts);

    try {
      for (const p of updatedProducts.filter((p) => p.is_popular)) {
        const { error } = await supabase
          .from('products')
          .update({ order_index: p.order_index })
          .eq('id', p.id);
        if (error) throw new Error(error.message);
      }
      toast.success('Порядок популярных товаров обновлён');
    } catch (err: any) {
      toast.error('Ошибка обновления порядка: ' + err.message);
      onReorder(products);
    }
  };

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedProducts = [...products].sort((a, b) => {
      if (a[key] == null || b[key] == null) return 0;
      if (typeof a[key] === 'string') {
        return direction === 'asc'
          ? (a[key] as string).localeCompare(b[key] as string)
          : (b[key] as string).localeCompare(a[key] as string);
      }
      return direction === 'asc'
        ? (a[key] as number) - (b[key] as number)
        : (b[key] as number) - (a[key] as number);
    });
    onReorder(sortedProducts);
  };

  const sortedProducts = sortConfig
    ? [...products].sort((a, b) => {
        if (a[sortConfig.key] == null || b[sortConfig.key] == null) return 0;
        if (typeof a[sortConfig.key] === 'string') {
          return sortConfig.direction === 'asc'
            ? (a[sortConfig.key] as string).localeCompare(b[sortConfig.key] as string)
            : (b[sortConfig.key] as string).localeCompare(a[sortConfig.key] as string);
        }
        return sortConfig.direction === 'asc'
          ? (a[sortConfig.key] as number) - (b[sortConfig.key] as number)
          : (b[sortConfig.key] as number) - (a[sortConfig.key] as number);
      })
    : products;

  return (
    <div className="space-y-6">
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-semibold">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && products.every((p) => p.isSelected)}
                    onChange={() => {
                      if (products.every((p) => p.isSelected)) {
                        onSelect(0); // Деселект всех
                      } else {
                        products.forEach((p) => !p.isSelected && onSelect(p.id));
                      }
                    }}
                    aria-label="Выделить все товары"
                  />
                </th>
                <th className="p-3 text-left font-semibold cursor-pointer" onClick={() => handleSort('id')}>
                  ID {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-semibold">Фото</th>
                <th className="p-3 text-left font-semibold cursor-pointer" onClick={() => handleSort('title')}>
                  Название {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-semibold cursor-pointer" onClick={() => handleSort('price')}>
                  Цена {sortConfig?.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-left font-semibold">Статус</th>
                <th className="p-3 text-left font-semibold">Категории</th>
                <th className="p-3 text-left font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={product.isSelected || false}
                      onChange={() => onSelect(product.id)}
                      aria-label={`Выбрать товар ${product.title}`}
                    />
                  </td>
                  <td className="p-3">{product.id}</td>
                  <td className="p-3">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={40}
                        height={40}
                        className="object-cover rounded"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">—</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 truncate max-w-xs" title={product.title}>
                    {product.title}
                  </td>
                  <td className="p-3">
                    {product.discount_percent != null && product.discount_percent > 0
                      ? `${Math.round(product.price * (1 - product.discount_percent / 100))} ₽`
                      : `${product.price} ₽`}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => toggleInStock(product.id, product.in_stock ?? false)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          product.in_stock
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        aria-label={
                          product.in_stock
                            ? `Убрать товар ${product.title} из наличия`
                            : `Добавить товар ${product.title} в наличие`
                        }
                      >
                        {product.in_stock ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      </motion.button>
                      <span
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          product.is_visible ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {product.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          product.is_popular ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {product.is_popular ? <Star size={12} /> : <Star size={12} className="opacity-50" />}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 truncate max-w-xs" title={product.category_ids
                    .map((id) => categoriesMap.get(id) || '—')
                    .join(', ')}>
                    {product.category_ids
                      .map((id) => categoriesMap.get(id) || '—')
                      .join(', ')}
                  </td>
                  <td className="p-3">
                    <ProductActions
                      product={product}
                      onEdit={() => {}}
                      onDelete={deleteProduct}
                      isTableView
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'cards' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={products.map((p) => p.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <SortableProduct
                  key={product.id}
                  product={product}
                  toggleInStock={toggleInStock}
                  deleteProduct={deleteProduct}
                  categoriesMap={categoriesMap}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}