'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabasePublic } from '@/lib/supabase/client';
import ProductForm from '@/components/admin/ProductForm';
import type { Tables } from '@/lib/supabase/types_new';

export default function ProductsPage() {
  const [products, setProducts] = useState<Tables<'products'>[]>([]);
  const [editingProduct, setEditingProduct] = useState<Tables<'products'> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabasePublic
      .from('products')
      .select('*, product_categories(category_id), product_subcategories(subcategory_id)')
      .not('id', 'in', '(1,2,3,4,67,68)') // Исключаем upsell_items и дубли
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data);
  };

  const handleToggleVisibility = async (id: number, is_visible: boolean) => {
    const { error } = await supabasePublic
      .from('products')
      .update({ is_visible: !is_visible })
      .eq('id', id);

    if (error) {
      console.error('Error toggling visibility:', error);
      return;
    }

    fetchProducts();
  };

  const handleTogglePopular = async (id: number, is_popular: boolean) => {
    const { error } = await supabasePublic
      .from('products')
      .update({ is_popular: !is_popular })
      .eq('id', id);

    if (error) {
      console.error('Error toggling popular:', error);
      return;
    }

    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить товар?')) return;

    const { error } = await supabasePublic
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return;
    }

    fetchProducts();
  };

  return (
    <motion.div
      className="p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-sans font-bold">Управление товарами</h1>
        <motion.button
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Добавить товар
        </motion.button>
      </div>

      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
          onSave={fetchProducts}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Цена
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                В наличии
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Видимость
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Популярный
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="px-6 py-4 whitespace-nowrap">{product.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.price} ₽</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.in_stock ? 'Да' : 'Нет'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <motion.button
                    onClick={() => handleToggleVisibility(product.id, product.is_visible!)}
                    className={`text-${product.is_visible ? 'green' : 'gray'}-600 hover:text-${product.is_visible ? 'green' : 'gray'}-800`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {product.is_visible ? 'Скрыть' : 'Показать'}
                  </motion.button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <motion.button
                    onClick={() => handleTogglePopular(product.id, product.is_popular!)}
                    className={`text-${product.is_popular ? 'yellow' : 'gray'}-600 hover:text-${product.is_popular ? 'yellow' : 'gray'}-800`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {product.is_popular ? 'Убрать' : 'Отметить'}
                  </motion.button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <motion.button
                    onClick={() => {
                      setEditingProduct(product);
                      setIsFormOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    Редактировать
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    Удалить
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}