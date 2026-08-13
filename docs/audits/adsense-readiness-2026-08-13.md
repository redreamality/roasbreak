# AdSense Readiness Audit

Audit date: 2026-08-13

Target: `https://roasbreak.com/` and this repository

Site type: public, English-language ecommerce profitability tools and original guides

Stage: pre-application readiness

## Decision

**Ready after account-side fixes.** The repository fixes were deployed to `https://roasbreak.com/` on 2026-08-14. Production smoke tests confirm real About, Contact, Privacy, Terms, `ads.txt`, sitemap, robots, 404, and privacy-consent behavior. Cloudflare and Google Search Console independently prove control of the domain. Application should wait for the applicant/account confirmations below and completion of the AdSense site-add/verification flow; add the real Publisher ID to `ads.txt` as soon as AdSense provides it.

This audit cannot guarantee AdSense approval. Google reviews the deployed site and publisher account.

## Blockers

- `ADS-ELIG-01`, `ADS-ELIG-02`: applicant age/guardian eligibility and duplicate-account status require owner confirmation.
- `ADS-SITE-01`: the current browser session is not signed in to AdSense, and the matching GA4 property has no AdSense link, so the AdSense site-list/review state remains unavailable.

## High Risks

- `ADS-TXT-01`, `ADS-PUB-09`: production serves a real `text/plain` file at `/ads.txt`, but no Publisher ID exists in the repository, environment, GitHub settings, current AdSense browser session, or GA4 links. Google says `ads.txt` is highly recommended rather than mandatory; add the exact seller line once the account provides `pub-...` and before relying on authorized inventory.
- `ADS-PRIV-04`: the repository has explicit accept/reject controls for optional Analytics. If AdSense will serve personalized ads to EEA/UK/Swiss users, configure a Google-certified CMP and verify regional behavior before enabling ads.
- `ADS-PROG-01`, `ADS-PROG-04`: invalid-traffic practices and traffic acquisition sources cannot be proven from the public site or repository.

## Medium Risks

- No unresolved repository or production issues remain at this severity. Recheck routing, consent, and crawler behavior after hosting or analytics changes.

## Implemented Fixes

- Added substantive About, Contact, Privacy Policy, and Terms pages with unique titles, descriptions, canonicals, and crawlable footer links.
- Replaced unconditional GA4 loading with an explicit accept/reject choice; calculators work without Analytics.
- Made consent withdrawal immediate: Analytics is disabled, its loader/event queue are removed, and site-accessible `_ga*` cookies are deleted without reloading the page.
- Stripped query strings from Analytics page location/referrer configuration so shared calculator values are not sent as analytics URLs.
- Added a real `ads.txt` deployment file without fabricating a Publisher ID.
- Added trust pages to the sitemap and added a noindex 404 document.
- Added desktop/mobile E2E coverage for trust navigation, consent persistence, Analytics loading, clean analytics URLs, crawler files, and mobile overflow.
- Deployed the verified build to Cloudflare Pages and passed a two-test production smoke suite against `https://roasbreak.com/`.
- Verified an arbitrary missing production path returns HTTP 404 with the dedicated noindex error document.
- Confirmed `sc-domain:roasbreak.com` is a Search Console `siteOwner`; the homepage is submitted/indexed, mobile crawl succeeds, robots allow indexing, and canonicals match.
- Deployed the strengthened consent-withdrawal flow and passed a production Chromium smoke test on `roasbreak.com`: no reload, Analytics disabled, loader/queue removed, and `_ga*` cookies cleared.

## Exhaustive Checklist

| ID | Status | Evidence | Next action |
| --- | --- | --- | --- |
| ADS-ELIG-01 | Unknown | Applicant age/account holder is not present in repository or public site evidence. | Confirm applicant is 18+ or uses an eligible guardian account. |
| ADS-ELIG-02 | Unknown | No AdSense account inventory was provided. | Confirm no duplicate publisher account; add the site to the existing account if one exists. |
| ADS-ELIG-03 | Unknown | Repository/content scan found no policy content violation, but account/traffic items remain unknown. | Resolve all Unknown/Fail rows before applying. |
| ADS-ELIG-04 | N/A | This is an independently hosted Cloudflare Pages website, not Blogger, YouTube, or a hosted partner. | None. |
| ADS-OWN-01 | Pass | Repository and Vite inputs provide direct access to every page `<head>` and the deploy workflow. | Insert AdSense verification/code only through the controlled templates after account setup. |
| ADS-OWN-02 | Pass | The current Cloudflare credential reads the unique active `roasbreak.com` zone, its Pages project, and bound custom domain; Search Console independently reports `sc-domain:roasbreak.com` as `siteOwner`. | Keep DNS, hosting, and Search Console access under the applicant's control. |
| ADS-OWN-03 | Pass | Vite pages build and render with JavaScript; no malformed head/body structure or runtime errors found. | Keep build/E2E checks in CI. |
| ADS-SITE-01 | Unknown | The current browser session is signed out of AdSense, and the matching GA4 property has no AdSense link, so no site-list or review status is available. | Sign in to the intended AdSense account, add `roasbreak.com`, complete ownership verification, and request review. |
| ADS-SITE-02 | Pass | The repository can deploy a head tag, AdSense code, and `ads.txt`. | Use the exact verification method offered by the account. |
| ADS-TXT-01 | Unknown | `public/ads.txt` is valid and live, but no AdSense Publisher ID was found. Google's current guide says `ads.txt` is highly recommended, not mandatory; the seller line cannot be validated before the account provides an ID. | When AdSense provides the ID, add `google.com, pub-<real-id>, DIRECT, f08c47fec0942fa0` and verify the account recognizes it. |
| ADS-TXT-02 | Pass | Production `/ads.txt` returns HTTP 200 with `text/plain; charset=utf-8`. | Keep the root file deployed. |
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
| ADS-UX-05 | Pass | Production About/Contact/Privacy/Terms pages have unique headings, titles, canonicals, and footer links. | Keep publisher/contact details current. |
| ADS-UX-06 | Pass | No ad placeholders or ad-like blocks exist before approval; visual hierarchy separates tools and editorial content. | Label future ads neutrally and distinctly. |
| ADS-CRAWL-01 | Pass | Homepage and representative tool/guide URLs return 200 publicly; DNS/TLS resolve correctly. | Verify all new trust pages after deployment. |
| ADS-CRAWL-02 | Pass | `robots.txt` allows all; homepage, robots, and sitemap return 200 to `Mediapartners-Google`/Googlebot user agents; no login wall exists. | Recheck after WAF/rule changes. |
| ADS-CRAWL-03 | Pass | All content routes are static GET pages; forms calculate locally and are not required to view content. | Do not place ads on POST-only result states. |
| ADS-CRAWL-04 | Pass | HTTPS homepage has no redirect; HTTP performs one expected redirect to HTTPS. | Keep canonical host redirects to one hop. |
| ADS-CRAWL-05 | Pass | Stable directory URLs and canonical tags are used; calculator state uses optional query parameters, not session IDs. | Keep canonical tags query-free. |
| ADS-CRAWL-06 | Pass | Cloudflare DNS A/AAAA records resolve, TLS verifies, and sampled requests return successfully. | Monitor uptime after deployment. |
| ADS-CRAWL-07 | Pass | Production sitemap includes all trust/tool/guide URLs; Search Console has downloaded the submitted sitemap with zero warnings/errors, and URL Inspection reports the homepage submitted and indexed. | Resubmit after material URL changes and monitor indexing coverage. |
| ADS-PROG-01 | Unknown | No traffic/invalid-click logs or owner practice confirmation is available. | Confirm no self-clicking, automated impressions, or invalid traffic tools. |
| ADS-PROG-02 | Pass | Site copy scan found no request/reward to click or view ads and no attention arrows for ads. | Never add incentivized ad copy. |
| ADS-PROG-03 | N/A | No ads or ad slots are currently present. | Use neutral labels such as “Advertisement” when ads are added. |
| ADS-PROG-04 | Unknown | Search Console shows only 24 organic impressions and zero clicks in 28 days, but GA4 channel reporting requires an additional `analytics.readonly` OAuth scope and could not be reviewed. | Authorize a read-only GA4 traffic-source audit or provide an acquisition export; confirm no paid-to-click, spam, exchanges, or low-quality landing traffic. |
| ADS-PROG-05 | N/A | No AdSense ad code exists to inspect. | Use unmodified official code after approval. |
| ADS-PROG-06 | Pass | The planned surfaces are public content pages/tools, not email, private messages, software, popups, or framed third-party pages. | Exclude 404 and any future non-content screens from ads. |
| ADS-PROG-07 | N/A | The site is a normal web site, not an app WebView. | Re-audit if packaged into an app. |
| ADS-PUB-01 | Pass | Site topic/content scan found no illegal content, illegal promotion, or unlawful download/service flow. | Continue page-level review. |
| ADS-PUB-02 | Pass | Original UI/text and attributed source links are present; no counterfeit sales or copied media catalog was found. | Maintain source attribution and image rights. |
| ADS-PUB-03 | Pass | No hate, harassment, threats, self-harm, violence praise, terrorism, or extortion content was found. | Re-audit new content. |
| ADS-PUB-04 | N/A | No animal/product content or marketplace exists. | Re-audit if niche changes. |
| ADS-PUB-05 | Pass | Production About/Contact pages identify Redreamality, explain purpose, and disclose lack of platform affiliation. | Keep identity and affiliation disclosures current. |
| ADS-PUB-06 | Pass | No phishing, identity collection, get-rich guarantee, deceptive offer, or misleading lead flow was found. | Keep calculators assumption-driven and avoid guaranteed outcome claims. |
| ADS-PUB-07 | N/A | No hacking, cheating, fake-document, evasion, tracking, or spyware tools/content exist. | Re-audit if product scope changes. |
| ADS-PUB-08 | N/A | No sexual services, marriage brokerage, adult/family crossover, or exploitation content exists. | Re-audit if content/UGC changes. |
| ADS-PUB-09 | Unknown | Site/domain identity is accurate and ownership is proven, but the current AdSense session is signed out, GA4 has no AdSense link, and no real Publisher ID is available. | Verify the intended AdSense account/site mapping and add its exact seller ID when assigned. |
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
| ADS-PRIV-01 | Pass | Production Privacy Policy discloses hosting, Analytics, identifiers, cookies/web beacons, and future ads; the footer links to it site-wide. | Keep the policy synchronized with enabled vendors. |
| ADS-PRIV-02 | Pass | Local policy explicitly discloses third-party cookies, web beacons, IP addresses, and identifiers for future ad serving. | Keep wording synchronized with enabled vendors. |
| ADS-PRIV-03 | Pass | Code does not send calculator inputs as event parameters, strips query strings from Analytics URLs, and immediately disables Analytics/removes its queue and `_ga*` cookies when consent is withdrawn. | Never add PII fields or PII-bearing data-layer events; keep consent-withdrawal E2E coverage. |
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

Live checks returned current Google Help content for the sources below. The `ads.txt` guide states that use is not mandatory but is highly recommended. The consent requirements state that publishers serving personalized ads in the EEA/UK (since 2024-01-16) or Switzerland (since 2024-07-31) must use a Google-certified CMP integrated with IAB TCF. No live source conflicted with the skill's required checklist snapshot dated 2026-06-16.

- [Make sure your site's pages are ready for AdSense](https://support.google.com/adsense/answer/7299563?hl=en)
- [Eligibility requirements for AdSense](https://support.google.com/adsense/answer/9724?hl=en)
- [Owning the site you want to use](https://support.google.com/adsense/answer/91205?hl=en)
- [AdSense site management](https://support.google.com/adsense/answer/12131223?hl=en)
- [AdSense crawler troubleshooting](https://support.google.com/adsense/answer/2381908?hl=en)
- [AdSense Program policies](https://support.google.com/adsense/answer/48182?hl=en)
- [Google Publisher Policies](https://support.google.com/adsense/answer/10502938?hl=en)
- [Google Publisher Restrictions](https://support.google.com/adsense/answer/10437795?hl=en)
- [Ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en)
- [Google consent management requirements](https://support.google.com/adsense/answer/13554116?hl=en)
