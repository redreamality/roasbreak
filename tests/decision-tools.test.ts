import { describe, expect, it } from "vitest";
import { defaultInputs } from "../src/lib/calculator";
import {
  acosToRoas,
  calculateLevers,
  calculatePayback,
  calculatePromotion,
  calculateTarget,
  roasToAcos,
} from "../src/lib/decision-tools";

describe("decision tools", () => {
  it("converts retained profit into target ROAS, CPA, and ACoS", () => {
    const result = calculateTarget(defaultInputs, 10);

    expect(result.targetProfitPerOrder).toBeCloseTo(8);
    expect(result.targetCpa).toBeCloseTo(37.6);
    expect(result.targetRoas).toBeCloseTo(2.127659);
    expect(result.targetAcosPct).toBeCloseTo(47);
    expect(result.feasible).toBe(true);
  });

  it("rejects a profit target that consumes the contribution", () => {
    const result = calculateTarget(defaultInputs, 60);

    expect(result.feasible).toBe(false);
    expect(result.targetRoas).toBe(Number.POSITIVE_INFINITY);
    expect(result.targetCpa).toBe(0);
  });

  it("ranks unit-economic levers by added CPA room", () => {
    const results = calculateLevers(defaultInputs, 10, 2.5);

    expect(results[0]?.id).toBe("aov");
    expect(results.every((result) => result.targetCpaDelta >= 0)).toBe(true);
  });

  it("calculates the order lift required by a promotion", () => {
    const result = calculatePromotion(defaultInputs, 64, 2.5);

    expect(result.promotionContribution).toBeLessThan(result.baselineContribution);
    expect(result.requiredOrderLiftPct).toBeGreaterThan(0);
    expect(result.requiredConversionRate).toBeGreaterThan(2.5);
  });

  it("finds CAC payback from cumulative contribution", () => {
    const result = calculatePayback(70, 15, [
      { day: 30, value: 45 },
      { day: 60, value: 62 },
      { day: 90, value: 76 },
    ]);

    expect(result.paybackDay).toBe(90);
    expect(result.allowableCac).toBe(61);
    expect(result.gap).toBe(0);
  });

  it("converts ROAS and ACoS in both directions", () => {
    expect(roasToAcos(4)).toBe(25);
    expect(acosToRoas(25)).toBe(4);
  });
});
