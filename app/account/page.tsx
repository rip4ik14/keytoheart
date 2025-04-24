// app/account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useSupabaseClient,
  useSession,
} from "@supabase/auth-helpers-react";
import { IMaskInput } from "react-imask";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useCart } from "@context/CartContext";

export default function AccountPage() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const { addItem } = useCart();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [orders, setOrders] = useState<any[]>([]);
  const [bonusData, setBonusData] = useState<any>(null);
  const [filterDays, setFilterDays] = useState(30);

  // если уже залогинен — подгружаем данные
  useEffect(() => {
    if (session) {
      fetchAccountData();
    }
  }, [session]);

  async function fetchAccountData() {
    // Супабейс‑авторизованный RPC или API‑роуты на сервере
    const { data: bonuses } = await supabase
      .from("bonuses")
      .select("bonus_balance, level, history:bonus_history(amount,reason,created_at)")
      .eq("phone", session.user.phone) // phone хранится в user metadata
      .single();
    setBonusData(bonuses);

    const { data: ordersList } = await supabase
      .from("orders")
      .select(`
        id, created_at, total, bonuses_used, payment_method, status,
        order_items(quantity,price,product_id, products(title))
      `)
      .eq("phone", session.user.phone)
      .order("created_at", { ascending: false });
    setOrders(ordersList || []);
  }

  // 1. Отправка OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) {
      return toast.error("Введите корректный номер");
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone: "+7" + clean,
      options: { redirectTo: window.location.origin + "/account" },
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Код отправлен вам в SMS");
      setStep("code");
    }
  };

  // 2. Подтверждение кода
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.verifyOtp({
      phone: "+7" + phone.replace(/\D/g, ""),
      token: code,
      type: "sms",
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Успешно вошли");
      // сессия подтянется через провайдер → useEffect → fetchAccountData()
    }
  };

  if (!session) {
    return (
      <div className="max-w-sm mx-auto py-10 px-4">
        <Toaster position="top-center" />
        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold">Вход по телефону</h1>
            <div className="flex gap-2">
              <span className="pt-2">+7</span>
              <IMaskInput
                mask="(000) 000-00-00"
                value={phone}
                onAccept={(val) => setPhone(val)}
                className="border p-2 rounded w-full"
                placeholder="(___) ___-__-__"
                required
              />
            </div>
            <button className="w-full bg-black text-white py-2 rounded">
              Получить код
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <h1 className="text-2xl font-bold">Введите код</h1>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Код из SMS"
              className="border p-2 rounded w-full"
              required
            />
            <button className="w-full bg-black text-white py-2 rounded">
              Подтвердить
            </button>
          </form>
        )}
        <div className="mt-4 text-center text-sm text-gray-500">
          <Link href="/">← Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  // Если залогинились — показываем кабинет
  const filteredOrders = orders.filter((order) => {
    const date = new Date(order.created_at);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filterDays);
    return date >= cutoff;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Toaster position="top-center" />
      <div className="text-right mb-4">
        <button
          className="text-sm text-gray-500 hover:underline"
          onClick={async () => {
            await supabase.auth.signOut();
            router.refresh();
          }}
        >
          Выйти
        </button>
      </div>

      {/* Бонусный баланс */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Бонусный баланс</h2>
        <p>{bonusData?.bonus_balance ?? 0} бонусов</p>
        <p className="text-sm text-gray-600">Уровень: {bonusData?.level}</p>
      </div>

      {/* История бонусов */}
      {bonusData?.history?.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold mb-2">История бонусов</h3>
          <ul className="divide-y">
            {bonusData.history.map((h: any, i: number) => (
              <li key={i} className="py-2 flex justify-between">
                <span>
                  {h.reason} <br />
                  <small className="text-gray-500">
                    {new Date(h.created_at).toLocaleDateString("ru-RU")}
                  </small>
                </span>
                <span
                  className={`font-medium ${
                    h.amount > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {h.amount > 0 ? "+" : ""}
                  {h.amount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Фильтр заказов */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <label>Показать за:</label>
        <select
          className="border p-1 rounded"
          value={filterDays}
          onChange={(e) => setFilterDays(+e.target.value)}
        >
          <option value={7}>7 дней</option>
          <option value={30}>30 дней</option>
          <option value={90}>90 дней</option>
          <option value={365}>Год</option>
          <option value={9999}>Все</option>
        </select>
      </div>

      {/* Список заказов */}
      {filteredOrders.length === 0 ? (
        <p className="text-gray-500">Нет заказов за выбранный период.</p>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded shadow-sm bg-white"
            >
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Заказ от{" "}
                  <b>
                    {new Date(order.created_at).toLocaleDateString("ru-RU")}
                  </b>
                </span>
                <span>
                  {order.payment_method === "cash" ? "Наличные" : "Онлайн"}
                </span>
              </div>
              <div className="text-sm mb-2">
                <span>Сумма: </span>
                <b>{order.total} ₽</b>, бонусов списано:{" "}
                <b>{order.bonuses_used || 0}</b>
              </div>
              <ul className="list-disc ml-5 text-sm">
                {order.order_items.map((it: any, idx: number) => (
                  <li key={idx}>
                    {it.products.title} ×{it.quantity} ={" "}
                    {it.price * it.quantity} ₽
                  </li>
                ))}
              </ul>
              <button
                className="mt-2 text-blue-600 text-sm hover:underline"
                onClick={() => {
                  // повторить заказ
                  const draft = {
                    items: order.order_items.map((it: any) => ({
                      id: it.product_id,
                      title: it.products.title,
                      price: it.price,
                      quantity: it.quantity,
                      imageUrl: it.products.cover_url || "/no-image.jpg",
                    })),
                  };
                  localStorage.setItem("repeatDraft", JSON.stringify(draft));
                  toast.success("Заказ скопирован в корзину");
                  router.push("/cart");
                }}
              >
                🔁 Повторить заказ
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
);
