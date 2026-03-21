#!/usr/bin/env node
/**
 * Lightweight Prisma migrate deploy using @prisma/migrate directly.
 *
 * This does exactly what `npx prisma migrate deploy` does, but without
 * pulling in the full Prisma CLI. It uses the Migrate class which handles
 * all JSON-RPC communication, error handling, and engine lifecycle.
 *
 * Usage:
 *   npx prisma-migrate-lite --schema ./prisma/schema.prisma
 *   npx prisma-migrate-lite --schema ./prisma/schema.prisma --database-url file:./prod.db
 */

import path from 'node:path';
import fs from 'node:fs';
import pkg from '@prisma/migrate';
const { Migrate } = pkg;

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Prisma Migrate Deploy (Lite)

Usage:
  prisma-migrate-lite [options]

Options:
  --schema <path>           Path to the Prisma schema file (required)
  --database-url <url>      Database connection URL
                            (Defaults to DATABASE_URL env var or file:./dev.db)
  --migrations-dir <path>   Path to the migrations directory
                            (Defaults to migrations/ next to the schema file)
  --base-dir <path>         Base project directory for resolving relative paths
                            (Defaults to current working directory)
  --help, -h                Show this help message

Example:
  npx prisma-migrate-lite --schema ./prisma/schema.prisma --database-url file:./prod.db
`);
    process.exit(0);
  }

  const opts = {
    databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
    schemaPathRaw: null,
    migrationsDirRaw: null,
    baseDir: process.cwd(),
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--database-url' && args[i + 1]) {
      opts.databaseUrl = args[++i];
    } else if (args[i] === '--schema' && args[i + 1]) {
      opts.schemaPathRaw = args[++i];
    } else if (args[i] === '--migrations-dir' && args[i + 1]) {
      opts.migrationsDirRaw = args[++i];
    } else if (args[i] === '--base-dir' && args[i + 1]) {
      opts.baseDir = path.resolve(args[++i]);
    }
  }

  // Resolve schema path relative to baseDir
  if (opts.schemaPathRaw) {
    opts.schemaPath = path.resolve(opts.baseDir, opts.schemaPathRaw);
  } else {
    opts.schemaPath = path.resolve(opts.baseDir, 'prisma/schema.prisma');
  }

  // Resolve migrationsDir: explicit > next to schema file
  if (opts.migrationsDirRaw) {
    opts.migrationsDir = path.resolve(opts.baseDir, opts.migrationsDirRaw);
  } else {
    opts.migrationsDir = path.resolve(path.dirname(opts.schemaPath), 'migrations');
  }

  return opts;
}

function buildSchemaContext(schemaPath) {
  const content = fs.readFileSync(schemaPath, 'utf-8');
  return {
    schemaFiles: [[schemaPath, content]],
    schemaRootDir: path.dirname(schemaPath),
    schemaPath: schemaPath,
    loadedFromPathForLogMessages: schemaPath,
    primaryDatasource: undefined,
    datasources: [],
    generators: [],
    warnings: [],
  };
}

async function main() {
  const opts = parseArgs();

  if (!fs.existsSync(opts.schemaPath)) {
    console.error(`Schema file not found: ${opts.schemaPath}`);
    console.error('Use --schema to specify the path to your Prisma schema file.');
    process.exit(1);
  }

  console.log('Prisma Migrate Deploy (Lite)');
  console.log(`  Schema:     ${opts.schemaPath}`);
  console.log(`  Database:   ${opts.databaseUrl}`);
  console.log(`  Migrations: ${opts.migrationsDir}`);
  console.log('');

  const schemaContext = buildSchemaContext(opts.schemaPath);

  const migrate = await Migrate.setup({
    schemaEngineConfig: {
      datasource: { url: opts.databaseUrl },
    },
    schemaContext,
    baseDir: opts.baseDir,
    migrationsDirPath: opts.migrationsDir,
    schemaFilter: { externalTables: [], externalEnums: [] },
  });

  try {
    const { appliedMigrationNames } = await migrate.applyMigrations();

    if (appliedMigrationNames.length === 0) {
      console.log('No pending migrations to apply.');
    } else {
      console.log(`Applied ${appliedMigrationNames.length} migration(s):`);
      for (const name of appliedMigrationNames) {
        console.log(`  └─ ${name}`);
      }
      console.log('');
      console.log('All migrations have been successfully applied.');
    }
  } finally {
    await migrate.stop();
  }
}

main().catch((err) => {
  console.error(`\nMigration failed: ${err.message}`);
  process.exit(1);
});
