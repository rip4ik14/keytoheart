// ✅ Путь: app/api/promo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('promo_blocks')
      .select('id, title, subtitle, button_text, href, image_url, type, order_index')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching promo blocks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error in /api/promo GET:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      subtitle,
      button_text,
      href,
      image_url,
      type,
      order_index,
    } = await req.json();

    const { data, error } = await supabaseAdmin
      .from('promo_blocks')
      .insert({
        title,
        subtitle,
        button_text,
        href,
        image_url,
        type,
        order_index,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating promo block:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error in /api/promo POST:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const {
      id,
      title,
      subtitle,
      button_text,
      href,
      image_url,
      type,
      order_index,
    } = await req.json();

    const { data, error } = await supabaseAdmin
      .from('promo_blocks')
      .update({
        title,
        subtitle,
        button_text,
        href,
        image_url,
        type,
        order_index,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promo block:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Unexpected error in /api/promo PATCH:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, image_url } = await req.json();

    // Удаляем изображение из Supabase Storage, если оно есть
    if (image_url) {
      const fileName = decodeURIComponent(image_url.split('/').pop()!);
      console.log(`Deleting image ${fileName} from bucket promo-images`);
      const { error: storageError } = await supabaseAdmin.storage
        .from('promo-images') // Используем правильное имя бакета
        .remove([fileName]);

      if (storageError) {
        console.error('Error deleting image from storage:', storageError);
        // Продолжаем удаление записи, даже если удаление изображения не удалось
        console.warn('Proceeding with promo block deletion despite storage error');
      }
    } else {
      console.log('No image_url provided, skipping image deletion');
    }

    const { error } = await supabaseAdmin.from('promo_blocks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting promo block:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unexpected error in /api/promo DELETE:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}