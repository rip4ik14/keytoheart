// ✅ Путь: components/CatalogFilterModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import UiButton from '@/components/ui/UiButton';

type Subcategory = { id: number; name: string; slug: string; is_visible?: boolean };
type Category = { id: number; name: string; slug: string; subcategories?: Subcategory[] };

type Props = {
  open: boolean;
  onClose: () => void;

  categories?: Category[];

  minLimit?: number;
  maxLimit?: number;

  currentCategorySlug?: string | null;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function parseNum(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { x: 48, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.22 } },
  exit: { x: 48, opacity: 0, transition: { duration: 0.18 } },
};

export default function CatalogFilterModal({
  open,
  onClose,
  categories = [],
  minLimit = 0,
  maxLimit = 65000,
  currentCategorySlug = null,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();

  // ✅ важно - чтобы не было SSR/CSR конфликтов
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ВАЖНО: если модалка открыта не в каталоге - применять нужно на /catalog
  const targetPath = '/catalog';

  // применённые значения из URL (текущей страницы)
  const applied = useMemo(() => {
    const min = parseNum(searchParams.get('min'));
    const max = parseNum(searchParams.get('max'));
    const cats = (searchParams.get('cats') || '').split(',').filter(Boolean);
    const subs = (searchParams.get('subs') || '').split(',').filter(Boolean);

    return {
      min: min === null ? null : clamp(min, minLimit, maxLimit),
      max: max === null ? null : clamp(max, minLimit, maxLimit),
      cats,
      subs,
    };
  }, [searchParams, minLimit, maxLimit]);

  // локальное состояние модалки
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [catIds, setCatIds] = useState<string[]>([]);
  const [subIds, setSubIds] = useState<string[]>([]);

  const [sectionsOpen, setSectionsOpen] = useState({
    price: true,
    categories: true,
    subcategories: true,
  });

  useEffect(() => {
    if (!open) return;
    setMinPrice(applied.min);
    setMaxPrice(applied.max);
    setCatIds(applied.cats);
    setSubIds(applied.subs);
  }, [open, applied]);

  // ✅ ПАТЧ: пока фильтр открыт, поднимаем FAB "Чат" выше фиксированного футера
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const prev = root.style.getPropertyValue('--kth-bottom-ui-h');

    const apply = () => {
      if (!open) return;

      const isMobile = !window.matchMedia('(min-width: 1024px)').matches; // lg
      if (!isMobile) return;

      root.style.setProperty('--kth-bottom-ui-h', '80px');
    };

    if (open) {
      apply();
      window.addEventListener('resize', apply);
    }

    return () => {
      window.removeEventListener('resize', apply);

      if (prev && prev.trim().length > 0) {
        root.style.setProperty('--kth-bottom-ui-h', prev);
      } else {
        root.style.removeProperty('--kth-bottom-ui-h');
      }
    };
  }, [open]);

  const currentCategory = useMemo(() => {
    if (!currentCategorySlug) return null;
    return categories.find((c) => c.slug === currentCategorySlug) || null;
  }, [categories, currentCategorySlug]);

  const selectedCount = useMemo(() => {
    let count = 0;
    if (minPrice !== null || maxPrice !== null) count += 1;
    count += catIds.length;
    count += subIds.length;
    return count;
  }, [minPrice, maxPrice, catIds, subIds]);

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  function buildParams() {
    const params = new URLSearchParams();

    if (minPrice !== null) params.set('min', String(clamp(minPrice, minLimit, maxLimit)));
    if (maxPrice !== null) params.set('max', String(clamp(maxPrice, minLimit, maxLimit)));

    if (catIds.length) params.set('cats', catIds.join(','));
    if (subIds.length) params.set('subs', subIds.join(','));

    return params;
  }

  function apply() {
    const params = buildParams();
    const qs = params.toString();

    router.push(qs ? `${targetPath}?${qs}` : targetPath, { scroll: true });
    onClose();
  }

  function reset() {
    router.push(targetPath, { scroll: true });

    setMinPrice(null);
    setMaxPrice(null);
    setCatIds([]);
    setSubIds([]);
  }

  const minValue = minPrice ?? minLimit;
  const maxValue = maxPrice ?? maxLimit;

  function onMinRange(v: number) {
    const next = clamp(v, minLimit, maxLimit);
    const fixed = Math.min(next, maxValue);
    setMinPrice(fixed);
  }
  function onMaxRange(v: number) {
    const next = clamp(v, minLimit, maxLimit);
    const fixed = Math.max(next, minValue);
    setMaxPrice(fixed);
  }

  const inputCls =
    'w-full rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#bdbdbd] ' +
    'placeholder:text-black/35';

  const sectionTitleCls = 'text-sm font-semibold tracking-tight text-black';
  const sectionCardCls =
    'mt-3 rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]';

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[25000]"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* panel */}
          <motion.div
            className="
              absolute right-0 top-0 h-full w-[92%] max-w-[420px]
              bg-white shadow-2xl flex flex-col
            "
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Фильтр"
          >
            {/* header */}
            <div className="px-5 pt-5 pb-4 border-b border-black/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[22px] font-semibold tracking-tight leading-tight">Фильтр</div>
                  {selectedCount > 0 && (
                    <div className="mt-1 text-xs text-black/50">Выбрано: {selectedCount}</div>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full border border-black/10 bg-white hover:bg-black/[0.02] transition"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              {/* PRICE */}
              <section>
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setSectionsOpen((s) => ({ ...s, price: !s.price }))}
                >
                  <div className={sectionTitleCls}>Цена</div>
                  <div className="text-black/40 text-sm">{sectionsOpen.price ? '-' : '+'}</div>
                </button>

                {sectionsOpen.price && (
                  <div className={sectionCardCls}>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        inputMode="numeric"
                        value={minPrice ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          const num = v === '' ? null : Number(v);
                          setMinPrice(num === null ? null : clamp(num, minLimit, maxLimit));
                        }}
                        placeholder="От"
                        className={inputCls}
                      />
                      <input
                        inputMode="numeric"
                        value={maxPrice ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          const num = v === '' ? null : Number(v);
                          setMaxPrice(num === null ? null : clamp(num, minLimit, maxLimit));
                        }}
                        placeholder="До"
                        className={inputCls}
                      />
                    </div>

                    <div className="mt-5">
                      <div className="relative h-10">
                        <input
                          type="range"
                          min={minLimit}
                          max={maxLimit}
                          value={minValue}
                          onChange={(e) => onMinRange(Number(e.target.value))}
                          className="absolute inset-0 w-full"
                          aria-label="Минимальная цена"
                        />
                        <input
                          type="range"
                          min={minLimit}
                          max={maxLimit}
                          value={maxValue}
                          onChange={(e) => onMaxRange(Number(e.target.value))}
                          className="absolute inset-0 w-full"
                          aria-label="Максимальная цена"
                        />
                      </div>

                      <div className="mt-2 flex justify-between text-[11px] text-black/45">
                        <span>{minLimit}</span>
                        <span>{maxLimit}</span>
                      </div>

                      {(minPrice !== null || maxPrice !== null) && (
                        <div className="mt-3 text-[11px] text-black/50">
                          Выбрано: {minValue} - {maxValue}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* CATEGORIES */}
              <section>
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setSectionsOpen((s) => ({ ...s, categories: !s.categories }))}
                >
                  <div className={sectionTitleCls}>Разделы</div>
                  <div className="text-black/40 text-sm">{sectionsOpen.categories ? '-' : '+'}</div>
                </button>

                {sectionsOpen.categories && (
                  <div className={sectionCardCls}>
                    <div className="space-y-3">
                      {categories.map((c) => {
                        const id = String(c.id);
                        const checked = catIds.includes(id);

                        return (
                          <label key={c.id} className="flex items-center gap-3 text-sm text-black/75">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setCatIds((old) => toggle(old, id))}
                              className="w-4 h-4 accent-rose-600"
                            />
                            <span className="leading-tight">{c.name}</span>
                          </label>
                        );
                      })}

                      {categories.length === 0 && (
                        <div className="text-sm text-black/50">Категории не найдены</div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* SUBCATEGORIES */}
              <section>
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setSectionsOpen((s) => ({ ...s, subcategories: !s.subcategories }))}
                >
                  <div className={sectionTitleCls}>Подкатегории</div>
                  <div className="text-black/40 text-sm">{sectionsOpen.subcategories ? '-' : '+'}</div>
                </button>

                {sectionsOpen.subcategories && (
                  <div className={sectionCardCls}>
                    <div className="space-y-6">
                      {currentCategory ? (
                        <div>
                          <div className="text-sm font-semibold text-black mb-3">{currentCategory.name}</div>

                          <div className="space-y-3">
                            {(currentCategory.subcategories || []).map((s) => {
                              const id = String(s.id);
                              const checked = subIds.includes(id);

                              return (
                                <label key={s.id} className="flex items-center gap-3 text-sm text-black/75">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => setSubIds((old) => toggle(old, id))}
                                    className="w-4 h-4 accent-rose-600"
                                  />
                                  <span className="leading-tight">{s.name}</span>
                                </label>
                              );
                            })}

                            {(currentCategory.subcategories || []).length === 0 && (
                              <div className="text-sm text-black/50">Подкатегории не найдены</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        categories.map((c) => {
                          const subs = c.subcategories || [];
                          if (!subs.length) return null;

                          return (
                            <div key={c.id}>
                              <div className="text-sm font-semibold text-black mb-3">{c.name}</div>
                              <div className="space-y-3">
                                {subs.map((s) => {
                                  const id = String(s.id);
                                  const checked = subIds.includes(id);

                                  return (
                                    <label key={s.id} className="flex items-center gap-3 text-sm text-black/75">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => setSubIds((old) => toggle(old, id))}
                                        className="w-4 h-4 accent-rose-600"
                                      />
                                      <span className="leading-tight">{s.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* footer buttons */}
            <div className="border-t border-black/10 px-5 py-4 bg-white">
              <div className="grid grid-cols-2 gap-3">
                <UiButton
                  onClick={reset}
                  variant="brandOutline"
                  className="w-full rounded-2xl py-3"
                  aria-label="Сбросить фильтры"
                >
                  Сбросить
                </UiButton>

                <UiButton
                  onClick={apply}
                  variant="cartRed"
                  className="w-full rounded-2xl py-3"
                  aria-label="Применить фильтры"
                >
                  Применить
                </UiButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ✅ ключевой фикс - портал в body, чтобы хедер ничего не клипал
  if (!mounted) return null;
  return createPortal(modal, document.body);
}
