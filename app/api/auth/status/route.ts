// ✅ Исправленный: app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types_new';

const SMS_RU_API_ID = process.env.SMS_RU_API_ID!;
const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: true, persistSession: false } }
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkId = searchParams.get('checkId');
  const phone = searchParams.get('phone');

  console.log(`[${new Date().toISOString()}] Проверка статуса для checkId: ${checkId}, телефон: ${phone}`);

  if (!checkId || !phone) {
    console.error('Отсутствует checkId или телефон в параметрах запроса');
    return NextResponse.json({ success: false, error: 'checkId и телефон обязательны' }, { status: 400 });
  }

  // Проверяем формат номера
  if (!phone.startsWith('+7') || phone.replace(/\D/g, '').length !== 11) {
    console.error('Неверный формат телефона:', phone);
    return NextResponse.json({ success: false, error: 'Некорректный номер телефона' }, { status: 400 });
  }

  try {
    // Проверяем статус в базе данных
    console.log(`[${new Date().toISOString()}] Запрос в auth_logs для checkId: ${checkId}`);
    const { data: authLog, error: dbError } = await supabase
      .from('auth_logs')
      .select('status')
      .eq('check_id', checkId)
      .eq('phone', phone.replace(/\D/g, '')) // Убираем нецифровые символы для соответствия записи в базе
      .single();

    if (dbError || !authLog) {
      console.error(`[${new Date().toISOString()}] Ошибка получения записи auth log:`, dbError);
      return NextResponse.json({ success: false, error: 'Запись авторизации не найдена' }, { status: 404 });
    }

    console.log(`[${new Date().toISOString()}] Статус из базы данных:`, authLog.status);

    // Если статус уже VERIFIED, возвращаем его
    if (authLog.status === 'VERIFIED') {
      console.log(`[${new Date().toISOString()}] Статус уже VERIFIED, возвращаем сразу`);
      return NextResponse.json({ success: true, status: 'VERIFIED', message: 'Авторизация завершена' });
    }

    // Если статус не VERIFIED, проверяем через SMS.ru
    const url = `https://sms.ru/callcheck/status?api_id=${SMS_RU_API_ID}&check_id=${checkId}&json=1`;
    console.log(`[${new Date().toISOString()}] Запрос к SMS.ru API: ${url}`);
    const startTime = Date.now();
    const apiRes = await fetch(url);
    const responseText = await apiRes.text();
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Ответ SMS.ru API (длительность: ${duration}ms):`, responseText);

    let apiJson;
    try {
      apiJson = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('Не удалось разобрать ответ SMS.ru как JSON:', parseError.message);
      console.error('Необработанный ответ:', responseText);
      return NextResponse.json({ success: false, error: 'Ошибка ответа от SMS.ru' }, { status: 500 });
    }

    if (!apiJson || apiJson.status !== 'OK') {
      console.error('Ошибка API SMS.ru:', apiJson?.status_text || 'Неизвестная ошибка');
      return NextResponse.json({ success: false, error: 'Ошибка проверки статуса' }, { status: 500 });
    }

    const checkStatus = apiJson.check_status.toString();
    const checkStatusText = apiJson.check_status_text;

    if (checkStatus === '401') {
      // Номер подтверждён, обновляем статус в базе данных
      console.log(`[${new Date().toISOString()}] SMS.ru подтвердил верификацию (check_status: ${checkStatus}), обновляем auth_logs`);
      const { error: updateError } = await supabase
        .from('auth_logs')
        .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
        .eq('check_id', checkId)
        .eq('phone', phone.replace(/\D/g, ''));

      if (updateError) {
        console.error('Ошибка обновления auth_logs:', updateError);
        return NextResponse.json({ success: false, error: 'Ошибка обновления статуса в базе данных' }, { status: 500 });
      }

      // Проверяем, существует ли пользователь в Supabase Auth
      console.log(`[${new Date().toISOString()}] Проверка существования пользователя с телефоном: ${phone}`);
      let user;
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) {
        console.error('Ошибка при получении списка пользователей:', userError);
        return NextResponse.json({ success: false, error: 'Ошибка поиска пользователя' }, { status: 500 });
      }
      console.log(`[${new Date().toISOString()}] Найдено пользователей: ${userData.users.length}`);
      user = userData.users.find((u: any) => u.phone === phone);

      if (!user) {
        console.log(`[${new Date().toISOString()}] Пользователь не существует, создаём нового для телефона: ${phone}`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: phone,
          phone_confirm: true,
          user_metadata: { phone: phone },
          email: `${phone.replace(/\D/g, '')}@temp.example.com`,
          email_confirm: true,
        });

        if (createError) {
          console.error('Ошибка создания пользователя:', createError);
          if (createError.message.includes('Phone number already registered')) {
            console.log(`[${new Date().toISOString()}] Пользователь уже зарегистрирован, повторный поиск`);
            const { data: existingUserData, error: fetchError } = await supabase.auth.admin.listUsers();
            user = existingUserData.users.find((u: any) => u.phone === phone);
            if (fetchError || !user) {
              console.error('Ошибка при поиске существующего пользователя:', fetchError);
              return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
            }
          } else {
            return NextResponse.json({ success: false, error: 'Ошибка создания пользователя' }, { status: 500 });
          }
        } else {
          user = newUser.user;
          console.log(`[${new Date().toISOString()}] Пользователь успешно создан: ${user.id}`);
        }
      } else {
        console.log(`[${new Date().toISOString()}] Пользователь найден: ${user.id}`);
      }

      // Создаём сессионный токен для пользователя
      console.log(`[${new Date().toISOString()}] Генерируем токен сессии для пользователя: ${user.id}`);
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `${phone.replace(/\D/g, '')}@temp.example.com`,
        options: {
          redirectTo: 'https://keytoheart.ru',
        },
      });

      if (sessionError || !sessionData.properties?.action_link) {
        console.error('Ошибка генерации токена сессии:', sessionError);
        return NextResponse.json({ success: false, error: 'Ошибка создания сессии' }, { status: 500 });
      }

      const token = sessionData.properties.action_link.split('token=')[1]?.split('&')[0];
      if (!token) {
        console.error('Не удалось извлечь токен из magic link');
        return NextResponse.json({ success: false, error: 'Ошибка создания сессии' }, { status: 500 });
      }

      console.log(`[${new Date().toISOString()}] Токен успешно сгенерирован: ${token}`);

      // Устанавливаем сессионный токен в куки
      const response = NextResponse.json({ success: true, status: 'VERIFIED', message: 'Авторизация завершена' });
      response.cookies.set('sb-access-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/',
        sameSite: 'lax',
      });

      console.log(`[${new Date().toISOString()}] Токен успешно установлен в куки: sb-access-token`);

      console.log(`[${new Date().toISOString()}] Успешно обновлён статус на VERIFIED для check_id: ${checkId}`);
      return response;
    } else if (checkStatus === '402') {
      console.log(`[${new Date().toISOString()}] SMS.ru статус EXPIRED (check_status: ${checkStatus})`);
      return NextResponse.json({ success: false, status: 'EXPIRED', error: 'Время для звонка истекло' });
    } else {
      console.log(`[${new Date().toISOString()}] SMS.ru статус остаётся PENDING (check_status: ${checkStatus})`);
      return NextResponse.json({ success: true, status: 'PENDING', message: checkStatusText });
    }
  } catch (error: any) {
    console.error('Ошибка проверки статуса:', error);
    return NextResponse.json({ success: false, error: 'Серверная ошибка' }, { status: 500 });
  }
}