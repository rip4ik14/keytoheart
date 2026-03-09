import type { ImageLoaderProps } from 'next/image';

const PUBLIC_SEGMENT = '/storage/v1/object/public/';
const RENDER_SEGMENT = '/storage/v1/render/image/public/';

function normalizeSupabasePublicUrl(raw: string): string {
  return raw.replace(/\/storage\/v1\/object\/public\/([^/]+)\/+/i, '/storage/v1/object/public/$1/');
}

export function isSupabasePublicUrl(src?: string | null): boolean {
  if (!src) return false;

  try {
    const normalized = normalizeSupabasePublicUrl(src);
    const url = new URL(normalized);

    return url.hostname.endsWith('.supabase.co') && url.pathname.includes(PUBLIC_SEGMENT);
  } catch {
    return false;
  }
}

export default function supabaseImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!isSupabasePublicUrl(src)) return src;

  const normalized = normalizeSupabasePublicUrl(src);
  const url = new URL(normalized);
  const [, bucketAndPath = ''] = url.pathname.split(PUBLIC_SEGMENT);

  if (!bucketAndPath) return normalized;

  const transformed = new URL(`${RENDER_SEGMENT}${bucketAndPath}`, url.origin);
  transformed.searchParams.set('width', String(Math.max(1, Math.round(width))));
  transformed.searchParams.set('quality', String(quality ?? 75));
  transformed.searchParams.set('resize', 'cover');

  return transformed.toString();
}
