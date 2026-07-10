import { LoginForm } from './login-form';

// See apps/web/src/app/page.tsx for why this must be forced dynamic (CSP nonce).
export const dynamic = 'force-dynamic';

export default function LoginPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold tracking-tight">Portal del emisor</h1>
      <LoginForm />
    </main>
  );
}
