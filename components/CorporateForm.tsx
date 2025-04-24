"use client";

import { useState } from "react";

export default function CorporateForm() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Пока просто фейковая отправка — можно связать с Supabase или Telegram
    console.log("Заявка отправлена:", formData);
    setSubmitted(true);
  };

  return (
    <section className="py-16 px-4 md:px-8 bg-white text-black max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">Оставьте заявку</h2>
      {submitted ? (
        <div className="text-center text-green-600 text-lg">
          Спасибо! Мы скоро свяжемся с вами.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Ваше имя"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <input
              type="text"
              name="company"
              placeholder="Компания"
              value={formData.company}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Телефон"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <textarea
              name="message"
              placeholder="Комментарий или пожелания"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-black"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded hover:opacity-90 transition"
          >
            Отправить заявку
          </button>
        </form>
      )}
    </section>
  );
}
