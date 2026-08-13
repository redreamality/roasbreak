# AdSense Readiness Audit

Audit date: 2026-08-13

Target: `https://roasbreak.com/` and this repository

Site type: public, English-language ecommerce profitability tools and original guides

Stage: pre-application readiness

## Decision

**Not ready to apply yet.** The repository is ready to deploy after the fixes in this audit, but the live site still serves the old homepage for `/about/`, `/contact/`, `/privacy/`, and `/ads.txt`. Application should wait until the fixes are deployed, the real AdSense publisher ID is added to `ads.txt`, and the owner/account unknowns below are confirmed.

This audit cannot guarantee AdSense approval. Google reviews the deployed site and publisher account.

## Blockers

- `ADS-ELIG-01`, `ADS-ELIG-02`: applicant age/guardian eligibility and duplicate-account status require owner confirmation.
- `ADS-OWN-02`, `ADS-SITE-01`: repository access is proven, but domain ownership and the AdSense site-list/review state require owner and AdSense account evidence.
- `ADS-PRIV-01`: fixed in the repository with a substantive privacy page and optional analytics control, but it is not live yet.

## High Risks

- `ADS-TXT-01`: `public/ads.txt` now deploys a real text file, but it intentionally contains no seller line because the publisher ID is unknown. Replace the example with the account's exact `pub-...` value before review/ad serving.
- `ADS-PRIV-04`: the repository has explicit accept/reject controls for optional Analytics. If AdSense will serve personalized ads to EEA/UK/Swiss users, configure a Google-certified CMP and verify regional behavior before enabling ads.
- `ADS-PROG-01`, `ADS-PROG-04`: invalid-traffic practices and traffic acquisition sources cannot be proven from the public site or repository.

## Medium Risks

- `ADS-TXT-02`, `ADS-UX-05`, `ADS-CRAWL-07`: fixes exist locally (`ads.txt`, trust pages, footer links, sitemap entries) but need production deployment and live verification.
- The hosting platform currently returns the homepage with HTTP 200 for unknown paths. A dedicated `404.html` is now built, but Cloudflare Pages must be verified after deployment to ensure unknown URLs return the 404 document and preferably an HTTP 404 status.

## Implemented Fixes

- Added substantive About, Contact, Privacy Policy, and Terms pages with unique titles, descriptions, canonicals, and crawlable footer links.
- Replaced unconditional GA4 loading with an explicit accept/reject choice; calculators work without Analytics.
- Stripped query strings from Analytics page location/referrer configuration so shared calculator values are not sent as analytics URLs.
- Added a real `ads.txt` deployment file without fabricating a Publisher ID.
- Added trust pages to the sitemap and added a noindex 404 document.
- Added desktop/mobile E2E coverage for trust navigation, consent persistence, Analytics loading, clean analytics URLs, crawler files, and mobile overflow.

## Exhaustive Checklist

| ID | Status | Evidence | Next action |
| --- | --- | --- | --- |
| ADS-ELIG-01 | Unknown | Applicant age/account holder is not present in repository or public site evidence. | Confirm applicant is 18+ or uses an eligible guardian account. |
| ADS-ELIG-02 | Unknown | No AdSense account inventory was provided. | Confirm no duplicate publisher account; add the site to the existing account if one exists. |
| ADS-ELIG-03 | Unknown | Repository/content scan found no policy content violation, but account/traffic items remain unknown. | Resolve all Unknown/Fail rows before applying. |
| ADS-ELIG-04 | N/A | This is an independently hosted Cloudflare Pages website, not Blogger, YouTube, or a hosted partner. | None. |
| ADS-OWN-01 | Pass | Repository and Vite inputs provide direct access to every page `<head>` and the deploy workflow. | Insert AdSense verification/code only through the controlled templates after account setup. |
| ADS-OWN-02 | Unknown | GitHub/Cloudflare configuration implies control, but registrant/DNS/account evidence was not provided. | Confirm the applicant controls `roasbreak.com`, its DNS, and Cloudflare project. |
| ADS-OWN-03 | Pass | Vite pages build and render with JavaScript; no malformed head/body structure or runtime errors found. | Keep build/E2E checks in CI. |
| ADS-SITE-01 | Unknown | AdSense dashboard/site-list status is unavailable. | Add the deployed domain, verify it, request review, and wait for Ready status. |
| ADS-SITE-02 | Pass | The repository can deploy a head tag, AdSense code, and `ads.txt`. | Use the exact verification method offered by the account. |
| ADS-TXT-01 | Fail | `public/ads.txt` is a real text file but has no authorized seller because no Publisher ID is known. | Replace the example with `google.com, pub-<real-id>, DIRECT, f08c47fec0942fa0`. |
| ADS-TXT-02 | Fail | Production `/ads.txt` currently returns the HTML homepage; the local fix is not deployed. | Deploy and verify `text/plain` at the live root. |
| ADS-CONTENT-01 | Pass | Six functional decision tools and five detailed guides provide original calculations, examples, and operating explanations. | Continue editorial review and source maintenance. |
| ADS-CONTENT-02 | Pass | Pages add original formulas, scenario logic, examples, and commentary; they are not embedded/syndicated feeds. | Preserve primary-source citations without copying source bodies. |
| ADS-CONTENT-03 | Pass | Homepage, directories, tool detail pages, and guide detail pages contain substantive main content. | Avoid publishing empty tag/list pages. |
| ADS-CONTENT-04 | Pass | The live homepage, representative tools, and guides are complete and functional; no placeholder/coming-soon content was found. | Deploy the completed trust pages. |
| ADS-CONTENT-05 | Pass | No ads, affiliate blocks, sponsored listings, or paid promotion are present. | Keep publisher content dominant after ads are introduced. |
| ADS-CONTENT-06 | Pass | Main content is substantive English, an AdSense-supported language. | Keep each page linguistically coherent. |
| ADS-CONTENT-07 | N/A | The site has no comments, uploads, accounts, or other UGC surface. | Re-audit if UGC is added. |
| ADS-CONTENT-08 | Pass | Titles/H1/body scan found differentiated topics and natural explanatory copy rather than keyword doorway pages. | Keep new pages differentiated and useful. |
| ADS-UX-01 | Pass | Header/footer navigation and calculator interactions are covered on desktop/mobile; E2E confirms no mobile overflow. | Keep E2E coverage when navigation changes. |
| ADS-UX-02 | Pass | Home, tools directory, guides directory, breadcrumbs, related actions, and trust footer provide clear site flows. | None. |
| ADS-UX-03 | Pass | No fake download/play buttons, nonexistent CTAs, ad-like navigation, or irrelevant redirects were found. | Preserve semantic CTA labels. |
| ADS-UX-04 | Pass | Browser inspection and E2E found no downloads, surprise redirects, malware, popunders, or obstructive popups. | Keep optional privacy control non-blocking. |
| ADS-UX-05 | Fail | About/Contact/Privacy/Terms now exist locally, but the production paths still return the homepage shell. | Deploy, then verify unique live headings/titles and footer links. |
| ADS-UX-06 | Pass | No ad placeholders or ad-like blocks exist before approval; visual hierarchy separates tools and editorial content. | Label future ads neutrally and distinctly. |
| ADS-CRAWL-01 | Pass | Homepage and representative tool/guide URLs return 200 publicly; DNS/TLS resolve correctly. | Verify all new trust pages after deployment. |
| ADS-CRAWL-02 | Pass | `robots.txt` allows all; homepage, robots, and sitemap return 200 to `Mediapartners-Google`/Googlebot user agents; no login wall exists. | Recheck after WAF/rule changes. |
| ADS-CRAWL-03 | Pass | All content routes are static GET pages; forms calculate locally and are not required to view content. | Do not place ads on POST-only result states. |
| ADS-CRAWL-04 | Pass | HTTPS homepage has no redirect; HTTP performs one expected redirect to HTTPS. | Keep canonical host redirects to one hop. |
| ADS-CRAWL-05 | Pass | Stable directory URLs and canonical tags are used; calculator state uses optional query parameters, not session IDs. | Keep canonical tags query-free. |
| ADS-CRAWL-06 | Pass | Cloudflare DNS A/AAAA records resolve, TLS verifies, and sampled requests return successfully. | Monitor uptime after deployment. |
| ADS-CRAWL-07 | Fail | Existing sitemap is valid, but production has not yet published the four new trust URLs. | Deploy updated sitemap and submit/recheck in Search Console. |
| ADS-PROG-01 | Unknown | No traffic/invalid-click logs or owner practice confirmation is available. | Confirm no self-clicking, automated impressions, or invalid traffic tools. |
| ADS-PROG-02 | Pass | Site copy scan found no request/reward to click or view ads and no attention arrows for ads. | Never add incentivized ad copy. |
| ADS-PROG-03 | N/A | No ads or ad slots are currently present. | Use neutral labels such as “Advertisement” when ads are added. |
| ADS-PROG-04 | Unknown | Acquisition source and campaign evidence was not provided. | Review Analytics/traffic sources for paid-to-click, spam, exchanges, and low-quality landers. |
| ADS-PROG-05 | N/A | No AdSense ad code exists to inspect. | Use unmodified official code after approval. |
| ADS-PROG-06 | Pass | The planned surfaces are public content pages/tools, not email, private messages, software, popups, or framed third-party pages. | Exclude 404 and any future non-content screens from ads. |
| ADS-PROG-07 | N/A | The site is a normal web site, not an app WebView. | Re-audit if packaged into an app. |
| ADS-PUB-01 | Pass | Site topic/content scan found no illegal content, illegal promotion, or unlawful download/service flow. | Continue page-level review. |
| ADS-PUB-02 | Pass | Original UI/text and attributed source links are present; no counterfeit sales or copied media catalog was found. | Maintain source attribution and image rights. |
| ADS-PUB-03 | Pass | No hate, harassment, threats, self-harm, violence praise, terrorism, or extortion content was found. | Re-audit new content. |
| ADS-PUB-04 | N/A | No animal/product content or marketplace exists. | Re-audit if niche changes. |
| ADS-PUB-05 | Pass | New About/Contact pages identify Redreamality, explain purpose, and disclose lack of platform affiliation. | Deploy the trust pages. |
| ADS-PUB-06 | Pass | No phishing, identity collection, get-rich guarantee, deceptive offer, or misleading lead flow was found. | Keep calculators assumption-driven and avoid guaranteed outcome claims. |
| ADS-PUB-07 | N/A | No hacking, cheating, fake-document, evasion, tracking, or spyware tools/content exist. | Re-audit if product scope changes. |
| ADS-PUB-08 | N/A | No sexual services, marriage brokerage, adult/family crossover, or exploitation content exists. | Re-audit if content/UGC changes. |
| ADS-PUB-09 | Unknown | Site metadata is accurate, but AdSense account/site mapping and real Publisher ID are unavailable. | Verify account identity and add exact seller ID. |
| ADS-PUB-10 | N/A | No ads exist, so ad/content interference cannot yet be inspected. | Test every responsive placement before enabling ads. |
| ADS-PUB-11 | Pass | Intended content pages have publisher content and no paid promotion; 404 is explicitly noindex and should remain ad-free. | Do not enable ads globally on 404/empty states. |
| ADS-PUB-12 | N/A | No ad placements exist to be out of context/off-screen. | Review responsive/lazy slots before launch. |
| ADS-PUB-13 | N/A | The site publishes ecommerce math, not elections, health treatment, or climate claims. | Re-audit if editorial scope expands. |
| ADS-PUB-14 | N/A | No political/social-issue manipulated media or media publishing feature exists. | Re-audit if media content is added. |
| ADS-PUB-15 | N/A | Business calculators target ecommerce operators; there is no child/UGC content surface. | Maintain adult business audience positioning. |
| ADS-PUB-16 | N/A | No crisis/news/sensitive-event content exists. | Re-audit if news content is introduced. |
| ADS-REST-01 | N/A | No sexual content/products/advice exists. | None. |
| ADS-REST-02 | N/A | No shocking, graphic, violent, disgusting, or prominent obscene content exists. | None. |
| ADS-REST-03 | N/A | No weapon/explosive content or products exist. | None. |
| ADS-REST-04 | N/A | No tobacco/drug content or products exist. | None. |
| ADS-REST-05 | N/A | No alcohol sales or irresponsible drinking promotion exists. | None. |
| ADS-REST-06 | N/A | No gambling or paid games of chance exist. | None. |
| ADS-REST-07 | N/A | No pharmacy, prescription drug, supplement, or app catalog exists. | None. |
| ADS-REST-08 | N/A | No ads or video ads exist to obstruct content/controls. | Add placement-specific responsive tests before ads launch. |
| ADS-PRIV-01 | Fail | A complete local policy discloses hosting, Analytics, identifiers, cookies/web beacons, and future ads, but production `/privacy/` still returns the homepage. | Deploy and verify the live policy/footer link. |
| ADS-PRIV-02 | Pass | Local policy explicitly discloses third-party cookies, web beacons, IP addresses, and identifiers for future ad serving. | Keep wording synchronized with enabled vendors. |
| ADS-PRIV-03 | Pass | Code does not send calculator inputs as event parameters and strips URL query strings from Analytics page locations/referrers. | Never add PII fields or PII-bearing data-layer events. |
| ADS-PRIV-04 | Unknown | Optional Analytics has explicit consent; no Google-certified CMP for regional AdSense consent is configured. | Before ads, configure/test a certified CMP for applicable EEA/UK/Swiss traffic. |
| ADS-PRIV-05 | N/A | No precise geolocation API, field, or data flow exists. | Re-audit if location is added. |
| ADS-PRIV-06 | N/A | The business tool site is not child-directed and has no child audience feature. | Keep child-directed targeting disabled. |
| ADS-PRIV-07 | Pass | Source scan found no code setting/modifying/intercepting/deleting cookies on Google domains. | Do not proxy or manipulate Google cookies. |
| ADS-PRIV-08 | N/A | No AdSense personalization, remarketing, audience lists, or sensitive-category data layer exists. | Review personalization settings and data categories before launch. |
| ADS-PRIV-09 | N/A | The site does not offer housing, employment, or credit advertising/targeting. | Re-audit if advertising scope changes. |
| ADS-PRIV-10 | N/A | Personalized ads are not enabled. | Add required disclosures/controls and verify audience rights before enabling them. |

## Completeness Check

- Requirement IDs in reference: `73`
- Requirement IDs in report: `73`
- Missing IDs: `none`
- Duplicate IDs: `none`

## Official Sources Consulted

Live checks returned HTTP 200 and current titles for the readiness, eligibility, and ownership pages below. Later requests to `support.google.com` timed out on the current network, so the remaining policy evaluation also uses the skill's required official-source checklist snapshot dated 2026-06-16. No conflicting live policy text was observed.

- [Make sure your site's pages are ready for AdSense](https://support.google.com/adsense/answer/7299563?hl=en)
- [Eligibility requirements for AdSense](https://support.google.com/adsense/answer/9724?hl=en)
- [Owning the site you want to use](https://support.google.com/adsense/answer/91205?hl=en)
- [AdSense site management](https://support.google.com/adsense/answer/12131223?hl=en)
- [AdSense crawler troubleshooting](https://support.google.com/adsense/answer/2381908?hl=en)
- [AdSense Program policies](https://support.google.com/adsense/answer/48182?hl=en)
- [Google Publisher Policies](https://support.google.com/adsense/answer/10502938?hl=en)
- [Google Publisher Restrictions](https://support.google.com/adsense/answer/10437795?hl=en)
