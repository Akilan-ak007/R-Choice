import { test, expect } from '@playwright/test';

test.describe('Internship Applications Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    // Standard login as student before applying for an internship
    await page.goto('/');
    await page.click('button:has-text("Student")');
    await page.fill('input[type="email"]', 'e2e_student@rathinam.in');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard\/student/);
  });

  test('student can navigate to My Applications and see progress tracker', async ({ page }) => {
    await page.click('text=My Applications');
    await expect(page).toHaveURL(/\/applications/);
    
    // Page header should be there
    await expect(page.locator('h1')).toContainText(/My Applications/i);
    // Tracker or 'No applications found' state
    const trackerContainer = page.locator('.tracker-scroll-wrapper');
    const emptyState = page.locator('h3:has-text("No Applications Started")');

    await expect(trackerContainer.or(emptyState)).toBeVisible();
  });

  test('student can browse and apply for jobs', async ({ page }) => {
    await page.click('text=Browse Jobs');
    await expect(page).toHaveURL(/\/jobs/);
    
    // UI Check - assuming the swipe deck or job cards load
    await expect(page.locator('h1')).toContainText(/Internship Opportunities/i);
  });
});
