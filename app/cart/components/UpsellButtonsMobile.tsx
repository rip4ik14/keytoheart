// ✅ Путь: app/cart/components/UpsellButtonsMobile.tsx
'use client';

import Image from 'next/image';

type Props = {
  onPostcard: () => void;
  onBalloons: () => void;
};

export default function UpsellButtonsMobile({ onPostcard, onBalloons }: Props) {
  const base =
    'w-full flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-4 text-[11px] uppercase tracking-tight font-semibold transition active:scale-[.98] border border-black/10 bg-white hover:bg-black/[0.02] shadow-[0_10px_30px_rgba(0,0,0,0.05)] text-black/80';

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <button type="button" onClick={onPostcard} className={base} aria-label="Добавить открытку">
        <Image src="/icons/postcard.svg" alt="" width={22} height={22} />
        <span className="text-center leading-tight">Добавить открытку</span>
      </button>

      <button type="button" onClick={onBalloons} className={base} aria-label="Добавить шары">
        <Image src="/icons/balloon.svg" alt="" width={22} height={22} />
        <span className="text-center leading-tight">Добавить шары</span>
      </button>
    </div>
  );
}
