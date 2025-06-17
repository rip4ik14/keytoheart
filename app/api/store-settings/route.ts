import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.store_settings.findFirst();

    if (!data) {
      return NextResponse.json({ success: false, error: 'Настройки не найдены' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        order_acceptance_enabled: data.order_acceptance_enabled ?? false,
        banner_message: data.banner_message ?? null,
        banner_active: data.banner_active ?? false,
        order_acceptance_schedule: data.order_acceptance_schedule ?? {},
        store_hours: data.store_hours ?? {},
      },
    });
  } catch (error: any) {
    process.env.NODE_ENV !== "production" && console.error('Error in store-settings API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}