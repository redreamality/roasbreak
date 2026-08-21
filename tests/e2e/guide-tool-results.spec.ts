import { expect, test, type Page } from "@playwright/test";

type GuideJourney = {
  name: string;
  guidePath: string;
  toolPath: string;
  resultSelector: string;
  resultText: string;
  inputSelector: string;
  inputValue: string;
  restoreInputValue?: string;
  restoredResultText?: string;
};

const guideJourneys: GuideJourney[] = [
  {
    name: "methodology",
    guidePath: "/methodology/",
    toolPath: "/",
    resultSelector: "#break-even-roas",
    resultText: "1.75x",
    inputSelector: "#order-value",
    inputValue: "101",
  },
  {
    name: "ecommerce profit formulas",
    guidePath: "/guides/ecommerce-profit-formulas/",
    toolPath: "/target-roas-calculator/",
    resultSelector: "#target-roas",
    resultText: "3.33x",
    inputSelector: "#order-value",
    inputValue: "100",
  },
  {
    name: "POAS versus ROAS",
    guidePath: "/guides/poas-vs-roas/",
    toolPath: "/target-roas-calculator/",
    resultSelector: "#target-roas",
    resultText: "3.85x",
    inputSelector: "#order-value",
    inputValue: "100",
  },
  {
    name: "contribution margin",
    guidePath: "/guides/contribution-margin-vs-gross-margin/",
    toolPath: "/",
    resultSelector: "#break-even-roas",
    resultText: "2.41x",
    inputSelector: "#order-value",
    inputValue: "120",
  },
  {
    name: "revenue basis",
    guidePath: "/guides/ecommerce-revenue-basis/",
    toolPath: "/",
    resultSelector: "#break-even-roas",
    resultText: "2.05x",
    inputSelector: "#order-value",
    inputValue: "85",
  },
  {
    name: "Shopify net sales",
    guidePath: "/guides/shopify-net-sales-for-roas/",
    toolPath: "/",
    resultSelector: "#break-even-roas",
    resultText: "2.05x",
    inputSelector: "#order-value",
    inputValue: "85",
  },
  {
    name: "ROAS versus ACoS",
    guidePath: "/guides/roas-vs-acos/",
    toolPath: "/target-roas-calculator/",
    resultSelector: "#target-roas",
    resultText: "3.33x",
    inputSelector: "#gross-margin",
    inputValue: "48",
  },
  {
    name: "good ROAS",
    guidePath: "/guides/good-roas-for-profit-margin/",
    toolPath: "/target-roas-calculator/",
    resultSelector: "#target-roas",
    resultText: "3.13x",
    inputSelector: "#gross-margin",
    inputValue: "55",
  },
  {
    name: "Google target ROAS",
    guidePath: "/guides/google-ads-target-roas-profit/",
    toolPath: "/target-roas-calculator/",
    resultSelector: "#target-roas",
    resultText: "2.86x",
    inputSelector: "#gross-margin",
    inputValue: "58",
  },
  {
    name: "conversion delay and data maturity",
    guidePath: "/guides/conversion-delay-and-data-maturity/",
    toolPath: "/target-roas-calculator/",
    resultSelector: "#target-roas",
    resultText: "3.33x",
    inputSelector: "#target-profit",
    inputValue: "10",
    restoreInputValue: "12",
    restoredResultText: "3.57x",
  },
  {
    name: "Meta Ads ROAS and attribution",
    guidePath: "/guides/meta-ads-roas-and-attribution/",
    toolPath: "/target-roas-calculator/",
    resultSelector: "#target-roas",
    resultText: "3.57x",
    inputSelector: "#target-profit",
    inputValue: "10",
    restoreInputValue: "12",
    restoredResultText: "3.85x",
  },
  {
    name: "Amazon break-even ACoS",
    guidePath: "/guides/amazon-break-even-acos/",
    toolPath: "/target-roas-calculator/",
    resultSelector: "#target-roas",
    resultText: "4.00x",
    inputSelector: "#order-value",
    inputValue: "60",
  },
  {
    name: "discount versus bundle profit",
    guidePath: "/guides/discount-vs-bundle-profit/",
    toolPath: "/promotion-profit-calculator/",
    resultSelector: "#required-lift",
    resultText: "+67.3%",
    inputSelector: "#promotion-price",
    inputValue: "64",
  },
  {
    name: "free shipping profit threshold",
    guidePath: "/guides/free-shipping-profit-threshold/",
    toolPath: "/promotion-profit-calculator/",
    resultSelector: "#required-lift",
    resultText: "+18.6%",
    inputSelector: "#promotion-price",
    inputValue: "80",
  },
  {
    name: "returns and discounts",
    guidePath: "/guides/returns-and-discounts/",
    toolPath: "/promotion-profit-calculator/",
    resultSelector: "#required-lift",
    resultText: "+67.3%",
    inputSelector: "#promotion-price",
    inputValue: "64",
    restoreInputValue: "72",
    restoredResultText: "+25.2%",
  },
  {
    name: "contribution LTV versus revenue LTV",
    guidePath: "/guides/contribution-ltv-vs-revenue-ltv/",
    toolPath: "/cac-payback-calculator/",
    resultSelector: "#payback-day",
    resultText: "Day 180",
    inputSelector: "#cac",
    inputValue: "70",
  },
  {
    name: "new customer ROAS versus blended ROAS",
    guidePath: "/guides/new-customer-roas-vs-blended-roas/",
    toolPath: "/cac-payback-calculator/",
    resultSelector: "#payback-day",
    resultText: "Day 180",
    inputSelector: "#cac",
    inputValue: "80",
  },
  {
    name: "CAC payback cohort",
    guidePath: "/guides/cac-payback-cohort-data/",
    toolPath: "/cac-payback-calculator/",
    resultSelector: "#payback-day",
    resultText: "Day 90",
    inputSelector: "#cac",
    inputValue: "70",
  },
  {
    name: "TikTok Shop ROAS and attribution",
    guidePath: "/guides/tiktok-shop-roas-and-attribution/",
    toolPath: "/scenario-planner/",
    resultSelector: ".scenario-row.winner",
    resultText: "CTA + VTA",
    inputSelector: "#scenario-3-roas",
    inputValue: "2.7",
    restoreInputValue: "3.5",
    restoredResultText: "Store net",
  },
  {
    name: "attributed ROAS versus MER",
    guidePath: "/guides/attributed-roas-vs-mer/",
    toolPath: "/scenario-planner/",
    resultSelector: ".scenario-row.winner",
    resultText: "Scaled spend",
    inputSelector: "#scenario-3-roas",
    inputValue: "2.2",
    restoreInputValue: "3",
    restoredResultText: "3.00x ROAS",
  },
];

async function openPrimaryTool(page: Page, journey: GuideJourney): Promise<void> {
  if (journey.name === "methodology") {
    await page.getByRole("link", { name: "Tools", exact: true }).click();
    await expect(page).toHaveURL(/\/tools\/$/);
    await page.getByRole("link", { name: /Break-Even ROAS/ }).click();
    return;
  }

  const primaryAction = page.locator(".guide-action");
  await expect(primaryAction).toHaveCount(1);
  await primaryAction.click();
}

async function restorableUrl(page: Page, journey: GuideJourney): Promise<string> {
  if (journey.restoreInputValue) {
    await page.locator(journey.inputSelector).fill(journey.restoreInputValue);
  }

  if (journey.name === "methodology") {
    await page.locator(journey.inputSelector).fill(journey.inputValue);
    await page.getByRole("button", { name: "Copy result" }).click();
    return page.evaluate(() => navigator.clipboard.readText());
  }

  await expect.poll(() => new URL(page.url()).search).not.toBe("");
  return page.url();
}

test.describe("published guide to tool journeys", () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://127.0.0.1:4173",
    });
  });

  for (const journey of guideJourneys) {
    test(`${journey.name} opens a calculated, restorable tool result`, async ({ page }) => {
      await page.goto(journey.guidePath);
      await expect(page.locator("h1")).toBeVisible();

      await openPrimaryTool(page, journey);
      await expect.poll(() => new URL(page.url()).pathname).toBe(journey.toolPath);
      await expect(page.locator(journey.resultSelector)).toBeVisible();
      await expect(page.locator(journey.resultSelector)).toContainText(journey.resultText);

      const restoreUrl = await restorableUrl(page, journey);
      expect(new URL(restoreUrl).search).not.toBe("");

      await page.goto(journey.guidePath);
      await page.goto(restoreUrl);
      await expect(page.locator(journey.inputSelector)).toHaveValue(journey.restoreInputValue ?? journey.inputValue);
      await expect(page.locator(journey.resultSelector)).toBeVisible();
      await expect(page.locator(journey.resultSelector)).toContainText(journey.restoredResultText ?? journey.resultText);
    });
  }
});
