'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Product, ViewMode } from './page';

interface ProductTableProps {
  products: Product[];
  toggleInStock: (id: number, current: boolean | null) => void;
  deleteProduct: (id: number) => void;
  viewMode: ViewMode;
}

export default function ProductTable({
  products,
  toggleInStock,
  deleteProduct,
  viewMode,
}: ProductTableProps) {
  return (
    <div className="space-y-4">
      {/* Десктоп: таблица */}
      {viewMode === 'table' && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <caption className="sr-only">Список товаров</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="p-3 text-left font-semibold">Фото</th>
                <th scope="col" className="p-3 text-left font-semibold">Название</th>
                <th scope="col" className="p-3 text-left font-semibold">Категория</th>
                <th scope="col" className="p-3 text-left font-semibold">Цена</th>
                <th scope="col" className="p-3 text-left font-semibold">Наличие</th>
                <th scope="col" className="p-3 text-left font-semibold">Видимость</th>
                <th scope="col" className="p-3 text-left font-semibold">Действия</th>
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
                  <td className="p-3">{product.title}</td>
                  <td className="p-3">{product.category || '—'}</td>
                  <td className="p-3">
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
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {product.is_visible ? 'Показан' : 'Скрыт'}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <Link
                      href={`/admin/edit-product/${product.id}`}
                      className="text-sm text-gray-600 hover:text-black"
                      aria-label={`Редактировать товар ${product.title}`}
                    >
                      Редактировать
                    </Link>
                    <motion.button
                      onClick={() => deleteProduct(product.id)}
                      className="text-sm text-red-600 hover:text-red-800"
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
        <div className={viewMode === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'md:hidden space-y-4'}>
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="border border-gray-200 rounded-md p-4 bg-white shadow-sm flex flex-col justify-between"
            >
              <div>
                {product.images?.[0] && (
                  <div className="relative w-full h-48 mb-4">
                    <Image
                      src={product.images[0]}
                      alt={`Изображение товара ${product.title}`}
                      fill
                      className="object-cover rounded"
                      loading="lazy"
                    />
                  </div>
                )}
                <h2 className="text-lg font-semibold">{product.title}</h2>
                <p className="text-gray-600">
                  {product.discount_percent != null && product.discount_percent > 0
                    ? `${(product.price * (1 - product.discount_percent / 100)).toFixed(0)} ₽ (Скидка ${product.discount_percent}%)`
                    : `${product.price} ₽`}
                </p>
                <p className="text-gray-500">{product.category || '—'}</p>
                <p className="text-sm mt-1">
                  Наличие:{' '}
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
                </p>
                <p className="text-sm mt-1">
                  Видимость:{' '}
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      product.is_visible
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {product.is_visible ? 'Показан' : 'Скрыт'}
                  </span>
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/admin/edit-product/${product.id}`}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                  aria-label={`Редактировать товар ${product.title}`}
                >
                  Редактировать
                </Link>
                <motion.button
                  onClick={() => deleteProduct(product.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  whileHover={{ scale: 1.05 }}
                  aria-label={`Удалить товар ${product.title}`}
                >
                  Удалить
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}