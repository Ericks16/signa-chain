'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';

const initialState: LoginState = {};

export function LoginForm(): React.ReactElement {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-muted">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent-blue focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-muted">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent-blue focus:outline-none"
        />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent-purple px-6 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
