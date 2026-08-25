import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

// By path, not by cwd — `npx prisma migrate deploy` is run from the repository
// root as often as from backend/, and dotenv's default resolution is relative
// to whichever it happens to be. Same reasoning as src/lib/prisma.ts.
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env") });

/**
 * Prisma 7 moved the connection URL out of `schema.prisma`.
 *
 * The datasource block now declares only the provider; the URL lives here for
 * Migrate and Studio, and is supplied separately to the client at runtime
 * through a driver adapter (see src/lib/prisma.ts). That split is the whole
 * point of the change: the schema becomes a description of the data, and
 * nothing in it needs a secret to be readable.
 *
 * `dotenv/config` is imported explicitly because Prisma 7 no longer loads
 * `.env` for you. Without it every script here would need the variable already
 * exported, which is not how any of the 28 scripts in scripts/ are run, nor
 * how CI runs migrate.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // Was the `prisma.seed` key in package.json, which Prisma 7 ignores.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
