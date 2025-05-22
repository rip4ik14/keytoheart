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
  deleteProduct: (id: number) => void;
  categoriesMap: Map<number, string>;
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
  <div className={`flex gap-2 ${isTableView ? 'justify-start' : 'flex-col sm:flex-row'}`}>
    <Link
      href={`/admin/edit-product/${product.id}`}
      onClick={() => onEdit(product.id)}
      className={`p-2 text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isTableView ? 'text-sm' : ''
      }`}
      aria-label={`Редактировать товар ${product.title}`}
    >
      {isTableView ? <span>Редактировать</span> : <Edit size={16} />}
    </Link>
    <motion.button
      onClick={() => onDelete(product.id)}
      className={`p-2 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 ${
        isTableView ? 'text-sm' : ''
      }`}
      whileHover={{ scale: 1.05 }}
      aria-label={`Удалить товар ${product.title}`}
    >
      {isTableView ? <span>Удалить</span> : <Trash2 size={16} />}
    </motion.button>
  </div>
);

const SortableProduct = ({
  product,
  toggleInStock,
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
      className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
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
        <div className="flex flex-wrap gap-2 mt-1">
          <motion.button
            onClick={() => toggleInStock(product.id, product.in_stock ?? false)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              product.in_stock
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-green-500`}
            whileHover={{ scale: 1.05 }}
            aria-label={
              product.in_stock
                ? `Убрать товар ${product.title} из наличия`
                : `Добавить товар ${product.title} в наличие`
            }
          >
            {product.in_stock ? 'В наличии' : 'Нет в наличии'}
          </motion.button>
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              product.is_visible ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {product.is_visible ? 'Показан' : 'Скрыт'}
          </span>
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              product.is_popular ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {product.is_popular ? 'Популярный' : 'Обычный'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 truncate">{categoryNames}</p>
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
}: ProductTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [categoriesMap, setCategoriesMap] = useState<Map<number, string>>(new Map());

  // загрузка категорий
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

  // подписка на изменения в products
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

  return (
    <div className="space-y-4">
      {viewMode === 'table' && (
        <div className="hidden md:block overflow-x-auto">
          {/* ... таблица (оставляем без изменений) ... */}
        </div>
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
                toggleInStock={toggleInStock}
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
