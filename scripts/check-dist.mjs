import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));

export function distPathForUrl(url, distRoot) {
  const pathname = url.split("?", 1)[0];
  const relative = pathname.replace(/^\/+/, "");
  return resolve(distRoot, relative || ".", "index.html");
}

async function main() {
  const dist = resolve(root, "dist");
  const fail = [];
  const inventory = JSON.parse(await readFile(resolve(root, "content/content-inventory.json"), "utf8"));
  const sitemap = await readFile(resolve(dist, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>https:\/\/roasbreak\.com([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const url of urls) {
    try { await access(distPathForUrl(url, dist)); } catch { fail.push(`sitemap URL missing dist file: ${url}`); }
  }
  for (const asset of inventory.assets.filter((item) => item.status === "published")) {
    const file = distPathForUrl(asset.url, dist);
    try {
      const html = await readFile(file, "utf8");
      const canonical = `https://roasbreak.com${asset.url}`;
      if (!html.includes(`<link rel="canonical" href="${canonical}"`)) fail.push(`${asset.id}: canonical missing in dist`);
      if (!html.includes('data-schema="breadcrumb"') || !html.includes('"@type":"BreadcrumbList"')) fail.push(`${asset.id}: static breadcrumb missing in dist`);
    } catch { fail.push(`${asset.id}: dist path missing ${asset.url}`); }
  }
  if (fail.length) { console.error(fail.join("\n")); process.exitCode = 1; }
  else console.log(`dist contract passed for ${urls.length} sitemap URLs and ${inventory.assets.length} inventory assets.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
