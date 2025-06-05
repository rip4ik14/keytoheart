import Image, { ImageProps } from 'next/image';

export default function WebpImage({ src, webpSrc, ...rest }: { src: string; webpSrc?: string } & Omit<ImageProps, 'src'>) {
  const webp = webpSrc || src.replace(/\.jpe?g$/i, '.webp');
  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <Image src={src} {...rest} />
    </picture>
  );
}