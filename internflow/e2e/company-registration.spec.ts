import { expect, test } from "@playwright/test";

test.describe("Company registration lifecycle", () => {
  test("company can see info-requested resubmission state and resubmit", async ({ page }) => {
    await page.route("**/api/company/validate-token?token=test-resubmit-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          valid: true,
          company: {
            id: "company-1",
            companyLegalName: "Acme Talent Labs",
            brandName: "Acme",
            companyDescription: "Internship partner",
            companyType: "Private Limited (Pvt Ltd)",
            industrySector: "Information Technology",
            yearEstablished: 2019,
            companySize: "11-50",
            website: "https://acme.example.com",
            address: "1 Innovation Road",
            city: "Coimbatore",
            state: "Tamil Nadu",
            pinCode: "641001",
            hrName: "Priya HR",
            hrEmail: "hr@acme.example.com",
            hrPhone: "9876543210",
            altPhone: "",
            gstNumber: "",
            panNumber: "",
            cinLlpin: "",
            coi: "",
            ceoName: "Arun CEO",
            ceoDesignation: "Chief Executive Officer",
            ceoEmail: "ceo@acme.example.com",
            ceoPhone: "9876543211",
            ceoLinkedin: "",
            ceoPortfolio: "",
            internshipType: "Hybrid",
            domains: ["Web Development", "Data Science"],
            duration: "3 months",
            stipendRange: "10000-15000",
            hiringIntention: "PPO for top candidates",
            generalTcAccepted: true,
            status: "info_requested",
            reviewComment: "Please clarify the stipend range and CEO contact details.",
            reviewedAt: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route("**/api/company/register", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          registrationId: "company-1",
          updated: true,
        }),
      });
    });

    await page.goto("/company/register?token=test-resubmit-token");

    await expect(page.getByText(/action needed/i)).toBeVisible();
    await expect(page.getByText(/review note/i)).toBeVisible();
    await expect(page.locator('input[name="companyLegalName"]')).toHaveValue("Acme Talent Labs");

    const form = page.locator("form");

    await form.getByRole("button", { name: "Next", exact: true }).click();
    await form.getByRole("button", { name: "Next", exact: true }).click();
    await form.getByRole("button", { name: "Next", exact: true }).click();

    await expect(page.getByText(/registration updated/i)).toBeVisible();
    await expect(page.getByText(/resubmitted for MCR review/i)).toBeVisible();
  });
});
