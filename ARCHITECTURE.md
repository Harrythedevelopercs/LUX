# Architecture Notes

## Source of truth
PostgreSQL is authoritative for vehicles, packages, availability, bookings and payments. Frontend totals are informational only.

## Concurrency
Hold creation uses `pg_advisory_xact_lock(hashtext(vehicleId))`. This serializes competing checkout attempts for the same vehicle inside the checkout critical section, followed by a fresh availability query before the hold is created.

## Payment state
A redirect from Stripe is never treated as payment proof. `checkout.session.completed` is verified using the webhook signature; repeated delivery is safe because the booking is checked before transition and Stripe IDs are unique.

## Expiration
Checkout Sessions are created with the hold expiration. Stripe's `checkout.session.expired` handler marks the booking/hold expired. In production also run an hourly cleanup job invoking `expireOldHolds()` so abandoned non-Stripe holds are released.

## Money
All money values are integer cents. Percentage calculations use integer rounding.

## Private documents
The schema stores object-storage keys, not public URLs. A production document service should issue short-lived signed URLs after admin authorization.

## Extension points
The data model supports locations, business hours, special hours, add-ons, promotions, taxes, fees, maintenance, manual blocks, agreements, refunds, notifications and handover records.
