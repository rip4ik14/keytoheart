import Image from 'next/image';
import Link from 'next/link';

interface Block {
  id: number;
  title: string;
  subtitle?: string;
  href: string;
  image_url: string;
  type: 'card' | 'banner';
  button_text?: string;
}

export default function PromoGridWrapper({ banners, cards }: { banners: Block[]; cards: Block[] }) {
  if (!banners.length && !cards.length) return null;

  return (
    <section
      className="mx-auto mt-8 sm:mt-10 max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="promo-grid-title"
    >
      <h2 id="promo-grid-title" className="sr-only">
        Промо-блоки
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {banners.map((b, i) => (
            <Link
              key={b.id}
              href={b.href || '#'}
              className="relative block overflow-hidden rounded-2xl lg:rounded-3xl"
              title={b.title}
              style={{ aspectRatio: '3 / 2' }}
            >
              <Image
                src={b.image_url}
                alt={b.title}
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20 rounded-2xl lg:rounded-3xl" />
              <div className="absolute inset-0 flex flex-col justify-center items-start px-4 py-4 sm:px-12 lg:px-16 sm:py-8 lg:py-12 text-white">
                <div className="max-w-full w-full">
                  <h2 className="mb-2 text-lg xs:text-xl sm:text-3xl lg:text-4xl font-bold text-white max-w-[95vw] sm:max-w-[80vw] leading-tight">
                    {b.title}
                  </h2>
                  {b.subtitle && (
                    <p className="mb-3 text-sm xs:text-base sm:text-lg text-white/90 max-w-[95vw] sm:max-w-[80vw]">
                      {b.subtitle}
                    </p>
                  )}
                  {b.button_text && (
                    <span className="inline-flex items-center border border-[#bdbdbd] rounded-lg px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 font-bold text-xs sm:text-sm lg:text-base uppercase tracking-tight bg-white text-[#535353]">
                      {b.button_text}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-4">
          {cards.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="relative w-full h-full overflow-hidden rounded-2xl lg:rounded-3xl aspect-[3/2]"
              title={c.title}
              role="button"
            >
              <Image
                src={c.image_url}
                alt={c.title}
                fill
                sizes="33vw"
                className="object-cover rounded-2xl lg:rounded-3xl"
              />
              <div className="absolute inset-0 bg-black/10 rounded-2xl lg:rounded-3xl" />
              <span className="absolute bottom-3 left-3 z-10 max-w-[90%] truncate rounded-full bg-white/80 px-2.5 py-1 text-xs lg:text-sm font-semibold text-black shadow-sm line-clamp-1">
                {c.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
