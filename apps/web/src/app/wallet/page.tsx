import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Holder, VerifiableCredential } from '@signa-chain/types';
import { getHolderSessionToken } from '../../lib/holder-session';
import { logoutAction } from './actions';

interface CredentialRecord {
  id: string;
  credentialId: string;
  status: 'issued' | 'revoked';
  createdAt: string;
  vc: VerifiableCredential;
  merkleRoot: string | null;
}

async function apiFetch(path: string, token: string): Promise<Response> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
  return fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

function credentialLabel(vc: VerifiableCredential): string {
  const subject = vc.credentialSubject;
  const degreeName = subject['degreeName'];
  const institution = subject['institution'];
  if (typeof degreeName === 'string' && typeof institution === 'string') {
    return `${degreeName} — ${institution}`;
  }
  return vc.type.filter((t) => t !== 'VerifiableCredential').join(', ') || 'Credencial';
}

export default async function WalletPage(): Promise<React.ReactElement> {
  const token = await getHolderSessionToken();
  if (!token) {
    redirect('/wallet/login');
  }

  const [meRes, credsRes] = await Promise.all([
    apiFetch('/v1/holders/me', token),
    apiFetch('/v1/holders/me/credentials', token),
  ]);

  if (meRes.status === 401 || credsRes.status === 401) {
    // Cookies can't be mutated during a Server Component render (only in a
    // Server Action/Route Handler) — the stale cookie gets overwritten on
    // the next successful login instead.
    redirect('/wallet/login');
  }

  const holder = (await meRes.json()) as Holder;
  const credentials = (await credsRes.json()) as CredentialRecord[];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{holder.name}</h1>
          <p className="font-mono text-xs text-muted">{holder.did}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Mis credenciales</h2>
        {credentials.length === 0 && (
          <p className="text-sm text-muted">Todavía no tienes ninguna credencial.</p>
        )}
        {credentials.map((cred) => (
          <div
            key={cred.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm text-foreground">{credentialLabel(cred.vc)}</p>
              <Link
                href={`/verify/${encodeURIComponent(cred.credentialId)}`}
                className="break-all font-mono text-xs text-accent-blue hover:underline"
              >
                {cred.credentialId}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {cred.merkleRoot && (
                <span
                  className="rounded-full bg-accent-blue/10 px-3 py-1 text-xs text-accent-blue"
                  title={`Merkle root: ${cred.merkleRoot}`}
                >
                  Anclada on-chain
                </span>
              )}
              <span
                className={
                  cred.status === 'issued'
                    ? 'rounded-full bg-success/10 px-3 py-1 text-xs text-success'
                    : 'rounded-full bg-danger/10 px-3 py-1 text-xs text-danger'
                }
              >
                {cred.status === 'issued' ? 'Válida' : 'Revocada'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
