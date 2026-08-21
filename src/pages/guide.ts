import "../styles.css";
import "../tool-pages.css";
import { acosToRoas, roasToAcos } from "../lib/decision-tools";
import { copyText, rememberGuideHandoff, setYearAndIcons, track } from "./common";

const roasInput = document.querySelector<HTMLInputElement>("#guide-roas");
const acosInput = document.querySelector<HTMLInputElement>("#guide-acos");
const checklistButton = document.querySelector<HTMLButtonElement>("#copy-variable-cost-checklist");

const variableCostChecklist = `Ecommerce variable-cost audit
Fields: Group | Source | Period | Currency | Owner | Amount | Tool input | Status
Revenue deductions | [order report] | [period] | [currency] | [owner] | [amount per order] | aov | [status]
Product and inbound | [inventory ledger] | [period] | [currency] | [owner] | [landed unit cost] | cogs | [status]
Fulfillment | [carrier / 3PL invoice] | [period] | [currency] | [owner] | [cost per order] | ship | [status]
Payment and platform | [settlement report] | [period] | [currency] | [owner] | [rate and per-order fee] | fees + other | [status]
Refunds and returns | [mature refund cohort] | [period] | [currency] | [owner] | [loss rate and handling] | returns + other | [status]
Service and other | [support / vendor log] | [period] | [currency] | [owner] | [cost per order] | other | [status]

Duplicate check: Each cost appears in one tool input only; refunded revenue is deducted in aov or returns, never both.
Fixed-variable check: Include order-driven costs; separate fixed overhead unless deliberately allocated.
Missing-zero check: Give every zero an owner and evidence; distinguish zero, missing, and unavailable.`;

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

setYearAndIcons();
track("guide_view", { guide: document.body.dataset.guide ?? "unknown" });
