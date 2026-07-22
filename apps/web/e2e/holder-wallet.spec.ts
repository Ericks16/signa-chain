import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { WEB_URL } from './constants';

test.describe('Holder wallet', () => {
  test('registro crea sesion y muestra la wallet vacia', async ({ page }) => {
    const email = `holder-${randomUUID()}@example.com`;

    await page.goto('/wallet/register');
    await page.getByLabel('Nombre completo').fill('Ana Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('Holder-Password-123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page).toHaveURL(`${WEB_URL}/wallet`);
    await expect(page.getByText('Ana Test')).toBeVisible();
    await expect(page.getByText('Todavía no tienes ninguna credencial.')).toBeVisible();
    await expect(page.getByTestId('holder-did')).toContainText('did:key:');
  });

  test('email duplicado muestra error sin crashear', async ({ page }) => {
    const email = `holder-${randomUUID()}@example.com`;

    await page.goto('/wallet/register');
    await page.getByLabel('Nombre completo').fill('Primer Registro');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('Holder-Password-123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(`${WEB_URL}/wallet`);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(`${WEB_URL}/wallet/login`);

    await page.goto('/wallet/register');
    await page.getByLabel('Nombre completo').fill('Segundo Registro');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('Other-Password-123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByText('Ese correo ya está registrado.')).toBeVisible();
    await expect(page).toHaveURL(`${WEB_URL}/wallet/register`);
  });

  test('acceso sin sesion redirige a login', async ({ page }) => {
    await page.goto('/wallet');
    await expect(page).toHaveURL(`${WEB_URL}/wallet/login`);
  });

  test('cookie de sesion invalida redirige sin crashear (regresion)', async ({ page, context }) => {
    await context.addCookies([
      { name: 'sc_holder_session', value: 'not-a-real-jwt', url: WEB_URL },
    ]);

    const response = await page.goto('/wallet');

    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(`${WEB_URL}/wallet/login`);
  });

  test('logout limpia la sesion', async ({ page }) => {
    const email = `holder-${randomUUID()}@example.com`;

    await page.goto('/wallet/register');
    await page.getByLabel('Nombre completo').fill('Logout Test');
    await page.getByLabel('Correo').fill(email);
    await page.getByLabel('Contraseña').fill('Holder-Password-123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(`${WEB_URL}/wallet`);

    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(`${WEB_URL}/wallet/login`);

    await page.goto('/wallet');
    await expect(page).toHaveURL(`${WEB_URL}/wallet/login`);
  });
});
