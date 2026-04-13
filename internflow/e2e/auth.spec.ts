import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('should login successfully as student and redirect to student dashboard', async ({ page }) => {
    // Navigate to homepage/login
    await page.goto('/');

    // Select the Student role tab
    await page.click('button:has-text("Student")');

    // Target the inputs
    await page.fill('input[type="email"]', 'e2e_student@rathinam.in');
    await page.fill('input[type="password"]', 'password123');

    // Click submit
    await page.click('button[type="submit"]');

    // Wait for redirect and ensure dashboard loads
    await expect(page).toHaveURL(/\/dashboard\/student/);
    await expect(page.locator('h1')).toContainText(/Welcome back/i);
  });

  test('should lock out brute force attempts', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Student")');
    
    // Attempt 6 incorrect logins to trigger lock
    for (let i = 0; i < 6; i++) {
        await page.fill('input[type="email"]', 'e2e_student@rathinam.in');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
    }

    // Checking for brute-force lock message
    const errorToast = page.locator('.error'); 
    // Depending on exactly how the brute force error is shown (toast or UI text)
    await expect(page.locator('body')).toContainText(/locked/i);
  });

  test('should login as admin and access admin dashboard', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Dean")');
    await page.fill('input[type="email"]', 'e2e_admin@rathinam.in');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard\/admin/);
  });
});
