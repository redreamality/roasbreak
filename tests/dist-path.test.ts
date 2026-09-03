import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { distPathForUrl } from "../scripts/check-dist.mjs";

describe("dist URL normalization", () => {
  const dist = resolve("C:/workspace/project/dist");

  it("keeps directory URLs inside dist on Windows", () => {
    expect(distPathForUrl("/tools/", dist)).toBe(resolve(dist, "tools", "index.html"));
  });

  it("maps the sitemap root URL to dist/index.html", () => {
    expect(distPathForUrl("/", dist)).toBe(resolve(dist, "index.html"));
  });
});
