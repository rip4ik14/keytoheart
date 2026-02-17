// ✅ Путь: components/GiftIdeasStrip.tsx
import Link from 'next/link';
import Image from 'next/image';

export type GiftIdeaItem = {
  id: number;
  name: string;
  slug: string;
  home_icon_url?: string | null;
  home_title?: string | null;
};

function getInitials(name: string) {
  const t = (name || '').trim();
  if (!t) return '?';
  return t.slice(0, 1).toUpperCase();
}

export default function GiftIdeasStrip({
  title = 'Ищу подарок',
  items,
  seeAllHref = '/category/povod',
  parentSlug = 'povod',
}: {
  title?: string;
  items: GiftIdeaItem[];
  seeAllHref?: string;
  parentSlug?: string;
}) {
  if (!items?.length) return null;

  return (
    <section className="mt-6 sm:mt-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between gap-3">
          {/* ✅ Заголовок как у остальных секций/категорий */}
          <h2 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-black">
            {title}
          </h2>

          <Link
            href={seeAllHref}
            className="text-sm font-semibold text-black/60 hover:text-black transition"
            aria-label="Смотреть все поводы"
          >
            Все
          </Link>
        </div>

        <div
          className={[
            'mt-4',
            'overflow-x-auto',
            'pb-2',
            '[-ms-overflow-style:none]',
            '[scrollbar-width:none]',
            '[&::-webkit-scrollbar]:hidden',
          ].join(' ')}
        >
          <div className="flex gap-4 sm:gap-5 min-w-max">
            {items.map((it) => {
              const label = (it.home_title || it.name || '').trim();

              // ✅ Новый роут: /category/povod/[subslug]
              const href = `/category/${encodeURIComponent(parentSlug)}/${encodeURIComponent(it.slug)}`;

              return (
                <Link
                  key={it.id}
                  href={href}
                  className="group flex w-[86px] sm:w-[94px] flex-col items-center gap-2"
                  aria-label={label}
                >
                  <div className="relative h-[66px] w-[66px] sm:h-[72px] sm:w-[72px] rounded-full bg-white border border-black/10 shadow-[0_14px_40px_rgba(0,0,0,0.08)] overflow-hidden">
                    {it.home_icon_url ? (
                      <Image
                        src={it.home_icon_url}
                        alt={label}
                        fill
                        sizes="72px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        unoptimized={/^https?:\/\//i.test(it.home_icon_url)}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-black/70 font-bold">
                        {getInitials(label)}
                      </div>
                    )}
                  </div>

                  <div
                    className="text-center text-[12px] sm:text-[13px] font-semibold text-black leading-[1.15]"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.1em',
                    }}
                    title={label}
                  >
                    {label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
