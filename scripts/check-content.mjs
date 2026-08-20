import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const inventoryPath = resolve(root, "content/content-inventory.json");
const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const sitemap = await readFile(resolve(root, "public/sitemap.xml"), "utf8");
const guideDirectory = await readFile(resolve(root, "guides/index.html"), "utf8");
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const ids = new Set();
const urls = new Set();

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

  const filePath = resolve(root, asset.file);
  try {
    await stat(filePath);
  } catch {
    failures.push(`Missing content file for ${asset.id}: ${asset.file}`);
    continue;
  }

  const html = await readFile(filePath, "utf8");
  const canonical = `https://roasbreak.com${asset.url}`;
  assert(html.includes(`<link rel="canonical" href="${canonical}"`), `${asset.id}: canonical does not match inventory`);
  assert(sitemap.includes(`<loc>${canonical}</loc>`), `${asset.id}: missing from sitemap`);
  assert(html.includes("data-editorial-meta"), `${asset.id}: missing visible editorial metadata`);
  assert(html.includes('class="source-list'), `${asset.id}: missing source list`);

  if (asset.type === "guide") {
    assert(html.includes(`data-guide="${asset.id}"`), `${asset.id}: data-guide does not match inventory`);
    assert(html.includes('"@type":"Article"') || html.includes('"@type": "Article"'), `${asset.id}: missing Article schema`);
    assert(html.includes(`"dateModified":"${asset.reviewedOn}"`) || html.includes(`"dateModified": "${asset.reviewedOn}"`), `${asset.id}: schema review date is stale`);
    const primaryActions = html.match(/class="guide-action"/g) ?? [];
    assert(primaryActions.length === 1, `${asset.id}: expected one primary tool action, found ${primaryActions.length}`);
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
