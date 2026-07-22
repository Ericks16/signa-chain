import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { onboardIssuer } from './utils/api';
import { WEB_URL } from './constants';

test.describe('Ciclo de vida completo de una credencial', () => {
  test('emitir, revocar y verificar de principio a fin', async ({ page, request }) => {
    // 1. Holder registers through the real UI — we capture their real did:key.
    const holderEmail = `holder-${randomUUID()}@example.com`;
    const holderPassword = 'Holder-Lifecycle-123!';

    await page.goto('/wallet/register');
    await page.getByLabel('Nombre completo').fill('Holder Lifecycle');
    await page.getByLabel('Correo').fill(holderEmail);
    await page.getByLabel('Contraseña').fill(holderPassword);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(`${WEB_URL}/wallet`);

    const holderDid = (await page.getByTestId('holder-did').textContent())?.trim();
    expect(holderDid).toMatch(/^did:key:/);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(`${WEB_URL}/wallet/login`);

    // 2. Issuer onboarded via the API (no onboarding UI exists yet) logs in through the real UI.
    const issuer = await onboardIssuer(request);

    await page.goto('/portal/login');
    await page.getByLabel('Correo').fill(issuer.email);
    await page.getByLabel('Contraseña').fill(issuer.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(`${WEB_URL}/portal`);

    // 3. Issue a credential to that holder's DID.
    await page.getByRole('link', { name: 'Emitir credencial' }).click();
    await expect(page).toHaveURL(`${WEB_URL}/portal/issue`);

    await page.getByLabel('DID del titular').fill(holderDid!);
    await page.getByLabel('Nombres').fill('Ana');
    await page.getByLabel('Apellidos').fill('Test');
    await page.getByLabel('Tipo de título').selectOption('bachelor');
    await page.getByLabel('Nombre del título').fill('Ingeniería de Software');
    await page.getByLabel('Institución').fill('Universidad E2E');
    await page.getByLabel('Fecha de graduación').fill('2024-01-15');
    await page.getByRole('button', { name: 'Emitir credencial' }).click();

    await expect(page).toHaveURL(`${WEB_URL}/portal`);
    await expect(page.getByTestId('credential-status')).toHaveText('Emitida');

    const credentialHref = await page.getByTestId('credential-link').getAttribute('href');
    expect(credentialHref).toBeTruthy();

    // 4. Revoke it from the issuer portal.
    await page.getByRole('button', { name: 'Revocar' }).click();
    await expect(page.getByTestId('credential-status')).toHaveText('Revocada');

    // 5. Public verification page reflects the revocation.
    await page.goto(credentialHref!);
    await expect(page.getByText('Revocada', { exact: true })).toBeVisible();
    await expect(
      page.getByText('El emisor revocó esta credencial. Ya no debe considerarse válida.'),
    ).toBeVisible();

    // 6. The holder's own wallet reflects it too.
    await page.goto('/wallet/login');
    await page.getByLabel('Correo').fill(holderEmail);
    await page.getByLabel('Contraseña').fill(holderPassword);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(`${WEB_URL}/wallet`);
    await expect(page.getByTestId('credential-status')).toHaveText('Revocada');
  });
});
