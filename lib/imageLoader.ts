// lib/imageLoader.ts
export function supabaseLoader({
    src,
    width,
    quality,
  }: {
    src: string;
    width: number;
    quality?: number;
  }) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${src}?w=${width}&q=${quality||75}`;
  }
  