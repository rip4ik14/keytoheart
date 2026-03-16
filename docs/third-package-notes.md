# Третий пакет - server-first для верхней/нижней оболочки

## Что делает пакет

### 1) `components/TopBar.tsx`
- убран `use client`
- компонент теперь рендерится сервером
- бегущая строка остаётся той же, но перестаёт участвовать в лишней клиентской гидратации

### 2) `components/Footer.tsx`
- футер переведён в server component
- сохранена улучшенная сетка desktop/mobile из первого пакета
- все клики по ссылкам и внешним кнопкам больше не требуют тяжёлого client-footer
- для метрик используется маленький клиентский мост `FooterMetrics.tsx`

### 3) `components/FooterMetrics.tsx`
- маленький клиентский компонент с event delegation
- слушает только клики внутри футера
- отправляет `gtag` и `Yandex Metrica`
- заменяет старую схему, где весь футер целиком был client component

### 4) `components/LayoutClient.tsx`
- `TopBar` и `Footer` убраны из прямых импортов
- теперь получает их как `topBarSlot` и `footerSlot`
- это даёт держать layout-интерактивность в клиенте, а тяжёлую статику оболочки - на сервере

### 5) `app/layout.tsx`
- серверный layout теперь сам создаёт `TopBar` и `Footer`
- передаёт их внутрь `LayoutClient` слотами

## Почему это полезно
- меньше клиентского JS в общей оболочке сайта
- меньше гидратации на каждой странице
- быстрее старт рендера на мобильных
- футер больше не тянет в клиент весь набор обработчиков и метрик

## Что ещё остаётся жирным в client bundle

### Самые тяжёлые точки сейчас
1. `components/StickyHeader.tsx`
- большой интерактивный header
- `framer-motion`
- поиск, auth, category nav, scroll-логика, анимации

2. `app/product/[id]/ProductPageClient.tsx`
- очень тяжёлый файл
- несколько `Swiper`
- `framer-motion`
- большой объём состояния и эффектов
- это один из главных кандидатов на декомпозицию

3. `components/ProductCard.tsx`
- клиентский, с `framer-motion`
- если карточек на странице много, INP и hydration растут

4. `components/PromoGridClient.tsx`
- сложная анимационная главная секция
- баннеры + карточки + свайпы

5. `app/cart/**`
- там очень много клиентской логики и эффектов
- отдельно проверить `Step4DateTime.tsx`, потому что именно там уже ловился loop/maximum update depth

## Следующий пакет, который имеет смысл делать
1. Разрезать `StickyHeader.tsx` на:
- server shell
- client actions block
- client search block
- client auth block

2. Разрезать `ProductPageClient.tsx` минимум на:
- gallery chunk
- recommendation sliders chunk
- combo chunk
- description/reviews chunk

3. Выкинуть `framer-motion` там, где анимации можно заменить на CSS transitions

4. Проверить и облегчить:
- `components/SearchModal.tsx`
- `components/ProductCard.tsx`
- `components/CategoryNav.tsx`

## Как ставить
1. Сначала первый пакет
2. Потом второй пакет
3. Потом этот третий пакет

Если ставить только этот пакет поверх исходника, часть улучшений по планшетам и sticky header не попадёт.
