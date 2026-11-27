import { hasAnalyticsConsent, COOKIE_CONSENT_EVENT } from "./cookie-consent";
import { METRIKA_READY_EVENT, sendBookingStartedToMetrika, trackInternalEvent, sanitizeGoalParams, type SafeGoalParams } from "./client-analytics";

export function createBookingStartLifecycle() {
  const path = window.location.pathname;
  let pending: SafeGoalParams | null = null;
  let sent = false;
  let internalAttempted = false;
  let disposed = false;
  function cancel() { pending = null; }
  function flush() {
    if (disposed || window.location.pathname !== path || !hasAnalyticsConsent(window.localStorage)) {
      cancel();
      return;
    }
    if (pending && !sent && sendBookingStartedToMetrika(pending)) {
      sent = true;
      cancel();
    }
  }
  window.addEventListener(METRIKA_READY_EVENT, flush);
  window.addEventListener(COOKIE_CONSENT_EVENT, cancel);
  window.addEventListener("pagehide", cancel);
  window.addEventListener("popstate", cancel);
  return {
    interact(params: SafeGoalParams) {
      if (disposed || sent || !hasAnalyticsConsent(window.localStorage)) return;
      if (!internalAttempted) {
        internalAttempted = true;
        void trackInternalEvent("booking_started", sanitizeGoalParams(params))?.catch(() => {
          // Analytics transport failure must not interrupt booking or retry Metrika.
        });
      }
      pending = params;
      flush();
    },
    dispose() {
      disposed = true;
      cancel();
      window.removeEventListener(METRIKA_READY_EVENT, flush);
      window.removeEventListener(COOKIE_CONSENT_EVENT, cancel);
      window.removeEventListener("pagehide", cancel);
      window.removeEventListener("popstate", cancel);
    },
  };
}
