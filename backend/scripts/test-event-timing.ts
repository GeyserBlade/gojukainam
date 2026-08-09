/**
 * Tournament timing config (Event.timingJson) and per-category timing
 * overrides (Division.boutDurationSec/bufferPct/winByGap), exercised over real
 * HTTP against the local database — mirrors scripts/test-bout-scoring.ts's
 * style.
 *
 * What this covers: that an event which has never been configured still reads
 * back a complete config, that a partial write is normalized and round-trips,
 * that a corrupt blob degrades to the defaults instead of 500ing the hub's
 * Overview tab, that out-of-range values are refused, and that the write path
 * is admin-or-coordinator while the read path is open to any logged-in user.
 *
 * What it does NOT re-test: requireEventManager's scoping in general — that is
 * scripts/test-event-scope.ts's job, and these routes use the same guard as
 * every other event route. What's new here is the timing fields themselves.
 *
 * Run: ALLOW_DEV_AUTH=true npm run dev          # in one shell
 *      npx tsx scripts/test-event-timing.ts     # in another
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
const asClubManager = { "x-role": "CLUB_MANAGER", "content-type": "application/json" };

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

  const event = await prisma.event.create({
    data: {
      name: "__EVENT_TIMING_TEST_EVENT__",
      venue: "n/a",
      city: "n/a",
      country: "NA",
      startDate: new Date(),
      regOpen: new Date(),
      regClose: new Date(),
      configJson: '{"currency":"NAD"}',
    },
  });

  // One junior category and one senior, so the age-derived win-gap default has
  // both sides represented in the data the frontend resolves against.
  const juniorDivision = await prisma.division.create({
    data: {
      eventId: event.id,
      key: "TIMING_U12",
      name: "Timing Test U12",
      minAge: 10,
      maxAge: 11,
      gender: "Male",
      category: "KUMITE",
    },
  });
  const seniorDivision = await prisma.division.create({
    data: {
      eventId: event.id,
      key: "TIMING_SENIOR",
      name: "Timing Test Senior",
      minAge: 18,
      maxAge: 39,
      gender: "Male",
      category: "KUMITE",
    },
  });

  try {
    console.log("\nan event that was never configured still reads a complete config:");
    const fresh = await call("GET", `/events/${event.id}/timing`, asAdmin);
    check("GET timing -> 200", fresh.status === 200, fresh);
    check(
      "every default present, nothing undefined",
      fresh.body?.mats === 2 &&
        fresh.body?.dayStartTime === "08:00" &&
        fresh.body?.defaultBoutDurationSec === 120 &&
        fresh.body?.kataBoutDurationSec === 90 &&
        fresh.body?.kataMode === "SEQUENTIAL" &&
        fresh.body?.transitionSecondsPerBout === 60 &&
        fresh.body?.defaultBufferPct === 10 &&
        fresh.body?.changeoverMinutes === 5,
      fresh.body,
    );
    check(
      "ceremonies default to on at 15min each",
      fresh.body?.opening?.enabled === true &&
        fresh.body?.opening?.minutes === 15 &&
        fresh.body?.closing?.enabled === true &&
        fresh.body?.closing?.minutes === 15,
      fresh.body,
    );
    check(
      "lunch defaults to 30min with all mats closing together",
      fresh.body?.lunch?.enabled === true &&
        fresh.body?.lunch?.minutes === 30 &&
        fresh.body?.lunch?.mode === "ALL_MATS",
      fresh.body?.lunch,
    );
    check("check-in defaults to off", fresh.body?.checkin?.enabled === false, fresh.body?.checkin);

    const stillNull = await prisma.event.findUnique({
      where: { id: event.id },
      select: { timingJson: true },
    });
    check("reading did not write a config row-side", stillNull?.timingJson === null, stillNull);

    console.log("\na partial write is normalized, stored and round-trips:");
    const partial = await call("PUT", `/events/${event.id}/timing`, asAdmin, {
      mats: 4,
      defaultBoutDurationSec: 90,
      lunch: { enabled: true, minutes: 45, mode: "PER_FLOOR" },
    });
    check("PUT partial timing -> 200", partial.status === 200, partial);
    check("supplied fields kept", partial.body?.mats === 4 && partial.body?.defaultBoutDurationSec === 90, partial.body);
    check("PER_FLOOR lunch stored", partial.body?.lunch?.mode === "PER_FLOOR" && partial.body?.lunch?.minutes === 45, partial.body?.lunch);
    check(
      "omitted fields came back filled in from the defaults, not missing",
      partial.body?.transitionSecondsPerBout === 60 && partial.body?.closing?.minutes === 15,
      partial.body,
    );

    const afterPartial = await call("GET", `/events/${event.id}/timing`, asAdmin);
    check(
      "GET after the write matches the write's response (not just an echo)",
      JSON.stringify(afterPartial.body) === JSON.stringify(partial.body),
      { get: afterPartial.body, put: partial.body },
    );

    console.log("\nceremonies and lunch can be turned off, and off round-trips as off:");
    const off = await call("PUT", `/events/${event.id}/timing`, asAdmin, {
      ...partial.body,
      opening: { enabled: false, minutes: 20 },
      lunch: { enabled: false, minutes: 30, mode: "ALL_MATS" },
      checkin: { enabled: true, minutes: 25 },
    });
    check("PUT -> 200", off.status === 200, off);
    const afterOff = await call("GET", `/events/${event.id}/timing`, asAdmin);
    check(
      "opening off (with its minutes preserved), lunch off, check-in now on",
      afterOff.body?.opening?.enabled === false &&
        afterOff.body?.opening?.minutes === 20 &&
        afterOff.body?.lunch?.enabled === false &&
        afterOff.body?.checkin?.enabled === true &&
        afterOff.body?.checkin?.minutes === 25,
      afterOff.body,
    );

    console.log("\nout-of-range and nonsense values are refused, not clamped silently:");
    const zeroMats = await call("PUT", `/events/${event.id}/timing`, asAdmin, { mats: 0 });
    check("mats: 0 -> 400", zeroMats.status === 400, zeroMats);
    const badMode = await call("PUT", `/events/${event.id}/timing`, asAdmin, {
      lunch: { enabled: true, minutes: 30, mode: "SOMETIME_MAYBE" },
    });
    check("unknown lunch mode -> 400", badMode.status === 400, badMode);
    const badBuffer = await call("PUT", `/events/${event.id}/timing`, asAdmin, { defaultBufferPct: 500 });
    check("buffer over 100% -> 400", badBuffer.status === 400, badBuffer);

    const unchanged = await call("GET", `/events/${event.id}/timing`, asAdmin);
    check(
      "a rejected write left the stored config untouched",
      JSON.stringify(unchanged.body) === JSON.stringify(afterOff.body),
      unchanged.body,
    );

    console.log("\na corrupt stored blob degrades to the defaults rather than 500ing:");
    await prisma.event.update({
      where: { id: event.id },
      data: { timingJson: "{not json at all" },
    });
    const corrupt = await call("GET", `/events/${event.id}/timing`, asAdmin);
    check("GET over corrupt JSON -> 200", corrupt.status === 200, corrupt);
    check("falls back to the defaults", corrupt.body?.mats === 2 && corrupt.body?.lunch?.mode === "ALL_MATS", corrupt.body);

    await prisma.event.update({
      where: { id: event.id },
      data: { timingJson: JSON.stringify({ mats: "four", lunch: { mode: "NOPE" } }) },
    });
    const wrongShape = await call("GET", `/events/${event.id}/timing`, asAdmin);
    check("valid JSON of the wrong shape also falls back", wrongShape.status === 200 && wrongShape.body?.mats === 2, wrongShape.body);

    // Put a real config back for the permission checks below.
    await call("PUT", `/events/${event.id}/timing`, asAdmin, { mats: 3 });

    console.log("\npermissions: read open to any logged-in user, write is admin-or-coordinator:");
    const readAsClub = await call("GET", `/events/${event.id}/timing`, asClubManager);
    check("plain club manager can read the timing -> 200", readAsClub.status === 200, readAsClub);

    const writeAsClub = await call("PUT", `/events/${event.id}/timing`, asClubManager, { mats: 9 });
    check("plain club manager cannot write -> 403", writeAsClub.status === 403, writeAsClub);

    await prisma.eventCoordinator.upsert({
      where: { eventId_userId: { eventId: event.id, userId: devUser.id } },
      update: {},
      create: { eventId: event.id, userId: devUser.id },
    });
    const writeAsCoord = await call("PUT", `/events/${event.id}/timing`, asClubManager, { mats: 5 });
    check("this event's coordinator can write -> 200", writeAsCoord.status === 200, writeAsCoord);
    check("the coordinator's value stuck", writeAsCoord.body?.mats === 5, writeAsCoord.body);

    console.log("\nper-category timing overrides round-trip through the division routes:");
    const setJunior = await call("PUT", `/events/divisions/${juniorDivision.id}`, asAdmin, {
      boutDurationSec: 90,
      bufferPct: 15,
      winByGap: 6,
    });
    check("PUT division timing -> 200", setJunior.status === 200, setJunior);
    check(
      "all three persisted on the response",
      setJunior.body?.boutDurationSec === 90 &&
        setJunior.body?.bufferPct === 15 &&
        setJunior.body?.winByGap === 6,
      setJunior.body,
    );

    const divisionList = await call("GET", `/events/${event.id}/divisions`, asAdmin);
    const juniorFromList = divisionList.body?.find((d: any) => d.id === juniorDivision.id);
    const seniorFromList = divisionList.body?.find((d: any) => d.id === seniorDivision.id);
    check(
      "the division list exposes the timing fields (this is what the Setup tab reads)",
      juniorFromList?.boutDurationSec === 90 && juniorFromList?.winByGap === 6,
      juniorFromList,
    );
    check(
      "an untouched category reports null on all three — 'inherit', not zero",
      seniorFromList?.boutDurationSec === null &&
        seniorFromList?.bufferPct === null &&
        seniorFromList?.winByGap === null,
      seniorFromList,
    );

    console.log("\nnull clears an override; 0 is a real value, not a clear:");
    const clearOne = await call("PUT", `/events/divisions/${juniorDivision.id}`, asAdmin, {
      boutDurationSec: null,
    });
    check(
      "null clears just that field, leaving the other overrides alone",
      clearOne.body?.boutDurationSec === null &&
        clearOne.body?.bufferPct === 15 &&
        clearOne.body?.winByGap === 6,
      clearOne.body,
    );

    const zeroBuffer = await call("PUT", `/events/divisions/${juniorDivision.id}`, asAdmin, {
      bufferPct: 0,
    });
    check("bufferPct: 0 stores as 0, not as null", zeroBuffer.body?.bufferPct === 0, zeroBuffer.body);

    const clearAll = await call("PUT", `/events/divisions/${juniorDivision.id}`, asAdmin, {
      boutDurationSec: null,
      bufferPct: null,
      winByGap: null,
    });
    check(
      "clearing all three returns the category to fully inherited",
      clearAll.body?.boutDurationSec === null &&
        clearAll.body?.bufferPct === null &&
        clearAll.body?.winByGap === null,
      clearAll.body,
    );

    console.log("\ncategory timing is validated and permissioned like the rest of the division:");
    const tooShort = await call("PUT", `/events/divisions/${juniorDivision.id}`, asAdmin, {
      boutDurationSec: 1,
    });
    check("a 1-second bout -> 400", tooShort.status === 400, tooShort);
    const sillyGap = await call("PUT", `/events/divisions/${juniorDivision.id}`, asAdmin, { winByGap: 99 });
    check("a win gap of 99 -> 400", sillyGap.status === 400, sillyGap);

    // Kata is timed separately from kumite, and how the pair takes the floor is
    // worth roughly a factor of two on every kata category in the event.
    const kata = await call("PUT", `/events/${event.id}/timing`, asAdmin, {
      kataBoutDurationSec: 100,
      kataMode: "TOGETHER",
    });
    check("kata timing round-trips", kata.status === 200, kata);
    check(
      "both kata fields stored, and the kumite clock left alone",
      kata.body?.kataBoutDurationSec === 100 &&
        kata.body?.kataMode === "TOGETHER" &&
        kata.body?.defaultBoutDurationSec === 120,
      kata.body,
    );
    const badKataMode = await call("PUT", `/events/${event.id}/timing`, asAdmin, {
      kataMode: "SIMULTANEOUSLY_ISH",
    });
    check("an unknown kata format -> 400", badKataMode.status === 400, badKataMode);
    const stillTogether = await call("GET", `/events/${event.id}/timing`, asAdmin);
    check(
      "and the rejected write left the stored config untouched",
      stillTogether.body?.kataMode === "TOGETHER",
      stillTogether.body,
    );

    const asCoordDivision = await call("PUT", `/events/divisions/${seniorDivision.id}`, asClubManager, {
      winByGap: 8,
    });
    check("this event's coordinator can set category timing -> 200", asCoordDivision.status === 200, asCoordDivision);

    await prisma.eventCoordinator.deleteMany({ where: { eventId: event.id, userId: devUser.id } });
    const asPlainClub = await call("PUT", `/events/divisions/${seniorDivision.id}`, asClubManager, {
      winByGap: 6,
    });
    check("plain club manager (grant revoked) -> 403", asPlainClub.status === 403, asPlainClub);

    const editingTimingLeavesTheRest = await call("GET", `/events/${event.id}/divisions`, asAdmin);
    const seniorAfter = editingTimingLeavesTheRest.body?.find((d: any) => d.id === seniorDivision.id);
    check(
      "a timing-only update didn't disturb the category's name/ages/gender",
      seniorAfter?.name === "Timing Test Senior" &&
        seniorAfter?.minAge === 18 &&
        seniorAfter?.maxAge === 39 &&
        seniorAfter?.winByGap === 8,
      seniorAfter,
    );

    const configUntouched = await prisma.event.findUnique({
      where: { id: event.id },
      select: { configJson: true },
    });
    check(
      "configJson (the YAML rules snapshot) was never touched by the timing writes",
      configUntouched?.configJson === '{"currency":"NAD"}',
      configUntouched,
    );
  } finally {
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
