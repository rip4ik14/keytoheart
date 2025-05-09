'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabasePublic as supabase } from "@/lib/supabase/public";
import toast, { Toaster } from "react-hot-toast";
import type { Database } from '@/lib/supabase/types_new';

type Product = Database['public']['Tables']['products']['Row'];

export default function EditProductPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [composition, setComposition] = useState("");
  const [bonus, setBonus] = useState(0);
  const [isPopular, setIsPopular] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) {
        toast.error("Ошибка: ID товара не указан");
        router.push("/admin/products");
        return;
      }

      const productId = parseInt(id, 10);
      if (isNaN(productId)) {
        toast.error("Ошибка: Неверный ID товара");
        router.push("/admin/products");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) {
        console.error("Ошибка загрузки товара:", error);
        toast.error("Ошибка загрузки товара: " + error.message);
        router.push("/admin/products");
      } else {
        setProduct(data);
        setTitle(data.title);
        setPrice(data.price);
        setCategory(data.category ?? "");
        setImages(data.images || []);
        setShortDesc(data.short_desc ?? "");
        setDescription(data.description ?? "");
        setComposition(data.composition ?? "");
        setBonus(data.bonus || 0);
        setIsPopular(data.is_popular || false);
      }
    }

    loadProduct();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) {
      toast.error("Ошибка: ID товара не указан");
      return;
    }

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      toast.error("Ошибка: Неверный ID товара");
      return;
    }

    const { error } = await supabase
      .from("products")
      .update({
        title,
        price,
        category,
        images,
        short_desc: shortDesc,
        description,
        composition,
        bonus,
        is_popular: isPopular,
      })
      .eq("id", productId);

    if (error) {
      toast.error("Ошибка при сохранении: " + error.message);
      console.error(error);
    } else {
      toast.success("✅ Товар обновлён");
      router.push("/admin/products");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !id) return;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      toast.error("Ошибка: Неверный ID товара");
      return;
    }

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const filePath = `${productId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("product-image")
        .upload(filePath, file);
      if (uploadError) {
        console.error("Ошибка загрузки изображения:", uploadError);
        toast.error("Ошибка загрузки: " + uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("product-image")
          .getPublicUrl(filePath);
        if (publicUrlData.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }
    }
    setImages((prev) => [...prev, ...uploadedUrls]);
  }

  async function handleImageRemove(url: string) {
    const filePath = url.split('/').slice(-2).join('/'); // Извлекаем путь файла из URL
    const { error } = await supabase.storage.from("product-image").remove([filePath]);
    if (error) {
      console.error("Ошибка удаления изображения:", error);
      toast.error("Ошибка удаления изображения: " + error.message);
    } else {
      setImages((prev) => prev.filter((img) => img !== url));
    }
  }

  if (!product) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold mb-4">Редактирование товара</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
        />
        <input
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Цена"
        />
        <input
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          type="number"
          value={bonus}
          onChange={(e) => setBonus(Number(e.target.value))}
          placeholder="Бонус"
        />
        <select
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Выберите категорию</option>
          <option value="Клубничные букеты">Клубничные букеты</option>
          <option value="Клубничные боксы">Клубничные боксы</option>
          <option value="Цветы">Цветы</option>
          <option value="Комбо-наборы">Комбо-наборы</option>
          <option value="Premium">Premium</option>
          <option value="Коллекции">Коллекции</option>
          <option value="Повод">Повод</option>
          <option value="Подарки">Подарки</option>
        </select>
        <label className="flex items-center">
          <input
            type="checkbox"
            className="mr-2 focus:ring-2 focus:ring-gray-500"
            checked={isPopular}
            onChange={(e) => setIsPopular(e.target.checked)}
          />
          Отметить как популярное
        </label>
        <textarea
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          placeholder="Краткое описание"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
        />
        <textarea
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <textarea
          className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          placeholder="Состав"
          value={composition}
          onChange={(e) => setComposition(e.target.value)}
        />
        <div>
          <label className="block font-medium mb-1">Изображения:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-2 border rounded"
          />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {images.map((url) => (
              <div key={url} className="relative border rounded">
                <Image
                  src={url}
                  alt="Фото"
                  width={200}
                  height={200}
                  className="object-cover w-full h-40 rounded"
                />
                <button
                  type="button"
                  onClick={() => handleImageRemove(url)}
                  className="absolute top-1 right-1 bg-red-500 text-white px-2 py-1 text-xs rounded"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded"
        >
          Сохранить
        </button>
      </form>
    </div>
  );
}