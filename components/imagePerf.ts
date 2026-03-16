export function isExternalUrl(src?: string | null) {
  return !!src && /^https?:\/\//i.test(src);
}

export function isSupabasePublicUrl(src?: string | null) {
  return !!src && /^https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//i.test(src);
}

/**
 * Returns true only for external URLs that are NOT in Next.js remotePatterns.
 * Supabase and placeholder.com images can be optimized by Next.js Image.
 */
export function shouldSkipOptimization(src?: string | null): boolean {
  if (!src) return false;
  // blob: previews (admin uploads and temporary client-side objects)
  if (src.startsWith('blob:')) return true;

  if (!isExternalUrl(src)) return false;
  // These domains are in next.config.js remotePatterns — Next.js can optimize them
  if (isSupabasePublicUrl(src)) return false;
  if (/^https?:\/\/via\.placeholder\.com\//i.test(src)) return false;
  if (/^https?:\/\/keytoheart\.ru\//i.test(src)) return false;
  // external URLs outside configured allow-list
  return true;
}

export function withSupabaseTransform(src: string, width: number, quality = 72) {
  if (!isSupabasePublicUrl(src)) return src;

  try {
    const normalized = src.replace(/\/public\/([^/]+)\/\//, '/public/$1/');
    const url = new URL(normalized);
    url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    url.searchParams.set('width', String(Math.max(16, Math.round(width))));
    url.searchParams.set('quality', String(Math.max(40, Math.min(quality, 90))));
    return url.toString();
  } catch {
    return src;
  }
}
