/**
 * Replay a tournament's run day, bout by bout, and report every point where
 * the coordinator's Run queue would have shown something wrong.
 *
 * This is the third of the extract/import/replay trio (`export-event.ts`,
 * `import-event.ts`). Given an event that has already been fought, it winds
 * the bouts back to the start of the day and re-applies each result in the
 * order the audit trail says it actually happened, calling the *real*
 * `RunService.getBoard` between every step. Whatever the coordinator saw on
 * the day, this shows again — and names it.
 *
 *   npx tsx scripts/replay-run-day.ts --event <eventId>
 *   npx tsx scripts/replay-run-day.ts --event <eventId> --mat "Tatami 2" --verbose
 *
 * The event is restored to exactly the state it was found in when the replay
 * finishes, including on failure; `--leave-replayed` keeps the end state
 * instead, so the app can be clicked through afterwards.
 *
 * Local only: it rewrites every bout in the event twice.
 */
import { prisma } from "../src/lib/prisma.js";
import { RunService } from "../src/services/run.service.js";
import { DrawService } from "../src/services/draw.service.js";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const EVENT = flag("--event");
const ONLY_MAT = flag("--mat");
const VERBOSE = args.includes("--verbose");
const LEAVE = args.includes("--leave-replayed");
const DUMP = args.includes("--dump");

/** How long before its result we assume a bout's clock started. Only the
 *  relative order matters to the queue, never the exact figure. */
const ASSUMED_BOUT_SECONDS = 90;

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

type Board = Awaited<ReturnType<typeof RunService.getBoard>>;
type Queue = Board["mats"][number]["queue"];

interface Finding {
  at: string;
  mat: string;
  kind: string;
  detail: string;
}

/**
 * Everything that can be wrong about one mat's queue at one instant.
 *
 * Deliberately checked against the board's *output* rather than against
 * sortRunQueue's inputs: the question this whole script exists to answer is
 * what the coordinator's screen said, and the screen renders this array in
 * this order.
 */
function inspect(queue: Queue, matName: string, at: string): Finding[] {
  const found: Finding[] = [];
  if (queue.length === 0) return found;

  const label = (i: Queue[number]) => `${i.category} (${i.phase} r${i.round}p${i.position})`;

  // 1. A bout is on the clock but its division is not at the top of the mat.
  const live = queue.filter((i) => i.startedAt);
  if (live.length > 0) {
    const liveDraws = new Set(live.map((i) => i.drawId));
    if (!liveDraws.has(queue[0]!.drawId)) {
      found.push({
        at, mat: matName, kind: "LIVE_NOT_TOP",
        detail: `"${live[0]!.category}" is being fought, but the queue starts with "${queue[0]!.category}"`,
      });
    }
    if (liveDraws.size > 1) {
      found.push({
        at, mat: matName, kind: "TWO_LIVE_DIVISIONS",
        detail: `${liveDraws.size} divisions have a bout on the clock at once: ${[...new Set(live.map((i) => i.category))].join(", ")}`,
      });
    }
  }

  // 2. A division that has already fought sits behind one that has not —
  //    the "we're mid-category and it dropped down the list" report.
  //    A division with a bout on the clock is *meant* to outrank everything,
  //    and its divisionStarted is still false until that first result lands,
  //    so it is not what "has not started" means here.
  const liveDrawIds = new Set(queue.filter((i) => i.startedAt).map((i) => i.drawId));
  const firstUntouched = queue.findIndex((i) => !i.divisionStarted && !liveDrawIds.has(i.drawId));
  if (firstUntouched !== -1) {
    const strandedAfter = queue
      .slice(firstUntouched + 1)
      .filter((i) => i.divisionStarted && !liveDrawIds.has(i.drawId));
    if (strandedAfter.length > 0) {
      const names = [...new Set(strandedAfter.map((i) => i.category))];
      found.push({
        at, mat: matName, kind: "MIDCATEGORY_DROPPED",
        detail: `${names.map((n) => `"${n}"`).join(", ")} already fought but sit behind "${queue[firstUntouched]!.category}", which has not started`,
      });
    }
  }

  // 3. One division's bouts split by another division's — the queue should
  //    run a category to completion before starting the next.
  const seen = new Map<string, number>();
  for (let i = 0; i < queue.length; i++) {
    const drawId = queue[i]!.drawId;
    const last = seen.get(drawId);
    if (last !== undefined && last !== i - 1) {
      found.push({
        at, mat: matName, kind: "SPLIT_DIVISION",
        detail: `"${queue[i]!.category}" is interrupted at position ${i} by "${queue[i - 1]!.category}"`,
      });
    }
    seen.set(drawId, i);
  }

  // 4. An athlete queued for two bouts in a row: they fight with no
  //    recovery, or the mat stops to wait for them. Only counted when the
  //    division had something else it could have run instead — otherwise
  //    (a four-entry bracket's last semi into the final) it is the bracket's
  //    doing, not the queue's.
  for (let i = 1; i < queue.length; i++) {
    const previous = [queue[i - 1]!.akaEntryId, queue[i - 1]!.aoEntryId].filter(Boolean);
    const current = [queue[i]!.akaEntryId, queue[i]!.aoEntryId].filter(Boolean);
    const shared = current.filter((f) => previous.includes(f));
    if (shared.length === 0) continue;
    const alternative = queue.some(
      (c, j) =>
        j > i &&
        c.drawId === queue[i]!.drawId &&
        ![c.akaEntryId, c.aoEntryId].some((f) => previous.includes(f)),
    );
    if (!alternative) continue;
    const who = queue[i]!.aka.entryId === shared[0] ? queue[i]!.aka.name : queue[i]!.ao.name;
    found.push({
      at, mat: matName, kind: "BACK_TO_BACK",
      detail: `${who} is queued for two bouts in a row in "${queue[i]!.category}", with a spare bout of the same category available`,
    });
  }

  // 5. Informational, not a fault: this mat is running under a manual order
  //    somebody dragged. Worth surfacing because it is invisible on screen
  //    and permanent until cleared — and because before 2026-08 it *was*
  //    the fault, outranking even a live bout and stranding every bout that
  //    became ready after the drag at the bottom of the mat.
  const pinned = queue.filter((i) => i.queueOrder !== null);
  if (pinned.length > 0) {
    found.push({
      at, mat: matName, kind: "MANUAL_ORDER_IN_EFFECT",
      detail:
        `${pinned.length} of ${queue.length} bouts carry a manual queueOrder from a drag-to-reorder. ` +
        `Their divisions lead the unpinned ones whenever nothing is live or mid-category. ` +
        `Top pinned: ${label(pinned[0]!)}`,
    });
  }

  return found;
}

async function main() {
  if (!EVENT) fail("Give --event <eventId>. (Import an extract first: scripts/import-event.ts)");

  const isLocal = /@localhost[:/]/.test(process.env.DATABASE_URL ?? "");
  if (!isLocal) fail("Refusing to replay against a non-local database — it rewrites every bout in the event.");

  const event = await prisma.event.findUnique({ where: { id: EVENT } });
  if (!event) fail(`No event ${EVENT} locally.`);
  console.log(`\nReplaying: ${event.name}  (${EVENT})\n`);

  const draws = await prisma.draw.findMany({
    where: { eventId: EVENT },
    include: { division: true, weightClass: true },
  });
  const drawIds = draws.map((d) => d.id);
  const mats = await prisma.mat.findMany({ where: { eventId: EVENT }, orderBy: { order: "asc" } });
  const matName = new Map(mats.map((m) => [m.id, m.name]));

  // The state we must put back afterwards. Bout rows are *rebuilt* by the
  // bracket recompute every time a result changes — ids and all — so the
  // restore below re-creates them wholesale rather than updating in place.
  const original = await prisma.bout.findMany({ where: { drawId: { in: drawIds } } });
  const originalKata = await prisma.kataPerformance.findMany({ where: { boutId: { in: original.map((b) => b.id) } } });
  const originalDrawStatus = draws.map((d) => ({ id: d.id, status: d.status, matId: d.matId, matOrder: d.matOrder }));
  // Replaying the plan board rewrites these, so they are part of the restore.
  const originalBlocks = await prisma.scheduleBlock.findMany({ where: { eventId: EVENT } });

  // ---- Static findings: things that are true of the data itself ----
  console.log("— The data as it stands —");
  const pinnedRows = original.filter((b) => b.queueOrder !== null);
  const movedRows = original.filter((b) => b.matId !== null);
  const drawMat = new Map(draws.map((d) => [d.id, d.matId]));
  const contradictory = movedRows.filter((b) => drawMat.get(b.drawId) !== b.matId);
  console.log(`  ${original.length} bouts, ${original.filter((b) => b.winnerEntryId).length} decided`);
  console.log(`  ${pinnedRows.length} bouts carry a manual queueOrder (drag-to-reorder on the Run tab)`);
  console.log(`  ${movedRows.length} bouts carry a per-bout mat override, ${contradictory.length} of them onto a different mat than their own category`);
  const noOrder = draws.filter((d) => d.matId && d.matOrder === null);
  if (noOrder.length) console.log(`  ${noOrder.length} categories are on a mat with no matOrder — they sort last, by id`);
  const unassigned = draws.filter((d) => !d.matId);
  if (unassigned.length) console.log(`  ${unassigned.length} categories are on no mat at all — they appear only under "unassigned"`);

  // ---- The timeline ----
  // Three things reorder a mat during the day and all three are audited, so
  // all three are replayed in one merged sequence. Replaying only the results
  // would apply the day's *final* manual order from the first bout onwards,
  // which overstates how long anything was actually mis-sorted.
  const boutIds = original.map((b) => b.id);
  const audit = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "Bout", entityId: { in: boutIds }, action: { in: ["RESULT", "SCORE"] } },
        { entityType: "Mat", entityId: { in: mats.map((m) => m.id) }, action: "REORDER_QUEUE" },
        { entityType: "Event", entityId: EVENT, action: "PLAN_REORDER" },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  type Step =
    | { kind: "result"; at: Date; boutId: string; winnerEntryId: string }
    | { kind: "queue"; at: Date; matId: string; boutIds: string[] }
    | { kind: "plan"; at: Date; lanes: { matId: string | null; items: { kind: string; id: string }[] }[] };

  const timeline: Step[] = [];
  for (const a of audit) {
    let diff: Record<string, unknown>;
    try {
      diff = JSON.parse(a.diffJson);
    } catch {
      continue; // a malformed diff is a skipped step, not a crash
    }
    if (a.action === "REORDER_QUEUE") {
      timeline.push({ kind: "queue", at: a.createdAt, matId: a.entityId, boutIds: (diff.boutIds as string[]) ?? [] });
    } else if (a.action === "PLAN_REORDER") {
      const lanes = (diff.lanes ?? []) as { matId: string | null; items: { kind: string; id: string }[] }[];
      timeline.push({ kind: "plan", at: a.createdAt, lanes });
    } else if (diff.winnerEntryId) {
      timeline.push({ kind: "result", at: a.createdAt, boutId: a.entityId, winnerEntryId: diff.winnerEntryId as string });
    }
  }

  const results = timeline.filter((t): t is Extract<Step, { kind: "result" }> => t.kind === "result");
  console.log(`\n— Timeline —`);
  console.log(`  ${results.length} recorded results`);
  console.log(`  ${timeline.filter((t) => t.kind === "queue").length} drag-to-reorder events on the Run tab`);
  console.log(`  ${timeline.filter((t) => t.kind === "plan").length} plan-board reshuffles`);
  const auditedBouts = new Set(results.map((t) => t.boutId));
  const unaudited = original.filter((b) => b.winnerEntryId && !auditedBouts.has(b.id));
  if (unaudited.length) {
    console.log(`  ${unaudited.length} bouts are decided but have no audit row — they are replayed first, as the day's starting state`);
  }
  if (results.length === 0) fail("Nothing to replay: no RESULT/SCORE audit rows for this event's bouts.");
  console.log(`  ${timeline[0]!.at.toISOString()} → ${timeline.at(-1)!.at.toISOString()}`);

  const findings: Finding[] = [];
  const touchedBoutIds = new Set<string>();
  /** Per mat, the category each recorded result belonged to, in the order the
   *  day actually recorded them. What the *operators* did, as opposed to what
   *  the queue told them to do. */
  const matSequence = new Map<string, { drawId: string; category: string; at: Date }[]>();
  // setBoutWinner audits every write, and AuditLog.userId is a real foreign
  // key — the replay has to act as somebody who exists.
  const admin =
    (await prisma.user.findFirst({ where: { role: { in: ["SUPERADMIN", "ADMIN"] } }, select: { id: true } })) ??
    (await prisma.user.findFirst({ select: { id: true } }));
  if (!admin) fail("No users in the local database to attribute the replay's writes to.");
  const actor = { id: admin.id, role: "ADMIN" as const };
  const auditFloor = new Date();

  try {
    // ---- Wind back to the start of the day ----
    await prisma.kataPerformance.deleteMany({ where: { boutId: { in: boutIds } } });
    const hasDrags = timeline.some((t) => t.kind === "queue");
    await prisma.bout.updateMany({
      where: { drawId: { in: drawIds } },
      data: {
        winnerEntryId: null, akaScore: null, aoScore: null, outcome: null, scoreJson: null,
        postTime: false, startedAt: null,
        // Only wind the manual order back if the audit trail can rebuild it.
        // Without any REORDER_QUEUE rows, whatever is stored is all we know.
        ...(hasDrags ? { queueOrder: null } : {}),
      },
    });
    // Bouts that were decided with no audit row can't be placed in the
    // sequence, so they go back as the state the day opened with.
    for (const b of unaudited) {
      await prisma.bout.update({ where: { id: b.id }, data: { winnerEntryId: b.winnerEntryId } });
    }

    // ---- Step through it ----
    let step = 0;
    let skipped = 0;
    for (const t of timeline) {
      step++;

      // A coordinator dragged the queue on one mat: queueOrder = index, for
      // exactly the bouts that were on screen at that moment and no others.
      if (t.kind === "queue") {
        const live = await prisma.bout.findMany({ where: { id: { in: t.boutIds } }, select: { id: true } });
        const present = new Set(live.map((b) => b.id));
        await prisma.$transaction(
          t.boutIds.filter((id) => present.has(id)).map((id, index) => prisma.bout.update({ where: { id }, data: { queueOrder: index } })),
        );
        const name = matName.get(t.matId) ?? "?";
        if (!ONLY_MAT || name === ONLY_MAT) {
          const board = await RunService.getBoard(EVENT);
          const m = board.mats.find((x) => x.id === t.matId);
          if (m) findings.push(...inspect(m.queue, m.name, `${t.at.toISOString()} step ${step} (queue dragged)`));
          if (VERBOSE) console.log(`\n  step ${step}  ${name}  drag-to-reorder over ${t.boutIds.length} bouts`);
        }
        continue;
      }

      // The plan board was reshuffled: categories move mat and change their
      // place within it, which is the other half of what the queue sorts on.
      if (t.kind === "plan") {
        for (const lane of t.lanes) {
          for (const [index, item] of lane.items.entries()) {
            if (item.kind === "CATEGORY") {
              await prisma.draw.updateMany({
                where: { id: item.id, eventId: EVENT },
                data: { matId: lane.matId, matOrder: lane.matId ? index : null },
              });
            } else {
              await prisma.scheduleBlock.updateMany({
                where: { id: item.id, eventId: EVENT },
                data: { matId: lane.matId, matOrder: lane.matId ? index : null },
              });
            }
          }
        }
        for (const d of await prisma.draw.findMany({ where: { eventId: EVENT }, select: { id: true, matId: true } })) {
          drawMat.set(d.id, d.matId);
        }
        if (VERBOSE) console.log(`\n  step ${step}  plan board reshuffled across ${t.lanes.length} lanes`);
        continue;
      }

      const bout = await prisma.bout.findUnique({ where: { id: t.boutId } });
      if (!bout) { skipped++; continue; }
      // A result recorded against fighters who aren't in this bout any more
      // (a later bracket correction, a cleared-then-recaptured result) can't
      // be replayed in sequence; the run order is unaffected either way.
      if (bout.akaEntryId !== t.winnerEntryId && bout.aoEntryId !== t.winnerEntryId) { skipped++; continue; }

      const mat = bout.matId ?? drawMat.get(bout.drawId) ?? null;
      const name = mat ? matName.get(mat) ?? "?" : "unassigned";
      if (ONLY_MAT && name !== ONLY_MAT) {
        await prisma.bout.update({ where: { id: bout.id }, data: { winnerEntryId: t.winnerEntryId } });
        continue;
      }

      // The clock starts: what the coordinator sees while it is being fought.
      const startedAt = new Date(t.at.getTime() - ASSUMED_BOUT_SECONDS * 1000);
      await prisma.bout.update({ where: { id: bout.id }, data: { startedAt } });
      const during = await RunService.getBoard(EVENT);
      for (const m of during.mats) {
        if (ONLY_MAT && m.name !== ONLY_MAT) continue;
        findings.push(...inspect(m.queue, m.name, `${t.at.toISOString()} step ${step} (on the clock)`));
      }

      // The result goes in: what it looks like the instant after.
      const category = draws.find((d) => d.id === bout.drawId);
      const categoryName = category
        ? category.weightClass ? `${category.division.name} · ${category.weightClass.name}` : category.division.name
        : bout.drawId;
      const seq = matSequence.get(name) ?? [];
      seq.push({ drawId: bout.drawId, category: categoryName, at: t.at });
      matSequence.set(name, seq);

      touchedBoutIds.add(bout.id);
      await DrawService.setBoutWinner(bout.drawId, bout.id, t.winnerEntryId, actor);
      const after = await RunService.getBoard(EVENT);
      for (const m of after.mats) {
        if (ONLY_MAT && m.name !== ONLY_MAT) continue;
        const f = inspect(m.queue, m.name, `${t.at.toISOString()} step ${step} (result recorded)`);
        if (DUMP && f.length > 0) {
          console.log(`\n  queue — ${m.name} @ step ${step}`);
          m.queue.forEach((i, n) =>
            console.log(
              `    ${String(n).padStart(2)} ${i.category.padEnd(28)} draw=${i.drawId.slice(-6)} ` +
                `matOrder=${i.drawMatOrder} started=${i.divisionStarted} live=${!!i.startedAt} pinned=${i.queueOrder} ` +
                `${i.phase} r${i.round}p${i.position}`,
            ),
          );
        }
        findings.push(...f);
      }

      // The live rest-rule question, and the one the queue alone cannot see:
      // the bout just decided is gone, so is the athlete who just fought now
      // at the head of their own mat's queue? Only counted when their
      // category had another bout available to run instead.
      const justFought = [bout.akaEntryId, bout.aoEntryId].filter((f): f is string => !!f);
      const head = after.mats.find((m) => m.name === name)?.queue[0];
      if (head) {
        const shared = [head.akaEntryId, head.aoEntryId].filter((f) => f && justFought.includes(f));
        if (shared.length > 0) {
          const queue = after.mats.find((m) => m.name === name)!.queue;
          const alternative = queue.some(
            (c, j) =>
              j > 0 &&
              c.drawId === head.drawId &&
              !c.startedAt &&
              ![c.akaEntryId, c.aoEntryId].some((f) => f && justFought.includes(f)),
          );
          if (alternative) {
            findings.push({
              at: `${t.at.toISOString()} step ${step}`,
              mat: name,
              kind: "CALLED_STRAIGHT_BACK",
              detail: `${head.aka.entryId === shared[0] ? head.aka.name : head.ao.name} tops the queue in "${head.category}" having just fought, with another bout of that category available`,
            });
          }
        }
      }

      if (VERBOSE) {
        const q = after.mats.find((m) => m.name === name)?.queue ?? [];
        console.log(`\n  step ${step}  ${name}  result in "${draws.find((d) => d.id === bout.drawId)?.division.name}"`);
        q.slice(0, 5).forEach((i, n) =>
          console.log(`      ${n}. ${i.category}${i.startedAt ? "  [live]" : ""}${i.divisionStarted ? "  [started]" : ""}${i.queueOrder !== null ? `  [pinned ${i.queueOrder}]` : ""}`),
        );
      }
      if (!VERBOSE && step % 50 === 0) console.log(`  … ${step}/${timeline.length}`);
    }
    if (skipped) console.log(`  ${skipped} audit rows could not be placed in sequence and were skipped`);
  } finally {
    // Replay writes its own audit rows through the real service; they are an
    // artefact of the simulation, not of the day.
    await prisma.auditLog.deleteMany({
      where: { createdAt: { gte: auditFloor }, entityId: { in: [...new Set([...boutIds, ...touchedBoutIds])] } },
    });

    if (!LEAVE) {
      await prisma.$transaction([
        prisma.bout.deleteMany({ where: { drawId: { in: drawIds } } }),
        prisma.bout.createMany({ data: original }),
        prisma.kataPerformance.createMany({ data: originalKata }),
        ...originalDrawStatus.map((d) =>
          prisma.draw.update({ where: { id: d.id }, data: { status: d.status, matId: d.matId, matOrder: d.matOrder } }),
        ),
        ...originalBlocks.map((b) =>
          prisma.scheduleBlock.update({ where: { id: b.id }, data: { matId: b.matId, matOrder: b.matOrder } }),
        ),
      ]);
      // A replay that quietly corrupts the copy it is investigating is worse
      // than no replay, so this is checked rather than assumed.
      const now = await prisma.bout.findMany({ where: { drawId: { in: drawIds } } });
      const before = new Map(original.map((b) => [b.id, b.winnerEntryId]));
      const drift = now.filter((b) => !before.has(b.id) || before.get(b.id) !== b.winnerEntryId);
      const drawsNow = await prisma.draw.findMany({ where: { eventId: EVENT }, select: { id: true, matId: true, matOrder: true } });
      const layoutBefore = new Map(originalDrawStatus.map((d) => [d.id, `${d.matId}:${d.matOrder}`]));
      const layoutDrift = drawsNow.filter((d) => layoutBefore.get(d.id) !== `${d.matId}:${d.matOrder}`);
      if (now.length !== original.length || drift.length > 0 || layoutDrift.length > 0) {
        console.log(`\n  !! restore incomplete: ${now.length}/${original.length} bouts, ${drift.length} with a different result, ${layoutDrift.length} categories on a different mat/order.`);
        console.log("     Re-import the extract before trusting this copy.");
      } else {
        console.log(`\n  (event restored: ${now.length} bouts, ${now.filter((b) => b.winnerEntryId).length} decided, as found)`);
      }
    }
  }

  // ---- What the mats actually ran, as opposed to what the queue asked for ----
  // A category that is returned to after another category has been fought on
  // the same mat was interrupted on the day. The queue never asks for that,
  // so it is either an operator working out of order or two categories being
  // run side by side — and it is the single most likely thing behind
  // "the bouts came up in the wrong order".
  for (const [mat, seq] of matSequence) {
    const runs: { drawId: string; category: string; from: Date; to: Date }[] = [];
    for (const r of seq) {
      const last = runs.at(-1);
      if (last && last.drawId === r.drawId) last.to = r.at;
      else runs.push({ drawId: r.drawId, category: r.category, from: r.at, to: r.at });
    }
    const spans = new Map<string, number>();
    for (const r of runs) spans.set(r.drawId, (spans.get(r.drawId) ?? 0) + 1);
    for (const [drawId, count] of spans) {
      if (count < 2) continue;
      const own = runs.filter((r) => r.drawId === drawId);
      const between = runs
        .slice(runs.indexOf(own[0]!) + 1, runs.indexOf(own.at(-1)!))
        .filter((r) => r.drawId !== drawId)
        .map((r) => r.category);
      findings.push({
        at: own[0]!.from.toISOString(),
        mat,
        kind: "CATEGORY_INTERRUPTED",
        detail:
          `"${own[0]!.category}" was fought in ${count} separate stretches, with ` +
          `${[...new Set(between)].map((c) => `"${c}"`).join(", ")} in between`,
      });
    }
  }

  // ---- Report ----
  console.log(`\n— Findings —`);
  if (findings.length === 0) {
    console.log("  None. Every queue, at every step, ran the live category first and kept categories whole.\n");
    return;
  }
  // The same wrong queue is re-observed at every step until someone fixes it,
  // so the raw finding count measures persistence, not distinct problems.
  // Collapsing identical findings into one line with a window is what makes
  // the report readable — and the window is the useful number anyway: how
  // long the coordinator was looking at it.
  const byKind = new Map<string, Finding[]>();
  for (const f of findings) {
    const list = byKind.get(f.kind) ?? [];
    list.push(f);
    byKind.set(f.kind, list);
  }
  for (const [kind, list] of [...byKind].sort((a, b) => b[1].length - a[1].length)) {
    const mats = [...new Set(list.map((f) => f.mat))].sort();
    const distinct = new Map<string, { mat: string; detail: string; first: string; last: string; n: number }>();
    for (const f of list) {
      const key = `${f.mat}\u0000${f.detail}`;
      const seen = distinct.get(key);
      if (seen) {
        seen.n++;
        seen.last = f.at;
      } else {
        distinct.set(key, { mat: f.mat, detail: f.detail, first: f.at, last: f.at, n: 1 });
      }
    }
    const rows = [...distinct.values()].sort((a, b) => b.n - a.n);
    console.log(`\n  ${kind} — ${rows.length} distinct, ${list.length} observation(s), on ${mats.join(", ")}`);
    const byMat = new Map<string, number>();
    for (const f of list) byMat.set(f.mat, (byMat.get(f.mat) ?? 0) + 1);
    console.log(`    by mat: ${[...byMat].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m} ${n}`).join(", ")}`);
    for (const r of rows.slice(0, VERBOSE ? rows.length : 4)) {
      const window = r.first.slice(11, 19) === r.last.slice(11, 19) ? r.first.slice(11, 19) : `${r.first.slice(11, 19)}–${r.last.slice(11, 19)}`;
      console.log(`    ${window}  x${String(r.n).padStart(4)}  [${r.mat}]  ${r.detail}`);
    }
    if (!VERBOSE && rows.length > 4) console.log(`    … ${rows.length - 4} more distinct (--verbose for all)`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
