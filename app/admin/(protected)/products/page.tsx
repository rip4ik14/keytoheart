'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import SitePagesDropdown from '../components/SitePagesDropdown';
import ProductTable from './ProductTable';
import type { Database } from '@/lib/supabase/types_new';
import { Search, X, Plus, Trash2, Download } from 'lucide-react';

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
  bonus?: number | null;
  composition?: string | null;
  created_at?: string | null;
  description?: string | null;
  image_url?: string | null;
  short_desc?: string | null;
  slug?: string | null;
  production_time?: number | null;
  isSelected?: boolean;
}

export type ViewMode = 'table' | 'cards';

interface Category {
  id: number;
  name: string;
}

const queryClient = new QueryClient();

// Собственная реализация debounce
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

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
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('productViewMode') as ViewMode;
    if (savedMode) setViewMode(savedMode);
  }, []);

  useEffect(() => {
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

  const { data: fetchedProducts = [], isLoading, error, isError, refetch } = useQuery<Product[], Error>({
    queryKey: ['products', selectedPage],
    queryFn: async () => {
      const { data: productCategoryData, error: productCategoryError } = await supabase
        .from('product_categories')
        .select('product_id, category_id')
        .neq('category_id', 38);

      if (productCategoryError) {
        throw new Error(productCategoryError.message || 'Ошибка загрузки связей категорий');
      }

      const productCategoriesMap = new Map<number, number[]>();
      productCategoryData.forEach((item) => {
        const existing = productCategoriesMap.get(item.product_id) || [];
        productCategoriesMap.set(item.product_id, [...existing, item.category_id]);
      });

      const productIds = Array.from(productCategoriesMap.keys());

      let query = supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          original_price,
          discount_percent,
          images,
          in_stock,
          is_visible,
          is_popular,
          order_index,
          bonus,
          composition,
          created_at,
          description,
          image_url,
          short_desc,
          slug,
          production_time
        `)
        .in('id', productIds.length > 0 ? productIds : [0])
        .order('order_index', { ascending: true })
        .order('id', { ascending: false });

      if (selectedPage) {
        const parts = selectedPage.split('/').filter(Boolean);
        if (parts[0] === 'category' && parts.length === 2) {
          const categoryName = parts[1];
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categoryName)
            .single();

          if (categoryError || !categoryData) {
            throw new Error(categoryError?.message || 'Категория не найдена');
          }

          const categoryId = categoryData.id;
          const filteredProductIds = productCategoryData
            .filter((item) => item.category_id === categoryId)
            .map((item) => item.product_id);

          if (filteredProductIds.length === 0) return [];

          query = query.in('id', filteredProductIds);
        }
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message || 'Неизвестная ошибка при загрузке товаров');

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (categoriesError) throw new Error(categoriesError.message);
      setCategories(categoriesData || []);

      return data.map((product) => ({
        ...product,
        category_ids: productCategoriesMap.get(product.id) || [],
        in_stock: product.in_stock ?? false,
        is_visible: product.is_visible ?? false,
        is_popular: product.is_popular ?? false,
        order_index: product.order_index ?? 0,
        images: product.images || [],
        bonus: product.bonus ?? null,
        composition: product.composition ?? null,
        created_at: product.created_at ?? null,
        description: product.description ?? null,
        image_url: product.image_url ?? null,
        short_desc: product.short_desc ?? null,
        slug: product.slug ?? null,
        production_time: product.production_time ?? null,
        isSelected: selectedProducts.includes(product.id),
      }));
    },
    enabled: isAuthenticated === true,
    initialData: [],
  });

  useEffect(() => {
    setProducts(fetchedProducts);
  }, [fetchedProducts]);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  useEffect(() => {
    let filtered = fetchedProducts;

    if (categoryFilter) {
      filtered = filtered.filter((product) => product.category_ids.includes(Number(categoryFilter)));
    }

    if (stockFilter !== 'all') {
      filtered = filtered.filter((product) => product.in_stock === (stockFilter === 'in_stock'));
    }

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter((product) => product.is_visible === (visibilityFilter === 'visible'));
    }

    if (popularityFilter !== 'all') {
      filtered = filtered.filter((product) => product.is_popular === (popularityFilter === 'popular'));
    }

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setProducts(filtered);
  }, [categoryFilter, stockFilter, visibilityFilter, popularityFilter, searchQuery, fetchedProducts]);

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
      toast.success('Статус наличия обновлён');
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
      setSelectedProducts((old) => old.filter((id) => id !== productToDelete));
      toast.success('Товар удалён');
      closeModal();
    },
    onError: (error: Error) => toast.error('Ошибка: ' + error.message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const productsToDelete = fetchedProducts.filter((p) => ids.includes(p.id));
      for (const product of productsToDelete) {
        if (product.images?.length) {
          const filePaths = product.images.map((url) => decodeURIComponent(url.split('/').pop()!));
          const { error: storageError } = await supabase.storage
            .from('product-image')
            .remove(filePaths);
          if (storageError) throw new Error(storageError.message);
        }
      }

      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setProducts((old) => old.filter((p) => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
      toast.success('Выбранные товары удалены');
      closeModal();
    },
    onError: (error: Error) => toast.error('Ошибка: ' + error.message),
  });

  const exportToCsv = () => {
    const headers = ['ID', 'Название', 'Цена', 'Скидка (%)', 'В наличии', 'Видимость', 'Популярность', 'Категории'];
    const rows = products.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      p.price,
      p.discount_percent || 0,
      p.in_stock ? 'Да' : 'Нет',
      p.is_visible ? 'Видимый' : 'Скрыт',
      p.is_popular ? 'Популярный' : 'Обычный',
      `"${p.category_ids.map((id) => categories.find((c) => c.id === id)?.name || '—').join(', ')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'products_export.csv');
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Товары экспортированы в CSV');
  };

  const openDeleteModal = (productId: number) => {
    setProductToDelete(productId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setProductToDelete(null);
  };

  const handleSelectProduct = (id: number) => {
    setSelectedProducts((old) =>
      old.includes(id) ? old.filter((selectedId) => selectedId !== id) : [...old, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const resetFilters = () => {
    setCategoryFilter('');
    setStockFilter('all');
    setVisibilityFilter('all');
    setPopularityFilter('all');
    setSearchQuery('');
    setIsFilterPanelOpen(false);
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
      className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-sans"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">Управление товарами</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm sm:text-base flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            aria-label={isFilterPanelOpen ? 'Скрыть фильтры' : 'Показать фильтры'}
          >
            <Search size={16} />
            Фильтры
          </motion.button>
          <SitePagesDropdown selected={selectedPage} onSelect={setSelectedPage} />
          <div className="flex gap-2">
            <motion.button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm sm:text-base ${
                viewMode === 'table'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
              whileHover={{ scale: 1.05 }}
              aria-label="Отобразить товары в виде таблицы"
            >
              Таблица
            </motion.button>
            <motion.button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm sm:text-base ${
                viewMode === 'cards'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
              whileHover={{ scale: 1.05 }}
              aria-label="Отобразить товары в виде карточек"
            >
              Карточки
            </motion.button>
          </div>
          <motion.a
            href="/admin/new"
            className="px-4 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm sm:text-base flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            aria-label="Добавить новый товар"
          >
            <Plus size={16} />
            Добавить
          </motion.a>
        </div>
      </div>

      <AnimatePresence>
        {isFilterPanelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 p-4 rounded-lg shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label htmlFor="categoryFilter" className="block mb-1 text-sm font-medium text-gray-600">
                  Категория
                </label>
                <select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все категории</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="stockFilter" className="block mb-1 text-sm font-medium text-gray-600">
                  Наличие
                </label>
                <select
                  id="stockFilter"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все</option>
                  <option value="in_stock">В наличии</option>
                  <option value="out_of_stock">Нет в наличии</option>
                </select>
              </div>
              <div>
                <label htmlFor="visibilityFilter" className="block mb-1 text-sm font-medium text-gray-600">
                  Видимость
                </label>
                <select
                  id="visibilityFilter"
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все</option>
                  <option value="visible">Видимые</option>
                  <option value="hidden">Скрытые</option>
                </select>
              </div>
              <div>
                <label htmlFor="popularityFilter" className="block mb-1 text-sm font-medium text-gray-600">
                  Популярность
                </label>
                <select
                  id="popularityFilter"
                  value={popularityFilter}
                  onChange={(e) => setPopularityFilter(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Все</option>
                  <option value="popular">Популярные</option>
                  <option value="not_popular">Обычные</option>
                </select>
              </div>
              <div className="relative">
                <label htmlFor="searchQuery" className="block mb-1 text-sm font-medium text-gray-600">
                  Поиск
                </label>
                <div className="relative">
                  <input
                    id="searchQuery"
                    type="text"
                    onChange={(e) => debouncedSearch(e.target.value)}
                    placeholder="Поиск по названию..."
                    className="w-full p-2 pl-8 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Поиск товаров по названию"
                  />
                  <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <motion.button
                onClick={resetFilters}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                aria-label="Сбросить фильтры"
              >
                <X size={16} />
                Сбросить
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-md shadow-sm"
        >
          <span className="text-sm text-gray-600">
            Выбрано: {selectedProducts.length} товар(ов)
          </span>
          <motion.button
            onClick={() => bulkDeleteMutation.mutate(selectedProducts)}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            disabled={bulkDeleteMutation.isPending}
            aria-label="Удалить выбранные товары"
          >
            <Trash2 size={16} />
            Удалить
          </motion.button>
        </motion.div>
      )}

      <div className="flex justify-between items-center">
        <motion.button
          onClick={handleSelectAll}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          whileHover={{ scale: 1.05 }}
          aria-label={selectedProducts.length === products.length ? 'Снять выделение' : 'Выделить все'}
        >
          {selectedProducts.length === products.length ? 'Снять выделение' : 'Выделить все'}
        </motion.button>
        <motion.button
          onClick={exportToCsv}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          aria-label="Экспортировать товары в CSV"
        >
          <Download size={16} />
          Экспорт
        </motion.button>
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
          onSelect={handleSelectProduct}
        />
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            role="dialog"
            aria-labelledby="delete-modal-title"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full"
            >
              <h3 id="delete-modal-title" className="text-lg font-semibold mb-4 text-gray-800">
                Подтверждение удаления
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedProducts.length > 1
                  ? `Вы уверены, что хотите удалить ${selectedProducts.length} товаров?`
                  : 'Вы уверены, что хотите удалить этот товар?'}
                Это действие нельзя отменить.
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-gray-700 text-sm"
                  disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Отменить удаление"
                >
                  Отмена
                </motion.button>
                <motion.button
                  onClick={() =>
                    productToDelete
                      ? deleteMutation.mutate(productToDelete)
                      : bulkDeleteMutation.mutate(selectedProducts)
                  }
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                  disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Подтвердить удаление"
                >
                  {deleteMutation.isPending || bulkDeleteMutation.isPending ? 'Удаляю...' : 'Удалить'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}