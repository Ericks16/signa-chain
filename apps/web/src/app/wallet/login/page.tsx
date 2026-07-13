import Link from 'next/link';
import { LoginForm } from './login-form';

// See apps/web/src/app/page.tsx for why this must be forced dynamic (CSP nonce).
export const dynamic = 'force-dynamic';

export default function WalletLoginPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold tracking-tight">Mi billetera</h1>
      <LoginForm />
      <p className="text-sm text-muted">
        ¿No tienes cuenta?{' '}
        <Link href="/wallet/register" className="text-accent-blue hover:underline">
          Créala aquí
        </Link>
      </p>
    </main>
  );
}
