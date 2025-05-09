// ✅ Путь: utils/phoneMask.ts
export const phoneMask = (value: string) => {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, '');
  let formatted = '';

  // Форматируем в (XXX) XXX-XX-XX
  if (digits.length > 0) {
    formatted += '(' + digits.substring(0, 3);
    if (digits.length >= 3) {
      formatted += ') ' + digits.substring(3, 6);
    }
    if (digits.length >= 6) {
      formatted += '-' + digits.substring(6, 8);
    }
    if (digits.length >= 8) {
      formatted += '-' + digits.substring(8, 10);
    }
  }

  return formatted;
};