import Image from "next/image";

const highlights = [
  { title: "Большой ассортимент", description: "…", image: "/placeholders/highlight1.jpg" },
  { title: "Индивидуальное обслуживание", description: "…", image: "/placeholders/highlight2.jpg" },
  { title: "Выгодные цены, бесплатная доставка", description: "…", image: "/placeholders/highlight3.jpg" },
  { title: "Удобная оплата и отчётность", description: "…", image: "/placeholders/highlight4.jpg" },
];

export default function CorporateHighlights() {
  return (
    <section className="py-16 px-4 md:px-8 bg-white text-black">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10">
        Преимущества для корпоративных клиентов
      </h2>

      <div className="flex overflow-x-auto space-x-4 scrollbar-hide snap-x snap-mandatory">
        {highlights.map((item, i) => (
          <div key={i} className="relative w-72 sm:w-80 flex-shrink-0 rounded-2xl overflow-hidden snap-start shadow">
            <Image
              src={item.image}
              alt={item.title}
              width={320}
              height={384}
              className="w-full h-96 object-cover"
              placeholder="blur"
              blurDataURL="/blur-placeholder.png"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
              <div>
                <h3 className="text-white text-lg font-semibold">{item.title}</h3>
                <p className="text-white text-sm mt-1 opacity-80">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
