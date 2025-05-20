'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/app/admin/layout';

// Интерфейсы
interface Category {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number | null;
  slug: string;
  is_visible: boolean;
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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');

// Функция для отправки аналитических событий
const sendAnalyticsEvent = (eventName: string, eventData: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', eventName, eventData);
    }
    // Яндекс.Метрика
    if ((window as any).ym) {
      (window as any).ym(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID, 'reachGoal', eventName, eventData);
    }
  }
};

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
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', is_visible: true });
  const [editingCategory, setEditingCategory] = useState<null | Category>(null);
  const [editingSub, setEditingSub] = useState<null | Subcategory>(null);
  const [newSubByCat, setNewSubByCat] = useState<Record<number, string>>({});
  const [token, setToken] = useState<string | null>(null);

  // Проверка авторизации и получение токена
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
        setToken(data.token); // Сохраняем токен
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

  // Загрузка категорий
  const { data: categories = [], isLoading, error, isError } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          is_visible,
          subcategories!subcategories_category_id_fkey(id, name, slug, category_id, is_visible)
        `)
        .order('id', { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []) as Category[];
    },
    enabled: isAuthenticated === true,
    initialData: [],
  });

  // Обработка ошибок загрузки
  useEffect(() => {
    if (isError && error) {
      toast.error('Ошибка загрузки категорий: ' + error.message);
    }
  }, [isError, error]);

  // Мутация для добавления категории
  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!newCategory.name.trim() || !newCategory.slug.trim()) {
        throw new Error('Название и slug обязательны');
      }
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCategory),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка добавления категории');
      }
    },
    onSuccess: () => {
      setNewCategory({ name: '', slug: '', is_visible: true });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Категория успешно добавлена');
      sendAnalyticsEvent('add_category', { category_name: newCategory.name });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Мутация для обновления категории
  const updateCategoryMutation = useMutation({
    mutationFn: async (cat: Category) => {
      if (!cat.name.trim() || !cat.slug.trim()) {
        throw new Error('Название и slug обязательны');
      }
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cat),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка обновления категории');
      }
    },
    onSuccess: () => {
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Категория обновлена');
      sendAnalyticsEvent('update_category', { category_id: editingCategory?.id });
    },
    onError: (error: Error) => toast.error('Ошибка обновления категории: ' + error.message),
  });

  // Мутация для удаления категории
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка удаления категории');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Категория удалена');
      sendAnalyticsEvent('delete_category', { category_id: editingCategory?.id });
    },
    onError: (error: Error) => toast.error('Ошибка удаления категории: ' + error.message),
  });

  // Мутация для добавления подкатегории
  const addSubcategoryMutation = useMutation({
    mutationFn: async ({ category_id, name, is_visible }: { category_id: number; name: string; is_visible: boolean }) => {
      if (!name.trim()) throw new Error('Название подкатегории обязательно');
      const slug = generateSlug(name);
      const res = await fetch('/api/admin/subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category_id, name, slug, is_visible }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка добавления подкатегории');
      }
    },
    onSuccess: (_data, variables) => {
      setNewSubByCat((prev) => ({ ...prev, [variables.category_id]: '' }));
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Подкатегория добавлена');
      sendAnalyticsEvent('add_subcategory', { category_id: variables.category_id, subcategory_name: variables.name });
    },
    onError: (error: Error) => toast.error('Ошибка добавления подкатегории: ' + error.message),
  });

  // Мутация для удаления подкатегории
  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch('/api/admin/subcategories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка удаления подкатегории');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Подкатегория удалена');
      sendAnalyticsEvent('delete_subcategory', { subcategory_id: editingSub?.id });
    },
    onError: (error: Error) => toast.error('Ошибка удаления подкатегории: ' + error.message),
  });

  // Мутация для обновления подкатегории
  const updateSubcategoryMutation = useMutation({
    mutationFn: async (sub: Subcategory) => {
      if (!sub.name.trim()) throw new Error('Название подкатегории обязательно');
      const slug = generateSlug(sub.name);
      const res = await fetch('/api/admin/subcategories', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: sub.id, name: sub.name, slug, is_visible: sub.is_visible }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка обновления подкатегории');
      }
    },
    onSuccess: () => {
      setEditingSub(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Подкатегория обновлена');
      sendAnalyticsEvent('update_subcategory', { subcategory_id: editingSub?.id });
    },
    onError: (error: Error) => toast.error('Ошибка обновления подкатегории: ' + error.message),
  });

  // Рендеринг
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Проверка авторизации...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-8 text-black tracking-tight">
          Управление категориями
        </h1>

        {/* Добавление категории */}
        <div className="mb-8 border border-gray-200 p-4 sm:p-6 rounded-lg bg-gray-50 shadow-sm">
          <h2 className="font-semibold mb-3 text-black text-lg">➕ Добавить категорию</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex- onfocus: bg-gray-100">
              <label htmlFor="category-name" className="sr-only">
                Название категории
              </label>
              <input
                id="category-name"
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
                aria-label="Название категории"
              />
              <p className="text-xs text-gray-500 mt-1">
                Например, "Клубника в шоколаде"
              </p>
            </div>
            <div className="flex-1">
              <label htmlFor="category-slug" className="sr-only">
                Slug категории
              </label>
              <input
                id="category-slug"
                type="text"
                value={newCategory.slug}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="Slug (например, bukety)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                aria-label="Slug категории"
              />
              <p className="text-xs text-gray-500 mt-1">
                Уникальный идентификатор для URL
              </p>
            </div>
            <button
              onClick={() => addCategoryMutation.mutate()}
              disabled={addCategoryMutation.isPending}
              className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-500"
              aria-label="Добавить категорию"
            >
              {addCategoryMutation.isPending ? 'Сохранение...' : 'Добавить'}
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
                  className="border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm bg-white"
                >
                  {editingCategory && editingCategory.id === cat.id ? (
                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                      <div className="flex-1">
                        <label htmlFor={`edit-category-name-${cat.id}`} className="sr-only">
                          Название категории
                        </label>
                        <input
                          id={`edit-category-name-${cat.id}`}
                          value={editingCategory.name}
                          onChange={(e) => {
                            if (editingCategory) {
                              setEditingCategory({ ...editingCategory, name: e.target.value });
                            }
                          }}
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                          aria-label="Название категории"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor={`edit-category-slug-${cat.id}`} className="sr-only">
                          Slug категории
                        </label>
                        <input
                          id={`edit-category-slug-${cat.id}`}
                          value={editingCategory.slug}
                          onChange={(e) => {
                            if (editingCategory) {
                              setEditingCategory({ ...editingCategory, slug: e.target.value });
                            }
                          }}
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                          aria-label="Slug категории"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={editingCategory.is_visible}
                            onChange={(e) => {
                              if (editingCategory) {
                                setEditingCategory({ ...editingCategory, is_visible: e.target.checked });
                              }
                            }}
                            className="mr-2"
                            aria-label="Видимость категории"
                          />
                          Видима
                        </label>
                        <button
                          onClick={() => {
                            if (editingCategory) {
                              updateCategoryMutation.mutate(editingCategory);
                            }
                          }}
                          className="text-green-600 hover:underline text-sm whitespace-nowrap"
                          disabled={updateCategoryMutation.isPending}
                          aria-label="Сохранить изменения категории"
                        >
                          💾 Сохранить
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="text-gray-500 hover:underline text-sm whitespace-nowrap"
                          aria-label="Отменить редактирование категории"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                      <div>
                        <h3
                          className={`font-bold text-lg ${cat.is_visible ? 'text-black' : 'text-gray-400'}`}
                        >
                          {cat.name} {cat.is_visible ? '' : '(Скрыта)'}
                        </h3>
                        <p className="text-sm text-gray-500">/{cat.slug}</p>
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => setEditingCategory(cat)}
                          className="text-blue-600 hover:underline text-sm"
                          aria-label={`Редактировать категорию ${cat.name}`}
                        >
                          ✏️ Редактировать
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Удалить категорию "${cat.name}" и все её подкатегории?`)) {
                              deleteCategoryMutation.mutate(cat.id);
                            }
                          }}
                          className="text-red-600 text-sm hover:underline"
                          disabled={deleteCategoryMutation.isPending}
                          aria-label={`Удалить категорию ${cat.name}`}
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    </div>
                  )}

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
                              <label htmlFor={`edit-subcategory-name-${sub.id}`} className="sr-only">
                                Название подкатегории
                              </label>
                              <input
                                id={`edit-subcategory-name-${sub.id}`}
                                value={editingSub.name}
                                onChange={(e) => {
                                  if (editingSub) {
                                    setEditingSub({ ...editingSub, name: e.target.value });
                                  }
                                }}
                                className="border border-gray-300 px-2 py-1 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                                aria-label="Название подкатегории"
                              />
                              <label className="flex items-center text-sm whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={editingSub.is_visible}
                                  onChange={(e) => {
                                    if (editingSub) {
                                      setEditingSub({ ...editingSub, is_visible: e.target.checked });
                                    }
                                  }}
                                  className="mr-2"
                                  aria-label="Видимость подкатегории"
                                />
                                Видима
                              </label>
                              <button
                                onClick={() => {
                                  if (editingSub) {
                                    updateSubcategoryMutation.mutate(editingSub);
                                  }
                                }}
                                className="text-green-600 hover:underline text-sm whitespace-nowrap"
                                disabled={updateSubcategoryMutation.isPending}
                                aria-label="Сохранить изменения подкатегории"
                              >
                                💾 Сохранить
                              </button>
                              <button
                                onClick={() => setEditingSub(null)}
                                className="text-gray-500 hover:underline text-sm whitespace-nowrap"
                                aria-label="Отменить редактирование подкатегории"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className={sub.is_visible ? 'text-gray-800' : 'text-gray-400'}>
                                {sub.name} {sub.is_visible ? '' : '(Скрыта)'}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingSub(sub)}
                                  className="text-blue-600 hover:underline"
                                  aria-label={`Редактировать подкатегорию ${sub.name}`}
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Удалить подкатегорию "${sub.name}"?`)) {
                                      deleteSubcategoryMutation.mutate(sub.id);
                                    }
                                  }}
                                  className="text-red-600 hover:underline"
                                  disabled={deleteSubcategoryMutation.isPending}
                                  aria-label={`Удалить подкатегорию ${sub.name}`}
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
                      <label htmlFor={`add-subcategory-${cat.id}`} className="sr-only">
                        Название подкатегории
                      </label>
                      <input
                        id={`add-subcategory-${cat.id}`}
                        type="text"
                        placeholder="Название подкатегории (например, Розы)"
                        value={newSubByCat[cat.id] || ''}
                        onChange={(e) =>
                          setNewSubByCat((prev) => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                        aria-label="Название подкатегории"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Например, "Белый шоколад"
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        addSubcategoryMutation.mutate({
                          category_id: cat.id,
                          name: newSubByCat[cat.id] || '',
                          is_visible: true,
                        })
                      }
                      className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-500"
                      disabled={addSubcategoryMutation.isPending}
                      aria-label="Добавить подкатегорию"
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