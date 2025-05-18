// app/api/auth/status/route.ts

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types_new'

//
// 1. Поиск пользователя по телефону через админ-API Supabase
//
async function findUserByPhone(
  supabaseAdmin: SupabaseClient<Database, 'public'>,
  phone: string
): Promise<User | null> {
  const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`
  const phonePlain    = phoneWithPlus.slice(1)

  // Список первых 1000 юзеров (при необходимости увеличить perPage)
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error

  return data.users.find(u =>
    u.phone === phoneWithPlus || u.phone === phonePlain
  ) ?? null
}

//
// 2. Генерация access_token и refresh_token через REST API Supabase
//
async function generateTokens(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string
): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=passwordless`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ user_id: userId, phone: true }),
    }
  )
  const data = await res.json()
  if (!res.ok || !data.access_token || !data.refresh_token) {
    console.error('Ошибка генерации токенов:', data)
    throw new Error('Ошибка генерации токенов')
  }
  return { access_token: data.access_token, refresh_token: data.refresh_token }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const checkId    = searchParams.get('checkId')
  const phoneParam = searchParams.get('phone')

  if (!checkId || !phoneParam) {
    return NextResponse.json(
      { success: false, error: 'Не указаны обязательные параметры' },
      { status: 400 }
    )
  }

  // Проверяем, что есть все env-переменные
  const SUPABASE_URL  = process.env.SUPABASE_URL!
  const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const SMS_RU_API_ID = process.env.SMS_RU_API_ID!
  if (!SUPABASE_URL || !SERVICE_KEY || !SMS_RU_API_ID) {
    throw new Error('Отсутствуют обязательные переменные окружения')
  }

  // Инициализируем админ-клиент Supabase
  const supabaseAdmin: SupabaseClient<Database, 'public'> =
    createClient<Database, 'public'>(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: true, persistSession: false },
    })

  //
  // 1) Проверяем статус в нашей таблице auth_logs
  //
  const { data: authLog, error: logErr } = await supabaseAdmin
    .from('auth_logs')
    .select('status')
    .eq('check_id', checkId)
    .single()

  if (logErr || !authLog) {
    return NextResponse.json(
      { success: false, error: 'checkId не найден' },
      { status: 404 }
    )
  }
  if (authLog.status === 'VERIFIED') {
    return NextResponse.json(
      { success: true, status: 'VERIFIED', phone: phoneParam }
    )
  }
  if (authLog.status === 'EXPIRED') {
    return NextResponse.json(
      { success: true, status: 'EXPIRED', phone: phoneParam }
    )
  }

  //
  // 2) Спрашиваем у SMS.ru, поменялся ли статус
  //
  const smsRes = await fetch(
    `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`,
    { cache: 'no-store' }
  )
  const smsJson = await smsRes.json()
  if (smsJson.status !== 'OK') {
    return NextResponse.json(
      { success: false, error: 'Ошибка SMS.ru' },
      { status: 502 }
    )
  }
  const st = smsJson.check_status as number  // 400=РОГ,401=VERIFIED,402=EXPIRED
  const newStatus = st === 401 ? 'VERIFIED' : st === 402 ? 'EXPIRED' : 'PENDING'
  await supabaseAdmin
    .from('auth_logs')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('check_id', checkId)

  if (newStatus !== 'VERIFIED') {
    return NextResponse.json(
      { success: true, status: newStatus, phone: phoneParam }
    )
  }

  //
  // 3) Если уже VERIFIED — ищем или создаём пользователя
  //
  let user = await findUserByPhone(supabaseAdmin, phoneParam)
  if (!user) {
    const email = `${phoneParam.replace(/\D/g, '')}-${Date.now()}@temp.example.com`
    const { data: newUserData, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        phone: phoneParam,
        phone_confirm: true,
        email,
        email_confirm: true,
        user_metadata: { phone: phoneParam },
      })

    if (createErr && !createErr.message.includes('already registered')) {
      return NextResponse.json(
        { success: false, error: 'Ошибка создания пользователя' },
        { status: 500 }
      )
    }
    user = newUserData?.user ?? null
  }
  if (!user || !user.phone) {
    return NextResponse.json(
      { success: false, error: 'Не удалось получить данные пользователя' },
      { status: 500 }
    )
  }

  //
  // 4) Создаём профиль в user_profiles (игнорируем ошибку duplicate)
  //
  try {
    await supabaseAdmin
      .from('user_profiles')
      .insert({ phone: user.phone, updated_at: new Date().toISOString() })
  } catch {
    // если профиль уже есть — пропускаем
  }

  //
  // 5) Генерируем токены
  //
  const { access_token, refresh_token } = await generateTokens(
    SUPABASE_URL,
    SERVICE_KEY,
    user.id
  )

  //
  // 6) Устанавливаем куки и отдаем JSON
  //
  const res = NextResponse.json({
    success: true,
    status: 'VERIFIED',
    phone: user.phone,
    access_token,
    refresh_token,
  })

  const cookieStore = cookies()
  const cfg = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    path: '/',
  }

  res.cookies.set({
    ...cfg,
    name: 'access_token',
    value: access_token,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
  })
  res.cookies.set({
    ...cfg,
    name: 'refresh_token',
    value: refresh_token,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  })

  return res
}
