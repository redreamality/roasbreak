import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error The executable release script intentionally remains plain JavaScript.
import { contentSha256, validateManualReviews } from "../scripts/release-check.mjs";

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

  it("hashes the exact HTML bytes", () => {
    expect(contentSha256(Buffer.from("<article>Stable</article>\n", "utf8"))).not.toBe(
      contentSha256(Buffer.from("<article>Stable</article>\r\n", "utf8")),
    );
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
