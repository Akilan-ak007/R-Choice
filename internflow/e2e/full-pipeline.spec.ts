import { test, expect, type Page, type Locator } from "@playwright/test";
import { TEST_ACCOUNTS, TEST_PASSWORD, loginAs } from "./helpers";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Ensure unique email per run
const randomId = Date.now() % 100000000;
const companyEmail = `mega.corp${randomId}@test.com`;
const jobTitle = `E2E Testing Intern ${randomId}`;

async function waitForApprovalRow(page: Page, companyToken: string, attempts = 6) {
  const row = page.locator("tr").filter({ hasText: companyToken }).first();
  for (let i = 0; i < attempts; i++) {
    if (await row.isVisible().catch(() => false)) {
      return row;
    }
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  }
  await expect(row).toBeVisible({ timeout: 5000 });
  return row;
}

async function approveRow(page: Page, row: Locator) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await row.getByRole("button", { name: /^approve$/i }).click();
    await page.getByRole("button", { name: /confirm approval/i }).click();

    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForLoadState("networkidle");

    if (!(await row.isVisible().catch(() => false))) {
      return;
    }
  }
  await expect(row).not.toBeVisible({ timeout: 15000 });
}

test.describe("Full Pipeline - Mega Flow", () => {

  // Clean old E2E test data before running
  test.beforeAll(async () => {
    try {
      const { neon } = require("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL!);
      // Delete old E2E test job applications and postings to prevent stale verification banners
      await sql`DELETE FROM job_applications WHERE job_id IN (SELECT id FROM job_postings WHERE title LIKE 'E2E Testing Intern%')`;
      await sql`DELETE FROM job_postings WHERE title LIKE 'E2E Testing Intern%'`;
      console.log('[TEST] Cleaned old E2E test data');
    } catch (e) {
      console.warn('[TEST] Could not clean old data:', e);
    }
  });

  test("Company Registers -> MCR Approves Job -> Student Applies -> Full Hierarchy Approves", async ({ page }) => {
    test.setTimeout(300000); // 5 minutes timeout due to many context switches
    const companyLoginEmail = TEST_ACCOUNTS.company;

    // --- 1. Company Registration (Bypassed) ---
    // Registration was moved to an MCR-invitation flow. We'll use the pre-seeded test company.

    // --- 2. Company Posts Job ---
    await loginAs(page, companyLoginEmail, "Company", /.*dashboard.*/);
    await page.goto("/jobs/create");
    await page.fill('input[name="title"]', jobTitle);
    await page.fill('input[name="location"]', "Remote");
    await page.fill('input[name="stipendInfo"]', "₹20,000/month");
    await page.fill('textarea[name="description"]', "Write amazing e2e tests.");
    await page.fill('input[name="deadline"]', "2026-12-31");
    await page.click('button[type="submit"]');

    // Wait for redirect to /jobs/manage (server action can be slow in dev)
    await expect(page).toHaveURL(/\/jobs\/manage/, { timeout: 15000 });

    await page.context().clearCookies(); // Log out

    // --- 3. MCR Approves Job ---
    await loginAs(page, TEST_ACCOUNTS.mcr, "MCR", /.*dashboard.*/);
    await page.goto("/approvals/jobs");
    const pendingJobCard = page.locator(".card").filter({ hasText: jobTitle }).first();
    await expect(pendingJobCard).toBeVisible({ timeout: 10000 });

    // Capture any alerts that pop up during approval
    let dialogMessage = "";
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      console.log('Dialog message:', dialogMessage);
      await dialog.accept();
    });

    // Click approve
    const approveBtnJob = pendingJobCard.getByRole("button", { name: /approve/i });
    await approveBtnJob.click();

    // Wait for server to process
    await page.waitForTimeout(2000);

    // Fail fast if approval threw a database error
    if (dialogMessage.toLowerCase().includes("error")) {
      throw new Error(`MCR approval failed with server error: ${dialogMessage}`);
    }

    // Verify approval after refresh (list is server-rendered and may not update instantly)
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(800);
      await page.reload();
      await page.waitForLoadState("networkidle");
      if (!(await page.locator(".card").filter({ hasText: jobTitle }).first().isVisible().catch(() => false))) {
        break;
      }
    }
    await page.context().clearCookies();

    // --- 4. Student Applies ---
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /.*dashboard.*/);

    // Robust retry loop: navigate to /jobs and wait for the approved job to appear
    const studentJobCard = page.locator(".job-card, .card").filter({ hasText: jobTitle }).first();
    for (let attempt = 0; attempt < 8; attempt++) {
      await page.goto("/jobs");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      if (await studentJobCard.isVisible().catch(() => false)) {
        break;
      }
      console.log(`[TEST] Attempt ${attempt + 1}: Job '${jobTitle}' not visible on /jobs, retrying...`);
    }
    await expect(studentJobCard).toBeVisible({ timeout: 10000 });

    // Click Apply
    const appliedBtn = studentJobCard.getByRole("button", { name: /applied successfully/i });
    const applyBtn = studentJobCard.getByRole("button", { name: /apply in portal/i });

    await expect(applyBtn.or(appliedBtn)).toBeVisible({ timeout: 10000 });

    if (await applyBtn.isVisible()) {
      await applyBtn.click({ force: true });
      await expect(appliedBtn).toBeVisible({ timeout: 5000 });
    }

    await page.context().clearCookies();

    // --- 4a. Company Shortlists Student ---
    await loginAs(page, companyLoginEmail, "Company", /.*dashboard.*/);
    await page.goto("/applicants");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await page.locator('input[type="checkbox"]').first().click();
    await page.getByRole("button", { name: /Post Results/i }).click();
    await expect(page.getByText(/Verification Emails sent/i)).toBeVisible({ timeout: 10000 });
    await page.context().clearCookies();

    // --- 4b. Fetch Code using DB query targeting this specific job ---
    const { neon } = require("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);
    const titlePattern = `%${randomId}%`;
    let dbRes;
    for (let i = 0; i < 5; i++) {
      try {
        dbRes = await sql`
          SELECT ja.verification_code 
          FROM job_applications ja 
          JOIN job_postings jp ON ja.job_id = jp.id 
          WHERE jp.title LIKE ${titlePattern}
          ORDER BY ja.applied_at DESC LIMIT 1`;
        if (dbRes.length > 0 && dbRes[0].verification_code) break;
      } catch (e) {
        if (i === 4) throw e;
      }
      await page.waitForTimeout(1000);
    }
    const vCode = dbRes[0].verification_code;
    console.log(`[TEST] Verification code for ${jobTitle}: ${vCode}`);

    // --- 4c. Student Verifies Application ---
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /.*dashboard.*/);
    await page.goto("/dashboard/student");
    await page.waitForLoadState("networkidle");

    // Locate the verification banner by finding the company name (seeded: "Deepak Company")
    const bannerContainer = page.locator('div').filter({ has: page.getByRole("button", { name: /Verify/i }) }).filter({ hasText: jobTitle }).first();
    await expect(bannerContainer).toBeVisible({ timeout: 15000 });

    // Fill Verification Banner
    const dateInputs = bannerContainer.locator('input[type="date"]');
    const dateInputCount = await dateInputs.count();
    if (dateInputCount >= 2) {
      await dateInputs.first().fill("2026-06-01");
      await dateInputs.nth(1).fill("2026-12-01");
    } else {
      // Fallback: try textbox-style date inputs
      const allInputs = bannerContainer.locator('input');
      const inputCount = await allInputs.count();
      for (let i = 0; i < inputCount; i++) {
        const input = allInputs.nth(i);
        const placeholder = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type');
        if (type === 'date' || placeholder?.includes('date') || placeholder?.includes('Date')) {
          if (i === 0 || !(await allInputs.nth(i - 1).getAttribute('type'))?.includes('date')) {
            await input.fill("2026-06-01");
          } else {
            await input.fill("2026-12-01");
          }
        }
      }
    }

    await bannerContainer.locator('input[placeholder="######"]').fill(vCode);
    await bannerContainer.getByRole("button", { name: /Verify/i }).click();

    // Check verification success toast
    await expect(page.getByText(/Verification successful/i)).toBeVisible({ timeout: 10000 });
    await page.context().clearCookies();

    // --- 5. Tutor Approves ---
    await loginAs(page, TEST_ACCOUNTS.tutor, "Tutor", /.*dashboard.*/);
    await page.goto("/approvals");
    const tutorRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, tutorRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 6. Coordinator Approves ---
    await loginAs(page, TEST_ACCOUNTS.placementCoordinator, "Placement Coordinator", /.*dashboard.*/);
    await page.goto("/approvals");
    const coordinatorRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, coordinatorRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 7. HOD Approves ---
    await loginAs(page, TEST_ACCOUNTS.hod, "HOD", /.*dashboard.*/);
    await page.goto("/approvals");
    const hodRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, hodRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 8. Dean Approves ---
    await loginAs(page, TEST_ACCOUNTS.dean, "Dean", /.*dashboard.*/);
    await page.goto("/approvals");
    const deanRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, deanRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 9. PO Approves (Again for the request!) ---
    await loginAs(page, TEST_ACCOUNTS.placementOfficer, "Placement Officer", /.*dashboard.*/);
    await page.goto("/approvals");
    const poRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, poRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 9.5 COE Approves ---
    await loginAs(page, TEST_ACCOUNTS.coe, "COE", /.*dashboard.*/);
    await page.goto("/approvals");
    const coeRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, coeRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 10. Principal Approves ---
    await loginAs(page, TEST_ACCOUNTS.principal, "Principal", /.*dashboard.*/);
    await page.goto("/approvals");
    const principalRow = await waitForApprovalRow(page, jobTitle);
    await approveRow(page, principalRow);
    await page.waitForTimeout(500);
    await page.context().clearCookies();

    // --- 11. Student Views Final Tracker ---
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /.*dashboard.*/);
    await page.goto("/applications");

    const finalApplicationCard = page.locator(".card").filter({ hasText: jobTitle }).first();
    await expect(finalApplicationCard).toBeVisible({ timeout: 15000 });
    await expect(finalApplicationCard.locator('.badge-success')).toBeVisible();
    await expect(finalApplicationCard.getByRole("link", { name: /print bonafide/i })).toBeVisible();
  });
});
