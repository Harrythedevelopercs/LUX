# Security & Launch Checklist

This repository avoids storing card details and delegates card collection to Stripe. Before production launch:

- Generate a unique `CRON_SECRET` value in the deployment secret manager; login sessions use random per-session tokens stored only as SHA-256 hashes in PostgreSQL.
- Use production Stripe keys only in server-side environment variables and verify the webhook secret.
- Replace seed admin credentials and do not run development seed credentials in production.
- Put PostgreSQL behind private networking / TLS and enable automated backups and point-in-time recovery.
- Add a production rate limiter (Redis/KV/WAF) to public auth, availability, checkout and lookup endpoints.
- Connect a private object store for licence/insurance documents; serve only short-lived signed URLs after authorization.
- Encrypt especially sensitive driver/profile fields at the application or database layer according to your compliance needs.
- Add MFA for privileged admin roles before broad staff access.
- Configure CSP, HSTS, secure cookies, bot protection and monitoring at the hosting layer.
- Send application errors to a private observability platform; never log passwords, full licence documents or payment secrets.
- Review data retention/deletion rules for customer identity documents.
- Replace draft rental agreement/cancellation text with counsel-approved terms for the actual rental jurisdiction.
- Verify insurance, age, deposit, tax, rental and consumer-protection rules applicable to the business and vehicle location.

## Payment state

The app does not treat a successful browser redirect as proof of payment. Stripe's signed webhook is the authoritative confirmation path.

## Inventory state

Public availability is advisory. Checkout obtains a per-vehicle PostgreSQL advisory transaction lock and rechecks inventory before creating a hold.
