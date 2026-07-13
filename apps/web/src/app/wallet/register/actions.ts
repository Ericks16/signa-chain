'use server';

import { redirect } from 'next/navigation';
import { setHolderSessionCookie } from '../../../lib/holder-session';

export interface RegisterState {
  error?: string;
}

export async function register(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = formData.get('email');
  const password = formData.get('password');
  const name = formData.get('name');

  if (
    typeof email !== 'string' ||
    !email ||
    typeof password !== 'string' ||
    !password ||
    typeof name !== 'string' ||
    !name
  ) {
    return { error: 'Todos los campos son requeridos.' };
  }

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/v1/holders/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      cache: 'no-store',
    });
  } catch {
    return { error: 'No se pudo conectar con el servidor. Intenta de nuevo.' };
  }

  if (res.status === 409) {
    return { error: 'Ese correo ya está registrado.' };
  }

  if (!res.ok) {
    return { error: 'No se pudo completar el registro. Revisa los datos ingresados.' };
  }

  const data = (await res.json()) as { accessToken: string };
  await setHolderSessionCookie(data.accessToken);
  redirect('/wallet');
}
