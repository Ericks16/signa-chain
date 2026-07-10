import { IssueForm } from './issue-form';

// See apps/web/src/app/page.tsx for why this must be forced dynamic (CSP nonce).
export const dynamic = 'force-dynamic';

export default function IssuePage(): React.ReactElement {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold tracking-tight">Emitir credencial</h1>
      <IssueForm />
    </main>
  );
}
