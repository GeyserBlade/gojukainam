/**
 * Dev exercise for the draw engine against the local database.
 * Run: npx tsx scripts/test-draws.ts
 * Creates a demo event with 7 kumite entries, generates a draw, captures
 * results through to the podium, then verifies sync/regenerate behaviour.
 */
import { prisma } from "../src/lib/prisma.js";
import { DrawService, bracketPositions } from "../src/services/draw.service.js";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

async function main() {
  console.log("— bracketPositions sanity —");
  const p8 = bracketPositions(8);
  check("size 8 covers all positions", [...p8].sort((a, b) => a - b).join() === "1,2,3,4,5,6,7,8", p8);
  const firstFive = p8.slice(0, 5); // with 5 entries, byes must spread across quarters
  const quarters = new Set(firstFive.map((pos) => Math.ceil(pos / 2)));
  check("5 entries spread over all 4 pairs", quarters.size >= 4, { firstFive });

  console.log("— seeding demo data —");
  const belt = await prisma.belt.create({ data: { name: "Test White", colour: "#fff", order: 999 } });
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

  console.log("— category list —");
  const list = await DrawService.list(event.id);
  const row = list.find((r) => r.divisionId === division.id);
  check("list shows category with 8 entries", row?.entryCount === 8, row);
  check("list shows draw in sync", row?.draw?.inSync === true, row?.draw);

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  console.log(`Demo event kept for UI testing: "${event.name}" (${event.id})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
