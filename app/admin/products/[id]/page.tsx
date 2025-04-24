// Путь: app/admin/products/[id]/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { supabasePublic as supabase } from "@/lib/supabase/public";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
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
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Ошибка загрузки товара:", error);
      } else {
        setProduct(data);
        setTitle(data.title);
        setPrice(data.price);
        setCategory(data.category);
        setImages(data.images || []);
        setShortDesc(data.short_desc || "");
        setDescription(data.description || "");
        setComposition(data.composition || "");
        setBonus(data.bonus || 0);
        setIsPopular(data.is_popular || false);
      }
    }

    if (id) loadProduct();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      .eq("id", id);

    if (error) {
      alert("Ошибка при сохранении");
      console.error(error);
    } else {
      alert("✅ Товар обновлён");
      router.push("/admin/products");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !id) return;

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const filePath = `${id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("product-image")
        .upload(filePath, file);
      if (uploadError) {
        console.error("Ошибка загрузки изображения:", uploadError);
        alert("Ошибка загрузки: " + uploadError.message);
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

  function handleImageRemove(url: string) {
    setImages((prev) => prev.filter((img) => img !== url));
  }

  if (!product) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Редактирование товара</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
        />
        <input
          className="w-full border p-2"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Цена"
        />
        <input
          className="w-full border p-2"
          type="number"
          value={bonus}
          onChange={(e) => setBonus(Number(e.target.value))}
          placeholder="Бонус"
        />
        <select
          className="w-full border p-2"
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
        <label className="block">
          <input
            type="checkbox"
            className="mr-2"
            checked={isPopular}
            onChange={(e) => setIsPopular(e.target.checked)}
          />
          Отметить как популярное
        </label>
        <textarea
          className="w-full border p-2"
          placeholder="Краткое описание"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
        />
        <textarea
          className="w-full border p-2"
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <textarea
          className="w-full border p-2"
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
