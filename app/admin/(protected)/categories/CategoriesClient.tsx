// ✅ Путь: app/admin/(protected)/categories/CategoriesClient.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

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

type HomeFields = {
  home_is_featured?: boolean | null;
  home_sort?: number | null;
  home_icon_url?: string | null;
  home_title?: string | null;
};

interface Subcategory extends SeoFields, HomeFields {
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

/* ================= SLUG ================= */

const translit = (input: string) => {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ы: 'y',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    ъ: '',
    ь: '',
  };

  return String(input ?? '')
    .trim()
    .split('')
    .map((ch) => map[ch.toLowerCase()] ?? ch)
    .join('');
};

const generateSlug = (name: string) =>
  translit(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');

function safeInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/* ================= COMPONENT ================= */

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

  const appendSeoToFormData = (fd: FormData, seo: SeoFields) => {
    fd.set('seo_h1', String(seo.seo_h1 ?? ''));
    fd.set('seo_title', String(seo.seo_title ?? ''));
    fd.set('seo_description', String(seo.seo_description ?? ''));
    fd.set('seo_text', String(seo.seo_text ?? ''));
    fd.set('og_image', String(seo.og_image ?? ''));
    fd.set('seo_noindex', String(!!seo.seo_noindex));
  };

  const appendHomeToFormData = (fd: FormData, home: HomeFields) => {
    fd.set('home_is_featured', String(!!home.home_is_featured));
    fd.set('home_sort', String(safeInt(home.home_sort ?? 0, 0)));
    fd.set('home_icon_url', String(home.home_icon_url ?? ''));
    fd.set('home_title', String(home.home_title ?? ''));
  };

  /* ------------------------------ Storage (иконки) ------------------------------ */

  const supabase = createClient();
  const ICON_BUCKET = 'category-icons';

  function extFromFileName(name: string) {
    const m = name.toLowerCase().match(/\.([a-z0-9]+)$/i);
    return m?.[1] ?? 'jpg';
  }

  function buildPublicUrl(bucket: string, path: string) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return `${base}/storage/v1/object/public/${bucket}/${path}`;
  }

  function storagePathFromPublicUrl(url: string) {
    const marker = `/storage/v1/object/public/${ICON_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  }

  async function uploadHomeIcon(file: File, sub: Subcategory) {
    const ext = extFromFileName(file.name);
    const path = `category/${sub.category_id ?? 'unknown'}/sub/${sub.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from(ICON_BUCKET).upload(path, file, {
      cacheControl: '31536000',
      upsert: true,
    });

    if (upErr) throw new Error(upErr.message);

    return buildPublicUrl(ICON_BUCKET, path);
  }

  async function removeHomeIconIfAny(sub: Subcategory) {
    const url = (sub.home_icon_url || '').trim();
    if (!url) return;

    const path = storagePathFromPublicUrl(url);
    if (!path) return;

    await supabase.storage.from(ICON_BUCKET).remove([path]).catch(() => null);
  }

  const handleUploadSubHomeIcon = async (sub: Subcategory, file: File) => {
  try {
    const publicUrl = await uploadHomeIcon(file, sub);

    const formData = new FormData();
    formData.set('id', sub.id.toString());
    formData.set('name', sub.name);
    formData.set('slug', generateSlug(sub.slug || sub.name));
    formData.set('is_visible', String(!!sub.is_visible));
    appendSeoToFormData(formData, sub);

    appendHomeToFormData(formData, {
      ...sub,
      home_is_featured: !!sub.home_is_featured,
      home_sort: safeInt(sub.home_sort ?? 0, 0),
      home_icon_url: publicUrl,
      home_title: sub.home_title ?? '',
    });

    // ✅ гарантия, что именно свежий url улетит в server action
    formData.set('home_icon_url', publicUrl);

    await updateSubcategory(formData);

    toast.success('Иконка загружена');
    location.reload();
  } catch (e: any) {
    toast.error(e?.message || 'Не удалось загрузить иконку');
  }
};


  const handleRemoveSubHomeIcon = async (sub: Subcategory) => {
    try {
      await removeHomeIconIfAny(sub);

      const formData = new FormData();
      formData.set('id', sub.id.toString());
      formData.set('name', sub.name);
      formData.set('slug', generateSlug(sub.slug || sub.name));
      formData.set('is_visible', String(!!sub.is_visible));
      appendSeoToFormData(formData, sub);

      appendHomeToFormData(formData, {
        ...sub,
        home_is_featured: !!sub.home_is_featured,
        home_sort: safeInt(sub.home_sort ?? 0, 0),
        home_icon_url: '',
        home_title: sub.home_title ?? '',
      });

        formData.set('home_icon_url', '');


      await updateSubcategory(formData);

      toast.success('Иконка удалена');
      location.reload();
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось удалить иконку');
    }
  };

  /* ------------------------------ Категории ------------------------------ */

  const handleAddCategory = async (formData: FormData) => {
    try {
      formData.set('is_visible', String(newCategory.is_visible));
      formData.set('seo_noindex', String(newCategory.seo_noindex));

      const name = String(formData.get('name') ?? '');
      const slugRaw = String(formData.get('slug') ?? '');
      formData.set('slug', generateSlug(slugRaw || name));

      await addCategory(formData);

      toast.success('Категория добавлена');
      location.reload();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateCategory = async (formData: FormData) => {
    try {
      if (editingCategory) {
        formData.set('is_visible', String(!!editingCategory.is_visible));
        appendSeoToFormData(formData, editingCategory);

        const name = String(formData.get('name') ?? editingCategory.name);
        const slugRaw = String(formData.get('slug') ?? editingCategory.slug);
        formData.set('slug', generateSlug(slugRaw || name));
      }

      await updateCategory(formData);

      toast.success('Категория обновлена');
      location.reload();
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
    formData.set('slug', generateSlug(cat.slug || cat.name));
    formData.set('is_visible', String(!cat.is_visible));
    appendSeoToFormData(formData, cat);

    try {
      await updateCategory(formData);
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_visible: !cat.is_visible } : c)),
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

    appendHomeToFormData(formData, {
      home_is_featured: false,
      home_sort: 0,
      home_icon_url: '',
      home_title: '',
    });

    try {
      await addSubcategory(formData);
      toast.success('Подкатегория добавлена');
      location.reload();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditSubcategory = (sub: Subcategory) =>
    setEditingSub({
      ...sub,
      home_is_featured: !!sub.home_is_featured,
      home_sort: safeInt(sub.home_sort ?? 0, 0),
      home_icon_url: sub.home_icon_url ?? '',
      home_title: sub.home_title ?? '',
    });

  const handleUpdateSubcategory = async (formData: FormData) => {
    try {
      if (editingSub) {
        formData.set('is_visible', String(!!editingSub.is_visible));
        appendSeoToFormData(formData, editingSub);
        appendHomeToFormData(formData, editingSub);

        const name = String(formData.get('name') ?? editingSub.name);
        const slugRaw = String(formData.get('slug') ?? editingSub.slug);
        formData.set('slug', generateSlug(slugRaw || name));
      }

      await updateSubcategory(formData);

      toast.success('Подкатегория обновлена');
      location.reload();
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
            : cat,
        ),
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
    formData.set('slug', generateSlug(sub.slug || sub.name));
    formData.set('is_visible', String(!sub.is_visible));
    appendSeoToFormData(formData, sub);
    appendHomeToFormData(formData, sub);

    try {
      await updateSubcategory(formData);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: cat.subcategories.map((s) =>
                  s.id === sub.id ? { ...s, is_visible: !sub.is_visible } : s,
                ),
              }
            : cat,
        ),
      );
      toast.success(sub.is_visible ? 'Подкатегория скрыта' : 'Подкатегория отображается');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleHomeFeatured = async (sub: Subcategory, catId: number) => {
    const next = !sub.home_is_featured;

    const formData = new FormData();
    formData.set('id', sub.id.toString());
    formData.set('name', sub.name);
    formData.set('slug', generateSlug(sub.slug || sub.name));
    formData.set('is_visible', String(!!sub.is_visible));
    appendSeoToFormData(formData, sub);
    appendHomeToFormData(formData, {
      ...sub,
      home_is_featured: next,
      home_sort: safeInt(sub.home_sort ?? 0, 0),
      home_icon_url: sub.home_icon_url ?? '',
      home_title: sub.home_title ?? '',
    });

    try {
      await updateSubcategory(formData);

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: cat.subcategories.map((s) =>
                  s.id === sub.id ? { ...s, home_is_featured: next } : s,
                ),
              }
            : cat,
        ),
      );

      toast.success(next ? 'Добавлено на главную' : 'Убрано с главной');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleMoveHomeSort = async (sub: Subcategory, catId: number, delta: number) => {
    const current = safeInt(sub.home_sort ?? 0, 0);
    const nextOrder = Math.max(0, current + delta);

    const formData = new FormData();
    formData.set('id', sub.id.toString());
    formData.set('name', sub.name);
    formData.set('slug', generateSlug(sub.slug || sub.name));
    formData.set('is_visible', String(!!sub.is_visible));
    appendSeoToFormData(formData, sub);
    appendHomeToFormData(formData, {
      ...sub,
      home_is_featured: !!sub.home_is_featured,
      home_sort: nextOrder,
      home_icon_url: sub.home_icon_url ?? '',
      home_title: sub.home_title ?? '',
    });

    try {
      await updateSubcategory(formData);

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: cat.subcategories.map((s) =>
                  s.id === sub.id ? { ...s, home_sort: nextOrder } : s,
                ),
              }
            : cat,
        ),
      );

      toast.success('Порядок обновлён');
    } catch (e: any) {
      toast.error(e.message);
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

            formData.set('is_visible', String(newCategory.is_visible));
            formData.set('seo_noindex', String(newCategory.seo_noindex));
            formData.set(
              'slug',
              generateSlug(
                String(formData.get('slug') ?? '') || String(formData.get('name') ?? ''),
              ),
            );

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
                    slug: prev.slug ? prev.slug : generateSlug(name),
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
                onChange={(e) =>
                  setNewCategory((prev) => ({
                    ...prev,
                    slug: generateSlug(e.target.value),
                  }))
                }
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
                placeholder="SEO H1"
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
                onChange={(e) =>
                  setNewCategory((p) => ({ ...p, seo_description: e.target.value }))
                }
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
                placeholder="SEO текст"
                className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black min-h-[120px]"
              />

              <label className="flex items-center text-sm text-gray-700 gap-2">
                <input
                  type="checkbox"
                  checked={newCategory.seo_noindex}
                  onChange={(e) =>
                    setNewCategory((p) => ({ ...p, seo_noindex: e.target.checked }))
                  }
                />
                noindex (не индексировать страницу)
              </label>
            </div>
          </details>

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
                      formData.set(
                        'slug',
                        generateSlug(
                          String(formData.get('slug') ?? '') ||
                            String(formData.get('name') ?? ''),
                        ),
                      );

                      handleUpdateCategory(formData);
                    }}
                    className="flex flex-col gap-3 mb-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        name="name"
                        value={editingCategory.name}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            name: e.target.value,
                            slug: editingCategory.slug
                              ? editingCategory.slug
                              : generateSlug(e.target.value),
                          })
                        }
                        className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                        aria-label="Название категории"
                        required
                      />

                      <input
                        name="slug"
                        value={editingCategory.slug}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            slug: generateSlug(e.target.value),
                          })
                        }
                        className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                        aria-label="Slug категории"
                        required
                      />
                    </div>

                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={editingCategory.is_visible}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, is_visible: e.target.checked })
                        }
                        className="mr-2"
                      />
                      Видима
                    </label>

                    <details>
                      <summary className="cursor-pointer text-sm text-gray-700 select-none">
                        SEO категории
                      </summary>
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <input
                          value={editingCategory.seo_h1 ?? ''}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, seo_h1: e.target.value })
                          }
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                          placeholder="SEO H1"
                        />
                        <input
                          value={editingCategory.seo_title ?? ''}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, seo_title: e.target.value })
                          }
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                          placeholder="SEO Title"
                        />
                        <textarea
                          value={editingCategory.seo_description ?? ''}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              seo_description: e.target.value,
                            })
                          }
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black min-h-[70px]"
                          placeholder="SEO Description"
                        />
                        <input
                          value={editingCategory.og_image ?? ''}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, og_image: e.target.value })
                          }
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                          placeholder="OG image URL"
                        />
                        <textarea
                          value={editingCategory.seo_text ?? ''}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, seo_text: e.target.value })
                          }
                          className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black min-h-[120px]"
                          placeholder="SEO текст"
                        />
                        <label className="flex items-center text-sm text-gray-700 gap-2">
                          <input
                            type="checkbox"
                            checked={!!editingCategory.seo_noindex}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                seo_noindex: e.target.checked,
                              })
                            }
                          />
                          noindex
                        </label>

                        <input
                          type="hidden"
                          name="seo_noindex"
                          value={String(!!editingCategory.seo_noindex)}
                        />
                        <input
                          type="hidden"
                          name="is_visible"
                          value={String(!!editingCategory.is_visible)}
                        />
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
                    {cat.subcategories?.map((sub) => {
                      const featured = !!sub.home_is_featured;
                      const order = safeInt(sub.home_sort ?? 0, 0);

                      return (
                        <motion.li
                          key={sub.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex justify-between items-start gap-3"
                        >
                          {editingSub && editingSub.id === sub.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);

                                formData.set('is_visible', String(!!editingSub.is_visible));
                                appendSeoToFormData(formData, editingSub);
                                appendHomeToFormData(formData, editingSub);

                                formData.set(
                                  'slug',
                                  generateSlug(
                                    String(formData.get('slug') ?? '') ||
                                      String(formData.get('name') ?? ''),
                                  ),
                                );
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

                              {/* ✅ Блок главной */}
                              <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <label className="flex items-center gap-2 text-sm font-semibold text-black">
                                    <input
                                      type="checkbox"
                                      checked={!!editingSub.home_is_featured}
                                      onChange={(e) =>
                                        setEditingSub({
                                          ...editingSub,
                                          home_is_featured: e.target.checked,
                                        })
                                      }
                                    />
                                    Показывать в блоке "Ищу подарок" на главной
                                  </label>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Порядок</span>
                                    <input
                                      type="number"
                                      value={safeInt(editingSub.home_sort ?? 0, 0)}
                                      onChange={(e) =>
                                        setEditingSub({
                                          ...editingSub,
                                          home_sort: safeInt(e.target.value, 0),
                                        })
                                      }
                                      className="w-[92px] border border-gray-300 rounded-md px-2 py-1 text-sm"
                                      min={0}
                                    />
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-xs text-gray-600 mb-1">Иконка (загрузка файла)</div>

                                    <div className="flex items-center gap-3">
                                      <label className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm cursor-pointer hover:bg-gray-50 transition">
                                        Загрузить
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (!f) return;
                                            handleUploadSubHomeIcon(editingSub, f);
                                            e.currentTarget.value = '';
                                          }}
                                        />
                                      </label>

                                      {!!(editingSub.home_icon_url || '').trim() && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSubHomeIcon(editingSub)}
                                          className="px-3 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50 transition"
                                        >
                                          Удалить
                                        </button>
                                      )}
                                    </div>

                                    <div className="text-[11px] text-gray-500 mt-1">
                                      Лучше квадрат 200x200+ (будет обрезка в круг)
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-xs text-gray-600 mb-1">Короткая подпись (опционально)</div>
                                    <input
                                      type="text"
                                      value={editingSub.home_title ?? ''}
                                      onChange={(e) =>
                                        setEditingSub({
                                          ...editingSub,
                                          home_title: e.target.value,
                                        })
                                      }
                                      placeholder="Например: Друзьям"
                                      className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                                    />
                                  </div>
                                </div>

                                {!!editingSub.home_icon_url && (
                                  <div className="mt-3 flex items-center gap-3">
                                    <div className="h-[52px] w-[52px] rounded-full overflow-hidden border border-black/10 bg-white relative">
                                      <Image
                                        src={editingSub.home_icon_url}
                                        alt="preview"
                                        fill
                                        className="object-cover"
                                        unoptimized={/^https?:\/\//i.test(editingSub.home_icon_url || '')}
                                      />
                                    </div>
                                    <div className="text-xs text-gray-600">Превью на главной (круг)</div>
                                  </div>
                                )}

                                <input type="hidden" name="home_is_featured" value={String(!!editingSub.home_is_featured)} />
                                <input type="hidden" name="home_sort" value={String(safeInt(editingSub.home_sort ?? 0, 0))} />
                                <input type="hidden" name="home_icon_url" value={String(editingSub.home_icon_url ?? '')} />
                                <input type="hidden" name="home_title" value={String(editingSub.home_title ?? '')} />
                              </div>

                              <details>
                                <summary className="cursor-pointer text-xs text-gray-700 select-none">SEO подкатегории</summary>
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
                                    onChange={(e) => setEditingSub({ ...editingSub, seo_description: e.target.value })}
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
                                      onChange={(e) => setEditingSub({ ...editingSub, seo_noindex: e.target.checked })}
                                    />
                                    noindex
                                  </label>

                                  <input type="hidden" name="seo_noindex" value={String(!!editingSub.seo_noindex)} />
                                </div>
                              </details>
                            </form>
                          ) : (
                            <>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={sub.is_visible ? 'text-gray-800 font-semibold' : 'text-gray-400 font-semibold'}>
                                    {sub.name} {sub.is_visible ? '' : '(Скрыта)'}
                                  </span>

                                  {featured && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-black text-white">
                                      🏠 {order}
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs text-gray-500 break-all">/{sub.slug}</div>
                              </div>

                              <div className="flex gap-2 items-center shrink-0">
                                <button
                                  onClick={() => handleToggleHomeFeatured(sub, cat.id)}
                                  className={`text-sm hover:underline ${featured ? 'text-black' : 'text-gray-400'}`}
                                  title={featured ? 'Убрать с главной' : 'Показать на главной'}
                                >
                                  🏠
                                </button>

                                {featured && (
                                  <>
                                    <button
                                      onClick={() => handleMoveHomeSort(sub, cat.id, -1)}
                                      className="text-sm text-gray-600 hover:underline"
                                      title="Выше"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={() => handleMoveHomeSort(sub, cat.id, +1)}
                                      className="text-sm text-gray-600 hover:underline"
                                      title="Ниже"
                                    >
                                      ▼
                                    </button>
                                  </>
                                )}

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
                      );
                    })}
                  </AnimatePresence>
                </ul>

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
                      placeholder="Название подкатегории (например, Друзьям)"
                      value={newSubByCat[cat.id] || ''}
                      onChange={(e) => setNewSubByCat((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                      className="border border-gray-300 p-2 rounded-md w-full text-sm focus:ring-2 focus:ring-black"
                      aria-label="Название подкатегории"
                    />
                    <p className="text-xs text-gray-500 mt-1">Slug будет создан автоматически (латиница)</p>
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
