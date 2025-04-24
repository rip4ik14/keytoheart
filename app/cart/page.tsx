"use client";

import CategoryBreadcrumbs from "@components/CategoryBreadcrumbs";
import { useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@context/CartContext";
import OrderStep from "@components/OrderStep";
import UpsellButtons from "./components/UpsellButtons";
import UpsellModal from "./components/UpsellModal";
import CartItem from "./components/CartItem";
import toast from "react-hot-toast";

function ThankYouModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="bg-white rounded-2xl p-8 max-w-sm w-full relative shadow-lg" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-black text-2xl">&times;</button>
          <h2 className="text-xl font-bold text-center mb-4">Спасибо за заказ!</h2>
          <p className="text-sm text-center text-gray-600 mb-6">Мы свяжемся с вами для подтверждения в ближайшее время.</p>
          <button onClick={onClose} className="block w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition text-sm">Закрыть</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CartPage() {
  const { items, setItems } = useCart();
  const [step, setStep] = useState<"auth" | "code" | "form">("auth");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [bonusBalance, setBonusBalance] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPostcard, setShowPostcard] = useState(false);
  const [showBalloons, setShowBalloons] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [upsellItems, setUpsellItems] = useState<any[]>([]);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);

  const [form, setForm] = useState({
    phone: "",
    whatsapp: false,
    name: "",
    recipient: "",
    address: "",
    date: "",
    time: "",
    payment: "",
  });

  const [bonusesUsed, setBonusesUsed] = useState(0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const bonus = Math.floor(total * 0.025);
  const maxBonusUse = Math.floor(total * 0.15);

  useEffect(() => {
    const savedPhone = localStorage.getItem("userPhone");
    const savedBonus = localStorage.getItem("bonusData");
    if (savedPhone && savedBonus) {
      setPhone(savedPhone);
      setForm((prev) => ({ ...prev, phone: savedPhone }));
      setBonusBalance(JSON.parse(savedBonus)?.bonus_balance || 0);
      setStep("form");
      setIsLoggedIn(true);
    }

    const savedDraft = localStorage.getItem("repeatDraft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setForm((prev) => ({ ...prev, ...parsed }));
        setItems(parsed.items || []);
        setCurrentStep(5);
        localStorage.removeItem("repeatDraft");
      } catch (e) {
        console.error("Ошибка чтения черновика:", e);
      }
    }

    fetch("/api/upsell")
      .then(res => res.json())
      .then((res) => {
        if (res.success) setUpsellItems(res.data);
      });
  }, []);

  const handleAuthSubmit = async (e: any) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    toast.success("Код отправлен (введите 0000)");
    setStep("code");
  };

  const handleCodeSubmit = async (e: any) => {
    e.preventDefault();
    if (code !== "0000") {
      toast.error("Неверный код");
      return;
    }

    try {
      const bonusesRes = await fetch(`/api/account/bonuses?phone=${phone}`);
      const bonuses = await bonusesRes.json();
      localStorage.setItem("userPhone", phone);
      localStorage.setItem("bonusData", JSON.stringify(bonuses.data || {}));
      setBonusBalance(bonuses.data?.bonus_balance || 0);
      setForm((prev) => ({ ...prev, phone }));
      setIsLoggedIn(true);
      setStep("form");
      toast.success("Вы авторизованы");
    } catch {
      toast.error("Ошибка получения данных");
    }
  };

  const handleChange = (e: any) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleStepNext = () => {
    if (currentStep === 1 && !/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) return alert("Введите корректный номер телефона");
    if (currentStep === 2 && (!form.name.trim() || !form.recipient.trim())) return alert("Заполните имя и имя получателя");
    if (currentStep === 3 && !form.address.trim()) return alert("Введите адрес доставки");
    if (currentStep === 4 && (!form.date || !form.time)) return alert("Укажите дату и время доставки");
    setCurrentStep((s) => Math.min(s + 1, 5));
  };

  const handleStepBack = () => currentStep > 1 && setCurrentStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!form.payment) return alert("Выберите способ оплаты");

    const selectedUpsellData = upsellItems.filter((item) => selectedUpsells.includes(item.id));

    const payload = {
      ...form,
      items: [
        ...items,
        ...selectedUpsellData.map((u) => ({
          id: u.id,
          title: u.title,
          price: u.price,
          quantity: 1,
          imageUrl: u.image_url || "/no-image.jpg",
        })),
      ],
      total: total + selectedUpsellData.reduce((sum, u) => sum + u.price, 0),
      bonuses_used: bonusesUsed,
      bonus,
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (result.success) {
      setShowSuccess(true);
      setForm({ phone: "", whatsapp: false, name: "", recipient: "", address: "", date: "", time: "", payment: "" });
      setBonusesUsed(0);
      setSelectedUpsells([]);
      setCurrentStep(1);
      setItems([]);
      localStorage.removeItem("userPhone");
      localStorage.removeItem("bonusData");
    } else {
      alert("Ошибка при оформлении заказа: " + result.error);
    }
  };

  if (step === "auth") {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <h1 className="text-2xl font-bold text-center mb-4">Введите номер телефона</h1>
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div className="flex gap-2">
            <span className="pt-2">+7</span>
            <IMaskInput mask="(000) 000-00-00" value={phone} onAccept={(val: any) => setPhone(val)} className="border p-2 rounded w-full" placeholder="(___) ___-__-__" />
          </div>
          <button type="submit" className="w-full bg-black text-white py-2 rounded">Получить код</button>
        </form>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <h1 className="text-2xl font-bold text-center mb-4">Введите код</h1>
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          <input value={code} onChange={(e) => setCode(e.target.value)} className="border p-2 rounded w-full" placeholder="0000" />
          <button type="submit" className="w-full bg-black text-white py-2 rounded">Войти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <CategoryBreadcrumbs />
      <motion.h1 className="text-center text-4xl font-bold mb-10 tracking-wide" initial={{ opacity: 0, y: -25 }} animate={{ opacity: 1, y: 0 }}>
        Оформление заказа
      </motion.h1>
      <div className="grid md:grid-cols-3 gap-10 mt-6">
        <div className="md:col-span-2 space-y-6">
          <OrderStep step={1} currentStep={currentStep} title="Ваши контакты" onNext={handleStepNext}>
            <div className="flex gap-2 mb-2">
              <span className="pt-2">+7</span>
              <input name="phone" value={form.phone} onChange={handleChange} type="tel" placeholder="(___) ___-__-__" className="border p-2 rounded w-full" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="whatsapp" checked={form.whatsapp} onChange={handleChange} />
              Не звонить, а написать в WhatsApp
            </label>
          </OrderStep>

          <OrderStep step={2} currentStep={currentStep} title="Данные получателя" onNext={handleStepNext} onBack={handleStepBack}>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Ваше имя" className="w-full border p-2 rounded mb-2" />
            <input name="recipient" value={form.recipient} onChange={handleChange} placeholder="Имя получателя" className="w-full border p-2 rounded" />
          </OrderStep>

          <OrderStep step={3} currentStep={currentStep} title="Адрес доставки" onNext={handleStepNext} onBack={handleStepBack}>
            <textarea name="address" value={form.address} onChange={handleChange} placeholder="Город, улица, дом, подъезд, этаж" className="w-full border p-2 rounded" />
          </OrderStep>

          <OrderStep step={4} currentStep={currentStep} title="Дата и время" onNext={handleStepNext} onBack={handleStepBack}>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border p-2 rounded mb-2" />
            <input type="time" name="time" value={form.time} onChange={handleChange} className="w-full border p-2 rounded" />
          </OrderStep>

          <OrderStep step={5} currentStep={currentStep} title="Способ оплаты и бонусы" onNext={handleSubmit} onBack={handleStepBack}>
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input type="radio" name="payment" value="card" checked={form.payment === "card"} onChange={handleChange} />
                Картой онлайн
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="payment" value="cash" checked={form.payment === "cash"} onChange={handleChange} />
                Наличными при получении
              </label>
            </div>

            <div className="border rounded p-4 mb-4">
              <p className="text-sm mb-2">Ваш баланс бонусов: <b>{bonusBalance}</b></p>
              <input type="number" min={0} max={Math.min(bonusBalance, maxBonusUse)} value={bonusesUsed} onChange={(e) => setBonusesUsed(Number(e.target.value) || 0)} className="w-full border border-gray-300 p-2 rounded" placeholder="Сколько бонусов списать?" />
              <p className="text-xs text-gray-400 mt-1">Можно списать до {Math.min(bonusBalance, maxBonusUse)} бонусов (макс 15% от суммы)</p>
            </div>

            {upsellItems.length > 0 && (
              <div className="border rounded p-4">
                <p className="text-sm font-medium mb-2">Добавить к заказу:</p>
                {upsellItems.map((item) => (
                  <label key={item.id} className="flex items-center justify-between mb-2 text-sm">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedUpsells.includes(item.id)} onChange={() =>
                        setSelectedUpsells((prev) =>
                          prev.includes(item.id)
                            ? prev.filter((id) => id !== item.id)
                            : [...prev, item.id]
                        )
                      } />
                      <span>{item.title}</span>
                    </div>
                    <span className="text-gray-600">{item.price} ₽</span>
                  </label>
                ))}
              </div>
            )}
          </OrderStep>
        </div>

        <motion.div className="bg-white rounded-2xl shadow-lg p-6 h-fit self-start" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <UpsellButtons onPostcard={() => setShowPostcard(true)} onBalloons={() => setShowBalloons(true)} />
          <h2 className="text-lg font-bold mb-4 mt-6">Ваш заказ</h2>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">Корзина пуста</p>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => <CartItem key={item.id} item={item} />)}
              </div>
              <div className="border-t pt-4 mt-4 text-sm text-gray-600">
                <p>Товары: {total} ₽</p>
                <p className="text-xs text-gray-400">+ {bonus} бонусов</p>
                <p className="font-bold text-black mt-2">Итого: {total} ₽</p>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {showPostcard && <UpsellModal type="postcard" onClose={() => setShowPostcard(false)} />}
      {showBalloons && <UpsellModal type="balloon" onClose={() => setShowBalloons(false)} />}
      {showSuccess && <ThankYouModal onClose={() => setShowSuccess(false)} />}
    </div>
  );
}
