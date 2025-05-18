// app/api/auth/status/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types_new'

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!
const SUPABASE_URL            = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE   = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_ANON_KEY       = process.env.SUPABASE_ANON_KEY!

if (!SMS_RU_API_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !SUPABASE_ANON_KEY) {
  throw new Error('Отсутствуют обязательные переменные окружения')
}

// клиент с правами admin для чтения/записи таблиц
const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// клиент anon для REST-токенов
const supabaseAnon = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// найти пользователя по телефону (опционально + или без +)
async function findUserByPhone(phone: string) {
  const plus = phone.startsWith('+') ? phone : `+${phone}`
  const raw  = plus.slice(1)
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error
  return data.users.find(u => u.phone === plus || u.phone === raw) ?? null
}

// запрос к SMS.ru для проверки статуса звонка
async function checkSmsStatus(checkId: string) {
  const res = await fetch(
    `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`,
    { cache: 'no-store' }
  )
  return res.json() as Promise<{ status: string; check_status: number; status_text?: string }>
}

// сгенерировать токены через REST API passwordless
async function generateTokens(userId: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=passwordless`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`
    },
    body: JSON.stringify({ user_id: userId, phone: true })
  })
  const data = await res.json()
  if (!res.ok || !data.access_token || !data.refresh_token) {
    console.error('Ошибка генерации токенов:', data)
    throw new Error('Не удалось получить токены')
  }
  return { access_token: data.access_token, refresh_token: data.refresh_token }
}

export async function GET(req: Request) {
  const url        = new URL(req.url)
  const checkId    = url.searchParams.get('checkId')
  const phoneParam = url.searchParams.get('phone')

  if (!checkId || !phoneParam) {
    return NextResponse.json({ success: false, error: 'checkId и phone обязательны' }, { status: 400 })
  }

  // 1. читаем текущий статус из своей таблицы auth_logs
  const { data: log, error: logErr } = await supabaseAdmin
    .from('auth_logs')
    .select('status')
    .eq('check_id', checkId)
    .single()

  if (logErr || !log) {
    return NextResponse.json({ success: false, error: 'checkId не найден' }, { status: 404 })
  }

  // 2. если уже VERIFIED и есть кука — сразу назад
  const cookieStore = await cookies()
  const hasToken    = cookieStore.get('access_token')?.value
  if (log.status === 'VERIFIED' && hasToken) {
    return NextResponse.json({ success: true, status: 'VERIFIED', phone: phoneParam })
  }

  // 3. проверяем статус звонка у SMS.ru
  const sms = await checkSmsStatus(checkId)
  if (sms.status !== 'OK') {
    return NextResponse.json({ success: false, error: sms.status_text ?? 'Ошибка SMS.ru' }, { status: 502 })
  }

  // SMS.ru возвращает check_status: 400=пока нет, 401=успех, 402=просрочено
  const newStatus =
    sms.check_status === 401 ? 'VERIFIED' :
    sms.check_status === 402 ? 'EXPIRED' : 'PENDING'

  // 4. обновляем статус в БД
  await supabaseAdmin
    .from('auth_logs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('check_id', checkId)

  if (newStatus !== 'VERIFIED') {
    return NextResponse.json({ success: true, status: newStatus, phone: phoneParam })
  }

  // 5. VERIFIED: найти или создать пользователя
  let user = await findUserByPhone(phoneParam)
  if (!user) {
    const email = `${phoneParam.replace(/\D/g, '')}-${Date.now()}@temp.example.com`
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      phone: phoneParam,
      phone_confirm: true,
      email,
      email_confirm: true,
      user_metadata: { phone: phoneParam }
    })
    if (error && !error.message.includes('already registered')) {
      return NextResponse.json({ success: false, error: 'createUser: ' + error.message }, { status: 500 })
    }
    user = data?.user ?? (await findUserByPhone(phoneParam))
  }

  // 6. убедиться, что есть профиль в user_profiles
  const { data: prof } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('phone', phoneParam)
    .single()
  if (!prof) {
    await supabaseAdmin.from('user_profiles').insert([{ phone: phoneParam, updated_at: new Date().toISOString() }])
  }

  // 7. генерируем токены
  let tokens
  try {
    tokens = await generateTokens(user!.id)
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }

  // 8. ставим куки и возвращаем JSON
  const res = NextResponse.json({
    success: true,
    status: 'VERIFIED',
    phone: phoneParam,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token
  })
  const cookieOpts = { httpOnly: true, secure: true, sameSite: 'strict' as const, path: '/' }
  res.cookies.set('access_token',  tokens.access_token,  { ...cookieOpts, maxAge: 60 * 60 * 24 * 3  })
  res.cookies.set('refresh_token', tokens.refresh_token, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })

  return res
}
