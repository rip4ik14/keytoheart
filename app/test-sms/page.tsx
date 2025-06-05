'use client';

import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SendSMSPage() {
  const [status, setStatus] = useState('');

  const sendOtp = async () => {
    setStatus('Отправка...');
    const { error } = await supabase.auth.signInWithOtp({
      phone: '+79180300643', // подставь нужный номер
    });

    if (error) {
      process.env.NODE_ENV !== "production" && console.error('Ошибка отправки OTP:', error.message);
      setStatus('Ошибка: ' + error.message);
    } else {
      setStatus('Код отправлен — проверь SMS!');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Тест отправки SMS</h1>
      <button
        onClick={sendOtp}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Отправить SMS
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
}
