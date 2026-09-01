import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const requiredMeta = [
  ["property", "og:type"],
  ["property", "og:url"],
  ["property", "og:title"],
  ["property", "og:description"],
  ["property", "og:image"],
  ["property", "og:image:width"],
  ["property", "og:image:height"],
  ["name", "twitter:card"],
  ["name", "twitter:title"],
  ["name", "twitter:description"],
  ["name", "twitter:image"],
] as const;

function collectIndexFiles(directory: string, relative = ""): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") return [];
    const entryRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectIndexFiles(entryPath, entryRelative);
    return entry.name === "index.html" && entryRelative !== "404.html" ? [entryRelative] : [];
  });
}

function countTag(html: string, attribute: string, value: string): number {
  const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...html.matchAll(new RegExp(`<meta\\b[^>]*\\b${escapedAttribute}=["']${escapedValue}["'][^>]*>`, "gi"))].length;
}

function contentOf(html: string, attribute: string, value: string): string {
  const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<meta\\b[^>]*\\b${escapedAttribute}=["']${escapedValue}["'][^>]*\\bcontent=["']([^"']*)["']`, "i"))?.[1] ?? "";
}

describe("source HTML metadata", () => {
  for (const relativeFile of collectIndexFiles(root)) {
    it(`${relativeFile} has complete static share and install metadata`, () => {
      const bytes = readFileSync(resolve(root, relativeFile));
      const html = bytes.toString("utf8");
      expect(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))).toBe(false);
      expect(html).not.toMatch(/\bstyle\s*=/i);
      expect((html.match(/<link\b[^>]*\brel=["']manifest["'][^>]*>/gi) ?? [])).toHaveLength(1);
      for (const [attribute, value] of requiredMeta) expect(countTag(html, attribute, value)).toBe(1);

      const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
      const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)?.[1] ?? "";
      const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)?.[1] ?? "";
      const isGuideArticle = canonical.startsWith("https://roasbreak.com/guides/") && canonical !== "https://roasbreak.com/guides/";
      expect(contentOf(html, "property", "og:type")).toBe(isGuideArticle ? "article" : "website");
      expect(contentOf(html, "property", "og:url")).toBe(canonical);
      expect(contentOf(html, "property", "og:title")).toBe(title);
      expect(contentOf(html, "property", "og:description")).toBe(description);
      expect(contentOf(html, "name", "twitter:title")).toBe(title);
      expect(contentOf(html, "name", "twitter:description")).toBe(description);
      expect(contentOf(html, "property", "og:image")).toBe("https://roasbreak.com/og-image.png");
      expect(contentOf(html, "name", "twitter:image")).toBe("https://roasbreak.com/og-image.png");
    });
  }
});

describe("Cloudflare Pages response headers", () => {
  it("declares the defensive headers and narrow analytics/font sources", () => {
    const headers = readFileSync(resolve(root, "public/_headers"), "utf8");
    expect(headers).toContain("X-Content-Type-Options: nosniff");
    expect(headers).toContain("Referrer-Policy: strict-origin-when-cross-origin");
    expect(headers).toContain("X-Frame-Options: DENY");
    expect(headers).toContain("Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()");
    expect(headers).toContain("default-src 'self'");
    expect(headers).toContain("font-src 'self' https://fonts.gstatic.com");
    expect(headers).toContain("style-src 'self' https://fonts.googleapis.com");
    expect(headers).toContain("script-src 'self' https://www.googletagmanager.com");
    expect(headers).toContain("connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com");
    expect(headers).not.toContain("unsafe-eval");
  });
});
