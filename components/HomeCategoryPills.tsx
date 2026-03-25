import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { HomePillItem } from '@/lib/data/home';
import { shouldSkipOptimization } from '@/components/imagePerf';

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

type PillProps = {
  href: string;
  label: string;
  image?: string | null;
  fallbackLetter?: string;
  isCatalog?: boolean;
};

const balancedTextStyle: CSSProperties = {
  textWrap: 'balance',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
};

function getLabelClassName(label: string) {
  const normalized = label.trim();

  if (normalized.length >= 24) {
    return 'text-[12.5px] leading-[1.08] tracking-[-0.02em]';
  }

  if (normalized.length >= 18) {
    return 'text-[13.5px] leading-[1.08] tracking-[-0.015em]';
  }

  return 'text-[15px] leading-[1.08] tracking-[-0.01em]';
}

function CategoryPill({
  href,
  label,
  image,
  fallbackLetter,
  isCatalog = false,
}: PillProps) {
  return (
    <Link
      href={href}
      title={label}
      className={[
        'group relative flex min-w-0 items-center',
        'min-h-[58px] w-full rounded-full',
        'bg-[#efefef]',
        'px-[10px] py-[7px]',
        'transition-transform duration-150 ease-out',
        'active:scale-[0.985]',
      ].join(' ')}
    >
      <span
        className={[
          'relative shrink-0',
          'mr-[10px]',
          'h-[38px] w-[38px]',
          'overflow-hidden rounded-full',
          'bg-[#f8f8f8]',
          'grid place-items-center',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1px_2px_rgba(0,0,0,0.04)]',
          'text-black/70',
        ].join(' ')}
      >
        {isCatalog ? (
          <GridIcon />
        ) : image ? (
          <Image
            src={image}
            alt={label}
            fill
            sizes="38px"
            className="object-cover"
            unoptimized={shouldSkipOptimization(image)}
          />
        ) : (
          <span className="text-[14px] font-semibold text-black/35">{fallbackLetter}</span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 items-center">
        <span
          className={[
            'block w-full min-w-0 whitespace-normal break-words',
            'font-semibold text-black/85',
            getLabelClassName(label),
          ].join(' ')}
          style={balancedTextStyle}
        >
          {label}
        </span>
      </span>
    </Link>
  );
}

export default function HomeCategoryPills({
  categories,
}: {
  categories: HomePillItem[];
}) {
  const items = (categories ?? []).filter((c) => !!c?.slug).slice(0, 7);

  return (
    <section
      id="home-categories-sheet"
      aria-label="Категории (мобильная)"
      className="relative z-[12] w-full -mt-[18px] lg:hidden"
      style={{
        scrollMarginTop: 'calc(var(--kth-sticky-header-h, 64px) + 10px)',
      }}
    >
      <div
        className={[
          'rounded-t-[30px]',
          'bg-white',
          'px-[10px]',
          'pt-[14px]',
          'pb-[28px]',
          'shadow-[0_-10px_24px_rgba(0,0,0,0.05)]',
        ].join(' ')}
      >
        <div className="grid grid-cols-2 gap-x-[12px] gap-y-[12px]">
          <CategoryPill href="/catalog" label="Каталог" isCatalog />

          {items.map((c) => {
            const href =
              c.type === 'subcategory' && c.category_slug
                ? `/category/${c.category_slug}/${c.slug}`
                : `/category/${c.slug}`;

            const label = String(c.home_title ?? '').trim() || c.name;

            return (
              <CategoryPill
                key={`${c.type}-${c.id}`}
                href={href}
                label={label}
                image={c.image}
                fallbackLetter={c.name.slice(0, 1).toUpperCase()}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}