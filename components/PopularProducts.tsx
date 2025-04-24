"use client";

import { useState, useEffect } from "react";
import { supabasePublic as supabase } from '@/lib/supabase/public';
import ProductCard from "@components/ProductCard";


export default function PopularProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true) // 👈 вот эта строка решает проблему
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Ошибка загрузки популярных товаров:", error);
      } else {
        setProducts(data);
      }
    }

    fetchProducts();
  }, []);

  return (
    <section className="popular-products">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Популярное</h2>
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
