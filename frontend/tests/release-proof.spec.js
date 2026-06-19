import { expect, test } from '@playwright/test';

const password = 'SecurePass123';

const makeEmail = (suffix) => `release_${Date.now()}_${suffix}@example.com`;

const signIn = async (page, email) => {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Release Proof User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
};

test.describe('release proof', () => {
  test('captures core screens and responsive views', async ({ page }) => {
    const email = makeEmail('core');
    await signIn(page, email);

    const shots = [
      { name: 'dashboard', path: '/dashboard' },
      { name: 'profile', path: '/profile' },
      { name: 'sales', path: '/leads' },
      { name: 'marketing', path: '/marketing' },
      { name: 'support', path: '/support' },
      { name: 'analytics', path: '/analytics' },
      { name: 'memory', path: '/memory' },
      { name: 'knowledge', path: '/knowledge' },
      { name: 'prompt-studio', path: '/prompts' },
      { name: 'workflow-builder', path: '/workflow-builder' },
      { name: 'monitoring', path: '/monitoring' },
      { name: 'business-insights', path: '/insights' }
    ];

    for (const shot of shots) {
      await page.goto(shot.path);
      await expect(page.getByRole('heading').first()).toBeVisible();
      await page.screenshot({ path: `../docs/browser-proof/${shot.name}.png`, fullPage: true });
    }

    await page.goto('/workflow-builder');
    await page.screenshot({ path: '../docs/browser-proof/workflow-demo.png', fullPage: true });

    await page.goto('/dashboard');
    await page.screenshot({ path: '../docs/browser-proof/logout-ready.png', fullPage: true });
  });

  for (const size of [
    { width: 320, height: 900, name: 'phone' },
    { width: 390, height: 900, name: 'phone-wide' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1024, height: 1200, name: 'tablet-large' },
    { width: 1440, height: 1200, name: 'desktop' },
    { width: 1920, height: 1300, name: 'wide-desktop' }
  ]) {
    test(`responsive check ${size.name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
      const page = await context.newPage();
      await signIn(page, makeEmail(size.name));
      await page.goto('/dashboard');
      await expect(page.getByRole('heading', { name: /Good to see you/i })).toBeVisible();
      await page.screenshot({ path: `../docs/browser-proof/${size.name}-dashboard.png`, fullPage: true });
      await page.goto('/workflow-builder');
      await page.screenshot({ path: `../docs/browser-proof/${size.name}-builder.png`, fullPage: true });
      await page.goto('/monitoring');
      await page.screenshot({ path: `../docs/browser-proof/${size.name}-monitoring.png`, fullPage: true });
      await context.close();
    });
  }
});
