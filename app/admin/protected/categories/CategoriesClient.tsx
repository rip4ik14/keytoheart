'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from './actions';

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

export default function CategoriesClient({ categories: initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', is_visible: true });
  const [editingCategory, setEditingCategory] = useState<null | Category>(null);
  const [editingSub, setEditingSub] = useState<null | Subcategory>(null);
  const [newSubByCat, setNewSubByCat] = useState<Record<number, string>>({});

  // Генерация slug
  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9а-я]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .replace(/-+/g, '-');

  // --- Категории ---
  const handleAddCategory = async (formData: FormData) => {
    try {
      await addCategory(formData);
      // Локальное добавление (только если сервер не возвращает новую запись - иначе тут нужен fetch)
      setCategories(prev => [
        ...prev,
        {
          id: Date.now(), // временный id, лучше refetch для точных данных
          name: formData.get('name') as string,
          slug: formData.get('slug') as string,
          is_visible: true,
          subcategories: [],
        },
      ]);
      setNewCategory({ name: '', slug: '', is_visible: true });
      toast.success('Категория добавлена');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateCategory = async (formData: FormData) => {
    try {
      const id = Number(formData.get('id'));
      await updateCategory(formData);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === id
            ? {
                ...cat,
                name: formData.get('name') as string,
                slug: formData.get('slug') as string,
                is_visible: formData.get('is_visible') === 'true',
              }
            : cat
        )
      );
      setEditingCategory(null);
      toast.success('Категория обновлена');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Удалить категорию "${name}" и все её подкатегории?`)) return;
    const formData = new FormData();
    formData.append('id', id.toString());
    try {
      await deleteCategory(formData);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      toast.success('Категория удалена');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleCategory = async (cat: Category) => {
    const formData = new FormData();
    formData.append('id', cat.id.toString());
    formData.append('name', cat.name);
    formData.append('slug', cat.slug);
    formData.append('is_visible', String(!cat.is_visible));
    try {
      await updateCategory(formData);
      setCategories(prev =>
        prev.map(c =>
          c.id === cat.id ? { ...c, is_visible: !cat.is_visible } : c
        )
      );
      toast.success(cat.is_visible ? 'Категория скрыта' : 'Категория отображается');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // --- Подкатегории ---
  const handleAddSubcategory = async (catId: number) => {
    const name = newSubByCat[catId]?.trim();
    if (!name) {
      toast.error('Введите название подкатегории');
      return;
    }
    const formData = new FormData();
    formData.append('category_id', catId.toString());
    formData.append('name', name);
    formData.append('is_visible', 'true');
    try {
      await addSubcategory(formData);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: [
                  ...cat.subcategories,
                  {
                    id: Date.now(), // временный id
                    name,
                    category_id: catId,
                    slug: generateSlug(name),
                    is_visible: true,
                  },
                ],
              }
            : cat
        )
      );
      setNewSubByCat((prev) => ({ ...prev, [catId]: '' }));
      toast.success('Подкатегория добавлена');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditSubcategory = (sub: Subcategory) => {
    setEditingSub({ ...sub });
  };

  const handleUpdateSubcategory = async (formData: FormData) => {
    try {
      const id = Number(formData.get('id'));
      await updateSubcategory(formData);
      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          subcategories: cat.subcategories.map(sub =>
            sub.id === id
              ? {
                  ...sub,
                  name: formData.get('name') as string,
                  slug: formData.get('slug') as string,
                  is_visible: formData.get('is_visible') === 'true',
                }
              : sub
          ),
        }))
      );
      setEditingSub(null);
      toast.success('Подкатегория обновлена');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSubcategory = async (id: number, name: string, catId: number) => {
    if (!confirm(`Удалить подкатегорию "${name}"?`)) return;
    const formData = new FormData();
    formData.append('id', id.toString());
    try {
      await deleteSubcategory(formData);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === catId
            ? { ...cat, subcategories: cat.subcategories.filter(sub => sub.id !== id) }
            : cat
        )
      );
      toast.success('Подкатегория удалена');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleSub = async (sub: Subcategory, catId: number) => {
    const formData = new FormData();
    formData.append('id', sub.id.toString());
    formData.append('name', sub.name);
    formData.append('slug', sub.slug);
    formData.append('is_visible', String(!sub.is_visible));
    try {
      await updateSubcategory(formData);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: cat.subcategories.map(s =>
                  s.id === sub.id ? { ...s, is_visible: !sub.is_visible } : s
                ),
              }
            : cat
        )
      );
      toast.success(sub.is_visible ? 'Подкатегория скрыта' : 'Подкатегория отображается');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // --- UI ---
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-black tracking-tight">
        Управление категориями
      </h1>

      {/* Добавление категории */}
      <div className="mb-8 border border-gray-200 p-4 sm:p-6 rounded-lg bg-gray-50 shadow-sm">
        <h2 className="font-semibold mb-3 text-black text-lg">➕ Добавить категорию</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleAddCategory(formData);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="flex-1">
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
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Например, "Клубника в шоколаде"
            </p>
          </div>
          <div className="flex-1">
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
              required
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
                {/* --- Редактирование категории --- */}
                {editingCategory && editingCategory.id === cat.id ? (
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleUpdateCategory(formData);
                    }}
                    className="flex flex-col sm:flex-row gap-3 mb-3"
                  >
                    <div className="flex-1">
                      <input
                        name="name"
                        value={editingCategory.name}
                        onChange={(e) => {
                          setEditingCategory({ ...editingCategory, name: e.target.value });
                        }}
                        className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                        aria-label="Название категории"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        name="slug"
                        value={editingCategory.slug}
                        onChange={(e) => {
                          setEditingCategory({ ...editingCategory, slug: e.target.value });
                        }}
                        className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                        aria-label="Slug категории"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          name="is_visible"
                          checked={editingCategory.is_visible}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, is_visible: e.target.checked })
                          }
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
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleCategory(cat)}
                        className={`text-sm ${cat.is_visible ? 'text-yellow-600' : 'text-gray-400'} hover:underline`}
                        aria-label={cat.is_visible ? 'Скрыть категорию' : 'Показать категорию'}
                      >
                        {cat.is_visible ? '👁️ Скрыть' : '👁️ Показать'}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="text-red-600 text-sm hover:underline"
                        aria-label={`Удалить категорию ${cat.name}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}

                {/* --- Подкатегории --- */}
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
                            onSubmit={e => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              handleUpdateSubcategory(formData);
                            }}
                            className="flex items-center gap-2 w-full"
                          >
                            <input
                              name="name"
                              value={editingSub.name}
                              onChange={(e) => setEditingSub({ ...editingSub, name: e.target.value })}
                              className="border border-gray-300 px-2 py-1 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                              aria-label="Название подкатегории"
                              required
                            />
                            <input
                              type="hidden"
                              name="id"
                              value={sub.id}
                            />
                            <input
                              type="hidden"
                              name="slug"
                              value={editingSub.slug}
                            />
                            <label className="flex items-center text-sm whitespace-nowrap">
                              <input
                                type="checkbox"
                                name="is_visible"
                                checked={editingSub.is_visible}
                                onChange={(e) =>
                                  setEditingSub({ ...editingSub, is_visible: e.target.checked })
                                }
                                className="mr-2"
                                aria-label="Видимость подкатегории"
                              />
                              Видима
                            </label>
                            <button
                              type="submit"
                              className="text-green-600 hover:underline text-sm whitespace-nowrap"
                              aria-label="Сохранить изменения подкатегории"
                            >
                              💾
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
                                onClick={() => handleEditSubcategory(sub)}
                                className="text-blue-600 hover:underline"
                                aria-label={`Редактировать подкатегорию ${sub.name}`}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleToggleSub(sub, cat.id)}
                                className={`text-sm ${sub.is_visible ? 'text-yellow-600' : 'text-gray-400'} hover:underline`}
                                aria-label={sub.is_visible ? 'Скрыть подкатегорию' : 'Показать подкатегорию'}
                              >
                                {sub.is_visible ? '👁️ Скрыть' : '👁️ Показать'}
                              </button>
                              <button
                                onClick={() => handleDeleteSubcategory(sub.id, sub.name, cat.id)}
                                className="text-red-600 hover:underline"
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
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleAddSubcategory(cat.id);
                  }}
                  className="mt-4 flex gap-3"
                >
                  <div className="flex-1">
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
