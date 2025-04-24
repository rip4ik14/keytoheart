// ✅ Путь: /components/CorporateFooterCTA.tsx

import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";

export default function CorporateFooterCTA() {
  return (
    <section className="bg-black text-white py-20 px-4 md:px-8 text-center">
      <h2 className="text-2xl md:text-3xl font-semibold mb-4">
        Остались вопросы или хотите обсудить заказ?
      </h2>
      <p className="text-lg mb-6 opacity-80">
        Мы на связи в мессенджерах и по телефону — пишите, звоните или оставьте заявку.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="https://wa.me/79886033821"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 border border-white px-6 py-3 rounded hover:bg-white hover:text-black transition"
        >
          <FaWhatsapp />
          WhatsApp
        </a>
        <Link
          href="/corporate"
          className="bg-white text-black px-6 py-3 rounded hover:bg-gray-100 transition"
        >
          Оставить заявку
        </Link>
      </div>

      <p className="text-sm mt-6 opacity-60">ИП Рыбалко Д.А. • +7 988 603 38 21</p>
    </section>
  );
}
