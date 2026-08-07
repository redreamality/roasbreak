import { describe, expect, it } from "vitest";
import { calculateBreakEvenRoas, defaultInputs } from "../src/lib/calculator";

describe("calculateBreakEvenRoas", () => {
  it("calculates break-even ROAS from a gross margin", () => {
    const result = calculateBreakEvenRoas(defaultInputs);

    expect(result.contributionMargin).toBeCloseTo(0.57);
    expect(result.contributionPerOrder).toBeCloseTo(45.6);
    expect(result.breakEvenRoas).toBeCloseTo(1.754386);
    expect(result.maxCpa).toBeCloseTo(45.6);
    expect(result.profitPerOrder).toBeCloseTo(13.6);
    expect(result.profitPerThousand).toBeCloseTo(425);
    expect(result.status).toBe("above");
  });

  it("calculates contribution from an itemized cost breakdown", () => {
    const result = calculateBreakEvenRoas({ ...defaultInputs, mode: "costs" });

    expect(result.contributionPerOrder).toBeCloseTo(36.6);
    expect(result.contributionMargin).toBeCloseTo(0.4575);
    expect(result.breakEvenRoas).toBeCloseTo(2.185792);
    expect(result.maxCpa).toBeCloseTo(36.6);
    expect(result.profitPerOrder).toBeCloseTo(4.6);
  });

  it("flags current performance below the threshold", () => {
    const result = calculateBreakEvenRoas({ ...defaultInputs, currentRoas: 1.5 });

    expect(result.status).toBe("below");
    expect(result.profitPerOrder).toBeLessThan(0);
    expect(result.profitPerThousand).toBeLessThan(0);
  });

  it("treats values within two percent of the threshold as break-even", () => {
    const exactBreakEven = 1 / 0.57;
    const result = calculateBreakEvenRoas({ ...defaultInputs, currentRoas: exactBreakEven * 1.01 });

    expect(result.status).toBe("at");
  });

  it("returns an unviable state when variable costs exceed revenue", () => {
    const result = calculateBreakEvenRoas({
      ...defaultInputs,
      grossMarginPct: 5,
      feePct: 4,
      returnPct: 6,
    });

    expect(result.breakEvenRoas).toBe(Number.POSITIVE_INFINITY);
    expect(result.maxCpa).toBe(0);
    expect(result.status).toBe("unviable");
  });
});
