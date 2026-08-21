import { expect, test } from "@playwright/test";

const guidePaths = [
  "/guides/ecommerce-profit-formulas/",
  "/guides/ecommerce-variable-cost-checklist/",
  "/guides/contribution-margin-vs-gross-margin/",
  "/guides/ecommerce-revenue-basis/",
  "/guides/shopify-net-sales-for-roas/",
  "/guides/poas-vs-roas/",
  "/guides/roas-vs-acos/",
  "/guides/good-roas-for-profit-margin/",
  "/guides/google-ads-target-roas-profit/",
  "/guides/meta-ads-roas-and-attribution/",
  "/guides/amazon-break-even-acos/",
  "/guides/discount-vs-bundle-profit/",
  "/guides/free-shipping-profit-threshold/",
  "/guides/returns-and-discounts/",
  "/guides/contribution-ltv-vs-revenue-ltv/",
  "/guides/new-customer-roas-vs-blended-roas/",
  "/guides/cac-payback-cohort-data/",
  "/guides/product-vs-channel-profitability-scenario/",
  "/guides/refunds-and-conversion-adjustments/",
  "/guides/conversion-delay-and-data-maturity/",
  "/guides/tiktok-shop-roas-and-attribution/",
  "/guides/attributed-roas-vs-mer/",
];

test("carries the homepage economics into target ROAS", async ({ page }) => {
  await page.goto("/");
  await page.locator("#order-value").fill("100");
  await page.locator("#gross-margin").fill("60");
  await page.locator("#target-roas-link").click();

  await expect(page).toHaveURL(/target-roas-calculator.*aov=100/);
  await expect(page.locator("#order-value")).toHaveValue("100");
  await expect(page.locator("#target-roas")).toHaveText("2.38x");
  await expect(page.locator("#target-cpa")).toHaveText("$42.00");
  await expect(page.locator("#target-acos")).toHaveText("42.0%");
  await page.goBack();
  await expect(page.locator("#order-value")).toHaveValue("100");
  await expect(page.locator("#gross-margin")).toHaveValue("60");
});

test("restores target inputs and assumptions from its copied scenario", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173",
  });
  await page.goto("/target-roas-calculator/");
  await page.locator("#order-value").fill("132");
  await page.locator("#target-profit").fill("14");
  await expect(page).toHaveURL(/aov=132.*profit=14/);

  await page.reload();
  await expect(page.locator("#order-value")).toHaveValue("132");
  await expect(page.locator("#target-profit")).toHaveValue("14");
  await page.locator("#copy-targets").click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Basis: net product revenue excluding tax");
  expect(copied).toContain("Restore scenario: http://127.0.0.1:4173/target-roas-calculator/");
});

test("shows an infeasible target instead of infinity", async ({ page }) => {
  await page.goto("/target-roas-calculator/");
  await page.locator("#target-profit").fill("60");

  await expect(page.locator("#target-roas")).toHaveText("Not feasible");
  await expect(page.locator("#target-cpa")).toHaveText("--");
  await expect(page.locator("#target-summary")).toContainText("consumes all contribution");
});

test("passes target state to the profit lever ranking", async ({ page }) => {
  await page.goto("/target-roas-calculator/?aov=125&margin=70&fees=3&returns=5&roas=3&profit=12");
  await page.getByText("Find the best profit lever", { exact: false }).click();

  await expect(page).toHaveURL(/profit-lever-calculator.*aov=125/);
  await expect(page.locator("#order-value")).toHaveValue("125");
  await expect(page.locator("#target-profit")).toHaveValue("12");
  await expect(page.locator(".lever-row").nth(1)).toContainText("Raise average order value");
  await expect(page.locator("#selected-lever")).toContainText("Highest-impact scenario");
  await expect(page.locator("#selected-lever")).toContainText("Adds");
  await page.locator('[data-lever="fees"]').click();
  await expect(page).toHaveURL(/lever=fees/);
  await expect(page.locator("#selected-lever")).toContainText("Selected scenario");
  await page.reload();
  await expect(page.locator("#selected-lever")).toContainText("Selected scenario");
  await expect(page.locator("#selected-lever")).toContainText("Reduce payment and platform fees");
});

test("uses fixed costs when evaluating a promotion", async ({ page }) => {
  await page.goto("/promotion-profit-calculator/");

  await expect(page.locator("#required-lift")).toHaveText("+67.3%");
  await expect(page.locator("#promo-contribution")).toHaveText("$21.88");
  await expect(page.locator("#promo-break-even")).toHaveText("2.93x");

  await page.locator("#promotion-price").fill("72");
  await expect(page.locator("#required-lift")).toHaveText("+25.2%");
  await expect(page).toHaveURL(/promo=72/);
  await page.reload();
  await expect(page.locator("#promotion-price")).toHaveValue("72");
  await expect(page.locator("#required-lift")).toHaveText("+25.2%");
});

test("calculates CAC payback and unrecovered state", async ({ page }) => {
  await page.goto("/cac-payback-calculator/");
  await expect(page.locator("#payback-day")).toHaveText("Day 90");
  await expect(page.locator("#allowable-cac")).toHaveText("$103.00");

  await page.locator("#cac").fill("150");
  await expect(page.locator("#payback-day")).toHaveText("Beyond 365d");
  await expect(page.locator("#payback-gap")).toHaveText("$32.00");
  await page.reload();
  await expect(page.locator("#cac")).toHaveValue("150");
  await expect(page.locator("#payback-gap")).toHaveText("$32.00");
});

test("ranks scenarios by total contribution profit", async ({ page }) => {
  await page.goto("/scenario-planner/");

  await expect(page.locator(".scenario-row").nth(1)).toContainText("Scaled spend");
  await expect(page.locator(".scenario-row").nth(1)).toContainText("+$508.00");
  await page.locator("#scenario-3-roas").fill("3");
  await expect(page.locator(".scenario-row").nth(1)).toContainText("Scaled spend");
  await expect(page.locator(".scenario-row").nth(1)).toContainText("+$1,420.00");
  await page.locator("#scenario-3-name").fill("Scale <strong>test</strong>");
  await expect(page.locator(".scenario-row").nth(1)).toContainText("Scale <strong>test</strong>");
  await expect(page.locator(".scenario-row > span strong")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#scenario-3-name")).toHaveValue("Scale <strong>test</strong>");
  await expect(page.locator("#scenario-3-roas")).toHaveValue("3");
});

test("falls back from invalid shared values with a visible notice", async ({ page }) => {
  await page.goto("/target-roas-calculator/?aov=oops&fees=200&profit=-1");
  await expect(page.locator(".param-warning")).toContainText("reset to defaults");
  await expect(page.locator("#order-value")).toHaveValue("80");
  await expect(page.locator("#fee-pct")).toHaveValue("3");
  await expect(page.locator("#target-profit")).toHaveValue("10");
});

test("converts ROAS and ACoS in both directions", async ({ page }) => {
  await page.goto("/guides/roas-vs-acos/");
  await page.locator("#guide-roas").fill("2.5");
  await expect(page.locator("#guide-acos")).toHaveValue("40.0");

  await page.locator("#guide-acos").fill("20");
  await expect(page.locator("#guide-roas")).toHaveValue("5.00");
});

test("copies the ecommerce variable-cost audit checklist", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173",
  });
  await page.goto("/guides/ecommerce-variable-cost-checklist/");
  const copyButton = page.getByRole("button", { name: "Copy checklist" });
  await expect(copyButton).not.toHaveClass(/guide-action/);
  await copyButton.click();
  await expect(page.locator("#toast")).toHaveAttribute("role", "status");
  await expect(page.locator("#toast")).toHaveText("Checklist copied");
  await expect(page.locator("#toast")).toHaveClass(/is-visible/);

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Fields: Group | Source | Period | Currency | Owner | Amount | Tool input | Status");
  for (const group of ["Revenue deductions", "Product and inbound", "Fulfillment", "Payment and platform", "Refunds and returns", "Service and other"]) {
    expect(copied, group).toContain(group);
  }
  expect(copied).toContain("Duplicate check:");
  expect(copied).toContain("Fixed-variable check:");
  expect(copied).toContain("Missing-zero check:");
});

test("lists every published tool and guide", async ({ page }) => {
  await page.goto("/tools/");
  await expect(page.locator(".directory-item")).toHaveCount(6);
  await page.goto("/guides/");
  await expect(page.locator(".topic-group")).toHaveCount(5);
  await expect(page.locator(".topic-guide")).toHaveCount(23);
  await expect(page.getByRole("link", { name: /Ecommerce Profit Formulas/ })).toHaveAttribute("href", "/guides/ecommerce-profit-formulas/");
  await expect(page.getByRole("link", { name: /Ecommerce Variable-cost Checklist/ })).toHaveAttribute("href", "/guides/ecommerce-variable-cost-checklist/");
  await expect(page.getByRole("link", { name: /POAS vs ROAS/ })).toHaveAttribute("href", "/guides/poas-vs-roas/");
  await expect(page.getByRole("link", { name: /Meta Ads ROAS and Attribution/ })).toHaveAttribute("href", "/guides/meta-ads-roas-and-attribution/");
  await expect(page.getByRole("link", { name: /TikTok Shop ROAS and Attribution/ })).toHaveAttribute("href", "/guides/tiktok-shop-roas-and-attribution/");
  await expect(page.getByRole("link", { name: /Conversion Delay and Data Maturity/ })).toHaveAttribute("href", "/guides/conversion-delay-and-data-maturity/");
  await expect(page.getByRole("link", { name: /Refunds and Conversion Adjustments/ })).toHaveAttribute("href", "/guides/refunds-and-conversion-adjustments/");
  await expect(page.getByRole("link", { name: /Product vs Channel Profitability/ })).toHaveAttribute("href", "/guides/product-vs-channel-profitability-scenario/");
  await expect(page.getByRole("link", { name: /New Customer ROAS vs Blended ROAS/ })).toHaveAttribute("href", "/guides/new-customer-roas-vs-blended-roas/");
  await expect(page.getByRole("link", { name: /Free Shipping Profit Threshold/ })).toHaveAttribute("href", "/guides/free-shipping-profit-threshold/");
  await expect(page.getByRole("link", { name: /Discount vs Bundle Profit/ })).toHaveAttribute("href", "/guides/discount-vs-bundle-profit/");
  await expect(page.getByRole("link", { name: /Contribution LTV vs Revenue LTV/ })).toHaveAttribute("href", "/guides/contribution-ltv-vs-revenue-ltv/");
});

test("navigates the guide library by operating topic", async ({ page }) => {
  await page.goto("/guides/");
  await page.getByRole("link", { name: "Paid media" }).click();
  await expect(page).toHaveURL(/\/guides\/#paid-media$/);
  await expect(page.getByRole("heading", { name: "Translate platform ratios into profit targets." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Google Ads Target ROAS vs Profit/ })).toBeVisible();
});

test("publishes visible review details, primary sources, and Article schema for every guide", async ({ page }) => {
  for (const path of guidePaths) {
    const isNewGuide = ["/guides/ecommerce-profit-formulas/", "/guides/ecommerce-variable-cost-checklist/", "/guides/poas-vs-roas/", "/guides/returns-and-discounts/", "/guides/new-customer-roas-vs-blended-roas/", "/guides/free-shipping-profit-threshold/", "/guides/discount-vs-bundle-profit/", "/guides/contribution-ltv-vs-revenue-ltv/", "/guides/meta-ads-roas-and-attribution/", "/guides/tiktok-shop-roas-and-attribution/", "/guides/conversion-delay-and-data-maturity/", "/guides/refunds-and-conversion-adjustments/", "/guides/product-vs-channel-profitability-scenario/"].includes(path);
    await page.goto(path);
    await expect(page.locator("[data-editorial-meta]")).toContainText(isNewGuide ? "Reviewed August 21, 2026" : "Reviewed August 20, 2026");
    await expect(page.locator("[data-content-scope]")).toContainText("Scope: ");
    if (path === "/guides/ecommerce-profit-formulas/") {
      await expect(page).toHaveTitle("Ecommerce Profit Formulas: ROAS, CPA, POAS, MER & Payback");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Connect ecommerce contribution margin/);
      await expect(page.locator("[data-content-scope]")).toContainText("Global, platform-agnostic");
    }
    if (path === "/guides/ecommerce-variable-cost-checklist/") {
      await expect(page).toHaveTitle("Ecommerce Variable-cost Checklist for Break-even ROAS | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Audit ecommerce revenue deductions/);
      await expect(page.locator("[data-content-scope]")).toContainText("GA4, Shopify GraphQL, and Stripe field examples");
      await expect(page.getByText("One cost, one input, one period.", { exact: true })).toBeVisible();
      await expect(page.getByText("This checklist audits input coverage.", { exact: false })).toBeVisible();
      await expect(page.locator(".source-list a")).toHaveCount(5);
      await expect(page.getByRole("button", { name: "Copy checklist" })).toHaveCount(1);
    }
    if (path === "/guides/poas-vs-roas/") {
      await expect(page).toHaveTitle("POAS vs ROAS: Why High Revenue ROAS Can Mean Weak Profit | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /contribution profit after ads divided by ad spend/);
      await expect(page.locator("[data-content-scope]")).toContainText("Global ecommerce");
      await expect(page.getByText("POAS = contribution profit after ads / ad spend", { exact: true })).toBeVisible();
      await expect(page.locator('script[data-schema="breadcrumb"]')).toHaveCount(1);
    }
    if (path === "/guides/new-customer-roas-vs-blended-roas/") {
      await expect(page).toHaveTitle("New Customer ROAS vs Blended ROAS: Set Different Targets | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /different profit thresholds/);
      await expect(page.locator("[data-content-scope]")).toContainText("Global ecommerce");
      await expect(page.getByText("A platform new-customer label is not financial truth.", { exact: true })).toBeVisible();
    }
    if (path === "/guides/free-shipping-profit-threshold/") {
      await expect(page).toHaveTitle("Free Shipping Profit Threshold: Required AOV, Orders, or CVR | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /separating customer shipping revenue from merchant fulfillment cost/);
      await expect(page.locator("[data-content-scope]")).toContainText("Global ecommerce");
      await expect(page.getByText("Free shipping must replace contribution, not shipping revenue alone.", { exact: true })).toBeVisible();
    }
    if (path === "/guides/discount-vs-bundle-profit/") {
      await expect(page).toHaveTitle("Discount vs Bundle Profit at the Same Traffic | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /same traffic and order target/);
      await expect(page.locator("[data-content-scope]")).toContainText("Global ecommerce");
      await expect(page.getByText("Compare total contribution at one declared traffic and order target.", { exact: true })).toBeVisible();
    }
    if (path === "/guides/contribution-ltv-vs-revenue-ltv/") {
      await expect(page).toHaveTitle("Contribution LTV vs Revenue LTV for Allowable CAC | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /cumulative revenue LTV is not allowable CAC/);
      await expect(page.locator("[data-content-scope]")).toContainText("Global ecommerce");
      await expect(page.getByText("Revenue LTV cannot be spent as allowable CAC.", { exact: true })).toBeVisible();
    }
    if (path === "/guides/meta-ads-roas-and-attribution/") {
      await expect(page).toHaveTitle("Meta Ads ROAS and Attribution Settings for Profit | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /selected attribution settings into an ecommerce break-even and target ROAS threshold/);
      await expect(page.locator("[data-content-scope]")).toContainText("availability varies by account and campaign");
      await expect(page.getByText("Meta ROAS is only interpretable with its attribution settings attached.", { exact: true })).toBeVisible();
      await expect(page.locator(".source-list a")).toHaveCount(2);
    }
    if (path === "/guides/tiktok-shop-roas-and-attribution/") {
      await expect(page).toHaveTitle("TikTok Shop ROAS and Attribution Views | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /click-through, view-through, Assisted Shop gross revenue, and store net revenue/);
      await expect(page.locator("[data-content-scope]")).toContainText("English resources; feature availability varies");
      await expect(page.getByText("Attribution views are alternative lenses, not revenue lines to add.", { exact: true })).toBeVisible();
      await expect(page.locator(".source-list a")).toHaveCount(2);
    }
    if (path === "/guides/conversion-delay-and-data-maturity/") {
      await expect(page).toHaveTitle("Conversion Delay and Data Maturity for ROAS | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /mature enough for a budget decision/);
      await expect(page.locator("[data-content-scope]")).toContainText("Global Google Ads reporting");
      await expect(page.getByText("An immature window supports sensitivity analysis, not a deterministic budget move.", { exact: true })).toBeVisible();
      await expect(page.locator(".source-list a")).toHaveCount(2);
    }
    if (path === "/guides/refunds-and-conversion-adjustments/") {
      await expect(page).toHaveTitle("Refunds and Conversion Adjustments for ROAS | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /canceled and partially refunded ecommerce transactions in Google Ads and GA4/);
      await expect(page.locator("[data-content-scope]")).toContainText("English documentation; product availability varies");
      await expect(page.getByText("Correct the original transaction once, then rebuild the numerator.", { exact: true })).toBeVisible();
      await expect(page.locator(".source-list a")).toHaveCount(5);
    }
    if (path === "/guides/product-vs-channel-profitability-scenario/") {
      await expect(page).toHaveTitle("Product vs Channel Profitability Scenarios | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /total contribution profit at equal ad spend/);
      await expect(page.locator("[data-content-scope]")).toContainText("GA4; Shopify GraphQL; Amazon terminology");
      await expect(page.getByText("The highest ROAS can produce the least contribution profit.", { exact: true })).toBeVisible();
      await expect(page.locator(".source-list a")).toHaveCount(4);
    }
    await expect(page.locator(".source-list a").first()).toHaveAttribute("href", /^https:\/\//);
    await expect(page.locator(".guide-action")).toHaveCount(1);
    await expect(page.locator('script[data-schema="breadcrumb"]')).toHaveCount(1);
    const articleSchema = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(articleSchema, path).toContain('"@type":"Article"');
    expect(articleSchema, path).toContain(`"dateModified":"${isNewGuide ? "2026-08-21" : "2026-08-20"}"`);
  }
});

test("restores worked guide examples in the matching calculator", async ({ page }) => {
  await page.goto("/guides/ecommerce-variable-cost-checklist/");
  await page.locator(".guide-action").click();
  const variableCostParams = {
    mode: "costs", aov: "120", cogs: "48", ship: "9", other: "7", fees: "3", returns: "8", roas: "3",
  };
  expect(new URL(page.url()).pathname).toBe("/");
  for (const [parameter, value] of Object.entries(variableCostParams)) {
    expect(new URL(page.url()).searchParams.get(parameter), parameter).toBe(value);
  }
  await expect(page.locator("#order-value")).toHaveValue("120");
  await expect(page.locator("#product-cost")).toHaveValue("48");
  await expect(page.locator("#fulfillment-cost")).toHaveValue("9");
  await expect(page.locator("#other-cost")).toHaveValue("7");
  await expect(page.locator("#fee-pct")).toHaveValue("3");
  await expect(page.locator("#return-pct")).toHaveValue("8");
  await expect(page.locator("#current-roas")).toHaveValue("3");
  await expect(page.locator("#max-cpa")).toHaveText("$42.80");
  await expect(page.locator("#contribution-margin")).toHaveText("35.7%");
  await expect(page.locator("#break-even-roas")).toHaveText("2.80x");
  await expect(page.locator("#profit-per-order")).toHaveText("+$2.80");
  await expect(page.locator("#profit-per-thousand")).toHaveText("+$70");
  await page.reload();
  await expect(page.locator("#current-roas")).toHaveValue("3");
  await expect(page.locator("#break-even-roas")).toHaveText("2.80x");
  await expect(page.locator("#profit-per-order")).toHaveText("+$2.80");
  await expect(page.locator("#profit-per-thousand")).toHaveText("+$70");

  await page.goto("/guides/shopify-net-sales-for-roas/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/aov=85.*cogs=30.*ship=8/);
  await expect(page.locator("#order-value")).toHaveValue("85");
  await expect(page.locator("#break-even-roas")).toHaveText("2.05x");

  await page.goto("/guides/google-ads-target-roas-profit/");
  await page.locator(".guide-action").click();
  await expect(page.locator("#target-roas")).toHaveText("2.86x");
  await expect(page.locator("#target-cpa")).toHaveText("$35.00");

  await page.goto("/guides/conversion-delay-and-data-maturity/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/mode=costs.*aov=100.*cogs=40.*ship=8.*other=4.*fees=3.*returns=5.*roas=2.7.*profit=10/);
  await expect(page.locator("#current-roas")).toHaveValue("2.7");
  await expect(page.locator("#target-break-even")).toHaveText("2.50x");
  await expect(page.locator("#target-cpa")).toHaveText("$30.00");
  await expect(page.locator("#target-roas")).toHaveText("3.33x");

  await page.goto("/guides/meta-ads-roas-and-attribution/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/mode=costs.*aov=100.*cogs=42.*ship=8.*other=4.*fees=3.*returns=5.*roas=3.2.*profit=10/);
  await expect(page.locator("#current-roas")).toHaveValue("3.2");
  await expect(page.locator("#target-break-even")).toHaveText("2.63x");
  await expect(page.locator("#target-cpa")).toHaveText("$28.00");
  await expect(page.locator("#target-roas")).toHaveText("3.57x");

  await page.goto("/guides/ecommerce-profit-formulas/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/mode=costs.*aov=100.*cogs=40.*profit=10/);
  await expect(page.locator("#target-break-even")).toHaveText("2.50x");
  await expect(page.locator("#target-cpa")).toHaveText("$30.00");
  await expect(page.locator("#target-roas")).toHaveText("3.33x");

  await page.goto("/guides/poas-vs-roas/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/mode=costs.*aov=100.*cogs=45.*profit=10/);
  await expect(page.locator("#target-break-even")).toHaveText("2.78x");
  await expect(page.locator("#target-cpa")).toHaveText("$26.00");
  await expect(page.locator("#target-roas")).toHaveText("3.85x");

  await page.goto("/guides/new-customer-roas-vs-blended-roas/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/cac=80.*profit=12.*d180=90.*d365=112/);
  await expect(page.locator("#payback-day")).toHaveText("Day 180");
  await expect(page.locator("#allowable-cac")).toHaveText("$100.00");

  await page.goto("/guides/free-shipping-profit-threshold/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/mode=costs.*aov=86.*cogs=32.*ship=8.*promo=80.*cvr=2.5/);
  await expect(page.locator("#order-value")).toHaveValue("86");
  await expect(page.locator("#promotion-price")).toHaveValue("80");
  await expect(page.locator("#required-lift")).toHaveText("+18.6%");
  await expect(page.locator("#required-cvr")).toHaveText("2.97%");
  await expect(page.locator("#promo-contribution")).toHaveText("$29.60");

  await page.goto("/guides/discount-vs-bundle-profit/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/mode=costs.*aov=80.*cogs=28.*ship=6.*promo=64.*cvr=2.5/);
  await expect(page.locator("#order-value")).toHaveValue("80");
  await expect(page.locator("#promotion-price")).toHaveValue("64");
  await expect(page.locator("#required-lift")).toHaveText("+67.3%");
  await expect(page.locator("#required-cvr")).toHaveText("4.18%");
  await expect(page.locator("#promo-contribution")).toHaveText("$21.88");

  await page.goto("/guides/contribution-ltv-vs-revenue-ltv/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/cac=70.*profit=15.*d30=40.*d180=74.*d365=92/);
  await expect(page.locator("#cac")).toHaveValue("70");
  await expect(page.locator("#payback-day")).toHaveText("Day 180");
  await expect(page.locator("#allowable-cac")).toHaveText("$77.00");

  await page.goto("/guides/product-vs-channel-profitability-scenario/");
  await page.locator(".guide-action").click();
  const productChannelParams = {
    s1n: "High ROAS low margin", s1a: "50", s1m: "20", s1r: "5", s1s: "10000",
    s2n: "Balanced mix", s2a: "80", s2m: "40", s2r: "4", s2s: "10000",
    s3n: "Lower ROAS high margin", s3a: "100", s3m: "55", s3r: "3", s3s: "10000",
  };
  for (const [parameter, value] of Object.entries(productChannelParams)) {
    expect(new URL(page.url()).searchParams.get(parameter), parameter).toBe(value);
  }
  const highRoasRow = page.locator(".scenario-row").filter({ hasText: "High ROAS low margin" });
  const balancedRow = page.locator(".scenario-row").filter({ hasText: "Balanced mix" });
  const lowerRoasRow = page.locator(".scenario-row").filter({ hasText: "Lower ROAS high margin" });
  await expect(highRoasRow).toContainText("$50,000");
  await expect(highRoasRow).toContainText("1000.0");
  await expect(highRoasRow).toContainText("$0.00");
  await expect(balancedRow).toContainText("$40,000");
  await expect(balancedRow).toContainText("500.0");
  await expect(balancedRow).toContainText("+$6,000.00");
  await expect(lowerRoasRow).toContainText("$30,000");
  await expect(lowerRoasRow).toContainText("300.0");
  await expect(lowerRoasRow).toContainText("+$6,500.00");
  await expect(page.locator(".scenario-row.winner")).toContainText("Lower ROAS high margin");
  await page.locator("#scenario-3-roas").fill("2.8");
  await expect(page.locator(".scenario-row.winner")).toContainText("Balanced mix");
  await expect(lowerRoasRow).toContainText("$28,000");
  await expect(lowerRoasRow).toContainText("280.0");
  await expect(lowerRoasRow).toContainText("+$5,400.00");
  await page.reload();
  await expect(page.locator("#scenario-3-roas")).toHaveValue("2.8");
  await expect(page.locator(".scenario-row.winner")).toContainText("Balanced mix");

  await page.goto("/guides/refunds-and-conversion-adjustments/");
  await page.locator(".guide-action").click();
  const staleRow = page.locator(".scenario-row").filter({ hasText: "Stale initial" });
  const adsAdjustedRow = page.locator(".scenario-row").filter({ hasText: "Ads adjusted" });
  const storeControlRow = page.locator(".scenario-row").filter({ hasText: "Store control" });
  await expect(staleRow).toContainText("$40,000");
  await expect(staleRow).toContainText("400.0");
  await expect(staleRow).toContainText("+$6,000.00");
  await expect(adsAdjustedRow).toContainText("$34,000");
  await expect(adsAdjustedRow).toContainText("340.0");
  await expect(adsAdjustedRow).toContainText("+$3,600.00");
  await expect(storeControlRow).toContainText("$33,000");
  await expect(storeControlRow).toContainText("330.0");
  await expect(storeControlRow).toContainText("+$3,200.00");
  await page.locator("#scenario-2-roas").fill("3.2");
  await expect(adsAdjustedRow).toContainText("$32,000");
  await expect(adsAdjustedRow).toContainText("320.0");
  await expect(adsAdjustedRow).toContainText("+$2,800.00");
  await page.reload();
  await expect(page.locator("#scenario-2-roas")).toHaveValue("3.2");
  await expect(page.locator(".scenario-row").filter({ hasText: "Ads adjusted" })).toContainText("$32,000");

  await page.goto("/guides/tiktok-shop-roas-and-attribution/");
  await page.locator(".guide-action").click();
  const tiktokScenarioUrl = new URL(page.url());
  expect(tiktokScenarioUrl.pathname).toBe("/scenario-planner/");
  expect(tiktokScenarioUrl.searchParams.get("s1n")).toBe("CTA only");
  expect(tiktokScenarioUrl.searchParams.get("s2n")).toBe("CTA + VTA");
  expect(tiktokScenarioUrl.searchParams.get("s3n")).toBe("Store net");
  await expect(page.locator(".scenario-row.winner")).toContainText("CTA + VTA");
  await expect(page.locator(".scenario-row.winner")).toContainText("$32,000");
  await expect(page.locator(".scenario-row.winner")).toContainText("640.0");
  await expect(page.locator(".scenario-row.winner")).toContainText("+$2,800.00");
  await page.locator("#scenario-3-roas").fill("3.5");
  await expect(page.locator(".scenario-row.winner")).toContainText("Store net");
  await expect(page.locator(".scenario-row.winner")).toContainText("$35,000");
  await expect(page.locator(".scenario-row.winner")).toContainText("700.0");
  await expect(page.locator(".scenario-row.winner")).toContainText("+$4,000.00");
  await page.reload();
  await expect(page.locator("#scenario-3-roas")).toHaveValue("3.5");
  await expect(page.locator(".scenario-row.winner")).toContainText("Store net");
});

test("tracks guide-to-tool actions without calculation values or URL queries", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  await page.addInitScript(() => window.localStorage.setItem("roasbreak-privacy-choice", "accepted"));
  await page.goto("/guides/shopify-net-sales-for-roas/");
  await page.locator(".guide-action").evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault());
  });
  await page.locator(".guide-action").click();

  const event = await page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: unknown[][] }).dataLayer ?? [];
    return dataLayer.find((entry) => entry[0] === "event" && entry[1] === "guide_to_tool_clicked");
  });
  expect(event).toEqual(["event", "guide_to_tool_clicked", { guide: "shopify-net-sales", target: "/" }]);
});

test("attributes one completed calculation and successful copy to the originating guide", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173",
  });
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  await page.addInitScript(() => window.localStorage.setItem("roasbreak-privacy-choice", "accepted"));
  await page.goto("/guides/ecommerce-variable-cost-checklist/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/\/\?mode=costs/);

  await page.locator('[name="currentRoas"]').fill("3.1");
  await page.locator('[name="currentRoas"]').press("Tab");
  await page.locator('[name="orderValue"]').fill("125");
  await page.locator('[name="orderValue"]').press("Tab");
  await page.locator("#share-button").click();

  await expect.poll(async () => page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: unknown[][] }).dataLayer ?? [];
    return dataLayer.filter((entry) => entry[0] === "event" && ["calculation_completed", "break_even_copied"].includes(String(entry[1])));
  })).toEqual([
    ["event", "calculation_completed", { tool: "break_even", source_guide: "ecommerce-variable-cost-checklist" }],
    ["event", "break_even_copied", { tool: "break_even", source_guide: "ecommerce-variable-cost-checklist" }],
  ]);

  const serializedEvents = await page.evaluate(() => JSON.stringify((window as Window & { dataLayer?: unknown[][] }).dataLayer ?? []));
  expect(serializedEvents).not.toContain("3.1");
  expect(serializedEvents).not.toContain("mode=costs");
  expect(serializedEvents).not.toContain("?");
});

test("does not attribute a directly visited tool calculation to a guide", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  await page.addInitScript(() => window.localStorage.setItem("roasbreak-privacy-choice", "accepted"));
  await page.goto("/target-roas-calculator/");
  await page.locator("#target-profit").fill("12");
  await page.locator("#target-profit").press("Tab");

  await expect.poll(async () => page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: unknown[][] }).dataLayer ?? [];
    return dataLayer.find((entry) => entry[0] === "event" && entry[1] === "calculation_completed");
  })).toEqual(["event", "calculation_completed", { tool: "target" }]);
});

test("copies an assumption-aware restore link from every decision tool", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4173",
  });
  const tools = [
    ["/profit-lever-calculator/", "#copy-action", "Restore scenario:"],
    ["/promotion-profit-calculator/", "#copy-promotion", "Restore scenario:"],
    ["/cac-payback-calculator/", "#copy-payback", "Restore scenario:"],
    ["/scenario-planner/", "#copy-scenarios", "Restore scenarios:"],
  ];
  for (const [path, button, restoreLabel] of tools) {
    await page.goto(path);
    await page.locator(button).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied, path).toContain("Basis:");
    expect(copied, path).toContain(restoreLabel);
    expect(copied, path).toContain(`http://127.0.0.1:4173${path}?`);
    await expect(page.locator("#toast")).toHaveAttribute("role", "status");
  }
});

test("publishes matching canonical, schema, breadcrumb, and sitemap URLs", async ({ page, request }) => {
  const paths = [
    "/target-roas-calculator/",
    "/profit-lever-calculator/",
    "/promotion-profit-calculator/",
    "/cac-payback-calculator/",
    "/scenario-planner/",
    ...guidePaths,
    "/methodology/",
  ];
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://roasbreak.com${path}`);
    await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(0);
    expect(await page.locator('script[data-schema="breadcrumb"]').textContent()).toContain("BreadcrumbList");
    await expect(page.locator(".breadcrumb")).toHaveAttribute("aria-label", "Breadcrumb");
    expect(sitemap, path).toContain(`<loc>https://roasbreak.com${path}</loc>`);
  }
});

test("keeps every published inner page free of runtime errors", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/css", body: "" });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const paths = [
    "/tools/", "/guides/", "/target-roas-calculator/", "/profit-lever-calculator/",
    "/promotion-profit-calculator/", "/cac-payback-calculator/", "/scenario-planner/",
    ...guidePaths, "/methodology/",
  ];
  for (const path of paths) await page.goto(path);
  expect(errors).toEqual([]);
});

test("keeps tool explanations readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/target-roas-calculator/");
  await expect(page.locator("h1")).toHaveText("Target ROAS Calculator");
  await expect(page.getByText("Break-even is the floor. Target is the plan.")).toBeVisible();
  await expect(page.getByText("Target CPA", { exact: true }).last()).toBeVisible();
  await context.close();
});

test("keeps all inner tools within a mobile viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only layout assertion");
  const paths = [
    "/target-roas-calculator/",
    "/profit-lever-calculator/",
    "/promotion-profit-calculator/",
    "/cac-payback-calculator/",
    "/scenario-planner/",
  ];
  for (const path of paths) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/promotion-profit-calculator/");
  await expect(page.getByRole("button", { name: "Copy scenario" })).toBeVisible();
});

test("keeps the guide library and long-form content within a mobile viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only content layout assertion");
  for (const path of ["/guides/", ...guidePaths, "/methodology/"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
    await expect(page.locator("h1")).toBeVisible();
  }
});
