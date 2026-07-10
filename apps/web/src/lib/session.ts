import { cookies } from 'next/headers';

const SESSION_COOKIE = 'sc_session';

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: decodeJwtExpiry(token),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

function decodeJwtExpiry(token: string): Date {
  const payload = token.split('.')[1];
  if (!payload) {
    throw new Error('Malformed JWT: missing payload segment');
  }
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
    exp: number;
  };
  return new Date(decoded.exp * 1000);
}
