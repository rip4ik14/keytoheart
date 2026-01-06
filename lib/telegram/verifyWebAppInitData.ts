import crypto from 'crypto';

type VerifyResult =
  | { ok: true; data: Record<string, string> }
  | { ok: false; error: string };

function buildDataCheckString(params: URLSearchParams) {
  const pairs: string[] = [];

  // hash исключаем
  params.forEach((value, key) => {
    if (key === 'hash') return;
    pairs.push(`${key}=${value}`);
  });

  // сортировка по ключу
  pairs.sort((a, b) => a.localeCompare(b));
  return pairs.join('\n');
}

/**
 * Telegram WebApp initData verify
 * Алгоритм: secret_key = HMAC_SHA256("WebAppData", bot_token)
 * check = HMAC_SHA256(secret_key, data_check_string) hex
 */
export function verifyWebAppInitData(initDataRaw: string, botToken: string): VerifyResult {
  if (!initDataRaw) return { ok: false, error: 'initData пуст' };
  if (!botToken) return { ok: false, error: 'botToken пуст' };

  const params = new URLSearchParams(initDataRaw);
  const hash = params.get('hash');
  if (!hash) return { ok: false, error: 'hash отсутствует' };

  const dataCheckString = buildDataCheckString(params);

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // сравнение без утечек по времени
  const a = Buffer.from(computedHash, 'utf8');
  const b = Buffer.from(hash, 'utf8');
  if (a.length !== b.length) return { ok: false, error: 'hash не совпал' };

  const equal = crypto.timingSafeEqual(a, b);
  if (!equal) return { ok: false, error: 'hash не совпал' };

  // соберем data как объект строк
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });

  return { ok: true, data };
}
