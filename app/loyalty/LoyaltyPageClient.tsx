// Путь: app/loyalty/page.tsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { supabasePublic as supabase } from "@/lib/supabase/public";
import { format } from "date-fns";
import ru from "date-fns/locale/ru";

/* --- SEO‑метаданные страницы лояльности --- */
export const metadata = {
  title: "Программа лояльности • до 15 % бонусами",
  description:
    "Получайте кешбэк до 15 % за каждый заказ на KeyToHeart и оплачивайте им до 15 % следующих покупок.",
  openGraph: {
    images: "/og-cover.jpg",
  },
};
/* ------------------------------------------ */

export default function LoyaltyPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({ birthday: "", anniversary: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [bonusBalance, setBonusBalance] = useState<number | null>(null);
  const [bonusHistory, setBonusHistory] = useState<
    { amount: number; reason: string; created_at: string }[]
  >([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Баланс бонусов
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("bonus_balance")
        .eq("id", user.id)
        .single();
      if (profile?.bonus_balance != null) {
        setBonusBalance(profile.bonus_balance);
      }

      // История бонусов
      const { data: history } = await supabase
        .from("bonus_history")
        .select("amount, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (history) setBonusHistory(history);
    };

    fetchUserData();
  }, []);

  const handleSubmitDates = async () => {
    if (!userId) return;
    setLoading(true);

    await supabase.from("important_dates").insert([
      {
        user_id: userId,
        birthday: formData.birthday,
        anniversary: formData.anniversary,
      },
    ]);

    setSubmitted(true);
    setLoading(false);

    setTimeout(() => {
      setFormOpen(false);
      setFormData({ birthday: "", anniversary: "" });
      setSubmitted(false);
    }, 1500);
  };

  const faqs = [
    {
      question: "Что такое кешбэк?",
      answer: "Кешбэк – это возврат бонусных баллов на личный счёт. 1 балл = 1 ₽.",
    },
    {
      question: "Как стать участником программы?",
      answer: "Вы становитесь участником автоматически при первом заказе.",
    },
    { question: "Где использовать баллы?", answer: "В корзине при оформлении следующего заказа." },
    { question: "Как получить баллы на кассе?", answer: "Назовите номер телефона." },
    { question: "Срок действия бонусов?", answer: "6 месяцев с момента последней покупки." },
  ];

  const levels = [
    { name: "Бронзовый", percent: "2.5%", threshold: "Регистрация" },
    { name: "Серебряный", percent: "5%", threshold: "от 10 000 ₽" },
    { name: "Золотой", percent: "7.5%", threshold: "от 20 000 ₽" },
    { name: "Платиновый", percent: "10%", threshold: "от 30 000 ₽" },
    { name: "Премиум", percent: "15%", threshold: "от 50 000 ₽" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Баланс */}
      {bonusBalance != null && (
        <div className="text-right text-sm text-gray-600 mb-4">
          Ваш бонусный баланс:{" "}
          <span className="font-semibold">{bonusBalance} ₽</span>
        </div>
      )}

      {/* История бонусов */}
      {bonusHistory.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">История начислений</h2>
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Дата</th>
                  <th className="p-2">Причина</th>
                  <th className="p-2">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {bonusHistory.map((entry, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      {format(new Date(entry.created_at), "dd.MM.yyyy", { locale: ru })}
                    </td>
                    <td className="p-2">{entry.reason}</td>
                    <td className="p-2 text-green-600 font-medium">
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Баннер */}
      <div className="relative rounded-xl overflow-hidden mb-10 h-60 bg-black text-white flex items-center justify-center text-center">
        <Image
          src="/banner-loyalty.jpg"
          alt="Баннер программы лояльности"
          fill
          className="object-cover opacity-50"
        />
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            Вернём до 15% бонусами!
          </h1>
          <p className="text-sm md:text-base">
            И дарим 300 бонусов за карту клиента и важные даты 🎁
          </p>
        </div>
      </div>

      {/* Как работает кешбэк */}
      <section className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-6">Как работает кешбэк</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-100 p-6 rounded-xl shadow">
            <p>Совершите покупку на сайте на любую сумму</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-xl shadow">
            <p>С каждой покупки мы начислим кешбэк от 2.5% до 15%</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-xl shadow">
            <p>Полученными бонусами можно оплатить до 15% от суммы заказа</p>
          </div>
        </div>
      </section>

      {/* Дополнительные бонусы */}
      <section className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-6">Дополнительные бонусы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-xl p-6 shadow hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-2">Карта клиента</h3>
            <p className="text-sm mb-4">
              Установите карту и получите 300 бонусов. Доступно в Apple Wallet и Android.
            </p>
            <button className="border px-4 py-2 rounded-full text-sm hover:bg-black hover:text-white transition">
              Установить
            </button>
          </div>
          <div className="border rounded-xl p-6 shadow hover:shadow-md transition">
            <h3 className="font-semibold text-lg mb-2">Важные даты</h3>
            <p className="text-sm mb-4">
              Укажите день рождения и юбилей — мы напомним и подарим скидку
            </p>
            <button
              onClick={() => setFormOpen(true)}
              className="border px-4 py-2 rounded-full text-sm hover:bg-black hover:text-white transition"
            >
              Заполнить
            </button>
          </div>
        </div>

        {/* Модалка для важных дат */}
        {formOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4">Укажите важные даты</h3>
              <label htmlFor="birthday" className="block mb-2 text-sm">
                День рождения:
              </label>
              <input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, birthday: e.target.value }))
                }
                className="w-full mb-4 border px-3 py-2 rounded"
              />
              <label htmlFor="anniversary" className="block mb-2 text-sm">
                Юбилей:
              </label>
              <input
                id="anniversary"
                type="date"
                value={formData.anniversary}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, anniversary: e.target.value }))
                }
                className="w-full mb-4 border px-3 py-2 rounded"
              />

              {submitted ? (
                <p className="text-green-600 text-sm mb-4">
                  Спасибо! Мы сохранили даты.
                </p>
              ) : (
                <button
                  onClick={handleSubmitDates}
                  disabled={loading}
                  className="bg-black text-white w-full py-2 rounded hover:opacity-90 transition"
                >
                  {loading ? "Сохраняем..." : "Сохранить"}
                </button>
              )}

              <button
                onClick={() => setFormOpen(false)}
                className="mt-3 text-sm underline text-gray-600 hover:text-black"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Уровни кешбэка */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-center">Уровни кешбэка</h2>
        <div className="overflow-x-auto shadow rounded-xl">
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Название уровня</th>
                <th className="p-2 text-left">Процент</th>
                <th className="p-2 text-left">Сумма заказов</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((lvl, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2">{lvl.name}</td>
                  <td className="p-2">{lvl.percent}</td>
                  <td className="p-2">{lvl.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-center">Популярные вопросы</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border-b pb-2 cursor-pointer"
              onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">{faq.question}</h3>
                <span className="text-2xl">{faqOpen === idx ? "−" : "+"}</span>
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  faqOpen === idx ? "max-h-40 mt-2" : "max-h-0"
                }`}
              >
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
