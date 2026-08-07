# ROAS Break

Free break-even ROAS calculator for ecommerce and paid media teams, published at [roasbreak.com](https://roasbreak.com).

## What it calculates

- Break-even ROAS
- Maximum affordable CPA
- Contribution margin after variable costs
- Profit per order at current ROAS
- Profit per $1,000 of ad spend

The calculator supports a quick gross-margin input and a detailed cost-breakdown mode. Results can be shared through a stateful URL without storing customer data.

## Development

```powershell
pnpm install
pnpm dev
```

Run the complete local verification suite:

```powershell
pnpm check
```

## Deployment

Pushes to `main` run unit tests, production build, and Chromium E2E tests before deploying `dist/` to Cloudflare Pages. The private source repository stays on GitHub, and DNS is managed through Cloudflare.
