import { NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { check_id, check_status, phone } = await request.json();
    if (!check_id || !check_status || !phone) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (check_status === '401') {
      console.log(`Authorization successful for check_id: ${check_id}, phone: ${phone}`);

      // Обновляем статус авторизации в базе данных
      const { error } = await supabase
        .from('auth_logs')
        .upsert({
          check_id,
          phone,
          status: 'verified',
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating auth log:', error);
        return NextResponse.json({ success: false, error: 'Failed to update auth log' }, { status: 500 });
      }
    } else {
      console.log(`Authorization not completed for check_id: ${check_id}, status: ${check_status}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in webhook:', error);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}