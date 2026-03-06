import { NextResponse } from 'next/server';

const MAX_BODY_CHARS = 1_000_000;

export async function safeBody<T = Record<string, unknown>>(
  req: Request,
  tag: string = 'API',
): Promise<T | NextResponse> {
  try {
    const text = await req.text();

    if (text.length > MAX_BODY_CHARS) {
      return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${tag}] body length: ${text.length}`);
    }

    if (!text.trim()) return {} as T;
    return JSON.parse(text) as T;
  } catch (e) {
    process.env.NODE_ENV !== 'production' && console.error(`[${tag}] Body parse error:`, e);
    return NextResponse.json({ error: 'Некорректный запрос (bad JSON)' }, { status: 400 });
  }
}
