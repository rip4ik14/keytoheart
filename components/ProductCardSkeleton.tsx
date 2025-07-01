// ✅ Путь: components/ProductCardSkeleton.tsx
export default function ProductCardSkeleton() {
  return (
    <div
      className="animate-pulse space-y-2 rounded-2xl border bg-white w-full h-[300px] sm:w-[240px] sm:h-[361px] px-4 pt-4 pb-3"
      role="status"
      aria-label="Загрузка карточки товара"
    >
      <div className="h-[180px] sm:h-[231px] w-full rounded-xl bg-gray-200" />
      <div className="h-4 w-3/4 rounded bg-gray-200 mx-auto" />
      <div className="h-4 w-1/2 rounded bg-gray-200 mx-auto" />
      <div className="h-8 w-full rounded bg-gray-200" />
    </div>
  );
}