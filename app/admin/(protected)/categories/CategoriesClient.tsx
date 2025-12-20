// ✅ Путь: app/admin/(protected)/categories/CategoriesClient.tsx
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

type SeoFields = {
  seo_h1?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_text?: string | null;
  og_image?: string | null;
  seo_noindex?: boolean | null;
};

interface Subcategory extends SeoFields {
  id: number;
  name: string;
  category_id: number | null;
  slug: string;
  is_visible: boolean;
}

interface Category extends SeoFields {
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

  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    is_visible: true,

    seo_h1: '',
    seo_title: '',
    seo_description: '',
    seo_text: '',
    og_image: '',
    seo_noindex: false,
  });

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

  // helpers
  const appendSeoToFormData = (fd: FormData, seo: SeoFields) => {
    fd.set('seo_h1', String(seo.seo_h1 ?? ''));
    fd.set('seo_title', String(seo.seo_title ?? ''));
    fd.set('seo_description', String(seo.seo_description ?? ''));
    fd.set('seo_text', String(seo.seo_text ?? ''));
    fd.set('og_image', String(seo.og_image ?? ''));

    // ВАЖНО: чекбоксы кладём как true/false
    fd.set('seo_noindex', String(!!seo.seo_noindex));
  };

  /* ------------------------------ Категории ------------------------------ */

  const handleAddCategory = async (formData: FormData) => {
    try {
      // гарантируем правильные значения
      formData.set('is_visible', String(newCategory.is_visible));
      formData.set('seo_noindex', String(newCategory.seo_noindex));

      await addCategory(formData);

      setCategories((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: formData.get('name') as string,
          slug: formData.get('slug') as string,
          is_visible: true,
          subcategories: [],

          seo_h1: (formData.get('seo_h1') as string) || '',
          seo_title: (formData.get('seo_title') as string) || '',
          seo_description: (formData.get('seo_description') as string) || '',
          seo_text: (formData.get('seo_text') as string) || '',
          og_image: (formData.get('og_image') as string) || '',
          seo_noindex: (formData.get('seo_noindex') as string) === 'true',
        },
      ]);

      setNewCategory({
        name: '',
        slug: '',
        is_visible: true,
        seo_h1: '',
        seo_title: '',
        seo_description: '',
        seo_text: '',
        og_image: '',
        seo_noindex: false,
      });

      toast.success('Категория добавлена');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateCategory = async (formData: FormData) => {
    try {
      const id = Number(formData.get('id'));

      // ВАЖНО: чекбоксы вручную
      if (editingCategory) {
        formData.set('is_visible', String(!!editingCategory.is_visible));
        appendSeoToFormData(formData, editingCategory);
      }

      await updateCategory(formData);

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id
            ? {
                ...cat,
                name: formData.get('name') as string,
                slug: formData.get('slug') as string,
                is_visible: formData.get('is_visible') === 'true',

                seo_h1: (formData.get('seo_h1') as string) || '',
                seo_title: (formData.get('seo_title') as string) || '',
                seo_description: (formData.get('seo_description') as string) || '',
                seo_text: (formData.get('seo_text') as string) || '',
                og_image: (formData.get('og_image') as string) || '',
                seo_noindex: (formData.get('seo_noindex') as string) === 'true',
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
    formData.set('id', id.toString());
    try {
      await deleteCategory(formData);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      toast.success('Категория удалена');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleCategory = async (cat: Category) => {
    const formData = new FormData();
    formData.set('id', cat.id.toString());
    formData.set('name', cat.name);
    formData.set('slug', cat.slug);
    formData.set('is_visible', String(!cat.is_visible));
    appendSeoToFormData(formData, cat);

    try {
      await updateCategory(formData);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_visible: !cat.is_visible } : c))
      );
      toast.success(cat.is_visible ? 'Категория скрыта' : 'Категория отображается');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /* ---------------------------- Подкатегории ---------------------------- */

  const handleAddSubcategory = async (catId: number) => {
    const name = newSubByCat[catId]?.trim();
    if (!name) {
      toast.error('Введите название подкатегории');
      return;
    }

    const slug = generateSlug(name);

    const formData = new FormData();
    formData.set('category_id', catId.toString());
    formData.set('name', name);
    formData.set('slug', slug);
    formData.set('is_visible', 'true');

    appendSeoToFormData(formData, {
      seo_h1: '',
      seo_title: '',
      seo_description: '',
      seo_text: '',
      og_image: '',
      seo_noindex: false,
    });

    try {
      await addSubcategory(formData);

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: [
                  ...cat.subcategories,
                  {
                    id: Date.now(),
                    name,
                    category_id: catId,
                    slug,
                    is_visible: true,

                    seo_h1: '',
                    seo_title: '',
                    seo_description: '',
                    seo_text: '',
                    og_image: '',
                    seo_noindex: false,
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

  const handleEditSubcategory = (sub: Subcategory) => setEditingSub({ ...sub });

  const handleUpdateSubcategory = async (formData: FormData) => {
    try {
      const id = Number(formData.get('id'));

      if (editingSub) {
        formData.set('is_visible', String(!!editingSub.is_visible));
        appendSeoToFormData(formData, editingSub);
        // slug держим из hidden input, но если хочешь менять - просто добавь поле в UI
      }

      await updateSubcategory(formData);

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          subcategories: cat.subcategories.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  name: formData.get('name') as string,
                  slug: (formData.get('slug') as string) || sub.slug,
                  is_visible: formData.get('is_visible') === 'true',

                  seo_h1: (formData.get('seo_h1') as string) || '',
                  seo_title: (formData.get('seo_title') as string) || '',
                  seo_description: (formData.get('seo_description') as string) || '',
                  seo_text: (formData.get('seo_text') as string) || '',
                  og_image: (formData.get('og_image') as string) || '',
                  seo_noindex: (formData.get('seo_noindex') as string) === 'true',
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
    formData.set('id', id.toString());
    try {
      await deleteSubcategory(formData);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === catId
            ? { ...cat, subcategories: cat.subcategories.filter((sub) => sub.id !== id) }
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
    formData.set('id', sub.id.toString());
    formData.set('name', sub.name);
    formData.set('slug', sub.slug);
    formData.set('is_visible', String(!sub.is_visible));
    appendSeoToFormData(formData, sub);

    try {
      await updateSubcategory(formData);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: cat.subcategories.map((s) =>
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

  /* --------------------------------- UI --------------------------------- */

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-black tracking-tight">Управление категориями</h1>

      {/* Добавление категории */}
      <div className="mb-8 border border-gray-200 p-4 sm:p-6 rounded-lg bg-gray-50 shadow-sm">
        <h2 className="font-semibold mb-3 text-black text-lg">➕ Добавить категорию</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);

            // ВАЖНО: checkbox -> true/false
            formData.set('is_visible', String(newCategory.is_visible));
            formData.set('seo_noindex', String(newCategory.seo_noindex));

            handleAddCategory(formData);
          }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
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
                    seo_h1: prev.seo_h1 || name,
                  }));
                }}
                placeholder="Название (например, Клубника в шоколаде)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                aria-label="Название категории"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Например, "Клубника в шоколаде"</p>
            </div>

            <div>
              <input
                id="category-slug"
                name="slug"
                type="text"
                value={newCategory.slug}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="Slug (например, klubnika-v-shokolade)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
                aria-label="Slug категории"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Уникальный идентификатор для URL</p>
            </div>
          </div>

          {/* SEO блок */}
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-gray-700 select-none">
              SEO поля (необязательно, но очень желательно)
            </summary>

            <div className="mt-3 grid grid-cols-1 gap-3">
              <input
                name="seo_h1"
                type="text"
                value={newCategory.seo_h1}
                onChange={(e) => setNewCategory((p) => ({ ...p, seo_h1: e.target.value }))}
                placeholder="SEO H1 (например, Клубника в шоколаде с доставкой в Краснодаре)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
              />

              <input
                name="seo_title"
                type="text"
                value={newCategory.seo_title}
                onChange={(e) => setNewCategory((p) => ({ ...p, seo_title: e.target.value }))}
                placeholder="SEO Title (до 60-65 символов)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
              />

              <textarea
                name="seo_description"
                value={newCategory.seo_description}
                onChange={(e) => setNewCategory((p) => ({ ...p, seo_description: e.target.value }))}
                placeholder="SEO Description (до 140-160 символов)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black min-h-[70px]"
              />

              <input
                name="og_image"
                type="text"
                value={newCategory.og_image}
                onChange={(e) => setNewCategory((p) => ({ ...p, og_image: e.target.value }))}
                placeholder="OG image URL (опционально)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
              />

              <textarea
                name="seo_text"
                value={newCategory.seo_text}
                onChange={(e) => setNewCategory((p) => ({ ...p, seo_text: e.target.value }))}
                placeholder="SEO текст (будет на странице категории внизу)"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black min-h-[120px]"
              />

              <label className="flex items-center text-sm text-gray-700 gap-2">
                <input
                  type="checkbox"
                  checked={newCategory.seo_noindex}
                  onChange={(e) => setNewCategory((p) => ({ ...p, seo_noindex: e.target.checked }))}
                />
                noindex (не индексировать страницу)
              </label>
            </div>
          </details>

          {/* скрытая передача чекбокса */}
          <input type="hidden" name="is_visible" value={String(newCategory.is_visible)} />
          <input type="hidden" name="seo_noindex" value={String(newCategory.seo_noindex)} />

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
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);

                      formData.set('is_visible', String(!!editingCategory.is_visible));
                      appendSeoToFormData(formData, editingCategory);

                      handleUpdateCategory(formData);
                    }}
                    className="flex flex-col gap-3 mb-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        name="name"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                        aria-label="Название категории"
                        required
                      />

                      <input
                        name="slug"
                        value={editingCategory.slug}
                        onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                        className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                        aria-label="Slug категории"
                        required
                      />
                    </div>

                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={editingCategory.is_visible}
                        onChange={(e) => setEditingCategory({ ...editingCategory, is_visible: e.target.checked })}
                        className="mr-2"
                      />
                      Видима
                    </label>

                    <details>
                      <summary className="cursor-pointer text-sm text-gray-700 select-none">SEO категории</summary>
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <input
                          value={editingCategory.seo_h1 ?? ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, seo_h1: e.target.value })}
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                          placeholder="SEO H1"
                        />
                        <input
                          value={editingCategory.seo_title ?? ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, seo_title: e.target.value })}
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                          placeholder="SEO Title"
                        />
                        <textarea
                          value={editingCategory.seo_description ?? ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, seo_description: e.target.value })}
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black min-h-[70px]"
                          placeholder="SEO Description"
                        />
                        <input
                          value={editingCategory.og_image ?? ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, og_image: e.target.value })}
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                          placeholder="OG image URL"
                        />
                        <textarea
                          value={editingCategory.seo_text ?? ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, seo_text: e.target.value })}
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black min-h-[120px]"
                          placeholder="SEO текст"
                        />
                        <label className="flex items-center text-sm text-gray-700 gap-2">
                          <input
                            type="checkbox"
                            checked={!!editingCategory.seo_noindex}
                            onChange={(e) =>
                              setEditingCategory({ ...editingCategory, seo_noindex: e.target.checked })
                            }
                          />
                          noindex
                        </label>

                        {/* скрытое поле, чтобы на сервер улетало точно */}
                        <input type="hidden" name="seo_noindex" value={String(!!editingCategory.seo_noindex)} />
                        <input type="hidden" name="is_visible" value={String(!!editingCategory.is_visible)} />
                      </div>
                    </details>

                    <input type="hidden" name="id" value={cat.id} />

                    <div className="flex items-center gap-3">
                      <button type="submit" className="text-green-600 hover:underline text-sm whitespace-nowrap">
                        💾 Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="text-gray-500 hover:underline text-sm whitespace-nowrap"
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                    <div>
                      <h3 className={`font-bold text-lg ${cat.is_visible ? 'text-black' : 'text-gray-400'}`}>
                        {cat.name} {cat.is_visible ? '' : '(Скрыта)'}
                      </h3>
                      <p className="text-sm text-gray-500">/{cat.slug}</p>
                    </div>

                    <div className="flex gap-2 mt-2 sm:mt-0">
                      <button onClick={() => setEditingCategory(cat)} className="text-blue-600 hover:underline text-sm">
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleCategory(cat)}
                        className={`text-sm ${cat.is_visible ? 'text-yellow-600' : 'text-gray-400'} hover:underline`}
                      >
                        {cat.is_visible ? '👁️ Скрыть' : '👁️ Показать'}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="text-red-600 text-sm hover:underline"
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
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);

                              formData.set('is_visible', String(!!editingSub.is_visible));
                              appendSeoToFormData(formData, editingSub);

                              handleUpdateSubcategory(formData);
                            }}
                            className="flex flex-col gap-2 w-full"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <input
                                name="name"
                                value={editingSub.name}
                                onChange={(e) => setEditingSub({ ...editingSub, name: e.target.value })}
                                className="border border-gray-300 px-2 py-1 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                                required
                              />

                              <label className="flex items-center text-sm whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={editingSub.is_visible}
                                  onChange={(e) => setEditingSub({ ...editingSub, is_visible: e.target.checked })}
                                  className="mr-2"
                                />
                                Видима
                              </label>

                              <input type="hidden" name="id" value={sub.id} />
                              <input type="hidden" name="slug" value={editingSub.slug} />
                              <input type="hidden" name="is_visible" value={String(!!editingSub.is_visible)} />
                              <input type="hidden" name="seo_noindex" value={String(!!editingSub.seo_noindex)} />

                              <button type="submit" className="text-green-600 hover:underline text-sm whitespace-nowrap">
                                💾
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSub(null)}
                                className="text-gray-500 hover:underline text-sm whitespace-nowrap"
                              >
                                Отмена
                              </button>
                            </div>

                            <details>
                              <summary className="cursor-pointer text-xs text-gray-700 select-none">
                                SEO подкатегории
                              </summary>
                              <div className="mt-2 grid grid-cols-1 gap-2">
                                <input
                                  value={editingSub.seo_h1 ?? ''}
                                  onChange={(e) => setEditingSub({ ...editingSub, seo_h1: e.target.value })}
                                  className="border border-gray-300 p-2 rounded-md w-full text-xs focus:ring-2 focus:ring-black"
                                  placeholder="SEO H1"
                                />
                                <input
                                  value={editingSub.seo_title ?? ''}
                                  onChange={(e) => setEditingSub({ ...editingSub, seo_title: e.target.value })}
                                  className="border border-gray-300 p-2 rounded-md w-full text-xs focus:ring-2 focus:ring-black"
                                  placeholder="SEO Title"
                                />
                                <textarea
                                  value={editingSub.seo_description ?? ''}
                                  onChange={(e) =>
                                    setEditingSub({ ...editingSub, seo_description: e.target.value })
                                  }
                                  className="border border-gray-300 p-2 rounded-md w-full text-xs focus:ring-2 focus:ring-black min-h-[60px]"
                                  placeholder="SEO Description"
                                />
                                <input
                                  value={editingSub.og_image ?? ''}
                                  onChange={(e) => setEditingSub({ ...editingSub, og_image: e.target.value })}
                                  className="border border-gray-300 p-2 rounded-md w-full text-xs focus:ring-2 focus:ring-black"
                                  placeholder="OG image URL"
                                />
                                <textarea
                                  value={editingSub.seo_text ?? ''}
                                  onChange={(e) => setEditingSub({ ...editingSub, seo_text: e.target.value })}
                                  className="border border-gray-300 p-2 rounded-md w-full text-xs focus:ring-2 focus:ring-black min-h-[100px]"
                                  placeholder="SEO текст"
                                />
                                <label className="flex items-center text-xs text-gray-700 gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!editingSub.seo_noindex}
                                    onChange={(e) =>
                                      setEditingSub({ ...editingSub, seo_noindex: e.target.checked })
                                    }
                                  />
                                  noindex
                                </label>

                                <input type="hidden" name="seo_noindex" value={String(!!editingSub.seo_noindex)} />
                              </div>
                            </details>
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
                  onSubmit={(e) => {
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
                      onChange={(e) => setNewSubByCat((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                      className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                      aria-label="Название подкатегории"
                    />
                    <p className="text-xs text-gray-500 mt-1">Например, "Белый шоколад"</p>
                  </div>
                  <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
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
