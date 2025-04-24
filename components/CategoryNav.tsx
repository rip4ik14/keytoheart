"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabasePublic as supabase } from '@/lib/supabase/public';

export default function CategoryNav() {
  const pathname = usePathname();
  const isCategoryPage = pathname !== "/";
  const [categories, setCategories] = useState<any[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, subcategories(id, name, slug)")
        .order("id", { ascending: true });

      if (!error && data) setCategories(data);
    };
    fetchData();
  }, []);

  const handleMouseEnter = (id: number) => {
    if (timeoutId) clearTimeout(timeoutId);
    setHovered(id);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => setHovered(null), 200);
    setTimeoutId(id);
  };

  return (
    <nav
      className={`category-nav py-2 border-b z-40 relative transition-colors duration-200 ${
        isCategoryPage ? "bg-black text-white" : "bg-white text-gray-700"
      }`}
    >
      <ul className="flex items-center justify-center gap-4 text-sm flex-wrap px-4 relative">
        {categories.map((cat) => {
          const isActive = pathname.startsWith(`/category/${cat.slug}`);
          return (
            <li
              key={cat.id}
              className="relative group"
              onMouseEnter={() => handleMouseEnter(cat.id)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={`/category/${cat.slug}`}
                className={`transition-colors duration-200 px-2 py-1 whitespace-nowrap ${
                  isActive
                    ? isCategoryPage
                      ? "text-white underline"
                      : "text-orange-500 underline"
                    : isCategoryPage
                    ? "hover:text-gray-200"
                    : "hover:text-orange-500"
                }`}
              >
                {cat.name}
              </Link>

              {hovered === cat.id && cat.subcategories?.length > 0 && (
                <div
                  className="absolute left-0 top-full bg-white text-gray-800 shadow-2xl rounded mt-3 py-3 px-4 min-w-[220px] flex flex-col space-y-2 animate-fade-in border border-gray-200"
                  onMouseEnter={() => handleMouseEnter(cat.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {cat.subcategories.map((sub: any) => (
                    <Link
                      key={sub.id}
                      href={`/category/${cat.slug}/${sub.slug}`}
                      className="text-[15px] hover:underline"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
