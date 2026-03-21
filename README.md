# @clera/prisma-migrate-lite

Lightweight Prisma migrate deploy without the full CLI.

## Usage

```bash
# Apply migrations using defaults (based on your schema file)
npx prisma-migrate-lite

# Specify schema and database URL
npx prisma-migrate-lite --schema ./prisma/schema.prisma --database-url file:./prod.db

# Use a custom working directory for resolving relative paths
npx prisma-migrate-lite --base-dir /app
```

## CLI arguments

| Argument | Default | Description |
|---|---|---|
| `--schema` | `prisma/schema.prisma` (rel to base-dir) | Path to your Prisma schema file (required by the engine) |
| `--database-url` | `$DATABASE_URL` or `file:./dev.db` | Database connection URL |
| `--migrations-dir` | `migrations/` (rel to schema file) | Path to the migrations directory |
| `--base-dir` | Current working directory | Used to resolve relative paths (e.g., SQLite file paths) |

## Help

For a full list of options, run:
```bash
npx prisma-migrate-lite --help
```
