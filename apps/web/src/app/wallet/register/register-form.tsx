'use client';

import { useActionState } from 'react';
import { register, type RegisterState } from './actions';

const initialState: RegisterState = {};

export function RegisterForm(): React.ReactElement {
  const [state, formAction, pending] = useActionState(register, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-muted">
          Nombre completo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent-blue focus:outline-none"
        />
      </div>
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
          minLength={8}
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
        {pending ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  );
}
