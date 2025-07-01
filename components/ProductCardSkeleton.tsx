// ✅ Путь: components/ProductCardSkeleton.tsx
export default function ProductCardSkeleton() {
  return (
    <div
      className="animate-pulse space-y-2 rounded-2xl border bg-white w-full sm:w-[240px] px-4 pt-4 pb-3"
      role="status"
      aria-label="Загрузка карточки товара"
    >
      <div className="w-full aspect-[3/4] rounded-xl bg-gray-200" />
      <div className="h-4 w-3/4 rounded bg-gray-200 mx-auto" />
      <div className="h-4 w-1/2 rounded bg-gray-200 mx-auto" />
      <div className="h-8 w-full rounded bg-gray-200" />
    </div>
  );
}
