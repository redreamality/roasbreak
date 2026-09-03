import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

type ContentAsset = {
  id: string;
  url: string;
};

type BreadcrumbItem = {
  "@type": string;
  position: number;
  name: string;
  item: string;
};

type BreadcrumbSchema = {
  "@context": string;
  "@type": string;
  itemListElement: BreadcrumbItem[];
};

const inventory = JSON.parse(
  await readFile(resolve(process.cwd(), "content/content-inventory.json"), "utf8"),
) as { assets: ContentAsset[] };

const schemaSelector = 'head script[type="application/ld+json"][data-schema="breadcrumb"]';

test.describe("static content breadcrumb schema", () => {
  test.use({ javaScriptEnabled: false });

  for (const asset of inventory.assets) {
    test(`${asset.id} exposes schema without JavaScript`, async ({ page }) => {
      await page.goto(asset.url);

      const schemaNodes = page.locator(schemaSelector);
      await expect(schemaNodes).toHaveCount(1);
      const schema = JSON.parse(await schemaNodes.textContent() ?? "") as BreadcrumbSchema;

      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical).toBe(`https://roasbreak.com${asset.url}`);
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("BreadcrumbList");

      const visibleItems = page.locator(".breadcrumb > *");
      const visibleNames = (await visibleItems.allTextContents()).map((name) => name.trim());
      expect(schema.itemListElement.map(({ name }) => name)).toEqual(visibleNames);
      expect(schema.itemListElement.map(({ position }) => position)).toEqual(
        visibleNames.map((_, index) => index + 1),
      );

      const expectedUrls: string[] = [];
      for (let index = 0; index < await visibleItems.count(); index += 1) {
        const href = await visibleItems.nth(index).getAttribute("href");
        expectedUrls.push(href ? new URL(href, "https://roasbreak.com").href : canonical ?? "");
      }
      expect(schema.itemListElement.map(({ item }) => item)).toEqual(expectedUrls);
    });
  }

  for (const directory of [
    { url: "/guides/", name: "Guides", canonical: "https://roasbreak.com/guides/" },
    { url: "/tools/", name: "Tools", canonical: "https://roasbreak.com/tools/" },
    { url: "/target-roas-calculator/", name: "Target ROAS Calculator", canonical: "https://roasbreak.com/target-roas-calculator/" },
    { url: "/profit-lever-calculator/", name: "Profit Lever Calculator", canonical: "https://roasbreak.com/profit-lever-calculator/" },
    { url: "/promotion-profit-calculator/", name: "Promotion Profit Calculator", canonical: "https://roasbreak.com/promotion-profit-calculator/" },
    { url: "/cac-payback-calculator/", name: "CAC Payback Calculator", canonical: "https://roasbreak.com/cac-payback-calculator/" },
    { url: "/scenario-planner/", name: "Scenario Planner", canonical: "https://roasbreak.com/scenario-planner/" },
    { url: "/about/", name: "About", canonical: "https://roasbreak.com/about/" },
    { url: "/contact/", name: "Contact", canonical: "https://roasbreak.com/contact/" },
    { url: "/privacy/", name: "Privacy Policy", canonical: "https://roasbreak.com/privacy/" },
    { url: "/terms/", name: "Terms of Use", canonical: "https://roasbreak.com/terms/" },
    { url: "/methodology/", name: "Methodology", canonical: "https://roasbreak.com/methodology/" },
  ]) {
    test(`${directory.name} directory exposes its static breadcrumb without JavaScript`, async ({ page }) => {
      await page.goto(directory.url);

      const schemaNodes = page.locator(schemaSelector);
      await expect(schemaNodes).toHaveCount(1);
      const schema = JSON.parse(await schemaNodes.textContent() ?? "") as BreadcrumbSchema;
      const visibleNames = (await page.locator(".breadcrumb > *").allTextContents()).map((name) => name.trim());
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");

      expect(canonical).toBe(directory.canonical);
      expect(schema.itemListElement.map(({ name }) => name)).toEqual(visibleNames);
      expect(schema.itemListElement.map(({ position }) => position)).toEqual([1, 2]);
      expect(schema.itemListElement.map(({ item }) => item)).toEqual([
        "https://roasbreak.com/",
        directory.canonical,
      ]);
    });
  }
});

test("runtime breadcrumb schema is a fallback and never a duplicate", async ({ page }) => {
  await page.goto("/target-roas-calculator/");
  await expect(page.locator('script[type="application/ld+json"][data-schema="breadcrumb"]')).toHaveCount(1);

  await page.goto("/methodology/");
  await expect(page.locator('script[type="application/ld+json"][data-schema="breadcrumb"]')).toHaveCount(1);
});
