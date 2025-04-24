// app/components/Advantages.tsx
import { FaDollarSign, FaTruck, FaShieldAlt, FaCamera } from "react-icons/fa";

export default function Advantages() {
  const advantages = [
    { icon: <FaCamera />, text: "Фото букета перед доставкой" },
    { icon: <FaTruck />, text: "Доставка от 2ч" },
    { icon: <FaShieldAlt />, text: "Гарантия на цветы 3 дня" },
    { icon: <FaDollarSign />, text: "Кешбэк с каждого заказа до 15%" },
  ];

  return (
    <section className="advantages">
      <div className="container">
        <h2 className="text-center">С нами выгодно</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {advantages.map((advantage, index) => (
            <div key={index} className="advantage-item">
              <div className="icon">{advantage.icon}</div>
              <p>{advantage.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}