import { NextResponse } from 'next/server';

export async function safeBody<T>(req: Request, label: string): Promise<T | NextResponse> {
  try {
    return (await req.json()) as T;
  } catch (error) {
    console.error(`[${label}] Invalid JSON body`, error);
    return NextResponse.json({ error: 'Некорректное тело запроса' }, { status: 400 });
  }
}
