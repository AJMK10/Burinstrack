import { test, expect } from '@playwright/test';

test.describe('Navigation principale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        state: {
          user: {
            id: '1',
            email: 'admin@burinfort.com',
            nomComplet: 'Administrateur Test',
            roles: ['Administrateur'],
          },
        },
        version: 0,
      }));
    });
    await page.goto('/');
    await page.waitForSelector('nav', { timeout: 15000 });
  });

  test('accède à la page Clients', async ({ page }) => {
    await page.getByRole('link', { name: 'Clients', exact: true }).click();
    await expect(page).toHaveURL(/\/clients/);
  });

  test('accède à la page Copieurs', async ({ page }) => {
    await page.getByRole('link', { name: /parc copieurs/i }).click();
    await expect(page).toHaveURL(/\/copieurs/);
  });

  test('accède à la page Interventions', async ({ page }) => {
    await page.getByRole('link', { name: 'Interventions', exact: true }).click();
    await expect(page).toHaveURL(/\/interventions/);
  });

  test('affiche le tableau de bord par défaut', async ({ page }) => {
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  });
});
