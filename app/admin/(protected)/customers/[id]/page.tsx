"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabasePublic as supabase } from "@/lib/supabase/public";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru"; // Исправляем импорт локали
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

interface Customer {
  id: string;
  phone: string;
  email?: string;
  created_at: string;
  important_dates: { birthday?: string | null; anniversary?: string | null }; // Исправляем тип
  orders: any[];
  bonuses: { bonus_balance: number | null; level: string | null }; // Исправляем тип
  bonus_history: any[];
}

interface CustomerDetailPageProps {
  params: { id: string };
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDates, setEditingDates] = useState(false);
  const [tempDates, setTempDates] = useState<{ birthday?: string; anniversary?: string }>({
    birthday: "",
    anniversary: "",
  });
  const [bonusAction, setBonusAction] = useState<"add" | "subtract" | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusReason, setBonusReason] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      try {
        const { data: userResponse, error: userError } = await supabase.auth.admin.getUserById(
          params.id
        );
        if (userError) throw userError;
        if (!userResponse.user) throw new Error("Пользователь не найден");

        const user = userResponse.user; // Извлекаем объект user из ответа
        const phone = user.user_metadata?.phone || user.phone;
        if (!phone) throw new Error("Телефон пользователя не указан");

        const { data: dates } = await supabase
          .from("important_dates")
          .select("birthday, anniversary")
          .eq("user_id", user.id)
          .single();

        const { data: orders } = await supabase
          .from("orders")
          .select(
            `
            id,
            created_at,
            total,
            bonuses_used,
            payment_method,
            status,
            order_items(
              quantity,
              price,
              product_id,
              products(title, cover_url)
            )
          `
          )
          .eq("phone", phone)
          .order("created_at", { ascending: false });

        const { data: bonuses } = await supabase
          .from("bonuses")
          .select("bonus_balance, level")
          .eq("phone", phone)
          .single();

        const { data: bonusHistory } = await supabase
          .from("bonus_history")
          .select("amount, reason, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const customerData: Customer = {
          id: user.id,
          phone: phone || "—",
          email: user.email || "—",
          created_at: user.created_at,
          important_dates: dates || { birthday: null, anniversary: null },
          orders: orders || [],
          bonuses: bonuses || { bonus_balance: null, level: null },
          bonus_history: bonusHistory || [],
        };

        setCustomer(customerData);
        setTempDates({
          birthday: customerData.important_dates.birthday || "",
          anniversary: customerData.important_dates.anniversary || "",
        });
      } catch (error: any) {
        toast.error("Ошибка загрузки данных: " + error.message);
        router.push("/admin/customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [params.id, router]);

  // Сохранение важных дат
  const handleSaveDates = async () => {
    if (!customer) return;
    try {
      const { error } = await supabase
        .from("important_dates")
        .upsert(
          {
            user_id: customer.id,
            birthday: tempDates.birthday || null,
            anniversary: tempDates.anniversary || null,
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;

      setCustomer((prev) =>
        prev
          ? { ...prev, important_dates: { ...tempDates } }
          : prev
      );
      setEditingDates(false);
      toast.success("Даты успешно обновлены");
    } catch (error: any) {
      toast.error("Ошибка сохранения дат: " + error.message);
    }
  };

  // Экспорт данных клиента в CSV
  const exportToCSV = () => {
    if (!customer) return;

    const headers = [
      "Телефон",
      "Email",
      "Дата регистрации",
      "День рождения",
      "Юбилей",
      "Кол-во заказов",
      "Сумма покупок",
      "Баланс бонусов",
      "Уровень бонусов",
    ];

    const customerRow = [
      customer.phone,
      customer.email,
      format(new Date(customer.created_at), "dd.MM.yyyy", { locale: ru }),
      customer.important_dates.birthday
        ? format(new Date(customer.important_dates.birthday), "dd.MM.yyyy", { locale: ru })
        : "—",
      customer.important_dates.anniversary
        ? format(new Date(customer.important_dates.anniversary), "dd.MM.yyyy", { locale: ru })
        : "—",
      customer.orders.length,
      customer.orders.reduce((sum, order) => sum + (order.total || 0), 0),
      customer.bonuses.bonus_balance ?? 0,
      customer.bonuses.level ?? "—",
    ];

    const ordersHeader = ["Заказ ID", "Дата заказа", "Сумма", "Статус", "Способ оплаты"];
    const ordersRows = customer.orders.map((order) => [
      order.id,
      format(new Date(order.created_at), "dd.MM.yyyy", { locale: ru }),
      order.total,
      order.status,
      order.payment_method || "—",
    ]);

    const bonusHistoryHeader = ["Дата", "Причина", "Сумма"];
    const bonusHistoryRows = customer.bonus_history.map((entry) => [
      format(new Date(entry.created_at), "dd.MM.yyyy", { locale: ru }),
      entry.reason,
      entry.amount,
    ]);

    const csv = [
      headers.join(","),
      customerRow.join(","),
      "",
      "История заказов",
      ordersHeader.join(","),
      ...ordersRows.map((row) => row.join(",")),
      "",
      "История бонусов",
      bonusHistoryHeader.join(","),
      ...bonusHistoryRows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer_${customer.phone}.csv`;
    a.click();
  };

  // Управление бонусами
  const handleBonusAction = async () => {
    if (!customer || !bonusAmount || !bonusReason) {
      toast.error("Укажите сумму и причину");
      return;
    }

    const amount = parseInt(bonusAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Сумма должна быть положительным числом");
      return;
    }

    const finalAmount = bonusAction === "add" ? amount : -amount;
    const currentBalance = customer.bonuses.bonus_balance ?? 0;
    const newBalance = currentBalance + finalAmount;

    if (newBalance < 0) {
      toast.error("Баланс не может быть отрицательным");
      return;
    }

    try {
      // Обновляем баланс бонусов
      const { error: bonusError } = await supabase
        .from("bonuses")
        .update({ bonus_balance: newBalance })
        .eq("phone", customer.phone);
      if (bonusError) throw bonusError;

      // Добавляем запись в историю бонусов
      const { error: historyError } = await supabase
        .from("bonus_history")
        .insert({
          user_id: customer.id,
          amount: finalAmount,
          reason: bonusReason,
          created_at: new Date().toISOString(),
        });
      if (historyError) throw historyError;

      // Обновляем состояние
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              bonuses: { ...prev.bonuses, bonus_balance: newBalance },
              bonus_history: [
                {
                  amount: finalAmount,
                  reason: bonusReason,
                  created_at: new Date().toISOString(),
                },
                ...prev.bonus_history,
              ],
            }
          : prev
      );

      setBonusAction(null);
      setBonusAmount("");
      setBonusReason("");
      toast.success(
        bonusAction === "add"
          ? "Бонусы успешно начислены"
          : "Бонусы успешно списаны"
      );
    } catch (error: any) {
      toast.error("Ошибка управления бонусами: " + error.message);
    }
  };

  // Отправка уведомления (заглушка)
  const handleSendNotification = () => {
    // Здесь нужно интегрировать API для отправки SMS или email (например, Twilio, SendGrid)
    toast("Функция отправки уведомлений в разработке", { icon: "ℹ️" });
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Клиент не найден</p>
        <Link href="/admin/customers" className="text-blue-500 hover:underline">
          Назад к списку клиентов
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <Toaster position="top-center" />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Клиент: {customer.phone}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="text-sm text-gray-500 hover:underline"
          >
            Экспортировать в CSV
          </button>
          <Link
            href="/admin/customers"
            className="text-sm text-gray-500 hover:underline"
          >
            Назад к списку клиентов
          </Link>
        </div>
      </div>

      {/* Персональная информация */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Персональная информация</h2>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Телефон:</span> {customer.phone}
          </p>
          <p>
            <span className="font-medium">Email:</span> {customer.email}
          </p>
          <p>
            <span className="font-medium">Дата регистрации:</span>{" "}
            {format(new Date(customer.created_at), "dd.MM.yyyy", { locale: ru })}
          </p>
        </div>
      </section>

      {/* Важные даты */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Важные даты</h2>
          {!editingDates ? (
            <button
              onClick={() => setEditingDates(true)}
              className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
            >
              <Image src="/icons/edit.svg" alt="Edit" width={16} height={16} /> Редактировать
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveDates}
                className="text-sm text-green-500 hover:text-green-700 flex items-center gap-1"
              >
                <Image src="/icons/save.svg" alt="Save" width={16} height={16} /> Сохранить
              </button>
              <button
                onClick={() => {
                  setEditingDates(false);
                  setTempDates({
                    birthday: customer.important_dates.birthday || "",
                    anniversary: customer.important_dates.anniversary || "",
                  });
                }}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Image src="/icons/times.svg" alt="Cancel" width={16} height={16} /> Отменить
              </button>
            </div>
          )}
        </div>
        {!editingDates ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">День рождения:</span>{" "}
              {customer.important_dates.birthday
                ? format(new Date(customer.important_dates.birthday), "dd.MM.yyyy", {
                    locale: ru,
                  })
                : "—"}
            </p>
            <p>
              <span className="font-medium">Юбилей:</span>{" "}
              {customer.important_dates.anniversary
                ? format(new Date(customer.important_dates.anniversary), "dd.MM.yyyy", {
                    locale: ru,
                  })
                : "—"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium mb-1">День рождения:</label>
              <input
                type="date"
                value={tempDates.birthday}
                onChange={(e) =>
                  setTempDates((prev) => ({ ...prev, birthday: e.target.value }))
                }
                className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Юбилей:</label>
              <input
                type="date"
                value={tempDates.anniversary}
                onChange={(e) =>
                  setTempDates((prev) => ({ ...prev, anniversary: e.target.value }))
                }
                className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
          </div>
        )}
      </section>

      {/* Бонусы */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Бонусы</h2>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Баланс бонусов:</span>{" "}
            {customer.bonuses.bonus_balance ?? 0} ₽
          </p>
          <p>
            <span className="font-medium">Уровень:</span> {customer.bonuses.level ?? "—"}
          </p>
        </div>

        {/* Управление бонусами */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Управление бонусами</h3>
          {!bonusAction ? (
            <div className="flex gap-3">
              <button
                onClick={() => setBonusAction("add")}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Начислить бонусы
              </button>
              <button
                onClick={() => setBonusAction("subtract")}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Списать бонусы
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Сумма:</label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="Введите сумму"
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Причина:</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="Укажите причину"
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBonusAction}
                  className={`${
                    bonusAction === "add" ? "bg-green-500" : "bg-red-500"
                  } text-white px-4 py-2 rounded-lg hover:${
                    bonusAction === "add" ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {bonusAction === "add" ? "Начислить" : "Списать"}
                </button>
                <button
                  onClick={() => {
                    setBonusAction(null);
                    setBonusAmount("");
                    setBonusReason("");
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Отменить
                </button>
              </div>
            </div>
          )}
        </div>

        {customer.bonus_history.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mt-6 mb-4">История бонусов</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Дата</th>
                    <th className="p-3 text-left">Причина</th>
                    <th className="p-3 text-left">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.bonus_history.map((entry, idx) => (
                    <tr
                      key={idx}
                      className="border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">
                        {format(new Date(entry.created_at), "dd.MM.yyyy", {
                          locale: ru,
                        })}
                      </td>
                      <td className="p-3">{entry.reason}</td>
                      <td
                        className={`p-3 font-medium ${
                          entry.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {entry.amount > 0 ? `+${entry.amount}` : entry.amount} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Уведомления */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Уведомления</h2>
        <button
          onClick={handleSendNotification}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Отправить уведомление
        </button>
        <p className="text-sm text-gray-500 mt-2">
          (SMS или email — настройка сервиса рассылок требуется)
        </p>
      </section>

      {/* Заказы */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">История заказов</h2>
        {customer.orders.length > 0 ? (
          <div className="space-y-6">
            {customer.orders.map((order) => (
              <div
                key={order.id}
                className="border-b pb-4 last:border-b-0"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium">
                    Заказ #{order.id} от{" "}
                    {format(new Date(order.created_at), "dd.MM.yyyy", { locale: ru })}
                  </p>
                  <p
                    className={`text-sm ${
                      order.status === "completed"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {order.status === "completed" ? "Завершён" : order.status}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  {order.order_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <p>
                        {item.products?.title || "Товар"} (x{item.quantity})
                      </p>
                      <p>{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</p>
                    </div>
                  ))}
                  <p className="text-right font-medium">
                    Итого: {order.total.toLocaleString("ru-RU")} ₽
                  </p>
                  {order.bonuses_used > 0 && (
                    <p className="text-right text-gray-500">
                      Использовано бонусов: {order.bonuses_used} ₽
                    </p>
                  )}
                  <p className="text-gray-500">
                    Способ оплаты: {order.payment_method || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Заказы отсутствуют</p>
        )}
      </section>
    </div>
  );
}