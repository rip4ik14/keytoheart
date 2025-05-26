import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function createSessionToken(phone: string) {
  return jwt.sign(
    { phone, authenticated: true, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifySession(token?: string) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { phone: string; authenticated: boolean };
  } catch {
    return null;
  }
}
