'use client';

import { useActionState } from 'react';
import { anchorBatchAction, type AnchorBatchState } from './actions';

const initialState: AnchorBatchState = {};

export function AnchorBatchButton(): React.ReactElement {
  const [state, formAction, pending] = useActionState(anchorBatchAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg border border-border bg-surface px-6 py-2 font-semibold text-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Anclando…' : 'Anclar pendientes on-chain'}
      </button>
      {state.error && <p className="text-sm text-muted">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
    </form>
  );
}
