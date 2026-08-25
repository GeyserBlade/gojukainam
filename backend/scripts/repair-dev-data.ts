import { prisma } from "../src/lib/prisma.js";

/**
 * One-off repair of the local development database.
 *
 * WHY IT WAS NEEDED. Three datasets had been layered into one database without
 * either of the earlier two being cleared: an August 1st fixture set (six tiny
 * clubs, no regions), the seeded championships tournament, and an anonymised
 * snapshot of the real federation imported on the 23rd. The result was four
 * club names appearing two or three times and two complete, competing belt
 * ramps — and every one of those collisions is invisible in the UI, where you
 * see one club at a time, while being fatal to anything that resolves a club
 * by name or ranks a member by grade. It is also how a session of agent work
 * came to record "several clubs in this federation share a name" as a fact
 * about production, which it is not.
 *
 * WHAT IT DOES, in order (the order is the dependency graph, not a preference):
 *   1. Re-homes the three real club-manager logins onto their real clubs, so
 *      deleting the fixtures below costs nobody their access.
 *   2. Collapses the two belt ramps into one, MAPPING BY COLOUR rather than by
 *      kyu number — see the table below for why those disagree.
 *   3. Deletes the August 1st fixture clubs and their event.
 *
 * The seeded tournament and the test-script debris are NOT handled here; they
 * own their own cleanup (`seed-championships-tournament.ts --clean`,
 * `clean-test-data.ts`). Run those first.
 *
 * Run: npx tsx scripts/repair-dev-data.ts --dry-run   (report, change nothing)
 *      npx tsx scripts/repair-dev-data.ts
 *
 * Idempotent: a second run finds nothing to do and says so.
 */

const DRY = process.argv.includes("--dry-run");

/**
 * The August 1st fixtures, by id rather than by name.
 *
 * By id specifically because the names are the problem: three of these six are
 * spelled exactly like a real club, so a name-based list here would delete the
 * real federation instead. Ids are the only unambiguous handle in this
 * database, which is the whole lesson of the file.
 */
const FIXTURE_CLUB_IDS = [
  "cmsafi4hr0021hywqhlt8ce1d", // Windhoek Dojo    (3 athletes)
  "cmsafi4hr0022hywqqmphv525", // Walvis Bay Dojo  (2)
  "cmsafi4hr0023hywqp8q22mmo", // Swakop Dojo      (2)
  "cmsafi4hs0024hywqbtveloen", // Khomasdal Dojo   (1)
  "cmsafi4hs0025hywqwo8eb7hc", // Otjiwarongo Dojo (1)
  "cmsafi4hs0026hywqpegj01vf", // Kuisebmund Dojo  (1)
];

/** Where each fixture club's real login belongs. */
const USER_MOVES: Array<{ email: string; toClubId: string; toName: string }> = [
  { email: "neitocs@outlook.com", toClubId: "cmf1jhreh000xx208wm3x62z0", toName: "Windhoek Dojo" },
  { email: "jaydean@jphydraulics.com", toClubId: "cmf1jhrfc000yx208m4e892l9", toName: "Walvis Bay Dojo" },
  // "Swakop Dojo" is the local short form; the real club is spelled in full.
  { email: "sammy@iway.na", toClubId: "cmf1jhrfi0010x2083e0xqzon", toName: "Swakopmund Dojo" },
];

/**
 * The surviving ramp: tens, so a grade can be inserted between two others
 * without renumbering, and real hex colours that BeltBadge already renders.
 */
const CANONICAL = {
  white: "cmsafi4gv0000hywqstbu8gga",  // 10th Kyu — White   order 10
  yellow: "cmsafi4h10001hywqv0hna41e", // 9th Kyu — Yellow   order 20
  orange: "cmsafi4h20002hywqs2a4cc8d", // 8th Kyu — Orange   order 30
  green: "cmsafi4h40003hywq1u63nkeg",  // 7th Kyu — Green    order 40
  blue: "cmsafi4h80007hywq3kra444z",   // 6th Kyu — Blue     order 50
  purple: "cmsafi4h50005hywqu25mmqdk", // 5th Kyu — Purple   order 60
  brown: "cmsafi4h40004hywqa3xgejts",  // 4th Kyu — Brown    order 70
  black: "cmsafi4h70006hywq8qxxwww3",  // 1st Dan — Black    order 80
};

/**
 * Duplicates to fold away, MAPPED BY BELT COLOUR.
 *
 * The two ramps disagree about kyu numbering — the old one calls yellow "8th
 * Kyu", the surviving one calls it "9th Kyu" — so mapping by number would
 * move real people up or down a grade. The colour is the physical belt around
 * the person's waist and the thing that actually ranks them, so it is what the
 * mapping follows. Nobody's rank changes; only its name does.
 */
const MERGE: Array<{ from: string; to: string; note: string }> = [
  { from: "cmfijpxmj0005x2fo0dt9t9um", to: CANONICAL.white, note: "White → 10th Kyu — White" },
  { from: "__BOUT_SCORING_BELT__", to: CANONICAL.white, note: "test belt → 10th Kyu — White" },
  { from: "__SCOPE_TEST_BELT__", to: CANONICAL.white, note: "test belt → 10th Kyu — White" },
  { from: "cmsnjfmq70000hybk9vpfido5", to: CANONICAL.white, note: "Test White (999) → 10th Kyu — White" },
  { from: "cmfijpf640004x2fov5hm86qd", to: CANONICAL.yellow, note: "8th Kyu/Yellow → 9th Kyu — Yellow" },
  { from: "cmfijotzf0003x2fo9cxx9k7o", to: CANONICAL.orange, note: "7th Kyu/Orange → 8th Kyu — Orange" },
  { from: "cmfijo84k0002x2fosblpnqnq", to: CANONICAL.green, note: "6th Kyu/Green → 7th Kyu — Green" },
  { from: "cmfijncc60001x2fo92m27u2h", to: CANONICAL.blue, note: "5th Kyu/Blue → 6th Kyu — Blue" },
  { from: "cmfijlnsj0000x2fo7kza8zcm", to: CANONICAL.purple, note: "4th Kyu/Purple → 5th Kyu — Purple" },
  { from: "cmgwalysw0000x27s23drt2jn", to: CANONICAL.black, note: "Shodan → 1st Dan — Black" },
];

/**
 * Grades the surviving ramp was missing, kept in place and renumbered into it.
 *
 * Renumbering rather than remapping matters: these are real distinct grades
 * held by real people, and folding 1st Kyu into 4th Kyu to avoid adding a row
 * would demote them. The old ramp simply stopped at 1st Kyu and the new one
 * jumped from 4th Kyu to 1st Dan; between them they describe the whole ladder.
 */
const RENUMBER: Array<{ id: string; order: number; name: string; colour: string; was: string }> = [
  { id: "cmfijkpvj0002x24ongopmgw7", order: 72, name: "3rd Kyu — Brown", colour: "#78350f", was: "3rd Kyu (7)" },
  { id: "cmfijkbw70001x24o0rd8otkv", order: 74, name: "2nd Kyu — Brown", colour: "#78350f", was: "2nd Kyu (8)" },
  { id: "cmfijjct60000x24of41wc8vp", order: 76, name: "1st Kyu — Brown", colour: "#78350f", was: "1st Kyu (9)" },
  { id: "cmgwammq30001x27speci52h4", order: 90, name: "2nd Dan — Black", colour: "#0a0a0a", was: "Nidan (11)" },
  { id: "cmgwamvq60002x27stv0mbmdt", order: 100, name: "3rd Dan — Black", colour: "#0a0a0a", was: "Sandan (12)" },
  { id: "cmgwanixy0004x27s20kffybb", order: 120, name: "5th Dan — Black", colour: "#0a0a0a", was: "Godan (14)" },
];

function say(action: string, detail: string) {
  console.log(`${DRY ? "would" : "did "}  ${action.padEnd(22)} ${detail}`);
}

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: DATABASE_URL is not localhost. This script deletes clubs.");
  }
  console.log(DRY ? "\nDRY RUN — nothing will change.\n" : "\nRepairing local dev data.\n");

  // --- 1. Users off the fixture clubs -------------------------------------
  // Tracked so the delete guard below can tell "still attached" from "attached
  // only because this is a dry run" — otherwise a dry run always fails at the
  // guard and never reports what it would delete, which is the one thing it
  // exists to show.
  const movedEmails = new Set<string>();
  for (const move of USER_MOVES) {
    const user = await prisma.user.findUnique({
      where: { email: move.email },
      select: { id: true, clubId: true, club: { select: { name: true } } },
    });
    if (!user) { say("user (absent)", move.email); continue; }
    if (!FIXTURE_CLUB_IDS.includes(user.clubId ?? "")) {
      say("user (already moved)", `${move.email} → ${user.club?.name ?? "(none)"}`);
      continue;
    }
    if (!DRY) await prisma.user.update({ where: { id: user.id }, data: { clubId: move.toClubId } });
    movedEmails.add(move.email);
    say("move user", `${move.email}: ${user.club?.name} → ${move.toName}`);
  }

  // --- 2. One belt ramp ----------------------------------------------------
  for (const r of RENUMBER) {
    const belt = await prisma.belt.findUnique({ where: { id: r.id }, select: { order: true, name: true } });
    if (!belt) { say("belt (absent)", r.was); continue; }
    if (belt.order === r.order) { say("belt (already set)", `${r.name} @ ${r.order}`); continue; }
    if (!DRY) {
      await prisma.belt.update({ where: { id: r.id }, data: { order: r.order, name: r.name, colour: r.colour } });
    }
    say("renumber belt", `${r.was} → ${r.name} @ order ${r.order}`);
  }

  for (const m of MERGE) {
    const belt = await prisma.belt.findUnique({ where: { id: m.from }, select: { id: true } });
    if (!belt) { say("merge (already done)", m.note); continue; }
    const holders = await prisma.athlete.count({ where: { beltId: m.from } });
    if (!DRY) {
      await prisma.athlete.updateMany({ where: { beltId: m.from }, data: { beltId: m.to } });
      await prisma.belt.delete({ where: { id: m.from } });
    }
    say("merge belt", `${m.note} (${holders} athlete${holders === 1 ? "" : "s"})`);
  }

  // --- 3. The August 1st fixtures -----------------------------------------
  const fixtures = await prisma.club.findMany({
    where: { id: { in: FIXTURE_CLUB_IDS } },
    select: { id: true, name: true, _count: { select: { athletes: true, users: true } } },
  });

  if (fixtures.length === 0) {
    say("fixtures", "already removed");
  } else {
    const remaining = await prisma.user.findMany({
      where: { clubId: { in: FIXTURE_CLUB_IDS }, ...(DRY ? { email: { notIn: [...movedEmails] } } : {}) },
      select: { email: true, club: { select: { name: true } } },
    });
    if (remaining.length > 0) {
      throw new Error(
        `Refusing to delete: ${remaining.map((u) => `${u.email} is still on ${u.club?.name}`).join("; ")}. ` +
          "Move them first — a login is the one thing here that cannot be regenerated.",
      );
    }

    const ids = fixtures.map((c) => c.id);
    // Events belonging ONLY to these clubs. An event with a single entry from
    // the real federation is not a fixture and must survive.
    const events = await prisma.event.findMany({
      select: { id: true, name: true, entries: { select: { clubId: true } } },
    });
    const fixtureEvents = events.filter(
      (e) => e.entries.length > 0 && e.entries.every((en) => ids.includes(en.clubId)),
    );
    const eventIds = fixtureEvents.map((e) => e.id);

    for (const c of fixtures) say("delete club", `${c.name} (${c._count.athletes} athletes)  ${c.id}`);
    for (const e of fixtureEvents) say("delete event", `${e.name}  ${e.id}`);

    if (!DRY) {
      // Explicit, in dependency order. Several of these relations are Restrict
      // rather than Cascade (Athlete→Club, Entry→Club, MemberInvoice→Athlete,
      // ApiKey→Club), so a bare club delete fails with a constraint name and
      // no cause — the same P2003 that stopped the championships cleaner.
      await prisma.$transaction(async (tx) => {
        await tx.paymentAllocation.deleteMany({ where: { payment: { clubId: { in: ids } } } });
        await tx.memberInvoiceLine.deleteMany({ where: { invoice: { clubId: { in: ids } } } });
        await tx.memberInvoice.deleteMany({ where: { clubId: { in: ids } } });
        await tx.payment.deleteMany({ where: { clubId: { in: ids } } });
        await tx.invoiceRun.deleteMany({ where: { clubId: { in: ids } } });
        await tx.memberSubscription.deleteMany({ where: { athlete: { clubId: { in: ids } } } });
        await tx.feeSchedule.deleteMany({ where: { clubId: { in: ids } } });
        await tx.clubBillingConfig.deleteMany({ where: { clubId: { in: ids } } });

        await tx.kataPerformance.deleteMany({ where: { entry: { clubId: { in: ids } } } });
        await tx.drawSlot.deleteMany({ where: { entry: { clubId: { in: ids } } } });
        await tx.teamMember.deleteMany({ where: { athlete: { clubId: { in: ids } } } });
        await tx.teamMember.deleteMany({ where: { team: { clubId: { in: ids } } } });
        await tx.entry.deleteMany({ where: { clubId: { in: ids } } });
        await tx.team.deleteMany({ where: { clubId: { in: ids } } });
        await tx.invoice.deleteMany({ where: { clubId: { in: ids } } });
        await tx.document.deleteMany({ where: { clubId: { in: ids } } });
        await tx.athlete.deleteMany({ where: { clubId: { in: ids } } });
        await tx.apiKey.deleteMany({ where: { clubId: { in: ids } } });

        if (eventIds.length > 0) {
          await tx.scheduleBlock.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.bout.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
          await tx.drawSlot.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
          await tx.draw.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.mat.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.weightClass.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.division.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.eventCoordinator.deleteMany({ where: { eventId: { in: eventIds } } });
          await tx.event.deleteMany({ where: { id: { in: eventIds } } });
        }

        await tx.club.deleteMany({ where: { id: { in: ids } } });
      });
    }
  }

  // --- Report --------------------------------------------------------------
  const clubs = await prisma.club.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  const dupes = clubs.filter((c, i) => clubs.findIndex((o) => o.name === c.name) !== i);
  console.log(`\n${clubs.length} clubs, ${await prisma.athlete.count()} athletes, ${await prisma.belt.count()} belts.`);
  console.log(dupes.length === 0 ? "No duplicate club names." : `STILL DUPLICATED: ${dupes.map((d) => d.name).join(", ")}`);
  if (DRY) console.log("\nDry run — nothing changed.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
