"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabasePublic as supabase } from '@/lib/supabase/public';
import Image from "next/image";



export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [category, setCategory] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [composition, setComposition] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Лимит 7 фото всего
    if (images.length + files.length > 7) {
      alert("Максимум 7 фото!");
      return;
    }

    const uploadedUrls: string[] = [];
    setLoading(true);

    // Перебираем все загружаемые файлы
    for (const file of files) {
      const filePath = `temp/${Date.now()}-${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-image")
        .upload(filePath, file);

      if (!uploadError) {
        // Получаем публичную ссылку
        const { data: publicData } = supabase.storage
          .from("product-image")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicData.publicUrl);
      } else {
        console.error("Ошибка при загрузке файла:", uploadError.message);
      }
    }

    // Добавляем загруженные ссылки в state
    setImages((prev) => [...prev, ...uploadedUrls]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("products").insert([
      {
        title,
        price,
        bonus,
        category,
        short_desc: shortDesc,
        description,
        composition,
        images, // Вставляем массив строк
        in_stock: true,
      },
    ]);

    if (error) {
      alert("Ошибка при добавлении товара");
      console.error(error);
      setLoading(false);
    } else {
      alert("✅ Товар добавлен");
      setLoading(false);
      router.push("/admin/products");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Новый товар</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
          required
        />
        <input
          className="w-full border p-2"
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          placeholder="Цена"
          required
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
          required
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

        {/* Загрузка фото */}
        <div>
          <label className="block font-medium mb-1">Изображения:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
          />
          {loading && <p className="text-sm text-gray-500">Загрузка...</p>}

          {/* Превью загруженных фото */}
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
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Сохранение..." : "Сохранить"}
        </button>
      </form>
    </div>
  );
}
