# Apex Exotic Rentals — Full-Stack Booking Platform

A production-oriented Next.js + PostgreSQL rental platform starter for luxury/exotic vehicle reservations.

## Included now

- Premium public fleet and vehicle pages
- Full booking UI with date/time, rental package selection, live availability, customer details, review, and checkout
- Exact seeded pricing for the 2023 purple Lamborghini Huracán EVO Spyder
- PostgreSQL + Prisma 7 normalized schema
- Server-authoritative pricing, add-ons, promo validation, taxes and fees
- Turnaround buffers
- Booking holds with expiration (31-minute default; Stripe requires Checkout expiry to be at least 30 minutes after Session creation)
- PostgreSQL advisory locking to serialize hold creation per vehicle
- Conflict checks across bookings, active holds, manual blocks, and maintenance
- Stripe Checkout integration + verified webhook confirmation
- Payment records and deposit mode
- Customer booking lookup plus customer registration/sign-in and account-linked dashboard
- Booking-specific driver age/licence/insurance data and minimum-age/licence-expiry validation
- Secure admin login/session model
- Admin dashboard, editable reservation statuses, editable vehicle status/pricing, manual availability blocks, and 14-day availability calendar
- Audit/data models for documents, promos, taxes, fees, maintenance, agreements, handover, notifications, refunds, and multi-location expansion
- Vitest overlap/buffer tests

## Current stack

- Next.js 16.3.0
- React / React DOM 19.2.8
- TypeScript
- PostgreSQL
- Prisma ORM / pg adapter 7.9.1
- Stripe Node SDK 22.3.2
- Zod

## Quick start

1. Copy environment settings:

```bash
cp .env.example .env
```

2. Create a PostgreSQL database and set `DATABASE_URL`. For local development you can run `docker compose up -d db` using the included Compose file.

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma Client:

```bash
npm run db:generate
```

5. Apply the included initial database migration:

```bash
npm run db:deploy
```

When you intentionally change `prisma/schema.prisma` during development, create a new migration with `npm run db:migrate -- --name your_change`.

6. Seed the Huracán and development admin:

```bash
npm run db:seed
```

7. Start:

```bash
npm run dev
```

Open `http://localhost:3000`.


## Verification command

After dependencies are installed and the database is configured, run the full repository verification sequence:

```bash
npm run verify
```

This runs the dependency-free core tests, Prisma Client generation, Vitest tests, TypeScript semantic checking, and the Next.js production build.

## Seeded Lamborghini packages

- 2 hours — $660.86
- 4 hours — $841.42
- 6 hours — $1,021.98
- 8 hours — $1,202.55
- 24 hours — $1,563.67
- 2 days — $3,127.34
- 3 days — $4,691.01
- 4 days — $6,254.68
- 5 days — $7,818.35
- 6 days — $9,382.02
- 7 days — $10,945.69

## Stripe

Set:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=http://localhost:3000
```

Development webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The checkout route:

1. validates the request;
2. loads the rental package from PostgreSQL;
3. computes the end time server-side;
4. verifies lead-time and vehicle status;
5. recalculates pricing server-side;
6. acquires a PostgreSQL advisory lock for the vehicle;
7. rechecks active bookings/holds/blocks/maintenance;
8. creates a temporary booking hold;
9. creates the booking and Stripe Checkout Session;
10. confirms the booking only after Stripe's signed webhook.

If Stripe keys are absent, checkout enters **development demo mode** and creates a `PENDING_PAYMENT` reservation without pretending payment succeeded.

## Admin

Seed credentials come from:

```env
DEMO_ADMIN_EMAIL=
DEMO_ADMIN_PASSWORD=
```

Visit `/admin/login`.

Do not use seeded credentials in production.

## Availability rules

A requested interval is blocked by:

- PENDING_PAYMENT / PAID / CONFIRMED / IN_PROGRESS bookings
- unexpired HOLD records
- manual availability blocks
- scheduled/in-progress maintenance
- configurable turnaround buffer before and after the rental

The default turnaround buffer is 30 minutes. The default Checkout inventory hold is 31 minutes. Stripe requires `expires_at` to be at least 30 minutes after the Checkout Session is created, so the extra minute prevents request/DB latency from making a nominal 30-minute hold invalid at Stripe. Use an embedded Payment Intent flow if you require a shorter hold window.

## Important production work before launch

This repository is an implementation foundation, but a real rental company still needs business-specific configuration and legal/operational review. Before taking live payments:

- replace placeholder business/location data;
- verify the rental company's actual timezone;
- configure Stripe production keys and webhook endpoint;
- decide exact deposit/security-deposit policy;
- add business-approved taxes and fees;
- add reviewed rental terms and cancellation policy;
- set `EMAIL_PROVIDER=resend`, `EMAIL_API_KEY`, and a verified `EMAIL_FROM` address for transactional email;
- connect private object storage for driver documents;
- define ID/insurance verification workflow;
- validate local rental/insurance/legal requirements;
- add any business-specific operational workflows beyond the included booking-status, fleet/pricing, and manual-block controls (for example automated refund/reschedule policies);
- add observability, backups, rate limiting, and production secrets management.

## Deployment

Recommended:

- App: Vercel
- Database: managed PostgreSQL (Neon, Supabase, Railway, Prisma Postgres, RDS, etc.)
- Payments: Stripe
- Email: Resend/Postmark/SendGrid
- Secure documents: S3/R2-equivalent private bucket with signed URLs

Deployment sequence:

```bash
npm install
npm run db:generate
npm run db:deploy
npm run build
```

Add all environment variables in the deployment provider, register the production Stripe webhook, then seed only intentional production reference data.
