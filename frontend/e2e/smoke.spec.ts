import { test, expect } from "@playwright/test";

test.describe("SegmentIQ End-to-End User Journeys", () => {
  test("1. Public Pages and Contact Submission", async ({ page }) => {
    const timestamp = Date.now();
    // Landing page
    await page.goto("/");
    await expect(page).toHaveTitle(/SegmentIQ/);
    await expect(page.locator("h1")).toContainText("Know your customers by behaviour, not guesses");

    // Features
    await page.goto("/features");
    await expect(page.locator("h1")).toContainText("Comprehensive Customer Segmentation Toolkit");

    // How It Works
    await page.goto("/how-it-works");
    await expect(page.locator("h1")).toContainText("From Raw CSV to Targeted Audiences");

    // Docs / Methods Guide
    await page.goto("/docs");
    await expect(page.locator("h1")).toContainText("What is Customer Segmentation?");

    // About
    await page.goto("/about");
    await expect(page.locator("h1")).toContainText("Democratizing Customer Behavioral Intelligence");

    // Privacy & Terms
    await page.goto("/privacy");
    await expect(page.locator("h1")).toContainText("Privacy Policy");

    await page.goto("/terms");
    await expect(page.locator("h1")).toContainText("Terms of Service");

    // Contact Form
    await page.goto("/contact");
    await page.fill('input[placeholder="e.g. Sarah Jenkins"]', "Playwright Automation");
    await page.fill('input[type="email"]', `contact_test_${timestamp}@example.com`);
    await page.fill('input[placeholder="e.g. Question regarding DBSCAN eps parameter"]', "Inquiry about clustering algorithms");
    await page.fill('textarea', "Testing contact submission from automated smoke tests.");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Message Received")).toBeVisible({ timeout: 10000 });
  });

  test("2. Full Journey: Registration -> Online Store Sample -> RFM Scoring -> Results", async ({ page }) => {
    const timestamp = Date.now();
    const rfmUserEmail = `rfm_analyst_${timestamp}@example.com`;
    const rfmPassword = "Password123";

    // 1. Register new user
    await page.goto("/register");
    await page.fill('input[placeholder="e.g. Jordan Lee"]', `Analyst ${timestamp}`);
    await page.fill('input[type="email"]', rfmUserEmail);
    await page.fill('input[type="password"]', rfmPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("h1")).toContainText("Welcome, Analyst");

    // 2. Load Online Store Sample
    await page.goto("/dashboard/datasets/new?sample=1");
    await expect(page.locator("text=Online Store Transactions")).toBeVisible();
    await page.click('button:has-text("Use Online Store Sample")');

    // Redirect to dataset detail
    await expect(page).toHaveURL(/\/dashboard\/datasets\/[a-f0-9-]+/, { timeout: 20000 });
    await expect(page.locator("text=Data Quality Audit")).toBeVisible();
    await expect(page.locator("text=Column Profiles & Statistical Summaries")).toBeVisible();

    // 3. Initiate Segmentation
    await page.click('a:has-text("Segment this dataset")');
    await expect(page).toHaveURL(/\/dashboard\/datasets\/[a-f0-9-]+\/segment/, { timeout: 15000 });

    // Step 1: RFM is pre-selected for transaction dataset
    await expect(page.locator("text=RFM Scoring (Rules)")).toBeVisible();
    await page.click('button:has-text("Next: Select Features")');

    // Step 2: Features
    await page.click('button:has-text("Next: Configure Parameters")');

    // Step 3: Parameters
    await expect(page.locator("text=Fixed 5-Quantile Scoring")).toBeVisible();
    await page.click('button:has-text("Next: Review & Run")');

    // Step 4: Review and Run
    await page.click('button:has-text("Run Segmentation")');

    // Wait for background clustering execution and redirect to results
    await expect(page).toHaveURL(/\/dashboard\/runs\/[a-f0-9-]+/, { timeout: 45000 });
    await expect(page.locator("button[role='tab']:has-text('Overview')")).toBeVisible();

    // Verify all 5 Tabs
    await expect(page.locator("button[role='tab']:has-text('Segments')")).toBeVisible();
    await expect(page.locator("button[role='tab']:has-text('Visual Map')")).toBeVisible();
    await expect(page.locator("button[role='tab']:has-text('Customers')")).toBeVisible();
    await expect(page.locator("button[role='tab']:has-text('Exports')")).toBeVisible();

    // Segments tab
    await page.click("button[role='tab']:has-text('Segments')");
    await expect(page.locator("text=Recommended Marketing Actions").first()).toBeVisible();

    // Visual Map tab
    await page.click("button[role='tab']:has-text('Visual Map')");
    await expect(page.locator("text=PCA 2D Customer Projection")).toBeVisible();
    await expect(page.locator("text=Z-Score Trait Heatmap")).toBeVisible();

    // Customers tab
    await page.click("button[role='tab']:has-text('Customers')");
    await expect(page.locator("th:has-text('Customer ID')")).toBeVisible();

    // Export tab
    await page.click("button[role='tab']:has-text('Exports')");
    await expect(page.locator("text=Customers + Cluster Labels")).toBeVisible();
  });

  test("3. K-Means Journey: Mall Customers -> Suggest k -> Clustering -> Results", async ({ page }) => {
    const timestamp = Date.now();
    const kmeansUserEmail = `kmeans_analyst_${timestamp}@example.com`;
    const kmeansPassword = "Password123";

    // Register user
    await page.goto("/register");
    await page.fill('input[placeholder="e.g. Jordan Lee"]', `KMeans Analyst ${timestamp}`);
    await page.fill('input[type="email"]', kmeansUserEmail);
    await page.fill('input[type="password"]', kmeansPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Load Mall Customers sample
    await page.goto("/dashboard/datasets/new?sample=1");
    await page.click('button:has-text("Use Mall Customers Sample")');
    await expect(page).toHaveURL(/\/dashboard\/datasets\/[a-f0-9-]+/, { timeout: 20000 });

    // Start segmentation wizard
    await page.click('a:has-text("Segment this dataset")');
    await expect(page).toHaveURL(/\/dashboard\/datasets\/[a-f0-9-]+\/segment/, { timeout: 15000 });

    // Step 1: Select K-Means
    await page.click('div:has-text("K-Means Clustering")');
    await page.click('button:has-text("Next: Select Features")');

    // Step 2: Features
    await page.click('button:has-text("Next: Configure Parameters")');

    // Step 3: Suggest k heuristic
    await page.click('button:has-text("Suggest k")');
    await expect(page.locator("text=Suggested k =")).toBeVisible({ timeout: 25000 });

    // Step 4: Review and Run
    await page.click('button:has-text("Next: Review & Run")');
    await page.click('button:has-text("Run Segmentation")');

    // Wait for completion
    await expect(page).toHaveURL(/\/dashboard\/runs\/[a-f0-9-]+/, { timeout: 45000 });
    await expect(page.locator("button[role='tab']:has-text('Overview')")).toBeVisible();
    await expect(page.locator("text=Silhouette Score")).toBeVisible();
  });
});
