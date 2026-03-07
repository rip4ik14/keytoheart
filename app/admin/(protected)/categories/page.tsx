// ✅ Путь: app/admin/(protected)/categories/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyAdminJwt } from "@/lib/auth";
import CategoriesClient from "./CategoriesClient";

interface Subcategory {
  id: number;
  name: string;
  category_id: number | null;
  slug: string;
  is_visible: boolean;

  seo_h1?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_text?: string | null;
  og_image?: string | null;
  seo_noindex?: boolean | null;

  image_url?: string | null;
  home_is_featured?: boolean | null;
  home_sort?: number | null;
  home_icon_url?: string | null;
  home_title?: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;

  seo_h1?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_text?: string | null;
  og_image?: string | null;
  seo_noindex?: boolean | null;

  home_is_featured?: boolean | null;
  home_sort?: number | null;
  home_title?: string | null;

  subcategories: Subcategory[];
}

type RawSubcategory = Partial<Subcategory> & {
  id: number;
  name: string;
  slug: string;
  category_id: number | null;
  is_visible: boolean;
};

type RawCategory = Partial<Category> & {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;
  subcategories?: RawSubcategory[] | null;
};

function normalizeSubcategory(sub: RawSubcategory): Subcategory {
  return {
    id: Number(sub.id),
    name: String(sub.name ?? ""),
    category_id: sub.category_id ?? null,
    slug: String(sub.slug ?? ""),
    is_visible: Boolean(sub.is_visible),

    seo_h1: sub.seo_h1 ?? null,
    seo_title: sub.seo_title ?? null,
    seo_description: sub.seo_description ?? null,
    seo_text: sub.seo_text ?? null,
    og_image: sub.og_image ?? null,
    seo_noindex: sub.seo_noindex ?? null,

    image_url: sub.image_url ?? null,
    home_is_featured: sub.home_is_featured ?? null,
    home_sort:
      typeof sub.home_sort === "number" ? sub.home_sort : Number(sub.home_sort ?? 0),
    home_icon_url: sub.home_icon_url ?? null,
    home_title: sub.home_title ?? null,
  };
}

function normalizeCategory(cat: RawCategory): Category {
  return {
    id: Number(cat.id),
    name: String(cat.name ?? ""),
    slug: String(cat.slug ?? ""),
    is_visible: Boolean(cat.is_visible),

    seo_h1: cat.seo_h1 ?? null,
    seo_title: cat.seo_title ?? null,
    seo_description: cat.seo_description ?? null,
    seo_text: cat.seo_text ?? null,
    og_image: cat.og_image ?? null,
    seo_noindex: cat.seo_noindex ?? null,

    home_is_featured: cat.home_is_featured ?? null,
    home_sort:
      typeof cat.home_sort === "number" ? cat.home_sort : Number(cat.home_sort ?? 0),
    home_title: cat.home_title ?? null,

    subcategories: Array.isArray(cat.subcategories)
      ? cat.subcategories.map(normalizeSubcategory)
      : [],
  };
}

export default async function CategoriesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token) redirect("/admin/login?error=no-session");

  const isValidToken = await verifyAdminJwt(token);
  if (!isValidToken) redirect("/admin/login?error=invalid-session");

  let categories: Category[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        is_visible,
        seo_h1,
        seo_title,
        seo_description,
        seo_text,
        og_image,
        seo_noindex,
        home_is_featured,
        home_sort,
        home_title,
        subcategories!subcategories_category_id_fkey(
          id,
          name,
          slug,
          category_id,
          is_visible,
          seo_h1,
          seo_title,
          seo_description,
          seo_text,
          og_image,
          seo_noindex,
          image_url,
          home_is_featured,
          home_sort,
          home_icon_url,
          home_title
        )
      `,
      )
      .order("id", { ascending: true });

    if (error) throw error;

    categories = ((data ?? []) as unknown as RawCategory[]).map(normalizeCategory);
  } catch (error: any) {
    process.env.NODE_ENV !== "production" &&
      console.error("Error fetching categories:", error?.message || error);
  }

  return <CategoriesClient categories={categories} />;
}