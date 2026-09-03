import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error The executable release script intentionally remains plain JavaScript.
import { contentSha256, createReleaseContract, validateManualReviews, validateReleaseBaseline } from "../scripts/release-check.mjs";

const checkIds = [
  "semantic-intent-alignment",
  "facts-vs-recommendations",
  "worked-example-recalculation",
] as const;

type CheckId = typeof checkIds[number];

function reviewCheck(result = "passed") {
  return {
    result,
    reviewer: "Independent reviewer",
    reviewedAt: "2026-08-21",
    evidence: ["Specific page evidence and an independently verified conclusion."],
  };
}

function assetReview(id: string, reviewedOn = "2026-08-20", hash = contentSha256(`<article>${id}</article>`)) {
  return {
    id,
    reviewedOn,
    contentSha256: hash,
    checks: Object.fromEntries(checkIds.map((checkId) => [checkId, reviewCheck()])) as Partial<Record<CheckId, ReturnType<typeof reviewCheck>>>,
  };
}

const assets = [
  { id: "alpha", reviewedOn: "2026-08-20", contentSha256: contentSha256("<article>alpha</article>") },
  { id: "beta", reviewedOn: "2026-08-21", contentSha256: contentSha256("<article>beta</article>") },
];

const releaseAssets = [
  {
    id: "alpha",
    type: "guide",
    url: "/guides/alpha/",
    file: "guides/alpha/index.html",
    primaryIntent: "Calculate an alpha decision",
    reviewedOn: "2026-08-20",
    primaryTool: "/target-roas-calculator/?aov=100",
    contentSha256: contentSha256("<article>alpha</article>"),
  },
  {
    id: "beta",
    type: "guide",
    url: "/guides/beta/",
    file: "guides/beta/index.html",
    primaryIntent: "Compare beta scenarios",
    reviewedOn: "2026-08-21",
    primaryTool: "/scenario-planner/?s1n=Baseline",
    contentSha256: contentSha256("<article>beta</article>"),
  },
];
const releaseSources = {
  inventory: '{"assets":["alpha","beta"]}\n',
  manualReview: '{"reviews":["alpha","beta"]}\n',
  sitemap: "<urlset><url>alpha</url><url>beta</url></urlset>\n",
};
const releaseContract = createReleaseContract(releaseAssets, releaseSources);

function releaseBaseline(baselineAssets = releaseAssets) {
  return {
    schemaVersion: 2,
    contract: releaseContract,
    assets: baselineAssets,
    summary: { releaseDecision: "passed" },
  };
}

describe("committed content release baseline", () => {
  it("passes a structurally identical baseline regardless of asset order", () => {
    expect(validateReleaseBaseline(releaseAssets, releaseContract, releaseBaseline([...releaseAssets].reverse()))).toEqual([]);
  });

  it.each([
    ["type", "methodology"],
    ["url", "/guides/old-alpha/"],
    ["file", "guides/old-alpha/index.html"],
    ["primaryIntent", "Read an old alpha definition"],
    ["reviewedOn", "2026-08-19"],
    ["primaryTool", "/tools/"],
    ["contentSha256", contentSha256("<article>old alpha</article>")],
  ] as const)("blocks a stale %s field", (field, staleValue) => {
    const baselineAssets = releaseAssets.map((asset) => asset.id === "alpha" ? { ...asset, [field]: staleValue } : asset);
    const failures = validateReleaseBaseline(releaseAssets, releaseContract, releaseBaseline(baselineAssets));

    expect(failures).toContain(`alpha: committed baseline ${field} ${staleValue} does not match current ${releaseAssets[0][field]}`);
  });

  it("blocks missing evidence, missing assets, unexpected assets, and duplicate records", () => {
    const baselineAssets = [
      { ...releaseAssets[0], contentSha256: undefined },
      { ...releaseAssets[0] },
      { ...releaseAssets[1], id: "retired" },
    ];
    const failures = validateReleaseBaseline(releaseAssets, releaseContract, releaseBaseline(baselineAssets));

    expect(failures).toContain("alpha: duplicate committed baseline record");
    expect(failures).toContain("alpha: committed baseline contentSha256 is missing");
    expect(failures).toContain("beta: missing from committed release baseline");
    expect(failures).toContain("retired: committed baseline record is not a current published asset");
  });

  it("blocks a missing or malformed asset collection", () => {
    expect(validateReleaseBaseline(releaseAssets, releaseContract, { ...releaseBaseline(), assets: undefined })).toContain(
      "committed baseline assets must be an array",
    );
  });

  it("blocks an old schema, a failed report, and a stale contract", () => {
    const failures = validateReleaseBaseline(releaseAssets, releaseContract, {
      ...releaseBaseline(),
      schemaVersion: 1,
      contract: { version: 0, sha256: "stale-contract" },
      summary: { releaseDecision: "blocked" },
    });

    expect(failures).toContain("committed baseline schemaVersion must be 2");
    expect(failures).toContain("committed baseline releaseDecision must be passed");
    expect(failures).toContain("committed baseline contract version must be 1");
    expect(failures).toContain(`committed baseline contract stale-contract does not match current ${releaseContract.sha256}`);
  });

  it.each(["inventory", "manualReview", "sitemap"] as const)("changes the contract when %s evidence changes", (field) => {
    const changedContract = createReleaseContract(releaseAssets, { ...releaseSources, [field]: `${releaseSources[field]}changed` });

    expect(changedContract).not.toEqual(releaseContract);
  });
});

describe("production deployment workflow", () => {
  it("runs the HTTP production smoke gate after Cloudflare Pages deploy", () => {
    const workflow = readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");
    const deployIndex = workflow.indexOf("name: Deploy to Cloudflare Pages");
    const smokeIndex = workflow.indexOf("name: Production smoke");

    expect(deployIndex).toBeGreaterThanOrEqual(0);
    expect(smokeIndex).toBeGreaterThan(deployIndex);
    expect(workflow).toContain("run: pnpm production:smoke --output /tmp/roasbreak-production-smoke.json");
    expect(workflow).not.toContain("production:smoke:browser");
  });
});

describe("manual content review release gate", () => {
  it("validates the committed start-of-task review scope", () => {
    const inventory = JSON.parse(readFileSync(new URL("../content/content-inventory.json", import.meta.url), "utf8"));
    const reviewDocument = JSON.parse(readFileSync(new URL("../content/content-manual-review.json", import.meta.url), "utf8"));
    const reviewedIds = new Set(reviewDocument.assets.map((asset: { id: string }) => asset.id));
    const scopedAssets = inventory.assets
      .filter((asset: { id: string; status: string }) => asset.status === "published" && reviewedIds.has(asset.id))
      .map((asset: { file: string }) => ({
        ...asset,
        contentSha256: contentSha256(readFileSync(new URL(`../${asset.file}`, import.meta.url))),
      }));

    expect(reviewedIds.size).toBe(reviewDocument.scope.assetCount);
    expect(scopedAssets).toHaveLength(reviewDocument.scope.assetCount);
    expect(validateManualReviews(scopedAssets, reviewDocument).every((check: { status: string }) => check.status === "passed")).toBe(true);
  });

  it("passes all three checks only with complete current evidence", () => {
    const checks = validateManualReviews(assets, {
      assets: [assetReview("alpha"), assetReview("beta", "2026-08-21")],
    });

    expect(checks).toHaveLength(3);
    expect(checks.every((check: { status: string }) => check.status === "passed")).toBe(true);
  });

  it("blocks every semantic check when a published asset is missing", () => {
    const checks = validateManualReviews(assets, { assets: [assetReview("alpha")] });

    expect(checks.every((check: { status: string }) => check.status === "failed")).toBe(true);
    expect(checks.flatMap((check: { failures: string[] }) => check.failures)).toContain("beta: missing manual review record");
  });

  it("blocks stale review records whose reviewedOn no longer matches inventory", () => {
    const stale = assetReview("alpha", "2026-08-19");
    const checks = validateManualReviews([assets[0]], { assets: [stale] });

    expect(checks.every((check: { status: string }) => check.status === "failed")).toBe(true);
    expect(checks[0].failures).toContain("alpha: manual review targets 2026-08-19, inventory reviewedOn is 2026-08-20");
  });

  it("blocks a same-day content change when the review targets the old HTML hash", () => {
    const oldHash = contentSha256("<article>Original content</article>\n");
    const changedHash = contentSha256("<article>Changed content</article>\n");
    const review = assetReview("alpha", "2026-08-20", oldHash);
    const changedAsset = { ...assets[0], contentSha256: changedHash };
    const checks = validateManualReviews([changedAsset], { assets: [review] });

    expect(checks.every((check: { status: string }) => check.status === "failed")).toBe(true);
    expect(checks[0].failures).toContain(`alpha: manual review contentSha256 ${oldHash} does not match current HTML ${changedHash}`);
  });

  it("canonicalizes text line endings without hiding real content changes", () => {
    const lf = Buffer.from("<article>Stable</article>\n", "utf8");
    const crlf = Buffer.from("<article>Stable</article>\r\n", "utf8");
    const cr = Buffer.from("<article>Stable</article>\r", "utf8");

    expect(contentSha256(lf)).toBe(contentSha256(crlf));
    expect(contentSha256(lf)).toBe(contentSha256(cr));

    const oldHash = contentSha256("<article>Original content</article>\n");
    const changedHash = contentSha256("<article>Changed content</article>\n");
    const review = assetReview("alpha", "2026-08-20", oldHash);
    const checks = validateManualReviews([{ ...assets[0], contentSha256: changedHash }], { assets: [review] });

    expect(checks.every((check: { status: string }) => check.status === "failed")).toBe(true);
    expect(checks[0].failures).toContain(`alpha: manual review contentSha256 ${oldHash} does not match current HTML ${changedHash}`);
  });

  it("blocks a missing check and an explicit failed result", () => {
    const missing = assetReview("alpha");
    delete missing.checks["facts-vs-recommendations"];
    const failed = assetReview("beta", "2026-08-21");
    failed.checks["worked-example-recalculation"] = reviewCheck("failed");
    failed.checks["semantic-intent-alignment"] = { ...reviewCheck(), evidence: [] };
    const checks = validateManualReviews(assets, { assets: [missing, failed] });

    expect(checks.find((check: { id: string }) => check.id === "semantic-intent-alignment")?.status).toBe("failed");
    expect(checks.find((check: { id: string }) => check.id === "facts-vs-recommendations")?.status).toBe("failed");
    expect(checks.find((check: { id: string }) => check.id === "worked-example-recalculation")?.status).toBe("failed");
    expect(checks.flatMap((check: { failures: string[] }) => check.failures)).toContain("beta: semantic-intent-alignment evidence must be a non-empty string array");
    expect(checks.flatMap((check: { failures: string[] }) => check.failures)).toContain("alpha: missing facts-vs-recommendations check");
    expect(checks.flatMap((check: { failures: string[] }) => check.failures)).toContain("beta: worked-example-recalculation result is failed");
  });
});
