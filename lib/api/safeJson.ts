import { NextResponse } from 'next/server';

export async function safeJson<T = any>(
  req: Request,
  tag: string,
  opts?: { maxLogChars?: number }
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const maxLogChars = opts?.maxLogChars ?? 2000;
  const raw = await req.text();
  const preview = raw.slice(0, maxLogChars);

  console.log(`[${tag}] raw body length=${raw.length}; preview="${preview}"`);

  if (!raw.trim()) {
    return { ok: true, data: {} as T };
  }

  try {
    const data = JSON.parse(raw) as T;
    return { ok: true, data };
  } catch (error) {
    console.error(`[${tag}] Failed to parse JSON body`, error);
    return {
      ok: false,
      response: NextResponse.json({ error: 'Некорректный JSON в запросе' }, { status: 400 }),
    };
  }
}

export async function safeFormData(
  req: Request,
  tag: string
): Promise<{ ok: true; data: FormData } | { ok: false; response: Response }> {
  try {
    const formData = await req.formData();
    console.log(`[${tag}] formData keys preview=${Array.from(formData.keys()).slice(0, 10).join(',')}`);
    return { ok: true, data: formData };
  } catch (error) {
    console.error(`[${tag}] Failed to parse form data`, error);
    return {
      ok: false,
      response: NextResponse.json({ error: 'Некорректные данные формы' }, { status: 400 }),
    };
  }
}
