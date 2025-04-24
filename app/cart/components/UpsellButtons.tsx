// ✅ Путь: app/cart/components/UpsellButtons.tsx
'use client';

interface Props {
  onPostcard: () => void;
  onBalloons: () => void;
}

export default function UpsellButtons({ onPostcard, onBalloons }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Открытка */}
      <button
        type="button"
        onClick={onPostcard}
        className="w-full md:w-40 h-28 flex flex-col items-center justify-center rounded-xl
          bg-white shadow-sm hover:shadow-md transition hover:-translate-y-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mb-1 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-9 9v.01" />
        </svg>
        <span className="text-xs font-medium text-gray-700">Добавить открытку</span>
      </button>

      {/* Шары */}
      <button
        type="button"
        onClick={onBalloons}
        className="w-full md:w-40 h-28 flex flex-col items-center justify-center rounded-xl
          bg-white shadow-sm hover:shadow-md transition hover:-translate-y-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 mb-1 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.5 11a3.5 3.5 0 117 0c0 2-3.5 4-3.5 6m-3.5-6H5m14 0h-4"
          />
        </svg>
        <span className="text-xs font-medium text-gray-700">Добавить шары</span>
      </button>
    </div>
  );
}
