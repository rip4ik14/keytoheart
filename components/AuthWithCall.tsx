"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";

const WHATSAPP_LINK = "https://wa.me/79886033821"; // укажи нужный номер!

type Props = {
  onSuccess: (phone: string) => void; // callback после успешной авторизации
};

export default function AuthWithCall({ onSuccess }: Props) {
  const [step, setStep] = useState<"phone" | "code" | "sms" | "success" | "ban">("phone");
  const [phone, setPhone] = useState("");
  const [checkId, setCheckId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [banTimer, setBanTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Маска телефона
  const formatPhone = (value: string) => {
    let cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("8")) cleaned = "7" + cleaned.slice(1);
    if (!cleaned.startsWith("7")) cleaned = "7" + cleaned;
    return (
      "+7 " +
      (cleaned.slice(1, 4) || "") +
      (cleaned.length > 1 ? " " : "") +
      (cleaned.slice(4, 7) || "") +
      (cleaned.length > 4 ? "-" : "") +
      (cleaned.slice(7, 9) || "") +
      (cleaned.length > 7 ? "-" : "") +
      (cleaned.slice(9, 11) || "")
    ).replace(/ $/, "");
  };

  // Ограничить ввод только цифрами
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    if (v.length <= 11) setPhone(formatPhone(v));
  };

  // Отправить запрос на звонок
  const handleSendCall = async () => {
    setError("");
    setIsLoading(true);
    const clearPhone = "+7" + phone.replace(/\D/g, "").slice(1, 11);
    try {
      const res = await fetch("/api/auth/send-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clearPhone }),
      });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 429) {
          setStep("ban");
          startBanTimer();
        } else {
          setError(data.error || "Не удалось отправить звонок.");
        }
      } else {
        setCheckId(data.check_id);
        setStep("code");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    }
    setIsLoading(false);
  };

  // Проверить код из звонка
  const handleVerifyCall = async () => {
    setError("");
    setIsLoading(true);
    const clearPhone = "+7" + phone.replace(/\D/g, "").slice(1, 11);
    try {
      const res = await fetch("/api/auth/verify-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: clearPhone,
          check_id: checkId,
          code: code,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("success");
        onSuccess(clearPhone);
      } else {
        setAttempts((a) => a + 1);
        if (res.status === 429) {
          setStep("ban");
          startBanTimer();
        } else {
          setError(data.error || "Неверный код.");
        }
      }
    } catch {
      setError("Ошибка сети.");
    }
    setIsLoading(false);
  };

  // Fallback: отправить СМС
  const handleSendSms = async () => {
    setError("");
    setIsLoading(true);
    const clearPhone = "+7" + phone.replace(/\D/g, "").slice(1, 11);
    try {
      const res = await fetch("/api/auth/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clearPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("sms");
      } else {
        if (res.status === 429) {
          setStep("ban");
          startBanTimer();
        } else {
          setError(data.error || "Не удалось отправить смс.");
        }
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    }
    setIsLoading(false);
  };

  // Проверить код из смс
  const handleVerifySms = async () => {
    setError("");
    setIsLoading(true);
    const clearPhone = "+7" + phone.replace(/\D/g, "").slice(1, 11);
    try {
      const res = await fetch("/api/auth/verify-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clearPhone, code }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("success");
        onSuccess(clearPhone);
      } else {
        setAttempts((a) => a + 1);
        if (res.status === 429) {
          setStep("ban");
          startBanTimer();
        } else {
          setError(data.error || "Неверный код.");
        }
      }
    } catch {
      setError("Ошибка сети.");
    }
    setIsLoading(false);
  };

  // Таймер для блокировки на 10 минут
  const startBanTimer = () => {
    setBanTimer(600); // 10 минут
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setBanTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setStep("phone");
          setAttempts(0);
          setError("");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // UI
  return (
    <div className="w-full max-w-xs mx-auto p-6 bg-white rounded-2xl shadow-xl flex flex-col gap-5 border border-black">
      <motion.h2
        className="text-xl font-bold text-black text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Вход по телефону
      </motion.h2>

      {step === "phone" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label className="text-black block mb-1 text-sm">Ваш номер телефона:</label>
          <input
            className="w-full border border-black rounded-lg px-4 py-2 font-mono text-base outline-none focus:ring-2"
            inputMode="tel"
            value={phone}
            placeholder="+7 (___) ___-__-__"
            onChange={handlePhoneInput}
            maxLength={16}
            disabled={isLoading}
            autoFocus
          />
          <button
            className="w-full mt-4 py-2 rounded-xl border border-black bg-black text-white font-bold transition-all hover:bg-white hover:text-black hover:shadow"
            onClick={handleSendCall}
            disabled={isLoading || phone.replace(/\D/g, "").length !== 11}
          >
            {isLoading ? "Отправка..." : "Получить код по звонку"}
          </button>
          <p className="text-xs mt-2 text-gray-500 text-center">
            Мы позвоним на номер, последние 4 цифры номера звонящего — это ваш код.
          </p>
          {error && <div className="mt-2 text-center text-red-600">{error}</div>}
        </motion.div>
      )}

      {(step === "code" || step === "sms") && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <label className="block text-black mb-1 text-sm">
            Введите 4-значный код
          </label>
          <input
            className="w-full border border-black rounded-lg px-4 py-2 font-mono text-base outline-none focus:ring-2 tracking-widest text-center"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
            disabled={isLoading}
          />
          <button
            className="w-full mt-4 py-2 rounded-xl border border-black bg-black text-white font-bold transition-all hover:bg-white hover:text-black hover:shadow"
            onClick={step === "code" ? handleVerifyCall : handleVerifySms}
            disabled={isLoading || code.length !== 4}
          >
            {isLoading ? "Проверка..." : "Войти"}
          </button>
          {step === "code" && (
            <button
              className="w-full mt-3 py-2 rounded-xl border border-black bg-white text-black font-bold transition-all hover:bg-black hover:text-white hover:shadow"
              onClick={handleSendSms}
              disabled={isLoading}
            >
              Получить код по СМС
            </button>
          )}
          {error && <div className="mt-2 text-center text-red-600">{error}</div>}
        </motion.div>
      )}

      {step === "ban" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center text-red-700 font-bold mb-2">
            Превышено число попыток
          </div>
          <div className="text-center mb-2">
            Повторная авторизация будет доступна через {Math.floor(banTimer / 60)}:{("0" + (banTimer % 60)).slice(-2)}
          </div>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block py-2 rounded-xl border border-green-500 bg-green-50 text-green-800 font-bold text-center transition-all hover:bg-green-500 hover:text-white"
          >
            Оформить заказ через WhatsApp
          </a>
        </motion.div>
      )}

      {step === "success" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center text-green-700 font-bold">Авторизация успешна!</div>
        </motion.div>
      )}
    </div>
  );
}
