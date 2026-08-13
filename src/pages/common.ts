import { createIcons, Link, RotateCcw } from "lucide";
import { defaultInputs, type CalculatorInputs, type CalculatorMode } from "../lib/calculator";

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const wholeCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatRoas = (value: number): string =>
  Number.isFinite(value) ? `${value.toFixed(2)}x` : "Not feasible";

export const formatSigned = (value: number): string =>
  `${value > 0 ? "+" : ""}${currency.format(value)}`;

export const numberValue = (root: ParentNode, id: string): number => {
  const element = root.querySelector<HTMLInputElement>(`#${id}`);
  return Number(element?.value ?? 0);
};

export function inputsFrom(root: ParentNode): CalculatorInputs {
  const mode = root.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value as CalculatorMode | undefined;
  return {
    mode: mode ?? "margin",
    orderValue: numberValue(root, "order-value"),
    grossMarginPct: numberValue(root, "gross-margin"),
    productCost: numberValue(root, "product-cost"),
    fulfillmentCost: numberValue(root, "fulfillment-cost"),
    otherCost: numberValue(root, "other-cost"),
    feePct: numberValue(root, "fee-pct"),
    returnPct: numberValue(root, "return-pct"),
    currentRoas: numberValue(root, "current-roas"),
  };
}

export function readSharedParams(): Partial<CalculatorInputs> {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const output: Partial<CalculatorInputs> = {};
  if (mode === "margin" || mode === "costs") output.mode = mode;
  const mappings: Array<[string, keyof CalculatorInputs]> = [
    ["aov", "orderValue"],
    ["margin", "grossMarginPct"],
    ["cogs", "productCost"],
    ["ship", "fulfillmentCost"],
    ["other", "otherCost"],
    ["fees", "feePct"],
    ["returns", "returnPct"],
    ["roas", "currentRoas"],
  ];
  mappings.forEach(([parameter, key]) => {
    const raw = params.get(parameter);
    if (raw !== null && raw.trim() !== "" && Number.isFinite(Number(raw))) {
      Object.assign(output, { [key]: Number(raw) });
    }
  });
  return output;
}

export function sharedInputs(): CalculatorInputs {
  return { ...defaultInputs, ...readSharedParams() };
}

export function sharedParams(inputs: CalculatorInputs): URLSearchParams {
  return new URLSearchParams({
    mode: inputs.mode,
    aov: String(inputs.orderValue),
    margin: String(inputs.grossMarginPct),
    cogs: String(inputs.productCost),
    ship: String(inputs.fulfillmentCost),
    other: String(inputs.otherCost),
    fees: String(inputs.feePct),
    returns: String(inputs.returnPct),
    roas: String(inputs.currentRoas),
  });
}

export function economicsFields(inputs = sharedInputs()): string {
  return `
    <fieldset class="mode-switcher compact-switcher">
      <legend class="sr-only">Input method</legend>
      <label><input type="radio" name="mode" value="margin" ${inputs.mode === "margin" ? "checked" : ""}><span>Quick margin</span></label>
      <label><input type="radio" name="mode" value="costs" ${inputs.mode === "costs" ? "checked" : ""}><span>Cost breakdown</span></label>
    </fieldset>
    <div class="form-grid">
      ${moneyField("order-value", "Average order value", inputs.orderValue)}
      <label class="field margin-field"><span>Gross margin</span><span class="input-wrap suffix"><input id="gross-margin" type="number" min="0" max="100" step="1" value="${inputs.grossMarginPct}"><span>%</span></span></label>
      <label class="field cost-field"><span>Product cost</span><span class="input-wrap prefix"><span>$</span><input id="product-cost" type="number" min="0" step="1" value="${inputs.productCost}"></span></label>
      <label class="field cost-field"><span>Fulfillment + shipping</span><span class="input-wrap prefix"><span>$</span><input id="fulfillment-cost" type="number" min="0" step="1" value="${inputs.fulfillmentCost}"></span></label>
      <label class="field cost-field"><span>Other variable cost</span><span class="input-wrap prefix"><span>$</span><input id="other-cost" type="number" min="0" step="1" value="${inputs.otherCost}"></span></label>
      ${percentField("fee-pct", "Payment + platform fees", inputs.feePct, 0.1)}
      ${percentField("return-pct", "Returns + discounts allowance", inputs.returnPct, 0.5)}
      ${numberField("current-roas", "Current attributed ROAS", inputs.currentRoas, "x", 0.1)}
    </div>`;
}

export function moneyField(id: string, label: string, value: number): string {
  return `<label class="field"><span>${label}</span><span class="input-wrap prefix"><span>$</span><input id="${id}" type="number" min="0" step="1" value="${value}" inputmode="decimal"></span></label>`;
}

export function percentField(id: string, label: string, value: number, step = 1): string {
  return numberField(id, label, value, "%", step);
}

export function numberField(id: string, label: string, value: number, suffix = "", step = 1): string {
  return `<label class="field"><span>${label}</span><span class="input-wrap suffix"><input id="${id}" type="number" min="0" step="${step}" value="${value}" inputmode="decimal">${suffix ? `<span>${suffix}</span>` : ""}</span></label>`;
}

export function bindMode(root: HTMLElement, onChange: () => void): void {
  const update = (): void => {
    const mode = root.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value ?? "margin";
    root.querySelectorAll<HTMLElement>(".margin-field").forEach((element) => { element.hidden = mode !== "margin"; });
    root.querySelectorAll<HTMLElement>(".cost-field").forEach((element) => { element.hidden = mode !== "costs"; });
  };
  root.querySelectorAll<HTMLInputElement>('input[name="mode"]').forEach((input) => {
    input.addEventListener("change", () => { update(); onChange(); });
  });
  update();
}

export async function copyText(text: string, message = "Result copied"): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  const toast = document.querySelector<HTMLElement>("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

export function setYearAndIcons(): void {
  document.querySelectorAll<HTMLElement>("[data-year]").forEach((node) => { node.textContent = String(new Date().getFullYear()); });
  createIcons({ icons: { Link, RotateCcw } });
}

export function track(eventName: string, parameters: Record<string, string> = {}): void {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("event", eventName, parameters);
}
