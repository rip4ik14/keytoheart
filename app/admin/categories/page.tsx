// Путь: app/admin/categories/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabasePublic as supabase } from '@/lib/supabase/public';
import AdminLayout from '../layout';

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories?: { id: number; name: string }[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*, subcategories(*)')
      .order('id', { ascending: true });

    if (error) {
      console.error('Ошибка загрузки категорий:', error.message);
    } else {
      setCategories(data || []);
    }
  }

  async function addCategory() {
    if (!newCategory.name || !newCategory.slug) return;
    const { error } = await supabase
      .from('categories')
      .insert(newCategory);

    if (error) {
      alert('Ошибка при добавлении категории: ' + error.message);
      console.error(error);
    } else {
      setNewCategory({ name: '', slug: '' });
      fetchCategories();
    }
  }

  async function deleteCategory(id: number) {
    if (!confirm('Удалить категорию и все её подкатегории?')) return;
    // Сначала удаляем подкатегории
    await supabase
      .from('subcategories')
      .delete()
      .eq('category_id', id);
    // Затем саму категорию
    await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    fetchCategories();
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Категории и подкатегории</h1>

        <div className="mb-6 border p-4 rounded bg-gray-50">
          <h2 className="font-semibold mb-2">➕ Добавить категорию</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Название"
              className="border p-2 rounded w-1/2"
            />
            <input
              type="text"
              value={newCategory.slug}
              onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
              placeholder="Slug (например: flowers)"
              className="border p-2 rounded w-1/2"
            />
            <button
              onClick={addCategory}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Сохранить
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id} className="border p-4 rounded shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{cat.name}</h3>
                  <p className="text-sm text-gray-500">/{cat.slug}</p>
                </div>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Удалить
                </button>
              </div>
              {cat.subcategories && cat.subcategories.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                  {cat.subcategories.map((sub) => (
                    <li key={sub.id}>{sub.name}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
