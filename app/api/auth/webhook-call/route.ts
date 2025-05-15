// ✅ Исправленный: app/api/auth/webhook-call/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  console.log(`[${new Date().toISOString()}] Webhook called: ${request.method} ${request.url}`);

  try {
    const contentType = request.headers.get('content-type') || '';
    console.log(`[${new Date().toISOString()}] Webhook Content-Type:`, contentType);

    let check_id: string | null = null;
    let check_status: string | null = null;

    // Обработка multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      console.log(`[${new Date().toISOString()}] Attempting to parse multipart/form-data`);
      
      // Извлекаем formData
      const formData = await request.formData();
      console.log(`[${new Date().toISOString()}] FormData parsed successfully`);

      // Логируем все ключи и значения в FormData
      console.log(`[${new Date().toISOString()}] FormData entries:`);
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      // Извлекаем check_id и check_status
      check_id = formData.get('check_id')?.toString() || null;
      check_status = formData.get('check_status')?.toString() || null;
      
      // Дополнительная проверка на случай, если formData не удалось распарсить
      if (!check_id || !check_status) {
        console.error(`[${new Date().toISOString()}] Failed to extract data from FormData, attempting raw parsing`);
        const text = await request.text();
        console.log(`[${new Date().toISOString()}] Raw body:`, text);

        const boundaryMatch = contentType.match(/boundary=(.+)/);
        if (!boundaryMatch) {
          console.error(`[${new Date().toISOString()}] No boundary found in Content-Type:`, contentType);
          return new NextResponse('Invalid boundary', { status: 400 });
        }

        const boundary = boundaryMatch[1];
        const parts = text.split(`--${boundary}`).filter(part => part.trim() && !part.includes('--'));

        console.log(`[${new Date().toISOString()}] Parsed parts:`, parts);

        for (const part of parts) {
          const lines = part.split('\n').filter(line => line.trim());
          console.log(`[${new Date().toISOString()}] Part lines:`, lines);

          const checkIdMatch = lines.find(line => line.includes('name="check_id"'));
          const checkStatusMatch = lines.find(line => line.includes('name="check_status"'));

          if (checkIdMatch) {
            const valueIndex = lines.indexOf(checkIdMatch) + 2;
            check_id = lines[valueIndex]?.trim() || null;
          }
          if (checkStatusMatch) {
            const valueIndex = lines.indexOf(checkStatusMatch) + 2;
            check_status = lines[valueIndex]?.trim() || null;
          }
        }
      }
    }
    // Обработка application/x-www-form-urlencoded
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      console.log(`[${new Date().toISOString()}] Attempting to parse urlencoded data`);
      const text = await request.text();
      console.log(`[${new Date().toISOString()}] Raw body (urlencoded):`, text);
      const params = new URLSearchParams(text);
      check_id = params.get('check_id');
      check_status = params.get('check_status');
    }
    // Обработка application/json
    else if (contentType.includes('application/json')) {
      console.log(`[${new Date().toISOString()}] Attempting to parse JSON data`);
      const body = await request.json();
      console.log(`[${new Date().toISOString()}] Raw body (json):`, body);
      check_id = body.check_id?.toString() || null;
      check_status = body.check_status?.toString() || null;
    }
    // Если Content-Type неизвестен
    else {
      console.error(`[${new Date().toISOString()}] Unsupported Content-Type:`, contentType);
      const text = await request.text();
      console.log(`[${new Date().toISOString()}] Raw body:`, text);
      return new NextResponse('Unsupported Content-Type', { status: 400 });
    }

    console.log(`[${new Date().toISOString()}] Extracted webhook data:`, { check_id, check_status });

    // Проверяем, что данные извлечены
    if (!check_id || !check_status) {
      console.error(`[${new Date().toISOString()}] Invalid webhook data:`, { check_id, check_status });
      return new NextResponse('Invalid webhook data', { status: 400 });
    }

    // Обновляем статус в auth_logs, если check_status = '401'
    if (check_status === '401') {
      console.log(`[${new Date().toISOString()}] Updating auth_logs for check_id: ${check_id}`);
      const { error } = await supabase
        .from('auth_logs')
        .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
        .eq('check_id', check_id);

      if (error) {
        console.error(`[${new Date().toISOString()}] Error updating auth_logs:`, error);
        return new NextResponse('Error updating status', { status: 500 });
      }

      console.log(`[${new Date().toISOString()}] Successfully updated status to VERIFIED for check_id: ${check_id}`);
    } else {
      console.log(`[${new Date().toISOString()}] Received check_status: ${check_status}, no action required`);
    }

    // Возвращаем ответ, ожидаемый SMS.ru
    return new NextResponse('100', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Webhook error:`, error.message, error.stack);
    return new NextResponse('Server error', { status: 500 });
  }
}