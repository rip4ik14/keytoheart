'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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

    // ВСЕГДА уводим в каталог
    router.push(qs ? `${targetPath}?${qs}` : targetPath, { scroll: true });
    onClose();
  }

  function reset() {
    // сброс тоже уводим в каталог (логично, если фильтр запускали с главной)
    router.push(targetPath, { scroll: true });

    setMinPrice(null);
    setMaxPrice(null);
    setCatIds([]);
    setSubIds([]);
  }

  // двойной range
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute right-0 top-0 h-full w-[92%] max-w-[420px] bg-white shadow-2xl flex flex-col"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Фильтр"
          >
            {/* header */}
            <div className="px-5 pt-5 pb-4 border-b">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-3xl font-extrabold tracking-[0.18em] uppercase text-black">
                    Фильтр
                  </div>
                  {selectedCount > 0 && (
                    <div className="mt-2 text-sm text-gray-500">Выбрано: {selectedCount}</div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100"
                  aria-label="Закрыть"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
              {/* PRICE */}
              <section>
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setSectionsOpen((s) => ({ ...s, price: !s.price }))}
                >
                  <div className="text-lg text-black">Цена</div>
                  <div className="text-gray-400">{sectionsOpen.price ? '−' : '+'}</div>
                </button>

                {sectionsOpen.price && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        inputMode="numeric"
                        value={minPrice ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setMinPrice(v === '' ? null : clamp(Number(v), minLimit, maxLimit));
                        }}
                        placeholder="От"
                        className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <input
                        inputMode="numeric"
                        value={maxPrice ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setMaxPrice(v === '' ? null : clamp(Number(v), minLimit, maxLimit));
                        }}
                        placeholder="До"
                        className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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

                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>{minLimit}</span>
                        <span>{maxLimit}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* CATEGORIES */}
              <section>
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() => setSectionsOpen((s) => ({ ...s, categories: !s.categories }))}
                >
                  <div className="text-lg text-black">Разделы</div>
                  <div className="text-gray-400">{sectionsOpen.categories ? '−' : '+'}</div>
                </button>

                {sectionsOpen.categories && (
                  <div className="mt-4 space-y-3">
                    {categories.map((c) => {
                      const id = String(c.id);
                      const checked = catIds.includes(id);
                      return (
                        <label key={c.id} className="flex items-center gap-3 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => setCatIds((old) => toggle(old, id))}
                            className="w-4 h-4"
                          />
                          <span>{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* SUBCATEGORIES */}
              <section>
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() =>
                    setSectionsOpen((s) => ({ ...s, subcategories: !s.subcategories }))
                  }
                >
                  <div className="text-lg text-black">Подкатегории</div>
                  <div className="text-gray-400">{sectionsOpen.subcategories ? '−' : '+'}</div>
                </button>

                {sectionsOpen.subcategories && (
                  <div className="mt-4 space-y-6">
                    {currentCategory ? (
                      <div>
                        <div className="text-sm text-black mb-3">{currentCategory.name}</div>
                        <div className="space-y-3">
                          {(currentCategory.subcategories || []).map((s) => {
                            const id = String(s.id);
                            const checked = subIds.includes(id);
                            return (
                              <label key={s.id} className="flex items-center gap-3 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => setSubIds((old) => toggle(old, id))}
                                  className="w-4 h-4"
                                />
                                <span>{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      categories.map((c) => {
                        const subs = c.subcategories || [];
                        if (!subs.length) return null;
                        return (
                          <div key={c.id}>
                            <div className="text-sm text-black mb-3">{c.name}</div>
                            <div className="space-y-3">
                              {subs.map((s) => {
                                const id = String(s.id);
                                const checked = subIds.includes(id);
                                return (
                                  <label key={s.id} className="flex items-center gap-3 text-sm text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => setSubIds((old) => toggle(old, id))}
                                      className="w-4 h-4"
                                    />
                                    <span>{s.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* footer buttons */}
            <div className="border-t px-5 py-4 bg-white">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={reset}
                  className="w-full rounded-full border border-gray-300 px-4 py-3 text-sm text-black hover:bg-gray-50 transition"
                  aria-label="Сбросить фильтры"
                >
                  Сбросить
                </button>
                <button
  onClick={apply}
  className="w-full rounded-full bg-black text-white px-4 py-3 text-sm hover:bg-gray-900 transition shadow-sm"
>
  Применить
</button>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
