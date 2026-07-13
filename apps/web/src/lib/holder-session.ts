import { cookies } from 'next/headers';
import { decodeJwtExpiry } from './session';

const HOLDER_SESSION_COOKIE = 'sc_holder_session';

export async function getHolderSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(HOLDER_SESSION_COOKIE)?.value;
}

export async function setHolderSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(HOLDER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: decodeJwtExpiry(token),
  });
}

export async function clearHolderSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(HOLDER_SESSION_COOKIE);
}
