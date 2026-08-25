import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Load backend/.env, BY PATH rather than by working directory.
 *
 * Prisma 6 read `.env` as a side effect of importing the client, and located
 * it from the schema — so `npx tsx backend/scripts/foo.ts` worked from the
 * repository root. Prisma 7 does neither, and the obvious replacement,
 * `import "dotenv/config"`, resolves relative to `process.cwd()`. That would
 * have quietly narrowed every one of the 28 scripts in scripts/ to "only works
 * if you cd into backend/ first", with a failure that names DATABASE_URL and
 * not the directory you happened to be standing in.
 *
 * Anchoring to this file's own location keeps both invocations working.
 * Production passes real environment variables and is unaffected either way:
 * dotenv never overwrites one that is already set.
 */
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

/**
 * The one Prisma client for the process.
 *
 * Prisma 7 no longer reads the connection URL from `schema.prisma` — the
 * datasource there declares only the provider, and the client is handed a
 * driver adapter instead. So the URL is read here, at the one place that
 * opens connections, rather than being ambient in a file that is otherwise a
 * description of the data. `prisma.config.ts` supplies the same URL to
 * Migrate and Studio, which run as separate processes.
 *
 * Checked explicitly rather than left to the adapter: an undefined URL
 * otherwise surfaces later as a connection error against `undefined`, at
 * whichever query happens to run first, which is a much longer walk back to
 * "the variable was not set".
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Prisma 7 takes the connection string from the " +
      "application rather than from schema.prisma — see prisma.config.ts for the " +
      "migrate side.",
  );
}

export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
