Что изменено:
- ProductCard.tsx: карточки и миниатюры теперь запрашивают уменьшенные версии через Supabase render/image/public.
- HomeCategoryPills.tsx: иконки категорий получают облегчённые версии 96px.
- PromoGridClient.tsx: баннеры и desktop-карточки получают облегчённые версии без custom loader.
- CategoryNav.tsx: модалка фильтра монтируется только при открытии.
- next.config.js: добавлены remotePatterns для /storage/v1/render/image/public/**.

Как применять:
1. Заменить файлы.
2. Выполнить rm -rf .next
3. Выполнить npm run build
4. Проверить главную и карточки товара.
