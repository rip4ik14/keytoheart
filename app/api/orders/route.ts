// Путь: app/api/orders/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server"; // ← исправленный путь

// Функция для расчёта уровня по суммарному обороту
function getLevelByTotal(total: number): string {
  if (total >= 50000) return "Премиум";
  if (total >= 30000) return "Платиновый";
  if (total >= 20000) return "Золотой";
  if (total >= 10000) return "Серебряный";
  return "Бронзовый";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      phone,
      name,
      recipient,
      address,
      date,
      time,
      payment,
      items: cart,
      total,
      bonuses_used = 0,
      bonus = 0,
    } = body;

    // 1. Сохраняем заказ
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert([
        {
          phone,
          contact_name: name,
          recipient,
          address,
          delivery_date: date,
          delivery_time: time,
          payment_method: payment,
          total,
          bonuses_used,
          bonus,
          status: "Ожидает подтверждения",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (orderError || !order) {
      console.error("Ошибка при сохранении заказа:", orderError?.message);
      return NextResponse.json(
        { success: false, error: orderError?.message },
        { status: 500 }
      );
    }

    // 2. Сохраняем позиции товаров
    const orderItems = cart.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));
    const { error: itemError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);
    if (itemError) {
      console.error("Ошибка сохранения товаров:", itemError.message);
    }

    // 3. Начисление бонусов
    const percent =
      total >= 50000
        ? 0.15
        : total >= 30000
        ? 0.1
        : total >= 20000
        ? 0.075
        : total >= 10000
        ? 0.05
        : 0.025;
    const bonusesEarned = Math.floor((total - bonuses_used) * percent);

    const { data: existing, error: existErr } = await supabaseAdmin
      .from("bonuses")
      .select("total_spent, bonus_balance")
      .eq("phone", phone)
      .single();

    if (existErr) {
      console.error("Ошибка чтения бонусов:", existErr.message);
    }

    const newTotal = (existing?.total_spent || 0) + total;
    const newBalance =
      (existing?.bonus_balance || 0) - bonuses_used + bonusesEarned;

    const { error: bonusError, data: bonusUpdate } = await supabaseAdmin
      .from("bonuses")
      .upsert(
        {
          phone,
          total_spent: newTotal,
          bonus_balance: newBalance,
          level: getLevelByTotal(newTotal),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "phone" }
      )
      .select();

    if (bonusError) {
      console.error("Ошибка обновления бонусов:", bonusError.message);
    } else {
      console.log("✅ Бонусы обновлены:", bonusUpdate);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Ошибка при оформлении заказа:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
