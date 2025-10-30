import { NextResponse } from "next/server";
import crypto from "crypto";

// Формируем Token по правилам Tinkoff:
// 1) Берём все поля запроса, которые отправим в Init (кроме Token)
// 2) Добавляем поле Password = секрет из .env
// 3) Сортируем по названию ключа (ASC)
// 4) Склеиваем ИМЕННО ЗНАЧЕНИЯ подряд в строку
// 5) SHA-256 от строки → hex
function makeToken(params: Record<string, any>) {
  const withPassword: Record<string, any> = {
    ...params,
    Password: process.env.TINKOFF_PASSWORD!,
  };
  const str = Object.keys(withPassword)
    .sort()
    .map((k) => String(withPassword[k]))
    .join("");
  return crypto.createHash("sha256").update(str).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { amount, orderId, description } = await req.json();

    // Параметры, которые уйдут в /v2/Init
    const initParams = {
      TerminalKey: process.env.TINKOFF_TERMINAL_KEY,
      Amount: Math.round(Number(amount) * 100), // ₽ → копейки
      OrderId: String(orderId ?? Date.now()),
      Description: description ?? "Test payment",
      SuccessURL: process.env.TINKOFF_SUCCESS_URL,
      FailURL: process.env.TINKOFF_FAIL_URL,
    };

    const Token = makeToken(initParams); // рассчитываем токен

    const r = await fetch("https://securepay.tinkoff.ru/v2/Init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ВАЖНО: Password НЕ отправляем. Отправляем Token.
      body: JSON.stringify({ ...initParams, Token }),
    });

    const data = await r.json();
    if (!r.ok || !data?.PaymentURL) {
      return NextResponse.json({ error: data }, { status: 502 });
    }
    return NextResponse.json({ paymentUrl: data.PaymentURL });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
