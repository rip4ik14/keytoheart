// Путь: app/admin/products/page.tsx

'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabasePublic as supabase } from "@/lib/supabase/public";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*");
    if (error) {
      console.error("Ошибка загрузки товаров:", error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  async function deleteProduct(id: number) {
    if (!confirm("Вы точно хотите удалить товар?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("❌ Ошибка при удалении: " + error.message);
    } else {
      alert("✅ Товар удалён");
      fetchProducts();
    }
  }

  async function toggleInStock(id: number, current: boolean) {
    const res = await fetch("/api/toggle-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, in_stock: !current }),
    });
    const { success, error } = await res.json();
    if (!success) {
      alert("Ошибка: " + error);
    } else {
      fetchProducts();
    }
  }

  const categories = ["all", "Клубничные букеты", "Цветы", "Комбо-наборы", "Premium", "Подарки"];
  const filteredProducts =
    categoryFilter === "all"
      ? products
      : products.filter((p) => p.category === categoryFilter);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Все товары</h1>
        <Link
          href="/admin/add-product"
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          ➕ Добавить товар
        </Link>
      </div>

      <div className="mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "Все категории" : cat}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <table className="min-w-full border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Название</th>
              <th className="px-4 py-2 border">Цена</th>
              <th className="px-4 py-2 border">Категория</th>
              <th className="px-4 py-2 border">Фото</th>
              <th className="px-4 py-2 border">Статус</th>
              <th className="px-4 py-2 border">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-2 border">{product.title}</td>
                <td className="px-4 py-2 border">{product.price} ₽</td>
                <td className="px-4 py-2 border">{product.category}</td>
                <td className="px-4 py-2 border">{product.images?.length || 0}</td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => toggleInStock(product.id, product.in_stock)}
                    className={`px-2 py-1 text-white rounded ${
                      product.in_stock ? "bg-green-500" : "bg-gray-500"
                    }`}
                  >
                    {product.in_stock ? "В наличии" : "Скрыт"}
                  </button>
                </td>
                <td className="px-4 py-2 border flex gap-2">
                  <Link href={`/admin/products/${product.id}`} className="text-blue-600">
                    ✏️ Редактировать
                  </Link>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="text-red-600"
                  >
                    🗑️ Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
