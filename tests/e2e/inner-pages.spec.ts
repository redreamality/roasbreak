import { expect, test } from "@playwright/test";

const guidePaths = [
  "/guides/ecommerce-profit-formulas/",
  "/guides/contribution-margin-vs-gross-margin/",
  "/guides/ecommerce-revenue-basis/",
  "/guides/shopify-net-sales-for-roas/",
  "/guides/poas-vs-roas/",
  "/guides/roas-vs-acos/",
  "/guides/good-roas-for-profit-margin/",
  "/guides/google-ads-target-roas-profit/",
  "/guides/amazon-break-even-acos/",
  "/guides/returns-and-discounts/",
  "/guides/cac-payback-cohort-data/",
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
  await expect(page.locator("#selected-lever")).toContainText("Adds");
  await page.locator('[data-lever="fees"]').click();
  await expect(page).toHaveURL(/lever=fees/);
  await page.reload();
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

test("lists every published tool and guide", async ({ page }) => {
  await page.goto("/tools/");
  await expect(page.locator(".directory-item")).toHaveCount(6);
  await page.goto("/guides/");
  await expect(page.locator(".topic-group")).toHaveCount(5);
  await expect(page.locator(".topic-guide")).toHaveCount(13);
  await expect(page.getByRole("link", { name: /Ecommerce Profit Formulas/ })).toHaveAttribute("href", "/guides/ecommerce-profit-formulas/");
  await expect(page.getByRole("link", { name: /POAS vs ROAS/ })).toHaveAttribute("href", "/guides/poas-vs-roas/");
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
    const isNewGuide = ["/guides/ecommerce-profit-formulas/", "/guides/poas-vs-roas/"].includes(path);
    await page.goto(path);
    await expect(page.locator("[data-editorial-meta]")).toContainText(isNewGuide ? "Reviewed August 21, 2026" : "Reviewed August 20, 2026");
    await expect(page.locator("[data-content-scope]")).toContainText("Scope: ");
    if (path === "/guides/ecommerce-profit-formulas/") {
      await expect(page).toHaveTitle("Ecommerce Profit Formulas: ROAS, CPA, POAS, MER & Payback");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Connect ecommerce contribution margin/);
      await expect(page.locator("[data-content-scope]")).toContainText("Global, platform-agnostic");
    }
    if (path === "/guides/poas-vs-roas/") {
      await expect(page).toHaveTitle("POAS vs ROAS: Why High Revenue ROAS Can Mean Weak Profit | ROAS Break");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /contribution profit after ads divided by ad spend/);
      await expect(page.locator("[data-content-scope]")).toContainText("Global ecommerce");
      await expect(page.getByText("POAS = contribution profit after ads / ad spend", { exact: true })).toBeVisible();
      await expect(page.locator('script[data-schema="breadcrumb"]')).toHaveCount(1);
    }
    await expect(page.locator(".source-list a").first()).toHaveAttribute("href", /^https:\/\//);
    await expect(page.locator(".guide-action")).toHaveCount(1);
    const articleSchema = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(articleSchema, path).toContain('"@type":"Article"');
    expect(articleSchema, path).toContain(`"dateModified":"${isNewGuide ? "2026-08-21" : "2026-08-20"}"`);
  }
});

test("restores worked guide examples in the matching calculator", async ({ page }) => {
  await page.goto("/guides/shopify-net-sales-for-roas/");
  await page.locator(".guide-action").click();
  await expect(page).toHaveURL(/aov=85.*cogs=30.*ship=8/);
  await expect(page.locator("#order-value")).toHaveValue("85");
  await expect(page.locator("#break-even-roas")).toHaveText("2.05x");

  await page.goto("/guides/google-ads-target-roas-profit/");
  await page.locator(".guide-action").click();
  await expect(page.locator("#target-roas")).toHaveText("2.86x");
  await expect(page.locator("#target-cpa")).toHaveText("$35.00");

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
