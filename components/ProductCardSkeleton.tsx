// components/ProductCardSkeleton.tsx

export default function ProductCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загрузка карточки"
      className="
        relative w-full max-w-[220px] sm:max-w-[280px] mx-auto bg-white rounded-[18px]
        border border-gray-200 flex flex-col min-h-[370px] sm:min-h-[420px] transition-all duration-200
        overflow-hidden
      "
    >
      {/* Стикеры (имитация бонуса и популярности) */}
      <div className="absolute top-2 left-2 z-20 w-16 h-6 rounded-full bg-gray-100" />
      <div className="absolute top-2 right-2 z-20 w-16 h-6 rounded-full bg-gray-100" />

      {/* Картинка */}
      <div className="block relative w-full aspect-[3/4] rounded-[18px] bg-gray-200 mb-3" />

      {/* Контент */}
      <div className="flex flex-col p-2 sm:p-4 flex-1 pb-12 sm:pb-14 relative">
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4 mx-auto" />
        <div className="flex items-center justify-center gap-2 min-h-[30px]">
          <div className="h-4 w-10 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>
        <div className="h-3 bg-gray-100 rounded mt-2 w-2/3 mx-auto" />
      </div>

      {/* Кнопка */}
      <div className="absolute left-0 bottom-0 w-full px-2 sm:px-3 z-10">
        <div className="w-full h-10 bg-gray-200 rounded-b-[18px]" />
      </div>
    </div>
  );
}
