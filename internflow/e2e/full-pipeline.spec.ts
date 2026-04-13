import { test, expect, Page } from '@playwright/test';

// Helper for logging in
async function loginAs(page: Page, email: string, roleName: string, password = 'R-Choice@2025') {
  await page.goto('/');
  
  // Select the role using the 3D carousel first or it will clear inputs!
  const roleButton = page.locator(`button[type="button"]:has-text("${roleName}")`);
  if (await roleButton.isVisible()) {
      await roleButton.click();
  } else {
      await roleButton.scrollIntoViewIfNeeded();
      await roleButton.click({ force: true });
  }

  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Click login
  await page.click('button[type="submit"]');
  // Wait for login to complete and redirect to dashboard using expect which handles SPA navigation
  await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
}

// Ensure unique email per run
const randomId = Math.floor(Math.random() * 100000);
const companyEmail = `mega.corp${randomId}@test.com`;

test.describe('Full Pipeline - Mega Flow', () => {

  test('Company Registers -> PO Approves Job -> Student Applies -> Full Hierarchy Approves', async ({ page, browser }) => {
    test.setTimeout(180000); // 3 minutes timeout due to many context switches

    // --- 1. Company Registration ---
    await page.goto('/register/company');
    await page.fill('input[name="companyName"]', `Mega Corp ${randomId}`);
    await page.fill('input[name="industry"]', 'Technology');
    await page.fill('input[name="website"]', 'https://megacorp.test');
    await page.fill('input[name="hrName"]', 'HR Boss');
    await page.fill('input[name="hrPhone"]', '1234567890');
    await page.fill('input[name="email"]', companyEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/\?message=registered/);

    // --- 2. Company Posts Job ---
    await loginAs(page, companyEmail, 'Company', 'password123');
    await page.goto('/jobs/create');
    await page.fill('input[name="title"]', 'E2E Testing Intern');
    await page.fill('input[name="location"]', 'Remote');
    await page.fill('textarea[name="description"]', 'Write amazing e2e tests.');
    await page.fill('input[name="deadline"]', '2026-12-31');
    await page.click('button[type="submit"]');

    // Wait for redirect to /jobs/manage
    await expect(page).toHaveURL(/\/jobs\/manage/);
    await expect(page.locator('text=E2E Testing Intern')).toBeVisible();

    // Verify it says "PENDING_REVIEW"
    await expect(page.locator('text=PENDING_REVIEW')).toBeVisible();
    await page.context().clearCookies(); // Log out

    // --- 3. Placement Officer Approves Job ---
    await loginAs(page, 'po@rathinam.edu.in', 'Placement Officer');
    await page.goto('/approvals/jobs');
    await expect(page.locator('text=E2E Testing Intern')).toBeVisible();
    
    // Click approve
    const approveBtnJob = page.locator('button:has-text("Approve")').first();
    await approveBtnJob.click();
    
    // Wait for the job to disappear from pending list
    await expect(page.locator('text=E2E Testing Intern')).not.toBeVisible();
    await page.context().clearCookies();

    // --- 4. Student Applies ---
    await loginAs(page, 'akilank.bcs24@rathinam.in', 'Student');
    await page.goto('/jobs');
    
    // The job should now be visible
    await expect(page.locator('text=E2E Testing Intern')).toBeVisible();
    
    // Click View Details and Apply
    // Assuming there's a view details or apply button
    const applyBtn = page.locator('button:has-text("Apply")');
    if (await applyBtn.isVisible()) {
        await applyBtn.click();
    }
    
    // Check applications page shows it's at 'PENDING_TUTOR' or 'Pending Staff'
    await page.goto('/applications');
    await expect(page.locator('text=E2E Testing Intern')).toBeVisible();
    await page.context().clearCookies();

    // --- 5. Tutor Approves ---
    await loginAs(page, 'tutor@rathinam.edu.in', 'Tutor');
    await page.goto('/approvals');
    // We expect akilan to be here
    await expect(page.locator('text=AKILAN')).toBeVisible();
    await page.click('button:has-text("Approve")');
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 6. Coordinator Approves ---
    await loginAs(page, 'pc@rathinam.edu.in', 'Placement Coordinator');
    await page.goto('/approvals');
    await expect(page.locator('text=AKILAN')).toBeVisible();
    await page.click('button:has-text("Approve")');
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 7. HOD Approves ---
    await loginAs(page, 'hod@rathinam.edu.in', 'HOD');
    await page.goto('/approvals');
    await expect(page.locator('text=AKILAN')).toBeVisible();
    await page.click('button:has-text("Approve")');
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 8. Dean Approves ---
    await loginAs(page, 'dean@rathinam.edu.in', 'Dean');
    await page.goto('/approvals');
    await expect(page.locator('text=AKILAN')).toBeVisible();
    await page.click('button:has-text("Approve")');
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 9. PO Approves (Again for the request!) ---
    await loginAs(page, 'po@rathinam.edu.in', 'Placement Officer');
    await page.goto('/approvals');
    await expect(page.locator('text=AKILAN')).toBeVisible();
    await page.click('button:has-text("Approve")');
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 10. Principal Approves ---
    await loginAs(page, 'principal@rathinam.edu.in', 'Principal');
    await page.goto('/approvals');
    await expect(page.locator('text=AKILAN')).toBeVisible();
    await page.click('button:has-text("Approve")');
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 11. Student Views Final Tracker ---
    await loginAs(page, 'akilank.bcs24@rathinam.in', 'Student');
    await page.goto('/applications');
    
    // Check if the final status badge says "Approved"
    await expect(page.locator('span.badge-success:has-text("Approved")')).toBeVisible();
    // The print bonafide link should now be visible
    await expect(page.locator('text=Print Bonafide')).toBeVisible();
  });
});
