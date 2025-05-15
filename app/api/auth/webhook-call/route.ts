// ✅ Исправленный: app/api/auth/webhook-call/route.ts
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

    const contentType = request.headers.get('content-type') || '';
    console.log(`[${new Date().toISOString()}] Webhook Content-Type:`, contentType);

    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        check_id = formData.get('check_id') as string;
        check_status = formData.get('check_status') as string;
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error parsing multipart/form-data:`, error);
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
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      console.log(`[${new Date().toISOString()}] Raw body (urlencoded):`, text);
      const params = new URLSearchParams(text);
      check_id = params.get('check_id');
      check_status = params.get('check_status');
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      console.log(`[${new Date().toISOString()}] Raw body (json):`, body);
      check_id = body.check_id;
      check_status = body.check_status;
    } else {
      console.error(`[${new Date().toISOString()}] Unsupported Content-Type:`, contentType);
      return new NextResponse('Unsupported Content-Type', { status: 400 });
    }

    console.log(`[${new Date().toISOString()}] Received webhook data:`, { check_id, check_status });

    if (!check_id || !check_status) {
      console.error(`[${new Date().toISOString()}] Invalid webhook data:`, { check_id, check_status });
      return new NextResponse('Invalid webhook data', { status: 400 });
    }

    if (check_status === '401') { // Успешная верификация
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

    return new NextResponse('100', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Webhook error:`, error);
    return new NextResponse('Server error', { status: 500 });
  }
}