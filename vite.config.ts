import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  base: "/",
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        targetRoas: resolve(import.meta.dirname, "target-roas-calculator/index.html"),
        profitLevers: resolve(import.meta.dirname, "profit-lever-calculator/index.html"),
        promotionProfit: resolve(import.meta.dirname, "promotion-profit-calculator/index.html"),
        cacPayback: resolve(import.meta.dirname, "cac-payback-calculator/index.html"),
        scenarioPlanner: resolve(import.meta.dirname, "scenario-planner/index.html"),
        contributionMargin: resolve(import.meta.dirname, "guides/contribution-margin-vs-gross-margin/index.html"),
        roasAcos: resolve(import.meta.dirname, "guides/roas-vs-acos/index.html"),
        attributedMer: resolve(import.meta.dirname, "guides/attributed-roas-vs-mer/index.html"),
        revenueBasis: resolve(import.meta.dirname, "guides/ecommerce-revenue-basis/index.html"),
        returnsDiscounts: resolve(import.meta.dirname, "guides/returns-and-discounts/index.html"),
      },
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
