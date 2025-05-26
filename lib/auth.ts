import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function signAdminJwt(): string {
  return jwt.sign(
    { role: 'admin' },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '8h' }
  );
}

export function verifyAdminJwt(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any;
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}
