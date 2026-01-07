import { NextResponse } from 'next/server';

export async function safeBody<T = Record<string, unknown>>(
  req: Request,
  tag: string = 'API'
): Promise<T | NextResponse> {
  let body = {} as T;
  try {
    const text = await req.text();
    console.log(`[${tag}] Raw body length: ${text.length}, preview: ${text.slice(0, 500)}`);
    if (text.trim()) {
      body = JSON.parse(text) as T;
    }
  } catch (e) {
    console.error(`[${tag}] Body parse error:`, e);
    return NextResponse.json({ error: 'Некорректный запрос (bad JSON)' }, { status: 400 });
  }
  return body;
}
