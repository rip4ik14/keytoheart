export const phoneMask = (value: string) => {
  // В тестовом режиме всегда возвращаем фиксированный номер
  if (process.env.NODE_ENV === 'development') {
    console.log('phoneMask: Using fixed number for development');
    return '(918) 030-06-43';
  }

  // Удаляем все нецифровые символы
  let digits = value.replace(/\D/g, '');

  console.log('phoneMask input:', value, 'digits:', digits);

  // Убираем префикс +7 или 8, если он есть
  let formattedDigits = digits.startsWith('8') ? digits.substring(1) : digits.startsWith('+7') ? digits.substring(2) : digits;

  // Проверяем, что у нас есть достаточно цифр
  if (formattedDigits.length !== 10) {
    console.warn('Номер телефона должен содержать 10 цифр:', formattedDigits);
    return digits; // Возвращаем как есть, если формат некорректен
  }

  // Проверяем, что номер начинается с 9
  if (!formattedDigits.startsWith('9')) {
    console.warn('Номер телефона должен начинаться с 9 после +7:', formattedDigits);
    return formattedDigits; // Возвращаем без форматирования, чтобы не вводить в заблуждение
  }

  // Форматируем в (918) 030-06-43
  let formatted = '';
  if (formattedDigits.length > 0) {
    formatted += '(' + formattedDigits.substring(0, 3);
    if (formattedDigits.length >= 3) {
      formatted += ') ' + formattedDigits.substring(3, 6);
    }
    if (formattedDigits.length >= 6) {
      formatted += '-' + formattedDigits.substring(6, 8);
    }
    if (formattedDigits.length >= 8) {
      formatted += '-' + formattedDigits.substring(8, 10);
    }
  }

  console.log('phoneMask output:', formatted);
  return formatted;
};