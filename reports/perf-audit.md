# Performance audit (local container)

## Scope and limitations
- Environment does not provide production secrets (`.env`/`.env.local` absent), so dynamic data routes for `/category/...` and `/product/...` return 404 locally.
- Lighthouse CLI cannot run in this container because Chrome/Chromium is not installed (`CHROME_PATH` missing).
- Therefore, baseline/after was captured via Next.js production build output and runtime SEO checks for available routes (`/`, `/cart`).

## Baseline (before changes)
Captured from `npm run build` output before patch:
- `/` page bundle: **5.98 kB** (route size), First Load JS **169 kB**.
- `/product/[id]` route size: **44.7 kB**.
- Shared First Load JS: **102 kB**.

## After (this patch)
Captured from `npm run build` output after patch:
- `/` page bundle: **4.84 kB** (route size), First Load JS **168 kB**.
- `/product/[id]` route size: **44.6 kB**.
- Shared First Load JS: **102 kB**.

## Changes applied
1. Reduced home hydration JS:
   - `FlowwowReviewsWidget` converted to server component.
   - `YandexReviewsWidget` converted to server component; removed resize listener/state and replaced with responsive CSS height.
2. Deferred FAQ client chunk:
   - `FAQSectionWrapper` now mounts FAQ block only near viewport via `IntersectionObserver`.
3. Reduced unnecessary rerender logic:
   - `AdvantagesClient` no longer forces rerender for reveal animation.
4. Removed duplicate `/api/store-settings` client requests:
   - Added shared in-flight+TTL cache (`lib/store-settings-client.ts`).
   - Reused in cart hook, cart datetime step, and product page client.

## SEO runtime spot checks (after patch)
Using local rendered HTML for `/` and `/cart`, checked:
- `<title>` present
- `canonical` present
- `og:title` present
- `robots` present
- JSON-LD scripts present
- `h1` present

No SEO logic/code was changed in this patch.
