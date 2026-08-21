import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const inventoryPath = resolve(root, "content/content-inventory.json");
const ledgerPath = resolve(root, "content/content-performance-reviews.json");
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const commitPattern = /^[0-9a-f]{40}$/i;
const checkpointDays = [30, 60, 90];
const signalNames = [
  "indexing",
  "organicSearch",
  "guideToTool",
  "calculations",
  "copyShare",
  "sourceFreshness",
];
const decisionTypes = new Set(["expand", "rewrite", "merge", "observe"]);
const unavailableReasonCodes = new Set([
  "access-denied",
  "attribution-not-available",
  "credentials-unavailable",
  "data-source-unavailable",
  "not-instrumented",
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isIsoDate(value) {
  if (!isNonEmptyString(value) || !isoDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isIsoInstant(value) {
  if (!isNonEmptyString(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
}

function isHttpsUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function dateFromIso(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function addUtcDays(value, days) {
  const date = dateFromIso(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function previousUtcDay(value) {
  return addUtcDays(value, -1);
}

function daysBetween(from, through) {
  return Math.floor((dateFromIso(through).valueOf() - dateFromIso(from).valueOf()) / 86_400_000);
}

function expectedFreshness(asset, completedDate) {
  const sources = Array.isArray(asset.sources) ? asset.sources : [];
  const verifiedDates = sources.map((source) => source.verifiedOn).filter(isIsoDate).sort();
  return {
    sourceCount: sources.length,
    verifiedSourceCount: sources.filter((source) => source.reviewStatus === "verified").length,
    oldestVerifiedOn: verifiedDates[0] ?? null,
    reviewDue: asset.reviewDue,
    status: asset.reviewDue < completedDate ? "overdue" : asset.reviewDue === completedDate ? "due" : "current",
  };
}

function validateEvidence(signal, label, timestampField, failures) {
  if (!isNonEmptyString(signal.source)) failures.push(`${label}: source is required`);
  if (!isIsoInstant(signal[timestampField])) failures.push(`${label}: ${timestampField} must be an ISO UTC instant`);
  if (!Array.isArray(signal.evidence) || signal.evidence.length === 0 || signal.evidence.some((entry) => !isNonEmptyString(entry))) {
    failures.push(`${label}: evidence must be a non-empty string array`);
  }
}

function validateQueries(value, label, failures) {
  if (!Array.isArray(value.queries)) {
    failures.push(`${label}: value.queries must be an array`);
    return;
  }
  value.queries.forEach((query, index) => {
    const queryLabel = `${label}: value.queries[${index}]`;
    if (!isObject(query) || !isNonEmptyString(query.query)) failures.push(`${queryLabel}.query is required`);
    if (!isObject(query) || !isNonNegativeInteger(query.impressions)) failures.push(`${queryLabel}.impressions must be a non-negative integer`);
    if (!isObject(query) || !isNonNegativeInteger(query.clicks)) failures.push(`${queryLabel}.clicks must be a non-negative integer`);
  });
}

function validateAvailableValue(name, value, asset, completedDate, label, failures) {
  if (!isObject(value)) {
    failures.push(`${label}: value must be an object`);
    return;
  }

  if (name === "indexing") {
    if (!new Set(["indexed", "not-indexed", "unknown"]).has(value.verdict)) failures.push(`${label}: value.verdict is invalid`);
    if (!isHttpsUrl(value.url)) failures.push(`${label}: value.url must be an HTTPS URL`);
  }

  if (name === "organicSearch") {
    if (!isNonNegativeInteger(value.impressions)) failures.push(`${label}: value.impressions must be a non-negative integer`);
    if (!isNonNegativeInteger(value.clicks)) failures.push(`${label}: value.clicks must be a non-negative integer`);
    if (isNonNegativeInteger(value.impressions) && isNonNegativeInteger(value.clicks) && value.clicks > value.impressions) {
      failures.push(`${label}: value.clicks cannot exceed impressions`);
    }
    validateQueries(value, label, failures);
  }

  if (name === "guideToTool") {
    if (value.guideId !== asset.id) failures.push(`${label}: value.guideId must match ${asset.id}`);
    if (value.target !== asset.primaryTool) failures.push(`${label}: value.target must match the inventory primaryTool`);
    if (!isNonNegativeInteger(value.guideViews)) failures.push(`${label}: value.guideViews must be a non-negative integer`);
    if (!isNonNegativeInteger(value.guideToToolClicks)) failures.push(`${label}: value.guideToToolClicks must be a non-negative integer`);
    if (isNonNegativeInteger(value.guideViews) && isNonNegativeInteger(value.guideToToolClicks) && value.guideToToolClicks > value.guideViews) {
      failures.push(`${label}: guide-to-tool clicks cannot exceed guide views`);
    }
  }

  if (name === "calculations" && !isNonNegativeInteger(value.completed)) {
    failures.push(`${label}: value.completed must be a non-negative integer`);
  }

  if (name === "copyShare") {
    for (const event of ["targetCopied", "leverCopied", "promotionCopied", "paybackCopied", "scenariosCopied"]) {
      if (!isNonNegativeInteger(value[event])) failures.push(`${label}: value.${event} must be a non-negative integer`);
    }
  }

  if (name === "sourceFreshness") {
    const expected = expectedFreshness(asset, completedDate);
    for (const [field, expectedValue] of Object.entries(expected)) {
      if (value[field] !== expectedValue) failures.push(`${label}: value.${field} must match inventory (${String(expectedValue)})`);
    }
  }
}

function validateSignal(name, signal, asset, completedDate, label, failures) {
  if (!isObject(signal)) {
    failures.push(`${label}: signal is required`);
    return;
  }
  if (signal.availability === "available") {
    validateEvidence(signal, label, "queriedAt", failures);
    validateAvailableValue(name, signal.value, asset, completedDate, label, failures);
    return;
  }
  if (signal.availability === "unavailable") {
    validateEvidence(signal, label, "attemptedAt", failures);
    if (!unavailableReasonCodes.has(signal.reasonCode)) failures.push(`${label}: reasonCode is invalid`);
    if (!isNonEmptyString(signal.reason)) failures.push(`${label}: reason is required`);
    if ("value" in signal) failures.push(`${label}: unavailable signals must not contain value`);
    return;
  }
  failures.push(`${label}: availability must be available or unavailable`);
}

function signalCount(signal, fields) {
  if (signal?.availability !== "available" || !isObject(signal.value)) return 0;
  return fields.reduce((sum, field) => sum + (isNonNegativeInteger(signal.value[field]) ? signal.value[field] : 0), 0);
}

function validateDecision(review, asset, publishedIds, label, failures) {
  const decision = review.decision;
  if (!isObject(decision)) {
    failures.push(`${label}: decision is required`);
    return;
  }
  if (!decisionTypes.has(decision.type)) failures.push(`${label}: decision.type must be expand, rewrite, merge, or observe`);
  if (!isNonEmptyString(decision.rationale)) failures.push(`${label}: decision.rationale is required`);
  if (!isNonEmptyString(decision.nextAction)) failures.push(`${label}: decision.nextAction is required`);

  if (decision.type === "merge") {
    if (!isNonEmptyString(decision.targetAssetId) || !publishedIds.has(decision.targetAssetId) || decision.targetAssetId === asset.id) {
      failures.push(`${label}: merge requires a different published targetAssetId`);
    }
  } else if ("targetAssetId" in decision) {
    failures.push(`${label}: targetAssetId is only valid for merge decisions`);
  }

  if (decision.type === "expand") {
    const demandCount = signalCount(review.signals?.organicSearch, ["impressions", "clicks"]);
    const behaviorCount = signalCount(review.signals?.guideToTool, ["guideToToolClicks"])
      + signalCount(review.signals?.calculations, ["completed"])
      + signalCount(review.signals?.copyShare, ["targetCopied", "leverCopied", "promotionCopied", "paybackCopied", "scenariosCopied"]);
    if (demandCount === 0 || behaviorCount === 0) failures.push(`${label}: expand requires positive demand and product-behavior evidence`);
  }
}

function validatePolicy(ledger, failures) {
  if (ledger?.schemaVersion !== 1) failures.push("ledger: schemaVersion must be 1");
  if (!isObject(ledger?.policy)) {
    failures.push("ledger: policy is required");
    return;
  }
  if (JSON.stringify(ledger.policy.checkpointDays) !== JSON.stringify(checkpointDays)) {
    failures.push("ledger: policy.checkpointDays must be [30,60,90]");
  }
  if (ledger.policy.timezone !== "UTC") failures.push("ledger: policy.timezone must be UTC");
  if (!Array.isArray(ledger.reviews)) failures.push("ledger: reviews must be an array");
}

function validateReview(review, asset, asOf, publishedIds) {
  const label = `${review?.assetId ?? "(missing)"}:${review?.checkpointDay ?? "(missing)"}`;
  const failures = [];
  if (!checkpointDays.includes(review?.checkpointDay)) failures.push(`${label}: checkpointDay must be 30, 60, or 90`);
  if (!isIsoInstant(review?.completedAt)) failures.push(`${label}: completedAt must be an ISO UTC instant`);
  if (!commitPattern.test(review?.repositoryCommit ?? "")) failures.push(`${label}: repositoryCommit must be a 40-character Git SHA`);

  const dueOn = checkpointDays.includes(review?.checkpointDay) ? addUtcDays(asset.publishedOn, review.checkpointDay) : null;
  const completedDate = isIsoInstant(review?.completedAt) ? review.completedAt.slice(0, 10) : null;
  if (completedDate && dueOn && completedDate < dueOn) failures.push(`${label}: review cannot be completed before ${dueOn}`);
  if (completedDate && completedDate > asOf) failures.push(`${label}: completedAt is in the future relative to ${asOf}`);

  if (!isObject(review?.window)) {
    failures.push(`${label}: window is required`);
  } else if (dueOn) {
    if (review.window.from !== asset.publishedOn) failures.push(`${label}: window.from must be ${asset.publishedOn}`);
    if (review.window.through !== previousUtcDay(dueOn)) failures.push(`${label}: window.through must be ${previousUtcDay(dueOn)}`);
  }

  if (!isObject(review?.signals)) {
    failures.push(`${label}: signals are required`);
  } else {
    for (const name of signalNames) validateSignal(name, review.signals[name], asset, completedDate ?? asOf, `${label}:${name}`, failures);
    for (const unexpectedName of Object.keys(review.signals).filter((name) => !signalNames.includes(name))) {
      failures.push(`${label}: unexpected signal ${unexpectedName}`);
    }
  }
  validateDecision(review, asset, publishedIds, label, failures);
  return failures;
}

export function validateReviewLedger(inventory, ledger, asOf) {
  const failures = [];
  if (!isIsoDate(asOf)) return { failures: [`asOf must be a valid YYYY-MM-DD date`], validKeys: new Set() };
  validatePolicy(ledger, failures);

  const assets = Array.isArray(inventory?.assets)
    ? inventory.assets.filter((asset) => asset.status === "published" && (asset.type === "guide" || asset.type === "methodology"))
    : [];
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const publishedIds = new Set(assetsById.keys());
  const validKeys = new Set();
  const seenKeys = new Set();

  for (const review of Array.isArray(ledger?.reviews) ? ledger.reviews : []) {
    const key = `${review?.assetId}:${review?.checkpointDay}`;
    if (seenKeys.has(key)) {
      failures.push(`${key}: duplicate review record`);
      validKeys.delete(key);
      continue;
    }
    seenKeys.add(key);
    const asset = assetsById.get(review?.assetId);
    if (!asset) {
      failures.push(`${key}: assetId is not a published guide or methodology asset`);
      continue;
    }
    const recordFailures = validateReview(review, asset, asOf, publishedIds);
    failures.push(...recordFailures);
    if (recordFailures.length === 0) validKeys.add(key);
  }

  return { failures, validKeys };
}

export function buildReviewSchedule(inventory, ledger, asOf) {
  const validation = validateReviewLedger(inventory, ledger, asOf);
  const assets = Array.isArray(inventory?.assets)
    ? inventory.assets.filter((asset) => asset.status === "published" && (asset.type === "guide" || asset.type === "methodology"))
    : [];
  const schedule = assets.flatMap((asset) => checkpointDays.map((checkpointDay) => {
    const dueOn = addUtcDays(asset.publishedOn, checkpointDay);
    const key = `${asset.id}:${checkpointDay}`;
    return {
      assetId: asset.id,
      checkpointDay,
      dueOn,
      status: validation.validKeys.has(key) ? "completed" : asOf >= dueOn ? "due" : "scheduled",
      daysPastDue: asOf >= dueOn && !validation.validKeys.has(key) ? daysBetween(dueOn, asOf) : 0,
    };
  }));
  return { ...validation, schedule };
}

function parseArguments(args) {
  const options = { asOf: new Date().toISOString().slice(0, 10), json: false, draft: null };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--json") options.json = true;
    else if (argument === "--as-of" && args[index + 1]) options.asOf = args[++index];
    else if (argument.startsWith("--as-of=")) options.asOf = argument.slice(8);
    else if (argument === "--draft" && args[index + 1]) options.draft = args[++index];
    else if (argument.startsWith("--draft=")) options.draft = argument.slice(8);
    else throw new Error(`Unknown or incomplete argument: ${argument}`);
  }
  return options;
}

function unavailableSignal(source, reasonCode, reason) {
  return {
    availability: "unavailable",
    source,
    attemptedAt: new Date().toISOString(),
    reasonCode,
    reason,
    evidence: ["Replace this draft evidence with the exact query, report, or instrumentation check performed."],
  };
}

export function createReviewDraft(inventory, draftKey) {
  const match = /^(.*):(30|60|90)$/.exec(draftKey ?? "");
  if (!match) throw new Error("--draft must use assetId:30, assetId:60, or assetId:90");
  const asset = inventory.assets?.find((candidate) => candidate.status === "published" && candidate.id === match[1]);
  if (!asset) throw new Error(`${match[1]} is not a published asset`);
  const checkpointDay = Number(match[2]);
  const dueOn = addUtcDays(asset.publishedOn, checkpointDay);
  return {
    assetId: asset.id,
    checkpointDay,
    completedAt: `${dueOn}T00:00:00.000Z`,
    window: { from: asset.publishedOn, through: previousUtcDay(dueOn) },
    repositoryCommit: "REPLACE_WITH_40_CHARACTER_COMMIT_SHA",
    signals: {
      indexing: unavailableSignal("Google Search Console URL Inspection", "credentials-unavailable", "Replace with the actual access result."),
      organicSearch: unavailableSignal("Google Search Console Search Analytics", "credentials-unavailable", "Replace with the actual access result."),
      guideToTool: unavailableSignal("GA4 guide events", "credentials-unavailable", "Replace with the actual access result."),
      calculations: unavailableSignal("GA4 calculation_completed", "not-instrumented", "Replace after verifying current instrumentation."),
      copyShare: unavailableSignal("GA4 copy events", "attribution-not-available", "Replace after checking guide attribution."),
      sourceFreshness: {
        availability: "available",
        source: "content/content-inventory.json",
        queriedAt: new Date().toISOString(),
        evidence: ["Replace with the inventory commit reviewed at this checkpoint."],
        value: expectedFreshness(asset, dueOn),
      },
    },
    decision: {
      type: "observe",
      rationale: "Replace with the evidence-based checkpoint decision.",
      nextAction: "Replace with a dated and owned follow-up action.",
    },
  };
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  if (options.draft) {
    try {
      console.log(JSON.stringify(createReviewDraft(inventory, options.draft), null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
    return;
  }

  const ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
  const report = buildReviewSchedule(inventory, ledger, options.asOf);
  const summary = {
    assets: new Set(report.schedule.map((entry) => entry.assetId)).size,
    completed: report.schedule.filter((entry) => entry.status === "completed").length,
    due: report.schedule.filter((entry) => entry.status === "due").length,
    scheduled: report.schedule.filter((entry) => entry.status === "scheduled").length,
    failures: report.failures.length,
  };

  if (options.json) {
    console.log(JSON.stringify({ asOf: options.asOf, summary, schedule: report.schedule, failures: report.failures }, null, 2));
  } else {
    console.log(`Content performance reviews as of ${options.asOf}: ${summary.completed} completed, ${summary.due} due, ${summary.scheduled} scheduled.`);
    for (const entry of report.schedule.filter((candidate) => candidate.status !== "scheduled")) {
      console.log(`- ${entry.assetId} day ${entry.checkpointDay}: ${entry.status} (${entry.dueOn})`);
    }
    report.failures.forEach((failure) => console.error(`- ${failure}`));
  }
  if (summary.due > 0 || summary.failures > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
