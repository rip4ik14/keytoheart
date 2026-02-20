// ✅ Путь: app/product/[id]/ComboBuilderModal.tsx
'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import UiButton from '@/components/ui/UiButton';

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
  visible: { opacity: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

const modal = {
  hidden: { y: 14, opacity: 0, scale: 0.99 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { y: 14, opacity: 0, scale: 0.99, transition: { duration: 0.16 } },
};

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
    <div className="flex gap-3 items-center border-b border-black/10 py-4">
      <div className="relative w-16 h-16 rounded-2xl border border-black/10 bg-white flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.08)]">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-black leading-snug">{title}</p>
        <p className="text-xs text-black/60 mt-1 leading-snug">{subtitle}</p>
      </div>

      <UiButton
        type="button"
        variant="brandOutline"
        onClick={onAction}
        className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap"
      >
        {actionLabel}
      </UiButton>
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
    <div className="flex gap-3 items-center py-4 border-b border-black/10">
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

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-black">{money(finalPrice)} ₽</span>

          {discounted && comboDiscountPercent > 0 && (
            <span className="text-sm text-black/50 line-through">{money(item.price)} ₽</span>
          )}

          {discounted && comboDiscountPercent > 0 && (
            <span className="ml-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/5 text-black border border-black/10">
              -{comboDiscountPercent}%
            </span>
          )}
        </div>

        {onReplace && (
          <button
            type="button"
            onClick={onReplace}
            className="mt-1 text-xs text-black/60 hover:text-black underline underline-offset-2"
          >
            Заменить
          </button>
        )}
      </div>

      {onRemove && (
        <UiButton
          type="button"
          variant="brandOutline"
          onClick={onRemove}
          className="w-10 h-10 p-0 rounded-full flex items-center justify-center"
          aria-label="Удалить"
        >
          <span className="text-lg">🗑️</span>
        </UiButton>
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
    <div className="rounded-3xl border border-black/10 overflow-hidden bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-shadow">
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

        <UiButton
          type="button"
          variant="brandOutline"
          onClick={() => onSelect(item)}
          className="mt-3 w-full py-2 rounded-2xl text-xs font-bold uppercase tracking-wide"
        >
          Добавить
        </UiButton>
      </div>
    </div>
  );
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

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="
            fixed inset-0 z-[20010]
            flex items-end sm:items-center justify-center
            p-0 sm:p-6
            bg-black/60
          "
          variants={overlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="
              relative w-full
              sm:max-w-[1100px]
              rounded-t-[28px] sm:rounded-[32px]
              bg-white
              border border-black/10
              shadow-[0_35px_110px_rgba(0,0,0,0.42)]
              overflow-hidden
            "
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            {/* HEADER */}
            <div className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-black/10">
              <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                <p className="text-lg sm:text-xl font-bold leading-tight truncate text-black">
                  Собери комбо и получи скидку до 10%
                </p>

                <UiButton
                  type="button"
                  variant="brandOutline"
                  onClick={onClose}
                  className="w-10 h-10 p-0 rounded-full flex items-center justify-center"
                  aria-label="Закрыть"
                >
                  <X className="w-5 h-5" />
                </UiButton>
              </div>
            </div>

            {/* BODY */}
            <div className="h-[calc(86vh-72px)] max-h-[760px] overflow-hidden">
              {/* DESKTOP */}
              <div className="hidden lg:block h-full">
                {view === 'pick' ? (
                  <div className="h-full grid grid-cols-[1fr_420px]">
                    {/* LEFT: picker */}
                    <div className="border-r border-black/10 h-full flex flex-col min-h-0 bg-white">
                      <div className="px-6 pt-5 pb-4 border-b border-black/10 bg-white">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={onBackToMain}
                            className="text-sm underline underline-offset-2 text-black/60 hover:text-black flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Назад
                          </button>

                          <p className="mt-3 text-xl font-semibold text-black">Выберите замену</p>

                          <div className="mt-3 flex gap-4 text-sm overflow-x-auto no-scrollbar">
                            {pickTabs.map((tab) => (
                              <button
                                key={tab.t}
                                type="button"
                                onClick={() => onTabChange(tab.t)}
                                className={`pb-2 border-b-2 transition whitespace-nowrap ${
                                  activePick === tab.t
                                    ? 'border-black text-black font-semibold'
                                    : 'border-transparent text-black/50 hover:text-black'
                                }`}
                              >
                                {tabLabel(tab.t, tab.label)}
                              </button>
                            ))}
                          </div>

                          <p className="mt-3 text-sm font-semibold text-black">
                            {pickTitleForDesktop(activePick)}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 py-5 flex-1 min-h-0 overflow-y-auto">
                        {loadingPick ? (
                          <p className="text-black/50">Загрузка...</p>
                        ) : pickError ? (
                          <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black">
                            {pickError}
                          </div>
                        ) : pickList.length === 0 ? (
                          <p className="text-black/50">Пока нет товаров</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {pickList.map((it) => (
                              <PickCard key={it.id} item={it} onSelect={onSelectPick} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: builder */}
                    <div className="h-full flex flex-col min-h-0 bg-white">
                      <div className="px-6 pt-4 flex-1 min-h-0 overflow-y-auto">
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

                        <div className="h-4" />
                      </div>

                      <div className="shrink-0 px-6 pb-6 pt-4 bg-white border-t border-black/10">
                        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.10)]">
                          <div className="flex items-center justify-between text-sm text-black/60">
                            <span>Скидка {comboDiscountPercent}%</span>
                            <span>-{money(totalDiscountRub)} ₽</span>
                          </div>

                          <div className="mt-3 flex items-end justify-between">
                            <div className="text-sm font-semibold text-black/70">Всего</div>
                            <div className="text-2xl font-bold text-black">{money(totalFinal)} ₽</div>
                          </div>

                          <UiButton
                            type="button"
                            variant="cartRed"
                            onClick={onAddComboToCart}
                            className="mt-4 w-full py-4 rounded-3xl text-sm font-bold uppercase tracking-wide"
                          >
                            Добавить в корзину
                          </UiButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // MAIN
                  <div className="h-full flex">
                    <div className="w-full max-w-[520px] ml-auto h-full flex flex-col min-h-0 border-l border-black/10 bg-white">
                      <div className="px-6 pt-4 flex-1 min-h-0 overflow-y-auto">
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

                        <div className="h-4" />
                      </div>

                      <div className="shrink-0 px-6 pb-6 pt-4 bg-white border-t border-black/10">
                        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.10)]">
                          <div className="flex items-center justify-between text-sm text-black/60">
                            <span>Скидка {comboDiscountPercent}%</span>
                            <span>-{money(totalDiscountRub)} ₽</span>
                          </div>

                          <div className="mt-3 flex items-end justify-between">
                            <div className="text-sm font-semibold text-black/70">Всего</div>
                            <div className="text-2xl font-bold text-black">{money(totalFinal)} ₽</div>
                          </div>

                          <UiButton
                            type="button"
                            variant="cartRed"
                            onClick={onAddComboToCart}
                            className="mt-4 w-full py-4 rounded-3xl text-sm font-bold uppercase tracking-wide"
                          >
                            Добавить в корзину
                          </UiButton>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MOBILE */}
              <div className="lg:hidden h-full overflow-y-auto bg-white">
                {view === 'main' && (
                  <div className="px-4 sm:px-6 pb-6">
                    <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black/5 mt-3 border border-black/10 shadow-[0_18px_55px_rgba(0,0,0,0.12)]">
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
                        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.12)]">
                          <div className="flex items-center justify-between text-sm text-black/60">
                            <span>Скидка {comboDiscountPercent}%</span>
                            <span>-{money(totalDiscountRub)} ₽</span>
                          </div>

                          <div className="mt-3 flex items-end justify-between">
                            <div className="text-sm font-semibold text-black/70">Всего</div>
                            <div className="text-2xl font-bold text-black">{money(totalFinal)} ₽</div>
                          </div>

                          <UiButton
                            type="button"
                            variant="cartRed"
                            onClick={onAddComboToCart}
                            className="mt-4 w-full py-4 rounded-3xl text-sm font-bold uppercase tracking-wide"
                          >
                            Добавить в корзину
                          </UiButton>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {view === 'pick' && (
                  <div className="px-4 sm:px-6 py-4 pb-6">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={onBackToMain}
                        className="text-sm underline underline-offset-2 text-black/60 hover:text-black flex items-center gap-1"
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
                              : 'border-transparent text-black/50 hover:text-black'
                          }`}
                        >
                          {tabLabel(tab.t, tab.label)}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4">
                      {loadingPick ? (
                        <p className="text-black/50">Загрузка...</p>
                      ) : pickError ? (
                        <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black">
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

            {/* ✅ НИЖНЕГО FOOTER НЕТ */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}