import { NextResponse } from 'next/server';
import { SMSRu } from 'node-sms-ru';
import { createClient } from '@supabase/supabase-js';

const smsRu = new SMSRu(process.env.SMS_RU_API_ID || '');

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    // Проверка формата номера телефона
    if (!phone || phone.length !== 12 || !phone.startsWith('+7')) {
      return NextResponse.json({ success: false, error: 'Некорректный номер телефона' }, { status: 400 });
    }

    // Генерируем случайный 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Сохраняем код в Supabase
    const { error: dbError } = await supabase
      .from('auth_codes')
      .upsert({ phone, code, created_at: new Date().toISOString() });

    if (dbError) {
      console.error('Ошибка сохранения кода в базе:', dbError);
      return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
    }

    // Отправляем SMS через SMS.RU
    const sendResult = await smsRu.sendSms({
      to: phone,
      msg: `Ваш код подтверждения: ${code}`,
      from: 'SMSRU', // Используем стандартное имя отправителя, так как KeytoHeart не одобрен
      test: false, // Реальная отправка SMS
    });

    // Проверяем код ответа от SMS.RU
    if (sendResult.status_code !== 100) {
      console.error('Ошибка отправки SMS:', sendResult);
      const errorMessage = getSmsRuErrorMessage(sendResult.status_code);
      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка отправки SMS:', error);
    return NextResponse.json({ success: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}

// Функция для получения сообщения об ошибке на основе кода SMS.RU
function getSmsRuErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 200:
      return 'Неверный api_id.';
    case 201:
      return 'Недостаточно средств на балансе.';
    case 202:
      return 'Неверный номер получателя.';
    case 203:
      return 'Сообщение пустое или слишком длинное.';
    case 204:
      return 'Имя отправителя не зарегистрировано.';
    case 205:
      return 'Сообщение отклонено модератором.';
    case 206:
      return 'Номер в черном списке.';
    case 207:
      return 'Превышен лимит отправки SMS.';
    default:
      return `Ошибка SMS.RU: Код ${statusCode}. Подробности смотрите в документации SMS.RU.`;
  }
}