import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const inventoryPath = resolve(root, "content/content-inventory.json");
const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const sitemap = await readFile(resolve(root, "public/sitemap.xml"), "utf8");
const guideDirectory = await readFile(resolve(root, "guides/index.html"), "utf8");
const failures = [];
const sourceReviewStatuses = new Set(["verified", "needs-review", "unavailable"]);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const siteOrigin = "https://roasbreak.com";

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isIsoDate = (value) => {
  if (!isNonEmptyString(value) || !isoDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};

const addUtcDays = (date, days) => {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

export function validateContentReviewCadence(contentInventory) {
  const cadenceFailures = [];
  const reviewPolicy = contentInventory?.reviewPolicy;
  const platformWorkflowDays = reviewPolicy?.platformWorkflowDays;
  const stableConceptDays = reviewPolicy?.stableConceptDays;
  const validPlatformWorkflowDays = Number.isInteger(platformWorkflowDays) && platformWorkflowDays > 0;
  const validStableConceptDays = Number.isInteger(stableConceptDays) && stableConceptDays > 0;
  if (!validPlatformWorkflowDays) {
    cadenceFailures.push("reviewPolicy.platformWorkflowDays must be a positive integer");
  }
  if (!validStableConceptDays) {
    cadenceFailures.push("reviewPolicy.stableConceptDays must be a positive integer");
  }
  if (validPlatformWorkflowDays && validStableConceptDays && platformWorkflowDays === stableConceptDays) {
    cadenceFailures.push("reviewPolicy platformWorkflowDays and stableConceptDays must be different");
  }

  const assets = Array.isArray(contentInventory?.assets) ? contentInventory.assets : [];
  for (const asset of assets) {
    if (asset?.status !== "published") continue;
    const label = isNonEmptyString(asset.id) ? asset.id : "published asset";
    for (const field of ["publishedOn", "reviewedOn", "reviewDue"]) {
      if (!isIsoDate(asset[field])) {
        cadenceFailures.push(`${label}: ${field} must be a real UTC date in YYYY-MM-DD format`);
      }
    }
    if (isIsoDate(asset.publishedOn) && isIsoDate(asset.reviewedOn) && isIsoDate(asset.reviewDue)) {
      const datesAreChronological = asset.publishedOn <= asset.reviewedOn && asset.reviewedOn < asset.reviewDue;
      if (asset.publishedOn > asset.reviewedOn) {
        cadenceFailures.push(`${label}: publishedOn must be on or before reviewedOn`);
      }
      if (asset.reviewedOn >= asset.reviewDue) {
        cadenceFailures.push(`${label}: reviewedOn must be before reviewDue`);
      }
      if (datesAreChronological && validPlatformWorkflowDays && validStableConceptDays
        && platformWorkflowDays !== stableConceptDays) {
        const allowedDueDates = [
          addUtcDays(asset.reviewedOn, platformWorkflowDays),
          addUtcDays(asset.reviewedOn, stableConceptDays),
        ];
        if (!allowedDueDates.includes(asset.reviewDue)) {
          cadenceFailures.push(
            `${label}: reviewDue must be ${allowedDueDates[0]} or ${allowedDueDates[1]} according to reviewPolicy`,
          );
        }
      }
    }
  }
  return cadenceFailures;
}

const isHttpsUrl = (value) => {
  if (!isNonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const decodeHtml = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'");

const breadcrumbSchemaPattern = /<script\b(?=[^>]*\btype="application\/ld\+json")(?=[^>]*\bdata-schema="breadcrumb")[^>]*>([\s\S]*?)<\/script>/g;

const visibleBreadcrumbItems = (html, canonical) => {
  const breadcrumbs = [...html.matchAll(/<nav\b[^>]*class="[^"]*\bbreadcrumb\b[^"]*"[^>]*>([\s\S]*?)<\/nav>/g)];
  if (breadcrumbs.length !== 1) return { breadcrumbs, items: [] };

  const children = [...breadcrumbs[0][1].matchAll(/<(a|span)\b([^>]*)>([\s\S]*?)<\/\1>/g)];
  return {
    breadcrumbs,
    items: children.map((child, index) => {
      const href = child[1] === "a" ? child[2].match(/\bhref="([^"]+)"/)?.[1] : undefined;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: decodeHtml(child[3].replace(/<[^>]+>/g, "").trim()),
        item: href ? new URL(decodeHtml(href), siteOrigin).href : canonical,
      };
    }),
  };
};

const ids = new Set();
const urls = new Set();
const primaryIntents = new Set();
failures.push(...validateContentReviewCadence(inventory));

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["dist", "node_modules", "playwright-report", "test-results"].includes(entry.name)) continue;
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(fullPath));
    else if (entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files;
}

for (const asset of inventory.assets) {
  assert(!ids.has(asset.id), `Duplicate content id: ${asset.id}`);
  assert(!urls.has(asset.url), `Duplicate content URL: ${asset.url}`);
  ids.add(asset.id);
  urls.add(asset.url);

  assert(isNonEmptyString(asset.primaryIntent), `${asset.id}: primaryIntent must be a non-empty string`);
  if (isNonEmptyString(asset.primaryIntent)) {
    const normalizedIntent = asset.primaryIntent.trim().toLowerCase();
    assert(!primaryIntents.has(normalizedIntent), `${asset.id}: duplicate primaryIntent: ${asset.primaryIntent}`);
    primaryIntents.add(normalizedIntent);
  }

  assert(Array.isArray(asset.sources) && asset.sources.length > 0, `${asset.id}: sources must be a non-empty array`);
  if (Array.isArray(asset.sources)) {
    const sourceUrls = new Set();
    asset.sources.forEach((source, index) => {
      const label = `${asset.id}: source ${index + 1}`;
      const isSourceObject = source !== null && typeof source === "object" && !Array.isArray(source);
      assert(isSourceObject, `${label} must be an object with governance metadata`);
      if (!isSourceObject) return;

      assert(isHttpsUrl(source.url), `${label} must have a valid HTTPS url`);
      assert(isNonEmptyString(source.owner), `${label} must have an owner`);
      assert(isNonEmptyString(source.region), `${label} must have a region`);
      assert(isIsoDate(source.verifiedOn), `${label} must have a valid verifiedOn date (YYYY-MM-DD)`);
      assert(sourceReviewStatuses.has(source.reviewStatus), `${label} has invalid reviewStatus: ${source.reviewStatus}`);
      if (asset.status === "published") {
        assert(source.reviewStatus === "verified", `${label} must be verified before published content can pass`);
      }

      if (isIsoDate(source.verifiedOn) && isIsoDate(asset.reviewedOn)) {
        assert(source.verifiedOn <= asset.reviewedOn, `${label} was verified after the asset review date`);
      }
      if (isNonEmptyString(source.url)) {
        assert(!sourceUrls.has(source.url), `${label} duplicates another source URL on this asset`);
        sourceUrls.add(source.url);
      }
    });
  }

  const filePath = resolve(root, asset.file);
  try {
    await stat(filePath);
  } catch {
    failures.push(`Missing content file for ${asset.id}: ${asset.file}`);
    continue;
  }

  const html = await readFile(filePath, "utf8");
  const canonical = `${siteOrigin}${asset.url}`;
  assert(html.includes(`<link rel="canonical" href="${canonical}"`), `${asset.id}: canonical does not match inventory`);
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)?.[1] ?? "";
  const pageBreadcrumbSchemas = [...html.matchAll(breadcrumbSchemaPattern)];
  const headBreadcrumbSchemas = [...head.matchAll(breadcrumbSchemaPattern)];
  assert(pageBreadcrumbSchemas.length === 1, `${asset.id}: expected one static breadcrumb schema, found ${pageBreadcrumbSchemas.length}`);
  assert(headBreadcrumbSchemas.length === 1, `${asset.id}: static breadcrumb schema must be in the document head`);

  const visibleBreadcrumb = visibleBreadcrumbItems(html, canonical);
  assert(visibleBreadcrumb.breadcrumbs.length === 1, `${asset.id}: expected one visible breadcrumb, found ${visibleBreadcrumb.breadcrumbs.length}`);
  assert(visibleBreadcrumb.items.length > 0, `${asset.id}: visible breadcrumb must contain items`);
  if (pageBreadcrumbSchemas.length === 1 && visibleBreadcrumb.items.length > 0) {
    try {
      const schema = JSON.parse(pageBreadcrumbSchemas[0][1]);
      assert(schema["@context"] === "https://schema.org", `${asset.id}: breadcrumb schema has invalid @context`);
      assert(schema["@type"] === "BreadcrumbList", `${asset.id}: breadcrumb schema must be a BreadcrumbList`);
      assert(Array.isArray(schema.itemListElement), `${asset.id}: breadcrumb schema itemListElement must be an array`);
      if (Array.isArray(schema.itemListElement)) {
        assert(schema.itemListElement.length === visibleBreadcrumb.items.length, `${asset.id}: breadcrumb schema item count does not match visible breadcrumb`);
        visibleBreadcrumb.items.forEach((expected, index) => {
          const actual = schema.itemListElement[index];
          assert(actual?.["@type"] === expected["@type"], `${asset.id}: breadcrumb item ${index + 1} must be a ListItem`);
          assert(actual?.position === expected.position, `${asset.id}: breadcrumb item ${index + 1} has the wrong position`);
          assert(actual?.name === expected.name, `${asset.id}: breadcrumb item ${index + 1} name does not match visible breadcrumb`);
          assert(actual?.item === expected.item, `${asset.id}: breadcrumb item ${index + 1} URL does not match visible breadcrumb/canonical`);
        });
      }
    } catch (error) {
      failures.push(`${asset.id}: breadcrumb schema is not valid JSON (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  assert(sitemap.includes(`<loc>${canonical}</loc>`), `${asset.id}: missing from sitemap`);
  const editorialMeta = [...html.matchAll(/<aside\b[^>]*\bdata-editorial-meta\b[^>]*>([\s\S]*?)<\/aside>/g)];
  assert(editorialMeta.length === 1, `${asset.id}: expected one visible editorial metadata block, found ${editorialMeta.length}`);
  const contentScopes = editorialMeta.length === 1
    ? [...editorialMeta[0][1].matchAll(/<span\b[^>]*\bdata-content-scope\b[^>]*>([^<]*)<\/span>/g)]
    : [];
  assert(contentScopes.length === 1, `${asset.id}: expected one visible content scope, found ${contentScopes.length}`);
  if (contentScopes.length === 1) {
    const contentScope = contentScopes[0][1].trim();
    assert(isNonEmptyString(contentScope), `${asset.id}: content scope must not be empty`);
    assert(contentScope.startsWith("Scope: "), `${asset.id}: content scope must start with "Scope: "`);
  }
  assert(html.includes('class="source-list'), `${asset.id}: missing source list`);
  if (Array.isArray(asset.sources)) {
    asset.sources.forEach((source, index) => {
      if (source !== null && typeof source === "object" && isNonEmptyString(source.url)) {
        assert(html.includes(`href="${source.url}"`), `${asset.id}: source ${index + 1} is not linked from the content file`);
      }
    });
  }

  if (asset.type === "guide") {
    assert(html.includes(`data-guide="${asset.id}"`), `${asset.id}: data-guide does not match inventory`);
    assert(html.includes('"@type":"Article"') || html.includes('"@type": "Article"'), `${asset.id}: missing Article schema`);
    assert(html.includes(`"dateModified":"${asset.reviewedOn}"`) || html.includes(`"dateModified": "${asset.reviewedOn}"`), `${asset.id}: schema review date is stale`);
    const primaryActions = html.match(/<a\b[^>]*class="[^"]*\bguide-action\b[^"]*"[^>]*>/g) ?? [];
    assert(primaryActions.length === 1, `${asset.id}: expected one primary tool action, found ${primaryActions.length}`);
    if (primaryActions.length === 1) {
      const primaryHref = primaryActions[0].match(/\bhref="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
      assert(primaryHref === asset.primaryTool, `${asset.id}: primary tool action does not match inventory (${primaryHref} !== ${asset.primaryTool})`);
    }
    assert(guideDirectory.includes(`href="${asset.url}"`), `${asset.id}: missing from guides directory`);
  }
}

for (const filePath of await htmlFiles(root)) {
  const html = await readFile(filePath, "utf8");
  const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  for (const href of links) {
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const pathname = href.split(/[?#]/, 1)[0];
    if (pathname !== "/" && !pathname.endsWith("/")) continue;
    const target = pathname === "/" ? resolve(root, "index.html") : resolve(root, `.${pathname}`, "index.html");
    try {
      await stat(target);
    } catch {
      failures.push(`${filePath.slice(root.length + 1)}: broken internal link ${href}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Content checks failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Content checks passed for ${inventory.assets.length} published assets.`);
