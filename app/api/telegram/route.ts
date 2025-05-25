import { NextResponse } from "next/server";

/**
 * TELEGRAM_BOT_TOKEN  – токен BotFather
 * TELEGRAM_CHAT_ID    – id чата (или канала) для уведомлений
 * Оба значения в .env.local
 */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, name, total, items = [] } = body;

    const itemsList =
      Array.isArray(items) && items.length > 0
        ? items
            .map(
              (i: any) =>
                `• ${i.title ?? "Товар"}  ×${i.quantity ?? 1}  —  ${i.price}₽`
            )
            .join("\n")
        : "Нет данных о товарах";

    const message = `
<b>🆕 Новый заказ</b>
<b>Имя:</b> ${name || "—"}
<b>Телефон:</b> ${phone || "—"}
<b>Сумма:</b> ${total ?? 0} ₽

<b>Товары:</b>
${itemsList}
    `.trim();

    const tgRes = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    if (!tgRes.ok) {
      const err = await tgRes.text();
      return NextResponse.json({ success: false, error: err }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
