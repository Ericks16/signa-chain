import { VerifySearchForm } from './verify-search-form';

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
