'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '../../layout';

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number | null;
  slug: string;
}

const queryClient = new QueryClient();

// Функция транслитерации для генерации slug
const transliterate = (text: string) => {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ы: 'y', э: 'e', ю: 'yu', я: 'ya',
  };
  return text
    .split('')
    .map((char) => map[char.toLowerCase()] || char)
    .join('');
};

// Функция для генерации slug с транслитерацией
const generateSlug = (name: string) =>
  transliterate(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Убираем все, кроме латинских букв и цифр
    .replace(/(^-|-$)/g, '') // Убираем дефисы в начале и конце
    .replace(/-+/g, '-'); // Убираем множественные дефисы

export default function AdminCategoriesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <CategoriesContent />
    </QueryClientProvider>
  );
}

function CategoriesContent() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });
  const [editingSub, setEditingSub] = useState<null | Subcategory>(null);
  const [newSubByCat, setNewSubByCat] = useState<Record<number, string>>({});

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin-session', {
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Доступ запрещён');
        }
        setIsAuthenticated(true);
      } catch (err: any) {
        toast.error('Войдите как администратор');
        setTimeout(() => {
          router.push(`/admin/login?from=${encodeURIComponent('/admin/categories')}`);
        }, 100);
      }
    };

    checkAuth();
  }, [router]);

  const { data: categories = [], isLoading, error, isError } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories!subcategories_category_id_fkey(id, name, slug, category_id)
        `)
        .order('id', { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []) as Category[];
    },
    enabled: isAuthenticated === true,
    initialData: [],
  });

  // Обработка ошибок через isError и error
  useEffect(() => {
    if (isError && error) {
      toast.error('Ошибка загрузки категорий: ' + error.message);
    }
  }, [isError, error]);

  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!newCategory.name.trim() || !newCategory.slug.trim()) {
        throw new Error('Название и slug обязательны');
      }
      const { error } = await supabase.from('categories').insert(newCategory);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNewCategory({ name: '', slug: '' });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Категория успешно добавлена');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const category = categories.find((cat: Category) => cat.id === id);
      if (!category) throw new Error('Категория не найдена');

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category', category.slug)
        .limit(1);
      if (productsError) throw new Error(productsError.message);
      if (products?.length) {
        throw new Error('Нельзя удалить категорию, так как в ней есть товары');
      }

      const { error: subError } = await supabase
        .from('subcategories')
        .delete()
        .eq('category_id', id);
      if (subError) throw new Error(subError.message);

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Категория удалена');
    },
    onError: (error: Error) => toast.error('Ошибка удаления категории: ' + error.message),
  });

  const addSubcategoryMutation = useMutation({
    mutationFn: async ({ category_id, name }: { category_id: number; name: string }) => {
      if (!name.trim()) throw new Error('Название подкатегории обязательно');
      const slug = generateSlug(name);
      const { error } = await supabase
        .from('subcategories')
        .insert({ name, category_id, slug });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      setNewSubByCat((prev) => ({ ...prev, [variables.category_id]: '' }));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Подкатегория добавлена');
    },
    onError: (error: Error) => toast.error('Ошибка добавления подкатегории: ' + error.message),
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('subcategories').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Подкатегория удалена');
    },
    onError: (error: Error) => toast.error('Ошибка удаления подкатегории: ' + error.message),
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: async (sub: Subcategory) => {
      if (!sub.name.trim()) throw new Error('Название подкатегории обязательно');
      const slug = generateSlug(sub.name);
      const { error } = await supabase
        .from('subcategories')
        .update({ name: sub.name, slug })
        .eq('id', sub.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setEditingSub(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Подкатегория обновлена');
    },
    onError: (error: Error) => toast.error('Ошибка обновления подкатегории: ' + error.message),
  });

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Проверка авторизации...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isError) {
    return <p className="text-center text-red-500">Ошибка: {error?.message}</p>;
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto py-8 px-4 font-sans"
      >
        <h1 className="text-3xl font-bold mb-8 text-black tracking-tight">
          Категории и подкатегории
        </h1>

        {/* Добавление категории */}
        <div className="mb-8 border border-gray-200 p-4 rounded-lg bg-gray-50 shadow-sm">
          <h2 className="font-semibold mb-3 text-black">➕ Добавить категорию</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewCategory((prev) => ({
                    ...prev,
                    name,
                    slug: prev.slug || generateSlug(name),
                  }));
                }}
                placeholder="Название (например, Букеты)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Введите название категории, например, "Клубника в шоколаде".
              </p>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newCategory.slug}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="Slug (например, bukety)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
              />
              <p className="text-xs text-gray-500 mt-1">
                Уникальный идентификатор для URL (только латинские буквы, без пробелов).
              </p>
            </div>
            <button
              onClick={() => addCategoryMutation.mutate()}
              disabled={addCategoryMutation.isPending}
              className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-500"
            >
              {addCategoryMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>

        {/* Список категорий */}
        {isLoading ? (
          <p className="text-center text-gray-500">Загрузка...</p>
        ) : categories.length === 0 ? (
          <p className="text-center text-gray-500">Категории отсутствуют</p>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {categories.map((cat: Category) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-200 p-4 rounded-lg shadow-sm bg-white"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-black">{cat.name}</h3>
                      <p className="text-sm text-gray-500">/{cat.slug}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Удалить категорию и все её подкатегории?')) {
                          deleteCategoryMutation.mutate(cat.id);
                        }
                      }}
                      className="text-red-600 text-sm hover:underline"
                      disabled={deleteCategoryMutation.isPending}
                    >
                      Удалить
                    </button>
                  </div>

                  {/* Подкатегории */}
                  <ul className="mt-3 space-y-2 text-sm text-gray-800">
                    <AnimatePresence>
                      {cat.subcategories?.map((sub: Subcategory) => (
                        <motion.li
                          key={sub.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex justify-between items-center"
                        >
                          {editingSub && editingSub.id === sub.id ? (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                value={editingSub.name}
                                onChange={(e) => {
                                  if (editingSub) {
                                    setEditingSub({ ...editingSub, name: e.target.value });
                                  }
                                }}
                                className="border border-gray-300 px-2 py-1 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                              />
                              <button
                                onClick={() => {
                                  if (editingSub) {
                                    updateSubcategoryMutation.mutate(editingSub);
                                  }
                                }}
                                className="text-green-600 hover:underline text-sm whitespace-nowrap"
                                disabled={updateSubcategoryMutation.isPending}
                              >
                                💾 Сохранить
                              </button>
                              <button
                                onClick={() => setEditingSub(null)}
                                className="text-gray-500 hover:underline text-sm whitespace-nowrap"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <>
                              <span>{sub.name}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingSub(sub)}
                                  className="text-blue-600 hover:underline"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Удалить подкатегорию?')) {
                                      deleteSubcategoryMutation.mutate(sub.id);
                                    }
                                  }}
                                  className="text-red-600 hover:underline"
                                  disabled={deleteSubcategoryMutation.isPending}
                                >
                                  🗑️
                                </button>
                              </div>
                            </>
                          )}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>

                  {/* Добавить подкатегорию */}
                  <div className="mt-4 flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Название подкатегории (например, Розы)"
                        value={newSubByCat[cat.id] || ''}
                        onChange={(e) =>
                          setNewSubByCat((prev) => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Введите название подкатегории, например, "Белый шоколад".
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        addSubcategoryMutation.mutate({
                          category_id: cat.id,
                          name: newSubByCat[cat.id] || '',
                        })
                      }
                      className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-500"
                      disabled={addSubcategoryMutation.isPending}
                    >
                      {addSubcategoryMutation.isPending ? 'Добавление...' : '+'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}