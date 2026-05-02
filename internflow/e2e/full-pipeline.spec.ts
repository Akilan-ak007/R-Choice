import { expect, test } from "@playwright/test";
import { TEST_ACCOUNTS, loginAs } from "./helpers";

test.describe("Workflow Rebuild Smoke", () => {
  test("student applications reflects selection and OD tracking surfaces", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /\/dashboard\/student/);

    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: /my applications/i }).first()).toBeVisible();
    await expect(page.getByText(/track your selection journey/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /external od request/i })).toBeVisible();
  });

  test("company can access company workspace and job management", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.company, "Company", /\/dashboard\/company/);

    await page.goto("/dashboard/company");
    await expect(page.getByRole("heading", { name: /company workspace/i })).toBeVisible();

    await page.goto("/jobs/manage");
    await expect(page.getByRole("heading", { name: /my job postings/i })).toBeVisible();
  });

  test("placement officer can access raise OD queue and escalation views", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.placementOfficer, "Placement Officer", /\/dashboard\/admin/);

    await page.goto("/approvals/results");
    await expect(page.getByRole("heading", { name: /selection results review/i })).toBeVisible();

    await page.goto("/approvals/escalations");
    await expect(page.getByRole("heading", { name: /escalation dashboard/i })).toBeVisible();
  });

  test("management corporation can manage SLA policy from settings", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.mcr, "MCR", /\/dashboard\/admin/);

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /account settings/i })).toBeVisible();
    await expect(page.getByText(/od approval sla/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /save od sla/i })).toBeVisible();
  });
});
