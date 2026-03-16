# Второй пакет - layout и tablet breakpoints

## Что входит

### `app/layout.tsx`
- убран глобальный `force-dynamic`
- убран глобальный `force-no-store`
- включён нормальный ISR для корневого layout
- категории в layout теперь кэшируются через `force-cache` + `revalidate: 3600`

### `components/LayoutClient.tsx`
- tablet теперь считается mobile/layout-режимом до `lg`
- breadcrumbs на внутренних страницах показываются только с `lg`
- отступ под sticky header на внутренних страницах тоже только с `lg`
- offcanvas-меню и overlay переведены с `sm` на `lg`
- lock body-scroll для меню теперь работает до `1024px`, а не до `640px`

## Что это даёт
- меньше лишних SSR-запросов на витрине
- iPad/планшеты больше не попадают в полуломанный desktop-layout
- меньше наложений шапки и хлебных крошек на tablet

## Что ещё нужно добить следующим коммитом
1. Взять `components/StickyHeader.tsx` из первого пакета, где breakpoints уже переведены на `lg` и `xl`.
2. Взять `components/CategoryNav.tsx` из первого пакета, где mobile/desktop разделены по `lg`.
3. Взять `components/Footer.tsx` и `components/MobileContactFab.tsx` из первого пакета, чтобы footer не перекрывался FAB.

## Кого выносить с клиента первым
- `components/TopBar.tsx` - чистый markup, `use client` не нужен
- `components/Footer.tsx` - почти целиком server component, аналитику можно оставить через маленький client wrapper
- `components/WhyUsMarquee.tsx` - если там нет state/effect, уводить на сервер
- `components/PromoFooterBlock.tsx` - проверить, часто можно разделить на server shell + client animation

## Кого пока не трогать
- `components/StickyHeader.tsx`
- `components/SearchModal.tsx`
- `app/cart/**`
- `app/account/_components/AccountClient.tsx`
- `app/admin/(protected)/**`
