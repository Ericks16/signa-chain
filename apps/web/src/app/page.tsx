import { VerifySearchForm } from './verify-search-form';

// Forced dynamic so the per-request CSP nonce set in middleware.ts actually
// reaches this page's inline hydration scripts (a statically prerendered
// page bakes in a stale nonce that never matches the header on a real request).
export const dynamic = 'force-dynamic';

export default function HomePage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">SIGNA CHAIN</h1>
      <p className="max-w-md text-lg text-muted">
        Verifica cualquier diploma o certificado en segundos, sin llamar a la universidad.
      </p>
      <VerifySearchForm />
    </main>
  );
}
