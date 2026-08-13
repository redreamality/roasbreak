import { Link, RotateCcw, createIcons } from "lucide";
import "./styles.css";
import {
  calculateBreakEvenRoas,
  defaultInputs,
  type CalculatorInputs,
  type CalculatorMode,
  type PerformanceStatus,
} from "./lib/calculator";

const getElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};

const calculator = getElement<HTMLElement>("#calculator");
getElement<HTMLElement>(".tool-intro").insertAdjacentElement("afterend", calculator);

createIcons({ icons: { Link, RotateCcw } });

const form = getElement<HTMLFormElement>("#calculator-form");
const modeInputs = [...form.querySelectorAll<HTMLInputElement>('input[name="mode"]')];
const costFields = [...form.querySelectorAll<HTMLElement>(".cost-field")];
const marginFields = [...form.querySelectorAll<HTMLElement>(".margin-field")];
const resetButton = getElement<HTMLButtonElement>("#reset-button");
const shareButton = getElement<HTMLButtonElement>("#share-button");
const shareButtonText = getElement<HTMLElement>("#share-button span");
const toast = getElement<HTMLElement>("#toast");

const input = (name: keyof CalculatorInputs): HTMLInputElement =>
  getElement<HTMLInputElement>(`[name="${name}"]`);

const numberFrom = (name: keyof CalculatorInputs): number => Number(input(name).value);

function readInputs(): CalculatorInputs {
  return {
    mode: getElement<HTMLInputElement>('input[name="mode"]:checked').value as CalculatorMode,
    orderValue: numberFrom("orderValue"),
    grossMarginPct: numberFrom("grossMarginPct"),
    productCost: numberFrom("productCost"),
    fulfillmentCost: numberFrom("fulfillmentCost"),
    otherCost: numberFrom("otherCost"),
    feePct: numberFrom("feePct"),
    returnPct: numberFrom("returnPct"),
    currentRoas: numberFrom("currentRoas"),
  };
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const wholeCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatSignedCurrency = (value: number, whole = false): string => {
  if (!Number.isFinite(value)) return "--";
  const formatter = whole ? wholeCurrency : currency;
  return value > 0 ? `+${formatter.format(value)}` : formatter.format(value);
};

const statusCopy: Record<PerformanceStatus, string> = {
  above: "Above break-even",
  at: "At break-even",
  below: "Below break-even",
  unviable: "Costs exceed revenue",
};

function setMode(mode: CalculatorMode): void {
  modeInputs.forEach((radio) => {
    radio.checked = radio.value === mode;
  });
  costFields.forEach((field) => {
    field.hidden = mode !== "costs";
  });
  marginFields.forEach((field) => {
    field.hidden = mode !== "margin";
  });
}

function updateScale(breakEvenRoas: number, currentRoas: number): void {
  const finiteBreakEven = Number.isFinite(breakEvenRoas) ? breakEvenRoas : 0;
  const scaleMax = Math.max(4, Math.ceil(Math.max(finiteBreakEven, currentRoas) * 1.2));
  const asPosition = (value: number): number => Math.min(97, Math.max(3, (value / scaleMax) * 100));
  const breakPosition = asPosition(finiteBreakEven);
  const currentPosition = asPosition(currentRoas);
  const breakMarker = getElement<HTMLElement>("#break-marker");
  const currentMarker = getElement<HTMLElement>("#current-marker");

  breakMarker.style.left = `${breakPosition}%`;
  currentMarker.style.left = `${currentPosition}%`;
  currentMarker.classList.toggle("markers-close", Math.abs(currentPosition - breakPosition) < 13);
  getElement<HTMLElement>("#scale-max").textContent = `${scaleMax}x`;
}

function updateResults(): void {
  const values = readInputs();
  const result = calculateBreakEvenRoas(values);
  const finiteBreakEven = Number.isFinite(result.breakEvenRoas);
  const breakEvenText = finiteBreakEven ? `${result.breakEvenRoas.toFixed(2)}x` : "No viable ROAS";
  const statusPill = getElement<HTMLElement>("#status-pill");

  getElement<HTMLElement>("#break-even-roas").textContent = breakEvenText;
  getElement<HTMLElement>("#max-cpa").textContent = currency.format(result.maxCpa);
  getElement<HTMLElement>("#contribution-margin").textContent = `${Math.max(0, result.contributionMargin * 100).toFixed(1)}%`;
  getElement<HTMLElement>("#profit-per-order").textContent = formatSignedCurrency(result.profitPerOrder);
  getElement<HTMLElement>("#profit-per-thousand").textContent = formatSignedCurrency(result.profitPerThousand, true);
  getElement<HTMLElement>("#status-text").textContent = statusCopy[result.status];
  statusPill.dataset.status = result.status;
  calculator.dataset.status = result.status;

  getElement<HTMLElement>("#result-summary").textContent = finiteBreakEven
    ? `Every $1 in ad spend must generate at least $${result.breakEvenRoas.toFixed(2)} in revenue.`
    : "Variable costs leave no contribution available for advertising.";

  const note = getElement<HTMLElement>("#result-note");
  if (result.status === "unviable") {
    note.innerHTML = "Reduce variable costs or raise order value before spending on acquisition.";
  } else if (result.status === "at") {
    note.innerHTML = "Your current ROAS is <strong>on the break-even line</strong>.";
  } else {
    const direction = result.safetyMarginPct > 0 ? "above" : "below";
    note.innerHTML = `Your current ROAS is <strong>${Math.abs(result.safetyMarginPct).toFixed(1)}% ${direction}</strong> the break-even line.`;
  }

  updateScale(result.breakEvenRoas, values.currentRoas);
  getElement<HTMLAnchorElement>("#target-roas-link").href = `/target-roas-calculator/?${valuesToParams(values)}`;
}

function valuesToParams(values: CalculatorInputs): URLSearchParams {
  return new URLSearchParams({
    mode: values.mode,
    aov: String(values.orderValue),
    margin: String(values.grossMarginPct),
    cogs: String(values.productCost),
    ship: String(values.fulfillmentCost),
    other: String(values.otherCost),
    fees: String(values.feePct),
    returns: String(values.returnPct),
    roas: String(values.currentRoas),
  });
}

function valuesToUrl(): string {
  const values = readInputs();
  const params = valuesToParams(values);
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function applyUrlValues(): void {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  if (mode === "margin" || mode === "costs") setMode(mode);

  const keys: Array<[string, keyof CalculatorInputs]> = [
    ["aov", "orderValue"],
    ["margin", "grossMarginPct"],
    ["cogs", "productCost"],
    ["ship", "fulfillmentCost"],
    ["other", "otherCost"],
    ["fees", "feePct"],
    ["returns", "returnPct"],
    ["roas", "currentRoas"],
  ];

  keys.forEach(([parameter, field]) => {
    const value = params.get(parameter);
    if (value !== null && value.trim() !== "" && Number.isFinite(Number(value))) {
      input(field).value = value;
    }
  });
}

async function copyResult(): Promise<void> {
  const url = valuesToUrl();
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.append(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }
  shareButtonText.textContent = "Copied";
  toast.classList.add("is-visible");
  window.setTimeout(() => {
    shareButtonText.textContent = "Copy result";
    toast.classList.remove("is-visible");
  }, 1800);
}

function resetCalculator(): void {
  (Object.entries(defaultInputs) as Array<[keyof CalculatorInputs, CalculatorInputs[keyof CalculatorInputs]]>).forEach(
    ([key, value]) => {
      if (key === "mode") setMode(value as CalculatorMode);
      else input(key).value = String(value);
    },
  );
  window.history.replaceState({}, "", window.location.pathname);
  updateResults();
}

form.addEventListener("input", updateResults);
modeInputs.forEach((radio) => {
  radio.addEventListener("change", () => {
    setMode(radio.value as CalculatorMode);
    updateResults();
  });
});
resetButton.addEventListener("click", resetCalculator);
shareButton.addEventListener("click", copyResult);

document.querySelectorAll<HTMLDetailsElement>(".faq-list details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    document.querySelectorAll<HTMLDetailsElement>(".faq-list details").forEach((other) => {
      if (other !== detail) other.open = false;
    });
  });
});

getElement<HTMLElement>("#year").textContent = String(new Date().getFullYear());
applyUrlValues();
updateResults();
