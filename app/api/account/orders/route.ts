// app/api/account/orders/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    const sanitizedPhone = sanitizeHtml(phone || '', { allowedTags: [], allowedAttributes: {} });
    if (!sanitizedPhone) {
      return NextResponse.json({ success: false, error: 'Телефон не указан' }, { status: 400 });
    }

    const phoneRegex = /^\+7\d{10}$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Некорректный формат номера телефона (должен быть +7XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    const orders = await prisma.orders.findMany({
      where: { phone: sanitizedPhone },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        total: true,
        bonuses_used: true,
        payment_method: true,
        status: true,
        recipient: true,
        items: true,
        upsell_details: true
      },
    });

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const ordersWithItems = orders.map((order: any) => {
      const items = Array.isArray(order.items)
        ? order.items.map((item: any) => ({
            product_id: item.product_id ?? item.id ?? 0,
            title: item.title || 'Неизвестный товар',
            quantity: item.quantity ?? 1,
            price: item.price ?? 0,
          }))
        : [];

      const upsellDetails = Array.isArray(order.upsell_details)
        ? order.upsell_details.map((upsell: any) => ({
            title: upsell.title || 'Неизвестный товар',
            price: upsell.price || 0,
            quantity: upsell.quantity || 1,
            category: upsell.category || 'unknown',
          }))
        : [];

      return {
        id: order.id,
        created_at: order.created_at ?? '',
        total: Number(order.total ?? 0),
        bonuses_used: order.bonuses_used ?? 0,
        payment_method: order.payment_method ?? 'cash',
        status: order.status ?? '',
        recipient: order.recipient || 'Не указан',
        items,
        upsell_details: upsellDetails,
      };
    });

    return NextResponse.json(
      { success: true, data: ordersWithItems },
      {
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
