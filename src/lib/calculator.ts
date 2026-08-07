export type CalculatorMode = "margin" | "costs";

export interface CalculatorInputs {
  mode: CalculatorMode;
  orderValue: number;
  grossMarginPct: number;
  productCost: number;
  fulfillmentCost: number;
  otherCost: number;
  feePct: number;
  returnPct: number;
  currentRoas: number;
}

export type PerformanceStatus = "above" | "at" | "below" | "unviable";

export interface CalculatorResult {
  contributionPerOrder: number;
  contributionMargin: number;
  breakEvenRoas: number;
  maxCpa: number;
  adCostPerOrder: number;
  profitPerOrder: number;
  profitPerThousand: number;
  safetyMarginPct: number;
  status: PerformanceStatus;
}

export const defaultInputs: CalculatorInputs = {
  mode: "margin",
  orderValue: 80,
  grossMarginPct: 65,
  productCost: 28,
  fulfillmentCost: 6,
  otherCost: 3,
  feePct: 3,
  returnPct: 5,
  currentRoas: 2.5,
};

const asFiniteNonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export function calculateBreakEvenRoas(raw: CalculatorInputs): CalculatorResult {
  const orderValue = asFiniteNonNegative(raw.orderValue);
  const feePct = asFiniteNonNegative(raw.feePct);
  const returnPct = asFiniteNonNegative(raw.returnPct);
  const currentRoas = asFiniteNonNegative(raw.currentRoas);

  const contributionPerOrder =
    raw.mode === "margin"
      ? orderValue * ((asFiniteNonNegative(raw.grossMarginPct) - feePct - returnPct) / 100)
      : orderValue -
        asFiniteNonNegative(raw.productCost) -
        asFiniteNonNegative(raw.fulfillmentCost) -
        asFiniteNonNegative(raw.otherCost) -
        orderValue * ((feePct + returnPct) / 100);

  const contributionMargin = orderValue > 0 ? contributionPerOrder / orderValue : 0;
  const breakEvenRoas = contributionMargin > 0 ? 1 / contributionMargin : Number.POSITIVE_INFINITY;
  const adCostPerOrder = currentRoas > 0 ? orderValue / currentRoas : Number.POSITIVE_INFINITY;
  const profitPerOrder = contributionPerOrder - adCostPerOrder;
  const profitPerThousand =
    currentRoas > 0 ? (currentRoas * contributionMargin - 1) * 1000 : Number.NEGATIVE_INFINITY;
  const safetyMarginPct =
    Number.isFinite(breakEvenRoas) && breakEvenRoas > 0
      ? ((currentRoas - breakEvenRoas) / breakEvenRoas) * 100
      : Number.NEGATIVE_INFINITY;

  let status: PerformanceStatus;
  if (contributionMargin <= 0) {
    status = "unviable";
  } else if (Math.abs(currentRoas - breakEvenRoas) / breakEvenRoas <= 0.02) {
    status = "at";
  } else {
    status = currentRoas > breakEvenRoas ? "above" : "below";
  }

  return {
    contributionPerOrder,
    contributionMargin,
    breakEvenRoas,
    maxCpa: Math.max(0, contributionPerOrder),
    adCostPerOrder,
    profitPerOrder,
    profitPerThousand,
    safetyMarginPct,
    status,
  };
}
