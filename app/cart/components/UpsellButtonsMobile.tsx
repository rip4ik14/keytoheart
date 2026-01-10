'use client';

import Image from 'next/image';

type Props = {
  onPostcard: () => void;
  onBalloons: () => void;
};

export default function UpsellButtonsMobile({ onPostcard, onBalloons }: Props) {
  const base =
    'w-full flex flex-col items-center justify-center gap-2 border border-[#bdbdbd] rounded-xl px-3 py-4 font-bold text-[11px] uppercase tracking-tight bg-white text-[#535353] transition shadow-sm active:scale-[.98]';

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
