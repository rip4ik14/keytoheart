'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import SitePagesDropdown from '../components/SitePagesDropdown';
import ProductTable from './ProductTable';

export interface CategoryOption {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
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
  bonus?: number | null;
  composition?: string | null;
  created_at?: string | null;
  description?: string | null;
  image_url?: string | null;
  short_desc?: string | null;
  slug?: string | null;
  production_time?: number | null;
}

export type ViewMode = 'table' | 'cards';

interface Props {
  initialProducts: Product[];
  categories: CategoryOption[];
}

export default function ProductsClient({ initialProducts, categories }: Props) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedPage, setSelectedPage] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [modalOpen, setModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [popularityFilter, setPopularityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const savedMode = localStorage.getItem('productViewMode') as ViewMode;
    if (savedMode) setViewMode(savedMode);
  }, []);

  useEffect(() => {
    localStorage.setItem('productViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin-session', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error('Auth failed');
        setIsAuthenticated(true);
      } catch {
        toast.error('Войдите как администратор');
        router.push(`/admin/login?from=${encodeURIComponent('/admin/products')}`);
      }
    })();
  }, [router]);

  useEffect(() => {
    let filtered = initialProducts;

    if (selectedPage) {
      const parts = selectedPage.split('/').filter(Boolean);
      if (parts[0] === 'category' && parts[1]) {
        const cat = categories.find(c => c.slug === parts[1]);
        if (cat) {
          filtered = filtered.filter(p => p.category_ids.includes(cat.id));
        } else {
          filtered = [];
        }
      }
    }

    if (categoryFilter) {
      const cid = Number(categoryFilter);
      filtered = filtered.filter(p => p.category_ids.includes(cid));
    }

    if (stockFilter !== 'all') {
      filtered = filtered.filter(p => p.in_stock === (stockFilter === 'in_stock'));
    }

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(p => p.is_visible === (visibilityFilter === 'visible'));
    }

    if (popularityFilter !== 'all') {
      filtered = filtered.filter(p => p.is_popular === (popularityFilter === 'popular'));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.title.toLowerCase().includes(q));
    }

    setProducts(filtered);
  }, [selectedPage, categoryFilter, stockFilter, visibilityFilter, popularityFilter, searchQuery, initialProducts, categories]);

  const deleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Товар удалён');
      closeModal();
    } catch (err: any) {
      toast.error('Ошибка: ' + err.message);
    }
  };

  const openDeleteModal = (id: number) => {
    setProductToDelete(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setProductToDelete(null);
  };

  const handleReorder = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Проверка авторизации...</div>;
  }
  if (!isAuthenticated) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto p-6 space-y-6 font-sans"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-black">Товары</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <SitePagesDropdown selected={selectedPage} onSelect={setSelectedPage} />
          <div className="flex gap-2">
            <motion.button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm ${viewMode === 'table' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
              whileHover={{ scale: 1.05 }}
              aria-label="Отобразить товары в виде таблицы"
            >
              Таблица
            </motion.button>
            <motion.button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm ${viewMode === 'cards' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
              whileHover={{ scale: 1.05 }}
              aria-label="Отобразить товары в виде карточек"
            >
              Карточки
            </motion.button>
          </div>
          <motion.a
            href="/admin/new"
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
            whileHover={{ scale: 1.05 }}
            aria-label="Добавить новый товар"
          >
            Добавить товар
          </motion.a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-gray-100 p-4 rounded-lg">
        <div>
          <label htmlFor="categoryFilter" className="block mb-1 font-medium text-gray-600">
            Категория:
          </label>
          <select
            id="categoryFilter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stockFilter" className="block mb-1 font-medium text-gray-600">
            Наличие:
          </label>
          <select
            id="stockFilter"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все</option>
            <option value="in_stock">В наличии</option>
            <option value="out_of_stock">Нет в наличии</option>
          </select>
        </div>
        <div>
          <label htmlFor="visibilityFilter" className="block mb-1 font-medium text-gray-600">
            Видимость:
          </label>
          <select
            id="visibilityFilter"
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все</option>
            <option value="visible">Видимые</option>
            <option value="hidden">Скрытые</option>
          </select>
        </div>
        <div>
          <label htmlFor="popularityFilter" className="block mb-1 font-medium text-gray-600">
            Популярность:
          </label>
          <select
            id="popularityFilter"
            value={popularityFilter}
            onChange={(e) => setPopularityFilter(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все</option>
            <option value="popular">Популярные</option>
            <option value="not_popular">Обычные</option>
          </select>
        </div>
        <div>
          <label htmlFor="searchQuery" className="block mb-1 font-medium text-gray-600">
            Поиск:
          </label>
          <input
            id="searchQuery"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Поиск товаров по названию"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">
          {selectedPage ? 'Товары для этой страницы отсутствуют' : 'Товары отсутствуют'}
        </p>
      ) : (
        <ProductTable
          products={products}
          deleteProduct={openDeleteModal}
          viewMode={viewMode}
          onReorder={handleReorder}
        />
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            role="dialog"
            aria-labelledby="delete-modal-title"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full"
            >
              <h3 id="delete-modal-title" className="text-lg font-semibold mb-4 text-gray-800">
                Подтверждение удаления
              </h3>
              <p className="text-gray-600 mb-6">
                Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-gray-700"
                  whileHover={{ scale: 1.05 }}
                  aria-label="Отменить удаление"
                >
                  Отмена
                </motion.button>
                <motion.button
                  onClick={() => productToDelete && deleteProduct(productToDelete)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  aria-label="Подтвердить удаление товара"
                >
                  Удалить
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
