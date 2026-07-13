'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { clearSessionCookie, getSessionToken } from '../../lib/session';

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/portal/login');
}

export interface AnchorBatchState {
  error?: string;
  success?: string;
}

export async function anchorBatchAction(
  _prevState: AnchorBatchState,
  _formData: FormData,
): Promise<AnchorBatchState> {
  const token = await getSessionToken();
  if (!token) {
    redirect('/portal/login');
  }

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/v1/anchoring/batch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return { error: 'No se pudo conectar con el servidor. Intenta de nuevo.' };
  }

  if (res.status === 401) {
    redirect('/portal/login');
  }

  if (res.status === 503) {
    return { error: 'El anclaje on-chain todavía no está configurado en este ambiente.' };
  }

  if (res.status === 404) {
    return { error: 'No hay credenciales pendientes de anclar.' };
  }

  if (!res.ok) {
    return { error: 'No se pudo anclar el lote de credenciales.' };
  }

  const data = (await res.json()) as { credentialCount: number; anchorTxHash: string };
  revalidatePath('/portal');
  return {
    success: `${data.credentialCount} credencial(es) anclada(s) — tx ${data.anchorTxHash.slice(0, 10)}…`,
  };
}

export interface RevokeState {
  error?: string;
}

export async function revokeAction(
  _prevState: RevokeState,
  formData: FormData,
): Promise<RevokeState> {
  const credentialId = formData.get('credentialId');
  if (typeof credentialId !== 'string' || !credentialId) {
    return { error: 'Credencial inválida.' };
  }

  const token = await getSessionToken();
  if (!token) {
    redirect('/portal/login');
  }

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/v1/credentials/${encodeURIComponent(credentialId)}/revoke`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    return { error: 'No se pudo conectar con el servidor. Intenta de nuevo.' };
  }

  if (res.status === 401) {
    redirect('/portal/login');
  }

  if (!res.ok) {
    return { error: 'No se pudo revocar la credencial. Intenta de nuevo.' };
  }

  revalidatePath('/portal');
  return {};
}
