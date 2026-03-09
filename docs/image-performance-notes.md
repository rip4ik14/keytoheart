# Image performance package

Что изменено:

- ProductCard.tsx
  - для картинок из Supabase включён custom loader, который ведёт сразу на `/storage/v1/render/image/public/...`
  - теперь карточки не тянут оригиналы 900-1200px, а получают ресайз по реальному slot width
  - для toast thumbnail задано более низкое quality

- HomeCategoryPills.tsx
  - иконки категорий из Supabase теперь идут через трансформацию, а не как оригиналы 300-1024px

- PromoGridClient.tsx
  - баннеры и правые карточки теперь используют Supabase image transformations
  - loader генерирует width/quality под Next Image srcset
  - fallback unoptimized остаётся только для внешних НЕ-Supabase URL

- CategoryNav.tsx
  - CatalogFilterModal монтируется только когда реально открыт, чтобы не грузить лишний client-код заранее

- next.config.js
  - добавлены remotePatterns для `/storage/v1/render/image/public/**`

- lib/utils/supabaseImageLoader.ts
  - общий loader для Supabase render/image/public

Что это должно улучшить:

- меньше переданных мегабайт на главной
- меньше oversized images в Lighthouse
- лучше LCP/FCP на карточках и баннерах

Что это НЕ решает полностью:

- если в Storage лежат очень тяжёлые PNG, даже transform API не всегда даст максимум
- для лучшего результата крупные PNG стоит переэкспортировать в WebP
- TTL `1 час` на Supabase файлах задаётся не этим пакетом, а настройками/метаданными объектов в Storage
