# Home Lighthouse / PageSpeed report

## Scope
Homepage performance-only optimizations without UI/logic changes.

## What caused high desktop CLS (~0.54)
Most likely contributor was hero/promo two-phase rendering on `/`:
1. SSR rendered a standalone `PromoBannerServer` block.
2. After hydration, `PromoGridWrapper` replaced it with `PromoGridClient` layout.

This DOM replacement on first screen could shift nearby content and inflate CLS.

### Fix applied
- Removed the SSR+hydrate swap path and render promo once via `PromoGridClient` from server data.
- Kept fixed first-screen geometry via existing `aspect-ratio` containers in promo slider.
- Cookie banner remains `position: fixed` overlay and does not participate in document flow.
- LCP/hero images use `next/image` with `fill`, `sizes`, `priority` for first slide and fixed parent box.

## Metrics

### Baseline from initial user report (production)
- Mobile: Performance ~77, LCP ~3.8s, TBT ~240ms, CLS ~0.089.
- Desktop: Performance ~78, LCP ~0.7s, CLS ~0.54.

### Current local reproducible Lighthouse (127.0.0.1)
> Note: these are environment metrics to compare code states on the same runner.

| Mode | Performance | LCP | TBT | CLS |
|---|---:|---:|---:|---:|
| Before (commit `0a5e53e`) mobile | 50 | 5.74s | 1583ms | 0.080 |
| After (commit `cfa59bd`) mobile | 50 | 5.72s | 1579ms | 0.080 |
| Before (commit `0a5e53e`) desktop | 98 | 0.83s | 70ms | 0.045 |
| After (commit `cfa59bd`) desktop | 98 | 0.82s | 64ms | 0.045 |

### Production URL run status (`https://keytoheart.ru`)
From this CI/container network, direct external checks are blocked by outbound proxy (`CONNECT tunnel failed, 403`), so automated PageSpeed/Lighthouse fetch to production URL is not possible in this environment.

## Verification commands
```bash
npm run build
npm run start
CHROME_PATH=/root/.cache/puppeteer/chrome/linux-138.0.7204.168/chrome-linux64/chrome \
  npx lighthouse http://127.0.0.1:3000 --only-categories=performance --output=json --output-path=./lh-local-mobile-after.json
CHROME_PATH=/root/.cache/puppeteer/chrome/linux-138.0.7204.168/chrome-linux64/chrome \
  npx lighthouse http://127.0.0.1:3000 --only-categories=performance --preset=desktop --output=json --output-path=./lh-local-desktop-after.json
```

## next/image config check
`next.config.js` keeps Next image optimization enabled, with:
- `images.remotePatterns` for Supabase + domain paths.
- `images.formats = ['image/avif','image/webp']`.
- additional cache header for `/_next/image`.
