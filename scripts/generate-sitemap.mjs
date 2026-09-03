import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const origin = "https://roasbreak.com";
const core = [
  ["/", "2026-08-20", "monthly", "1.0"], ["/tools/", "2026-08-20", "monthly", "0.8"],
  ["/target-roas-calculator/", "2026-08-20", "monthly", "0.9"], ["/profit-lever-calculator/", "2026-08-20", "monthly", "0.9"],
  ["/promotion-profit-calculator/", "2026-08-20", "monthly", "0.8"], ["/cac-payback-calculator/", "2026-08-20", "monthly", "0.8"],
  ["/scenario-planner/", "2026-08-20", "monthly", "0.8"], ["/guides/", "2026-09-02", "weekly", "0.8"],
  ["/about/", "2026-08-20", "yearly", "0.5"], ["/contact/", "2026-08-20", "yearly", "0.5"],
  ["/privacy/", "2026-08-20", "yearly", "0.4"], ["/terms/", "2026-08-20", "yearly", "0.4"],
];
const inventory = JSON.parse(await readFile(resolve(root, "content/content-inventory.json"), "utf8"));
const entries = [...core, ...inventory.assets.filter((asset) => asset.status === "published").map((asset) => [asset.url, asset.reviewedOn ?? asset.publishedOn, "monthly", asset.type === "guide" ? "0.8" : "0.7"])];
const seen = new Set();
const urls = entries.filter(([url]) => !seen.has(url) && seen.add(url)).map(([url, lastmod, changefreq, priority]) => `  <url><loc>${origin}${url}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`);
await writeFile(resolve(root, "public/sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`, "utf8");
