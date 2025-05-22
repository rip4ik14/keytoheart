'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import SitePagesDropdown from '../components/SitePagesDropdown';
import ProductTable from './ProductTable';
import type { Database } from '@/lib/supabase/types_new';

interface FetchedProduct {
  id: number;
  title: string;
  price: number;
  discount_percent: number | null;
  category: string;
  images: string[] | null;
  in_stock: boolean | null;
  is_visible: boolean | null;
  is_popular: boolean | null;
  category_id: number | null;
  category_slug: string | null;
  order_index: number;
  original_price: number | null; // Добавляем поле
}

export type Product = Database['public']['Tables']['products']['Row'] & {
  category_slug?: string | null;
};

export type ViewMode = 'table' | 'cards';

interface Category {
  id: number;
  name: string;
}

const queryClient = new QueryClient();

export default function ProductsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProductsContent />
    </QueryClientProvider>
  );
}

function ProductsContent() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedPage, setSelectedPage] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [modalOpen, setModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [popularityFilter, setPopularityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Загружаем предпочтение режима из localStorage
    const savedMode = localStorage.getItem('productViewMode') as ViewMode;
    if (savedMode) setViewMode(savedMode);
  }, []);

  useEffect(() => {
    // Сохраняем режим в localStorage
    localStorage.setItem('productViewMode', viewMode);
  }, [viewMode]);

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
        toast.error('Войдите как администратор');
        router.push(`/admin/login?from=${encodeURIComponent('/admin/products')}`);
      }
    };
    checkAuth();
  }, [router]);

  const { data: fetchedProducts = [], isLoading, error, isError, refetch } = useQuery<FetchedProduct[], Error>({
    queryKey: ['products', selectedPage],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, title, price, original_price, discount_percent, category, images, in_stock, is_visible, is_popular, category_id, order_index')
        .order('order_index', { ascending: true })
        .order('id', { ascending: false });

      if (selectedPage) {
        const parts = selectedPage.split('/').filter(Boolean);
        if (parts[0] === 'category' && parts.length === 2) {
          query = query.eq('category', parts[1]);
        }
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message || 'Неизвестная ошибка при загрузке товаров');

      // Загрузка категорий для фильтра
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (categoriesError) throw new Error(categoriesError.message);
      setCategories(categoriesData || []);

      return data.map((product) => ({
        ...product,
        category: product.category || 'Без категории',
        category_slug: product.category || null,
        is_popular: product.is_popular ?? false,
        order_index: product.order_index ?? 0,
        original_price: product.original_price ?? null,
      }));
    },
    enabled: isAuthenticated === true,
    initialData: [],
  });

  const productsData: Product[] = fetchedProducts.map((product) => ({
    ...product,
    bonus: null,
    subcategory_id: null,
    composition: null,
    created_at: null,
    description: null,
    image_url: null,
    original_price: product.original_price ?? null,
    short_desc: null,
    slug: null,
    production_time: null,
  }));

  useEffect(() => {
    setProducts(productsData);
  }, [fetchedProducts]);

  useEffect(() => {
    let filtered = productsData;

    // Фильтр по категории
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category_id === Number(categoryFilter));
    }

    // Фильтр по наличию
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => product.in_stock === (stockFilter === 'in_stock'));
    }

    // Фильтр по видимости
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(product => product.is_visible === (visibilityFilter === 'visible'));
    }

    // Фильтр по популярности
    if (popularityFilter !== 'all') {
      filtered = filtered.filter(product => product.is_popular === (popularityFilter === 'popular'));
    }

    // Поиск по названию
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setProducts(filtered);
  }, [categoryFilter, stockFilter, visibilityFilter, popularityFilter, searchQuery, productsData]);

  useEffect(() => {
    if (isError && error) {
      toast.error('Ошибка загрузки товаров: ' + error.message);
    }
  }, [isError, error]);

  const toggleInStockMutation = useMutation({
    mutationFn: async ({ id, in_stock }: { id: number; in_stock: boolean | null }) => {
      const { error } = await supabase
        .from('products')
        .update({ in_stock: !in_stock })
        .eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id) => {
      setProducts((old) =>
        old.map((product) =>
          product.id === id ? { ...product, in_stock: !product.in_stock } : product
        )
      );
    },
    onError: (error: Error) => toast.error('Ошибка: ' + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const product = fetchedProducts.find((p) => p.id === id);
      if (product?.images?.length) {
        const filePaths = product.images.map((url: string) =>
          decodeURIComponent(url.split('/').pop()!)
        );
        const { error: storageError } = await supabase.storage
          .from('product-image')
          .remove(filePaths);
        if (storageError) throw new Error(storageError.message);
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setProducts((old) => old.filter((p) => p.id !== productToDelete));
      toast.success('Товар удалён');
      closeModal();
    },
    onError: (error: Error) => toast.error('Ошибка: ' + error.message),
  });

  const openDeleteModal = (productId: number) => {
    setProductToDelete(productId);
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

  if (isError) {
    return <p className="text-center text-red-500">Ошибка: {error?.message}</p>;
  }

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
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'table'
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
              whileHover={{ scale: 1.05 }}
              aria-label="Отобразить товары в виде таблицы"
            >
              Таблица
            </motion.button>
            <motion.button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'cards'
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
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

      {/* Фильтры */}
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
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
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

      {isLoading ? (
        <p className="text-center text-gray-500">Загрузка...</p>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-500">
          {selectedPage ? 'Товары для этой страницы отсутствуют' : 'Товары отсутствуют'}
        </p>
      ) : (
        <ProductTable
          products={products}
          toggleInStock={(id, in_stock) => toggleInStockMutation.mutate({ id, in_stock })}
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
                  disabled={deleteMutation.isPending}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Отменить удаление"
                >
                  Отмена
                </motion.button>
                <motion.button
                  onClick={() => productToDelete && deleteMutation.mutate(productToDelete)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  disabled={deleteMutation.isPending}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Подтвердить удаление товара"
                >
                  {deleteMutation.isPending ? 'Удаляю...' : 'Удалить'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}