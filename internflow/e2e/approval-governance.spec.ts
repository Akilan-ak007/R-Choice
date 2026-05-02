import { expect, test } from "@playwright/test";
import { TEST_ACCOUNTS, loginAs } from "./helpers";

test.describe("Approval governance surfaces", () => {
  test("authority roles can open the OD approvals queue", async ({ page }) => {
    const roles = [
      { email: TEST_ACCOUNTS.tutor, label: "Tutor" },
      { email: TEST_ACCOUNTS.placementCoordinator, label: "Coordinator" },
      { email: TEST_ACCOUNTS.hod, label: "HOD" },
      { email: TEST_ACCOUNTS.dean, label: "Dean" },
      { email: TEST_ACCOUNTS.coe, label: "COE" },
      { email: TEST_ACCOUNTS.principal, label: "Principal" },
    ];

    for (const role of roles) {
      await loginAs(page, role.email, role.label);
      await page.goto("/approvals");
      await expect(page.getByRole("heading", { name: /approval queue|approvals/i }).first()).toBeVisible();
    }
  });

  test("management corporation can review SLA policy guidance", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.mcr, "MCR", /\/dashboard\/admin/);

    await page.goto("/settings");
    await expect(page.getByText(/od approval sla/i)).toBeVisible();
    await expect(page.getByText(/6h, 12h, then every sla window upward/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /save od sla/i })).toBeVisible();
  });

  test("placement officer can inspect result review and escalation dashboards", async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.placementOfficer, "Placement Officer", /\/dashboard\/admin/);

    await page.goto("/approvals/results");
    await expect(page.getByRole("heading", { name: /selection results review/i })).toBeVisible();

    await page.goto("/approvals/escalations");
    await expect(page.getByRole("heading", { name: /escalation dashboard/i })).toBeVisible();
    await expect(page.getByText(/review sla policy/i)).toBeVisible();
  });
});
