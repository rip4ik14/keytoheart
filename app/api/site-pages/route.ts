import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

interface SitePage {
  id: number;
  label: string;
  href: string;
  order_index: number;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('site_pages')
    .select('label, href')
    .order('order_index');

  if (error) {
    return NextResponse.json({ error: 'Ошибка получения страниц' }, { status: 400 });
  }

  return NextResponse.json(data, {
    status: 200,
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}

export const revalidate = 3600;