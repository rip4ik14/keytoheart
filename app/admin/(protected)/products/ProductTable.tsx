// components/admin/ProductTable.tsx

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
import { GripVertical, Edit, Trash2 } from 'lucide-react';
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
}

interface SortableProductProps {
  product: Product;
  toggleInStock: (id: number, current: boolean | null) => void;
  toggleVisible: (id: number, current: boolean | null) => void;
  togglePopular: (id: number, current: boolean | null) => void;
  deleteProduct: (id: number) => void;
  categoriesMap: Map<number, string>;
}

const StatusSwitch = ({
  value,
  label,
  onClick,
  colorActive,
  colorInactive,
}: {
  value: boolean;
  label: string;
  onClick: () => void;
  colorActive: string;
  colorInactive: string;
}) => (
  <motion.button
    onClick={onClick}
    className={`text-xs px-3 py-1 rounded-full transition-colors border
      ${value ? `${colorActive} border-opacity-50` : `${colorInactive} border-opacity-20`}
    `}
    whileHover={{ scale: 1.07 }}
    aria-pressed={value}
    tabIndex={0}
    style={{ minWidth: 92 }}
  >
    {label}
  </motion.button>
);

const SortableProduct = ({
  product,
  toggleInStock,
  toggleVisible,
  togglePopular,
  deleteProduct,
  categoriesMap,
}: SortableProductProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: product.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const categoryNames = product.category_ids
    .map((id) => categoriesMap.get(id) || '—')
    .join(', ');

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white rounded-xl shadow border border-gray-100 hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {product.is_popular && (
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical size={20} className="text-gray-500" />
        </div>
      )}
      <div className="flex-shrink-0">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            width={80}
            height={80}
            className="object-cover rounded"
            loading="lazy"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500 text-sm">Нет фото</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-800 truncate">{product.title}</h3>
        <p className="text-gray-600">
          {product.discount_percent != null && product.discount_percent > 0
            ? `${(product.price * (1 - product.discount_percent / 100)).toFixed(0)} ₽`
            : `${product.price} ₽`}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Управляемые статусы */}
          <StatusSwitch
            value={product.in_stock}
            label={product.in_stock ? 'В наличии' : 'Нет в наличии'}
            colorActive="bg-green-100 text-green-800 border-green-400"
            colorInactive="bg-gray-200 text-gray-500 border-gray-300"
            onClick={() => toggleInStock(product.id, product.in_stock ?? false)}
          />
          <StatusSwitch
            value={product.is_visible}
            label={product.is_visible ? 'Показан' : 'Скрыт'}
            colorActive="bg-blue-100 text-blue-800 border-blue-400"
            colorInactive="bg-gray-200 text-gray-500 border-gray-300"
            onClick={() => toggleVisible(product.id, product.is_visible ?? false)}
          />
          <StatusSwitch
            value={product.is_popular}
            label={product.is_popular ? 'Популярный' : 'Обычный'}
            colorActive="bg-yellow-100 text-yellow-800 border-yellow-400"
            colorInactive="bg-gray-200 text-gray-500 border-gray-300"
            onClick={() => togglePopular(product.id, product.is_popular ?? false)}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2 truncate">{categoryNames}</p>
      </div>
      <div className="flex gap-2 flex-col sm:flex-row">
        <Link
          href={`/admin/edit-product/${product.id}`}
          className="p-2 text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Редактировать товар ${product.title}`}
        >
          <Edit size={16} />
        </Link>
        <motion.button
          onClick={() => deleteProduct(product.id)}
          className="p-2 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          whileHover={{ scale: 1.05 }}
          aria-label={`Удалить товар ${product.title}`}
        >
          <Trash2 size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
};

// Табличный режим (desktop only)
const ProductTableTable = ({
  products,
  toggleInStock,
  toggleVisible,
  togglePopular,
  deleteProduct,
  categoriesMap,
}: {
  products: Product[];
  toggleInStock: (id: number, current: boolean | null) => void;
  toggleVisible: (id: number, current: boolean | null) => void;
  togglePopular: (id: number, current: boolean | null) => void;
  deleteProduct: (id: number) => void;
  categoriesMap: Map<number, string>;
}) => (
  <div className="hidden md:block w-full overflow-x-auto rounded-lg shadow bg-white">
    <table className="min-w-full text-sm border-separate border-spacing-y-1">
      <thead>
        <tr>
          <th className="px-4 py-3 text-left font-semibold">Фото</th>
          <th className="px-4 py-3 text-left font-semibold">Название</th>
          <th className="px-4 py-3 text-left font-semibold">Цена</th>
          <th className="px-4 py-3 text-left font-semibold">Категории</th>
          <th className="px-4 py-3 text-center font-semibold">В наличии</th>
          <th className="px-4 py-3 text-center font-semibold">Показан</th>
          <th className="px-4 py-3 text-center font-semibold">Популярный</th>
          <th className="px-4 py-3 text-center font-semibold">Действия</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => {
          const categoryNames = product.category_ids
            .map((id) => categoriesMap.get(id) || '—')
            .join(', ');

          return (
            <tr key={product.id} className="bg-gray-50 hover:bg-gray-100 transition">
              <td className="px-4 py-2 align-middle">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    width={60}
                    height={60}
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Нет фото</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-2 font-medium text-gray-800 max-w-xs truncate">{product.title}</td>
              <td className="px-4 py-2 text-gray-700">
                {product.discount_percent != null && product.discount_percent > 0
                  ? (
                    <>
                      <span className="font-semibold">{(product.price * (1 - product.discount_percent / 100)).toFixed(0)} ₽</span>
                      <span className="line-through text-gray-400 ml-2">{product.price} ₽</span>
                    </>
                  )
                  : <span>{product.price} ₽</span>
                }
              </td>
              <td className="px-4 py-2 text-gray-600 text-xs max-w-xs truncate">{categoryNames}</td>
              <td className="px-2 py-2 text-center">
                <StatusSwitch
                  value={product.in_stock}
                  label={product.in_stock ? 'В наличии' : 'Нет'}
                  colorActive="bg-green-100 text-green-800 border-green-400"
                  colorInactive="bg-gray-200 text-gray-400 border-gray-300"
                  onClick={() => toggleInStock(product.id, product.in_stock ?? false)}
                />
              </td>
              <td className="px-2 py-2 text-center">
                <StatusSwitch
                  value={product.is_visible}
                  label={product.is_visible ? 'Показан' : 'Скрыт'}
                  colorActive="bg-blue-100 text-blue-800 border-blue-400"
                  colorInactive="bg-gray-200 text-gray-400 border-gray-300"
                  onClick={() => toggleVisible(product.id, product.is_visible ?? false)}
                />
              </td>
              <td className="px-2 py-2 text-center">
                <StatusSwitch
                  value={product.is_popular}
                  label={product.is_popular ? 'Популярный' : 'Обычный'}
                  colorActive="bg-yellow-100 text-yellow-800 border-yellow-400"
                  colorInactive="bg-gray-200 text-gray-400 border-gray-300"
                  onClick={() => togglePopular(product.id, product.is_popular ?? false)}
                />
              </td>
              <td className="px-2 py-2 text-center">
                <div className="flex justify-center gap-2">
                  <Link
                    href={`/admin/edit-product/${product.id}`}
                    className="p-2 text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Редактировать товар ${product.title}`}
                  >
                    <Edit size={16} />
                  </Link>
                  <motion.button
                    onClick={() => deleteProduct(product.id)}
                    className="p-2 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    whileHover={{ scale: 1.05 }}
                    aria-label={`Удалить товар ${product.title}`}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default function ProductTable({
  products,
  toggleInStock,
  deleteProduct,
  viewMode,
  onReorder,
}: ProductTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [categoriesMap, setCategoriesMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    const fetchCategories = async () => {
      const allCategoryIds = Array.from(new Set(products.flatMap((product) => product.category_ids)));
      if (allCategoryIds.length === 0) return;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', allCategoryIds);

      if (categoriesError) {
        toast.error('Ошибка загрузки категорий');
        return;
      }

      const map = new Map<number, string>();
      categoriesData.forEach((cat) => map.set(cat.id, cat.name));
      setCategoriesMap(map);
    };
    fetchCategories();
  }, [products]);

  // Универсальная функция обновления статуса
  const toggleStatus = async (id: number, field: keyof Product, current: boolean) => {
    const update: Record<string, boolean> = {};
    update[field] = !current;
    const { error } = await supabase.from('products').update(update).eq('id', id);
    if (error) {
      toast.error('Ошибка обновления статуса: ' + error.message);
    } else {
      toast.success('Статус обновлён');
      onReorder(
        products.map((p) => (p.id === id ? { ...p, [field]: !current } : p))
      );
    }
  };

  // Drag-n-drop — только для популярных
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

  return (
    <div className="space-y-4">
      {viewMode === 'table' && (
        <ProductTableTable
          products={products}
          toggleInStock={(id, cur) => toggleStatus(id, 'in_stock', cur!)}
          toggleVisible={(id, cur) => toggleStatus(id, 'is_visible', cur!)}
          togglePopular={(id, cur) => toggleStatus(id, 'is_popular', cur!)}
          deleteProduct={deleteProduct}
          categoriesMap={categoriesMap}
        />
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={products.map((p) => p.id)}>
          <div
            className={
              viewMode === 'cards'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'md:hidden space-y-4'
            }
          >
            {products.map((product) => (
              <SortableProduct
                key={product.id}
                product={product}
                toggleInStock={(id, cur) => toggleStatus(id, 'in_stock', cur!)}
                toggleVisible={(id, cur) => toggleStatus(id, 'is_visible', cur!)}
                togglePopular={(id, cur) => toggleStatus(id, 'is_popular', cur!)}
                deleteProduct={deleteProduct}
                categoriesMap={categoriesMap}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
