// ✅ Путь: components/ProductCardSkeleton.tsx
export default function ProductCardSkeleton() {
  return (
    <div
      className="animate-pulse space-y-2 rounded-2xl border p-4 bg-white"
      role="status"
      aria-label="Загрузка карточки товара"
    >
      <div className="h-48 w-full rounded-xl bg-gray-200" />
      <div className="h-4 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-1/2 rounded bg-gray-200" />
      <div className="h-8 w-full rounded bg-gray-200" />
    </div>
  );
}