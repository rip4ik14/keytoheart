'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product, ViewMode } from './page';

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
}

const SortableProduct = ({ product, toggleInStock, deleteProduct }: SortableProductProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500 text-sm">Нет фото</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">{product.title}</h3>
        <p className="text-gray-600">
          {product.discount_percent != null && product.discount_percent > 0
            ? `${(product.price * (1 - product.discount_percent / 100)).toFixed(0)} ₽`
            : `${product.price} ₽`}
        </p>
        <div className="flex gap-2 mt-1">
          <motion.button
            onClick={() => toggleInStock(product.id, product.in_stock ?? false)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              product.in_stock
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            aria-label={product.in_stock ? `Убрать товар ${product.title} из наличия` : `Добавить товар ${product.title} в наличие`}
          >
            {product.in_stock ? 'В наличии' : 'Нет в наличии'}
          </motion.button>
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              product.is_visible
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {product.is_visible ? 'Показан' : 'Скрыт'}
          </span>
          <span
            className={`text-xs px-3 py-1 rounded-full ${
              product.is_popular
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {product.is_popular ? 'Популярный' : 'Обычный'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{product.category || '—'}</p>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/admin/products/${product.id}`}
          className="p-2 text-blue-500 hover:text-blue-700"
          aria-label={`Редактировать товар ${product.title}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
            />
          </svg>
        </Link>
        <motion.button
          onClick={() => deleteProduct(product.id)}
          className="p-2 text-red-500 hover:text-red-700"
          whileHover={{ scale: 1.05 }}
          aria-label={`Удалить товар ${product.title}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v1H5v-1a2 2 0 012-2h10a2 2 0 012 2v1h-4V3a1 1 0 00-1-1z"
            />
          </svg>
        </motion.button>
      </div>
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

  // Подписка на изменения в таблице products
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Products change detected in ProductTable:', payload);
          onReorder(products); // Запускаем обновление через родительский компонент
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [products, onReorder]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = products.findIndex(product => product.id === active.id);
      const newIndex = products.findIndex(product => product.id === over.id);

      // Проверяем, что оба товара популярные
      const activeProduct = products[oldIndex];
      const overProduct = products[newIndex];
      if (!activeProduct.is_popular || !overProduct.is_popular) {
        toast.error('Перетаскивать можно только популярные товары');
        return;
      }

      const newProducts = arrayMove(products, oldIndex, newIndex);
      const updatedProducts = newProducts.map((product, index) => ({
        ...product,
        order_index: product.is_popular ? index : product.order_index,
      }));

      onReorder(updatedProducts);

      try {
        for (const product of updatedProducts.filter(p => p.is_popular)) {
          const { error } = await supabase
            .from('products')
            .update({ order_index: product.order_index })
            .eq('id', product.id);

          if (error) throw new Error(error.message);
        }
        toast.success('Порядок популярных товаров обновлён');
      } catch (err: any) {
        toast.error('Ошибка обновления порядка: ' + err.message);
        onReorder(products); // Восстанавливаем исходный порядок при ошибке
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Десктоп: таблица */}
      {viewMode === 'table' && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm bg-white shadow-sm rounded-lg">
            <caption className="sr-only">Список товаров</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="p-3 text-left font-semibold text-gray-700">Порядок</th>
                <th scope="col" className="p-3 text-left font-semibold text-gray-700">Фото</th>
                <th scope="col" className="p-3 text-left font-semibold text-gray-700">Название</th>
                <th scope="col" className="p-3 text-left font-semibold text-gray-700">Категория</th>
                <th scope="col" className="p-3 text-left font-semibold text-gray-700">Цена</th>
                <th scope="col" className="p-3 text-left font-semibold text-gray-700">Наличие</th>
                <th scope="col" className="p-3 text-left font-semibold text-gray-700">Видимость</th>
                <th scope="col" className="p-3 text-left font-semibold text-gray-700">Популярность</th>
                <th scope="col" className="p-3 text-left font-semibold text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3">
                    {product.is_popular ? (
                      <div className="cursor-grab">
                        <GripVertical size={20} className="text-gray-500" />
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3">
                    {product.images?.[0] ? (
                      <div className="relative w-12 h-12">
                        <Image
                          src={product.images[0]}
                          alt={`Изображение товара ${product.title}`}
                          fill
                          className="object-cover rounded"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3 text-gray-800">{product.title}</td>
                  <td className="p-3 text-gray-600">{product.category || '—'}</td>
                  <td className="p-3 text-gray-800">
                    {product.discount_percent != null && product.discount_percent > 0
                      ? `${(product.price * (1 - product.discount_percent / 100)).toFixed(0)} ₽`
                      : `${product.price} ₽`}
                  </td>
                  <td className="p-3">
                    <motion.button
                      onClick={() => toggleInStock(product.id, product.in_stock ?? false)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        product.in_stock
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      aria-label={product.in_stock ? `Убрать товар ${product.title} из наличия` : `Добавить товар ${product.title} в наличие`}
                    >
                      {product.in_stock ? 'В наличии' : 'Нет в наличии'}
                    </motion.button>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        product.is_visible
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {product.is_visible ? 'Показан' : 'Скрыт'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        product.is_popular
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {product.is_popular ? 'Популярный' : 'Обычный'}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      aria-label={`Редактировать товар ${product.title}`}
                    >
                      Редактировать
                    </Link>
                    <motion.button
                      onClick={() => deleteProduct(product.id)}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      aria-label={`Удалить товар ${product.title}`}
                    >
                      Удалить
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Мобильный и карточный вид: карточки */}
      {(viewMode === 'cards' || true) && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={products.map(product => product.id)}>
            <div className={viewMode === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'md:hidden space-y-4'}>
              {products.map((product) => (
                <SortableProduct
                  key={product.id}
                  product={product}
                  toggleInStock={toggleInStock}
                  deleteProduct={deleteProduct}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}