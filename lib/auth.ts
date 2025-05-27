// lib/auth.ts
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function signAdminJwt(): Promise<string> {
  console.log(`${new Date().toISOString()} signAdminJwt: Using JWT_SECRET`, { secret: JWT_SECRET });
  const payload = {
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  };
  return new Promise((resolve, reject) => {
    jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' }, (err, token) => {
      if (err || !token) {
        console.error(`${new Date().toISOString()} signAdminJwt: Error generating token`, err);
        reject(err || new Error('Не удалось сгенерировать токен'));
      } else {
        resolve(token);
      }
    });
  });
}

export function verifyAdminJwt(token: string): boolean {
  console.log(`${new Date().toISOString()} verifyAdminJwt: Using JWT_SECRET`, { secret: JWT_SECRET });
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    console.log(`${new Date().toISOString()} verifyAdminJwt: Token verified`, { decoded });
    return (decoded as any).role === 'admin';
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${new Date().toISOString()} verifyAdminJwt: Verification failed`, { error: errorMessage, token });
    return false;
  }
}