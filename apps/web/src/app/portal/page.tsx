import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Issuer } from '@signa-chain/types';
import { getSessionToken } from '../../lib/session';
import { logoutAction } from './actions';
import { AnchorBatchButton } from './anchor-batch-button';
import { RevokeButton } from './revoke-button';

interface CredentialRecord {
  id: string;
  credentialId: string;
  subjectDid: string;
  status: 'issued' | 'revoked';
  createdAt: string;
  merkleRoot: string | null;
}

async function apiFetch(path: string, token: string): Promise<Response> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
  return fetch(`${apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

export default async function PortalPage(): Promise<React.ReactElement> {
  const token = await getSessionToken();
  if (!token) {
    redirect('/portal/login');
  }

  const [meRes, credsRes] = await Promise.all([
    apiFetch('/v1/issuer/me', token),
    apiFetch('/v1/credentials', token),
  ]);

  if (meRes.status === 401 || credsRes.status === 401) {
    // Cookies can't be mutated during a Server Component render (only in a
    // Server Action/Route Handler) — the stale cookie gets overwritten on
    // the next successful login instead.
    redirect('/portal/login');
  }

  const issuer = (await meRes.json()) as Issuer;
  const credentials = (await credsRes.json()) as CredentialRecord[];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{issuer.name}</h1>
          <p className="font-mono text-xs text-muted" data-testid="issuer-did">
            {issuer.did}
          </p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/portal/issue"
          className="w-fit rounded-lg bg-accent-purple px-6 py-2 font-semibold text-white transition hover:opacity-90"
        >
          Emitir credencial
        </Link>
        <AnchorBatchButton />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Credenciales emitidas</h2>
        {credentials.length === 0 && (
          <p className="text-sm text-muted">Todavía no has emitido ninguna credencial.</p>
        )}
        {credentials.map((cred) => (
          <div
            key={cred.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3"
          >
            <div className="flex flex-col gap-1">
              <Link
                href={`/verify/${encodeURIComponent(cred.credentialId)}`}
                data-testid="credential-link"
                className="break-all font-mono text-xs text-accent-blue hover:underline"
              >
                {cred.credentialId}
              </Link>
              <p className="text-xs text-muted">{cred.subjectDid}</p>
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
                data-testid="credential-status"
                className={
                  cred.status === 'issued'
                    ? 'rounded-full bg-success/10 px-3 py-1 text-xs text-success'
                    : 'rounded-full bg-danger/10 px-3 py-1 text-xs text-danger'
                }
              >
                {cred.status === 'issued' ? 'Emitida' : 'Revocada'}
              </span>
              {cred.status === 'issued' && <RevokeButton credentialId={cred.credentialId} />}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
