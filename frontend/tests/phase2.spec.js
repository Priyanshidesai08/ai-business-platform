import { expect, test } from '@playwright/test';

const email = `phase2_${Date.now()}@example.com`;
const password = 'SecurePass123';

test('phase 2 module pages load after login', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Phase Two User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole('link', { name: 'Leads' }).click();
  await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible();

  await page.getByRole('link', { name: 'Marketing' }).click();
  await expect(page.getByRole('heading', { name: 'Campaign Dashboard' })).toBeVisible();

  await page.getByRole('link', { name: 'Support' }).click();
  await expect(page.getByRole('heading', { name: 'Support Console' })).toBeVisible();

  await page.getByRole('link', { name: 'Analytics' }).click();
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();

  await page.getByRole('link', { name: 'AI Studio' }).click();
  await expect(page.getByRole('heading', { name: 'AI Studio' })).toBeVisible();
});
