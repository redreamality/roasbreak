import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const reportJsonPath = resolve(root, "reports/content-release-baseline.json");
const reportMarkdownPath = resolve(root, "docs/release/content-release-checklist.md");
const manualReviewPath = resolve(root, "content/content-manual-review.json");
const siteOrigin = "https://roasbreak.com";
const reportSchemaVersion = 2;
const releaseContractVersion = 1;
const sourceReviewStatuses = new Set(["verified", "needs-review", "unavailable"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const writeReports = !process.argv.includes("--no-write");
const manualCheckDefinitions = [
  {
    id: "semantic-intent-alignment",
    label: "Page content satisfies its declared primary intent",
    reviewInstruction: "Compare the primaryIntent with the title, direct answer, sections, and conclusion; record evidence for every asset.",
  },
  {
    id: "facts-vs-recommendations",
    label: "External facts are separated from ROAS Break recommendations",
    reviewInstruction: "Identify externally sourced claims and editorial recommendations; confirm each is labeled and sourced appropriately.",
  },
  {
    id: "worked-example-recalculation",
    label: "Worked examples have been independently recalculated",
    reviewInstruction: "Recalculate every example from displayed inputs and formulas, including units and rounding; record the reviewer and result per asset.",
  },
];
const baselineAssetFields = ["type", "url", "file", "primaryIntent", "primaryTool", "reviewedOn", "contentSha256"];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: options.shell ?? false,
    stdio: options.stdio ?? "pipe",
  });
  return {
    command: [command, ...args].join(" "),
    status: result.status ?? 1,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    error: result.error?.message,
  };
}

function runPnpm(args) {
  if (process.env.npm_execpath) return run(process.execPath, [process.env.npm_execpath, ...args]);
  return run(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, { shell: process.platform === "win32" });
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value) {
  if (!isNonEmptyString(value) || !isoDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function stripHtml(html) {
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ?? html;
  return article
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:[a-z]+|#\d+|#x[\da-f]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(html) {
  return stripHtml(html).match(/[A-Za-z0-9]+(?:[.'-][A-Za-z0-9]+)*/g)?.length ?? 0;
}

function jsonLdNodes(html) {
  const nodes = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(match[1]);
      if (Array.isArray(value)) nodes.push(...value);
      else if (Array.isArray(value?.["@graph"])) nodes.push(...value["@graph"]);
      else nodes.push(value);
    } catch {
      nodes.push({ "@type": "InvalidJsonLd" });
    }
  }
  return nodes;
}

function hasType(nodes, expectedType) {
  return nodes.some((node) => {
    const type = node?.["@type"];
    return type === expectedType || (Array.isArray(type) && type.includes(expectedType));
  });
}

function result(id, label, failures, evidence) {
  return {
    id,
    label,
    status: failures.length === 0 ? "passed" : "failed",
    evidence,
    failures,
  };
}

function normalizeHref(value) {
  return value?.replaceAll("&amp;", "&");
}

export function contentSha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

export function createReleaseContract(assets, sourceDocuments) {
  const inputs = {
    assets,
    inventorySha256: contentSha256(sourceDocuments.inventory),
    manualReviewSha256: contentSha256(sourceDocuments.manualReview),
    sitemapSha256: contentSha256(sourceDocuments.sitemap),
  };
  return {
    version: releaseContractVersion,
    sha256: contentSha256(JSON.stringify(inputs)),
  };
}

export function validateReleaseBaseline(currentAssets, currentContract, baselineDocument) {
  const failures = [];
  if (baselineDocument?.schemaVersion !== reportSchemaVersion) {
    failures.push(`committed baseline schemaVersion must be ${reportSchemaVersion}`);
  }
  if (baselineDocument?.summary?.releaseDecision !== "passed") {
    failures.push("committed baseline releaseDecision must be passed");
  }
  if (baselineDocument?.contract?.version !== currentContract.version) {
    failures.push(`committed baseline contract version must be ${currentContract.version}`);
  }
  if (!isNonEmptyString(baselineDocument?.contract?.sha256)) {
    failures.push("committed baseline contract sha256 is missing");
  } else if (baselineDocument.contract.sha256 !== currentContract.sha256) {
    failures.push(`committed baseline contract ${baselineDocument.contract.sha256} does not match current ${currentContract.sha256}`);
  }
  if (!Array.isArray(baselineDocument?.assets)) {
    failures.push("committed baseline assets must be an array");
    return failures;
  }

  const currentById = new Map();
  const baselineById = new Map();

  currentAssets.forEach((asset, index) => {
    if (!isNonEmptyString(asset?.id)) {
      failures.push(`current asset ${index + 1}: id is missing`);
    } else if (currentById.has(asset.id)) {
      failures.push(`${asset.id}: duplicate current asset record`);
    } else {
      currentById.set(asset.id, asset);
    }
  });

  baselineDocument.assets.forEach((asset, index) => {
    if (!isNonEmptyString(asset?.id)) {
      failures.push(`baseline asset ${index + 1}: id is missing`);
    } else if (baselineById.has(asset.id)) {
      failures.push(`${asset.id}: duplicate committed baseline record`);
    } else {
      baselineById.set(asset.id, asset);
    }
  });

  for (const [id, asset] of currentById) {
    const baselineAsset = baselineById.get(id);
    if (!baselineAsset) {
      failures.push(`${id}: missing from committed release baseline`);
      continue;
    }
    for (const field of baselineAssetFields) {
      const baselineValue = baselineAsset[field];
      if (!isNonEmptyString(baselineValue)) {
        failures.push(`${id}: committed baseline ${field} is missing`);
      } else if (baselineValue !== asset[field]) {
        failures.push(`${id}: committed baseline ${field} ${baselineValue} does not match current ${asset[field]}`);
      }
    }
  }

  for (const id of baselineById.keys()) {
    if (!currentById.has(id)) failures.push(`${id}: committed baseline record is not a current published asset`);
  }

  return failures;
}

export function validateManualReviews(assets, reviewDocument) {
  const reviewAssets = Array.isArray(reviewDocument?.assets) ? reviewDocument.assets : [];
  const reviewsById = new Map();
  const duplicateIds = new Set();
  for (const review of reviewAssets) {
    if (!isNonEmptyString(review?.id)) continue;
    if (reviewsById.has(review.id)) duplicateIds.add(review.id);
    else reviewsById.set(review.id, review);
  }

  const publishedIds = new Set(assets.map((asset) => asset.id));
  const unexpectedIds = [...reviewsById.keys()].filter((id) => !publishedIds.has(id));
  const assetIds = assets.map((asset) => asset.id);

  return manualCheckDefinitions.map((definition) => {
    const failures = [];
    for (const duplicateId of duplicateIds) failures.push(`${duplicateId}: duplicate manual review record`);
    for (const unexpectedId of unexpectedIds) failures.push(`${unexpectedId}: manual review record is not a published inventory asset`);

    for (const asset of assets) {
      const review = reviewsById.get(asset.id);
      if (!review) {
        failures.push(`${asset.id}: missing manual review record`);
        continue;
      }
      if (review.reviewedOn !== asset.reviewedOn) {
        failures.push(`${asset.id}: manual review targets ${review.reviewedOn ?? "(missing)"}, inventory reviewedOn is ${asset.reviewedOn}`);
      }
      if (review.contentSha256 !== asset.contentSha256) {
        failures.push(`${asset.id}: manual review contentSha256 ${review.contentSha256 ?? "(missing)"} does not match current HTML ${asset.contentSha256 ?? "(missing)"}`);
      }
      const check = review.checks?.[definition.id];
      if (!check || typeof check !== "object" || Array.isArray(check)) {
        failures.push(`${asset.id}: missing ${definition.id} check`);
        continue;
      }
      if (check.result !== "passed") failures.push(`${asset.id}: ${definition.id} result is ${check.result ?? "(missing)"}`);
      if (!isNonEmptyString(check.reviewer)) failures.push(`${asset.id}: ${definition.id} reviewer is missing`);
      if (!isIsoDate(check.reviewedAt)) failures.push(`${asset.id}: ${definition.id} reviewedAt must be YYYY-MM-DD`);
      if (isIsoDate(check.reviewedAt) && isIsoDate(asset.reviewedOn) && check.reviewedAt < asset.reviewedOn) {
        failures.push(`${asset.id}: ${definition.id} predates the content reviewedOn date`);
      }
      if (!Array.isArray(check.evidence) || check.evidence.length === 0 || check.evidence.some((entry) => !isNonEmptyString(entry))) {
        failures.push(`${asset.id}: ${definition.id} evidence must be a non-empty string array`);
      }
    }

    return {
      id: definition.id,
      label: definition.label,
      status: failures.length === 0 ? "passed" : "failed",
      assetIds,
      reviewInstruction: definition.reviewInstruction,
      evidence: {
        source: "content/content-manual-review.json",
        reviewedAssets: assets.length,
      },
      failures,
    };
  });
}

async function inspectAssets(inventory, sitemap) {
  const assets = inventory.assets.filter((asset) => asset.status === "published").map((asset) => ({ ...asset }));
  const htmlById = new Map();
  const fileFailures = [];
  for (const asset of assets) {
    try {
      const htmlBytes = await readFile(resolve(root, asset.file));
      const html = htmlBytes.toString("utf8");
      htmlById.set(asset.id, html);
      asset.contentSha256 = contentSha256(htmlBytes);
    } catch (error) {
      fileFailures.push(`${asset.id}: cannot read ${asset.file} (${error.message})`);
    }
  }

  const checks = [];
  checks.push(result(
    "published-files",
    "Every published inventory asset has a readable source file",
    fileFailures,
    { inspectedAssets: assets.length },
  ));

  const intentFailures = [];
  const intents = new Map();
  for (const asset of assets) {
    if (!isNonEmptyString(asset.primaryIntent)) {
      intentFailures.push(`${asset.id}: primaryIntent is empty`);
      continue;
    }
    const normalized = asset.primaryIntent.trim().toLowerCase();
    if (intents.has(normalized)) intentFailures.push(`${asset.id}: primaryIntent duplicates ${intents.get(normalized)}`);
    else intents.set(normalized, asset.id);
  }
  checks.push(result(
    "primary-intent-unique",
    "Published assets have one non-empty, unique primary intent",
    intentFailures,
    { inspectedAssets: assets.length, uniqueIntents: intents.size },
  ));

  const governanceFailures = [];
  for (const asset of assets) {
    if (!Array.isArray(asset.sources) || asset.sources.length === 0) {
      governanceFailures.push(`${asset.id}: sources must be a non-empty array`);
      continue;
    }
    const urls = new Set();
    asset.sources.forEach((source, index) => {
      const label = `${asset.id}: source ${index + 1}`;
      if (!source || typeof source !== "object" || Array.isArray(source)) {
        governanceFailures.push(`${label} is not a governance object`);
        return;
      }
      if (!isHttpsUrl(source.url)) governanceFailures.push(`${label} has no valid HTTPS URL`);
      if (!isNonEmptyString(source.owner)) governanceFailures.push(`${label} has no owner`);
      if (!isNonEmptyString(source.region)) governanceFailures.push(`${label} has no region`);
      if (!isIsoDate(source.verifiedOn)) governanceFailures.push(`${label} has an invalid verifiedOn date`);
      if (!sourceReviewStatuses.has(source.reviewStatus)) governanceFailures.push(`${label} has an invalid reviewStatus`);
      if (source.reviewStatus !== "verified") governanceFailures.push(`${label} is not verified for release`);
      if (isIsoDate(source.verifiedOn) && isIsoDate(asset.reviewedOn) && source.verifiedOn > asset.reviewedOn) {
        governanceFailures.push(`${label} was verified after the asset review date`);
      }
      if (urls.has(source.url)) governanceFailures.push(`${label} duplicates another source on the asset`);
      urls.add(source.url);
    });
  }
  checks.push(result(
    "source-governance",
    "Sources have URL, owner, region, verification date, and verified status",
    governanceFailures,
    { inspectedAssets: assets.length, inspectedSources: assets.reduce((sum, asset) => sum + (asset.sources?.length ?? 0), 0) },
  ));

  const bodySourceFailures = [];
  for (const asset of assets) {
    const html = htmlById.get(asset.id);
    if (!html) continue;
    if (!/<ul\b[^>]*class=["'][^"']*\bsource-list\b/i.test(html)) bodySourceFailures.push(`${asset.id}: no visible source list`);
    for (const [index, source] of (Array.isArray(asset.sources) ? asset.sources : []).entries()) {
      if (source && typeof source === "object" && isNonEmptyString(source.url) && !html.includes(`href="${source.url}"`) && !html.includes(`href='${source.url}'`)) {
        bodySourceFailures.push(`${asset.id}: source ${index + 1} is absent from the page body`);
      }
    }
  }
  checks.push(result(
    "body-sources",
    "Every governed source is linked from the visible page body",
    bodySourceFailures,
    { inspectedAssets: assets.length },
  ));

  return { assets, htmlById, checks };
}

function inspectPageContracts(assets, htmlById, sitemap) {
  const checks = [];

  const canonicalFailures = [];
  for (const asset of assets) {
    const html = htmlById.get(asset.id);
    if (!html) continue;
    const canonical = `${siteOrigin}${asset.url}`;
    const canonicalLinks = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
    if (canonicalLinks.length !== 1 || canonicalLinks[0][1] !== canonical) {
      canonicalFailures.push(`${asset.id}: canonical must be exactly ${canonical}`);
    }
    const sitemapEntries = [...sitemap.matchAll(new RegExp(`<loc>${canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/loc>`, "g"))];
    if (sitemapEntries.length !== 1) canonicalFailures.push(`${asset.id}: sitemap must contain its canonical exactly once`);
  }
  checks.push(result(
    "canonical-sitemap",
    "Canonical URLs and sitemap entries match the inventory exactly",
    canonicalFailures,
    { inspectedAssets: assets.length, sitemap: "public/sitemap.xml" },
  ));

  const scopeFailures = [];
  for (const asset of assets) {
    const html = htmlById.get(asset.id);
    if (!html) continue;
    const editorialBlocks = [...html.matchAll(/<aside\b[^>]*\bdata-editorial-meta\b[^>]*>([\s\S]*?)<\/aside>/gi)];
    if (editorialBlocks.length !== 1) {
      scopeFailures.push(`${asset.id}: expected one visible editorial metadata block, found ${editorialBlocks.length}`);
      continue;
    }
    const scopes = [...editorialBlocks[0][1].matchAll(/<span\b[^>]*\bdata-content-scope\b[^>]*>([^<]*)<\/span>/gi)];
    if (scopes.length !== 1 || !scopes[0][1].trim().startsWith("Scope: ")) {
      scopeFailures.push(`${asset.id}: expected one non-empty visible Scope field`);
    }
  }
  checks.push(result(
    "visible-scope",
    "Every asset exposes one visible content scope in editorial metadata",
    scopeFailures,
    { inspectedAssets: assets.length },
  ));

  const guides = assets.filter((asset) => asset.type === "guide");
  const ctaFailures = [];
  for (const asset of guides) {
    const html = htmlById.get(asset.id);
    if (!html) continue;
    const actions = [...html.matchAll(/<a\b[^>]*class=["'][^"']*\bguide-action\b[^"']*["'][^>]*>/gi)];
    if (actions.length !== 1) {
      ctaFailures.push(`${asset.id}: expected one primary guide-action, found ${actions.length}`);
      continue;
    }
    const href = normalizeHref(actions[0][0].match(/\bhref=["']([^"']+)["']/i)?.[1]);
    if (href !== asset.primaryTool) ctaFailures.push(`${asset.id}: CTA ${href ?? "(missing)"} does not match primaryTool ${asset.primaryTool}`);
  }
  checks.push(result(
    "primary-tool-cta",
    "Every guide has exactly one primary CTA matching primaryTool",
    ctaFailures,
    { inspectedGuides: guides.length },
  ));

  const schemaFailures = [];
  for (const asset of assets) {
    const html = htmlById.get(asset.id);
    if (!html) continue;
    const nodes = jsonLdNodes(html);
    if (nodes.some((node) => node?.["@type"] === "InvalidJsonLd")) schemaFailures.push(`${asset.id}: contains invalid JSON-LD`);
    if (asset.type === "guide") {
      const article = nodes.find((node) => node?.["@type"] === "Article" || node?.["@type"]?.includes?.("Article"));
      if (!article) schemaFailures.push(`${asset.id}: missing Article JSON-LD`);
      else {
        if (article.dateModified !== asset.reviewedOn) schemaFailures.push(`${asset.id}: Article dateModified does not match reviewedOn`);
        if (article.mainEntityOfPage !== `${siteOrigin}${asset.url}`) schemaFailures.push(`${asset.id}: Article mainEntityOfPage does not match canonical`);
      }
    }
    if (!hasType(nodes, "BreadcrumbList")) schemaFailures.push(`${asset.id}: missing static BreadcrumbList JSON-LD`);
    const visibleBreadcrumbs = html.match(/<nav\b[^>]*class=["'][^"']*\bbreadcrumb\b[^"']*["'][^>]*>/gi) ?? [];
    if (visibleBreadcrumbs.length !== 1) schemaFailures.push(`${asset.id}: expected one visible breadcrumb, found ${visibleBreadcrumbs.length}`);
  }
  checks.push(result(
    "article-breadcrumb-schema",
    "Guides have Article JSON-LD and every asset has BreadcrumbList plus visible breadcrumb",
    schemaFailures,
    { inspectedAssets: assets.length, inspectedGuides: guides.length, evidenceType: "static-source" },
  ));

  const placeholderPattern = /\b(?:lorem ipsum|coming soon|under construction|placeholder|todo|tbd)\b/i;
  const thinFailures = [];
  const counts = {};
  for (const asset of assets) {
    const html = htmlById.get(asset.id);
    if (!html) continue;
    const count = wordCount(html);
    counts[asset.id] = count;
    if (count < 350) thinFailures.push(`${asset.id}: only ${count} article words (minimum 350)`);
    if (placeholderPattern.test(stripHtml(html))) thinFailures.push(`${asset.id}: contains placeholder language`);
    if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) thinFailures.push(`${asset.id}: missing H1`);
    if (!/<h2\b[^>]*>[\s\S]*?<\/h2>/i.test(html)) thinFailures.push(`${asset.id}: missing substantive H2 structure`);
  }
  checks.push(result(
    "no-thin-placeholders",
    "Published assets exceed the minimum body depth and contain no placeholder language",
    thinFailures,
    { inspectedAssets: assets.length, minimumArticleWords: 350, articleWordCounts: counts },
  ));

  return checks;
}

function markdownCell(value) {
  return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

function markdownReport(report) {
  const automaticRows = report.automatedChecks.map((check) =>
    `| ${check.id} | ${check.status} | ${check.failures.length === 0 ? "No failures" : markdownCell(check.failures.join("; "))} |`,
  ).join("\n");
  const manualRows = report.manualChecks.map((check) =>
    `| ${check.id} | ${check.status} | ${markdownCell(check.reviewInstruction)} |`,
  ).join("\n");
  const assets = report.assets.map((asset) => `- \`${asset.id}\`: \`${asset.url}\``).join("\n");

  return `# Content release checklist

Generated by \`pnpm release:check\`. The JSON record at \`reports/content-release-baseline.json\` is the machine-readable source of truth for this run. CI uses \`pnpm release:check:verify\` to apply the same gate without rewriting timestamped reports.

## Run metadata

- Generated: ${report.generatedAt}
- Commit: \`${report.repository.commit}\`
- Branch: \`${report.repository.branch}\`
- Working tree clean before report generation: ${report.repository.workingTreeClean ? "yes" : "no"}
- Release contract: v${report.contract.version} \`${report.contract.sha256}\`
- Published assets: ${report.summary.assetCount} (${report.summary.guideCount} guides)
- Automated gate: **${report.summary.automatedGate}**
- Release decision: **${report.summary.releaseDecision}**

## Automated checks

| Check | Status | Result |
| --- | --- | --- |
${automaticRows}

Automated failures block the command. The BreadcrumbList check reads static JSON-LD; the targeted Chromium check also executes the existing runtime canonical/schema/breadcrumb/sitemap test.

## Manual checks

These semantic checks pass only when \`content/content-manual-review.json\` contains current, page-by-page reviewer evidence for every published asset. Missing, stale, incomplete, or failed records block release.

| Check | Status | Reviewer action |
| --- | --- | --- |
${manualRows}

## Assets in scope

${assets}
`;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const inventorySource = await readFile(resolve(root, "content/content-inventory.json"), "utf8");
  const inventory = JSON.parse(inventorySource);
  const sitemap = await readFile(resolve(root, "public/sitemap.xml"), "utf8");
  let manualReviewDocument;
  let manualReviewSource = "";
  try {
    manualReviewSource = await readFile(manualReviewPath, "utf8");
    manualReviewDocument = JSON.parse(manualReviewSource);
  } catch (error) {
    manualReviewDocument = { loadFailure: error.message };
  }
  const { assets, htmlById, checks } = await inspectAssets(inventory, sitemap);
  checks.push(...inspectPageContracts(assets, htmlById, sitemap));
  const reportAssets = assets.map(({ id, type, url, file, primaryIntent, primaryTool, reviewedOn, contentSha256 }) => ({
    id,
    type,
    url,
    file,
    primaryIntent,
    primaryTool,
    reviewedOn,
    contentSha256,
  }));
  const releaseContract = createReleaseContract(reportAssets, {
    inventory: inventorySource,
    manualReview: manualReviewSource,
    sitemap,
  });

  const contentContract = run(process.execPath, [resolve(root, "scripts/check-content.mjs")]);
  checks.unshift(result(
    "existing-content-contract",
    "Existing content contract passes unchanged",
    contentContract.status === 0 ? [] : [contentContract.stderr || contentContract.stdout || contentContract.error || "check-content failed"],
    { command: "node scripts/check-content.mjs", output: contentContract.stdout || contentContract.stderr },
  ));

  const runtimeSchema = runPnpm([
    "exec",
    "playwright",
    "test",
    "tests/e2e/inner-pages.spec.ts",
    "--project=chromium",
    "--grep",
    "publishes matching canonical, schema, breadcrumb, and sitemap URLs",
  ]);
  checks.push(result(
    "runtime-breadcrumb-e2e",
    "Chromium proves runtime breadcrumb semantics and schema URLs",
    runtimeSchema.status === 0 ? [] : [runtimeSchema.stderr || runtimeSchema.stdout || runtimeSchema.error || "targeted Playwright check failed"],
    {
      command: "pnpm exec playwright test tests/e2e/inner-pages.spec.ts --project=chromium --grep <canonical/schema/breadcrumb/sitemap test>",
      evidenceType: "runtime-e2e",
      output: runtimeSchema.stdout || runtimeSchema.stderr,
    },
  ));

  if (!writeReports) {
    let baselineFailures;
    try {
      const baselineDocument = JSON.parse(await readFile(reportJsonPath, "utf8"));
      baselineFailures = validateReleaseBaseline(reportAssets, releaseContract, baselineDocument);
    } catch (error) {
      baselineFailures = [`cannot load committed release baseline: ${error instanceof Error ? error.message : String(error)}`];
    }
    checks.push(result(
      "committed-baseline-freshness",
      "Committed release baseline matches every current published asset",
      baselineFailures,
      {
        source: "reports/content-release-baseline.json",
        comparedFields: ["id", ...baselineAssetFields],
        inspectedAssets: reportAssets.length,
      },
    ));
  }

  const gitCommit = run("git", ["rev-parse", "HEAD"]);
  const gitBranch = run("git", ["branch", "--show-current"]);
  const gitStatus = run("git", ["status", "--short"]);
  const automaticFailures = checks.flatMap((check) => check.failures.map((failure) => `${check.id}: ${failure}`));
  const manualChecks = validateManualReviews(assets, manualReviewDocument);
  if (manualReviewDocument?.loadFailure) {
    manualChecks.forEach((check) => check.failures.unshift(`Cannot load manual review file: ${manualReviewDocument.loadFailure}`));
    manualChecks.forEach((check) => { check.status = "failed"; });
  }
  const manualFailures = manualChecks.flatMap((check) => check.failures.map((failure) => `${check.id}: ${failure}`));
  const releaseFailures = [...automaticFailures, ...manualFailures];
  const report = {
    schemaVersion: reportSchemaVersion,
    generatedAt,
    repository: {
      commit: gitCommit.status === 0 ? gitCommit.stdout : "unknown",
      branch: gitBranch.status === 0 ? gitBranch.stdout : "unknown",
      workingTreeClean: gitStatus.status === 0 && gitStatus.stdout.length === 0,
    },
    contract: releaseContract,
    assets: reportAssets,
    automatedChecks: checks,
    manualChecks,
    summary: {
      assetCount: assets.length,
      guideCount: assets.filter((asset) => asset.type === "guide").length,
      automatedPassed: checks.filter((check) => check.status === "passed").length,
      automatedFailed: checks.filter((check) => check.status === "failed").length,
      manualPassed: manualChecks.filter((check) => check.status === "passed").length,
      manualFailed: manualChecks.filter((check) => check.status === "failed").length,
      manualReviewRequired: manualChecks.filter((check) => check.status !== "passed").length,
      automatedGate: automaticFailures.length === 0 ? "passed" : "failed",
      manualGate: manualFailures.length === 0 ? "passed" : "failed",
      releaseDecision: releaseFailures.length === 0 ? "passed" : "blocked",
    },
  };

  if (writeReports) {
    await mkdir(resolve(root, "reports"), { recursive: true });
    await mkdir(resolve(root, "docs/release"), { recursive: true });
    await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(reportMarkdownPath, markdownReport(report), "utf8");
  }

  if (releaseFailures.length > 0) {
    console.error(`Release checks failed (${releaseFailures.length}).${writeReports ? " Reports were written for review:" : ""}`);
    releaseFailures.forEach((failure) => console.error(`- ${failure}`));
    if (writeReports) {
      console.error(`- ${reportJsonPath}`);
      console.error(`- ${reportMarkdownPath}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Release checks passed for ${assets.length} published assets.`);
  console.log(`Manual review passed for all ${manualChecks.length} semantic checks.`);
  if (writeReports) console.log(`Reports: ${reportJsonPath} and ${reportMarkdownPath}`);
  else console.log("Verification mode: no report files were changed.");
}

const directEntry = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === directEntry) await main();
