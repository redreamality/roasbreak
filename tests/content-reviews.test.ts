import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error The executable review script intentionally remains plain JavaScript.
import { addUtcDays, buildReviewSchedule, createReviewDraft, validateReviewLedger } from "../scripts/check-content-reviews.mjs";

const asset = {
  id: "alpha",
  type: "guide",
  status: "published",
  publishedOn: "2026-01-31",
  reviewDue: "2026-12-01",
  primaryTool: "/?mode=costs",
  sources: [
    { verifiedOn: "2026-01-20", reviewStatus: "verified" },
    { verifiedOn: "2026-01-25", reviewStatus: "verified" },
  ],
};

const inventory = { assets: [asset, { ...asset, id: "beta", publishedOn: "2026-02-01" }] };

function unavailable(reasonCode = "credentials-unavailable") {
  return {
    availability: "unavailable",
    source: "Named reporting source",
    attemptedAt: "2026-03-02T12:00:00.000Z",
    reasonCode,
    reason: "The source could not be queried with the available access.",
    evidence: ["Access check returned no usable credentials."],
  };
}

function available(value: Record<string, unknown>) {
  return {
    availability: "available",
    source: "Named reporting source",
    queriedAt: "2026-03-02T12:00:00.000Z",
    evidence: ["Saved report query and filters."],
    value,
  };
}

function validReview(assetId = "alpha", checkpointDay = 30): any {
  return {
    assetId,
    checkpointDay,
    completedAt: "2026-03-02T12:00:00.000Z",
    window: { from: "2026-01-31", through: "2026-03-01" },
    repositoryCommit: "a".repeat(40),
    signals: {
      indexing: unavailable(),
      organicSearch: unavailable(),
      guideToTool: unavailable("attribution-not-available"),
      calculations: unavailable("not-instrumented"),
      copyShare: unavailable("attribution-not-available"),
      sourceFreshness: available({
        sourceCount: 2,
        verifiedSourceCount: 2,
        oldestVerifiedOn: "2026-01-20",
        reviewDue: "2026-12-01",
        status: "current",
      }),
    },
    decision: {
      type: "observe",
      rationale: "Demand and behavior evidence are not available yet.",
      nextAction: "Restore reporting access before the day-60 checkpoint.",
    },
  };
}

function ledger(reviews: unknown[] = []) {
  return {
    schemaVersion: 1,
    policy: { checkpointDays: [30, 60, 90], timezone: "UTC" },
    reviews,
  };
}

describe("content performance review schedule", () => {
  it("adds UTC calendar days across month and leap-year boundaries", () => {
    expect(addUtcDays("2026-08-21", 30)).toBe("2026-09-20");
    expect(addUtcDays("2026-08-21", 60)).toBe("2026-10-20");
    expect(addUtcDays("2026-08-21", 90)).toBe("2026-11-19");
    expect(addUtcDays("2024-01-31", 30)).toBe("2024-03-01");
  });

  it("moves a checkpoint from scheduled to due on its exact UTC date", () => {
    expect(buildReviewSchedule({ assets: [asset] }, ledger(), "2026-03-01").schedule[0].status).toBe("scheduled");
    const result = buildReviewSchedule({ assets: [asset] }, ledger(), "2026-03-02");
    expect(result.schedule[0]).toMatchObject({ status: "due", dueOn: "2026-03-02", daysPastDue: 0 });
  });

  it("makes the CLI fail when at least one checkpoint is due", () => {
    const result = spawnSync(process.execPath, [
      fileURLToPath(new URL("../scripts/check-content-reviews.mjs", import.meta.url)),
      "--as-of",
      "2026-09-20",
    ], { encoding: "utf8" });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain(" due,");
  });

  it("marks only a complete, valid checkpoint record as completed", () => {
    const result = buildReviewSchedule({ assets: [asset] }, ledger([validReview()]), "2026-03-02");
    expect(result.failures).toEqual([]);
    expect(result.schedule[0].status).toBe("completed");
    expect(result.schedule[1].status).toBe("scheduled");
  });

  it("automatically schedules all checkpoints for a newly published asset", () => {
    const result = buildReviewSchedule(inventory, ledger(), "2026-02-01");
    expect(result.schedule).toHaveLength(6);
    expect(result.schedule.filter((entry: { assetId: string }) => entry.assetId === "beta").map((entry: { checkpointDay: number }) => entry.checkpointDay)).toEqual([30, 60, 90]);
  });
});

describe("content performance review validation", () => {
  it("rejects missing signals, duplicates, unknown assets, and unknown checkpoints", () => {
    const missingSignal = validReview();
    const { copyShare: _copyShare, ...remainingSignals } = missingSignal.signals;
    missingSignal.signals = remainingSignals as typeof missingSignal.signals;
    const unknownCheckpoint = { ...validReview(), checkpointDay: 45 };
    const unknownAsset = { ...validReview(), assetId: "missing" };
    const result = validateReviewLedger(
      { assets: [asset] },
      ledger([missingSignal, validReview(), validReview(), unknownCheckpoint, unknownAsset]),
      "2026-03-02",
    );

    expect(result.failures.some((failure: string) => failure.includes("copyShare: signal is required"))).toBe(true);
    expect(result.failures).toContain("alpha:30: duplicate review record");
    expect(buildReviewSchedule({ assets: [asset] }, ledger([validReview(), validReview()]), "2026-03-02").schedule[0].status).toBe("due");
    expect(result.failures.some((failure: string) => failure.includes("checkpointDay must be 30, 60, or 90"))).toBe(true);
    expect(result.failures.some((failure: string) => failure.includes("assetId is not a published"))).toBe(true);
  });

  it("rejects reviews completed early or in the future", () => {
    const early = { ...validReview(), completedAt: "2026-03-01T23:59:59.000Z" };
    const future = { ...validReview(), completedAt: "2026-03-03T00:00:00.000Z" };
    const earlyResult = validateReviewLedger({ assets: [asset] }, ledger([early]), "2026-03-02");
    const futureResult = validateReviewLedger({ assets: [asset] }, ledger([future]), "2026-03-02");

    expect(earlyResult.failures.some((failure: string) => failure.includes("cannot be completed before"))).toBe(true);
    expect(futureResult.failures.some((failure: string) => failure.includes("completedAt is in the future"))).toBe(true);
  });

  it("requires explicit reason and evidence when a signal is unavailable", () => {
    const review = validReview();
    review.signals.calculations = { ...unavailable("not-instrumented"), reason: "", evidence: [] };
    const result = validateReviewLedger({ assets: [asset] }, ledger([review]), "2026-03-02");

    expect(result.failures.some((failure: string) => failure.includes("calculations: reason is required"))).toBe(true);
    expect(result.failures.some((failure: string) => failure.includes("calculations: evidence must be"))).toBe(true);
  });

  it("accepts genuine zero search values but requires all typed fields", () => {
    const zero = validReview();
    zero.signals.organicSearch = available({ impressions: 0, clicks: 0, queries: [] });
    expect(validateReviewLedger({ assets: [asset] }, ledger([zero]), "2026-03-02").failures).toEqual([]);

    const incomplete = validReview();
    incomplete.signals.organicSearch = available({ impressions: 0, clicks: 0 }) as typeof incomplete.signals.organicSearch;
    expect(validateReviewLedger({ assets: [asset] }, ledger([incomplete]), "2026-03-02").failures.some(
      (failure: string) => failure.includes("value.queries must be an array"),
    )).toBe(true);
  });

  it("rejects source-freshness snapshots that drift from inventory", () => {
    const review = validReview();
    review.signals.sourceFreshness = available({
      sourceCount: 1,
      verifiedSourceCount: 1,
      oldestVerifiedOn: "2026-01-25",
      reviewDue: "2026-11-30",
      status: "current",
    });
    const failures = validateReviewLedger({ assets: [asset] }, ledger([review]), "2026-03-02").failures;

    expect(failures.some((failure: string) => failure.includes("sourceCount must match inventory"))).toBe(true);
    expect(failures.some((failure: string) => failure.includes("reviewDue must match inventory"))).toBe(true);
  });

  it("enforces the decision vocabulary and merge target", () => {
    const invalidType = validReview();
    invalidType.decision.type = "publish";
    const selfMerge = validReview();
    selfMerge.decision = { ...selfMerge.decision, type: "merge", targetAssetId: "alpha" } as typeof selfMerge.decision;

    expect(validateReviewLedger(inventory, ledger([invalidType]), "2026-03-02").failures.some(
      (failure: string) => failure.includes("decision.type must be"),
    )).toBe(true);
    expect(validateReviewLedger(inventory, ledger([selfMerge]), "2026-03-02").failures.some(
      (failure: string) => failure.includes("different published targetAssetId"),
    )).toBe(true);
  });

  it("blocks expand without positive demand and product behavior evidence", () => {
    const review = validReview();
    review.decision.type = "expand";
    review.signals.organicSearch = available({ impressions: 0, clicks: 0, queries: [] });
    review.signals.guideToTool = available({ guideId: "alpha", target: "/?mode=costs", guideViews: 0, guideToToolClicks: 0 });
    review.signals.calculations = available({ completed: 0 });
    review.signals.copyShare = available({ targetCopied: 0, leverCopied: 0, promotionCopied: 0, paybackCopied: 0, scenariosCopied: 0 });

    expect(validateReviewLedger({ assets: [asset] }, ledger([review]), "2026-03-02").failures.some(
      (failure: string) => failure.includes("expand requires positive demand"),
    )).toBe(true);

    review.signals.organicSearch = available({ impressions: 10, clicks: 1, queries: [] });
    review.signals.guideToTool = available({ guideId: "alpha", target: "/?mode=costs", guideViews: 5, guideToToolClicks: 1 });
    expect(validateReviewLedger({ assets: [asset] }, ledger([review]), "2026-03-02").failures).toEqual([]);
  });

  it("creates a stdout-ready draft without mutating the ledger", () => {
    const draft = createReviewDraft({ assets: [asset] }, "alpha:30");
    expect(draft).toMatchObject({
      assetId: "alpha",
      checkpointDay: 30,
      window: { from: "2026-01-31", through: "2026-03-01" },
      decision: { type: "observe" },
    });
  });
});
