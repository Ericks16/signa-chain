'use client';

import { useActionState } from 'react';
import { issueCredential, type IssueState } from './actions';

const initialState: IssueState = {};

const DEGREE_TYPES = [
  { value: 'bachelor', label: 'Licenciatura' },
  { value: 'master', label: 'Maestría' },
  { value: 'doctorate', label: 'Doctorado' },
  { value: 'certificate', label: 'Certificado' },
  { value: 'diploma', label: 'Diploma' },
] as const;

export function IssueForm(): React.ReactElement {
  const [state, formAction, pending] = useActionState(issueCredential, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <Field label="DID del titular" name="subjectDid" placeholder="did:key:..." required />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombres" name="givenName" required />
        <Field label="Apellidos" name="familyName" required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="degreeType" className="text-sm text-muted">
          Tipo de título
        </label>
        <select
          id="degreeType"
          name="degreeType"
          required
          className="rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent-blue focus:outline-none"
        >
          {DEGREE_TYPES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <Field label="Nombre del título" name="degreeName" required />
      <Field label="Institución" name="institution" required />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Fecha de graduación" name="graduationDate" type="date" required />
        <Field label="Fecha de expiración (opcional)" name="expirationDate" type="date" />
      </div>
      <Field label="Honores (opcional)" name="honors" />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent-purple px-6 py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Emitiendo…' : 'Emitir credencial'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-surface px-4 py-2 text-foreground focus:border-accent-blue focus:outline-none"
      />
    </div>
  );
}
