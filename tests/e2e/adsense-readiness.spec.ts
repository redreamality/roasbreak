import { expect, test } from "@playwright/test";

test("publishes real trust pages from the homepage and existing inner pages", async ({ page }) => {
  const trustPages = [
    ["/about/", "About ROAS Break"],
    ["/contact/", "Contact ROAS Break"],
    ["/privacy/", "Privacy Policy"],
    ["/terms/", "Terms of Use"],
  ];

  for (const source of ["/", "/guides/returns-and-discounts/"]) {
    await page.goto(source);
    const footer = page.getByRole("navigation", { name: "Company and legal" });
    await expect(footer.getByRole("link")).toHaveCount(4);
  }

  for (const [path, heading] of trustPages) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://roasbreak.com${path}`);
    await expect(page).not.toHaveTitle(/Break-Even ROAS Calculator/);
  }
});

test("identifies floatboat.ai as publisher and provides its email contact", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByText("It is published and maintained by floatboat.ai.")).toBeVisible();

  for (const path of ["/contact/", "/privacy/"]) {
    await page.goto(path);
    await expect(page.getByText("ROAS Break is published by floatboat.ai.")).toBeVisible();
    await expect(page.getByRole("link", { name: "contact@floatboat.ai" })).toHaveAttribute(
      "href",
      "mailto:contact@floatboat.ai",
    );
  }
});

test("loads optional analytics only after explicit acceptance", async ({ page }) => {
  await page.goto("/?customer=private-value");

  const banner = page.locator(".privacy-banner");
  await expect(banner).toBeVisible();
  await expect(page.locator('script[data-roasbreak-analytics="true"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Accept analytics" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.locator('script[data-roasbreak-analytics="true"]')).toHaveAttribute(
    "src",
    /googletagmanager\.com\/gtag\/js\?id=G-QZ5QQK45LV/,
  );
  expect(await page.evaluate(() => window.localStorage.getItem("roasbreak-privacy-choice"))).toBe("accepted");
  const analyticsConfig = await page.evaluate(() => {
    const dataLayer = (window as Window & { dataLayer?: unknown[][] }).dataLayer ?? [];
    return dataLayer.find((entry) => entry[0] === "config")?.[2] as { page_location?: string } | undefined;
  });
  expect(analyticsConfig?.page_location).toBe("http://127.0.0.1:4173/");
});

test("persists rejection and lets visitors reopen privacy settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reject optional analytics" }).click();
  await page.goto("/privacy/");

  await expect(page.locator(".privacy-banner")).toHaveCount(0);
  await expect(page.locator('script[data-roasbreak-analytics="true"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.localStorage.getItem("roasbreak-privacy-choice"))).toBe("rejected");

  await page.getByRole("button", { name: "Privacy settings" }).click();
  await expect(page.locator(".privacy-banner")).toBeVisible();
});

test("removes optional analytics after consent is revoked", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Accept analytics" }).click();
  await expect(page.locator('script[data-roasbreak-analytics="true"]')).toHaveCount(1);

  await page.goto("/privacy/");
  await page.evaluate(() => {
    (window as Window & { privacyTestMarker?: string }).privacyTestMarker = "same-page";
    document.cookie = "_ga=GA1.1.123.456; path=/";
    document.cookie = "_ga_TEST=GS1.1.123.1.0.123.0.0.0; path=/";
    document.cookie = "roasbreak-test-cookie=keep; path=/";
  });
  await page.getByRole("button", { name: "Privacy settings" }).click();
  await page.getByRole("button", { name: "Reject optional analytics" }).click();

  await expect(page.locator('script[data-roasbreak-analytics="true"]')).toHaveCount(0);
  expect(await page.evaluate(() => window.localStorage.getItem("roasbreak-privacy-choice"))).toBe("rejected");
  expect(
    await page.evaluate(() => ({
      marker: (window as Window & { privacyTestMarker?: string }).privacyTestMarker,
      disabled: (window as unknown as Record<string, unknown>)["ga-disable-G-QZ5QQK45LV"],
      dataLayer: (window as Window & { dataLayer?: unknown[] }).dataLayer,
      gtagType: typeof (window as Window & { gtag?: unknown }).gtag,
      cookies: document.cookie,
    })),
  ).toEqual({
    marker: "same-page",
    disabled: true,
    dataLayer: [],
    gtagType: "undefined",
    cookies: "roasbreak-test-cookie=keep",
  });
});

test("publishes crawler and advertising readiness files", async ({ page, request }) => {
  const adsResponse = await request.get("/ads.txt");
  expect(adsResponse.headers()["content-type"]).toContain("text/plain");
  expect(await adsResponse.text()).toContain("Add the authorized Google seller line");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of ["/about/", "/contact/", "/privacy/", "/terms/"]) {
    expect(sitemap).toContain(`<loc>https://roasbreak.com${path}</loc>`);
  }

  await page.goto("/404.html");
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
});

test("keeps the privacy choice usable on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only privacy layout assertion");
  await page.goto("/");

  const banner = page.locator(".privacy-banner");
  await expect(banner).toBeVisible();
  await expect(page.getByRole("button", { name: "Reject optional analytics" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept analytics" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
