import { expect, test } from "@playwright/test";

test("renders the default profitability threshold", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Break-Even ROAS Calculator" })).toBeVisible();
  await expect(page.getByTestId("break-even-roas")).toHaveText("1.75x");
  await expect(page.getByTestId("max-cpa")).toHaveText("$45.60");
  await expect(page.locator("#status-text")).toHaveText("Above break-even");
  await expect(page.locator("#calculator").evaluate((node) => node.previousElementSibling?.className)).resolves.toBe("tool-intro");
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
