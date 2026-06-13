import { expect, test } from '@playwright/test';

const email = `collab_${Date.now()}@example.com`;
const password = 'SecurePass123';

test('collaboration page loads and shows orchestration controls', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Collaboration User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });

  await page.getByRole('link', { name: 'Collaboration' }).click();
  await expect(page.getByRole('heading', { name: 'Collaboration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Preview workflow' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run orchestration' })).toBeVisible();
  await expect(page.getByText('Orchestration stats')).toBeVisible();
  await expect(page.getByText('Workflow order', { exact: true })).toBeVisible();
});
