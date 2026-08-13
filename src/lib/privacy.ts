const ANALYTICS_ID = "G-QZ5QQK45LV";
const PRIVACY_CHOICE_KEY = "roasbreak-privacy-choice";
const ANALYTICS_DISABLE_KEY = `ga-disable-${ANALYTICS_ID}`;

type PrivacyChoice = "accepted" | "rejected";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

let sessionChoice: PrivacyChoice | null = null;

function readChoice(): PrivacyChoice | null {
  if (sessionChoice !== null) return sessionChoice;

  try {
    const value = window.localStorage.getItem(PRIVACY_CHOICE_KEY);
    sessionChoice = value === "accepted" || value === "rejected" ? value : null;
    return sessionChoice;
  } catch {
    return null;
  }
}

function saveChoice(choice: PrivacyChoice): void {
  sessionChoice = choice;
  try {
    window.localStorage.setItem(PRIVACY_CHOICE_KEY, choice);
  } catch {
    // The choice still applies for this page when storage is unavailable.
  }
}

function removeAnalyticsCookies(): void {
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("=")[0])
    .filter((name) => name === "_ga" || name.startsWith("_ga_"));
  const domains = window.location.hostname === "roasbreak.com" || window.location.hostname.endsWith(".roasbreak.com")
    ? ["", "roasbreak.com", ".roasbreak.com"]
    : [""];

  cookieNames.forEach((name) => {
    domains.forEach((domain) => {
      const domainAttribute = domain ? `; domain=${domain}` : "";
      document.cookie = `${name}=; Max-Age=0; path=/${domainAttribute}; SameSite=Lax`;
    });
  });
}

function disableAnalytics(): void {
  const analyticsWindow = window as AnalyticsWindow;
  (analyticsWindow as unknown as Record<string, unknown>)[ANALYTICS_DISABLE_KEY] = true;
  document.querySelectorAll('script[data-roasbreak-analytics="true"]').forEach((script) => script.remove());
  analyticsWindow.dataLayer = [];
  analyticsWindow.gtag = undefined;
  removeAnalyticsCookies();
}

function loadAnalytics(): void {
  if (document.querySelector<HTMLScriptElement>('script[data-roasbreak-analytics="true"]')) return;

  const analyticsWindow = window as AnalyticsWindow;
  (analyticsWindow as unknown as Record<string, unknown>)[ANALYTICS_DISABLE_KEY] = false;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.gtag = (...args: unknown[]) => analyticsWindow.dataLayer?.push(args);
  analyticsWindow.gtag("js", new Date());
  const referrer = document.referrer
    ? (() => {
        try {
          const url = new URL(document.referrer);
          return `${url.origin}${url.pathname}`;
        } catch {
          return "";
        }
      })()
    : "";
  analyticsWindow.gtag("config", ANALYTICS_ID, {
    anonymize_ip: true,
    page_location: `${window.location.origin}${window.location.pathname}`,
    page_referrer: referrer,
  });

  const script = document.createElement("script");
  script.async = true;
  script.dataset.roasbreakAnalytics = "true";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}`;
  document.head.append(script);
}

function showPrivacyBanner(): void {
  if (document.querySelector(".privacy-banner")) return;

  const banner = document.createElement("aside");
  banner.className = "privacy-banner";
  banner.setAttribute("aria-labelledby", "privacy-banner-title");
  banner.innerHTML = `
    <div>
      <strong id="privacy-banner-title">Your privacy choice</strong>
      <p>We use optional Google Analytics only if you accept. The calculators work without analytics.</p>
      <a href="/privacy/">Read the privacy policy</a>
    </div>
    <div class="privacy-actions">
      <button type="button" data-privacy-choice="rejected">Reject optional analytics</button>
      <button class="privacy-accept" type="button" data-privacy-choice="accepted">Accept analytics</button>
    </div>`;

  banner.querySelectorAll<HTMLButtonElement>("[data-privacy-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.privacyChoice as PrivacyChoice;
      saveChoice(choice);
      if (choice === "accepted") loadAnalytics();
      else disableAnalytics();
      banner.remove();
    });
  });
  document.body.append(banner);
}

export function initializePrivacyControls(): void {
  const choice = readChoice();
  if (choice === "accepted") loadAnalytics();
  else {
    disableAnalytics();
    if (choice === null) showPrivacyBanner();
  }

  document.querySelectorAll<HTMLButtonElement>("[data-privacy-settings]").forEach((button) => {
    button.addEventListener("click", showPrivacyBanner);
  });
}

export function trackAnalytics(eventName: string, parameters: Record<string, string> = {}): void {
  if (readChoice() !== "accepted") return;
  (window as AnalyticsWindow).gtag?.("event", eventName, parameters);
}
