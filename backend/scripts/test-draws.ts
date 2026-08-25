/**
 * Dev exercise for the draw engine against the local database.
 * Run: npx tsx scripts/test-draws.ts
 * Creates a demo event with 7 kumite entries, generates a draw, captures
 * results through to the podium, then verifies sync/regenerate behaviour.
 */
import { prisma } from "../src/lib/prisma.js";
import {
  DrawService,
  bracketPositions,
  denseSeedRanks,
  seededOrder,
} from "../src/services/draw.service.js";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

/** Bracket size for n entries, mirroring the service's private helper. */
const sizeFor = (n: number) => { let s = 2; while (s < n) s *= 2; return s; };

/** n entries, where seeds[i] (if given) is entry i's seed. */
const mkEntries = (n: number, seeds: (number | null)[] = []) =>
  Array.from({ length: n }, (_, i) => ({ id: `e${i}`, seed: seeds[i] ?? null }));

/** n entries with clubs: clubs[i] is entry i's club, seeds[i] its seed. */
const mkClubEntries = (clubs: string[], seeds: (number | null)[] = []) =>
  clubs.map((clubId, i) => ({ id: `e${i}`, seed: seeds[i] ?? null, clubId }));

/** `count` entries all from club `clubId`. */
const fromClub = (count: number, clubId: string) => Array.from({ length: count }, () => clubId);

/** Bracket position that the entry holding `rank` ended up in. */
const posOfRank = (order: { rank: number | null }[], size: number, rank: number) =>
  bracketPositions(size)[order.findIndex((o) => o.rank === rank)];

/** First round in which two bracket positions can face each other. */
const meetRound = (p1: number, p2: number, size: number) => {
  for (let r = 1; r <= Math.log2(size); r++) {
    if (Math.floor((p1 - 1) / 2 ** r) === Math.floor((p2 - 1) / 2 ** r)) return r;
  }
  return Infinity;
};

function runSeedingChecks() {
  // The headline requirement: seeds 1 and 2 can only ever meet in the final.
  let worstMeeting = Infinity;
  let seed1v2Ok = true;
  for (let n = 2; n <= 17; n++) {
    const size = sizeFor(n);
    const seeds = Array.from({ length: Math.min(4, n) }, (_, i) => i + 1);
    for (let iter = 0; iter < 200; iter++) {
      const order = seededOrder(mkEntries(n, seeds));
      const r = meetRound(posOfRank(order, size, 1), posOfRank(order, size, 2), size);
      if (r !== Math.log2(size)) { seed1v2Ok = false; worstMeeting = Math.min(worstMeeting, r); }
    }
  }
  check("seeds 1 and 2 can only meet in the final (n=2..17)", seed1v2Ok, { worstMeeting });

  // Seeds 1 and 2 are in different halves, and a repechage chain only ever
  // holds athletes beaten by that half's finalist, so they can't meet there.
  let halvesOk = true;
  for (let iter = 0; iter < 200; iter++) {
    const order = seededOrder(mkEntries(16, [1, 2, 3, 4, 5, 6, 7, 8]));
    const half = (p: number) => Math.floor((p - 1) / 8);
    if (half(posOfRank(order, 16, 1)) === half(posOfRank(order, 16, 2))) halvesOk = false;
  }
  check("seeds 1 and 2 always land in opposite halves (so never in one repechage chain)", halvesOk);

  let seed3Ok = true;
  for (let n = 3; n <= 17; n++) {
    const size = sizeFor(n);
    for (let iter = 0; iter < 100; iter++) {
      const order = seededOrder(mkEntries(n, [1, 2, 3]));
      const r = meetRound(posOfRank(order, size, 1), posOfRank(order, size, 3), size);
      if (r < Math.log2(size) - 1) seed3Ok = false;
    }
  }
  check("seed 3 cannot meet seed 1 before the semi-final", seed3Ok);

  // Clamping: tier [3,4] must not reach for k=3 when only 3 entries exist.
  let clampOk = true;
  for (let iter = 0; iter < 100; iter++) {
    const order = seededOrder(mkEntries(3, [1, 2, 3]));
    const occupied = new Set(order.map((_, k) => bracketPositions(4)[k]));
    if (order.length !== 3) clampOk = false;
    if (order.findIndex((o) => o.rank === 3) !== 2) clampOk = false; // sole candidate
    if ([...occupied].sort().join() !== "1,3,4") clampOk = false;
  }
  check("n=3 with 3 seeds: clamps to k=2, leaves position 2 empty (seed 1 gets the bye)", clampOk);

  // Tier randomisation must actually be live, not silently pinned to lo-1.
  const seed3Slots = new Set<number>();
  for (let iter = 0; iter < 200; iter++) {
    seed3Slots.add(seededOrder(mkEntries(4, [1, 2, 3])).findIndex((o) => o.rank === 3));
  }
  check("n=4 with 3 seeds: seed 3 randomised across k=2 and k=3", seed3Slots.size === 2, [...seed3Slots]);

  // Tier 5-8 stays inside its own index range, and moves around within it.
  const tierIdx = new Set<number>();
  let confined = true;
  for (let iter = 0; iter < 300; iter++) {
    const order = seededOrder(mkEntries(16, [1, 2, 3, 4, 5, 6, 7, 8]));
    for (let rank = 5; rank <= 8; rank++) {
      const k = order.findIndex((o) => o.rank === rank);
      tierIdx.add(k);
      if (k < 4 || k > 7) confined = false;
    }
  }
  check("tier 5-8 confined to k=4..7", confined && tierIdx.size === 4, [...tierIdx].sort());

  // Totality: never a hole, never a duplicate, ranks always exactly 1..N.
  let totalOk = true;
  for (let iter = 0; iter < 300; iter++) {
    const n = 2 + Math.floor(Math.random() * 19);
    const count = Math.floor(Math.random() * (n + 1));
    const seeds = Array.from({ length: count }, (_, i) => i + 1);
    const order = seededOrder(mkEntries(n, seeds));
    const ranks = order.map((o) => o.rank).filter((r): r is number => r !== null).sort((a, b) => a - b);
    if (order.length !== n) totalOk = false;
    if (order.some((o) => o === undefined || !o.id)) totalOk = false;
    if (new Set(order.map((o) => o.id)).size !== n) totalOk = false;
    if (ranks.join() !== Array.from({ length: count }, (_, i) => i + 1).join()) totalOk = false;
  }
  check("totality: no holes, no duplicate ids, ranks exactly 1..N", totalOk);

  // With nothing seeded the draw must stay a plain uniform shuffle.
  const seenAt = new Map<string, Set<number>>();
  for (let iter = 0; iter < 200; iter++) {
    seededOrder(mkEntries(8)).forEach((o, k) => {
      if (!seenAt.has(o.id)) seenAt.set(o.id, new Set());
      seenAt.get(o.id)!.add(k);
    });
  }
  check("unseeded field stays uniformly random", [...seenAt.values()].every((s) => s.size > 1));

  const dup = denseSeedRanks([
    { id: "a", seed: 1 }, { id: "b", seed: 2 }, { id: "c", seed: 2 },
  ]);
  check("duplicate seeds tolerated, broken deterministically by id",
    dup.get("a") === 1 && dup.get("b") === 2 && dup.get("c") === 3, [...dup]);

  const gappy = denseSeedRanks([
    { id: "a", seed: 1 }, { id: "b", seed: 5 }, { id: "c", seed: 9 },
  ]);
  check("gappy seeds compact to dense ranks 1..3",
    gappy.get("a") === 1 && gappy.get("b") === 2 && gappy.get("c") === 3, [...gappy]);

  // Byes are the unused tail indices; the seed map puts them on the top seeds.
  let byesOk = true;
  for (const n of [5, 6, 7]) {
    for (let iter = 0; iter < 100; iter++) {
      const order = seededOrder(mkEntries(n, [1, 2, 3]));
      const occupied = new Set(order.map((_, k) => bracketPositions(8)[k]));
      const seed1Pos = posOfRank(order, 8, 1);
      const partner = seed1Pos % 2 === 1 ? seed1Pos + 1 : seed1Pos - 1;
      if (occupied.has(partner)) byesOk = false; // seed 1 must have the bye
    }
  }
  check("byes land on the top seeds (n=5,6,7 in a size-8 bracket)", byesOk);

  // --- club separation ---------------------------------------------------
  // The complaint this answers: two athletes from one club travel to a
  // championship and knock each other out in round 1, before either has
  // fought anybody else.

  /** How many pairs of club-mates are drawn against each other in round 1. */
  const round1ClubClashes = (clubs: string[], seeds: (number | null)[] = []) => {
    const size = sizeFor(clubs.length);
    const order = seededOrder(mkClubEntries(clubs, seeds));
    const posById = new Map(order.map((o, k) => [o.id, bracketPositions(size)[k]]));
    let clashes = 0;
    for (let i = 0; i < clubs.length; i++)
      for (let j = i + 1; j < clubs.length; j++)
        if (clubs[i] === clubs[j] && meetRound(posById.get(`e${i}`)!, posById.get(`e${j}`)!, size) === 1)
          clashes++;
    return clashes;
  };

  const worstOver = (iters: number, clubs: string[], seeds: (number | null)[] = []) => {
    let worst = 0;
    for (let iter = 0; iter < iters; iter++)
      worst = Math.max(worst, round1ClubClashes(clubs, seeds));
    return worst;
  };

  // Every one of these fields can be drawn with no club clash at all, so
  // "usually avoids it" is not good enough — the worst run must be zero.
  const separable: [string, string[]][] = [
    ["8 athletes, 2 clubs of 4", [...fromClub(4, "A"), ...fromClub(4, "B")]],
    ["12 athletes, 3 clubs of 4", [...fromClub(4, "A"), ...fromClub(4, "B"), ...fromClub(4, "C")]],
    ["16 athletes, 2 clubs of 8", [...fromClub(8, "A"), ...fromClub(8, "B")]],
    ["5 athletes, clubs A,A,B,B,C", ["A", "A", "B", "B", "C"]],
    ["32 athletes over 8 clubs", Array.from({ length: 32 }, (_, i) => `C${i % 8}`)],
  ];
  for (const [label, clubs] of separable)
    check(`no round-1 club clash where one is avoidable — ${label}`, worstOver(60, clubs) === 0);

  // Seeding outranks club separation: seeds keep their protected slots and the
  // unseeded field is arranged around them.
  const seededClubs = [...fromClub(4, "A"), ...fromClub(4, "B"), ...fromClub(4, "C"), ...fromClub(4, "D")];
  const oneSeedPerClub = seededClubs.map((_, i) => (i % 4 === 0 ? i / 4 + 1 : null));
  check(
    "club separation still holds with seeds 1-4 placed",
    worstOver(60, seededClubs, oneSeedPerClub) === 0
  );
  let seedsStillProtected = true;
  for (let iter = 0; iter < 60; iter++) {
    const order = seededOrder(mkClubEntries(seededClubs, oneSeedPerClub));
    if (meetRound(posOfRank(order, 16, 1), posOfRank(order, 16, 2), 16) !== 4)
      seedsStillProtected = false;
  }
  check("seeds 1 and 2 still only meet in the final once clubs are considered", seedsStillProtected);

  // When separation is impossible the draw must still come out, at the best
  // achievable count rather than erroring or looping.
  check(
    "a club too big to split settles at the unavoidable minimum (A x5, B x2)",
    worstOver(60, [...fromClub(5, "A"), ...fromClub(2, "B")]) === 1
  );
  check(
    "a single-club category still draws (6 of one club in a size-8 bracket)",
    worstOver(60, fromClub(6, "A")) === 2
  );

  // Separating clubs must not quietly turn the draw into a fixed arrangement:
  // among equally club-clean brackets, which one comes out is still luck.
  const clubPositions = new Map<string, Set<number>>();
  const round1Opponents = new Set<string>();
  const pairClubs = ["A", "A", "B", "B", "C", "C", "D", "D"];
  for (let iter = 0; iter < 200; iter++) {
    const order = seededOrder(mkClubEntries(pairClubs));
    const positions = order.map((o, k) => bracketPositions(8)[k]);
    order.forEach((o, k) => {
      if (!clubPositions.has(o.id)) clubPositions.set(o.id, new Set());
      clubPositions.get(o.id)!.add(positions[k]);
    });
    const byPos = new Map(order.map((o, k) => [positions[k], o.id]));
    const p = positions[order.findIndex((o) => o.id === "e0")];
    round1Opponents.add(byPos.get(p % 2 === 1 ? p + 1 : p - 1)!);
  }
  check(
    "club-separated draws stay random: every athlete still reaches every position",
    [...clubPositions.values()].every((s) => s.size === 8),
    [...clubPositions].map(([id, s]) => `${id}:${s.size}`)
  );
  check(
    "and still draws every legal opponent (all 6 non-club-mates)",
    round1Opponents.size === 6 && !round1Opponents.has("e1"),
    [...round1Opponents].sort()
  );

  // Callers that pass no clubs at all (the pure seeding tests above, and any
  // future caller selecting only id+seed) must behave exactly as before.
  let clublessOk = true;
  for (let iter = 0; iter < 100; iter++) {
    const order = seededOrder(mkEntries(8, [1, 2]));
    if (new Set(order.map((o) => o.id)).size !== 8) clublessOk = false;
  }
  check("entries without a club fall back to a plain shuffle", clublessOk);
}

async function main() {
  console.log("— bracketPositions sanity —");
  const p8 = bracketPositions(8);
  check("size 8 covers all positions", [...p8].sort((a, b) => a - b).join() === "1,2,3,4,5,6,7,8", p8);
  const firstFive = p8.slice(0, 5); // with 5 entries, byes must spread across quarters
  const quarters = new Set(firstFive.map((pos) => Math.ceil(pos / 2)));
  check("5 entries spread over all 4 pairs", quarters.size >= 4, { firstFive });

  console.log("— seededOrder (pure) —");
  runSeedingChecks();

  console.log("— seeding demo data —");
  // Clear the previous run first. This script deliberately keeps its demo event
  // afterwards so there is something to click around in, but it used to keep
  // *every* run's: sixteen identical events, forty-eight clubs and sixteen
  // belts had piled up before anyone noticed. One is useful; sixteen is debris.
  await resetPriorRun();
  // Find-or-create, never create-blindly: a fresh belt per run left sixteen
  // "Test White" rows in the belt list, and the tournament seeds pick a belt at
  // random from every belt that exists — so most of their athletes ended up
  // graded "Test White".
  const belt =
    (await prisma.belt.findFirst({ where: { name: "Test White" } })) ??
    (await prisma.belt.create({ data: { name: "Test White", colour: "#fff", order: 999 } }));
  const clubs = await Promise.all(
    ["OTJ Test", "WVB Test", "KHD Test"].map((name) =>
      prisma.club.create({ data: { name, contactName: "T", email: `${name.replace(/\s/g, "")}@test.local` } })
    )
  );
  const user = await prisma.user.create({
    data: { email: `draw-tester-${Date.now()}@test.local`, role: "SUPERADMIN", name: "Draw Tester" },
  });
  const event = await prisma.event.create({
    data: {
      name: "Draw Engine Demo Event",
      venue: "Test Dojo", city: "Windhoek", country: "Namibia",
      startDate: new Date("2026-08-01"), regOpen: new Date("2026-07-01"), regClose: new Date("2026-07-25"),
      status: "CLOSED", configJson: "{}",
    },
  });
  const division = await prisma.division.create({
    data: { eventId: event.id, key: "F04", name: "F04 - Girls 10", minAge: 10, maxAge: 10, gender: "Female", category: "KUMITE" },
  });
  const names = ["Alushe Fotolela", "Isabella Platt", "Lily-Ann Theron", "Ester Hamases", "Lerato Kashikuka", "Kenzy Cloete", "Emmelize Viljoen"];
  const entries: string[] = [];
  for (let i = 0; i < names.length; i++) {
    const [firstName, lastName] = [names[i].split(" ")[0], names[i].split(" ").slice(1).join(" ")];
    const athlete = await prisma.athlete.create({
      data: {
        clubId: clubs[i % clubs.length].id, firstName, lastName,
        dob: new Date("2016-03-15"), gender: "Female", nationality: "Namibian", beltId: belt.id,
      },
    });
    const entry = await prisma.entry.create({
      data: {
        eventId: event.id, clubId: athlete.clubId, athleteId: athlete.id,
        entryType: "KUMITE", divisionId: division.id, status: "APPROVED",
      },
    });
    entries.push(entry.id);
  }

  console.log("— generate draw (7 entries -> size 8) —");
  let draw = await DrawService.create({ eventId: event.id, divisionId: division.id }, user);
  check("size is 8", draw.size === 8, draw.size);
  check("7 slots", draw.slots.length === 7);
  const mainBouts = draw.bouts.filter((b) => b.phase === "MAIN");
  check("7 main bouts", mainBouts.length === 7, mainBouts.length);
  const byeBouts = mainBouts.filter((b) => b.round === 1 && (!b.aka || !b.ao));
  check("exactly 1 bye in round 1", byeBouts.length === 1);
  check("bye auto-advanced", byeBouts.every((b) => b.winnerEntryId !== null));
  check("status DRAWN", draw.status === "DRAWN", draw.status);

  console.log("— capture results (aka always wins) —");
  for (let guard = 0; guard < 20; guard++) {
    const open = draw.bouts.find((b) => b.aka && b.ao && !b.isUserResult && b.id);
    if (!open) break;
    draw = await DrawService.setBoutWinner(draw.id, open.id!, open.aka!.entryId, user);
  }
  check("status COMPLETED", draw.status === "COMPLETED", draw.status);
  check("has champion", !!draw.placements.first, draw.placements);
  check("has runner-up", !!draw.placements.second);
  check("1-2 bronze medals", draw.placements.thirds.length >= 1 && draw.placements.thirds.length <= 2, draw.placements.thirds.length);
  const repBouts = draw.bouts.filter((b) => b.phase === "REPECHAGE");
  console.log(`  info: ${repBouts.length} repechage bout(s), ${draw.placements.thirds.length} bronze(s)`);
  const placedIds = [draw.placements.first!.entryId, draw.placements.second!.entryId, ...draw.placements.thirds.map((t) => t!.entryId)];
  check("no duplicate placements", new Set(placedIds).size === placedIds.length, placedIds);

  console.log("— correct an earlier result —");
  const final = draw.bouts.find((b) => b.phase === "MAIN" && b.round === 3)!;
  draw = await DrawService.setBoutWinner(draw.id, final.id!, null, user);
  check("clearing final reverts status", draw.status === "IN_PROGRESS", draw.status);
  check("champion cleared", draw.placements.first === null);
  const final2 = draw.bouts.find((b) => b.phase === "MAIN" && b.round === 3)!;
  draw = await DrawService.setBoutWinner(draw.id, final2.id!, final2.ao!.entryId, user);
  check("re-captured final (other winner) completes again", draw.status === "COMPLETED", draw.status);

  console.log("— entry change -> out of sync -> regenerate —");
  const lateAthlete = await prisma.athlete.create({
    data: { clubId: clubs[0].id, firstName: "Sophie", lastName: "Simushi", dob: new Date("2016-06-01"), gender: "Female", nationality: "Namibian", beltId: belt.id },
  });
  await prisma.entry.create({
    data: { eventId: event.id, clubId: clubs[0].id, athleteId: lateAthlete.id, entryType: "KUMITE", divisionId: division.id, status: "APPROVED" },
  });
  draw = await DrawService.get(draw.id);
  check("draw flagged out of sync", !draw.sync.inSync);
  check("one added entry reported", draw.sync.added.length === 1, draw.sync.added);

  let blocked = false;
  try {
    await DrawService.regenerate(draw.id, false, user);
  } catch (e: any) {
    blocked = e?.status === 409;
  }
  check("regenerate without force blocked when results exist", blocked);

  const regenerated = await DrawService.regenerate(draw.id, true, user);
  check("regenerated has 8 slots", regenerated.slots.length === 8, regenerated.slots.length);
  check("regenerated back to DRAWN", regenerated.status === "DRAWN");
  check("regenerated round 1 fully paired (no byes)", regenerated.bouts.filter((b) => b.phase === "MAIN" && b.round === 1).every((b) => b.aka && b.ao));

  console.log("— WKF scoring (setBoutScore) —");
  // fresh 8-slot bracket: score round-1 bout 0 with full detail
  let scored = regenerated;
  const r1b0 = scored.bouts.find((b) => b.phase === "MAIN" && b.round === 1 && b.position === 0)!;
  const scoreDetail = JSON.stringify({
    aka: { yuko: 1, wazaari: 2, ippon: 0, penalty: 1, senshu: true },
    ao: { yuko: 3, wazaari: 0, ippon: 0, penalty: 0, senshu: false },
    durationMs: 120000, winByGap: 8, log: [],
  });
  scored = await DrawService.setBoutScore(
    scored.id,
    r1b0.id!,
    { winnerEntryId: r1b0.aka!.entryId, outcome: "POINTS", akaScore: 5, aoScore: 3, scoreJson: scoreDetail },
    user
  );
  let b = scored.bouts.find((x) => x.phase === "MAIN" && x.round === 1 && x.position === 0)!;
  check("scored bout persists points", b.akaScore === 5 && b.aoScore === 3, b);
  check("scored bout persists outcome", b.outcome === "POINTS", b.outcome);
  check("scored bout persists detail json", b.scoreJson === scoreDetail);
  check("scored winner cascades to round 2", scored.bouts.some((x) => x.phase === "MAIN" && x.round === 2 && (x.aka?.entryId === r1b0.aka!.entryId || x.ao?.entryId === r1b0.aka!.entryId)));

  // winner must be a fighter of the bout
  let rejected = false;
  try {
    await DrawService.setBoutScore(scored.id, b.id!, { winnerEntryId: "not-a-fighter", outcome: "POINTS", akaScore: 1, aoScore: 0 }, user);
  } catch (e: any) { rejected = e?.status === 422; }
  check("score with foreign winner rejected", rejected);

  // winner-only capture on another bout leaves score fields empty
  const r1b1 = scored.bouts.find((x) => x.phase === "MAIN" && x.round === 1 && x.position === 1)!;
  scored = await DrawService.setBoutWinner(scored.id, r1b1.id!, r1b1.ao!.entryId, user);
  b = scored.bouts.find((x) => x.phase === "MAIN" && x.round === 1 && x.position === 1)!;
  check("winner-only bout has no score fields", b.akaScore === null && b.outcome === null, b);

  // overwriting a scored bout via winner-only clears the stale score detail
  scored = await DrawService.setBoutWinner(scored.id, r1b0.id!, r1b0.ao!.entryId, user);
  b = scored.bouts.find((x) => x.phase === "MAIN" && x.round === 1 && x.position === 0)!;
  check("winner-only overwrite clears score detail", b.akaScore === null && b.scoreJson === null, b);

  // score round 2, then correct round 1 -> downstream score must be wiped
  scored = await DrawService.setBoutScore(
    scored.id, r1b0.id!,
    { winnerEntryId: r1b0.aka!.entryId, outcome: "GAP", akaScore: 8, aoScore: 0 },
    user
  );
  const r2b0 = scored.bouts.find((x) => x.phase === "MAIN" && x.round === 2 && x.position === 0)!;
  scored = await DrawService.setBoutScore(
    scored.id, r2b0.id!,
    { winnerEntryId: r1b0.aka!.entryId, outcome: "SENSHU", akaScore: 4, aoScore: 4 },
    user
  );
  b = scored.bouts.find((x) => x.phase === "MAIN" && x.round === 2 && x.position === 0)!;
  check("round-2 scored (senshu tie)", b.akaScore === 4 && b.aoScore === 4 && b.outcome === "SENSHU", b);
  scored = await DrawService.setBoutWinner(scored.id, r1b0.id!, r1b0.ao!.entryId, user); // upstream correction
  b = scored.bouts.find((x) => x.phase === "MAIN" && x.round === 2 && x.position === 0)!;
  check("upstream correction wipes downstream score", b.akaScore === null && b.outcome === null && b.winnerEntryId === null, b);

  console.log("— lock / unlock —");
  const locked = await DrawService.setLock(scored.id, true, user);
  check("draw reports locked", locked.locked === true, locked.locked);
  let regenBlocked = false;
  try { await DrawService.regenerate(scored.id, true, user); } catch (e: any) { regenBlocked = e?.status === 409; }
  check("regenerate blocked while locked", regenBlocked);
  let delBlocked = false;
  try { await DrawService.delete(scored.id, user); } catch (e: any) { delBlocked = e?.status === 409; }
  check("delete blocked while locked", delBlocked);
  const unlocked = await DrawService.setLock(scored.id, false, user);
  check("draw reports unlocked", unlocked.locked === false, unlocked.locked);
  const afterUnlock = await DrawService.regenerate(scored.id, true, user);
  check("regenerate works after unlock", afterUnlock.slots.length === 8, afterUnlock.slots.length);

  console.log("— category list —");
  const list = await DrawService.list(event.id);
  const row = list.find((r) => r.divisionId === division.id);
  check("list shows category with 8 entries", row?.entryCount === 8, row);
  check("list shows draw in sync", row?.draw?.inSync === true, row?.draw);
  check("list draw not locked", row?.draw?.locked === false, row?.draw);

  console.log("— seeding against the database —");
  const category = { eventId: event.id, divisionId: division.id, weightClassId: null };
  const field = await DrawService.listCategorySeeds(category);
  check("seed panel lists all 8 entries", field.entries.length === 8, field.entries.length);
  check("seed panel starts unseeded", field.entries.every((e) => e.seed === null));

  const [s1, s2, s3] = field.entries;
  await DrawService.setCategorySeeds(
    category,
    [{ entryId: s1.entryId, seed: 1 }, { entryId: s2.entryId, seed: 2 }, { entryId: s3.entryId, seed: 3 }],
    user
  );
  let seeded = await DrawService.regenerate(afterUnlock.id, true, user);
  const ranked = seeded.slots.filter((s) => s.seed !== null).sort((a, b) => a.seed! - b.seed!);
  check("drawn slots carry dense ranks 1,2,3", ranked.map((s) => s.seed).join() === "1,2,3", ranked.map((s) => s.seed));
  check("rank 1 is the entry we seeded 1", ranked[0].entry.entryId === s1.entryId);
  check("freshly seeded draw is in sync", seeded.sync.inSync === true, seeded.sync);

  const p1 = seeded.slots.find((s) => s.seed === 1)!.position;
  const p2 = seeded.slots.find((s) => s.seed === 2)!.position;
  check("seeds 1 and 2 meet only in the final of the real draw",
    meetRound(p1, p2, seeded.size) === Math.log2(seeded.size), { p1, p2, size: seeded.size });

  // Seeds are a relative ordering, so an edit that preserves the order changes
  // nothing about the draw: 3 -> 6 still compacts to rank 3 behind 1 and 2.
  await DrawService.setEntrySeed(s3.entryId, 6, user);
  const noopEdit = await DrawService.get(seeded.id);
  check("an order-preserving seed edit is not drift",
    noopEdit.sync.seedsChanged === false && noopEdit.sync.inSync === true, noopEdit.sync);

  // Reordering is drift, and must be reported on its own rather than being
  // mistaken for an entry change.
  await DrawService.setEntrySeed(s1.entryId, 7, user);
  seeded = await DrawService.get(seeded.id);
  check("seed edit puts the draw out of sync", seeded.sync.inSync === false);
  check("drift reported as seedsChanged", seeded.sync.seedsChanged === true);
  check("no phantom entry changes alongside the seed drift",
    seeded.sync.added.length === 0 && seeded.sync.removed.length === 0, seeded.sync);
  check("seedChanges names the athlete with from/to",
    seeded.sync.seedChanges.length > 0 && seeded.sync.seedChanges.every((c) => !!c.name), seeded.sync.seedChanges);

  let clash = false;
  let clashMsg = "";
  try {
    await DrawService.setEntrySeed(s2.entryId, 6, user); // 6 is held by s3
  } catch (e: any) { clash = e?.status === 409; clashMsg = e?.message ?? ""; }
  check("duplicate seed rejected with the holder named", clash && clashMsg.includes(s3.name), clashMsg);

  console.log("— seeding vs draw lock —");
  await DrawService.setLock(seeded.id, true, user);
  let seedOnLocked = true;
  try { await DrawService.setEntrySeed(s2.entryId, 5, user); } catch { seedOnLocked = false; }
  check("seed edit allowed while the draw is locked", seedOnLocked);
  const lockedView = await DrawService.get(seeded.id);
  check("locked bracket keeps its snapshotted seeds",
    lockedView.slots.filter((s) => s.seed !== null).length === 3, lockedView.slots.map((s) => s.seed));
  check("locked draw reports the seeding drift", lockedView.sync.seedsChanged === true);
  let regenStillBlocked = false;
  try { await DrawService.regenerate(seeded.id, true, user); } catch (e: any) { regenStillBlocked = e?.status === 409; }
  check("regenerate still blocked while locked", regenStillBlocked);
  await DrawService.setLock(seeded.id, false, user);

  // The point of storing a relative ordering: a withdrawal leaves a gap in
  // Entry.seed, and the draw must compact over it rather than fail.
  console.log("— withdrawal compacts the seeding —");
  await DrawService.setCategorySeeds(
    category,
    [{ entryId: s1.entryId, seed: 1 }, { entryId: s2.entryId, seed: 2 }, { entryId: s3.entryId, seed: 3 }],
    user
  );
  await prisma.entry.update({ where: { id: s2.entryId }, data: { status: "RETURNED" } });
  const compacted = await DrawService.regenerate(seeded.id, true, user);
  const compactRanks = compacted.slots.filter((s) => s.seed !== null).sort((a, b) => a.seed! - b.seed!);
  check("seeds 1 and 3 compact to ranks 1,2 after a withdrawal",
    compactRanks.map((s) => s.seed).join() === "1,2", compactRanks.map((s) => s.seed));
  check("the withdrawn athlete is not in the redrawn bracket",
    !compacted.slots.some((s) => s.entry.entryId === s2.entryId));
  const returnedStill = await prisma.entry.findUnique({ where: { id: s2.entryId }, select: { seed: true } });
  check("a returned entry keeps its stored seed", returnedStill?.seed === 2, returnedStill);

  const otherDivision = await prisma.division.create({
    data: { eventId: event.id, key: "F05", name: "F05 - Girls 11", minAge: 11, maxAge: 11, gender: "Female", category: "KUMITE" },
  });
  const otherAthlete = await prisma.athlete.create({
    data: { clubId: clubs[0].id, firstName: "Foreign", lastName: "Entry", dob: new Date("2015-01-01"), gender: "Female", nationality: "Namibian", beltId: belt.id },
  });
  const otherEntry = await prisma.entry.create({
    data: { eventId: event.id, clubId: clubs[0].id, athleteId: otherAthlete.id, entryType: "KUMITE", divisionId: otherDivision.id, status: "APPROVED" },
  });
  let foreignRejected = false;
  try {
    await DrawService.setCategorySeeds(category, [{ entryId: otherEntry.id, seed: 1 }], user);
  } catch (e: any) { foreignRejected = e?.status === 422; }
  check("seeding an entry from another category rejected", foreignRejected);

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  console.log(`Demo event kept for UI testing: "${event.name}" (${event.id})`);
  console.log("The previous run's copy was removed; only this one remains.");
  process.exit(failures === 0 ? 0 : 1);
}

/**
 * Delete everything a previous run of this script left behind, matched on the
 * exact names it creates. Children first — every foreign key here is a plain
 * restrict.
 */
async function resetPriorRun() {
  const events = await prisma.event.findMany({
    where: { name: "Draw Engine Demo Event" },
    select: { id: true },
  });
  const eventIds = events.map((e) => e.id);
  const clubs = await prisma.club.findMany({
    where: { name: { in: ["OTJ Test", "WVB Test", "KHD Test"] } },
    select: { id: true },
  });
  const clubIds = clubs.map((c) => c.id);
  if (eventIds.length === 0 && clubIds.length === 0) return;

  await prisma.scheduleBlock.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.drawSlot.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.bout.deleteMany({ where: { draw: { eventId: { in: eventIds } } } });
  await prisma.draw.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.teamMember.deleteMany({ where: { team: { eventId: { in: eventIds } } } });
  await prisma.entry.deleteMany({
    where: { OR: [{ eventId: { in: eventIds } }, { clubId: { in: clubIds } }] },
  });
  await prisma.team.deleteMany({
    where: { OR: [{ eventId: { in: eventIds } }, { clubId: { in: clubIds } }] },
  });
  await prisma.invoice.deleteMany({
    where: { OR: [{ eventId: { in: eventIds } }, { clubId: { in: clubIds } }] },
  });
  await prisma.mat.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.weightClass.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.division.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.eventCoordinator.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
  await prisma.athlete.deleteMany({ where: { clubId: { in: clubIds } } });
  await prisma.club.deleteMany({ where: { id: { in: clubIds } } });
  await prisma.auditLog.deleteMany({ where: { user: { email: { startsWith: "draw-tester-" } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "draw-tester-" } } });
  // The belt is deliberately left alone: it is reused across runs, and other
  // seeded athletes may be pointing at it.
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
