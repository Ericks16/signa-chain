import Link from 'next/link';
import type { VerificationResult } from '@signa-chain/types';
import { StatusBadge } from './status-badge';

async function fetchVerification(
  credentialId: string,
): Promise<{ kind: 'found'; result: VerificationResult } | { kind: 'not_found' } | { kind: 'error' }> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/v1/verify/${credentialId}`, { cache: 'no-store' });
  } catch {
    return { kind: 'error' };
  }

  if (res.status === 404) {
    return { kind: 'not_found' };
  }
  if (!res.ok) {
    return { kind: 'error' };
  }

  const result = (await res.json()) as VerificationResult;
  return { kind: 'found', result };
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ credentialId: string }>;
}): Promise<React.ReactElement> {
  const { credentialId } = await params;
  const outcome = await fetchVerification(credentialId);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Verificar otra credencial
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">Resultado de verificación</h1>
      <p className="break-all rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm text-muted">
        {credentialId}
      </p>

      {outcome.kind === 'not_found' && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-muted">
          No encontramos ninguna credencial con este identificador.
        </div>
      )}

      {outcome.kind === 'error' && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-warning">
          No pudimos completar la verificación en este momento. Intenta de nuevo más tarde.
        </div>
      )}

      {outcome.kind === 'found' && (
        <>
          <StatusBadge status={outcome.result.status} />

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <dt className="text-muted">Emisor</dt>
            <dd>{outcome.result.issuerName ?? outcome.result.issuerId}</dd>
            <dt className="text-muted">Verificado el</dt>
            <dd>{new Date(outcome.result.checkedAt).toLocaleString('es-EC')}</dd>
          </dl>

          <div className="flex flex-col gap-2">
            {outcome.result.details.map((detail) => (
              <div
                key={detail.check}
                className="flex items-start gap-2 text-sm text-muted"
              >
                <span aria-hidden>{detail.passed ? '✓' : '✗'}</span>
                <span>{detail.message}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
