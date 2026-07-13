'use server';

import { redirect } from 'next/navigation';
import { clearHolderSessionCookie } from '../../lib/holder-session';

export async function logoutAction(): Promise<void> {
  await clearHolderSessionCookie();
  redirect('/wallet/login');
}
