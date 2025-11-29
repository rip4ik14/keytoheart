// ✅ Путь: lib/normalizePhone.ts

/**
 * Приводит телефон к каноническому формату +7XXXXXXXXXX.
 * Используем для всего фронта и бэка.
 */
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return '';

  // Оставляем только цифры
  let digits = String(input).replace(/\D/g, '');

  if (!digits) return '';

  // Если цифр больше 11 – берем последние 10 как "основной" номер
  if (digits.length > 11) {
    digits = digits.slice(-10);
  }

  // Если строго 11 цифр и первая 8 или 7 – приводим к формату +7XXXXXXXXXX
  if (digits.length === 11) {
    const last10 = digits.slice(-10);
    return `+7${last10}`;
  }

  // Если 10 цифр – считаем, что это российский номер без кода страны
  if (digits.length === 10) {
    return `+7${digits}`;
  }

  // Меньше 10 цифр – считаем номер некорректным, но всё равно возвращаем "+цифры"
  // (валидация делается уже на уровне форм / API)
  return `+${digits}`;
}

/**
 * Строит варианты телефона для поиска в БД.
 * Всегда исходит из идеи, что канонический вид – +7XXXXXXXXXX.
 *
 * Пример:
 *  input: "+7 (918) 030-06-43"
 *  variants: [
 *    "+79180300643",
 *    "79180300643",
 *    "89180300643",
 *    "9180300643"
 *  ]
 */
export function buildPhoneVariants(input: string | null | undefined): string[] {
  if (!input) return [];

  const digits = String(input).replace(/\D/g, '');
  if (digits.length < 10) {
    // слишком мало цифр – не считаем номер валидным
    return [];
  }

  const last10 = digits.slice(-10);

  const variants = new Set<string>();

  // Канонический формат
  variants.add(`+7${last10}`);

  // Возможные варианты хранения в разных таблицах
  variants.add(`7${last10}`);
  variants.add(`8${last10}`);
  variants.add(last10);

  return Array.from(variants);
}
