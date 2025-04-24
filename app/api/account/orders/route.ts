// Путь: app/api/account/orders/route.ts

import { NextResponse } from "next/server";
import { supabasePublic as supabase } from "@/lib/supabase/public"; // единственный клиент

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json(
      { success: false, error: "Телефон не указан" },
      { status: 400 }
    );
  }

  // Получаем заказы
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, created_at, total, bonuses_used, payment_method, status")
    .eq("phone", phone)
    .order("created_at", { ascending: false });

  if (error || !orders) {
    return NextResponse.json({ success: false, data: [] });
  }

  // Для каждого заказа подгружаем позиции и название товара
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const { data: items } = await supabase
        .from("order_items")
        .select("quantity, price, product_id")
        .eq("order_id", order.id);

      const enrichedItems = await Promise.all(
        (items || []).map(async (item) => {
          const { data: product } = await supabase
            .from("products")
            .select("title")
            .eq("id", item.product_id)
            .single();
          return {
            ...item,
            title: product?.title || "Неизвестный товар",
          };
        })
      );

      return { ...order, items: enrichedItems };
    })
  );

  return NextResponse.json({ success: true, data: ordersWithItems });
}
