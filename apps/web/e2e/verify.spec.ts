import { test, expect } from '@playwright/test';

test.describe('Verificación pública', () => {
  test('muestra "no encontrada" para un id que no existe', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('urn:uuid:...').fill('urn:uuid:00000000-0000-0000-0000-000000000000');
    await page.getByRole('button', { name: 'Verificar' }).click();

    await expect(page).toHaveURL(/\/verify\//);
    await expect(
      page.getByText('No encontramos ninguna credencial con este identificador.'),
    ).toBeVisible();
  });
});
