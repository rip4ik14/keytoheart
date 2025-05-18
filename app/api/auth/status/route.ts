// app/api/auth/status/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase/supabase-admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const checkId = searchParams.get('checkId')
  const phone = searchParams.get('phone')

  if (!checkId || !phone) {
    return NextResponse.json(
      { success: false, error: 'checkId и phone обязательны' },
      { status: 400 }
    )
  }

  // 1) Проверяем статус звонка у SMS.ru
  const resp = await fetch(
    `https://sms.ru/callcheck/status?api_id=${process.env.SMS_RU_API_KEY}` +
    `&check_id=${encodeURIComponent(checkId)}&json=1`
  )
  if (!resp.ok) {
    return NextResponse.json(
      { success: false, error: 'Ошибка обращения к SMS.ru' },
      { status: resp.status }
    )
  }
  const smsData = await resp.json() as {
    status: string
    status_code: number
  }
  const callStatus = smsData.status  // PENDING | VERIFIED | FAILED | …

  // 2) Сохраняем в таблицу auth_logs
  const { error: upsertError } = await supabaseAdmin
    .from('auth_logs')
    .upsert({
      check_id: checkId,
      phone,
      status: callStatus,
      updated_at: new Date().toISOString(),
    })
  if (upsertError) {
    console.error('Ошибка upsert auth_logs:', upsertError)
  }

  // 3) Если ещё не VERIFIED — возвращаем текущий статус
  if (callStatus !== 'VERIFIED') {
    return NextResponse.json(
      { success: true, status: callStatus, phone },
      { status: 200 }
    )
  }

  // 4) Если VERIFIED — отвечаем об успехе
  return NextResponse.json(
    { success: true, status: 'VERIFIED', phone },
    { status: 200 }
  )
}
