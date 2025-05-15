import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    let check_id: string | null = null;
    let check_status: string | null = null;

    // Проверяем Content-Type запроса
    const contentType = request.headers.get('content-type') || '';
    console.log('Webhook Content-Type:', contentType);

    if (contentType.includes('multipart/form-data')) {
      try {
        // Пробуем обработать multipart/form-data
        const formData = await request.formData();
        check_id = formData.get('check_id') as string;
        check_status = formData.get('check_status') as string;
      } catch (error) {
        console.error('Error parsing multipart/form-data:', error);
        // Если formData не сработал, пробуем извлечь данные вручную из тела
        const text = await request.text();
        console.log('Raw body:', text);

        // Парсим multipart/form-data вручную
        const boundary = contentType.split('boundary=')[1];
        const parts = text.split(`--${boundary}`).filter(part => part.trim() && !part.includes('--'));

        for (const part of parts) {
          if (part.includes('name="check_id"')) {
            check_id = part.split('\r\n\r\n')[1]?.split('\r\n')[0]?.trim();
          }
          if (part.includes('name="check_status"')) {
            check_status = part.split('\r\n\r\n')[1]?.split('\r\n')[0]?.trim();
          }
        }
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Обрабатываем application/x-www-form-urlencoded
      const text = await request.text();
      console.log('Raw body (urlencoded):', text);
      const params = new URLSearchParams(text);
      check_id = params.get('check_id');
      check_status = params.get('check_status');
    } else if (contentType.includes('application/json')) {
      // Обрабатываем JSON
      const body = await request.json();
      console.log('Raw body (json):', body);
      check_id = body.check_id;
      check_status = body.check_status;
    } else {
      // Неизвестный Content-Type
      console.error('Unsupported Content-Type:', contentType);
      return new NextResponse('Unsupported Content-Type', { status: 400 });
    }

    console.log('Received webhook data:', { check_id, check_status });

    if (!check_id || !check_status) {
      console.error('Invalid webhook data:', { check_id, check_status });
      return new NextResponse('Invalid webhook data', { status: 400 });
    }

    if (check_status === '401') {
      const { error } = await supabase
        .from('auth_logs')
        .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
        .eq('check_id', check_id);

      if (error) {
        console.error('Error updating auth_logs:', error);
        return new NextResponse('Error updating status', { status: 500 });
      }

      console.log(`Successfully updated status to VERIFIED for check_id: ${check_id}`);
    } else {
      console.log(`Received check_status: ${check_status}, no action required`);
    }

    // SMS.ru ожидает простой текстовый ответ "100"
    return new NextResponse('100', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new NextResponse('Server error', { status: 500 });
  }
}
