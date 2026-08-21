import { describe, expect, it } from "vitest";
// @ts-expect-error The executable content check intentionally remains plain JavaScript.
import { validateContentReviewCadence } from "../scripts/check-content.mjs";

function inventory(asset: Record<string, unknown>, reviewPolicy: Record<string, unknown> = {
  platformWorkflowDays: 90,
  stableConceptDays: 180,
}) {
  return {
    reviewPolicy,
    assets: [{ id: "alpha", status: "published", ...asset }],
  };
}

describe("content review cadence", () => {
  it("rejects malformed and impossible publication dates", () => {
    const failures = validateContentReviewCadence(inventory({
      publishedOn: "2026-02-29",
      reviewedOn: "2026-2-28",
      reviewDue: "2026-04-31",
    }));

    expect(failures).toEqual([
      "alpha: publishedOn must be a real UTC date in YYYY-MM-DD format",
      "alpha: reviewedOn must be a real UTC date in YYYY-MM-DD format",
      "alpha: reviewDue must be a real UTC date in YYYY-MM-DD format",
    ]);
  });

  it("requires publication, review, and due dates to be chronological", () => {
    const failures = validateContentReviewCadence(inventory({
      publishedOn: "2026-02-02",
      reviewedOn: "2026-02-01",
      reviewDue: "2026-02-01",
    }));

    expect(failures).toEqual([
      "alpha: publishedOn must be on or before reviewedOn",
      "alpha: reviewedOn must be before reviewDue",
    ]);
  });

  it.each([
    [
      { platformWorkflowDays: 0, stableConceptDays: 180 },
      "reviewPolicy.platformWorkflowDays must be a positive integer",
    ],
    [
      { platformWorkflowDays: 90.5, stableConceptDays: 180 },
      "reviewPolicy.platformWorkflowDays must be a positive integer",
    ],
    [
      { platformWorkflowDays: 90, stableConceptDays: "180" },
      "reviewPolicy.stableConceptDays must be a positive integer",
    ],
    [
      { platformWorkflowDays: 90, stableConceptDays: 90 },
      "reviewPolicy platformWorkflowDays and stableConceptDays must be different",
    ],
  ])("rejects an invalid review policy %#", (reviewPolicy, expectedFailure) => {
    const failures = validateContentReviewCadence(inventory({
      publishedOn: "2026-01-31",
      reviewedOn: "2026-01-31",
      reviewDue: "2026-05-01",
    }, reviewPolicy));

    expect(failures).toContain(expectedFailure);
  });

  it("requires reviewDue to use one of the configured review periods", () => {
    const failures = validateContentReviewCadence(inventory({
      publishedOn: "2026-01-30",
      reviewedOn: "2026-01-31",
      reviewDue: "2026-05-02",
    }));

    expect(failures).toContain(
      "alpha: reviewDue must be 2026-05-01 or 2026-07-30 according to reviewPolicy",
    );
  });

  it("accepts both configured review periods", () => {
    const result = validateContentReviewCadence({
      reviewPolicy: { platformWorkflowDays: 90, stableConceptDays: 180 },
      assets: [
        {
          id: "workflow",
          status: "published",
          publishedOn: "2026-01-31",
          reviewedOn: "2026-01-31",
          reviewDue: "2026-05-01",
        },
        {
          id: "concept",
          status: "published",
          publishedOn: "2026-01-30",
          reviewedOn: "2026-01-31",
          reviewDue: "2026-07-30",
        },
      ],
    });

    expect(result).toEqual([]);
  });
});
