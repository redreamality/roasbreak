const ANALYTICS_ID = "G-QZ5QQK45LV";
const PRIVACY_CHOICE_KEY = "roasbreak-privacy-choice";

type PrivacyChoice = "accepted" | "rejected";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function readChoice(): PrivacyChoice | null {
  try {
    const value = window.localStorage.getItem(PRIVACY_CHOICE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

function saveChoice(choice: PrivacyChoice): void {
  try {
    window.localStorage.setItem(PRIVACY_CHOICE_KEY, choice);
  } catch {
    // The choice still applies for this page when storage is unavailable.
  }
}

function loadAnalytics(): void {
  if (document.querySelector<HTMLScriptElement>('script[data-roasbreak-analytics="true"]')) return;

  const analyticsWindow = window as AnalyticsWindow;
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
      else if (document.querySelector('script[data-roasbreak-analytics="true"]')) {
        window.location.reload();
        return;
      }
      banner.remove();
    });
  });
  document.body.append(banner);
}

export function initializePrivacyControls(): void {
  if (readChoice() === "accepted") loadAnalytics();
  else if (readChoice() === null) showPrivacyBanner();

  document.querySelectorAll<HTMLButtonElement>("[data-privacy-settings]").forEach((button) => {
    button.addEventListener("click", showPrivacyBanner);
  });
}

export function trackAnalytics(eventName: string, parameters: Record<string, string> = {}): void {
  (window as AnalyticsWindow).gtag?.("event", eventName, parameters);
}
