import { PrismaClient } from "@prisma/client";
import { generateApiKey, AGENT_SCOPES } from "../src/utils/agent-auth.js";

const prisma = new PrismaClient();

/**
 * Which database are we actually talking to? Without this the "no such club"
 * error is unactionable: the commonest cause by far is running against the
 * local .env database while holding an id copied from production.
 * Never prints the password.
 */
function describeTarget(): string {
  const url = process.env.DATABASE_URL;
  if (!url) return "(DATABASE_URL unset)";
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

/**
 * Mint a service-account API key.
 *
 * Rotation is issue-then-revoke, with no shared-secret edit window:
 *   1. run this again to mint key 2
 *   2. put it in sensai's GOJUKAINAM_AGENT_KEY and restart tools-api
 *   3. revoke key 1:  tsx scripts/create-agent-key.ts --revoke <prefix>
 */
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--list") {
    const keys = await prisma.apiKey.findMany({
      select: {
        prefix: true, name: true, clubId: true, scopes: true,
        lastUsedAt: true, expiresAt: true, revokedAt: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    if (keys.length === 0) console.log("No API keys.");
    for (const k of keys) {
      const state = k.revokedAt
        ? "REVOKED"
        : k.expiresAt && k.expiresAt <= new Date()
          ? "EXPIRED"
          : "active";
      console.log(
        `${k.prefix}  ${state.padEnd(8)}  ${k.name}\n` +
          `          club=${k.clubId ?? "(federation-wide)"}  scopes=${k.scopes.join(",")}\n` +
          `          created=${k.createdAt.toISOString().slice(0, 10)}  ` +
          `lastUsed=${k.lastUsedAt?.toISOString().slice(0, 16) ?? "never"}`,
      );
    }
    return;
  }

  if (args[0] === "--revoke") {
    const prefix = args[1];
    if (!prefix) {
      console.error("Usage: tsx scripts/create-agent-key.ts --revoke <prefix>");
      process.exit(1);
    }
    const existing = await prisma.apiKey.findUnique({ where: { prefix } });
    if (!existing) {
      console.error(`No key with prefix ${prefix}`);
      process.exit(1);
    }
    if (existing.revokedAt) {
      console.log(`Key ${prefix} was already revoked at ${existing.revokedAt.toISOString()}`);
      return;
    }
    await prisma.apiKey.update({ where: { prefix }, data: { revokedAt: new Date() } });
    console.log(`Revoked ${prefix} (${existing.name}). It stops working immediately.`);
    return;
  }

  const name = args[0];
  const clubId = args[1];
  const scopes = args[2]?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  if (!name || !clubId || scopes.length === 0) {
    console.error(
      "Usage:\n" +
        "  tsx scripts/create-agent-key.ts <name> <clubId> <scope,scope,...>\n" +
        "  tsx scripts/create-agent-key.ts --list\n" +
        "  tsx scripts/create-agent-key.ts --revoke <prefix>\n\n" +
        `Known scopes: ${AGENT_SCOPES.join(", ")}\n\n` +
        'Example:\n  tsx scripts/create-agent-key.ts sensai-tools-api clx123 "members:read,billing:read"',
    );
    process.exit(1);
  }

  const unknown = scopes.filter((s) => !(AGENT_SCOPES as readonly string[]).includes(s));
  if (unknown.length > 0) {
    console.error(`Unknown scope(s): ${unknown.join(", ")}`);
    console.error(`Known scopes: ${AGENT_SCOPES.join(", ")}`);
    process.exit(1);
  }

  // A key scoped to a club that does not exist would authenticate and then be
  // rejected by every club check — confusing to debug. Fail here instead.
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { name: true } });
  if (!club) {
    const total = await prisma.club.count();
    const sample = await prisma.club.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 5,
    });
    console.error(`\nNo club with id ${clubId} in ${describeTarget()}\n`);
    console.error(`That database has ${total} club(s):`);
    for (const c of sample) console.error(`  ${c.id}  ${c.name}`);
    if (total > sample.length) console.error(`  … and ${total - sample.length} more`);
    console.error(
      "\nIf you expected production, this script reads DATABASE_URL from " +
        "backend/.env,\nwhich normally points at your local database. Override it " +
        "for one command:\n" +
        '  DATABASE_URL="$DBURL" npx tsx scripts/create-agent-key.ts …\n',
    );
    process.exit(1);
  }

  const { key, prefix, hashedKey } = generateApiKey();
  await prisma.apiKey.create({ data: { name, prefix, hashedKey, clubId, scopes } });

  console.log(`\nKey created for ${club.name} in ${describeTarget()}\n`);
  console.log(`  name    ${name}`);
  console.log(`  prefix  ${prefix}`);
  console.log(`  club    ${clubId} (${club.name})`);
  console.log(`  scopes  ${scopes.join(", ")}`);
  console.log(`\n  ${key}\n`);
  console.log("This is the only time the key is shown — only its sha256 is stored.");
  console.log("Put it in sensai's .env as GOJUKAINAM_AGENT_KEY. It belongs to");
  console.log("tools-api alone; no agent, channel or browser should ever hold it.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
