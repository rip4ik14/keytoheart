// lib/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

export function verifyAdminJwt(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return (decoded as any).role === 'admin';
  } catch (err) {
    console.error('Ошибка верификации токена:', err);
    return false;
  }
}