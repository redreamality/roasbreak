import "../styles.css";
import "../tool-pages.css";
import {
  calculateLevers,
  calculatePayback,
  calculatePromotion,
  calculateTarget,
  type LeverResult,
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
  readNumberParam,
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
    panel.innerHTML = `<span>Highest-impact scenario</span><strong>${selected.label} ${selected.change}</strong><p>Adds ${currency.format(selected.targetCpaDelta)} of CPA room and ${currency.format(selected.profitDelta)} profit per order at the current ROAS.</p><button type="button" class="secondary-button" id="copy-action">Copy action summary</button>`;
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
  const scenario = (index: number, values: typeof defaultScenarios[number]): string => `<fieldset class="scenario-input"><legend>${escapeHtml(values.name)}</legend><label>Name<input id="scenario-${index}-name" value="${escapeHtml(values.name)}"></label>${moneyField(`scenario-${index}-aov`, "AOV", values.aov)}${percentField(`scenario-${index}-margin`, "Contribution margin", values.margin)}<label class="field"><span>ROAS</span><span class="input-wrap suffix"><input id="scenario-${index}-roas" type="number" min="0.01" step="0.1" value="${values.roas}"><span>x</span></span></label>${moneyField(`scenario-${index}-spend`, "Ad spend", values.spend)}</fieldset>`;
  app.innerHTML = `<section class="scenario-tool"><form id="scenario-form"><div class="tool-panel-heading"><div><p class="step-label">01 / Scenarios</p><h2>Compare plans on contribution profit</h2></div></div><div class="scenario-inputs">${defaultScenarios.map((values, offset) => scenario(offset + 1, values)).join("")}</div></form><section class="scenario-results" aria-live="polite"><div class="tool-panel-heading"><div><p class="step-label">02 / Comparison</p><h2>Profit, not revenue alone</h2></div><button class="share-button light-share" id="copy-scenarios" type="button"><i data-lucide="link"></i><span>Copy scenarios</span></button></div><div class="scenario-table" id="scenario-table"></div><p class="tool-note">Each scenario assumes its entered ROAS remains stable at the specified spend. It does not predict the efficiency of scaling.</p></section></section>`;
  const form = app.querySelector<HTMLElement>("#scenario-form");
  if (!form) return;
  bindToolCalculation(form);
  const scenarioState = (): URLSearchParams => {
    const params = new URLSearchParams();
    [1, 2, 3].forEach((index) => {
      const name = form.querySelector<HTMLInputElement>(`#scenario-${index}-name`)?.value || `Scenario ${index}`;
      params.set(`s${index}n`, name);
      params.set(`s${index}a`, String(numberValue(form, `scenario-${index}-aov`)));
      params.set(`s${index}m`, String(numberValue(form, `scenario-${index}-margin`)));
      params.set(`s${index}r`, String(numberValue(form, `scenario-${index}-roas`)));
      params.set(`s${index}s`, String(numberValue(form, `scenario-${index}-spend`)));
    });
    return params;
  };
  const update = (): void => {
    const rows = [1, 2, 3].map((index) => {
      const name = form.querySelector<HTMLInputElement>(`#scenario-${index}-name`)?.value || `Scenario ${index}`;
      const aov = numberValue(form, `scenario-${index}-aov`);
      const margin = numberValue(form, `scenario-${index}-margin`) / 100;
      const roas = numberValue(form, `scenario-${index}-roas`);
      const spend = numberValue(form, `scenario-${index}-spend`);
      const revenue = spend * roas;
      const profit = revenue * margin - spend;
      const orders = aov > 0 ? revenue / aov : 0;
      return { name, revenue, profit, orders, roas };
    }).sort((left, right) => right.profit - left.profit);
    app.querySelector<HTMLElement>("#scenario-table")!.innerHTML = `<div class="scenario-row scenario-head"><span>Scenario</span><span>Revenue</span><span>Orders</span><span>Contribution profit</span></div>${rows.map((row, index) => `<div class="scenario-row ${index === 0 ? "winner" : ""}"><span>${escapeHtml(row.name)}<small>${row.roas.toFixed(2)}x ROAS</small></span><strong>${wholeCurrency.format(row.revenue)}</strong><strong>${row.orders.toFixed(1)}</strong><strong>${formatSigned(row.profit)}</strong></div>`).join("")}`;
    replaceUrlState(scenarioState());
  };
  form.addEventListener("input", update);
  app.querySelector("#copy-scenarios")?.addEventListener("click", () => {
    const winner = app.querySelector<HTMLElement>(".scenario-row.winner")?.innerText.replace(/\s+/g, " ").trim() ?? "";
    copyAndTrack(`Scenario comparison winner: ${winner}\nBasis: entered contribution margins and attributed ROAS; each ROAS is assumed stable at its spend level, not forecast.\nRestore scenarios: ${stateUrl(scenarioState())}`, "Scenarios copied", "scenarios_copied", { page: "scenarios" });
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
