'use server';

import { redirect } from 'next/navigation';
import { getSessionToken } from '../../../lib/session';

export interface IssueState {
  error?: string;
}

export async function issueCredential(
  _prevState: IssueState,
  formData: FormData,
): Promise<IssueState> {
  const token = await getSessionToken();
  if (!token) {
    redirect('/portal/login');
  }

  const subjectDid = formData.get('subjectDid');
  const givenName = formData.get('givenName');
  const familyName = formData.get('familyName');
  const degreeType = formData.get('degreeType');
  const degreeName = formData.get('degreeName');
  const institution = formData.get('institution');
  const graduationDate = formData.get('graduationDate');
  const honors = formData.get('honors');
  const expirationDate = formData.get('expirationDate');

  if (
    typeof subjectDid !== 'string' ||
    !subjectDid ||
    typeof givenName !== 'string' ||
    !givenName ||
    typeof familyName !== 'string' ||
    !familyName ||
    typeof degreeType !== 'string' ||
    !degreeType ||
    typeof degreeName !== 'string' ||
    !degreeName ||
    typeof institution !== 'string' ||
    !institution ||
    typeof graduationDate !== 'string' ||
    !graduationDate
  ) {
    return { error: 'Completa todos los campos requeridos.' };
  }

  const payload: Record<string, unknown> = {
    subjectDid,
    givenName,
    familyName,
    degreeType,
    degreeName,
    institution,
    graduationDate: new Date(graduationDate).toISOString(),
  };
  if (typeof honors === 'string' && honors) {
    payload['honors'] = honors;
  }
  if (typeof expirationDate === 'string' && expirationDate) {
    payload['expirationDate'] = new Date(expirationDate).toISOString();
  }

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/v1/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch {
    return { error: 'No se pudo conectar con el servidor. Intenta de nuevo.' };
  }

  if (res.status === 401) {
    redirect('/portal/login');
  }

  if (!res.ok) {
    return { error: 'No se pudo emitir la credencial. Revisa los datos ingresados.' };
  }

  redirect('/portal');
}
