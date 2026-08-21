import { describe, expect, it } from "vitest";
// @ts-expect-error The production smoke executable intentionally remains plain JavaScript.
import { collectInternalLinks, inspectAssetDocument, inspectFetchOutcome, inspectRepositorySnapshot, inspectRobots, inspectSitemap } from "../scripts/production-smoke.mjs";

const origin = "https://roasbreak.com";
const guide = {
  id: "example-guide",
  type: "guide",
  url: "/guides/example/",
  primaryTool: "/target-roas-calculator/?aov=100&profit=10",
};

const validGuideHtml = `<!doctype html>
<html><head>
  <link rel="canonical" href="https://roasbreak.com/guides/example/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>
  <script type="application/ld+json" data-schema="breadcrumb">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}</script>
</head><body>
  <a href="/guides/">Guides</a>
  <a class="guide-action" href="/target-roas-calculator/?aov=100&amp;profit=10">Calculate</a>
  <a href="https://example.com/source">Source</a>
  <a href="mailto:editor@example.com">Email</a>
  <a href="#answer">Jump</a>
</body></html>`;

describe("production smoke document contracts", () => {
  it("accepts a guide with matching canonical, static schemas, and one inventory CTA", () => {
    const result = inspectAssetDocument(guide, validGuideHtml, origin);

    expect(result.failures).toEqual([]);
    expect(result.evidence).toMatchObject({
      canonicalCount: 1,
      articleSchemaCount: 1,
      breadcrumbSchemaCount: 1,
      primaryCtaCount: 1,
      primaryCta: "https://roasbreak.com/target-roas-calculator/?aov=100&profit=10",
    });
  });

  it("blocks mismatched canonicals, invalid schema, and duplicate or wrong CTAs", () => {
    const html = validGuideHtml
      .replace("https://roasbreak.com/guides/example/", "https://roasbreak.com/guides/wrong/")
      .replace('{"@context":"https://schema.org","@type":"Article"}', "{not-json}")
      .replace("</body>", '<a class="guide-action" href="/scenario-planner/">Other</a></body>');
    const result = inspectAssetDocument(guide, html, origin);

    expect(result.failures).toEqual(expect.arrayContaining([
      expect.stringContaining("canonical must be exactly"),
      expect.stringContaining("invalid JSON-LD"),
      expect.stringContaining("missing static Article"),
      expect.stringContaining("expected one guide-action, found 2"),
    ]));
  });

  it("collects unique same-origin links while preserving tool query state", () => {
    expect(collectInternalLinks(validGuideHtml, `${origin}${guide.url}`, origin)).toEqual([
      "https://roasbreak.com/guides/",
      "https://roasbreak.com/target-roas-calculator/?aov=100&profit=10",
    ]);
  });
});

describe("production smoke discovery contracts", () => {
  it("accepts a crawlable robots file with the production sitemap", () => {
    const result = inspectRobots(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, origin);

    expect(result.failures).toEqual([]);
    expect(result.evidence).toMatchObject({ wildcardGroupCount: 1, disallowsRoot: false });
  });

  it("blocks a wildcard root disallow and a missing production sitemap directive", () => {
    const result = inspectRobots("User-agent: *\nDisallow: /\nSitemap: https://other.example/sitemap.xml\n", origin);

    expect(result.failures).toEqual(expect.arrayContaining([
      expect.stringContaining("disallows the site root"),
      expect.stringContaining("must declare https://roasbreak.com/sitemap.xml"),
    ]));
  });

  it("requires every published canonical exactly once in the sitemap", () => {
    const assets = [guide, { ...guide, id: "second", url: "/guides/second/" }];
    const sitemap = `<urlset><url><loc>${origin}${guide.url}</loc></url><url><loc>${origin}/guides/second/</loc></url></urlset>`;

    expect(inspectSitemap(sitemap, assets, origin).failures).toEqual([]);

    const broken = `<urlset><url><loc>${origin}${guide.url}</loc></url><url><loc>${origin}${guide.url}</loc></url></urlset>`;
    expect(inspectSitemap(broken, assets, origin).failures).toEqual([
      `${origin}${guide.url} appears 2 times in sitemap; expected exactly once`,
      `${origin}/guides/second/ appears 0 times in sitemap; expected exactly once`,
    ]);
  });

  it("blocks non-200 responses and unexpected final URLs", () => {
    const result = inspectFetchOutcome({
      requestedUrl: `${origin}${guide.url}`,
      finalUrl: `${origin}/login/`,
      status: 404,
      contentType: "text/html",
      body: "Not found",
    }, `${origin}${guide.url}`);

    expect(result.failures).toEqual([
      "expected HTTP 200, received 404",
      `final URL https://roasbreak.com/login/ does not match ${origin}${guide.url}`,
    ]);
  });
});

describe("production smoke evidence contracts", () => {
  const cleanState = {
    commit: "abc123",
    branch: "main",
    workingTreeClean: true,
    workingTreeStatus: [],
  };

  it("accepts a stable clean repository and inventory snapshot", () => {
    expect(inspectRepositorySnapshot(cleanState, cleanState, "hash", "hash").failures).toEqual([]);
  });

  it("blocks dirty or changing evidence snapshots", () => {
    const start = { ...cleanState, workingTreeClean: false, workingTreeStatus: ["M inventory.json"] };
    const end = { ...cleanState, commit: "def456", workingTreeStatus: [] };

    expect(inspectRepositorySnapshot(start, end, "before", "after").failures).toEqual([
      "production evidence must start from a clean working tree",
      "HEAD changed during smoke (abc123 -> def456)",
      "working tree status changed during smoke",
      "content inventory changed during smoke",
    ]);
  });
});
