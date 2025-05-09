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

// Определяем интерфейс для данных, возвращаемых queryFn
interface FetchedProduct {
  id: number;
  title: string;
  price: number;
  discount_percent: number | null;
  category: string;
  images: string[] | null;
  in_stock: boolean | null;
  is_visible: boolean | null;
  category_slug: string | null;
}

// Определяем полный интерфейс Product на основе базы данных
export type Product = Database['public']['Tables']['products']['Row'] & {
  category_slug?: string | null;
};

export type ViewMode = 'table' | 'cards';

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

  const { data: fetchedProducts = [], isLoading, error, isError } = useQuery<FetchedProduct[], Error>({
    queryKey: ['products', selectedPage],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, title, price, discount_percent, category, images, in_stock, is_visible')
        .order('id', { ascending: false });

      if (selectedPage) {
        const parts = selectedPage.split('/').filter(Boolean);
        if (parts[0] === 'category' && parts.length === 2) {
          query = query.eq('category', parts[1]);
        }
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message || 'Неизвестная ошибка при загрузке товаров');
      return data.map((product) => ({
        ...product,
        category: product.category || 'Без категории',
        category_slug: product.category || null,
      }));
    },
    enabled: isAuthenticated === true,
    initialData: [],
  });

  // Приводим FetchedProduct[] к Product[], добавляя недостающие поля
  const products: Product[] = fetchedProducts.map((product) => ({
    ...product,
    bonus: null,
    category_id: null,
    subcategory_id: null,
    composition: null,
    created_at: null,
    description: null,
    image_url: null,
    is_popular: null,
    original_price: null,
    short_desc: null,
    slug: null,
    production_time: null, // Добавляем поле production_time
  }));

  // Обработка ошибок через isError и error
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
      queryClient.setQueryData<FetchedProduct[]>(['products', selectedPage], (old) =>
        old?.map((product) =>
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
      queryClient.invalidateQueries({ queryKey: ['products', selectedPage] });
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
      className="max-w-6xl mx-auto p-6 space-y-6 font-sans"
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
            href="/admin/add-product"
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
            whileHover={{ scale: 1.05 }}
            aria-label="Добавить новый товар"
          >
            Добавить товар
          </motion.a>
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
              <h3 id="delete-modal-title" className="text-lg font-semibold mb-4">
                Подтверждение удаления
              </h3>
              <p className="text-gray-600 mb-6">
                Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                  disabled={deleteMutation.isPending}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Отменить удаление"
                >
                  Отмена
                </motion.button>
                <motion.button
                  onClick={() => productToDelete && deleteMutation.mutate(productToDelete)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
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