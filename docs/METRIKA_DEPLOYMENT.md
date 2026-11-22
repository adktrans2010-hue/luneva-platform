# Yandex Metrika production configuration

The `web` service must have `NEXT_PUBLIC_YANDEX_METRIKA_ID=113474556` **at build time**.
This is a public counter identifier, not a secret. Next.js embeds it in the client bundle;
changing only runtime variables or restarting an old build is insufficient. Rebuild web.

Consent remains required (`luneva_cookie_consent=accepted`). Private account/auth/admin
routes remain excluded. Pageviews include only the existing attribution allowlist;
arbitrary query parameters (invitation tokens, payment IDs, form input) are not forwarded.
Service-view goals wait for counter initialization and are deduplicated only after submission.

For recovery, record the live deployment before rebuilding. Keep predeploy a no-op;
do not run migrations/seeders or apply an unrelated environment patch.
Validate consent -> tag.js -> counter 113474556 -> pageview -> technical UTM visit in
Metrika. Mark test traffic separately from advertising. Do not create a booking/payment
to test pageview or intermediate goals.
