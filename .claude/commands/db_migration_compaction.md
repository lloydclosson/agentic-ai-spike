---
description: Compact all Drizzle migrations into a single initial migration file
---

# Database Migration Compaction

You are tasked with compacting all existing Drizzle migration files into a single initial migration. This is useful when the migration history has grown unwieldy or has journal/state mismatches.

**Important**: This process drops and recreates the database. All data will be lost. Only use in development.

## Process

### Step 1: Confirm with the user

Before doing anything, warn the user:

```
This will:
1. Drop all tables in the PostgreSQL database
2. Delete all existing migration files and snapshots
3. Generate a single fresh migration from the Drizzle schema
4. Apply the migration to recreate all tables
5. Re-seed the database

All existing data will be lost. This is intended for development only.

Proceed?
```

Wait for explicit confirmation before continuing.

### Step 2: Ensure Docker services are running

```bash
pnpm dev:docker
```

Verify PostgreSQL is accessible. The DATABASE_URL is in `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/universalcoi
```

### Step 3: Drop all tables in the database

Use `docker exec` since `psql` may not be installed locally:

```bash
docker exec universalcoi-postgres-1 psql -U postgres -d universalcoi -c "
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
"
```

Verify the database is empty:
```bash
docker exec universalcoi-postgres-1 psql -U postgres -d universalcoi -c "\dt"
```

### Step 4: Delete all existing migration files

Delete everything in `apps/api/drizzle/`:

```bash
rm -f apps/api/drizzle/*.sql
rm -f apps/api/drizzle/meta/*.json
```

Verify the directory is clean (only empty `meta/` dir should remain).

### Step 5: Generate a fresh migration

Run drizzle-kit generate from the API package. This compares the schema definition (`apps/api/src/db/schema.ts`) against the empty migration history and produces a single migration:

```bash
cd apps/api && DATABASE_URL=postgresql://postgres:postgres@localhost:5432/universalcoi pnpm drizzle-kit generate
```

This should create:
- `apps/api/drizzle/0000_<name>.sql` — single migration with all CREATE TABLE statements
- `apps/api/drizzle/meta/0000_snapshot.json` — schema snapshot
- `apps/api/drizzle/meta/_journal.json` — journal with one entry

Verify a single migration file was created.

### Step 6: Apply the migration

```bash
cd apps/api && DATABASE_URL=postgresql://postgres:postgres@localhost:5432/universalcoi pnpm drizzle-kit migrate
```

Verify:
```bash
docker exec universalcoi-postgres-1 psql -U postgres -d universalcoi -c "\dt"
```

All tables should be recreated.

### Step 7: Re-seed the database

```bash
pnpm db:seed
```

### Step 8: Verify

Run a final check:

```bash
docker exec universalcoi-postgres-1 psql -U postgres -d universalcoi -c "SELECT * FROM drizzle.__drizzle_migrations;"
```

Should show exactly one migration entry.

```bash
docker exec universalcoi-postgres-1 psql -U postgres -d universalcoi -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

Should show all expected tables.

### Step 9: Report

Present a summary:

```
Migration compaction complete:

- Previous migrations: [N] files
- Current migrations: 1 file (0000_<name>.sql)
- Tables created: [list]
- Database seeded: yes/no
- Journal entries: 1

All migration history has been consolidated into a single initial migration.
```
