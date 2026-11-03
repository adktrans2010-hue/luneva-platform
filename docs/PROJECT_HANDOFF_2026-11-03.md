# Project handoff — 2026-11-03

## Recovery checkpoint

- This is a source-and-recovery checkpoint only. No deployment, service restart, database change, environment change, queue change, or provider configuration change was made.
- The Beget/VPS infrastructure outage is an external-provider incident. Do not interpret unavailable public endpoints during that incident as an application regression and do not redeploy solely in response to it.

## Systems

- **Site:** Luneva Platform / `luneva-psy.ru`; the active source checkpoint is the personal RPP design commit `6c3ed72`.
- **Booking:** website booking flow is authoritative for slots, payment holds and appointment state. The booking and help bots use the established shared booking contract.
- **Help bot / AI:** retain the existing controlled configuration and safety gates; no AI flags or cohort changed in this checkpoint.
- **Publisher:** Telegram publisher queue is unchanged.
- **Payments:** YooKassa payment flow keeps a 60-minute hold. Paid confirmation goes to email and, for Telegram-origin bookings, the client Telegram flow; owner notification remains independent.
- **Owner notifications:** use the established owner-notification bot and recipient configuration; no recipient or token changes were made.

## Production state (last verified before provider outage)

- RPP personal landing was deployed before the outage: hero/about photo, dynamic prices, analytics, SEO, canonical URL and Schema.org remain preserved.
- Production RPP tag: `production-rpp-personal-design-20261101` at `6c3ed72a3281ba8105c7553adda1142424d2426e`.
- Post-payment site tag: `production-tg-postpayment-20261026` at `35ffe7524130eb906cadb8db6e66f182a8851384`.
- Bot payment-hold tag: `production-tg-hold-20261026` at `4d5690748730852a2bb838a7c556e286759b2ecb`.

## RPP landing

- Landing URL for Direct: `https://luneva-psy.ru/rpp`.
- The RPP landing preserves dynamic pricing, existing analytics events, canonical metadata and Schema.org identity data.
- The personal first-person RPP copy is retained alongside the redesigned personal landing.

## Booking and payment

- Nearest-slot and month-calendar booking UX is part of the current milestone.
- A date selection does not select a time; `slot_selected` is emitted only on an actual time selection.
- Online payment hold is exactly 60 minutes. Unpaid expired records are removed from active Telegram booking lists and release their slot.
- Handler-level QA verified paid confirmation, duplicate webhook protection, notification failure isolation and independent owner notification.

## Telegram publisher

- Series `1/20` through `20/20` is imported.
- Cadence: Wednesday / Friday / Sunday at 11:00, `Europe/Moscow`.
- `1/20` was manually published and reconciled after the incident; Telegram message ID is recorded operationally as `322`.
- `2/20` remains next at 04.11.2026 11:00 MSK; schedules for `2/20`–`20/20` are unchanged.
- PNG ownership/permission and media-delivery hardening is included in backend commit `7155d51`.

## Direct and Metrika

- Direct campaign ID: `715140760`; group ID: `5809721912`; budget: 1500/week.
- Targeting policy: Search only; under-18 adjustment -100%; wide, alternative and accompanying placements excluded.
- UTM attribution is campaign-level. Primary Metrika goals: `booking_created` and `payment_success`.
- Existing analytics implementation is preserved; no Direct, Metrika, goal or counter settings changed here.

## Recovery

- Existing validated RPP bundle: `C:\Projects\_RECOVERY\luneva-rpp-personal-design-20261101\luneva-rpp-personal-design-20261101.bundle`.
- SHA-256: `42E1C904E5B61D3C9684695D47109DA218104D2B8DCDF4B2DE77AD318EB84350`.
- Recovery bundles created for this milestone include the canonical branch, milestone tag, relevant production tags and reachable acceptance history. They contain no secrets.
- If a post-outage recovery is required, first run read-only health checks; do not perform an unnecessary redeploy. Use the retained production release and the corresponding tagged/bundled source for rollback planning.

## Next actions after provider recovery

1. Run a read-only VPS/site/bot/publisher health check.
2. Verify delivery of the next scheduled publisher post before changing the queue.
3. Continue the controlled Direct test with existing campaign and conversion policy.
4. Avoid deployments unless a verified application defect requires one.
