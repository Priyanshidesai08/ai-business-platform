import { expect, test } from '@playwright/test';

const uniqueEmail = `phase1_${Date.now()}@example.com`;
const password = 'SecurePass123';

test('register, login, persist session, and block unauthorized users', async ({ page, context }) => {
  await page.goto('/register');

  await page.getByLabel('Full name').fill('Phase One User');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Welcome, Phase One User/i })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Welcome, Phase One User/i })).toBeVisible();
  await expect(page.locator('main')).toContainText(uniqueEmail);

  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Account details' })).toBeVisible();

  await context.addInitScript(() => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
  });

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});
