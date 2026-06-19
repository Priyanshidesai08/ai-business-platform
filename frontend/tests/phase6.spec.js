import { expect, test } from '@playwright/test';

const email = `phase6_${Date.now()}@example.com`;
const password = 'SecurePass123';

test('workflow builder no-code page supports node creation and restore', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Phase Six User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });

  await page.getByRole('link', { name: 'No-code Builder' }).click();
  await expect(page.getByRole('heading', { name: 'Workflow Builder' })).toBeVisible();

  await page.getByRole('button', { name: 'Agent Node' }).click();
  await expect(page.getByText('Agent Node')).toBeVisible();

  await page.getByRole('button', { name: 'Save workflow' }).click();
  await page.reload();
  await expect(page.getByText('Agent Node')).toBeVisible();

  await expect(page.getByRole('button', { name: 'View JSON' })).toBeVisible();

  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.getByText('completed')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.getByRole('button', { name: 'Stop' }).click();
});
