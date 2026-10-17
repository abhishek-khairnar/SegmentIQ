import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOT_DIR = path.resolve(__dirname, "../../docs/screenshots");
const IDS_FILE = path.resolve(__dirname, "seeded-ids.json");

// Helper to remove any floating toast notifications before taking screenshot
async function clearToasts(page: any) {
  await page.evaluate(() => {
    document.querySelectorAll("[data-sonner-toaster], [data-sonner-toast]").forEach((el) => el.remove());
  });
}

test.describe("Stage 2: Capture Screenshots of Every Section", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  const demoEmail = "demo@segmentiq.com";
  const demoPassword = "DemoPassword123";
  const demoName = "Demo Analyst";

  let ids: {
    rfmDatasetId: string;
    mallDatasetId: string;
    rfmRunId: string;
    kmeansRunId: string;
    hierarchicalRunId: string;
    dbscanRunId: string;
  } = {
    rfmDatasetId: "",
    mallDatasetId: "",
    rfmRunId: "",
    kmeansRunId: "",
    hierarchicalRunId: "",
    dbscanRunId: "",
  };

  test.beforeEach(() => {
    if (fs.existsSync(IDS_FILE)) {
      try {
        ids = JSON.parse(fs.readFileSync(IDS_FILE, "utf-8"));
      } catch (e) {
        // ignore
      }
    }
  });

  test("01-11. Capture Public Pages (Desktop 1440x900)", async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // 01-landing-hero.png
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-landing-hero.png"), fullPage: false });

    // 02-landing-full.png
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-landing-full.png"), fullPage: true });

    // 03-features.png
    await page.goto("/features");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-features.png"), fullPage: true });

    // 04-how-it-works.png
    await page.goto("/how-it-works");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-how-it-works.png"), fullPage: true });

    // 05-docs-methods-guide.png
    await page.goto("/docs");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-docs-methods-guide.png"), fullPage: true });

    // 06-about.png
    await page.goto("/about");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-about.png"), fullPage: true });

    // 07-contact.png
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-contact.png"), fullPage: true });

    // 08-login.png
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-login.png"), fullPage: false });

    // 09-register.png
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-register.png"), fullPage: false });

    // 10-privacy.png
    await page.goto("/privacy");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-privacy.png"), fullPage: true });

    // 11-terms.png
    await page.goto("/terms");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11-terms.png"), fullPage: true });
  });

  test("12-23. Capture Dashboard, Ingestion, Wizard & Runs", async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Log in as demo user
    await page.goto("/login");
    await page.fill('input[type="email"]', demoEmail);
    await page.fill('input[type="password"]', demoPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState("networkidle");
    await clearToasts(page);

    // 12-dashboard-overview.png
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "12-dashboard-overview.png"), fullPage: true });

    // 13-datasets-list.png
    await page.goto("/dashboard/datasets");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "13-datasets-list.png"), fullPage: true });

    // 14-dataset-new-upload.png
    await page.goto("/dashboard/datasets/new");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "14-dataset-new-upload.png"), fullPage: false });

    // 15-dataset-new-samples.png
    await page.goto("/dashboard/datasets/new?sample=1");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "15-dataset-new-samples.png"), fullPage: false });

    // 16-dataset-detail-mapping.png
    await page.goto(`/dashboard/datasets/${ids.rfmDatasetId}`);
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "16-dataset-detail-mapping.png"), fullPage: false });

    // 17-dataset-column-profile.png
    await page.locator("text=Column Profiles & Statistical Summaries").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "17-dataset-column-profile.png"), fullPage: false });

    // 18-wizard-step1-method.png
    await page.goto(`/dashboard/datasets/${ids.mallDatasetId}/segment`);
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "18-wizard-step1-method.png"), fullPage: false });

    // 19-wizard-step2-features.png
    await page.click('button:has-text("Next: Select Features")');
    await page.waitForTimeout(400);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "19-wizard-step2-features.png"), fullPage: false });

    // 20-wizard-step3-suggest-k.png
    await page.click('button:has-text("Next: Configure Parameters")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Suggest k")');
    await expect(page.locator("text=Suggested k =").first()).toBeVisible({ timeout: 25000 });
    await page.waitForTimeout(600);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "20-wizard-step3-suggest-k.png"), fullPage: false });

    // 21-wizard-step3-dbscan-eps.png
    await page.goto(`/dashboard/datasets/${ids.mallDatasetId}/segment`);
    await page.waitForLoadState("networkidle");
    await page.locator('[data-testid="method-dbscan"]').click();
    await page.click('button:has-text("Next: Select Features")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Next: Configure Parameters")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Auto-suggest eps")');
    await expect(page.locator("text=Suggested eps =").first()).toBeVisible({ timeout: 25000 });
    await page.waitForTimeout(600);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "21-wizard-step3-dbscan-eps.png"), fullPage: false });

    // 22-wizard-step4-review.png
    await page.click('button:has-text("Next: Review & Run")');
    await page.waitForTimeout(400);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "22-wizard-step4-review.png"), fullPage: false });

    // 23-runs-list.png
    await page.goto("/dashboard/runs");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "23-runs-list.png"), fullPage: true });
  });

  test("24-36. Capture Results Tabs, Compare, Settings, Admin & Light Theme", async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Log in as demo user
    await page.goto("/login");
    await page.fill('input[type="email"]', demoEmail);
    await page.fill('input[type="password"]', demoPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState("networkidle");

    // 24-results-overview-rfm.png
    await page.goto(`/dashboard/runs/${ids.rfmRunId}?tab=overview`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "24-results-overview-rfm.png"), fullPage: true });

    // 25-results-segments-rfm.png
    await page.goto(`/dashboard/runs/${ids.rfmRunId}?tab=segments`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "25-results-segments-rfm.png"), fullPage: true });

    // 26-results-map-rfm.png
    await page.goto(`/dashboard/runs/${ids.rfmRunId}?tab=map`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "26-results-map-rfm.png"), fullPage: true });

    // 27-results-customers.png (with drawer open)
    await page.goto(`/dashboard/runs/${ids.rfmRunId}?tab=customers`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await page.locator("tbody tr").first().click();
    await page.waitForTimeout(500);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "27-results-customers.png"), fullPage: false });

    // Close drawer
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // 28-results-export.png
    await page.goto(`/dashboard/runs/${ids.rfmRunId}?tab=export`);
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "28-results-export.png"), fullPage: true });

    // 29-results-overview-kmeans.png
    await page.goto(`/dashboard/runs/${ids.kmeansRunId}?tab=overview`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "29-results-overview-kmeans.png"), fullPage: true });

    // 30-results-segments-kmeans.png
    await page.goto(`/dashboard/runs/${ids.kmeansRunId}?tab=segments`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "30-results-segments-kmeans.png"), fullPage: true });

    // 31-results-map-kmeans.png
    await page.goto(`/dashboard/runs/${ids.kmeansRunId}?tab=map`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "31-results-map-kmeans.png"), fullPage: true });

    // 32-results-dbscan.png
    await page.goto(`/dashboard/runs/${ids.dbscanRunId}?tab=overview`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "32-results-dbscan.png"), fullPage: true });

    // 33-compare.png
    await page.goto(`/dashboard/compare?a=${ids.kmeansRunId}&b=${ids.hierarchicalRunId}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    if (await page.locator("text=Adjusted Rand Index").isHidden()) {
      await page.selectOption("#compare-select-a", ids.kmeansRunId);
      await page.waitForTimeout(500);
      await page.selectOption("#compare-select-b", ids.hierarchicalRunId);
    }
    await expect(page.locator("text=Adjusted Rand Index")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "33-compare.png"), fullPage: true });

    // 34-settings.png
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "34-settings.png"), fullPage: true });

    // 35-admin-messages.png (Sign in as admin)
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@segmentiq.com");
    await page.fill('input[type="password"]', "AdminPass123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/dashboard/admin/messages");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "35-admin-messages.png"), fullPage: true });

    // 36-theme-light.png (Toggle to light mode on K-Means overview)
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[type="email"]', demoEmail);
    await page.fill('input[type="password"]', demoPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`/dashboard/runs/${ids.kmeansRunId}?tab=overview`);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    });
    await page.waitForTimeout(600);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "36-theme-light.png"), fullPage: true });

    // Reset back to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    });
  });

  test("37-40. Capture Mobile Views and API Docs", async ({ page }) => {
    test.setTimeout(90000);

    // 37-mobile-landing.png (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "37-mobile-landing.png"), fullPage: false });

    // 38-mobile-menu-open.png
    await page.click('button[aria-label="Open navigation menu"]');
    await page.waitForTimeout(400);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "38-mobile-menu-open.png"), fullPage: false });

    // 39-mobile-results.png
    await page.goto("/login");
    await page.fill('input[type="email"]', demoEmail);
    await page.fill('input[type="password"]', demoPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`/dashboard/runs/${ids.rfmRunId}?tab=overview`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "39-mobile-results.png"), fullPage: false });

    // 40-api-docs-swagger.png (Desktop 1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/api-docs");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await clearToasts(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "40-api-docs-swagger.png"), fullPage: false });
  });
});
