/**
 * Post-buzzer bout scoring (the `postTime` audit flag) and the in-progress
 * status ping (`startedAt`), exercised over real HTTP against the local
 * database — mirrors scripts/test-event-scope.ts's style. A separate file
 * rather than folding into that one: this is about bout-scoring semantics
 * and status, not event-coordinator scope leaks, which test-event-scope.ts
 * already covers thoroughly on its own.
 *
 * What this does NOT re-test: whether requireEventManager correctly scopes
 * admin/coordinator access to draw routes in general — that's
 * test-event-scope.ts's job, and setBoutScore/setBoutWinner/startBout use
 * the exact same guard as every other draw route. What's new here is
 * `postTime` and `startedAt` themselves: do they round-trip, do they reset
 * when score detail is invalidated, does postTime show up in the audit log
 * (startedAt deliberately doesn't — see DrawService.startBout), and — the
 * "don't loosen anything" check — can a coordinator (not just an admin) set
 * them, same as they already could set every other score field.
 *
 * Run: ALLOW_DEV_AUTH=true npm run dev          # in one shell
 *      npx tsx scripts/test-bout-scoring.ts     # in another
 */
import { prisma } from "../src/lib/prisma.js";

const BASE = process.env.API_BASE ?? "http://localhost:4000/api";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

const asAdmin = { "x-role": "ADMIN", "content-type": "application/json" };
const asCoordinator = { "x-role": "CLUB_MANAGER", "content-type": "application/json" };

async function call(
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: unknown,
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: DATABASE_URL is not localhost");
  }

  const devUser = await prisma.user.upsert({
    where: { id: "dev-user" },
    update: {},
    create: { id: "dev-user", email: "dev-user@localhost", name: "Dev User", role: "CLUB_MANAGER" },
  });

  const belt = await prisma.belt.upsert({
    where: { id: "__BOUT_SCORING_BELT__" },
    update: {},
    create: { id: "__BOUT_SCORING_BELT__", name: "White", order: 1 },
  });

  const event = await prisma.event.create({
    data: {
      name: "__BOUT_SCORING_TEST_EVENT__",
      venue: "n/a",
      city: "n/a",
      country: "NA",
      startDate: new Date(),
      regOpen: new Date(),
      regClose: new Date(),
      configJson: "{}",
    },
  });

  const clubA = await prisma.club.create({
    data: { name: "__BOUT_SCORING_CLUB_A__", contactName: "n/a", email: "a@example.test" },
  });
  const clubB = await prisma.club.create({
    data: { name: "__BOUT_SCORING_CLUB_B__", contactName: "n/a", email: "b@example.test" },
  });
  const division = await prisma.division.create({
    data: {
      eventId: event.id,
      key: "BOUT_SCORING_DIV",
      name: "Bout Scoring Test Division",
      minAge: 18,
      maxAge: 99,
      gender: "Male",
      category: "KUMITE",
    },
  });
  const athleteA = await prisma.athlete.create({
    data: {
      clubId: clubA.id, firstName: "Fighter", lastName: "A",
      dob: new Date("2000-01-01"), gender: "Male", nationality: "NA", beltId: belt.id,
    },
  });
  const athleteB = await prisma.athlete.create({
    data: {
      clubId: clubB.id, firstName: "Fighter", lastName: "B",
      dob: new Date("2000-01-01"), gender: "Male", nationality: "NA", beltId: belt.id,
    },
  });
  const entryA = await prisma.entry.create({
    data: {
      eventId: event.id, clubId: clubA.id, athleteId: athleteA.id,
      divisionId: division.id, entryType: "KUMITE", status: "APPROVED",
    },
  });
  const entryB = await prisma.entry.create({
    data: {
      eventId: event.id, clubId: clubB.id, athleteId: athleteB.id,
      divisionId: division.id, entryType: "KUMITE", status: "APPROVED",
    },
  });

  try {
    // 2 entries -> a single MAIN round bout (the final), both fighters known
    // immediately — no repechage complexity to route around for these checks.
    const drawRes = await call("POST", "/draws", asAdmin, { eventId: event.id, divisionId: division.id });
    check("draw created -> 201", drawRes.status === 201, drawRes);
    const boutId: string | undefined = drawRes.body?.bouts?.[0]?.id;
    check("bout id resolved from the created draw", !!boutId, drawRes.body);
    if (!boutId) return;
    const drawId: string = drawRes.body.id;

    console.log("\npostTime round-trips through score capture:");
    const scoreTrue = await call("PUT", `/draws/${drawId}/bouts/${boutId}/score`, asAdmin, {
      winnerEntryId: entryA.id,
      outcome: "POINTS",
      akaScore: 3,
      aoScore: 1,
      postTime: true,
    });
    check("score with postTime:true -> 200", scoreTrue.status === 200, scoreTrue);
    const boutAfterTrue = scoreTrue.body?.bouts?.find((b: any) => b.id === boutId);
    check("response reflects postTime:true", boutAfterTrue?.postTime === true, boutAfterTrue);

    const getAfterTrue = await call("GET", `/draws/${drawId}`, asAdmin);
    const fetchedTrue = getAfterTrue.body?.bouts?.find((b: any) => b.id === boutId);
    check("GET after the write still shows postTime:true (not just the response echo)", fetchedTrue?.postTime === true, fetchedTrue);

    console.log("\npostTime defaults to false when omitted:");
    const scoreOmitted = await call("PUT", `/draws/${drawId}/bouts/${boutId}/score`, asAdmin, {
      winnerEntryId: entryA.id,
      outcome: "POINTS",
      akaScore: 5,
      aoScore: 2,
      // postTime omitted entirely
    });
    const boutAfterOmitted = scoreOmitted.body?.bouts?.find((b: any) => b.id === boutId);
    check("omitted postTime persists as false, not left over from the prior write", boutAfterOmitted?.postTime === false, boutAfterOmitted);

    console.log("\naudit trail carries postTime, checked right after each write:");
    const scoreAgainTrue = await call("PUT", `/draws/${drawId}/bouts/${boutId}/score`, asAdmin, {
      winnerEntryId: entryA.id,
      outcome: "POINTS",
      akaScore: 4,
      aoScore: 0,
      postTime: true,
    });
    check("re-scored with postTime:true -> 200", scoreAgainTrue.status === 200, scoreAgainTrue);
    const auditAfterTrue = await prisma.auditLog.findFirst({
      where: { entityType: "Bout", entityId: boutId, action: "SCORE" },
      orderBy: { createdAt: "desc" },
    });
    const diffAfterTrue = auditAfterTrue ? JSON.parse(auditAfterTrue.diffJson ?? "{}") : {};
    check("audit row right after a postTime:true write records postTime:true", diffAfterTrue.postTime === true, diffAfterTrue);

    const scoreAgainFalse = await call("PUT", `/draws/${drawId}/bouts/${boutId}/score`, asAdmin, {
      winnerEntryId: entryA.id,
      outcome: "POINTS",
      akaScore: 3,
      aoScore: 0,
      postTime: false,
    });
    check("re-scored with postTime:false -> 200", scoreAgainFalse.status === 200, scoreAgainFalse);
    const auditAfterFalse = await prisma.auditLog.findFirst({
      where: { entityType: "Bout", entityId: boutId, action: "SCORE" },
      orderBy: { createdAt: "desc" },
    });
    const diffAfterFalse = auditAfterFalse ? JSON.parse(auditAfterFalse.diffJson ?? "{}") : {};
    check(
      "the very next audit row (not the earlier true one) records postTime:false",
      diffAfterFalse.postTime === false && auditAfterFalse!.id !== auditAfterTrue!.id,
      diffAfterFalse,
    );

    console.log("\npostTime resets when score detail is invalidated by a winner-only override:");
    const scoreOnceMoreTrue = await call("PUT", `/draws/${drawId}/bouts/${boutId}/score`, asAdmin, {
      winnerEntryId: entryA.id,
      outcome: "POINTS",
      akaScore: 4,
      aoScore: 0,
      postTime: true,
    });
    check("scored with postTime:true before the override -> 200", scoreOnceMoreTrue.status === 200, scoreOnceMoreTrue);
    const winnerOnly = await call("PUT", `/draws/${drawId}/bouts/${boutId}`, asAdmin, {
      winnerEntryId: entryA.id,
    });
    const boutAfterWinnerOnly = winnerOnly.body?.bouts?.find((b: any) => b.id === boutId);
    check(
      "winner-only override clears postTime along with the rest of the score detail",
      boutAfterWinnerOnly?.postTime === false && boutAfterWinnerOnly?.akaScore === null,
      boutAfterWinnerOnly,
    );

    console.log("\nstartBout: best-effort in-progress ping (startedAt):");
    const beforeStart = await call("GET", `/draws/${drawId}`, asAdmin);
    const boutBeforeStart = beforeStart.body?.bouts?.find((b: any) => b.id === boutId);
    check(
      "no startedAt yet — the winner-only override just cleared it along with score detail",
      boutBeforeStart?.startedAt === null,
      boutBeforeStart,
    );

    const startRes = await call("POST", `/draws/${drawId}/bouts/${boutId}/start`, asAdmin);
    check("start -> 200", startRes.status === 200, startRes);
    const afterStart = await call("GET", `/draws/${drawId}`, asAdmin);
    const boutAfterStart = afterStart.body?.bouts?.find((b: any) => b.id === boutId);
    check("startedAt now set", !!boutAfterStart?.startedAt, boutAfterStart);

    console.log("\nstartBout is idempotent — a second ping doesn't move the timestamp:");
    const firstStartedAt = boutAfterStart.startedAt;
    await new Promise((r) => setTimeout(r, 20));
    const startAgain = await call("POST", `/draws/${drawId}/bouts/${boutId}/start`, asAdmin);
    check("second start -> 200", startAgain.status === 200, startAgain);
    const afterSecondStart = await call("GET", `/draws/${drawId}`, asAdmin);
    const boutAfterSecondStart = afterSecondStart.body?.bouts?.find((b: any) => b.id === boutId);
    check(
      "timestamp unchanged by the second ping, not bumped forward",
      boutAfterSecondStart?.startedAt === firstStartedAt,
      { first: firstStartedAt, second: boutAfterSecondStart?.startedAt },
    );

    console.log("\nclearing a result also clears startedAt (a stale ping shouldn't outlive the matchup it described):");
    const scoreForClearTest = await call("PUT", `/draws/${drawId}/bouts/${boutId}/score`, asAdmin, {
      winnerEntryId: entryA.id,
      outcome: "POINTS",
      akaScore: 2,
      aoScore: 1,
    });
    check("scored (bout now has both a result and a startedAt) -> 200", scoreForClearTest.status === 200, scoreForClearTest);
    const clearRes = await call("PUT", `/draws/${drawId}/bouts/${boutId}`, asAdmin, { winnerEntryId: null });
    const boutAfterClear = clearRes.body?.bouts?.find((b: any) => b.id === boutId);
    check(
      "startedAt cleared alongside the rest of the score detail",
      boutAfterClear?.startedAt === null,
      boutAfterClear,
    );

    console.log("\ncoordinator (not just admin) can set postTime — permission unchanged:");
    await prisma.eventCoordinator.upsert({
      where: { eventId_userId: { eventId: event.id, userId: devUser.id } },
      update: {},
      create: { eventId: event.id, userId: devUser.id },
    });
    const asCoord = await call("PUT", `/draws/${drawId}/bouts/${boutId}/score`, asCoordinator, {
      winnerEntryId: entryB.id,
      outcome: "POINTS",
      akaScore: 1,
      aoScore: 6,
      postTime: true,
    });
    check("coordinator score with postTime:true -> 200", asCoord.status === 200, asCoord);
    const boutAfterCoord = asCoord.body?.bouts?.find((b: any) => b.id === boutId);
    check("coordinator's postTime:true persisted, same as admin's", boutAfterCoord?.postTime === true, boutAfterCoord);

    const startAsCoord = await call("POST", `/draws/${drawId}/bouts/${boutId}/start`, asCoordinator);
    check("coordinator can also ping start — same guard as the score routes", startAsCoord.status === 200, startAsCoord);

    console.log("\nnon-coordinator, non-admin still refused (unchanged from before postTime existed):");
    await prisma.eventCoordinator.deleteMany({ where: { eventId: event.id, userId: devUser.id } });
    const asPlainClub = await call("PUT", `/draws/${drawId}/bouts/${boutId}/score`, asCoordinator, {
      winnerEntryId: entryA.id,
      outcome: "POINTS",
      akaScore: 2,
      aoScore: 0,
      postTime: true,
    });
    check("plain club manager (grant revoked) -> 403", asPlainClub.status === 403, asPlainClub);

    const startAsPlainClub = await call("POST", `/draws/${drawId}/bouts/${boutId}/start`, asCoordinator);
    check("plain club manager (grant revoked) -> 403 on start too", startAsPlainClub.status === 403, startAsPlainClub);
  } finally {
    await prisma.entry.deleteMany({ where: { id: { in: [entryA.id, entryB.id] } } });
    await prisma.athlete.deleteMany({ where: { id: { in: [athleteA.id, athleteB.id] } } });
    await prisma.club.deleteMany({ where: { id: { in: [clubA.id, clubB.id] } } });
    await prisma.eventCoordinator.deleteMany({ where: { eventId: event.id } });
    await prisma.division.deleteMany({ where: { eventId: event.id } });
    await prisma.event.deleteMany({ where: { id: event.id } });
    await prisma.$disconnect();
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
