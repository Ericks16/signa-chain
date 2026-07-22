import { test, expect } from '@playwright/test';
import { onboardIssuer } from './utils/api';
import { WEB_URL } from './constants';

test.describe('Issuer portal', () => {
  test('login via UI entra al dashboard', async ({ page, request }) => {
    const issuer = await onboardIssuer(request);

    await page.goto('/portal/login');
    await page.getByLabel('Correo').fill(issuer.email);
    await page.getByLabel('Contraseña').fill(issuer.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(`${WEB_URL}/portal`);
    await expect(page.getByText('Todavía no has emitido ninguna credencial.')).toBeVisible();
    await expect(page.getByTestId('issuer-did')).toContainText('did:key:');
  });

  test('acceso sin sesion redirige a login', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL(`${WEB_URL}/portal/login`);
  });

  test('cookie de sesion invalida redirige sin crashear (regresion)', async ({ page, context }) => {
    await context.addCookies([{ name: 'sc_session', value: 'not-a-real-jwt', url: WEB_URL }]);

    const response = await page.goto('/portal');

    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(`${WEB_URL}/portal/login`);
  });

  test('credenciales invalidas muestran error sin redirigir', async ({ page }) => {
    await page.goto('/portal/login');
    await page.getByLabel('Correo').fill('nadie@example.com');
    await page.getByLabel('Contraseña').fill('wrong-password');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText('Credenciales inválidas.')).toBeVisible();
    await expect(page).toHaveURL(`${WEB_URL}/portal/login`);
  });
});
