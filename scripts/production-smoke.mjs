import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const productionOrigin = "https://roasbreak.com";
const requestTimeoutMs = 20_000;

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? decodeEntities(match[2]) : undefined;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

function hasClass(tag, className) {
  return attribute(tag, "class")?.split(/\s+/).includes(className) ?? false;
}

function absoluteUrl(value, base) {
  try {
    return new URL(value, base).href;
  } catch {
    return undefined;
  }
}

function flattenJsonLd(value) {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (value && typeof value === "object" && Array.isArray(value["@graph"])) {
    return [value, ...value["@graph"].flatMap(flattenJsonLd)];
  }
  return value && typeof value === "object" ? [value] : [];
}

function jsonLd(html) {
  const nodes = [];
  const invalid = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const type = attribute(`<script${match[1]}>`, "type");
    if (type?.toLowerCase() !== "application/ld+json") continue;
    try {
      nodes.push(...flattenJsonLd(JSON.parse(match[2])));
    } catch (error) {
      invalid.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { nodes, invalid };
}

function nodeHasType(node, expected) {
  const type = node?.["@type"];
  return type === expected || (Array.isArray(type) && type.includes(expected));
}

export function collectInternalLinks(html, pageUrl, origin = productionOrigin) {
  const expectedOrigin = new URL(origin).origin;
  const links = new Set();
  for (const tag of tags(html, "a")) {
    const href = attribute(tag, "href")?.trim();
    if (!href || href.startsWith("#")) continue;
    const resolved = absoluteUrl(href, pageUrl);
    if (!resolved) continue;
    const url = new URL(resolved);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== expectedOrigin) continue;
    url.hash = "";
    if (url.href === pageUrl) continue;
    links.add(url.href);
  }
  return [...links].sort();
}

export function inspectAssetDocument(asset, html, origin = productionOrigin) {
  const failures = [];
  const canonical = new URL(asset.url, origin).href;
  const canonicalLinks = tags(html, "link").filter((tag) =>
    attribute(tag, "rel")?.toLowerCase().split(/\s+/).includes("canonical"));
  const canonicalUrls = canonicalLinks.map((tag) => absoluteUrl(attribute(tag, "href") ?? "", origin));
  if (canonicalUrls.length !== 1 || canonicalUrls[0] !== canonical) {
    failures.push(`${asset.id}: canonical must be exactly ${canonical}; found ${canonicalUrls.filter(Boolean).join(", ") || "none"}`);
  }

  const schemas = jsonLd(html);
  schemas.invalid.forEach((message) => failures.push(`${asset.id}: invalid JSON-LD (${message})`));
  const articleSchemaCount = schemas.nodes.filter((node) => nodeHasType(node, "Article")).length;
  const breadcrumbSchemaCount = schemas.nodes.filter((node) => nodeHasType(node, "BreadcrumbList")).length;
  if (asset.type === "guide" && articleSchemaCount !== 1) {
    failures.push(`${asset.id}: missing static Article schema (found ${articleSchemaCount})`);
  }
  if (breadcrumbSchemaCount !== 1) {
    failures.push(`${asset.id}: expected one static BreadcrumbList schema, found ${breadcrumbSchemaCount}`);
  }

  const actionTags = tags(html, "a").filter((tag) => hasClass(tag, "guide-action"));
  const actionUrls = actionTags.map((tag) => absoluteUrl(attribute(tag, "href") ?? "", canonical));
  if (asset.type === "guide") {
    if (actionTags.length !== 1) {
      failures.push(`${asset.id}: expected one guide-action, found ${actionTags.length}`);
    } else {
      const expectedAction = new URL(asset.primaryTool, origin).href;
      if (actionUrls[0] !== expectedAction) {
        failures.push(`${asset.id}: guide-action ${actionUrls[0] ?? "invalid"} does not match ${expectedAction}`);
      }
    }
  }

  return {
    failures,
    evidence: {
      canonical,
      canonicalCount: canonicalUrls.length,
      canonicalValues: canonicalUrls.filter(Boolean),
      jsonLdCount: schemas.nodes.length,
      invalidJsonLdCount: schemas.invalid.length,
      articleSchemaCount,
      breadcrumbSchemaCount,
      primaryCtaCount: actionTags.length,
      primaryCta: actionUrls[0] ?? null,
    },
  };
}

export function inspectFetchOutcome(resource, expectedUrl) {
  const failures = [];
  if (resource.error) failures.push(`request failed: ${resource.error}`);
  if (resource.status !== 200) failures.push(`expected HTTP 200, received ${resource.status ?? "no response"}`);
  if (resource.finalUrl && resource.finalUrl !== expectedUrl) {
    failures.push(`final URL ${resource.finalUrl} does not match ${expectedUrl}`);
  }
  return {
    failures,
    evidence: {
      requestedUrl: resource.requestedUrl,
      finalUrl: resource.finalUrl ?? null,
      status: resource.status ?? null,
      contentType: resource.contentType ?? null,
      bytes: Buffer.byteLength(resource.body ?? "", "utf8"),
    },
  };
}

function robotsGroups(text) {
  const groups = [];
  let current = { agents: [], directives: [] };
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === "user-agent") {
      if (current.directives.length > 0) {
        groups.push(current);
        current = { agents: [], directives: [] };
      }
      current.agents.push(value.toLowerCase());
    } else if (current.agents.length > 0) {
      current.directives.push({ field, value });
    }
  }
  if (current.agents.length > 0) groups.push(current);
  return groups;
}

export function inspectRobots(text, origin = productionOrigin) {
  const failures = [];
  const groups = robotsGroups(text);
  const wildcardGroups = groups.filter((group) => group.agents.includes("*"));
  const disallowsRoot = wildcardGroups.some((group) =>
    group.directives.some((directive) => directive.field === "disallow" && directive.value === "/"));
  const sitemapUrls = text.split(/\r?\n/).flatMap((rawLine) => {
    const line = rawLine.replace(/#.*$/, "").trim();
    const match = line.match(/^sitemap\s*:\s*(.+)$/i);
    return match ? [match[1].trim()] : [];
  });
  const expectedSitemap = new URL("/sitemap.xml", origin).href;
  if (wildcardGroups.length === 0) failures.push("robots.txt must declare a User-agent: * group");
  if (disallowsRoot) failures.push("robots.txt disallows the site root for User-agent: *");
  if (!sitemapUrls.includes(expectedSitemap)) failures.push(`robots.txt must declare ${expectedSitemap}`);
  return {
    failures,
    evidence: { wildcardGroupCount: wildcardGroups.length, disallowsRoot, sitemapUrls },
  };
}

function decodeXml(value) {
  return decodeEntities(value.replaceAll("&apos;", "'")).trim();
}

export function inspectSitemap(text, assets, origin = productionOrigin) {
  const locations = [...text.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)]
    .map((match) => decodeXml(match[1]));
  const failures = [];
  const canonicalCounts = {};
  for (const asset of assets) {
    const canonical = new URL(asset.url, origin).href;
    const count = locations.filter((location) => location === canonical).length;
    canonicalCounts[asset.id] = count;
    if (count !== 1) failures.push(`${canonical} appears ${count} times in sitemap; expected exactly once`);
  }
  return { failures, evidence: { locationCount: locations.length, canonicalCounts } };
}

function makeCheck(id, label, target, failures, evidence) {
  return {
    id,
    label,
    target,
    status: failures.length === 0 ? "passed" : "failed",
    failures,
    evidence,
  };
}

async function fetchResource(url) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.1",
        "user-agent": "ROASBreak-Production-Smoke/1.0 (+https://roasbreak.com/)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    return {
      requestedUrl: url,
      finalUrl: response.url,
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: await response.text(),
    };
  } catch (error) {
    return {
      requestedUrl: url,
      finalUrl: null,
      status: null,
      contentType: null,
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function cachedFetcher() {
  const requests = new Map();
  return (url) => {
    if (!requests.has(url)) requests.set(url, fetchResource(url));
    return requests.get(url);
  };
}

function gitValue(args, fallback = "unknown") {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

function repositoryState() {
  const status = gitValue(["status", "--short"], "status-unavailable");
  return {
    commit: gitValue(["rev-parse", "HEAD"]),
    branch: gitValue(["branch", "--show-current"]),
    workingTreeClean: status === "",
    workingTreeStatus: status === "status-unavailable" ? status : status.split(/\r?\n/).filter(Boolean),
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function inspectRepositorySnapshot(start, end, startInventoryHash, endInventoryHash) {
  const failures = [];
  if (!start.workingTreeClean) failures.push("production evidence must start from a clean working tree");
  if (start.commit !== end.commit) failures.push(`HEAD changed during smoke (${start.commit} -> ${end.commit})`);
  if (start.branch !== end.branch) failures.push(`branch changed during smoke (${start.branch} -> ${end.branch})`);
  if (JSON.stringify(start.workingTreeStatus) !== JSON.stringify(end.workingTreeStatus)) {
    failures.push("working tree status changed during smoke");
  }
  if (startInventoryHash !== endInventoryHash) failures.push("content inventory changed during smoke");
  return {
    failures,
    evidence: {
      start,
      end,
      startInventoryHash,
      endInventoryHash,
      stable: failures.length === 0,
    },
  };
}

async function runHttpChecks(assets, origin) {
  const checks = [];
  const fetchCached = cachedFetcher();
  const robotsUrl = new URL("/robots.txt", origin).href;
  const sitemapUrl = new URL("/sitemap.xml", origin).href;
  const [robotsResource, sitemapResource] = await Promise.all([
    fetchCached(robotsUrl),
    fetchCached(sitemapUrl),
  ]);

  const robotsHttp = inspectFetchOutcome(robotsResource, robotsUrl);
  const robots = robotsResource.status === 200
    ? inspectRobots(robotsResource.body, origin)
    : { failures: [], evidence: { wildcardGroupCount: 0, disallowsRoot: null, sitemapUrls: [] } };
  checks.push(makeCheck(
    "robots",
    "Production robots.txt is reachable, crawlable, and declares the sitemap",
    robotsUrl,
    [...robotsHttp.failures, ...robots.failures],
    { http: robotsHttp.evidence, policy: robots.evidence },
  ));

  const sitemapHttp = inspectFetchOutcome(sitemapResource, sitemapUrl);
  const sitemap = sitemapResource.status === 200
    ? inspectSitemap(sitemapResource.body, assets, origin)
    : { failures: [], evidence: { locationCount: 0, canonicalCounts: {} } };
  checks.push(makeCheck(
    "sitemap",
    "Production sitemap contains every published canonical exactly once",
    sitemapUrl,
    [...sitemapHttp.failures, ...sitemap.failures],
    { http: sitemapHttp.evidence, inventoryCoverage: sitemap.evidence },
  ));

  const pageResults = await Promise.all(assets.map(async (asset) => {
    const target = new URL(asset.url, origin).href;
    const resource = await fetchCached(target);
    const http = inspectFetchOutcome(resource, target);
    const document = resource.status === 200
      ? inspectAssetDocument(asset, resource.body, origin)
      : { failures: [], evidence: null };
    return {
      asset,
      target,
      resource,
      check: makeCheck(
        `asset:${asset.id}`,
        "Published asset returns HTTP 200 with matching canonical and static schema",
        target,
        [...http.failures, ...document.failures],
        { http: http.evidence, document: document.evidence },
      ),
    };
  }));
  checks.push(...pageResults.map((result) => result.check));

  const linkOwners = new Map();
  for (const result of pageResults) {
    if (result.resource.status !== 200) continue;
    for (const link of collectInternalLinks(result.resource.body, result.target, origin)) {
      if (!linkOwners.has(link)) linkOwners.set(link, []);
      linkOwners.get(link).push(result.asset.id);
    }
  }
  const internalLinkResults = await Promise.all([...linkOwners].map(async ([url, owners]) => {
    const resource = await fetchCached(url);
    const inspection = inspectFetchOutcome(resource, url);
    return {
      url,
      owners,
      status: inspection.failures.length === 0 ? "passed" : "failed",
      failures: inspection.failures,
      http: inspection.evidence,
    };
  }));
  const internalFailures = internalLinkResults.flatMap((result) =>
    result.failures.map((failure) => `${result.url} (linked by ${result.owners.join(", ")}): ${failure}`));
  checks.push(makeCheck(
    "internal-links",
    "Unique same-origin links discovered in published assets return HTTP 200 without redirecting",
    origin,
    internalFailures,
    { inspectedLinks: internalLinkResults.length, links: internalLinkResults },
  ));

  return checks;
}

function compareExpectedParams(actualUrl, expectedUrl) {
  const failures = [];
  for (const [name, value] of expectedUrl.searchParams) {
    if (actualUrl.searchParams.get(name) !== value) {
      failures.push(`query parameter ${name} did not preserve ${JSON.stringify(value)}`);
    }
  }
  if (!actualUrl.search) failures.push("tool URL did not expose restorable state");
  return failures;
}

async function inspectBrowserAsset(page, asset, origin, viewportName) {
  const target = new URL(asset.url, origin).href;
  const failures = [];
  const evidence = {
    assetId: asset.id,
    viewport: viewportName,
    requestedUrl: target,
    status: null,
    h1: null,
    overflowPx: null,
    toolUrl: null,
    restoredToolUrl: null,
  };
  try {
    const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: requestTimeoutMs });
    evidence.status = response?.status() ?? null;
    if (evidence.status !== 200) {
      failures.push(`expected HTTP 200, received ${evidence.status ?? "no response"}`);
      return { failures, evidence };
    }
    const h1 = page.locator("h1");
    if (await h1.count() !== 1 || !await h1.isVisible()) failures.push("expected one visible h1");
    else evidence.h1 = (await h1.innerText()).trim();
    evidence.overflowPx = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (evidence.overflowPx > 1) failures.push(`horizontal overflow is ${evidence.overflowPx}px`);

    if (asset.type === "guide") {
      const action = page.locator(".guide-action");
      const actionCount = await action.count();
      if (actionCount !== 1) {
        failures.push(`expected one visible guide-action, found ${actionCount}`);
      } else if (!await action.isVisible()) {
        failures.push("guide-action is not visible");
      } else {
        const expectedTool = new URL(asset.primaryTool, origin);
        await action.click({ timeout: requestTimeoutMs });
        await page.waitForURL((url) =>
          url.pathname === expectedTool.pathname && url.search.length > 0,
        { timeout: requestTimeoutMs });
        const toolUrl = new URL(page.url());
        evidence.toolUrl = toolUrl.href;
        failures.push(...compareExpectedParams(toolUrl, expectedTool));
        const beforeReload = toolUrl.href;
        const toolResponse = await page.reload({ waitUntil: "domcontentloaded", timeout: requestTimeoutMs });
        if (toolResponse?.status() !== 200) failures.push(`restored tool returned HTTP ${toolResponse?.status() ?? "no response"}`);
        evidence.restoredToolUrl = page.url();
        if (page.url() !== beforeReload) failures.push("tool URL changed after reload instead of restoring state");
        const toolH1 = page.locator("h1");
        if (await toolH1.count() !== 1 || !await toolH1.isVisible()) failures.push("restored tool has no visible h1");
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(message.split(/\r?\n/, 1)[0]);
  }
  return { failures, evidence };
}

async function runBrowserChecks(assets, origin) {
  const failures = [];
  const evidence = [];
  let browser;
  try {
    const { chromium, devices } = await import("@playwright/test");
    browser = await chromium.launch({ headless: true });
    const viewports = [
      { name: "desktop", options: { ...devices["Desktop Chrome"] } },
      { name: "mobile", options: { ...devices["Pixel 7"] } },
    ];
    for (const viewport of viewports) {
      const context = await browser.newContext(viewport.options);
      const page = await context.newPage();
      for (const asset of assets) {
        const result = await inspectBrowserAsset(page, asset, origin, viewport.name);
        evidence.push(result.evidence);
        result.failures.forEach((failure) => failures.push(`${viewport.name}/${asset.id}: ${failure}`));
      }
      await context.close();
    }
  } catch (error) {
    failures.push(`browser smoke could not run: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await browser?.close();
  }
  return makeCheck(
    "browser-layout-and-state",
    "Desktop and mobile layouts render without overflow and every guide restores tool state",
    origin,
    failures,
    { viewports: ["desktop", "mobile"], inspectedJourneys: evidence.length, journeys: evidence },
  );
}

function parseArguments(args) {
  const options = { browser: false, output: null, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--browser") options.browser = true;
    else if (argument === "--help") options.help = true;
    else if (argument.startsWith("--output=")) {
      options.output = argument.slice("--output=".length);
      if (!options.output) throw new Error("--output requires a path");
    }
    else if (argument === "--output") {
      index += 1;
      options.output = args[index];
      if (!options.output) throw new Error("--output requires a path");
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function defaultOutputPath(generatedAt) {
  const filename = `production-smoke-${generatedAt.replace(/[:.]/g, "-")}.json`;
  return resolve(root, "reports/production-smoke", filename);
}

async function writeReport(report, output) {
  const outputPath = output ? resolve(output) : defaultOutputPath(report.generatedAt);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return outputPath;
}

function usage() {
  return `Usage: node scripts/production-smoke.mjs [--browser] [--output <path>]

Checks the published content inventory against https://roasbreak.com.
By default it performs blocking HTTP and static-source checks. --browser adds
desktop/mobile layout and guide-to-tool state restoration checks. Every run
writes timestamped JSON evidence; no flag can ignore missing production assets.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const startedAt = Date.now();
  const generatedAt = new Date(startedAt).toISOString();
  const inventoryPath = resolve(root, "content/content-inventory.json");
  const repositoryStart = repositoryState();
  const inventorySource = await readFile(inventoryPath, "utf8");
  const inventoryHash = sha256(inventorySource);
  const inventory = JSON.parse(inventorySource);
  const assets = inventory.assets.filter((asset) => asset.status === "published");
  const checks = await runHttpChecks(assets, productionOrigin);
  if (options.browser) checks.push(await runBrowserChecks(assets, productionOrigin));
  const repositoryEnd = repositoryState();
  const endingInventoryHash = sha256(await readFile(inventoryPath, "utf8"));
  const repositorySnapshot = inspectRepositorySnapshot(
    repositoryStart,
    repositoryEnd,
    inventoryHash,
    endingInventoryHash,
  );
  checks.unshift(makeCheck(
    "repository-snapshot",
    "Evidence uses one clean, stable repository and inventory snapshot",
    root,
    repositorySnapshot.failures,
    repositorySnapshot.evidence,
  ));
  const failures = checks.flatMap((check) =>
    check.failures.map((failure) => `${check.id}: ${failure}`));
  const report = {
    schemaVersion: 1,
    generatedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    target: {
      origin: productionOrigin,
      robots: new URL("/robots.txt", productionOrigin).href,
      sitemap: new URL("/sitemap.xml", productionOrigin).href,
    },
    repository: {
      commit: repositoryStart.commit,
      branch: repositoryStart.branch,
      workingTreeClean: repositoryStart.workingTreeClean,
      stableDuringRun: repositorySnapshot.evidence.stable,
      start: repositoryStart,
      end: repositoryEnd,
    },
    invocation: {
      browserChecksEnabled: options.browser,
      requestTimeoutMs,
    },
    inventory: {
      source: "content/content-inventory.json",
      sha256: inventoryHash,
      publishedAssetCount: assets.length,
      assets: assets.map(({ id, type, url, primaryTool, reviewedOn }) => ({
        id, type, url, primaryTool, reviewedOn,
      })),
    },
    checks,
    summary: {
      passed: checks.filter((check) => check.status === "passed").length,
      failed: checks.filter((check) => check.status === "failed").length,
      failureCount: failures.length,
      releaseDecision: failures.length === 0 ? "passed" : "blocked",
    },
  };
  const reportPath = await writeReport(report, options.output);

  if (failures.length > 0) {
    console.error(`Production smoke blocked with ${failures.length} failure(s).`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    console.error(`Evidence: ${reportPath}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Production smoke passed for ${assets.length} published assets.`);
  console.log(`Evidence: ${reportPath}`);
}

const directEntry = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === directEntry) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
