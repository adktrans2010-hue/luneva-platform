# Booking and site UX production report — 2026-09-14

## Scope

- One 60-minute payment hold contract for public web, account booking, and Telegram booking.
- Atomic expiry of unpaid holds with lazy expiry on booking reads/writes and a five-minute systemd timer.
- Dynamic Telegram booking menu derived from future server-side bookings.
- Homepage consultation formats, footer attribution, certificate assets, and mobile overflow.

## Production

- Active website release: `/var/www/releases/luneva-booking-ux-20260914T1140Z`.
- Booking hold: `PAYMENT_HOLD_MINUTES=60`.
- Expiry timer: `luneva-booking-expiry.timer`, every five minutes.
- Production backup: `/var/backups/booking-site-ux-20260914T104604Z`.
- Rollback: restore the previous `/var/www/luneva-platform` symlink, reload PM2, restore the backed-up application files/systemd units when required, and restore only the protected database rows from the CSV/SQL backup if a data rollback is explicitly approved.

## Data reconciliation

- Five stale unpaid pre-September appointment rows were changed to `expired/failed` with history entries.
- Two paid pre-September rows were preserved unchanged.
- A transaction-rollback probe confirmed that an expired unpaid hold is released and that a paid row is never expired.
- Three legacy certificate paths were mapped to stable versioned assets; all 18 published certificate assets return HTTP 200.

## Acceptance

- `/`, `/about`, `/certificates`, `/help`, and `/contacts`: HTTP 200.
- Desktop: two equal-height consultation-format cards in one row; no horizontal overflow.
- Mobile: one-column cards; document overflow clipped at the root and body; all certificate thumbnails load and the preview modal opens.
- Footer: `© 2026 Luneva Psy.` and separate `Разработчик: Лунев А. · Все права защищены.`
- Publisher remained read-only and unchanged: published 14, approved/unpublished 16, past_due 0.
- No real YooKassa payment or manual Telegram publication was performed.

## Operational notes

- Expiry and webhook updates lock the appointment row, preventing expiry/payment races.
- A payment creation failure releases only its unpaid hold and records appointment history.
- Telegram derives `Мои записи`, reschedule, and cancel controls from the shared site schedule response rather than treating a successful `/start` as proof of an active booking.
