import PromoGrid from "@components/PromoGrid";
import Advantages from "@components/Advantages";
import PopularProducts from "@components/PopularProducts";
import CategoryPreview from "@components/CategoryPreview";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export default async function Home() {
  const supabase = createServerComponentClient({ cookies }); // ✅ исправлено здесь

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Ошибка загрузки товаров:", error.message);
    return <div className="text-red-600 p-6">Ошибка загрузки товаров</div>;
  }

  const slugMap: Record<string, string> = {
    "Клубничные букеты": "klubnichnye-bukety",
    "Клубничные боксы": "klubnichnye-boksy",
    "Цветы": "flowers",
    "Комбо-наборы": "combo",
    "Premium": "premium",
    "Коллекции": "kollekcii",
    "Повод": "povod",
    "Подарки": "podarki",
  };

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <>
      <PromoGrid />
      <PopularProducts />
      <Advantages />

      {categories.map((category) => {
        const slug = slugMap[category] || "";
        const items = products
          .filter((p) => p.category === category)
          .slice(0, 8);

        return (
          <CategoryPreview
            key={category}
            categoryName={category}
            products={items}
            seeMoreLink={slug}
          />
        );
      })}
    </>
  );
}
