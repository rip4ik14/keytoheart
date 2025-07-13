// components/ProductCardSkeleton.tsx
export default function ProductCardSkeleton() {
  return (
    <div
      role="status" aria-label="Загрузка карточки"
      className="animate-pulse aspect-[3/4] w-full max-w-[220px] sm:max-w-[280px]
                 rounded-2xl border bg-white p-4"
    >
      <div className="h-full w-full rounded-xl bg-gray-200" />
    </div>
  );
}
