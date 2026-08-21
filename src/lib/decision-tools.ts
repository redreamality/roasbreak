import { calculateBreakEvenRoas, type CalculatorInputs } from "./calculator";

export interface TargetResult {
  contributionPerOrder: number;
  contributionMargin: number;
  breakEvenRoas: number;
  targetProfitPerOrder: number;
  targetCpa: number;
  targetRoas: number;
  targetAcosPct: number;
  feasible: boolean;
}

export interface LeverResult {
  id: string;
  label: string;
  change: string;
  targetCpa: number;
  targetCpaDelta: number;
  profitPerOrder: number;
  profitDelta: number;
  targetRoas: number;
}

export interface PromotionResult {
  baselineContribution: number;
  promotionContribution: number;
  baselineBreakEvenRoas: number;
  promotionBreakEvenRoas: number;
  contributionChange: number;
  requiredOrderLiftPct: number;
  requiredConversionRate: number;
}

export interface PaybackResult {
  allowableCac: number;
  paybackDay: number | null;
  gap: number;
  recoveredPct: number;
}

export interface ScenarioResult {
  revenue: number;
  orders: number;
  impliedCpa: number;
  profit: number;
}

export type ScaleEvidenceStatus = "passed" | "blocked" | "needs-evidence";
export type ScaleReviewStatus = "blocked" | "needs-evidence" | "ready-for-review";
export type ScaleMaturity = "not-checked" | "mature" | "immature";

export interface ScaleScenarioEvidence extends ScenarioResult {
  roas: number;
  spend: number;
}

export interface ScaleGuardrailInputs {
  minimumRoas: number | null;
  maturity: ScaleMaturity;
  orderCapacity: number | null;
  observedPaybackDays: number | null;
  maximumPaybackDays: number | null;
  minimumIncrementalProfit: number | null;
}

export interface ScaleGuardrailResult {
  checks: {
    target: ScaleEvidenceStatus;
    maturity: ScaleEvidenceStatus;
    capacity: ScaleEvidenceStatus;
    payback: ScaleEvidenceStatus;
    marginal: ScaleEvidenceStatus;
  };
  overall: ScaleReviewStatus;
  blockerCount: number;
  targetGap: number | null;
  capacityHeadroom: number | null;
  paybackHeadroom: number | null;
  incrementalSpend: number;
  incrementalRevenue: number;
  marginalRoas: number | null;
  incrementalProfit: number;
}

const finiteNonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export function calculateScenario(
  aov: number,
  contributionMarginPct: number,
  roas: number,
  spend: number,
): ScenarioResult {
  const safeAov = finiteNonNegative(aov);
  const safeMargin = finiteNonNegative(contributionMarginPct) / 100;
  const safeRoas = finiteNonNegative(roas);
  const safeSpend = finiteNonNegative(spend);
  const revenue = safeSpend * safeRoas;
  const orders = safeAov > 0 ? revenue / safeAov : 0;

  return {
    revenue,
    orders,
    impliedCpa: orders > 0 ? safeSpend / orders : Number.POSITIVE_INFINITY,
    profit: revenue * safeMargin - safeSpend,
  };
}

export function calculateScaleGuardrails(
  baseline: ScaleScenarioEvidence,
  proposal: ScaleScenarioEvidence,
  inputs: ScaleGuardrailInputs,
): ScaleGuardrailResult {
  const optionalInput = (value: number | null): number | null =>
    value !== null && Number.isFinite(value) && value >= 0 ? value : null;
  const minimumRoas = optionalInput(inputs.minimumRoas);
  const orderCapacity = optionalInput(inputs.orderCapacity);
  const observedPaybackDays = optionalInput(inputs.observedPaybackDays);
  const maximumPaybackDays = optionalInput(inputs.maximumPaybackDays);
  const minimumIncrementalProfit = optionalInput(inputs.minimumIncrementalProfit);
  const incrementalSpend = proposal.spend - baseline.spend;
  const incrementalRevenue = proposal.revenue - baseline.revenue;
  const incrementalProfit = proposal.profit - baseline.profit;
  const marginalRoas = incrementalSpend > 0 ? incrementalRevenue / incrementalSpend : null;

  const checks = {
    target: minimumRoas === null
      ? "needs-evidence"
      : proposal.roas >= minimumRoas ? "passed" : "blocked",
    maturity: inputs.maturity === "mature"
      ? "passed"
      : inputs.maturity === "immature" ? "blocked" : "needs-evidence",
    capacity: orderCapacity === null
      ? "needs-evidence"
      : proposal.orders <= orderCapacity ? "passed" : "blocked",
    payback: observedPaybackDays === null || maximumPaybackDays === null
      ? "needs-evidence"
      : observedPaybackDays <= maximumPaybackDays ? "passed" : "blocked",
    marginal: minimumIncrementalProfit === null || incrementalSpend <= 0
      ? "needs-evidence"
      : incrementalProfit >= minimumIncrementalProfit ? "passed" : "blocked",
  } satisfies ScaleGuardrailResult["checks"];
  const statuses = Object.values(checks);
  const blockerCount = statuses.filter((status) => status === "blocked").length;
  const overall = blockerCount > 0
    ? "blocked"
    : statuses.includes("needs-evidence") ? "needs-evidence" : "ready-for-review";

  return {
    checks,
    overall,
    blockerCount,
    targetGap: minimumRoas === null ? null : proposal.roas - minimumRoas,
    capacityHeadroom: orderCapacity === null ? null : orderCapacity - proposal.orders,
    paybackHeadroom: observedPaybackDays === null || maximumPaybackDays === null
      ? null
      : maximumPaybackDays - observedPaybackDays,
    incrementalSpend,
    incrementalRevenue,
    marginalRoas,
    incrementalProfit,
  };
}

export function calculateTarget(
  inputs: CalculatorInputs,
  targetProfitPct: number,
): TargetResult {
  const base = calculateBreakEvenRoas(inputs);
  const orderValue = finiteNonNegative(inputs.orderValue);
  const targetProfitPerOrder = orderValue * (finiteNonNegative(targetProfitPct) / 100);
  const targetCpa = base.contributionPerOrder - targetProfitPerOrder;
  const feasible = orderValue > 0 && targetCpa > 0;

  return {
    contributionPerOrder: base.contributionPerOrder,
    contributionMargin: base.contributionMargin,
    breakEvenRoas: base.breakEvenRoas,
    targetProfitPerOrder,
    targetCpa: Math.max(0, targetCpa),
    targetRoas: feasible ? orderValue / targetCpa : Number.POSITIVE_INFINITY,
    targetAcosPct: feasible ? (targetCpa / orderValue) * 100 : 0,
    feasible,
  };
}

export function calculateProfitAtRoas(
  inputs: CalculatorInputs,
  roas: number,
): number {
  const base = calculateBreakEvenRoas(inputs);
  return roas > 0 ? base.contributionPerOrder - inputs.orderValue / roas : Number.NEGATIVE_INFINITY;
}

export function calculateLevers(
  inputs: CalculatorInputs,
  targetProfitPct: number,
  currentRoas: number,
): LeverResult[] {
  const baselineTarget = calculateTarget(inputs, targetProfitPct);
  const baselineProfit = calculateProfitAtRoas(inputs, currentRoas);
  const isCostMode = inputs.mode === "costs";
  const candidates: Array<{
    id: string;
    label: string;
    change: string;
    apply: (value: CalculatorInputs) => CalculatorInputs;
    available: boolean;
  }> = [
    {
      id: "aov",
      label: "Raise average order value",
      change: "+10%",
      apply: (value) => ({ ...value, orderValue: value.orderValue * 1.1 }),
      available: true,
    },
    {
      id: "cogs",
      label: "Reduce product cost",
      change: "-10%",
      apply: (value) => ({ ...value, productCost: value.productCost * 0.9 }),
      available: isCostMode,
    },
    {
      id: "fulfillment",
      label: "Reduce fulfillment cost",
      change: "-10%",
      apply: (value) => ({ ...value, fulfillmentCost: value.fulfillmentCost * 0.9 }),
      available: isCostMode,
    },
    {
      id: "fees",
      label: "Reduce payment and platform fees",
      change: "-1pp",
      apply: (value) => ({ ...value, feePct: Math.max(0, value.feePct - 1) }),
      available: true,
    },
    {
      id: "returns",
      label: "Reduce returns and discounts",
      change: "-2pp",
      apply: (value) => ({ ...value, returnPct: Math.max(0, value.returnPct - 2) }),
      available: true,
    },
  ];

  return candidates
    .filter((candidate) => candidate.available)
    .map((candidate) => {
      const changed = candidate.apply(inputs);
      const target = calculateTarget(changed, targetProfitPct);
      const profit = calculateProfitAtRoas(changed, currentRoas);
      return {
        id: candidate.id,
        label: candidate.label,
        change: candidate.change,
        targetCpa: target.targetCpa,
        targetCpaDelta: target.targetCpa - baselineTarget.targetCpa,
        profitPerOrder: profit,
        profitDelta: profit - baselineProfit,
        targetRoas: target.targetRoas,
      };
    })
    .sort((left, right) => right.targetCpaDelta - left.targetCpaDelta);
}

export function calculatePromotion(
  baseline: CalculatorInputs,
  promotionPrice: number,
  baselineConversionRate: number,
): PromotionResult {
  const baselineResult = calculateBreakEvenRoas(baseline);
  const promotion = calculateBreakEvenRoas({
    ...baseline,
    orderValue: finiteNonNegative(promotionPrice),
  });
  const promotionContribution = promotion.contributionPerOrder;
  const requiredOrderLiftPct =
    promotionContribution > 0
      ? Math.max(0, (baselineResult.contributionPerOrder / promotionContribution - 1) * 100)
      : Number.POSITIVE_INFINITY;

  return {
    baselineContribution: baselineResult.contributionPerOrder,
    promotionContribution,
    baselineBreakEvenRoas: baselineResult.breakEvenRoas,
    promotionBreakEvenRoas: promotion.breakEvenRoas,
    contributionChange: promotionContribution - baselineResult.contributionPerOrder,
    requiredOrderLiftPct,
    requiredConversionRate:
      finiteNonNegative(baselineConversionRate) * (1 + requiredOrderLiftPct / 100),
  };
}

export function calculatePayback(
  cac: number,
  targetProfit: number,
  cumulativeContribution: Array<{ day: number; value: number }>,
): PaybackResult {
  const safeCac = finiteNonNegative(cac);
  const sorted = [...cumulativeContribution]
    .map((point) => ({ day: finiteNonNegative(point.day), value: finiteNonNegative(point.value) }))
    .sort((left, right) => left.day - right.day);
  const latest = sorted.at(-1)?.value ?? 0;
  const paybackDay = sorted.find((point) => point.value >= safeCac)?.day ?? null;

  return {
    allowableCac: Math.max(0, latest - finiteNonNegative(targetProfit)),
    paybackDay,
    gap: Math.max(0, safeCac - latest),
    recoveredPct: safeCac > 0 ? Math.min(100, (latest / safeCac) * 100) : 100,
  };
}

export function roasToAcos(roas: number): number {
  return roas > 0 && Number.isFinite(roas) ? 100 / roas : 0;
}

export function acosToRoas(acosPct: number): number {
  return acosPct > 0 && Number.isFinite(acosPct) ? 100 / acosPct : 0;
}
