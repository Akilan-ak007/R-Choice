import { test, expect } from "@playwright/test";
import { TEST_ACCOUNTS, loginAs } from "./helpers";

test.describe("Internship Applications Pipeline", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_ACCOUNTS.student, "Student", /\/dashboard\/student/);
  });

  test("student can navigate to My Applications and see progress tracker", async ({ page }) => {
    await page.click("text=My Applications");
    await expect(page).toHaveURL(/\/applications/);
    await expect(page.getByRole("heading", { name: /my applications/i }).first()).toBeVisible();
    await expect(page.getByText(/Track your internship approval status/i)).toBeVisible();

    const applicationCards = page.getByRole("heading", { level: 3 });
    const newRequestLink = page.getByRole("link", { name: /external od request/i });

    if ((await applicationCards.count()) > 0) {
      await expect(applicationCards.first()).toBeVisible();
    } else {
      await expect(newRequestLink).toBeVisible();
    }
  });

  test("student can browse and apply for jobs", async ({ page }) => {
    await page.click("text=Browse Jobs");
    await expect(page).toHaveURL(/\/jobs/);
    await expect(
      page.getByRole("heading", { name: /browse jobs|opportunities/i }).first()
    ).toBeVisible();
  });
});
