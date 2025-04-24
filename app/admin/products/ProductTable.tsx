"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabasePublic as supabase } from '@/lib/supabase/public';


export default function ClientProductListPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*");
    if (error) console.error("Ошибка загрузки товаров:", error);
    else setProducts(data);
    setLoading(false);
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm("Вы точно хотите удалить товар?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("❌ Ошибка при удалении: " + error.message);
    else {
      alert("✅ Товар удалён");
      fetchProducts();
    }
  };

  const toggleInStock = async (id: number, current: boolean) => {
    const response = await fetch("/api/toggle-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, in_stock: !current }),
    });

    const data = await response.json();
    if (!data.success) alert("Ошибка: " + data.error);
    else fetchProducts();
  };

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

      {loading ? (
        <div>Загрузка...</div>
      ) : products.length === 0 ? (
        <div>Нет товаров.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded">
            <thead className="bg-gray-100 text-left text-sm">
              <tr>
                <th className="py-2 px-4 border-b">Название</th>
                <th className="py-2 px-4 border-b">Цена</th>
                <th className="py-2 px-4 border-b">Категория</th>
                <th className="py-2 px-4 border-b">Фото</th>
                <th className="py-2 px-4 border-b">Доступность</th>
                <th className="py-2 px-4 border-b">Действие</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="text-sm hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{product.title}</td>
                  <td className="py-2 px-4 border-b">{product.price} ₽</td>
                  <td className="py-2 px-4 border-b">{product.category}</td>
                  <td className="py-2 px-4 border-b">
                    {product.images?.length || 0}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => toggleInStock(product.id, product.in_stock)}
                      className={`px-2 py-1 rounded text-white ${
                        product.in_stock
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-500 hover:bg-gray-600"
                      }`}
                    >
                      {product.in_stock ? "В наличии" : "Скрыт"}
                    </button>
                  </td>
                  <td className="py-2 px-4 border-b flex gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      ✏️ Редактировать
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="text-red-600 hover:underline"
                    >
                      🗑️ Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
