// ✅ Путь: lib/auth.ts

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'keytoheart2024';

export interface AdminTokenPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * Проверяет пароль администратора
 */
export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

/**
 * Создает JWT токен для администратора (асинхронная версия для совместимости)
 */
export async function signAdminJwt(): Promise<string> {
  try {
    const payload = {
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    };

    return new Promise((resolve, reject) => {
      jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' }, (err, token) => {
        if (err || !token) {
          reject(err || new Error('Не удалось сгенерировать токен'));
        } else {
          resolve(token);
        }
      });
    });
  } catch (err) {
    throw new Error('Ошибка генерации токена: ' + (err as Error).message);
  }
}

/**
 * Проверяет JWT токен администратора (синхронная версия)
 */
export function verifyAdminJwt(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any;
    return decoded.role === 'admin';
  } catch (err) {
    console.error('Ошибка верификации токена:', err);
    return false;
  }
}

/**
 * Декодирует JWT токен без проверки подписи (для получения payload)
 */
export function decodeAdminJwt(token: string): AdminTokenPayload | null {
  try {
    return jwt.decode(token) as AdminTokenPayload;
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
}