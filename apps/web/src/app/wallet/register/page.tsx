import Link from 'next/link';
import { RegisterForm } from './register-form';

// See apps/web/src/app/page.tsx for why this must be forced dynamic (CSP nonce).
export const dynamic = 'force-dynamic';

export default function WalletRegisterPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold tracking-tight">Crea tu billetera</h1>
      <RegisterForm />
      <p className="text-sm text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/wallet/login" className="text-accent-blue hover:underline">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
