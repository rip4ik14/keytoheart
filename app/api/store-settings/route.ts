import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.store_settings.findFirst();
    if (!settings) {
      return NextResponse.json({ success: false, error: 'Настройки магазина не найдены' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json({ success: false, error: 'Ошибка получения настроек магазина' }, { status: 500 });
  }
}