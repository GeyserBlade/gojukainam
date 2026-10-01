/**
 * Classes, enrolment and the instructor income split, against the local
 * database — and the permission edges over real HTTP.
 *
 * Run: ALLOW_DEV_AUTH=true npm run dev      # in one shell
 *      npx tsx scripts/test-classes.ts      # in another
 *
 * What matters most here:
 *   - history is never rewritten: a change closes the open row and opens a new
 *     one, and a change dated before the current row is refused;
 *   - one class at a time, enforced by the database, not just the service;
 *   - the split adds back up to exactly what was paid, odd cents included,
 *     and nothing unassigned is dropped;
 *   - an agent key can read classes and cannot move anyone.
 *
 * Everything it creates is under two clubs named __CLASS_TEST_*__ and is
 * removed at the end, pass or fail.
 */
import { prisma } from "../src/lib/prisma.js";
import { ClassService } from "../src/services/class.service.js";
import { InstructorIncomeService } from "../src/services/instructor-income.service.js";
import { periodStart, splitEvenly } from "../src/utils/instructor-split.js";
import { generateApiKey } from "../src/utils/agent-auth.js";

const BASE = process.env.API_BASE ?? "http://localhost:4000/api";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}
async function refused(label: string, status: number, fn: () => Promise<unknown>) {
  try {
    await fn();
    check(`${label} -> ${status}`, false, "it was accepted");
  } catch (err) {
    const got = (err as { status?: number }).status;
    check(`${label} -> ${status}`, got === status, err);
  }
}
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

async function http(method: string, path: string, headers: Record<string, string>, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json().catch(() => null)) as unknown };
}

async function mkClub(name: string) {
  return prisma.club.create({ data: { name, contactName: "Test", email: `${name.toLowerCase()}@test.local` } });
}
async function mkAthlete(clubId: string, firstName: string, lastName: string) {
  return prisma.athlete.create({
    data: { clubId, firstName, lastName, dob: day("2014-05-01"), gender: "Male", nationality: "Namibian" },
  });
}

async function main() {
  if (!/@localhost[:/]/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: DATABASE_URL is not localhost");
  }

  // ── Pure: the split ─────────────────────────────────────────────────────
  console.log("\nsplitEvenly:");
  const odd = splitEvenly(77001, ["b", "a"]);
  check("an odd amount halves with the extra cent to the first id", JSON.stringify(odd) === JSON.stringify([
    { instructorId: "a", cents: 38501 }, { instructorId: "b", cents: 38500 },
  ]), odd);
  check("the parts always add back to the whole",
    [1, 2, 77001, 83000, 100].every((c) => splitEvenly(c, ["x", "y", "z"]).reduce((s, p) => s + p.cents, 0) === c));
  check("one instructor takes it all", splitEvenly(77000, ["a"])[0]?.cents === 77000);
  check("no instructors, no shares", splitEvenly(77000, []).length === 0);
  check("a listed-twice instructor is counted once", splitEvenly(100, ["a", "a"]).length === 1);
  check("a refund (negative) splits and sums too", splitEvenly(-77001, ["a", "b"]).reduce((s, p) => s + p.cents, 0) === -77001);
  check("periodStart reads yyyy-mm", iso(periodStart("2026-03")) === "2026-03-01");
  check("periodStart refuses month 13", periodStart("2026-13") === null);

  const clubA = await mkClub("__CLASS_TEST_A__");
  const clubB = await mkClub("__CLASS_TEST_B__");
  const createdKeys: string[] = [];

  try {
    // ── Instructors and classes ───────────────────────────────────────────
    console.log("\nInstructors and classes:");
    const ryan = await ClassService.createInstructor({ clubId: clubA.id, name: "Ryan" });
    const bruno = await ClassService.createInstructor({ clubId: clubA.id, name: "Bruno" });
    await refused("a second instructor with the same name", 409,
      () => ClassService.createInstructor({ clubId: clubA.id, name: "Ryan" }));
    const juniors = await ClassService.createClass({ clubId: clubA.id, name: "Juniors" });
    const seniors = await ClassService.createClass({ clubId: clubA.id, name: "Seniors" });
    const otherClub = await ClassService.createClass({ clubId: clubB.id, name: "Juniors" });
    check("the same class name may exist in another club", otherClub.name === "Juniors");

    await ClassService.setInstructors(clubA.id, juniors.id, { instructorIds: [bruno.id], from: "2026-01-01" });
    await ClassService.setInstructors(clubA.id, seniors.id, { instructorIds: [ryan.id, bruno.id], from: "2026-01-01" });
    const listed = await ClassService.listClasses(clubA.id, day("2026-02-01"));
    check("a class with two instructors is shown as shared",
      listed.find((c) => c.name === "Seniors")?.shared === true && listed.find((c) => c.name === "Juniors")?.shared === false);

    await refused("another club's instructor on this club's class", 400,
      () => ClassService.setInstructors(clubA.id, juniors.id, {
        instructorIds: [bruno.id, "not-an-instructor"], from: "2026-02-01",
      }));

    // ── Enrolment ──────────────────────────────────────────────────────────
    console.log("\nEnrolment:");
    const x = await mkAthlete(clubA.id, "Xavier", "Test");
    const y = await mkAthlete(clubA.id, "Yolanda", "Test");
    const z = await mkAthlete(clubA.id, "Zack", "Test");
    const foreign = await mkAthlete(clubB.id, "Fiona", "Other");

    await ClassService.enrol(clubA.id, x.id, { classId: juniors.id, from: "2026-01-01" });
    const moved = await ClassService.enrol(clubA.id, x.id, { classId: seniors.id, from: "2026-04-01" });
    check("moving class reports a change", moved.changed === true);
    const history = await ClassService.enrolmentHistory(clubA.id, x.id);
    check("moving class closes the old row the day before",
      history.length === 2 && history[1]?.className === "Juniors" && history[1]?.to === "2026-03-31"
        && history[0]?.className === "Seniors" && history[0]?.to === null, history);
    const same = await ClassService.enrol(clubA.id, x.id, { classId: seniors.id, from: "2026-05-01" });
    check("re-enrolling in the same class changes nothing", same.changed === false && same.from === "2026-04-01");
    await refused("a change dated before the current class began", 409,
      () => ClassService.enrol(clubA.id, x.id, { classId: juniors.id, from: "2026-02-01" }));
    await refused("enrolling in another club's class", 404,
      () => ClassService.enrol(clubA.id, x.id, { classId: otherClub.id, from: "2026-06-01" }));
    await refused("enrolling another club's athlete", 404,
      () => ClassService.enrol(clubA.id, foreign.id, { classId: juniors.id, from: "2026-06-01" }));
    await refused("a date that does not exist", 400,
      () => ClassService.enrol(clubA.id, x.id, { classId: juniors.id, from: "2026-02-30" }));

    await ClassService.enrol(clubA.id, z.id, { classId: juniors.id, from: "2026-06-01" });
    const sameDay = await ClassService.enrol(clubA.id, z.id, { classId: seniors.id, from: "2026-06-01" });
    const zHistory = await ClassService.enrolmentHistory(clubA.id, z.id);
    check("a same-day correction replaces the row rather than leaving a zero-day one",
      sameDay.changed && zHistory.length === 1 && zHistory[0]?.className === "Seniors", zHistory);
    await ClassService.enrol(clubA.id, z.id, { classId: juniors.id, from: "2026-06-01" });

    let doubleOpen = false;
    try {
      await prisma.classEnrolment.create({ data: { athleteId: x.id, classId: juniors.id, startDate: day("2026-07-01") } });
      doubleOpen = true;
    } catch { /* the index refused it */ }
    check("the database itself refuses a second open enrolment", !doubleOpen);

    await refused("deactivating a class with members in it", 409,
      () => ClassService.updateClass(clubA.id, juniors.id, { active: false }));

    // Juniors is Bruno's until June, then Ryan's.
    await ClassService.setInstructors(clubA.id, juniors.id, { instructorIds: [ryan.id], from: "2026-06-01" });
    await refused("an instructor change dated before the current one began", 409,
      () => ClassService.setInstructors(clubA.id, juniors.id, { instructorIds: [bruno.id], from: "2026-05-01" }));

    // ── Income ─────────────────────────────────────────────────────────────
    console.log("\nInstructor income:");
    await prisma.clubBillingConfig.create({ data: { clubId: clubA.id, enabled: true, refPrefix: "CLTA" } });
    let ref = 0;
    const invoice = (athleteId: string, periodKey: string | null, totalCents: number, kind: "SUBSCRIPTION" | "ONE_OFF" = "SUBSCRIPTION") =>
      prisma.memberInvoice.create({
        data: {
          clubId: clubA.id, athleteId, kind, periodKey,
          issueDate: day(periodKey ? `${periodKey}-01` : "2026-04-10"), dueDate: day("2026-12-31"),
          subtotalCents: totalCents, totalCents, status: "SENT",
          paymentRef: `CLTA-TEST-${++ref}-${Date.now()}`, createdVia: "test",
        },
      });
    const pay = async (invoiceId: string, received: string, amountCents: number) => {
      const p = await prisma.payment.create({
        data: { clubId: clubA.id, receivedDate: day(received), amountCents, method: "EFT", source: "manual", recordedVia: "test" },
      });
      await prisma.paymentAllocation.create({ data: { paymentId: p.id, invoiceId, amountCents, createdVia: "test" } });
    };

    // X: March fee (Juniors, Bruno alone) and April fee (Seniors, shared), both odd.
    await pay((await invoice(x.id, "2026-03", 77001)).id, "2026-04-03", 77001);
    await pay((await invoice(x.id, "2026-04", 77001)).id, "2026-04-05", 77001);
    // Y: never put in a class.
    await pay((await invoice(y.id, "2026-04", 50000)).id, "2026-04-06", 50000);
    // A one-off (grading) for X: dojo income, not split.
    await pay((await invoice(x.id, null, 30000, "ONE_OFF")).id, "2026-04-10", 30000);
    // Z: June fee, Juniors after it became Ryan's.
    await pay((await invoice(z.id, "2026-06", 83000)).id, "2026-06-04", 83000);
    // Received outside the window: excluded.
    await pay((await invoice(z.id, "2026-07", 83000)).id, "2026-07-02", 83000);

    const r = await InstructorIncomeService.income(clubA.id, day("2026-04-01"), day("2026-06-30"));
    const cents = (name: string) => r.perInstructor.find((p) => p.name === name)?.cents ?? 0;
    check("only monthly fees received in the window count", r.totalCents === 77001 + 77001 + 50000 + 83000, r.totalCents);
    check("March is split as March was taught (Bruno alone)", cents("Bruno") === 77001 + 38500 || cents("Bruno") === 77001 + 38501, r.perInstructor);
    check("June follows the instructor change (Ryan)", cents("Ryan") === 83000 + (77001 - (cents("Bruno") - 77001)), r.perInstructor);
    check("a member with no class is counted as unassigned, not dropped",
      r.unassigned.cents === 50000 && r.unassigned.noClass === 1, r.unassigned);
    check("assigned plus unassigned equals what was received",
      cents("Ryan") + cents("Bruno") + r.unassigned.cents === r.totalCents);
    check("the shared class is marked shared", r.byClass.find((c) => c.name === "Seniors")?.shared === true);
    check("the basis is stated with the figures", r.basis.includes("subscription"));

    // ── HTTP: who may do what ──────────────────────────────────────────────
    console.log("\nOver HTTP (needs the backend running with ALLOW_DEV_AUTH=true):");
    const managerA = { "x-role": "CLUB_MANAGER", "x-club-id": clubA.id };
    const coachA = { "x-role": "COACH", "x-club-id": clubA.id };
    check("a club manager reads their classes", (await http("GET", `/classes?clubId=${clubA.id}`, managerA)).status === 200);
    check("…and not another club's", (await http("GET", `/classes?clubId=${clubB.id}`, managerA)).status === 403);
    check("a club manager cannot create a class in another club",
      (await http("POST", `/classes`, managerA, { clubId: clubB.id, name: "Sneaky" })).status === 403);
    check("a club manager can create one in their own",
      (await http("POST", `/classes`, managerA, { clubId: clubA.id, name: "Adults" })).status === 201);
    check("a coach can read classes", (await http("GET", `/classes?clubId=${clubA.id}`, coachA)).status === 200);
    check("a coach cannot move a member",
      (await http("PUT", `/classes/athletes/${y.id}?clubId=${clubA.id}`, coachA, { classId: juniors.id, from: "2026-08-01" })).status === 403);
    const enrolled = await http("GET", `/classes/enrolments?clubId=${clubA.id}`, managerA);
    check("current classes are listed per member",
      enrolled.status === 200 && Array.isArray(enrolled.json) && (enrolled.json as unknown[]).length === 2, enrolled.json);

    const minted = generateApiKey();
    const key = await prisma.apiKey.create({
      data: {
        name: "__CLASS_TEST_KEY__", prefix: minted.prefix, hashedKey: minted.hashedKey, clubId: clubA.id,
        scopes: ["members:read", "billing:read", "billing:write"],
      },
    });
    createdKeys.push(key.id);
    const agent = { authorization: `Bearer ${minted.key}` };
    check("the agent key reads its club's classes", (await http("GET", `/classes?clubId=${clubA.id}`, agent)).status === 200);
    check("…and not another club's without federation:read", (await http("GET", `/classes?clubId=${clubB.id}`, agent)).status === 403);
    check("the agent key cannot create a class, even with billing:write",
      (await http("POST", `/classes`, agent, { clubId: clubA.id, name: "Agent class" })).status === 403);
    check("the agent key cannot move a member",
      (await http("PUT", `/classes/athletes/${y.id}?clubId=${clubA.id}`, agent, { classId: juniors.id, from: "2026-08-01" })).status === 403);
    check("the agent key cannot change who teaches",
      (await http("PUT", `/classes/${juniors.id}/instructors?clubId=${clubA.id}`, agent, { instructorIds: [], from: "2026-08-01" })).status === 403);
    const income = await http("GET", `/billing/instructor-income?clubId=${clubA.id}&from=2026-04-01&to=2026-06-30`, agent);
    check("the agent key reads instructor income",
      income.status === 200 && (income.json as { totalCents?: number }).totalCents === r.totalCents, income);
    const members = await http("GET", `/billing/members?clubId=${clubA.id}`, agent);
    const xRow = Array.isArray(members.json)
      ? (members.json as Array<{ id: string; currentClass?: { name: string } | null }>).find((m) => m.id === x.id)
      : ((members.json as { members?: Array<{ id: string; currentClass?: { name: string } | null }> })?.members ?? []).find((m) => m.id === x.id);
    check("billing members carry their current class", xRow?.currentClass?.name === "Seniors", xRow);
  } finally {
    // Children first; every row here hangs off the two test clubs.
    for (const clubId of [clubA.id, clubB.id]) {
      await prisma.payment.deleteMany({ where: { clubId } });
      await prisma.memberInvoice.deleteMany({ where: { clubId } });
      await prisma.classEnrolment.deleteMany({ where: { athlete: { clubId } } });
      await prisma.classInstructor.deleteMany({ where: { class: { clubId } } });
      await prisma.athlete.deleteMany({ where: { clubId } });
      await prisma.class.deleteMany({ where: { clubId } });
      await prisma.instructor.deleteMany({ where: { clubId } });
      await prisma.clubBillingConfig.deleteMany({ where: { clubId } });
    }
    await prisma.apiKey.deleteMany({ where: { id: { in: createdKeys } } });
    await prisma.club.deleteMany({ where: { id: { in: [clubA.id, clubB.id] } } });
    await prisma.$disconnect();
  }

  console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
