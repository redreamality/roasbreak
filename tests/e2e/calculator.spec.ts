import { expect, test } from "@playwright/test";

test("renders the default profitability threshold", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Break-Even ROAS Calculator" })).toBeVisible();
  await expect(page.getByTestId("break-even-roas")).toHaveText("1.75x");
  await expect(page.getByTestId("max-cpa")).toHaveText("$45.60");
  await expect(page.locator("#status-text")).toHaveText("Above break-even");
  await expect(page.locator("#calculator").evaluate((node) => node.previousElementSibling?.className)).resolves.toBe("tool-intro");
});

test("keeps the calculator ahead of editorial discovery", async ({ page }) => {
  await page.goto("/");
  const positions = await page.evaluate(() => ({
    introBottom: document.querySelector(".tool-intro")?.getBoundingClientRect().bottom ?? 0,
    calculatorTop: document.querySelector("#calculator")?.getBoundingClientRect().top ?? 0,
    libraryTop: document.querySelector(".library-section")?.getBoundingClientRect().top ?? 0,
  }));
  expect(positions.calculatorTop).toBeGreaterThanOrEqual(positions.introBottom - 1);
  expect(positions.calculatorTop).toBeLessThan(positions.libraryTop);
});

test("switches to cost breakdown and recalculates live", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Cost breakdown").check();

  await expect(page.getByLabel("Product cost")).toBeVisible();
  await expect(page.getByLabel("Gross margin")).toBeHidden();
  await expect(page.getByTestId("break-even-roas")).toHaveText("2.19x");

  await page.getByLabel("Product cost").fill("40");
  await expect(page.getByTestId("break-even-roas")).toHaveText("3.25x");
  await expect(page.locator("#status-text")).toHaveText("Below break-even");
});

test("updates profitability status and resets defaults", async ({ page }) => {
  await page.goto("/?mode=margin&aov=100&margin=50&fees=5&returns=5&roas=1.5");

  await expect(page.getByTestId("break-even-roas")).toHaveText("2.50x");
  await expect(page.locator("#status-text")).toHaveText("Below break-even");

  await page.locator("#current-roas").fill("3");
  await expect(page.locator("#status-text")).toHaveText("Above break-even");
  await expect(page.locator("#profit-per-thousand")).toHaveText("+$200");

  await page.getByRole("button", { name: "Reset calculator" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:4173/");
  await expect(page.getByTestId("break-even-roas")).toHaveText("1.75x");
});

test("copies a restorable result link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173",
  });
  await page.goto("/");
  await page.getByLabel("Average order value").fill("125");
  await page.getByLabel("Gross margin").fill("70");
  await page.getByRole("button", { name: "Copy result" }).click();

  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedUrl).toContain("aov=125");
  expect(copiedUrl).toContain("margin=70");

  await page.goto(copiedUrl);
  await expect(page.getByLabel("Average order value")).toHaveValue("125");
  await expect(page.getByLabel("Gross margin")).toHaveValue("70");
});

test("keeps one FAQ answer open at a time", async ({ page }) => {
  await page.goto("/#faq");
  const first = page.locator(".faq-list details").nth(0);
  const second = page.locator(".faq-list details").nth(1);

  await expect(first).toHaveAttribute("open", "");
  await second.getByText("What is the difference between break-even ROAS and target ROAS?", { exact: true }).click();
  await expect(second).toHaveAttribute("open", "");
  await expect(first).not.toHaveAttribute("open", "");
});

test("fits the calculator on a mobile viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only layout assertion");
  await page.goto("/");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByTestId("break-even-roas")).toBeVisible();
  await expect(page.getByTestId("max-cpa")).toBeVisible();
});

test("exposes scoped result announcements and scale values", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".results-panel")).not.toHaveAttribute("aria-live");
  await expect(page.locator(".primary-result")).not.toHaveAttribute("aria-live");
  await expect(page.locator("#status-text")).toHaveAttribute("role", "status");
  await expect(page.locator("#status-text")).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#scale-value")).toContainText("Current ROAS 2.50x");
  await expect(page.locator("#scale-value")).toContainText("break-even 1.75x");
});

test("matches the five visible FAQs in FAQPage schema", async ({ page }) => {
  await page.goto("/");
  const visible = await page.locator(".faq-list summary").allTextContents();
  const schema = await page.locator('script[type="application/ld+json"]').first().textContent();
  const parsed = JSON.parse(schema ?? "{}");
  const faq = parsed["@graph"].find((node: { [key: string]: unknown }) => node["@type"] === "FAQPage");
  expect(faq.mainEntity.map((item: { name: string }) => item.name)).toEqual(visible);
  const answers = await page.locator(".faq-list details p").allTextContents();
  expect(faq.mainEntity.map((item: { acceptedAnswer: { text: string } }) => item.acceptedAnswer.text)).toEqual(
    answers.map((answer) => answer.trim()),
  );
});

test("keeps key calculator controls at least 44px on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only touch target assertion");
  await page.goto("/");
  const sizes = await page.evaluate(() => ["#reset-button", "#share-button", ".site-header nav a"].flatMap((selector) =>
    Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((node) => getComputedStyle(node).display !== "none").map((node) => {
      const rect = node.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  ));
  expect(sizes.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true);
});

test("keeps mobile primary navigation focused on tools and guides", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only navigation assertion");

  for (const url of ["/", "/target-roas-calculator/"]) {
    await page.goto(url);
    await expect(page.locator('nav a[href="/tools/"]')).toBeVisible();
    await expect(page.locator('nav a[href="/guides/"]')).toBeVisible();
    await expect(page.locator('nav a[href="/methodology/"]')).toBeHidden();
  }
});
