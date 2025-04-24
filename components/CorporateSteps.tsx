// ✅ Путь: /components/CorporateSteps.tsx

const steps = [
    {
      title: "Оставьте заявку",
      description: "Заполните форму — менеджер свяжется с вами в течение 15 минут.",
      step: "01",
    },
    {
      title: "Обсуждение деталей",
      description: "Подберём подарки под ваши цели, аудиторию и бюджет.",
      step: "02",
    },
    {
      title: "Утверждение и сборка",
      description: "Согласуем дизайн и начнём ручную сборку композиций.",
      step: "03",
    },
    {
      title: "Доставка и радость",
      description: "Подарки доставим точно в срок с гарантией качества.",
      step: "04",
    },
  ];
  
  export default function CorporateSteps() {
    return (
      <section className="py-20 px-4 md:px-8 bg-white text-black">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10">
          Как мы работаем
        </h2>
        <div className="max-w-5xl mx-auto grid gap-10 md:grid-cols-2">
          {steps.map((item, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="text-3xl font-bold text-black/10">{item.step}</div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-700">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  