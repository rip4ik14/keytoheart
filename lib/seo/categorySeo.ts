export function buildCategorySeoFallback(input: {
  name: string;
  slug: string;
  city?: string;
}) {
  const city = input.city || 'Краснодар';
  const name = (input.name || 'Категория').trim();
  const slug = (input.slug || '').trim();

  const normalized = name.toLowerCase();
  const title = `${name} - доставка в ${city} | KEY TO HEART`;
  const description =
    `Закажите ${normalized} с доставкой по ${city} от 30 минут. ` +
    `Свежие ингредиенты, аккуратная сборка, фото перед отправкой, оплата онлайн.`;

  const h1 = name;
  const seoText =
    `${name} в KEY TO HEART - это аккуратная сборка, свежие ингредиенты и быстрая доставка по ${city}.\n` +
    `Выбирайте позицию в каталоге, оформляйте заказ онлайн - мы подготовим и отправим его максимально быстро.\n` +
    `Перед отправкой можно запросить фото заказа, а к подарку добавим открытку.`;

  const ogImage = `/og-${slug}.webp`;

  return { seo_h1: h1, seo_title: title, seo_description: description, seo_text: seoText, og_image: ogImage };
}
