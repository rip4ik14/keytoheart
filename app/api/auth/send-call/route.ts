import { NextResponse } from 'next/server';

const SMSRU_API_ID = process.env.SMSRU_API_ID!; // Ваш API ID из SMS.ru

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    if (!phone || !phone.startsWith('+7') || phone.replace(/\D/g, '').length !== 11) {
      return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(1); // Убираем +7, оставляем 10 цифр
    const response = await fetch(
      `https://sms.ru/callcheck/add?api_id=${SMSRU_API_ID}&phone=${cleanPhone}&json=1`,
      {
        method: 'POST',
      }
    );

    const result = await response.json();
    if (result.status !== 'OK') {
      return NextResponse.json({ success: false, error: 'Failed to initiate call' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      checkId: result.check_id,
      callPhone: result.call_phone_pretty,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending call via SMS.ru:', error);
    return NextResponse.json({ success: false, error: 'Failed to initiate call' }, { status: 500 });
  }
}