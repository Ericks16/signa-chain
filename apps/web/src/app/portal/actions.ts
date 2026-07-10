'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { clearSessionCookie, getSessionToken } from '../../lib/session';

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/portal/login');
}

export async function revokeAction(formData: FormData): Promise<void> {
  const credentialId = formData.get('credentialId');
  if (typeof credentialId !== 'string' || !credentialId) {
    return;
  }

  const token = await getSessionToken();
  if (!token) {
    redirect('/portal/login');
  }

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
  await fetch(`${apiUrl}/v1/credentials/${encodeURIComponent(credentialId)}/revoke`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  revalidatePath('/portal');
}
