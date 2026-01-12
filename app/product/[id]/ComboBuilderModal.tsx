// ✅ Путь: app/product/[id]/ComboBuilderModal.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z/C/HwMDAwMjIxEABAMAATN4A+QAAAAASUVORK5CYII=';

export type ComboPickerType = 'flowers' | 'berries' | 'balloons' | 'cards';

export type SelectableProduct = {
  id: number;
  title: string;
  price: number;
  image: string;
  production_time?: number | null;
  kind: ComboPickerType;
};

type PickTab = { t: ComboPickerType; label: string };

function money(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n));
}
function percentToMultiplier(p: number) {
  return 1 - p / 100;
}

const overlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modal = {
  hidden: { y: 18, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.22 } },
  exit: { y: 18, opacity: 0, transition: { duration: 0.18 } },
};

const btnBase =
  'inline-flex items-center justify-center select-none ' +
  'transition-colors transition-shadow duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:ring-offset-2';

const btnPrimary =
  btnBase +
  ' bg-black text-white ' +
  'hover:bg-rose-600 focus-visible:bg-rose-600 ' +
  'shadow-[0_10px_25px_rgba(0,0,0,0.18)] hover:shadow-[0_10px_25px_rgba(225,29,72,0.22)]';

const btnSecondary =
  btnBase +
  ' bg-white text-black border border-black/15 ' +
  'hover:bg-rose-600/5 hover:text-rose-700 hover:border-rose-600/30';

const btnSoft =
  btnBase +
  ' bg-black/5 text-black border border-black/10 ' +
  'hover:bg-rose-600/10 hover:text-rose-700 hover:border-rose-600/20';

const btnIcon =
  btnBase +
  ' bg-white border border-black/10 ' +
  'hover:bg-rose-600/5 hover:border-rose-600/30';

function SlotCard({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-center border-b py-4">
      <div className="w-16 h-16 rounded-2xl border border-black/10 bg-white flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-black leading-snug">{title}</p>
        <p className="text-xs text-black/60 mt-1 leading-snug">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onAction}
        className={`${btnSecondary} px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function SelectedRow({
  item,
  discounted,
  comboDiscountPercent,
  onReplace,
  onRemove,
}: {
  item: SelectableProduct;
  discounted: boolean;
  comboDiscountPercent: number;
  onReplace?: () => void;
  onRemove?: () => void;
}) {
  const multiplier = percentToMultiplier(comboDiscountPercent);
  const finalPrice = discounted ? Math.round(item.price * multiplier) : item.price;

  return (
    <div className="flex gap-3 items-center py-4 border-b">
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-black/5 border border-black/10">
        <Image
          src={item.image || '/placeholder.jpg'}
          alt={item.title}
          fill
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold line-clamp-2 text-black">{item.title}</p>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-base font-bold text-black">{money(finalPrice)} ₽</span>

          {discounted && comboDiscountPercent > 0 && (
            <span className="text-sm text-black/50 line-through">{money(item.price)} ₽</span>
          )}

          {discounted && comboDiscountPercent > 0 && (
            <span className="ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-600/10 text-rose-700 border border-rose-600/15">
              -{comboDiscountPercent}%
            </span>
          )}
        </div>

        {onReplace && (
          <button
            type="button"
            onClick={onReplace}
            className="mt-1 text-xs text-black/60 hover:text-rose-700 underline underline-offset-2"
          >
            Заменить
          </button>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={`${btnIcon} w-10 h-10 rounded-full`}
          aria-label="Удалить"
        >
          <span className="text-lg">🗑️</span>
        </button>
      )}
    </div>
  );
}

function PickCard({
  item,
  onSelect,
}: {
  item: SelectableProduct;
  onSelect: (it: SelectableProduct) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/10 overflow-hidden bg-white hover:shadow-[0_14px_40px_rgba(0,0,0,0.10)] transition-shadow">
      <div className="relative w-full aspect-[4/3] bg-black/5">
        <Image
          src={item.image || '/placeholder.jpg'}
          alt={item.title}
          fill
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold line-clamp-2 min-h-[40px] text-black">{item.title}</p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-bold text-black">{money(item.price)} ₽</span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(item)}
          className={`${btnSecondary} mt-3 w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wide`}
        >
          Добавить
        </button>
      </div>
    </div>
  );
}

function tabLabel(t: ComboPickerType, fallback: string) {
  if (t === 'cards') return 'Открытка';
  return fallback;
}

function pickTitleForDesktop(activePick: ComboPickerType) {
  if (activePick === 'flowers') return 'Выберите букет';
  if (activePick === 'berries') return 'Выберите клубнику';
  if (activePick === 'balloons') return 'Выберите шары';
  return 'Выберите открытку';
}

export default function ComboBuilderModal({
  open,
  view,
  onClose,
  onBackToMain,

  heroImage,
  heroTitle,

  baseItem,

  selSecondBase,
  selBalloons,
  selCard,

  comboDiscountPercent,
  totalDiscountRub,
  totalFinal,

  onPickSecondBase,
  onPickBalloons,
  onPickCards,
  onReplaceSecondBase,
  onReplaceBalloons,
  onReplaceCards,
  onRemoveSecondBase,
  onRemoveBalloons,
  onRemoveCards,

  pickTitle,
  pickTabs,
  activePick,
  onTabChange,
  loadingPick,
  pickError,
  pickList,
  onSelectPick,

  onAddComboToCart,

  isBerryBase,
}: {
  open: boolean;
  view: 'main' | 'pick';
  onClose: () => void;
  onBackToMain: () => void;

  heroImage: string;
  heroTitle: string;

  baseItem: SelectableProduct;

  selSecondBase: SelectableProduct | null;
  selBalloons: SelectableProduct | null;
  selCard: SelectableProduct | null;

  comboDiscountPercent: number;
  totalDiscountRub: number;
  totalFinal: number;

  onPickSecondBase: () => void;
  onPickBalloons: () => void;
  onPickCards: () => void;

  onReplaceSecondBase: () => void;
  onReplaceBalloons: () => void;
  onReplaceCards: () => void;

  onRemoveSecondBase: () => void;
  onRemoveBalloons: () => void;
  onRemoveCards: () => void;

  pickTitle: string;
  pickTabs: PickTab[];
  activePick: ComboPickerType;
  onTabChange: (t: ComboPickerType) => void;
  loadingPick: boolean;
  pickError: string | null;
  pickList: SelectableProduct[];
  onSelectPick: (it: SelectableProduct) => void;

  onAddComboToCart: () => void;
  isBerryBase: boolean;
}) {
  const discounted = comboDiscountPercent > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[2px] flex items-start justify-center p-3 sm:p-6 overflow-auto"
          variants={overlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="w-full max-w-[1100px] bg-white rounded-[26px] shadow-[0_30px_90px_rgba(0,0,0,0.25)] overflow-hidden border border-black/10"
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* HEADER */}
            <div className="px-4 sm:px-6 py-4 border-b border-black/10 flex items-start justify-between gap-4 bg-white">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-black/50">
                  
                </p>
                <p className="text-lg sm:text-xl font-bold leading-tight truncate text-black">
                  {heroTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`${btnIcon} w-10 h-10 rounded-full`}
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="max-h-[78vh] overflow-auto">
              {/* DESKTOP */}
              <div className="hidden lg:grid grid-cols-[1fr_420px]">
                {/* LEFT: picker */}
                <div className="border-r border-black/10">
                  <div className="px-6 pt-6">
                    <p className="text-xl font-semibold text-black">Выберите замену</p>

                    <div className="mt-3 flex gap-4 text-sm">
                      {pickTabs.map((tab) => (
                        <button
                          key={tab.t}
                          type="button"
                          onClick={() => onTabChange(tab.t)}
                          className={`pb-2 border-b-2 transition whitespace-nowrap ${
                            activePick === tab.t
                              ? 'border-black text-black font-semibold'
                              : 'border-transparent text-black/50 hover:text-rose-700'
                          }`}
                        >
                          {tabLabel(tab.t, tab.label)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-4">
                    <p className="text-sm font-semibold text-black mb-3">
                      {pickTitleForDesktop(activePick)}
                    </p>

                    {loadingPick ? (
                      <p className="text-black/50">Загрузка…</p>
                    ) : pickError ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {pickError}
                      </div>
                    ) : pickList.length === 0 ? (
                      <p className="text-black/50">Пока нет товаров</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {pickList.map((it) => (
                          <PickCard
                            key={it.id}
                            item={it}
                            onSelect={(x) => {
                              onSelectPick(x);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: builder */}
                <div className="px-6 py-2">
                  <div className="pt-2">
                    <SelectedRow
                      item={baseItem}
                      discounted={discounted}
                      comboDiscountPercent={comboDiscountPercent}
                    />

                    {!selSecondBase ? (
                      <SlotCard
                        title={isBerryBase ? 'Добавьте букет' : 'Добавьте клубнику'}
                        subtitle="скидка растет, когда добавляете второй товар"
                        actionLabel={isBerryBase ? 'Добавить букет' : 'Добавить клубнику'}
                        onAction={onPickSecondBase}
                        icon={<span className="text-2xl">{isBerryBase ? '💐' : '🍓'}</span>}
                      />
                    ) : (
                      <SelectedRow
                        item={selSecondBase}
                        discounted={discounted}
                        comboDiscountPercent={comboDiscountPercent}
                        onReplace={onReplaceSecondBase}
                        onRemove={onRemoveSecondBase}
                      />
                    )}

                    {!selBalloons ? (
                      <SlotCard
                        title="Добавьте шары"
                        subtitle="с шарами скидка увеличивается"
                        actionLabel="Добавить шары"
                        onAction={onPickBalloons}
                        icon={<span className="text-2xl">🎈</span>}
                      />
                    ) : (
                      <SelectedRow
                        item={selBalloons}
                        discounted={discounted}
                        comboDiscountPercent={comboDiscountPercent}
                        onReplace={onReplaceBalloons}
                        onRemove={onRemoveBalloons}
                      />
                    )}

                    {!selCard ? (
                      <SlotCard
                        title="Добавьте открытку"
                        subtitle="открытка добавится отдельным товаром"
                        actionLabel="Добавить открытку"
                        onAction={onPickCards}
                        icon={<span className="text-2xl">💌</span>}
                      />
                    ) : (
                      <SelectedRow
                        item={selCard}
                        discounted={false}
                        comboDiscountPercent={comboDiscountPercent}
                        onReplace={onReplaceCards}
                        onRemove={onRemoveCards}
                      />
                    )}

                    <div className="py-5">
                      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-between text-sm text-black/60">
                          <span>Скидка {comboDiscountPercent}%</span>
                          <span>-{money(totalDiscountRub)} ₽</span>
                        </div>

                        <div className="mt-3 flex items-end justify-between">
                          <div className="text-sm font-semibold text-black/70">Всего</div>
                          <div className="text-2xl font-bold text-black">{money(totalFinal)} ₽</div>
                        </div>

                        <button
                          type="button"
                          onClick={onAddComboToCart}
                          className={`${btnPrimary} mt-4 w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-wide`}
                        >
                          Добавить в корзину
                        </button>

                        
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOBILE */}
              <div className="lg:hidden">
                {view === 'main' && (
                  <div className="px-4 sm:px-6">
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/5 mt-3 border border-black/10">
                      <Image
                        src={heroImage || '/placeholder.jpg'}
                        alt={heroTitle}
                        fill
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                        className="object-cover"
                      />
                    </div>

                    <div className="pt-2">
                      <SelectedRow
                        item={baseItem}
                        discounted={discounted}
                        comboDiscountPercent={comboDiscountPercent}
                      />

                      {!selSecondBase ? (
                        <SlotCard
                          title={isBerryBase ? 'Добавьте букет' : 'Добавьте клубнику'}
                          subtitle="скидка растет, когда добавляете второй товар"
                          actionLabel={isBerryBase ? 'Добавить букет' : 'Добавить клубнику'}
                          onAction={onPickSecondBase}
                          icon={<span className="text-2xl">{isBerryBase ? '💐' : '🍓'}</span>}
                        />
                      ) : (
                        <SelectedRow
                          item={selSecondBase}
                          discounted={discounted}
                          comboDiscountPercent={comboDiscountPercent}
                          onReplace={onReplaceSecondBase}
                          onRemove={onRemoveSecondBase}
                        />
                      )}

                      {!selBalloons ? (
                        <SlotCard
                          title="Добавьте шары"
                          subtitle="с шарами скидка увеличивается"
                          actionLabel="Добавить шары"
                          onAction={onPickBalloons}
                          icon={<span className="text-2xl">🎈</span>}
                        />
                      ) : (
                        <SelectedRow
                          item={selBalloons}
                          discounted={discounted}
                          comboDiscountPercent={comboDiscountPercent}
                          onReplace={onReplaceBalloons}
                          onRemove={onRemoveBalloons}
                        />
                      )}

                      {!selCard ? (
                        <SlotCard
                          title="Добавьте открытку"
                          subtitle="открытка добавится отдельным товаром"
                          actionLabel="Добавить открытку"
                          onAction={onPickCards}
                          icon={<span className="text-2xl">💌</span>}
                        />
                      ) : (
                        <SelectedRow
                          item={selCard}
                          discounted={false}
                          comboDiscountPercent={comboDiscountPercent}
                          onReplace={onReplaceCards}
                          onRemove={onRemoveCards}
                        />
                      )}

                      <div className="py-5">
                        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                          <div className="flex items-center justify-between text-sm text-black/60">
                            <span>Скидка {comboDiscountPercent}%</span>
                            <span>-{money(totalDiscountRub)} ₽</span>
                          </div>

                          <div className="mt-3 flex items-end justify-between">
                            <div className="text-sm font-semibold text-black/70">Всего</div>
                            <div className="text-2xl font-bold text-black">{money(totalFinal)} ₽</div>
                          </div>

                          <button
                            type="button"
                            onClick={onAddComboToCart}
                            className={`${btnPrimary} mt-4 w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-wide`}
                          >
                            Добавить в корзину
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {view === 'pick' && (
                  <div className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={onBackToMain}
                        className="text-sm underline underline-offset-2 text-black/60 hover:text-rose-700 flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Назад
                      </button>

                      <p className="text-base sm:text-lg font-bold text-center flex-1 text-black">
                        {pickTitle}
                      </p>

                      <div className="w-[60px]" />
                    </div>

                    <div className="mt-3 flex gap-3 text-sm overflow-x-auto no-scrollbar">
                      {pickTabs.map((tab) => (
                        <button
                          key={tab.t}
                          type="button"
                          onClick={() => onTabChange(tab.t)}
                          className={`pb-2 border-b-2 transition whitespace-nowrap ${
                            activePick === tab.t
                              ? 'border-black text-black font-semibold'
                              : 'border-transparent text-black/50 hover:text-rose-700'
                          }`}
                        >
                          {tabLabel(tab.t, tab.label)}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4">
                      {loadingPick ? (
                        <p className="text-black/50">Загрузка…</p>
                      ) : pickError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                          {pickError}
                        </div>
                      ) : pickList.length === 0 ? (
                        <p className="text-black/50">Пока нет товаров</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {pickList.map((it) => (
                            <PickCard key={it.id} item={it} onSelect={onSelectPick} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="px-4 sm:px-6 py-4 border-t border-black/10 bg-white flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`${btnSecondary} px-5 py-3 rounded-xl text-sm font-semibold`}
              >
                Закрыть
              </button>

              <button
                type="button"
                onClick={onAddComboToCart}
                className={`${btnPrimary} flex-1 px-5 py-3 rounded-xl text-sm font-bold`}
              >
                Добавить в корзину
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
