import { test, expect } from '@playwright/test';

test.describe('Page de connexion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('affiche le formulaire de connexion', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /bon retour/i })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#motDePasse')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('affiche une erreur avec des identifiants invalides', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Identifiants invalides."}' })
    );

    await page.locator('#email').fill('inconnu@burinfort.com');
    await page.locator('#motDePasse').fill('MauvaisMotDePasse1!');
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('redirige vers le dashboard après connexion réussie', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'fake-token',
          refreshToken: 'fake-refresh',
          user: { id: '1', email: 'admin@burinfort.com', nomComplet: 'Admin', roles: ['Administrateur'] },
        }),
      })
    );

    await page.locator('#email').fill('admin@burinfort.com');
    await page.locator('#motDePasse').fill('BurinTrack@2026!');
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page).not.toHaveURL(/login/, { timeout: 5000 });
  });

  test('champ email valide le format email', async ({ page }) => {
    await page.locator('#email').fill('pasunemail');
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page.getByText(/adresse e-mail invalide/i)).toBeVisible({ timeout: 3000 });
  });
});
