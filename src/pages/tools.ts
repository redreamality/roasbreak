import "../styles.css";
import "../tool-pages.css";
import {
  calculateLevers,
  calculatePayback,
  calculatePromotion,
  calculateScaleGuardrails,
  calculateScenario,
  calculateTarget,
  type LeverResult,
  type ScaleMaturity,
} from "../lib/decision-tools";
import {
  bindCalculationCompleted,
  bindMode,
  consumeGuideHandoff,
  copyText,
  currency,
  economicsFields,
  escapeHtml,
  formatRoas,
  formatSigned,
  inputsFrom,
  moneyField,
  numberValue,
  percentField,
  readChoiceParam,
  readNumberParam,
  readOptionalNumberParam,
  readTextParam,
  replaceUrlState,
  setYearAndIcons,
  sharedInputs,
  sharedParams,
  showInvalidParamNotice,
  stateUrl,
  track,
  wholeCurrency,
} from "./common";

const appElement = document.querySelector<HTMLElement>("#tool-app");
if (!appElement) throw new Error("Missing tool app");
const app: HTMLElement = appElement;

const page = document.body.dataset.page;
const sourceGuide = consumeGuideHandoff();

function attributed(parameters: Record<string, string>): Record<string, string> {
  return sourceGuide ? { ...parameters, source_guide: sourceGuide } : parameters;
}

function copyAndTrack(text: string, message: string, eventName: string, parameters: Record<string, string>): void {
  void copyText(text, message).then((copied) => {
    if (copied) track(eventName, attributed(parameters));
  });
}

function bindToolCalculation(root: HTMLElement): void {
  bindCalculationCompleted(root, page ?? "unknown", sourceGuide);
}

function resultCard(label: string, id: string, value: string, note: string): string {
  return `<div class="result-cell"><span>${label}</span><strong id="${id}">${value}</strong><p>${note}</p></div>`;
}

function bindLive(root: HTMLElement, update: () => void): void {
  root.addEventListener("input", update);
  bindMode(root, update);
}

function targetPage(): void {
  const targetPct = readNumberParam("profit", 10, 0, 100);
  app.innerHTML = `
    <section class="decision-tool" aria-label="Target ROAS calculator">
      <form class="tool-inputs" id="target-form">
        <div class="tool-panel-heading"><div><p class="step-label">01 / Economics</p><h2>Set the profit to keep</h2></div></div>
        <div class="basis-callout"><strong>Revenue basis</strong><span>Net product revenue, excluding tax; discounts and expected refunds deducted.</span></div>
        ${economicsFields()}
        <div class="goal-block">${percentField("target-profit", "Profit to retain after ads", targetPct, 1)}</div>
      </form>
      <section class="tool-results" aria-live="polite">
        <div class="tool-panel-heading"><div><p class="step-label muted-label">02 / Targets</p><h2>Platform-ready targets</h2></div><button class="share-button" id="copy-targets" type="button"><i data-lucide="link"></i><span>Copy targets</span></button></div>
        <div class="hero-result"><span>Target ROAS</span><strong id="target-roas">--</strong><p id="target-summary"></p></div>
        <div class="result-grid">
          ${resultCard("Google Ads format", "target-percent", "--", "Target ROAS as a percentage")}
          ${resultCard("Target CPA", "target-cpa", "--", "Maximum acquisition cost")}
          ${resultCard("Target ACoS", "target-acos", "--", "Maximum ad cost of sales")}
          ${resultCard("Break-even ROAS", "target-break-even", "--", "Zero-profit floor")}
        </div>
        <p class="result-alert" id="target-alert"></p>
        <a class="next-action" id="lever-link" href="/profit-lever-calculator/">Find the best profit lever <span aria-hidden="true">→</span></a>
      </section>
    </section>`;
  const form = app.querySelector<HTMLElement>("#target-form");
  if (!form) return;
  bindToolCalculation(form);
  const update = (): void => {
    const inputs = inputsFrom(form);
    const profitPct = numberValue(form, "target-profit");
    const result = calculateTarget(inputs, profitPct);
    text("target-roas", formatRoas(result.targetRoas));
    text("target-percent", result.feasible ? `${(result.targetRoas * 100).toFixed(0)}%` : "--");
    text("target-cpa", result.feasible ? currency.format(result.targetCpa) : "--");
    text("target-acos", result.feasible ? `${result.targetAcosPct.toFixed(1)}%` : "--");
    text("target-break-even", formatRoas(result.breakEvenRoas));
    text("target-summary", result.feasible
      ? `Keep ${currency.format(result.targetProfitPerOrder)} per order after advertising.`
      : "The profit target consumes all contribution available for advertising.");
    text("target-alert", result.feasible
      ? `Your target sits ${(result.targetRoas - result.breakEvenRoas).toFixed(2)}x above break-even. This uses attributed ROAS, not incremental profit.`
      : "Lower the retained profit target or improve unit economics before acquiring customers.");
    const state = sharedParams(inputs);
    state.set("profit", String(profitPct));
    app.querySelector<HTMLAnchorElement>("#lever-link")!.href = `/profit-lever-calculator/?${state}`;
    replaceUrlState(state);
  };
  bindLive(form, update);
  app.querySelector("#copy-targets")?.addEventListener("click", () => {
    const inputs = inputsFrom(form);
    const profitPct = numberValue(form, "target-profit");
    const result = calculateTarget(inputs, profitPct);
    const state = sharedParams(inputs);
    state.set("profit", String(profitPct));
    copyAndTrack(`Target ROAS: ${formatRoas(result.targetRoas)} (${result.feasible ? `${(result.targetRoas * 100).toFixed(0)}%` : "not feasible"})\nTarget CPA: ${result.feasible ? currency.format(result.targetCpa) : "not feasible"}\nTarget ACoS: ${result.feasible ? `${result.targetAcosPct.toFixed(1)}%` : "not feasible"}\nBasis: net product revenue excluding tax; entered variable costs included; fixed overhead and customer lifetime value excluded.\nRestore scenario: ${stateUrl(state)}`, "Targets copied", "target_copied", { page: "target_roas" });
  });
  update();
}

function leverPage(): void {
  const targetPct = readNumberParam("profit", 10, 0, 100);
  app.innerHTML = `
    <section class="decision-tool" aria-label="Profit lever calculator">
      <form class="tool-inputs" id="lever-form">
        <div class="tool-panel-heading"><div><p class="step-label">01 / Baseline</p><h2>Your current economics</h2></div></div>
        ${economicsFields()}
        <div class="goal-block">${percentField("target-profit", "Profit to retain after ads", targetPct, 1)}</div>
      </form>
      <section class="tool-results light-results" aria-live="polite">
        <div class="tool-panel-heading"><div><p class="step-label">02 / Ranked levers</p><h2>Where one change goes furthest</h2></div></div>
        <p class="tool-note">Single-variable scenarios. Each row changes one input while holding the others constant.</p>
        <div class="lever-table" id="lever-table"></div>
        <div class="selected-lever" id="selected-lever"></div>
      </section>
    </section>`;
  const form = app.querySelector<HTMLElement>("#lever-form");
  if (!form) return;
  bindToolCalculation(form);
  let selectedId = readTextParam("lever", "");
  let currentResults: LeverResult[] = [];
  const showSelected = (): void => {
    const selected = currentResults.find((item) => item.id === selectedId) ?? currentResults[0];
    if (!selected) return;
    selectedId = selected.id;
    const panel = app.querySelector<HTMLElement>("#selected-lever");
    if (!panel) return;
    const state = sharedParams(inputsFrom(form));
    state.set("profit", String(numberValue(form, "target-profit")));
    state.set("lever", selected.id);
    replaceUrlState(state);
    const scenarioLabel = selected.id === currentResults[0]?.id ? "Highest-impact scenario" : "Selected scenario";
    panel.innerHTML = `<span>${scenarioLabel}</span><strong>${selected.label} ${selected.change}</strong><p>Adds ${currency.format(selected.targetCpaDelta)} of CPA room and ${currency.format(selected.profitDelta)} profit per order at the current ROAS.</p><button type="button" class="secondary-button" id="copy-action">Copy action summary</button>`;
    panel.querySelector("#copy-action")?.addEventListener("click", () => {
      copyAndTrack(`${selected.label} ${selected.change}: Target CPA ${currency.format(selected.targetCpa)} (${formatSigned(selected.targetCpaDelta)}); target ROAS ${formatRoas(selected.targetRoas)}.\nBasis: single-variable scenario using net product revenue and entered variable costs; feasibility and demand response not forecast.\nRestore scenario: ${stateUrl(state)}`, "Action copied", "lever_copied", { lever: selected.id });
    });
  };
  const update = (): void => {
    currentResults = calculateLevers(inputsFrom(form), numberValue(form, "target-profit"), numberValue(form, "current-roas"));
    const table = app.querySelector<HTMLElement>("#lever-table");
    if (!table) return;
    table.innerHTML = `<div class="lever-row lever-head"><span>Change</span><span>CPA room</span><span>New target</span></div>${currentResults.map((result, index) => `<button type="button" class="lever-row" data-lever="${result.id}"><span><b>${index + 1}</b><i>${result.label}<small>${result.change}</small></i></span><strong>${formatSigned(result.targetCpaDelta)}</strong><em>${formatRoas(result.targetRoas)}</em></button>`).join("")}`;
    table.querySelectorAll<HTMLButtonElement>("[data-lever]").forEach((button) => button.addEventListener("click", () => {
      selectedId = button.dataset.lever ?? "";
      showSelected();
      track("lever_selected", { lever: selectedId });
    }));
    showSelected();
  };
  bindLive(form, update);
  update();
}

function promotionPage(): void {
  const base = sharedInputs();
  const promotionPrice = readNumberParam("promo", base.orderValue * 0.8);
  const baselineCvr = readNumberParam("cvr", 2.5, 0, 100);
  app.innerHTML = `<section class="decision-tool" aria-label="Promotion profit calculator">
    <form class="tool-inputs" id="promotion-form"><div class="tool-panel-heading"><div><p class="step-label">01 / Offer</p><h2>Compare the promotion</h2></div></div>
      <p class="tool-note dark-note">Product and fulfillment costs stay fixed when price changes. This prevents a discount from appearing to reduce COGS.</p>
      <div class="form-grid">${moneyField("order-value", "Regular order value", base.orderValue)}${moneyField("promotion-price", "Promotional order value", promotionPrice)}${moneyField("product-cost", "Product cost", base.productCost)}${moneyField("fulfillment-cost", "Fulfillment + shipping", base.fulfillmentCost)}${moneyField("other-cost", "Other variable cost", base.otherCost)}${percentField("fee-pct", "Payment + platform fees", base.feePct, 0.1)}${percentField("return-pct", "Returns allowance", base.returnPct, 0.5)}${percentField("baseline-cvr", "Current conversion rate", baselineCvr, 0.1)}</div>
      <input id="gross-margin" type="hidden" value="${base.grossMarginPct}"><input id="current-roas" type="hidden" value="${base.currentRoas}"><input type="radio" name="mode" value="costs" checked hidden>
    </form>
    <section class="tool-results" aria-live="polite"><div class="tool-panel-heading"><div><p class="step-label muted-label">02 / Required lift</p><h2>What the offer must earn back</h2></div><button class="share-button" id="copy-promotion" type="button"><i data-lucide="link"></i><span>Copy scenario</span></button></div>
      <div class="hero-result"><span>Required order lift</span><strong id="required-lift">--</strong><p>To preserve the same total contribution profit.</p></div>
      <div class="result-grid">${resultCard("Required CVR", "required-cvr", "--", "At the same traffic level")}${resultCard("Promo contribution", "promo-contribution", "--", "Per promotional order")}${resultCard("Promo break-even", "promo-break-even", "--", "ROAS floor after discount")}${resultCard("Contribution change", "promo-change", "--", "Per order vs regular price")}</div>
      <p class="result-alert" id="promotion-alert"></p></section></section>`;
  const form = app.querySelector<HTMLElement>("#promotion-form");
  if (!form) return;
  bindToolCalculation(form);
  const update = (): void => {
    const inputs = inputsFrom(form);
    const promo = numberValue(form, "promotion-price");
    const cvr = numberValue(form, "baseline-cvr");
    const result = calculatePromotion(inputs, promo, cvr);
    text("required-lift", Number.isFinite(result.requiredOrderLiftPct) ? `+${result.requiredOrderLiftPct.toFixed(1)}%` : "Not viable");
    text("required-cvr", Number.isFinite(result.requiredConversionRate) ? `${result.requiredConversionRate.toFixed(2)}%` : "--");
    text("promo-contribution", currency.format(result.promotionContribution));
    text("promo-break-even", formatRoas(result.promotionBreakEvenRoas));
    text("promo-change", formatSigned(result.contributionChange));
    text("promotion-alert", "This scenario assumes traffic quality and product mix stay constant. The required lift is a threshold, not a forecast.");
    const state = sharedParams(inputs);
    state.set("promo", String(promo));
    state.set("cvr", String(cvr));
    replaceUrlState(state);
  };
  form.addEventListener("input", update);
  app.querySelector("#copy-promotion")?.addEventListener("click", () => {
    const inputs = inputsFrom(form);
    const promo = numberValue(form, "promotion-price");
    const cvr = numberValue(form, "baseline-cvr");
    const result = calculatePromotion(inputs, promo, cvr);
    const state = sharedParams(inputs);
    state.set("promo", String(promo));
    state.set("cvr", String(cvr));
    copyAndTrack(`Promotion threshold: ${Number.isFinite(result.requiredOrderLiftPct) ? `+${result.requiredOrderLiftPct.toFixed(1)}% orders / ${result.requiredConversionRate.toFixed(2)}% CVR` : "not viable"}\nContribution: ${currency.format(result.promotionContribution)} per promotional order; break-even ROAS ${formatRoas(result.promotionBreakEvenRoas)}.\nBasis: fixed product, fulfillment, and other costs; constant traffic quality and product mix; lift is a threshold, not a forecast.\nRestore scenario: ${stateUrl(state)}`, "Promotion copied", "promotion_copied", { page: "promotion" });
  });
  update();
}

function paybackPage(): void {
  const defaults = {
    cac: readNumberParam("cac", 70),
    profit: readNumberParam("profit", 15),
    day30: readNumberParam("d30", 45),
    day60: readNumberParam("d60", 62),
    day90: readNumberParam("d90", 76),
    day180: readNumberParam("d180", 92),
    day365: readNumberParam("d365", 118),
  };
  app.innerHTML = `<section class="decision-tool" aria-label="CAC payback calculator">
    <form class="tool-inputs" id="payback-form"><div class="tool-panel-heading"><div><p class="step-label">01 / Customer value</p><h2>Enter cumulative contribution</h2></div></div>
      <p class="tool-note dark-note">Use contribution after product, fulfillment, fees, refunds, and service costs. Do not enter revenue LTV.</p>
      <div class="form-grid">${moneyField("cac", "New customer CAC", defaults.cac)}${moneyField("target-profit", "Profit to retain by day 365", defaults.profit)}${moneyField("day-30", "Contribution by day 30", defaults.day30)}${moneyField("day-60", "Contribution by day 60", defaults.day60)}${moneyField("day-90", "Contribution by day 90", defaults.day90)}${moneyField("day-180", "Contribution by day 180", defaults.day180)}${moneyField("day-365", "Contribution by day 365", defaults.day365)}</div>
    </form>
    <section class="tool-results" aria-live="polite"><div class="tool-panel-heading"><div><p class="step-label muted-label">02 / Recovery</p><h2>CAC payback</h2></div><button class="share-button" id="copy-payback" type="button"><i data-lucide="link"></i><span>Copy scenario</span></button></div>
      <div class="hero-result"><span>Payback point</span><strong id="payback-day">--</strong><p id="payback-summary"></p></div>
      <div class="result-grid">${resultCard("Allowable CAC", "allowable-cac", "--", "After the retained profit goal")}${resultCard("Recovered", "recovered-pct", "--", "By day 365")}${resultCard("Unrecovered gap", "payback-gap", "--", "At the end of the window")}${resultCard("365-day contribution", "day-365-result", "--", "Cumulative, not lifetime")}</div>
      <p class="result-alert">Use actual cohorts when possible. This calculator does not supply an industry repeat-purchase assumption.</p></section></section>`;
  const form = app.querySelector<HTMLElement>("#payback-form");
  if (!form) return;
  bindToolCalculation(form);
  const paybackState = (): URLSearchParams => new URLSearchParams({
    cac: String(numberValue(form, "cac")),
    profit: String(numberValue(form, "target-profit")),
    d30: String(numberValue(form, "day-30")),
    d60: String(numberValue(form, "day-60")),
    d90: String(numberValue(form, "day-90")),
    d180: String(numberValue(form, "day-180")),
    d365: String(numberValue(form, "day-365")),
  });
  const update = (): void => {
    const points = [30, 60, 90, 180, 365].map((day) => ({ day, value: numberValue(form, `day-${day}`) }));
    const result = calculatePayback(numberValue(form, "cac"), numberValue(form, "target-profit"), points);
    text("payback-day", result.paybackDay === null ? "Beyond 365d" : `Day ${result.paybackDay}`);
    text("payback-summary", result.paybackDay === null ? "The selected window does not recover acquisition cost." : "Cumulative contribution first covers CAC at this checkpoint.");
    text("allowable-cac", currency.format(result.allowableCac));
    text("recovered-pct", `${result.recoveredPct.toFixed(1)}%`);
    text("payback-gap", currency.format(result.gap));
    text("day-365-result", currency.format(points.at(-1)?.value ?? 0));
    replaceUrlState(paybackState());
  };
  form.addEventListener("input", update);
  app.querySelector("#copy-payback")?.addEventListener("click", () => {
    const points = [30, 60, 90, 180, 365].map((day) => ({ day, value: numberValue(form, `day-${day}`) }));
    const result = calculatePayback(numberValue(form, "cac"), numberValue(form, "target-profit"), points);
    copyAndTrack(`CAC payback: ${result.paybackDay === null ? "beyond day 365" : `day ${result.paybackDay}`}; allowable CAC ${currency.format(result.allowableCac)}; unrecovered gap ${currency.format(result.gap)}.\nBasis: cumulative contribution after variable costs, using explicit checkpoints; revenue LTV and extrapolated lifetime value excluded.\nRestore scenario: ${stateUrl(paybackState())}`, "Payback copied", "payback_copied", { page: "payback" });
  });
  update();
}

function scenarioPage(): void {
  const defaults = sharedInputs();
  const planningPeriod = readTextParam("period", "Custom scenarios");
  const guardrailDefaults = {
    minimumRoas: readOptionalNumberParam("gt"),
    maturity: readChoiceParam("gm", "not-checked", ["not-checked", "mature", "immature"] as const),
    orderCapacity: readOptionalNumberParam("gc"),
    observedPaybackDays: readOptionalNumberParam("gpd"),
    maximumPaybackDays: readOptionalNumberParam("gpl"),
    minimumIncrementalProfit: readOptionalNumberParam("gmp"),
  };
  const defaultScenarios = [
    { name: "Baseline", aov: defaults.orderValue, margin: 57, roas: defaults.currentRoas, spend: 1000 },
    { name: "Higher AOV", aov: defaults.orderValue * 1.15, margin: 57, roas: defaults.currentRoas, spend: 1000 },
    { name: "Scaled spend", aov: defaults.orderValue, margin: 57, roas: 2.2, spend: 2000 },
  ].map((scenario, offset) => {
    const index = offset + 1;
    return {
      name: readTextParam(`s${index}n`, scenario.name),
      aov: readNumberParam(`s${index}a`, scenario.aov),
      margin: readNumberParam(`s${index}m`, scenario.margin, 0, 100),
      roas: readNumberParam(`s${index}r`, scenario.roas, 0.01),
      spend: readNumberParam(`s${index}s`, scenario.spend),
    };
  });
  const monthlyScenarios = [
    { name: "Current budget", aov: 100, margin: 40, roas: 3, spend: 10000 },
    { name: "Higher budget", aov: 100, margin: 40, roas: 2.67, spend: 15000 },
    { name: "Downside efficiency", aov: 100, margin: 40, roas: 2, spend: 15000 },
  ];
  const scenario = (index: number, values: typeof defaultScenarios[number]): string => `<fieldset class="scenario-input"><legend id="scenario-${index}-legend">${escapeHtml(values.name)}</legend><label>Name<input id="scenario-${index}-name" value="${escapeHtml(values.name)}"></label>${moneyField(`scenario-${index}-aov`, "AOV", values.aov)}${percentField(`scenario-${index}-margin`, "Contribution margin", values.margin)}<label class="field"><span>ROAS</span><span class="input-wrap suffix"><input id="scenario-${index}-roas" type="number" min="0.01" step="0.01" value="${values.roas}"><span>x</span></span></label>${moneyField(`scenario-${index}-spend`, "Ad spend", values.spend)}</fieldset>`;
  const optionalNumberField = (id: string, label: string, value: number | null, suffix: string, step = 1): string => `<label class="field"><span>${label}</span><span class="input-wrap suffix"><input id="${id}" type="number" min="0" step="${step}" value="${value ?? ""}" inputmode="decimal"><span>${suffix}</span></span></label>`;
  const minimumProfitField = `<label class="field"><span>Minimum incremental contribution profit after ads</span><span class="input-wrap prefix"><span>$</span><input id="guard-minimum-profit" type="number" min="0" step="1" value="${guardrailDefaults.minimumIncrementalProfit ?? ""}" inputmode="decimal"></span></label>`;
  app.innerHTML = `<section class="scenario-tool"><form id="scenario-form"><div class="tool-panel-heading"><div><p class="step-label">01 / Scenarios</p><h2>Compare plans on contribution profit</h2></div></div><label class="scenario-period"><span>Planning period</span><input id="scenario-period" value="${escapeHtml(planningPeriod)}" maxlength="80"></label><div class="scenario-template-controls"><div><strong>Monthly budget example</strong><p>Loads three fictional spend and efficiency assumptions plus a five-check evidence fixture.</p></div><button class="secondary-button scenario-template-button" id="load-monthly-template" type="button"><i data-lucide="calendar-range"></i><span>Load monthly example</span></button></div><div class="scenario-inputs">${defaultScenarios.map((values, offset) => scenario(offset + 1, values)).join("")}</div><section class="scale-guardrails" aria-labelledby="scale-guardrails-title"><div><p class="step-label">02 / Evidence</p><h3 id="scale-guardrails-title">Check Scenario 2 against entered guardrails</h3><p>Scenario 1 is the baseline. Scenario 2 is the higher-spend proposal. Scenario 3 remains a downside comparison and does not affect these checks.</p></div><div class="guardrail-fields">${optionalNumberField("guard-minimum-roas", "Approved minimum proposal ROAS", guardrailDefaults.minimumRoas, "x", 0.01)}<label class="field"><span>Evidence window maturity</span><select id="guard-maturity"><option value="not-checked" ${guardrailDefaults.maturity === "not-checked" ? "selected" : ""}>Not checked</option><option value="mature" ${guardrailDefaults.maturity === "mature" ? "selected" : ""}>Mature</option><option value="immature" ${guardrailDefaults.maturity === "immature" ? "selected" : ""}>Still maturing</option></select></label>${optionalNumberField("guard-order-capacity", "Verified order capacity", guardrailDefaults.orderCapacity, "orders", 0.1)}${optionalNumberField("guard-payback-days", "Observed payback", guardrailDefaults.observedPaybackDays, "days", 1)}${optionalNumberField("guard-payback-limit", "Maximum approved payback", guardrailDefaults.maximumPaybackDays, "days", 1)}${minimumProfitField}</div></section></form><section class="scenario-results" aria-live="polite"><div class="tool-panel-heading"><div><p class="step-label">03 / Comparison</p><h2>Profit, not revenue alone</h2></div><button class="share-button light-share" id="copy-scenarios" type="button"><i data-lucide="link"></i><span>Copy scenarios</span></button></div><div class="scenario-table" id="scenario-table"></div><section class="guardrail-results" aria-labelledby="guardrail-results-title"><div class="guardrail-results-heading"><div><p class="step-label">Entered-evidence status</p><h3 id="guardrail-results-title">Scale-spend guardrails</h3></div><strong id="guardrail-overall"></strong></div><p id="guardrail-summary"></p><div id="guardrail-checks"></div><p class="tool-note">This is not an instruction to scale. A ready state means the five entered checks are internally complete enough for human review; it does not prove incrementality or future efficiency.</p></section><div class="scenario-formulas" aria-label="Monthly scenario formulas"><p><strong>ROAS path:</strong> Revenue = monthly ad spend x ROAS; orders = revenue / AOV; implied CPA = spend / orders; contribution profit = revenue x contribution margin - spend.</p><p><strong>CVR path:</strong> Clicks = budget / CPC; orders = clicks x (CVR / 100); CPA = CPC / (CVR / 100); ROAS = AOV x (CVR / 100) / CPC. CVR alone cannot connect budget to orders.</p></div><p class="tool-note">Each row requires its own efficiency evidence. The template does not assume a higher monthly budget retains the current ROAS, CPC, CVR, product mix, or contribution margin.</p></section></section>`;
  const form = app.querySelector<HTMLElement>("#scenario-form");
  if (!form) return;
  bindToolCalculation(form);
  const optionalNumberValue = (id: string): number | null => {
    const raw = form.querySelector<HTMLInputElement>(`#${id}`)?.value.trim() ?? "";
    const value = Number(raw);
    return raw !== "" && Number.isFinite(value) && value >= 0 ? value : null;
  };
  const guardrailInputs = () => ({
    minimumRoas: optionalNumberValue("guard-minimum-roas"),
    maturity: (form.querySelector<HTMLSelectElement>("#guard-maturity")?.value ?? "not-checked") as ScaleMaturity,
    orderCapacity: optionalNumberValue("guard-order-capacity"),
    observedPaybackDays: optionalNumberValue("guard-payback-days"),
    maximumPaybackDays: optionalNumberValue("guard-payback-limit"),
    minimumIncrementalProfit: optionalNumberValue("guard-minimum-profit"),
  });
  const scenarioState = (): URLSearchParams => {
    const params = new URLSearchParams();
    params.set("period", form.querySelector<HTMLInputElement>("#scenario-period")?.value || "Custom scenarios");
    [1, 2, 3].forEach((index) => {
      const name = form.querySelector<HTMLInputElement>(`#scenario-${index}-name`)?.value || `Scenario ${index}`;
      params.set(`s${index}n`, name);
      params.set(`s${index}a`, String(numberValue(form, `scenario-${index}-aov`)));
      params.set(`s${index}m`, String(numberValue(form, `scenario-${index}-margin`)));
      params.set(`s${index}r`, String(numberValue(form, `scenario-${index}-roas`)));
      params.set(`s${index}s`, String(numberValue(form, `scenario-${index}-spend`)));
    });
    const guardrails = guardrailInputs();
    params.set("gm", guardrails.maturity);
    ([
      ["gt", guardrails.minimumRoas],
      ["gc", guardrails.orderCapacity],
      ["gpd", guardrails.observedPaybackDays],
      ["gpl", guardrails.maximumPaybackDays],
      ["gmp", guardrails.minimumIncrementalProfit],
    ] as Array<[string, number | null]>).forEach(([parameter, value]) => {
      if (value !== null) params.set(parameter, String(value));
    });
    return params;
  };
  const update = (): void => {
    const scenarios = [1, 2, 3].map((index) => {
      const name = form.querySelector<HTMLInputElement>(`#scenario-${index}-name`)?.value || `Scenario ${index}`;
      const aov = numberValue(form, `scenario-${index}-aov`);
      const margin = numberValue(form, `scenario-${index}-margin`) / 100;
      const roas = numberValue(form, `scenario-${index}-roas`);
      const spend = numberValue(form, `scenario-${index}-spend`);
      const result = calculateScenario(aov, margin * 100, roas, spend);
      text(`scenario-${index}-legend`, name);
      return { name, ...result, roas, spend };
    });
    const rows = [...scenarios].sort((left, right) => right.profit - left.profit);
    app.querySelector<HTMLElement>("#scenario-table")!.innerHTML = `<div class="scenario-row scenario-head"><span>Scenario</span><span>Revenue</span><span>Orders</span><span>Implied CPA</span><span>Contribution profit</span></div>${rows.map((row, index) => `<div class="scenario-row ${index === 0 ? "winner" : ""}"><span>${escapeHtml(row.name)}<small>${row.roas.toFixed(2)}x ROAS</small></span><strong>${wholeCurrency.format(row.revenue)}</strong><strong>${row.orders.toFixed(1)}</strong><strong>${Number.isFinite(row.impliedCpa) ? currency.format(row.impliedCpa) : "--"}</strong><strong>${formatSigned(row.profit)}</strong></div>`).join("")}`;
    const inputs = guardrailInputs();
    const guardrails = calculateScaleGuardrails(scenarios[0]!, scenarios[1]!, inputs);
    const statusLabels = { passed: "Pass", blocked: "Blocked", "needs-evidence": "Needs evidence" } as const;
    const targetDetail = guardrails.targetGap === null
      ? "Enter an approved minimum proposal ROAS."
      : `${scenarios[1]!.roas.toFixed(2)}x is ${Math.abs(guardrails.targetGap).toFixed(2)}x ${guardrails.targetGap >= 0 ? "above" : "below"} the entered minimum.`;
    const maturityDetail = inputs.maturity === "mature"
      ? "The declared attribution and refund window is mature."
      : inputs.maturity === "immature" ? "The declared evidence window is still maturing." : "Check the evidence window against a declared maturity rule.";
    const capacityDetail = guardrails.capacityHeadroom === null
      ? "Enter verified order capacity from inventory and fulfillment evidence."
      : `${Math.abs(guardrails.capacityHeadroom).toFixed(1)} orders ${guardrails.capacityHeadroom >= 0 ? "of headroom" : "over entered capacity"}.`;
    const paybackDetail = guardrails.paybackHeadroom === null
      ? "Enter observed cohort payback and the approved maximum."
      : `${Math.abs(guardrails.paybackHeadroom).toFixed(0)} days ${guardrails.paybackHeadroom >= 0 ? "inside" : "beyond"} the entered limit.`;
    const marginalDetail = inputs.minimumIncrementalProfit === null
      ? "Enter an approved minimum incremental contribution profit after ads."
      : guardrails.marginalRoas === null
        ? "Scenario 2 must use more ad spend than Scenario 1."
        : `${guardrails.marginalRoas.toFixed(2)}x marginal ROAS; ${formatSigned(guardrails.incrementalProfit)} incremental contribution profit after ads versus ${currency.format(inputs.minimumIncrementalProfit)} minimum.`;
    const checks = [
      ["Target gap", guardrails.checks.target, targetDetail],
      ["Data maturity", guardrails.checks.maturity, maturityDetail],
      ["Order capacity", guardrails.checks.capacity, capacityDetail],
      ["Payback", guardrails.checks.payback, paybackDetail],
      ["Marginal economics", guardrails.checks.marginal, marginalDetail],
    ] as const;
    app.querySelector<HTMLElement>("#guardrail-checks")!.innerHTML = checks.map(([label, status, detail]) => `<div class="guardrail-row status-${status}"><strong>${label}</strong><span>${statusLabels[status]}</span><p>${detail}</p></div>`).join("");
    const overall = app.querySelector<HTMLElement>("#guardrail-overall")!;
    overall.className = `guardrail-overall status-${guardrails.overall}`;
    overall.textContent = guardrails.overall === "blocked"
      ? "Blocked by entered evidence"
      : guardrails.overall === "needs-evidence" ? "Needs evidence" : "Ready for decision review";
    text("guardrail-summary", guardrails.overall === "blocked"
      ? `${guardrails.blockerCount} ${guardrails.blockerCount === 1 ? "blocker" : "blockers"} must be resolved or explicitly accepted by the decision owner.`
      : guardrails.overall === "needs-evidence"
        ? "Complete every missing check before decision review."
        : "All five entered checks pass. Review uncertainty and incrementality before any budget change.");
    replaceUrlState(scenarioState());
  };
  form.addEventListener("input", update);
  app.querySelector("#load-monthly-template")?.addEventListener("click", () => {
    const periodInput = form.querySelector<HTMLInputElement>("#scenario-period");
    if (periodInput) periodInput.value = "Monthly budget example";
    monthlyScenarios.forEach((values, offset) => {
      const index = offset + 1;
      const nameInput = form.querySelector<HTMLInputElement>(`#scenario-${index}-name`);
      if (nameInput) nameInput.value = values.name;
      form.querySelector<HTMLInputElement>(`#scenario-${index}-aov`)!.value = String(values.aov);
      form.querySelector<HTMLInputElement>(`#scenario-${index}-margin`)!.value = String(values.margin);
      form.querySelector<HTMLInputElement>(`#scenario-${index}-roas`)!.value = String(values.roas);
      form.querySelector<HTMLInputElement>(`#scenario-${index}-spend`)!.value = String(values.spend);
    });
    form.querySelector<HTMLInputElement>("#guard-minimum-roas")!.value = "3";
    form.querySelector<HTMLSelectElement>("#guard-maturity")!.value = "mature";
    form.querySelector<HTMLInputElement>("#guard-order-capacity")!.value = "450";
    form.querySelector<HTMLInputElement>("#guard-payback-days")!.value = "60";
    form.querySelector<HTMLInputElement>("#guard-payback-limit")!.value = "90";
    form.querySelector<HTMLInputElement>("#guard-minimum-profit")!.value = "0";
    update();
    track("scenario_template_loaded", { template: "monthly_budget" });
  });
  app.querySelector("#copy-scenarios")?.addEventListener("click", () => {
    const comparison = app.querySelector<HTMLElement>("#scenario-table")?.innerText.replace(/\s+/g, " ").trim() ?? "";
    const guardrails = app.querySelector<HTMLElement>(".guardrail-results")?.innerText.replace(/\s+/g, " ").trim() ?? "";
    const period = form.querySelector<HTMLInputElement>("#scenario-period")?.value || "Custom scenarios";
    copyAndTrack(`Scenario period: ${period}\n${comparison}\nScale-spend guardrails: ${guardrails}\nBasis: entered contribution margins, attributed ROAS, and user-supplied evidence thresholds; each ROAS is assumed stable only within its row, and a ready state is not an instruction to scale.\nRestore scenarios: ${stateUrl(scenarioState())}`, "Scenarios copied", "scenarios_copied", { page: "scenarios" });
  });
  update();
}

function text(id: string, value: string): void {
  const node = app.querySelector<HTMLElement>(`#${id}`);
  if (node) node.textContent = value;
}

switch (page) {
  case "target": targetPage(); break;
  case "levers": leverPage(); break;
  case "promotion": promotionPage(); break;
  case "payback": paybackPage(); break;
  case "scenarios": scenarioPage(); break;
  default: throw new Error(`Unknown tool page: ${page}`);
}

showInvalidParamNotice(app);
setYearAndIcons();
track("tool_view", { tool: page ?? "unknown" });
