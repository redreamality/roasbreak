import { describe, expect, it } from "vitest";
import { defaultInputs } from "../src/lib/calculator";
import {
  acosToRoas,
  calculateLevers,
  calculatePayback,
  calculatePromotion,
  calculateScaleGuardrails,
  calculateScenario,
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

  it("connects monthly budget, implied CPA, orders, and contribution profit", () => {
    const current = calculateScenario(100, 40, 3, 10_000);
    const higherBudget = calculateScenario(100, 40, 2.67, 15_000);
    const downside = calculateScenario(100, 40, 2, 15_000);

    expect(current).toEqual({ revenue: 30_000, orders: 300, impliedCpa: 100 / 3, profit: 2_000 });
    expect(higherBudget.revenue).toBeCloseTo(40_050);
    expect(higherBudget.orders).toBeCloseTo(400.5);
    expect(higherBudget.impliedCpa).toBeCloseTo(37.4532);
    expect(higherBudget.profit).toBeCloseTo(1_020);
    expect(downside).toEqual({ revenue: 30_000, orders: 300, impliedCpa: 50, profit: -3_000 });
  });

  it("blocks a higher-spend proposal on entered target and marginal evidence", () => {
    const baseline = { ...calculateScenario(100, 40, 3, 10_000), roas: 3, spend: 10_000 };
    const proposal = { ...calculateScenario(100, 40, 2.67, 15_000), roas: 2.67, spend: 15_000 };
    const result = calculateScaleGuardrails(baseline, proposal, {
      minimumRoas: 3,
      maturity: "mature",
      orderCapacity: 450,
      observedPaybackDays: 60,
      maximumPaybackDays: 90,
      minimumIncrementalProfit: 0,
    });

    expect(result.checks).toEqual({ target: "blocked", maturity: "passed", capacity: "passed", payback: "passed", marginal: "blocked" });
    expect(result.overall).toBe("blocked");
    expect(result.blockerCount).toBe(2);
    expect(result.targetGap).toBeCloseTo(-0.33);
    expect(result.capacityHeadroom).toBeCloseTo(49.5);
    expect(result.paybackHeadroom).toBe(30);
    expect(result.marginalRoas).toBeCloseTo(2.01);
    expect(result.incrementalProfit).toBeCloseTo(-980);
  });

  it("requires evidence before returning a proposal for decision review", () => {
    const baseline = { ...calculateScenario(100, 40, 3, 10_000), roas: 3, spend: 10_000 };
    const proposal = { ...calculateScenario(100, 40, 2.9, 15_000), roas: 2.9, spend: 15_000 };
    const inputs = {
      minimumRoas: 2.8,
      maturity: "mature" as const,
      orderCapacity: 450,
      observedPaybackDays: 60,
      maximumPaybackDays: 90,
      minimumIncrementalProfit: 0,
    };

    const ready = calculateScaleGuardrails(baseline, proposal, inputs);
    expect(ready.overall).toBe("ready-for-review");
    expect(ready.marginalRoas).toBeCloseTo(2.7);
    expect(ready.incrementalProfit).toBeCloseTo(400);

    const missingThreshold = calculateScaleGuardrails(baseline, proposal, { ...inputs, minimumIncrementalProfit: null });
    expect(missingThreshold.checks.marginal).toBe("needs-evidence");
    expect(missingThreshold.overall).toBe("needs-evidence");

    const noAddedSpend = calculateScaleGuardrails(baseline, { ...proposal, spend: 10_000 }, inputs);
    expect(noAddedSpend.checks.marginal).toBe("needs-evidence");
    expect(noAddedSpend.overall).toBe("needs-evidence");
  });

  it("converts ROAS and ACoS in both directions", () => {
    expect(roasToAcos(4)).toBe(25);
    expect(acosToRoas(25)).toBe(4);
  });
});
