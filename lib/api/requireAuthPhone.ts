// ✅ Путь: lib/api/requireAuthPhone.ts
import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { cookies, headers } from 'next/headers';
import { normalizePhone } from '@/lib/normalizePhone';

function isValidRuPhone(phone: string) {
  return /^\+7\d{10}$/.test(phone);
}

function getClientIp(h: Awaited<ReturnType<typeof headers>>): string | null {
  const xf = h.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || null;
  return h.get('x-real-ip') || null;
}

export async function requireAuthPhone() {
  const c = await cookies();
  const h = await headers();

  const raw = c.get('user_phone')?.value ?? '';
  const sanitized = sanitizeHtml(raw, { allowedTags: [], allowedAttributes: {} });
  const phone = normalizePhone(sanitized);

  if (!phone || !isValidRuPhone(phone)) {
    return {
      ok: false as const,
      phone: '' as string,
      ip: null as string | null,
      ua: null as string | null,
      response: NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 }),
    };
  }

  const ip = getClientIp(h);
  const ua = h.get('user-agent') || null;

  return {
    ok: true as const,
    phone,
    ip,
    ua,
    response: null as NextResponse | null,
  };
}
