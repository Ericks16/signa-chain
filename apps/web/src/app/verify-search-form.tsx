'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function VerifySearchForm(): React.ReactElement {
  const router = useRouter();
  const [credentialId, setCredentialId] = useState('');

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    const trimmed = credentialId.trim();
    if (!trimmed) return;
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-2">
      <input
        type="text"
        value={credentialId}
        onChange={(e) => setCredentialId(e.target.value)}
        placeholder="urn:uuid:..."
        className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent-blue focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-lg bg-accent-purple px-6 py-2 font-semibold text-white transition hover:opacity-90"
      >
        Verificar
      </button>
    </form>
  );
}
