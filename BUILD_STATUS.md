# Build Status

## Implemented

- 2023 purple Lamborghini Huracán EVO Spyder seed data
- Exact 11 rental packages supplied by the project owner
- PostgreSQL / Prisma 7 schema
- Timezone-aware pickup conversion
- Business-hours validation
- Availability against bookings, holds, manual blocks and maintenance
- 30-minute turnaround buffer
- Per-vehicle advisory locking during hold creation
- Expiring inventory holds
- Server-side pricing, add-ons, promo validation, taxes and fees
- Guest customer + driver details
- Minimum driver age and licence-expiration validation
- Stripe Checkout + signed webhook processing
- Deposit payment state and balance tracking
- Customer registration/session/dashboard + guest booking lookup
- Admin session, dashboard, booking status writes, vehicle status writes, price edits and manual blocks
- Audit logging for admin writes
- Multi-location / maintenance / promotions / agreements / handover / notifications / refund schema
- Overlap/buffer tests
- Docker PostgreSQL development service

## Verification performed in this environment

- Parsed every TypeScript/TSX source file with the local TypeScript compiler API: no syntax diagnostics.
- Checked all `@/` internal imports: no missing source targets (generated Prisma imports are expected after `prisma generate`).
- Ran `npm run test:core` equivalent with Node's built-in test runner: 6/6 tests passed.
- Verified the exact 11 seeded Lamborghini package values programmatically.
- Added the initial PostgreSQL migration so `prisma migrate deploy` has a deployable schema.
- Audited timezone/date handling and fixed DST, driver-age, licence-expiration, and Stripe Checkout-expiry edge cases.
- Dependency versions checked against current npm package listings; prerelease-only Stripe 22.4.0 was replaced with stable 22.3.2.
- Database-backed public pages are forced dynamic so production builds do not require a live database connection for prerendering.
- Admin confirmation now re-locks and rechecks vehicle availability instead of bypassing conflict protection.
- Added Next.js 16 flat ESLint config and excluded generated Prisma output from linting.
- Added `postinstall` Prisma generation and a one-command `npm run verify` pipeline.
- Switched Prisma enum imports to the dedicated generated `enums` entry point and configured `.ts` import specifiers for `tsx` seeding.
- Replaced the console-only email stub with a Resend REST adapter and notification delivery/failure recording.
- Public booking dates now default/minimum in the rental location timezone rather than the customer browser timezone.

## Remaining environment limitation

The runtime cannot resolve `registry.npmjs.org` (`EAI_AGAIN`), so external npm dependencies still cannot be installed here. Because of that network restriction only, Prisma Client generation, live PostgreSQL migration execution, Vitest, full TypeScript semantic checking against installed package types, and `next build` cannot be executed in this sandbox.

On a normal internet-connected development machine, run:

1. `npm install`
2. `docker compose up -d db` (or provide another PostgreSQL URL)
3. `npm run db:generate`
4. `npm run db:deploy`
5. `npm run db:seed`
6. `npm run test:core`
7. `npm run test`
8. `npm run typecheck`
9. `npm run build`
