// ✅ Путь: lib/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Убедитесь, что это значение задано в .env

// Функция для генерации JWT-токена
export async function signAdminJwt(): Promise<string> {
  try {
    const payload = {
      role: 'admin',
      iat: Math.floor(Date.now() / 1000), // Время выпуска
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // Срок действия: 8 часов
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

// Функция для верификации JWT-токена
export function verifyAdminJwt(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return (decoded as any).role === 'admin';
  } catch (err) {
    console.error('Ошибка верификации токена:', err);
    return false;
  }
}