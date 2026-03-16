Пакет возвращает server-first оболочку и сохраняет build-фиксы.

Замени эти файлы:
- app/layout.tsx
- components/LayoutClient.tsx
- components/StickyHeader.tsx
- components/CategoryNav.tsx
- components/CatalogClient.tsx
- components/CatalogFilterModal.tsx
- app/category/[category]/CategoryPageClient.tsx
- app/cart/components/AuthWithCall.tsx
- components/AuthWithCall.tsx
- app/admin/login/page.tsx
- app/admin/(protected)/orders/OrdersTableClient.tsx
- app/product/[id]/ProductPageClient.tsx
- lib/hooks/useClientSearchParams.ts

После замены:
rm -rf .next
npm run build
pm2 restart all
