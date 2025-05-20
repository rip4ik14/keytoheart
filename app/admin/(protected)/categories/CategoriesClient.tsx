'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Subcategory {
  id: number;
  name: string;
  category_id: number | null;
  slug: string;
  is_visible: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
  subcategories: Subcategory[];
}

interface Props {
  categories: Category[];
}

// Серверные действия
const addCategory = async (formData: FormData) => {
  'use server';
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const is_visible = formData.get('is_visible') === 'true';

  if (!name.trim() || !slug.trim()) {
    throw new Error('Название и slug обязательны');
  }

  const { error } = await supabase.from('categories').insert({ name, slug, is_visible });
  if (error) throw new Error(error.message);

  return { success: true };
};

const updateCategory = async (formData: FormData) => {
  'use server';
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const is_visible = formData.get('is_visible') === 'true';

  if (!id || !name.trim() || !slug.trim()) {
    throw new Error('ID, название и slug обязательны');
  }

  const { error } = await supabase
    .from('categories')
    .update({ name, slug, is_visible })
    .eq('id', id);

  if (error) throw new Error(error.message);

  return { success: true };
};

const deleteCategory = async (formData: FormData) => {
  'use server';
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('ID обязателен');
  }

  // Проверка наличия товаров
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id)
    .limit(1);

  if (productsError) throw new Error(productsError.message);
  if (products?.length) {
    throw new Error('Нельзя удалить категорию с товарами');
  }

  // Удаление подкатегорий
  const { error: subError } = await supabase
    .from('subcategories')
    .delete()
    .eq('category_id', id);

  if (subError) throw new Error(subError.message);

  // Удаление категории
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
};

const addSubcategory = async (formData: FormData) => {
  'use server';
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const category_id = Number(formData.get('category_id'));
  const name = formData.get('name') as string;
  const is_visible = formData.get('is_visible') === 'true';

  if (!category_id || !name.trim()) {
    throw new Error('Категория и название обязательны');
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');

  const { error } = await supabase
    .from('subcategories')
    .insert({ category_id, name, slug, is_visible });

  if (error) throw new Error(error.message);

  return { success: true };
};

const updateSubcategory = async (formData: FormData) => {
  'use server';
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const is_visible = formData.get('is_visible') === 'true';

  if (!id || !name.trim()) {
    throw new Error('ID и название обязательны');
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');

  const { error } = await supabase
    .from('subcategories')
    .update({ name, slug, is_visible })
    .eq('id', id);

  if (error) throw new Error(error.message);

  return { success: true };
};

const deleteSubcategory = async (formData: FormData) => {
  'use server';
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('ID обязателен');
  }

  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) throw new Error(error.message);

  return { success: true };
};

export default function CategoriesClient({ categories: initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', is_visible: true });
  const [editingCategory, setEditingCategory] = useState<null | Category>(null);
  const [editingSub, setEditingSub] = useState<null | Subcategory>(null);
  const [newSubByCat, setNewSubByCat] = useState<Record<number, string>>({});
  const router = useRouter();

  // Функция транслитерации для генерации slug
  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .replace(/-+/g, '-');

  // Обработчики действий
  const handleAddCategory = async (formData: FormData) => {
    try {
      await addCategory(formData);
      toast.success('Категория добавлена');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateCategory = async (formData: FormData) => {
    try {
      await updateCategory(formData);
      toast.success('Категория обновлена');
      setEditingCategory(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCategory = async (formData: FormData) => {
    try {
      await deleteCategory(formData);
      toast.success('Категория удалена');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddSubcategory = async (formData: FormData) => {
    try {
      await addSubcategory(formData);
      toast.success('Подкатегория добавлена');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateSubcategory = async (formData: FormData) => {
    try {
      await updateSubcategory(formData);
      toast.success('Подкатегория обновлена');
      setEditingSub(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSubcategory = async (formData: FormData) => {
    try {
      await deleteSubcategory(formData);
      toast.success('Подкатегория удалена');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-black tracking-tight">
        Управление категориями
      </h1>

      {/* Добавление категории */}
      <div className="mb-8 border border-gray-200 p-4 sm:p-6 rounded-lg bg-gray-50 shadow-sm">
        <h2 className="font-semibold mb-3 text-black text-lg">➕ Добавить категорию</h2>
        <form action={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="category-name" className="sr-only">
              Название категории
            </label>
            <input
              id="category-name"
              name="name"
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
              name="slug"
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
          <input type="hidden" name="is_visible" value={String(newCategory.is_visible)} />
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-500"
            aria-label="Добавить категорию"
          >
            Добавить
          </button>
        </form>
      </div>

      {/* Список категорий */}
      {categories.length === 0 ? (
        <p className="text-center text-gray-500">Категории отсутствуют</p>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm bg-white"
              >
                {editingCategory && editingCategory.id === cat.id ? (
                  <form
                    action={handleUpdateCategory}
                    className="flex flex-col sm:flex-row gap-3 mb-3"
                  >
                    <div className="flex-1">
                      <label htmlFor={`edit-category-name-${cat.id}`} className="sr-only">
                        Название категории
                      </label>
                      <input
                        id={`edit-category-name-${cat.id}`}
                        name="name"
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
                        name="slug"
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
                          name="is_visible"
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
                      <input type="hidden" name="id" value={cat.id} />
                      <button
                        type="submit"
                        className="text-green-600 hover:underline text-sm whitespace-nowrap"
                        aria-label="Сохранить изменения категории"
                      >
                        💾 Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="text-gray-500 hover:underline text-sm whitespace-nowrap"
                        aria-label="Отменить редактирование категории"
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
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
                      <form
                        action={handleDeleteCategory}
                        onSubmit={(e) => {
                          if (!confirm(`Удалить категорию "${cat.name}" и все её подкатегории?`)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={cat.id} />
                        <button
                          type="submit"
                          className="text-red-600 text-sm hover:underline"
                          aria-label={`Удалить категорию ${cat.name}`}
                        >
                          🗑️ Удалить
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Подкатегории */}
                <ul className="mt-3 space-y-2 text-sm text-gray-800">
                  <AnimatePresence>
                    {cat.subcategories?.map((sub) => (
                      <motion.li
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-between items-center"
                      >
                        {editingSub && editingSub.id === sub.id ? (
                          <form
                            action={handleUpdateSubcategory}
                            className="flex items-center gap-2 w-full"
                          >
                            <label
                              htmlFor={`edit-subcategory-name-${sub.id}`}
                              className="sr-only"
                            >
                              Название подкатегории
                            </label>
                            <input
                              id={`edit-subcategory-name-${sub.id}`}
                              name="name"
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
                                name="is_visible"
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
                            <input type="hidden" name="id" value={sub.id} />
                            <button
                              type="submit"
                              className="text-green-600 hover:underline text-sm whitespace-nowrap"
                              aria-label="Сохранить изменения подкатегории"
                            >
                              💾 Сохранить
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSub(null)}
                              className="text-gray-500 hover:underline text-sm whitespace-nowrap"
                              aria-label="Отменить редактирование подкатегории"
                            >
                              Отмена
                            </button>
                          </form>
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
                              <form
                                action={handleDeleteSubcategory}
                                onSubmit={(e) => {
                                  if (!confirm(`Удалить подкатегорию "${sub.name}"?`)) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                <input type="hidden" name="id" value={sub.id} />
                                <button
                                  type="submit"
                                  className="text-red-600 hover:underline"
                                  aria-label={`Удалить подкатегорию ${sub.name}`}
                                >
                                  🗑️
                                </button>
                              </form>
                            </div>
                          </>
                        )}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                {/* Добавить подкатегорию */}
                <form action={handleAddSubcategory} className="mt-4 flex gap-3">
                  <div className="flex-1">
                    <label htmlFor={`add-subcategory-${cat.id}`} className="sr-only">
                      Название подкатегории
                    </label>
                    <input
                      id={`add-subcategory-${cat.id}`}
                      name="name"
                      type="text"
                      placeholder="Название подкатегории (например, Белый шоколад)"
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
                  <input type="hidden" name="category_id" value={cat.id} />
                  <input type="hidden" name="is_visible" value="true" />
                  <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-500"
                    aria-label="Добавить подкатегорию"
                  >
                    +
                  </button>
                </form>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}