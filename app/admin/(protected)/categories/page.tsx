import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminJwt } from '@/lib/auth';
import CategoriesClient from './CategoriesClient';

interface Subcategory {
  id: number;
  name: string;
  category_id: number | null;
  slug: string;
  is_visible: boolean;

  // SEO
  seo_h1?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_text?: string | null;
  og_image?: string | null;
  seo_noindex?: boolean | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  is_visible: boolean;

  // SEO
  seo_h1?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_text?: string | null;
  og_image?: string | null;
  seo_noindex?: boolean | null;

  subcategories: Subcategory[];
}

export default async function CategoriesPage() {
  const cookieStore = await cookies();

  const token = cookieStore.get('admin_session')?.value;
  process.env.NODE_ENV !== 'production' && console.log('Admin session token:', token);

  if (!token) {
    process.env.NODE_ENV !== 'production' && console.error('No admin session token found');
    redirect('/admin/login?error=no-session');
  }

  const isValidToken = await verifyAdminJwt(token);
  process.env.NODE_ENV !== 'production' && console.log('Token verification result:', isValidToken);

  if (!isValidToken) {
    process.env.NODE_ENV !== 'production' && console.error('Invalid admin session token');
    redirect('/admin/login?error=invalid-session');
  }

  let categories: Category[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
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
          seo_noindex
        )
      `
      )
      .order('id', { ascending: true });

    if (error) throw error;

    categories = (data || []) as Category[];
  } catch (error: any) {
    process.env.NODE_ENV !== 'production' && console.error('Error fetching categories:', error.message);
  }

  return <CategoriesClient categories={categories} />;
}
