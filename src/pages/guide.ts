import "../styles.css";
import "../tool-pages.css";
import { acosToRoas, roasToAcos } from "../lib/decision-tools";
import { copyText, rememberGuideHandoff, setYearAndIcons, track } from "./common";

const roasInput = document.querySelector<HTMLInputElement>("#guide-roas");
const acosInput = document.querySelector<HTMLInputElement>("#guide-acos");
const checklistButton = document.querySelector<HTMLButtonElement>("#copy-variable-cost-checklist");
const seasonalWorksheetButton = document.querySelector<HTMLButtonElement>("#copy-seasonal-promotion-worksheet");
const shopifyMappingButton = document.querySelector<HTMLButtonElement>("#copy-shopify-product-mapping");

const variableCostChecklist = `Ecommerce variable-cost audit
Fields: Group | Source | Period | Currency | Owner | Amount | Tool input | Status
Revenue deductions | [order report] | [period] | [currency] | [owner] | [amount per order] | aov | [status]
Product and inbound | [inventory ledger] | [period] | [currency] | [owner] | [landed unit cost] | cogs | [status]
Fulfillment | [carrier / 3PL invoice] | [period] | [currency] | [owner] | [cost per order] | ship | [status]
Payment and platform | [settlement or contract] | [effective range] | [currency] | [owner] | [scope, base, fixed component, tiers, refund treatment] | fees + other | [status]
Refunds and returns | [mature refund cohort] | [period] | [currency] | [owner] | [loss rate and handling] | returns + other | [status]
Service and other | [support / vendor log] | [period] | [currency] | [owner] | [cost per order] | other | [status]

Duplicate check: Each cost appears in one tool input only; refunded revenue is deducted in aov or returns, never both.
Fixed-variable check: Include order-driven costs; separate fixed overhead unless deliberately allocated.
Missing-zero check: Give every zero an owner and evidence; distinguish zero, missing, and unavailable.
Fee schedule: Provider / marketplace | Contract or settlement source | Region / category / payment route | Fee base | Fixed component | Tier thresholds | Refund / chargeback treatment | Effective from | Effective to | Reviewed on
Fee-schedule check: Record every fee component, scope, effective date, and review date before modeling it.
Fixed-component check: Divide actual fixed charges from captures, retries, and refunds by matched orders; do not assume one charge per order.
Effective-rate check: Divide actual total fees by same-basis model revenue for the matched period, currency, and order population.`;

const seasonalPromotionWorksheet = `Seasonal promotion planning worksheet
Season / event: [name and year]
Decision owner: [owner]
Reviewed on: [date]
Mature control window: [start / end / maturity date]
Eligible sessions: [same-channel sessions]
Baseline CVR: [percent]
Baseline orders: [orders]
Regular AOV: [net product revenue]
Promotional AOV: [net product revenue]
Whole-order COGS: [amount]
Fulfillment: [amount]
Other variable cost: [amount]
Payment and platform fees: [percent]
Expected return-loss allowance: [percent]
Required orders and CVR: [calculator output]
Saleable inventory and orders/day capacity: [evidence]
Carrier cutoff and support capacity: [evidence]
Fixed campaign costs outside calculator: [amount and owner]
Approved threshold and decision: [decision]
Post-event actuals and next action: [result]

Boundary: Use your own mature control; this is not a BFCM benchmark or a forecast of conversion lift.
Review: Before every seasonal event, at least annually, and after material price, cost, return, inventory, fulfillment, or traffic changes.`;

const shopifyProductMappingWorksheet = `Shopify product-channel manual mapping
Decision period: [start / end]
Timezone: [timezone]
Currency: [single currency]
Attribution setting: [channel setting and window]
Refund maturity date: [date]
Owner: [owner]

Crosswalk fields: Scenario alias | Shopify Product ID | Shopify Product variant ID | Validated unique SKU | Ad product / product-set key | Ad channel | Effective dates
Join rule: Prefer Product variant ID mapped explicitly to the ad key for the extract period. Use SKU only when non-empty, unique, and stable. Titles are labels, never fuzzy join keys; replacement variants can have new IDs.

Shopify compatible exploration: Product | Product variant | Product / variant ID when compatible | SKU | Sales channel | Gross sales | Discounts | Sales reversals (legacy: Returns) | Net sales | Order ID or same-grain Orders | Net quantity | COGS | Net sales with cost recorded | Net sales without cost recorded
Advertising extract: Ad product / product-set key | Attributed revenue | Ad spend | Ad channel | Date range | Timezone | Currency | Attribution setting
Cost ledger: Fulfillment | Payment / marketplace fees | Reverse logistics outside net sales / COGS | Duties | Packaging | Other order-driven costs
Compatibility stop: If split extracts have no shared lossless Order ID, Sale ID, or Product variant ID, do not infer product-by-channel results from separate totals. Shopify Sales channel is not an ad channel.
Cost-coverage stop: Missing product cost can make COGS display as $0. Stop when material net sales lack cost coverage; missing is not a verified zero.

Ratio-of-sums calculations
Modeled scenario AOV = sum mature net sales / count unique matched orders
Contribution margin % = (sum net sales - sum COGS - sum fulfillment - sum fees - sum reverse logistics outside net sales / COGS - sum other variable costs) / sum net sales x 100
Attributed ROAS = sum attributed revenue / sum matched ad spend
Do not average row-level AOV, margin percentages, or ROAS. Net quantity is not order count. This modeled AOV is not Shopify's official Average order value metric.

Scenario Planner mapping
period = period + currency + timezone + attribution setting
s#n = non-sensitive product-channel alias
s#a = ratio-of-sums AOV
s#m = ratio-of-sums contribution margin %
s#r = ratio-of-sums attributed ROAS
s#s = summed matched ad spend

Privacy boundary: Put only aggregate values and non-sensitive aliases in the URL. Do not include SKU, product or variant ID, order ID, customer data, or source filename. No file is uploaded by this workflow.`;

if (roasInput && acosInput) {
  let updating = false;
  roasInput.addEventListener("input", () => {
    if (updating) return;
    updating = true;
    acosInput.value = roasToAcos(Number(roasInput.value)).toFixed(1);
    updating = false;
  });
  acosInput.addEventListener("input", () => {
    if (updating) return;
    updating = true;
    roasInput.value = acosToRoas(Number(acosInput.value)).toFixed(2);
    updating = false;
  });
}

document.querySelectorAll<HTMLAnchorElement>(".guide-action").forEach((link) => {
  link.addEventListener("click", () => {
    const target = new URL(link.href, window.location.origin);
    const guide = document.body.dataset.guide ?? "unknown";
    const tracked = track("guide_to_tool_clicked", {
      guide,
      target: target.pathname,
    });
    if (tracked) rememberGuideHandoff(guide, target.href);
  });
});

checklistButton?.addEventListener("click", async () => {
  if (await copyText(variableCostChecklist, "Checklist copied")) {
    track("guide_checklist_copied", { guide: document.body.dataset.guide ?? "unknown" });
  }
});

seasonalWorksheetButton?.addEventListener("click", async () => {
  if (await copyText(seasonalPromotionWorksheet, "Worksheet copied")) {
    track("guide_seasonal_worksheet_copied", { guide: document.body.dataset.guide ?? "unknown" });
  }
});

shopifyMappingButton?.addEventListener("click", async () => {
  if (await copyText(shopifyProductMappingWorksheet, "Mapping worksheet copied")) {
    track("guide_shopify_mapping_copied", { guide: document.body.dataset.guide ?? "unknown" });
  }
});

setYearAndIcons();
track("guide_view", { guide: document.body.dataset.guide ?? "unknown" });
