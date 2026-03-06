import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

type AdminJwtPayload = {
  role: 'admin';
  iat: number;
  exp: number;
};

export async function signAdminJwt(): Promise<string> {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminJwtPayload = {
    role: 'admin',
    iat: now,
    exp: now + 60 * 60 * 8,
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

export function verifyAdminJwt(token: string): boolean {
  if (!JWT_SECRET) return false;

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any;
    return decoded?.role === 'admin';
  } catch {
    return false;
  }
}
