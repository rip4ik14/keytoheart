import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function isBerryText(text: string) {
  const t = (text || '').toLowerCase();
  return /клубник/.test(t) || /шоколад|бельгийск/.test(t);
}

function isBalloonText(text: string) {
  const t = (text || '').toLowerCase();
  return /шар|шары|гелиев/.test(t);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const baseIdRaw = url.searchParams.get('base_id');
    const baseId = baseIdRaw ? Number(baseIdRaw) : NaN;

    if (!baseIdRaw || Number.isNaN(baseId)) {
      return NextResponse.json(
        { success: false, message: 'base_id is required' },
        { status: 400 },
      );
    }

    const { data: base, error: baseErr } = await supabase
      .from('products')
      .select('id, title, price, images, production_time, description, composition, is_visible, in_stock')
      .eq('id', baseId)
      .single();

    if (baseErr || !base || base.is_visible !== true || base.in_stock === false) {
      return NextResponse.json(
        { success: false, message: 'base product not found' },
        { status: 404 },
      );
    }

    const baseText = `${base.title ?? ''} ${base.description ?? ''} ${base.composition ?? ''}`;
    const baseIsBerry = isBerryText(baseText);

    const { data: all, error } = await supabase
      .from('products')
      .select('id, title, price, images, production_time, description, composition, is_visible, in_stock')
      .eq('is_visible', true)
      .neq('in_stock', false)
      .limit(400);

    if (error) {
      return NextResponse.json({ success: false, message: 'db error' }, { status: 500 });
    }

    const normalized = (all || []).filter((p) => p && p.id && p.title && p.price != null);

    const berries = normalized
      .filter((p) => !isBalloonText(`${p.title ?? ''} ${p.description ?? ''} ${p.composition ?? ''}`))
      .filter((p) => isBerryText(`${p.title ?? ''} ${p.description ?? ''} ${p.composition ?? ''}`))
      .slice(0, 24)
      .map((p) => ({
        id: p.id,
        title: p.title!,
        price: p.price || 0,
        image: Array.isArray(p.images) && p.images[0] ? p.images[0] : '/placeholder.jpg',
        production_time: p.production_time ?? null,
        kind: 'berry' as const,
      }));

    const flowers = normalized
      .filter((p) => !isBalloonText(`${p.title ?? ''} ${p.description ?? ''} ${p.composition ?? ''}`))
      .filter((p) => !isBerryText(`${p.title ?? ''} ${p.description ?? ''} ${p.composition ?? ''}`))
      .slice(0, 24)
      .map((p) => ({
        id: p.id,
        title: p.title!,
        price: p.price || 0,
        image: Array.isArray(p.images) && p.images[0] ? p.images[0] : '/placeholder.jpg',
        production_time: p.production_time ?? null,
        kind: 'flower' as const,
      }));

    const balloons = normalized
      .filter((p) => isBalloonText(`${p.title ?? ''} ${p.description ?? ''} ${p.composition ?? ''}`))
      .slice(0, 24)
      .map((p) => ({
        id: p.id,
        title: p.title!,
        price: p.price || 0,
        image: Array.isArray(p.images) && p.images[0] ? p.images[0] : '/placeholder.jpg',
        production_time: p.production_time ?? null,
        kind: 'balloon' as const,
      }));

    return NextResponse.json({
      success: true,
      data: {
        base: {
          id: base.id,
          title: base.title ?? '',
          price: base.price ?? 0,
          image: Array.isArray(base.images) && base.images[0] ? base.images[0] : '/placeholder.jpg',
          production_time: base.production_time ?? null,
          kind: baseIsBerry ? ('berry' as const) : ('flower' as const),
        },
        options: {
          berries,
          flowers,
          balloons,
        },
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'unknown error' }, { status: 500 });
  }
}
