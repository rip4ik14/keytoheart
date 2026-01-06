import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[TEST] GET received', new Date().toISOString());
  return NextResponse.json({ method: 'GET', ok: true });
}

export async function POST() {
  console.log('[TEST] POST received', new Date().toISOString());
  return NextResponse.json({ method: 'POST', ok: true });
}