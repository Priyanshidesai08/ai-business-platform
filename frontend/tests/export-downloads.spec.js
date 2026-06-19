import { expect, test } from '@playwright/test';

const password = 'SecurePass123';

const email = `export_${Date.now()}@example.com`;

async function signIn(page) {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Export User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('download exports for analytics, marketing, and workflows', async ({ page }) => {
  await signIn(page);

  await page.goto('/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  const analyticsDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export/i }).click();
  const analyticsFile = await analyticsDownload;
  expect(analyticsFile.suggestedFilename()).toMatch(/analytics-export-/);

  await page.goto('/marketing');
  await expect(page.getByRole('heading', { name: /Campaign dashboard/i })).toBeVisible();
  await page.getByPlaceholder('audience').fill('B2B buyers');
  await page.getByPlaceholder('objective').fill('Launch quarterly campaign');
  await page.getByPlaceholder('tone').fill('confident');
  await page.getByPlaceholder('platform').fill('linkedin');
  await page.getByRole('button', { name: 'Campaign' }).nth(1).click();
  await expect(page.getByText('Generated content')).toBeVisible();
  const campaignDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export Campaign/i }).click();
  const campaignFile = await campaignDownload;
  expect(campaignFile.suggestedFilename()).toMatch(/campaign-export-/);

  await page.goto('/workflow/builder');
  const workflowDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export/i }).click();
  const workflowFile = await workflowDownload;
  expect(workflowFile.suggestedFilename()).toMatch(/workflow-builder\.json/);
});
