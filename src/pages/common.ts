import { CalendarRange, createIcons, Link, RotateCcw } from "lucide";
import { defaultInputs, type CalculatorInputs, type CalculatorMode } from "../lib/calculator";
import { initializePrivacyControls, trackAnalytics } from "../lib/privacy";

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

const invalidLinkParameters = new Set<string>();
const guideHandoffKey = "roasbreak-guide-handoff";
const safeContentIdPattern = /^[a-z0-9-]+$/;

export const formatRoas = (value: number): string =>
  Number.isFinite(value) ? `${value.toFixed(2)}x` : "Not feasible";

export const formatSigned = (value: number): string =>
  `${value > 0 ? "+" : ""}${currency.format(value)}`;

export const numberValue = (root: ParentNode, id: string): number => {
  const element = root.querySelector<HTMLInputElement>(`#${id}`);
  return Number(element?.value ?? 0);
};

export function readNumberParam(
  parameter: string,
  fallback: number,
  minimum = 0,
  maximum = Number.POSITIVE_INFINITY,
): number {
  const raw = new URLSearchParams(window.location.search).get(parameter);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(value) || value < minimum || value > maximum) {
    invalidLinkParameters.add(parameter);
    return fallback;
  }
  return value;
}

export function readOptionalNumberParam(
  parameter: string,
  minimum = 0,
  maximum = Number.POSITIVE_INFINITY,
): number | null {
  const raw = new URLSearchParams(window.location.search).get(parameter);
  if (raw === null) return null;
  const value = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(value) || value < minimum || value > maximum) {
    invalidLinkParameters.add(parameter);
    return null;
  }
  return value;
}

export function readChoiceParam<const T extends string>(
  parameter: string,
  fallback: T,
  allowed: readonly T[],
): T {
  const raw = new URLSearchParams(window.location.search).get(parameter);
  if (raw === null) return fallback;
  if ((allowed as readonly string[]).includes(raw)) return raw as T;
  invalidLinkParameters.add(parameter);
  return fallback;
}

export function readTextParam(parameter: string, fallback: string): string {
  const raw = new URLSearchParams(window.location.search).get(parameter);
  if (raw === null) return fallback;
  const value = raw.trim();
  if (!value) {
    invalidLinkParameters.add(parameter);
    return fallback;
  }
  return value.slice(0, 80);
}

export function replaceUrlState(params: URLSearchParams): void {
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
}

export function stateUrl(params: URLSearchParams): string {
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

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
  else if (mode !== null) invalidLinkParameters.add("mode");
  const mappings: Array<[string, keyof CalculatorInputs, number]> = [
    ["aov", "orderValue", Number.POSITIVE_INFINITY],
    ["margin", "grossMarginPct", 100],
    ["cogs", "productCost", Number.POSITIVE_INFINITY],
    ["ship", "fulfillmentCost", Number.POSITIVE_INFINITY],
    ["other", "otherCost", Number.POSITIVE_INFINITY],
    ["fees", "feePct", 100],
    ["returns", "returnPct", 100],
    ["roas", "currentRoas", Number.POSITIVE_INFINITY],
  ];
  mappings.forEach(([parameter, key, maximum]) => {
    const raw = params.get(parameter);
    if (raw !== null) Object.assign(output, { [key]: readNumberParam(parameter, defaultInputs[key] as number, 0, maximum) });
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

export async function copyText(text: string, message = "Result copied"): Promise<boolean> {
  let copied = true;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    copied = document.execCommand("copy");
    area.remove();
  }
  if (!copied) return false;
  const toast = document.querySelector<HTMLElement>("#toast");
  if (!toast) return true;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  return true;
}

export function showInvalidParamNotice(root: HTMLElement): void {
  if (invalidLinkParameters.size === 0) return;
  const notice = document.createElement("p");
  notice.className = "param-warning";
  notice.role = "status";
  notice.textContent = "Some values in this shared link were invalid and reset to defaults.";
  root.prepend(notice);
}

export function setYearAndIcons(): void {
  document.querySelectorAll<HTMLElement>("[data-year]").forEach((node) => { node.textContent = String(new Date().getFullYear()); });
  initializePageSemantics();
  createIcons({ icons: { CalendarRange, Link, RotateCcw } });
  initializePrivacyControls();
}

function initializePageSemantics(): void {
  const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
  document.querySelectorAll<HTMLAnchorElement>(".inner-nav a[href]").forEach((link) => {
    if (link.hasAttribute("aria-current")) return;
    const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/+$/, "") || "/";
    if (linkPath === currentPath) link.setAttribute("aria-current", "page");
  });
  const breadcrumb = document.querySelector<HTMLElement>(".breadcrumb");
  if (breadcrumb) {
    breadcrumb.setAttribute("aria-label", "Breadcrumb");
    const existingSchema = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"][data-schema="breadcrumb"]',
    );
    if (!existingSchema) {
      const items = Array.from(breadcrumb.children).map((node, index, nodes) => ({
        "@type": "ListItem",
        position: index + 1,
        name: node.textContent?.trim() || `Level ${index + 1}`,
        item: node instanceof HTMLAnchorElement
          ? new URL(node.getAttribute("href") ?? "/", window.location.origin).href
          : index === nodes.length - 1 ? `${window.location.origin}${window.location.pathname}` : undefined,
      }));
      const schema = document.createElement("script");
      schema.type = "application/ld+json";
      schema.dataset.schema = "breadcrumb";
      schema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items,
      });
      document.head.append(schema);
    }
  }
  const toast = document.querySelector<HTMLElement>("#toast");
  if (toast) toast.setAttribute("role", "status");
}

export function track(eventName: string, parameters: Record<string, string> = {}): boolean {
  return trackAnalytics(eventName, parameters);
}

export function rememberGuideHandoff(guideId: string, targetUrl: string): void {
  if (!safeContentIdPattern.test(guideId)) return;
  try {
    const targetPath = new URL(targetUrl, window.location.origin).pathname;
    window.sessionStorage.setItem(guideHandoffKey, JSON.stringify({ guideId, targetPath }));
  } catch {
    // Attribution is optional and must never block navigation.
  }
}

export function consumeGuideHandoff(targetPath = window.location.pathname): string | undefined {
  try {
    const raw = window.sessionStorage.getItem(guideHandoffKey);
    window.sessionStorage.removeItem(guideHandoffKey);
    if (!raw) return undefined;
    const handoff = JSON.parse(raw) as { guideId?: unknown; targetPath?: unknown };
    if (typeof handoff.guideId !== "string" || !safeContentIdPattern.test(handoff.guideId)) return undefined;
    return handoff.targetPath === targetPath ? handoff.guideId : undefined;
  } catch {
    return undefined;
  }
}

export function bindCalculationCompleted(root: HTMLElement, tool: string, sourceGuide?: string): void {
  let tracked = false;
  root.addEventListener("change", (event) => {
    if (tracked || !event.isTrusted || !(event.target instanceof HTMLInputElement)) return;
    const parameters: Record<string, string> = { tool };
    if (sourceGuide) parameters.source_guide = sourceGuide;
    tracked = track("calculation_completed", parameters);
  });
}
