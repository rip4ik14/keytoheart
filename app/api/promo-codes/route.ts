import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const codes = await prisma.promo_codes.findMany({
      select: {
        id: true, code: true, discount_value: true, discount_type: true, expires_at: true, is_active: true,
      },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(codes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function checkCSRF(req: NextRequest) {
  const csrfToken = req.headers.get('X-CSRF-Token');
  const storedCsrfToken = req.cookies.get('csrf_token')?.value;
  if (!csrfToken || csrfToken !== storedCsrfToken) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  if (!checkCSRF(req)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  try {
    const { code, discount_value, discount_type, expires_at, is_active } = await req.json();
    const promo = await prisma.promo_codes.create({
      data: { code, discount_value, discount_type, expires_at, is_active },
    });
    return NextResponse.json(promo);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!checkCSRF(req)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  try {
    const { id, code, discount_value, discount_type, expires_at, is_active } = await req.json();
    const promo = await prisma.promo_codes.update({
      where: { id },
      data: { code, discount_value, discount_type, expires_at, is_active },
    });
    return NextResponse.json(promo);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.promo_codes.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
