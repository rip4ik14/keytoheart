export type AttributionPayload = {
  metrika_client_id?: string | null;
  yclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  landing_page?: string | null;
  referer?: string | null;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
};

export const ATTRIBUTION_COOKIE_NAME = 'kth_attribution_v1';
export const ATTRIBUTION_STORAGE_KEY = 'kth_attribution_v1';
export const ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

function clamp(value: unknown, max = 512): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

function normalizePayload(input: Partial<AttributionPayload> | null | undefined): AttributionPayload {
  return {
    metrika_client_id: clamp(input?.metrika_client_id, 128),
    yclid: clamp(input?.yclid, 128),
    utm_source: clamp(input?.utm_source, 128),
    utm_medium: clamp(input?.utm_medium, 128),
    utm_campaign: clamp(input?.utm_campaign, 256),
    utm_content: clamp(input?.utm_content, 256),
    utm_term: clamp(input?.utm_term, 256),
    landing_page: clamp(input?.landing_page, 1024),
    referer: clamp(input?.referer, 1024),
    first_seen_at: clamp(input?.first_seen_at, 64),
    last_seen_at: clamp(input?.last_seen_at, 64),
  };
}

function readCookieValueByName(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey !== name) continue;
    return rest.join('=') || null;
  }
  return null;
}

export function readAttributionFromCookieHeader(cookieHeader: string | null | undefined): AttributionPayload {
  try {
    const raw = readCookieValueByName(cookieHeader, ATTRIBUTION_COOKIE_NAME);
    if (!raw) return normalizePayload(null);
    const parsed = JSON.parse(decodeURIComponent(raw));
    return normalizePayload(parsed);
  } catch {
    return normalizePayload(null);
  }
}

export function serializeAttributionCookie(payload: Partial<AttributionPayload>): string {
  return encodeURIComponent(JSON.stringify(normalizePayload(payload)));
}

export function readStoredAttributionClient(): AttributionPayload {
  if (typeof window === 'undefined') return normalizePayload(null);

  try {
    const lsRaw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (lsRaw) return normalizePayload(JSON.parse(lsRaw));
  } catch {
    // ignore localStorage read error
  }

  try {
    const cookieRaw = readCookieValueByName(document.cookie, ATTRIBUTION_COOKIE_NAME);
    if (cookieRaw) return normalizePayload(JSON.parse(decodeURIComponent(cookieRaw)));
  } catch {
    // ignore cookie read error
  }

  return normalizePayload(null);
}

export function writeStoredAttributionClient(payload: Partial<AttributionPayload>) {
  if (typeof window === 'undefined') return normalizePayload(null);

  const normalized = normalizePayload(payload);
  const serialized = serializeAttributionCookie(normalized);

  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore localStorage write error
  }

  try {
    document.cookie = `${ATTRIBUTION_COOKIE_NAME}=${serialized}; path=/; max-age=${ATTRIBUTION_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    // ignore cookie write error
  }

  return normalized;
}

export function mergeAttributionClient(patch: Partial<AttributionPayload>) {
  const current = readStoredAttributionClient();
  const nowIso = new Date().toISOString();

  const next: AttributionPayload = normalizePayload({
    metrika_client_id: current.metrika_client_id || patch.metrika_client_id || null,
    yclid: current.yclid || patch.yclid || null,
    utm_source: current.utm_source || patch.utm_source || null,
    utm_medium: current.utm_medium || patch.utm_medium || null,
    utm_campaign: current.utm_campaign || patch.utm_campaign || null,
    utm_content: current.utm_content || patch.utm_content || null,
    utm_term: current.utm_term || patch.utm_term || null,
    landing_page: current.landing_page || patch.landing_page || null,
    referer: current.referer || patch.referer || null,
    first_seen_at: current.first_seen_at || patch.first_seen_at || nowIso,
    last_seen_at: patch.last_seen_at || nowIso,
  });

  return writeStoredAttributionClient(next);
}

export function buildAttributionFromLocation(href: string, referrer?: string | null): AttributionPayload {
  try {
    const url = new URL(href);
    return normalizePayload({
      yclid: url.searchParams.get('yclid'),
      utm_source: url.searchParams.get('utm_source'),
      utm_medium: url.searchParams.get('utm_medium'),
      utm_campaign: url.searchParams.get('utm_campaign'),
      utm_content: url.searchParams.get('utm_content'),
      utm_term: url.searchParams.get('utm_term'),
      landing_page: `${url.pathname}${url.search}`,
      referer: referrer || null,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    });
  } catch {
    return normalizePayload({
      referer: referrer || null,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    });
  }
}

export function detectAttributionSource(payload: Partial<AttributionPayload>): string {
  const p = normalizePayload(payload);
  const utmSource = (p.utm_source || '').toLowerCase();
  const utmMedium = (p.utm_medium || '').toLowerCase();
  const referer = (p.referer || '').toLowerCase();

  if (p.yclid) return 'yandex_direct';
  if (utmSource.includes('yandex') || utmMedium.includes('cpc') || utmMedium.includes('ppc')) {
    return 'paid_campaign';
  }
  if (utmSource) return `utm:${utmSource}`.slice(0, 128);
  if (referer.includes('yandex')) return 'organic_yandex';
  if (referer.includes('google')) return 'organic_google';
  if (referer) return 'referral';
  return 'direct';
}
