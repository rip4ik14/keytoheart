// app/api/promo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.promo_blocks.findMany({
      orderBy: { order_index: 'asc' },
    });
    return NextResponse.json(data || []);
  } catch (err: any) {
    process.env.NODE_ENV !== 'production' && console.error('Prisma promo_blocks GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, subtitle, button_text, href, image_url, type, order_index } = await req.json();
    const data = await prisma.promo_blocks.create({
      data: { title, subtitle, button_text, href, image_url, type, order_index },
    });
    return NextResponse.json(data);
  } catch (err: any) {
    process.env.NODE_ENV !== 'production' && console.error('Prisma promo_blocks POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, title, subtitle, button_text, href, image_url, type, order_index } = await req.json();
    const data = await prisma.promo_blocks.update({
      where: { id: parseInt(id, 10) },
      data: { title, subtitle, button_text, href, image_url, type, order_index },
    });
    return NextResponse.json(data);
  } catch (err: any) {
    process.env.NODE_ENV !== 'production' && console.error('Prisma promo_blocks PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.promo_blocks.delete({
      where: { id: parseInt(id, 10) },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    process.env.NODE_ENV !== 'production' && console.error('Prisma promo_blocks DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}