'use client';

import { useActionState } from 'react';
import { revokeAction, type RevokeState } from './actions';

const initialState: RevokeState = {};

export function RevokeButton({ credentialId }: { credentialId: string }): React.ReactElement {
  const [state, formAction, pending] = useActionState(revokeAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="credentialId" value={credentialId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-danger hover:underline disabled:opacity-50"
      >
        {pending ? 'Revocando…' : 'Revocar'}
      </button>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
