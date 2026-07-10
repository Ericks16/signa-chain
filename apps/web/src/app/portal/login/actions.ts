'use server';

import { redirect } from 'next/navigation';
import { setSessionCookie } from '../../../lib/session';

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return { error: 'Correo y contraseña son requeridos.' };
  }

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'No se pudo conectar con el servidor. Intenta de nuevo.' };
  }

  if (!res.ok) {
    return { error: 'Credenciales inválidas.' };
  }

  const data = (await res.json()) as { accessToken: string };
  await setSessionCookie(data.accessToken);
  redirect('/portal');
}
