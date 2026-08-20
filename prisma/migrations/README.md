Run `npm run db:migrate -- --name init` after configuring DATABASE_URL. Prisma will generate the first migration.

For very high concurrency, PostgreSQL advisory locking is already used during hold creation. If you later bypass the service layer, preserve the same lock or add a database-level exclusion strategy for overlapping active reservations.
