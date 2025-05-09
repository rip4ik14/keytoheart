"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabasePublic as supabase } from "@/lib/supabase/public";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru"; // Исправляем импорт локали
import Image from 'next/image';
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

interface SortConfig {
  key: keyof Customer | "order_count" | "total_spent";
  direction: "asc" | "desc";
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created_at",
    direction: "desc",
  });
  const router = useRouter();

  // Загрузка данных клиентов
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        // Получаем всех пользователей из Supabase Auth
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) throw usersError;

        const customerData: Customer[] = [];

        // Для каждого пользователя загружаем связанные данные
        for (const user of users.users) {
          const phone = user.user_metadata?.phone || user.phone;
          if (!phone) continue;

          // Важные даты
          const { data: dates } = await supabase
            .from("important_dates")
            .select("birthday, anniversary")
            .eq("user_id", user.id)
            .single();

          // Заказы
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

          // Бонусы
          const { data: bonuses } = await supabase
            .from("bonuses")
            .select("bonus_balance, level")
            .eq("phone", phone)
            .single();

          // История бонусов
          const { data: bonusHistory } = await supabase
            .from("bonus_history")
            .select("amount, reason, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          customerData.push({
            id: user.id,
            phone: phone || "—",
            email: user.email || "—",
            created_at: user.created_at,
            important_dates: dates || { birthday: null, anniversary: null },
            orders: orders || [],
            bonuses: bonuses || { bonus_balance: null, level: null },
            bonus_history: bonusHistory || [],
          });
        }

        setCustomers(customerData);
      } catch (error: any) {
        toast.error("Ошибка загрузки данных: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Функция сортировки
  const handleSort = (key: keyof Customer | "order_count" | "total_spent") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Сортировка и фильтрация клиентов
  const sortedAndFilteredCustomers = customers
    .filter((customer) =>
      (customer.phone?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (customer.email?.toLowerCase().includes(search.toLowerCase()) || false)
    )
    .sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Customer];
      let bValue: any = b[sortConfig.key as keyof Customer];

      // Специальная обработка для вычисляемых полей
      if (sortConfig.key === "order_count") {
        aValue = a.orders.length;
        bValue = b.orders.length;
      } else if (sortConfig.key === "total_spent") {
        aValue = a.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        bValue = b.orders.reduce((sum, order) => sum + (order.total || 0), 0);
      }

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6">Клиенты</h1>

      {/* Поиск и фильтры */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Поиск по телефону или email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-lg w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      {/* Таблица клиентов */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Загрузка...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("phone")}
                >
                  <div className="flex items-center gap-1">
                    Телефон
                    {sortConfig.key === "phone" ? (
                      sortConfig.direction === "asc" ? (
                        <Image src="/icons/sort-up.svg" alt="Sort Up" width={16} height={16} />
                      ) : (
                        <Image src="/icons/sort-down.svg" alt="Sort Down" width={16} height={16} />
                      )
                    ) : (
                      <Image src="/icons/sort.svg" alt="Sort" width={16} height={16} />
                    )}
                  </div>
                </th>
                <th className="p-3 text-left">Email</th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center gap-1">
                    Дата регистрации
                    {sortConfig.key === "created_at" ? (
                      sortConfig.direction === "asc" ? (
                        <Image src="/icons/sort-up.svg" alt="Sort Up" width={16} height={16} />
                      ) : (
                        <Image src="/icons/sort-down.svg" alt="Sort Down" width={16} height={16} />
                      )
                    ) : (
                      <Image src="/icons/sort.svg" alt="Sort" width={16} height={16} />
                    )}
                  </div>
                </th>
                <th className="p-3 text-left">Важные даты</th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("order_count")}
                >
                  <div className="flex items-center gap-1">
                    Кол-во заказов
                    {sortConfig.key === "order_count" ? (
                      sortConfig.direction === "asc" ? (
                        <Image src="/icons/sort-up.svg" alt="Sort Up" width={16} height={16} />
                      ) : (
                        <Image src="/icons/sort-down.svg" alt="Sort Down" width={16} height={16} />
                      )
                    ) : (
                      <Image src="/icons/sort.svg" alt="Sort" width={16} height={16} />
                    )}
                  </div>
                </th>
                <th
                  className="p-3 text-left cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort("total_spent")}
                >
                  <div className="flex items-center gap-1">
                    Сумма покупок
                    {sortConfig.key === "total_spent" ? (
                      sortConfig.direction === "asc" ? (
                        <Image src="/icons/sort-up.svg" alt="Sort Up" width={16} height={16} />
                      ) : (
                        <Image src="/icons/sort-down.svg" alt="Sort Down" width={16} height={16} />
                      )
                    ) : (
                      <Image src="/icons/sort.svg" alt="Sort" width={16} height={16} />
                    )}
                  </div>
                </th>
                <th className="p-3 text-left">Бонусы</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-t hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <td className="p-3">{customer.phone}</td>
                  <td className="p-3">{customer.email}</td>
                  <td className="p-3">
                    {format(new Date(customer.created_at), "dd.MM.yyyy", {
                      locale: ru,
                    })}
                  </td>
                  <td className="p-3">
                    {customer.important_dates.birthday
                      ? `ДР: ${format(
                          new Date(customer.important_dates.birthday),
                          "dd.MM.yyyy",
                          { locale: ru }
                        )}`
                      : "—"}
                    <br />
                    {customer.important_dates.anniversary
                      ? `Юбилей: ${format(
                          new Date(customer.important_dates.anniversary),
                          "dd.MM.yyyy",
                          { locale: ru }
                        )}`
                      : "—"}
                  </td>
                  <td className="p-3">{customer.orders.length}</td>
                  <td className="p-3">
                    {customer.orders
                      .reduce((sum, order) => sum + (order.total || 0), 0)
                      .toLocaleString("ru-RU")}{" "}
                    ₽
                  </td>
                  <td className="p-3">
                    {customer.bonuses.bonus_balance ?? 0} ₽ (Уровень:{" "}
                    {customer.bonuses.level ?? "—"})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}