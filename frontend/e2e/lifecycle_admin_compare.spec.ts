import { test, expect } from "@playwright/test";

test.describe("SegmentIQ Lifecycle, Admin, and Model Comparison", () => {
  const ts = Date.now();
  const lifecycleEmail = `user_lifecycle_${ts}@example.com`;
  const initialPassword = "Password123";
  const updatedPassword = "NewPassword456";

  test("1. Route Protection and Redirect Parameter", async ({ page }) => {
    // Attempting to visit /dashboard without token redirects to /login?next=/dashboard
    await page.goto("/dashboard/settings");
    await expect(page).toHaveURL(/\/login\?next=.*dashboard.*settings/);
  });

  test("2. User Lifecycle: Register -> Change Password -> Logout -> Login -> Delete Account", async ({ page }) => {
    // 1. Register
    await page.goto("/register");
    await page.fill('input[placeholder="e.g. Jordan Lee"]', "Lifecycle User");
    await page.fill('input[type="email"]', lifecycleEmail);
    await page.fill('input[type="password"]', initialPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Change password in Settings
    await page.goto("/dashboard/settings");
    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill(initialPassword);
    await pwInputs.nth(1).fill(updatedPassword);
    await pwInputs.nth(2).fill(updatedPassword);
    await page.click('button:has-text("Update Password")');
    await expect(page.locator("text=Password updated successfully")).toBeVisible({ timeout: 10000 });

    // 3. Logout via Topbar avatar dropdown
    await page.locator("header button:has-text('Lifecycle User')").click();
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL("/");

    // 4. Login with updated password
    await page.goto("/login");
    await page.fill('input[type="email"]', lifecycleEmail);
    await page.fill('input[type="password"]', updatedPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 5. Delete Account in Danger Zone
    await page.goto("/dashboard/settings");
    await page.click('button:has-text("Delete My Account")');
    // Confirm dialog requires typing DELETE
    await page.fill('input[placeholder="DELETE"]', "DELETE");
    await page.click('button:has-text("Delete My Account Permanently")');
    await expect(page).toHaveURL("/");
  });

  test("3. Admin Messaging Inbox & Access Control", async ({ page }) => {
    // Register standard user and verify 403 on admin messages
    const standardEmail = `standard_${ts}@example.com`;
    await page.goto("/register");
    await page.fill('input[placeholder="e.g. Jordan Lee"]', "Standard User");
    await page.fill('input[type="email"]', standardEmail);
    await page.fill('input[type="password"]', "Password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Standard user visits admin panel
    await page.goto("/dashboard/admin/messages");
    await expect(page.locator("text=403 Forbidden")).toBeVisible();

    // Now log out
    await page.locator("header button:has-text('Standard User')").click();
    await page.click('button:has-text("Log out")');
    await expect(page).toHaveURL("/");

    // Register or login as admin@segmentiq.com
    await page.goto("/register");
    await page.fill('input[placeholder="e.g. Jordan Lee"]', "Platform Admin");
    await page.fill('input[type="email"]', "admin@segmentiq.com");
    await page.fill('input[type="password"]', "AdminPass123");
    await page.click('button[type="submit"]');

    // If already registered, login
    if (await page.locator("text=already exists").isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.goto("/login");
      await page.fill('input[type="email"]', "admin@segmentiq.com");
      await page.fill('input[type="password"]', "AdminPass123");
      await page.click('button[type="submit"]');
    }

    await expect(page).toHaveURL(/\/dashboard/);

    // Admin visits messages inbox
    await page.goto("/dashboard/admin/messages");
    await expect(page.locator("text=403 Forbidden")).not.toBeVisible();
    await expect(page.locator("h1")).toContainText("Contact Messages");
  });

  test("4. Multi-Run Clustering & Transition Comparison Matrix", async ({ page }) => {
    const compUserEmail = `compare_analyst_${ts}@example.com`;
    await page.goto("/register");
    await page.fill('input[placeholder="e.g. Jordan Lee"]', "Compare Analyst");
    await page.fill('input[type="email"]', compUserEmail);
    await page.fill('input[type="password"]', "Password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 1. Ingest Mall Customers
    await page.goto("/dashboard/datasets/new?sample=1");
    await page.click('button:has-text("Use Mall Customers Sample")');
    await expect(page).toHaveURL(/\/dashboard\/datasets\/[a-f0-9-]+/);
    const datasetUrl = page.url();

    // 2. Run Model 1: K-Means (k=5)
    await page.click('a:has-text("Segment this dataset")');
    await page.click('div:has-text("K-Means Clustering")');
    await page.click('button:has-text("Next: Select Features")');
    await page.click('button:has-text("Next: Configure Parameters")');
    await page.click('button:has-text("Next: Review & Run")');
    await page.click('button:has-text("Run Segmentation")');
    await expect(page).toHaveURL(/\/dashboard\/runs\/[a-f0-9-]+/, { timeout: 45000 });
    const run1Id = page.url().split("/").pop();

    // 3. Run Model 2: Hierarchical (k=5) on same dataset
    await page.goto(datasetUrl);
    await page.click('a:has-text("Segment this dataset")');
    await page.click('div:has-text("Hierarchical (Agglomerative)")');
    await page.click('button:has-text("Next: Select Features")');
    await page.click('button:has-text("Next: Configure Parameters")');
    await page.click('button:has-text("Next: Review & Run")');
    await page.click('button:has-text("Run Segmentation")');
    await expect(page).toHaveURL(/\/dashboard\/runs\/[a-f0-9-]+/, { timeout: 45000 });
    const run2Id = page.url().split("/").pop();

    // 4. Compare both runs
    await page.goto(`/dashboard/compare?a=${run1Id}&b=${run2Id}`);
    await expect(page.locator("text=Adjusted Rand Index")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Contingency Movement Heatmap")).toBeVisible();
    await expect(page.locator("text=Top Migration Flows")).toBeVisible();
  });
});
