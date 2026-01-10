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
      <div className="w-16 h-16 rounded-xl border bg-white flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="px-4 py-2 rounded-full bg-[#3c3c3c] text-white text-xs font-bold uppercase hover:bg-black transition"
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
      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
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
        <p className="text-sm font-semibold line-clamp-2">{item.title}</p>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-base font-bold">{money(finalPrice)} ₽</span>

          {discounted && comboDiscountPercent > 0 && (
            <span className="text-sm text-gray-500 line-through">{money(item.price)} ₽</span>
          )}
        </div>

        {onReplace && (
          <button
            type="button"
            onClick={onReplace}
            className="mt-1 text-xs underline text-gray-700 hover:text-black"
          >
            Заменить
          </button>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition"
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
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition">
      <div className="relative w-full aspect-[4/3] bg-gray-100">
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
        <p className="text-sm font-semibold line-clamp-2 min-h-[40px]">{item.title}</p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-bold">{money(item.price)} ₽</span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(item)}
          className="mt-3 w-full py-2 rounded-xl bg-[#3c3c3c] text-white text-xs font-bold uppercase hover:bg-black transition"
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
          className="fixed inset-0 z-[90] bg-black/50 flex items-start justify-center p-3 sm:p-6 overflow-auto"
          variants={overlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="w-full max-w-[1100px] bg-white rounded-2xl shadow-xl overflow-hidden"
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* HEADER общий - как у тебя */}
            <div className="px-4 sm:px-6 py-4 border-b flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Собери комбо и получи скидку до 10%
                </p>
                <p className="text-lg sm:text-xl font-bold leading-tight truncate">
                  {heroTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="max-h-[78vh] overflow-auto">
              {/* DESKTOP: 2 колонки 1:1 как на твоем скрине */}
              <div className="hidden lg:grid grid-cols-[1fr_420px]">
                {/* LEFT: Выберите замену + табы + список */}
                <div className="border-r">
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
                              : 'border-transparent text-gray-500 hover:text-black'
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
                      <p className="text-gray-500">Загрузка…</p>
                    ) : pickError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {pickError}
                      </div>
                    ) : pickList.length === 0 ? (
                      <p className="text-gray-500">Пока нет товаров</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {pickList.map((it) => (
                          <PickCard
                            key={it.id}
                            item={it}
                            onSelect={(x) => {
                              onSelectPick(x);
                              // на desktop не уходим в отдельный view, просто добавляем
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: конструктор */}
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
                        subtitle={`и получите скидку ${comboDiscountPercent ? '2,5%' : '5%'}`}
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
                        subtitle={`и получите скидку ${comboDiscountPercent ? '2,5%' : '5%'}`}
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
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Скидка {comboDiscountPercent}%</span>
                        <span>-{money(totalDiscountRub)} ₽</span>
                      </div>

                      <div className="mt-3 flex items-end justify-between">
                        <div className="text-sm font-semibold text-gray-700">Всего</div>
                        <div className="text-2xl font-bold">{money(totalFinal)} ₽</div>
                      </div>

                      <button
                        type="button"
                        onClick={onAddComboToCart}
                        className="mt-4 w-full py-4 rounded-2xl bg-[#3c3c3c] text-white text-sm font-bold uppercase hover:bg-black transition"
                      >
                        Добавить в корзину
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOBILE: оставляем твою текущую логику main/pick */}
              <div className="lg:hidden">
                {view === 'main' && (
                  <div className="px-4 sm:px-6">
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mt-3">
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
                          subtitle={`и получите скидку ${comboDiscountPercent ? '2,5%' : '5%'}`}
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
                          subtitle={`и получите скидку ${comboDiscountPercent ? '2,5%' : '5%'}`}
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
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Скидка {comboDiscountPercent}%</span>
                          <span>-{money(totalDiscountRub)} ₽</span>
                        </div>

                        <div className="mt-3 flex items-end justify-between">
                          <div className="text-sm font-semibold text-gray-700">Всего</div>
                          <div className="text-2xl font-bold">{money(totalFinal)} ₽</div>
                        </div>

                        <button
                          type="button"
                          onClick={onAddComboToCart}
                          className="mt-4 w-full py-4 rounded-2xl bg-[#3c3c3c] text-white text-sm font-bold uppercase hover:bg-black transition"
                        >
                          Добавить в корзину
                        </button>
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
                        className="text-sm underline text-gray-700 hover:text-black flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Назад
                      </button>

                      <p className="text-base sm:text-lg font-bold text-center flex-1">
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
                              : 'border-transparent text-gray-500 hover:text-black'
                          }`}
                        >
                          {tabLabel(tab.t, tab.label)}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4">
                      {loadingPick ? (
                        <p className="text-gray-500">Загрузка…</p>
                      ) : pickError ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {pickError}
                        </div>
                      ) : pickList.length === 0 ? (
                        <p className="text-gray-500">Пока нет товаров</p>
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
            <div className="px-4 sm:px-6 py-4 border-t bg-white flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition"
              >
                Закрыть
              </button>

              <button
                type="button"
                onClick={onAddComboToCart}
                className="flex-1 px-5 py-3 rounded-xl bg-[#3c3c3c] text-white text-sm font-bold hover:bg-black transition"
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
