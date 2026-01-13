// ✅ Путь: components/ProductCardSkeleton.tsx
export default function ProductCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загрузка карточки"
      className="
        relative w-full mx-auto
        max-w-[230px] sm:max-w-[300px] md:max-w-[340px] lg:max-w-[360px]
        bg-white rounded-[24px]
        border border-gray-200
        overflow-hidden
        shadow-[0_1px_0_rgba(0,0,0,0.04)]
      "
    >
      <div className="relative p-3 sm:p-4">
        {/* бейджи */}
        <div className="absolute left-6 top-6 z-20 h-7 w-24 rounded-full bg-gray-100" />
        <div className="absolute left-6 top-14 z-20 h-7 w-20 rounded-full bg-gray-100" />
        <div className="absolute right-6 top-6 z-20 h-7 w-24 rounded-full bg-gray-100" />

        {/* картинка */}
        <div className="block relative w-full aspect-[3/4] rounded-[18px] bg-gray-200 overflow-hidden" />
      </div>

      {/* контент */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <div className="h-4 bg-gray-200 rounded w-[92%] mb-2" />
        <div className="h-4 bg-gray-200 rounded w-[78%] mb-2" />
        <div className="h-4 bg-gray-200 rounded w-[60%]" />

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="h-5 bg-gray-200 rounded w-24" />
          <div className="h-11 bg-gray-200 rounded-full w-28 hidden sm:block" />
        </div>

        <div className="mt-4 h-11 bg-gray-200 rounded-full w-full sm:hidden" />
      </div>
    </div>
  );
}
