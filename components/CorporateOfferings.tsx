import Image from "next/image";

const offerings = [
  { title: "Фруктово-цветочные букеты", description: "…", image: "/placeholders/offer1.jpg" },
  { title: "Подарочные боксы",          description: "…", image: "/placeholders/offer2.jpg" },
  { title: "Подарки с лого компании",    description: "…", image: "/placeholders/offer3.jpg" },
];

export default function CorporateOfferings() {
  return (
    <section className="py-20 px-4 md:px-8 bg-white text-black">
      <h2 className="text-2xl md:text-3xl font-semibold text-center mb-10">Мы предлагаем</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {offerings.map((item, i) => (
          <div key={i} className="bg-gray-100 rounded-xl overflow-hidden shadow hover:shadow-md transition">
            <Image
              src={item.image}
              alt={item.title}
              width={600}
              height={350}
              className="w-full h-56 object-cover"
              placeholder="blur"
              blurDataURL="/blur-placeholder.png"
              loading="lazy"
            />
            <div className="p-5">
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-700">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
