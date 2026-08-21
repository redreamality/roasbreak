import { describe, expect, it } from "vitest";
// @ts-expect-error The production smoke executable intentionally remains plain JavaScript.
import { collectInternalLinks, inspectAssetDocument, inspectExternalSourceOutcome, inspectFetchOutcome, inspectRepositorySnapshot, inspectRobots, inspectSitemap, inspectSourceLinks } from "../scripts/production-smoke.mjs";

const origin = "https://roasbreak.com";
const guide = {
  id: "example-guide",
  type: "guide",
  url: "/guides/example/",
  reviewedOn: "2026-08-21",
  primaryTool: "/target-roas-calculator/?aov=100&profit=10",
  sources: [{ url: "https://example.com/source" }],
};

const validGuideHtml = `<!doctype html>
<html><head>
  <link rel="canonical" href="https://roasbreak.com/guides/example/">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","dateModified":"2026-08-21","mainEntityOfPage":"https://roasbreak.com/guides/example/"}</script>
  <script type="application/ld+json" data-schema="breadcrumb">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://roasbreak.com/"},{"@type":"ListItem","position":2,"name":"Example","item":"https://roasbreak.com/guides/example/"}]}</script>
</head><body>
  <a href="/guides/">Guides</a>
  <a class="guide-action" href="/target-roas-calculator/?aov=100&amp;profit=10">Calculate</a>
  <a href="https://example.com/source">Source</a>
  <a href="https://social.example/share">Share</a>
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
      articleDateModified: "2026-08-21",
      articleMainEntityOfPage: "https://roasbreak.com/guides/example/",
      breadcrumbSchemaCount: 1,
      breadcrumbFinalItem: "https://roasbreak.com/guides/example/",
      primaryCtaCount: 1,
      primaryCta: "https://roasbreak.com/target-roas-calculator/?aov=100&profit=10",
    });
  });

  it("blocks mismatched canonicals, invalid schema, and duplicate or wrong CTAs", () => {
    const html = validGuideHtml
      .replace("https://roasbreak.com/guides/example/", "https://roasbreak.com/guides/wrong/")
      .replace(
        '{"@context":"https://schema.org","@type":"Article","dateModified":"2026-08-21","mainEntityOfPage":"https://roasbreak.com/guides/example/"}',
        "{not-json}",
      )
      .replace("</body>", '<a class="guide-action" href="/scenario-planner/">Other</a></body>');
    const result = inspectAssetDocument(guide, html, origin);

    expect(result.failures).toEqual(expect.arrayContaining([
      expect.stringContaining("canonical must be exactly"),
      expect.stringContaining("invalid JSON-LD"),
      expect.stringContaining("missing static Article"),
      expect.stringContaining("expected one guide-action, found 2"),
    ]));
  });

  it("blocks stale or misassigned Article metadata and a mismatched breadcrumb destination", () => {
    const html = validGuideHtml
      .replace('"dateModified":"2026-08-21"', '"dateModified":"2026-08-20"')
      .replace(
        '"mainEntityOfPage":"https://roasbreak.com/guides/example/"',
        '"mainEntityOfPage":"https://roasbreak.com/guides/other/"',
      )
      .replace(
        '"name":"Example","item":"https://roasbreak.com/guides/example/"',
        '"name":"Example","item":"https://roasbreak.com/guides/other/"',
      );
    const result = inspectAssetDocument(guide, html, origin);

    expect(result.failures).toEqual(expect.arrayContaining([
      "example-guide: Article dateModified must be 2026-08-21; found 2026-08-20",
      `example-guide: Article mainEntityOfPage must be ${origin}/guides/example/; found ${origin}/guides/other/`,
      `example-guide: BreadcrumbList final item must be ${origin}/guides/example/; found ${origin}/guides/other/`,
    ]));
  });

  it("blocks an empty or non-ListItem breadcrumb trail", () => {
    const empty = validGuideHtml.replace(
      /"itemListElement":\[[^\n]+\]/,
      '"itemListElement":[]',
    );
    const wrongType = validGuideHtml.replace(
      '"@type":"ListItem","position":2,"name":"Example"',
      '"@type":"Thing","position":2,"name":"Example"',
    );

    expect(inspectAssetDocument(guide, empty, origin).failures).toContain(
      "example-guide: BreadcrumbList itemListElement must contain at least one item",
    );
    expect(inspectAssetDocument(guide, wrongType, origin).failures).toContain(
      "example-guide: BreadcrumbList final item must be a ListItem",
    );
  });

  it("collects unique same-origin links while preserving tool query state", () => {
    expect(collectInternalLinks(validGuideHtml, `${origin}${guide.url}`, origin)).toEqual([
      "https://roasbreak.com/guides/",
      "https://roasbreak.com/target-roas-calculator/?aov=100&profit=10",
    ]);
  });

  it("discovers only external HTTPS sources declared by the inventory", () => {
    const result = inspectSourceLinks(guide, validGuideHtml, origin);

    expect(result.failures).toEqual([]);
    expect(result.evidence).toMatchObject({
      expectedCount: 1,
      linkedCount: 1,
      linkedSources: ["https://example.com/source"],
    });
    expect(result.evidence.linkedSources).not.toContain("https://social.example/share");
  });

  it("blocks missing or non-HTTPS inventory sources without treating arbitrary links as sources", () => {
    const asset = {
      ...guide,
      sources: [
        ...guide.sources,
        { url: "http://example.com/insecure" },
        { url: "mailto:editor@example.com" },
      ],
    };
    const html = validGuideHtml.replace("https://example.com/source", "https://example.com/other");
    const result = inspectSourceLinks(asset, html, origin);

    expect(result.failures).toEqual(expect.arrayContaining([
      "example-guide: inventory source is not linked from the published document: https://example.com/source",
      "example-guide: inventory source must be an external HTTPS URL; found http://example.com/insecure",
      "example-guide: inventory source must be an external HTTPS URL; found mailto:editor@example.com",
    ]));
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

  it("accepts external source GET responses in the 2xx/3xx range and permits redirects", () => {
    const success = inspectExternalSourceOutcome({
      requestedUrl: "https://example.com/source",
      finalUrl: "https://docs.example.com/source",
      status: 200,
      contentType: "text/html",
      body: "Source",
    });
    const redirect = inspectExternalSourceOutcome({
      requestedUrl: "https://example.com/legacy",
      finalUrl: "https://example.com/current",
      status: 302,
      contentType: "text/html",
      body: "",
    });

    expect(success.failures).toEqual([]);
    expect(success.evidence).toMatchObject({
      method: "GET",
      access: "reachable",
      finalUrl: "https://docs.example.com/source",
      status: 200,
    });
    expect(redirect.failures).toEqual([]);
  });

  it("records explicit access restrictions without treating them as dead links", () => {
    const forbidden = inspectExternalSourceOutcome({
      requestedUrl: "https://example.com/source",
      finalUrl: "https://example.com/source",
      status: 403,
      contentType: "text/html",
      body: "Forbidden",
    });

    expect(forbidden.failures).toEqual([]);
    expect(forbidden.evidence).toMatchObject({ access: "restricted", status: 403 });
  });

  it("blocks failed or missing external source GET responses", () => {
    const missing = inspectExternalSourceOutcome({
      requestedUrl: "https://example.com/missing",
      finalUrl: "https://example.com/missing",
      status: 404,
      contentType: "text/html",
      body: "Not found",
    });
    const failed = inspectExternalSourceOutcome({
      requestedUrl: "https://example.com/source",
      finalUrl: null,
      status: null,
      contentType: null,
      body: "",
      attempts: 2,
      error: "timeout",
    });

    expect(missing.failures).toEqual([
      "expected HTTP 2xx/3xx or an explicit access restriction, received 404",
    ]);
    expect(failed.failures).toEqual(["GET request failed after 2 attempt(s): timeout"]);
    expect(failed.evidence).toMatchObject({ access: "unavailable", attempts: 2 });
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
