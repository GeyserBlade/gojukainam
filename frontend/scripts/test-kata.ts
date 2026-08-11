/**
 * Unit tests for the kata flag decision (src/lib/kata-scoring.ts). No network,
 * no DOM — plain fixtures in, assertions out, same convention as
 * scripts/test-scoreboard.ts.
 *
 * Run: npx tsx scripts/test-kata.ts
 */
import {
  JUDGE_COUNT,
  MAJORITY,
  decideFlags,
  emptyPanel,
  kataScoreJson,
  normalizePanel,
  setFlag,
  tallyFlags,
  type FlagPanel,
} from "../src/lib/kata-scoring";
import type { Side } from "../src/lib/scoreboard";

let failures = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS ${label}`);
  else {
    failures++;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

/** Build a panel from a compact string: "aa.oo" -> aka, aka, none, ao, ao. */
const panelOf = (spec: string): FlagPanel =>
  normalizePanel(
    spec.split("").map((c) => (c === "a" ? "aka" : c === "o" ? "ao" : null)),
  );

console.log("\nThe panel is always five judges:");
{
  check("JUDGE_COUNT is 5", JUDGE_COUNT === 5, JUDGE_COUNT);
  check("a majority of five is three", MAJORITY === 3, MAJORITY);
  check("an empty panel has five slots", emptyPanel().length === 5);
  check("an empty panel is all null", emptyPanel().every((f) => f === null));
}

console.log("\ntallyFlags counts each side and what is still to come:");
{
  check("empty -> 0/0, five pending", JSON.stringify(tallyFlags(emptyPanel())) === JSON.stringify({ aka: 0, ao: 0, pending: 5 }));
  check("aaaoo -> 3/2, none pending", JSON.stringify(tallyFlags(panelOf("aaaoo"))) === JSON.stringify({ aka: 3, ao: 2, pending: 0 }));
  check("aa... -> 2/0, three pending", JSON.stringify(tallyFlags(panelOf("aa..."))) === JSON.stringify({ aka: 2, ao: 0, pending: 3 }));
}

console.log("\ndecideFlags: three flags is the decision, whatever the rest do:");
{
  const empty = decideFlags(emptyPanel());
  check("no flags -> no winner", empty.winner === null);
  check("no flags -> not decided", empty.decided === false);
  check("no flags -> not complete", empty.complete === false);

  const two = decideFlags(panelOf("aa..."));
  check("two flags for AKA is not yet a majority", two.winner === null, two);

  const three = decideFlags(panelOf("aaa.."));
  check("three flags for AKA wins it", three.winner === "aka", three);
  check("...even with two judges still to enter", three.decided && !three.complete, three);
  check("the saved score is the flags actually entered (3-0)", three.aka === 3 && three.ao === 0);

  const split = decideFlags(panelOf("aaaoo"));
  check("3-2 to AKA", split.winner === "aka" && split.aka === 3 && split.ao === 2, split);
  check("a full panel is complete", split.complete === true);

  const other = decideFlags(panelOf("ooaao"));
  check("3-2 to AO", other.winner === "ao" && other.ao === 3 && other.aka === 2, other);

  const sweep = decideFlags(panelOf("ooooo"));
  check("5-0 to AO", sweep.winner === "ao" && sweep.ao === 5, sweep);
}

console.log("\nAn odd panel cannot tie — there is no draw to represent:");
{
  // Exhaustive over every full panel: one side always holds a majority.
  let undecided = 0;
  const sides: Side[] = ["aka", "ao"];
  for (let mask = 0; mask < 1 << JUDGE_COUNT; mask++) {
    const panel = normalizePanel(
      Array.from({ length: JUDGE_COUNT }, (_, i) => sides[(mask >> i) & 1]),
    );
    const d = decideFlags(panel);
    if (!d.winner) undecided++;
    if (d.winner && d[d.winner] < MAJORITY) undecided++;
  }
  check("every one of the 32 full panels has a majority winner", undecided === 0, undecided);
}

console.log("\nsetFlag is a toggle, so a mis-tap costs one tap:");
{
  const p0 = emptyPanel();
  const p1 = setFlag(p0, 2, "aka");
  check("sets the judge it names", p1[2] === "aka");
  check("leaves the others alone", p1[0] === null && p1[4] === null);
  check("does not mutate the panel it was given", p0[2] === null);

  const p2 = setFlag(p1, 2, "ao");
  check("a different flag replaces it", p2[2] === "ao");
  const p3 = setFlag(p2, 2, "ao");
  check("the same flag again clears it", p3[2] === null);

  check("an index off the end is a no-op", setFlag(p0, 9, "aka") === p0);
  check("a negative index is a no-op", setFlag(p0, -1, "aka") === p0);
}

console.log("\nnormalizePanel survives whatever it is handed:");
{
  check("a short panel is padded", normalizePanel(["aka"]).length === 5);
  check("a long panel is trimmed", normalizePanel(Array(9).fill("ao")).length === 5);
  check("rubbish entries become null", normalizePanel(["nope", 7, null, "aka", {}])[0] === null);
  check("...but valid ones survive", normalizePanel(["nope", 7, null, "aka", {}])[3] === "aka");
  check("a non-array is an empty panel", normalizePanel("aaaaa").every((f) => f === null));
  check("undefined is an empty panel", normalizePanel(undefined).every((f) => f === null));
}

console.log("\nkataScoreJson stores what was performed alongside the flags:");
{
  const json = kataScoreJson(
    panelOf("aaaoo"),
    { kataId: "kata_saifa", kataName: "Saifa" },
    { kataId: null, kataName: null },
  );
  const parsed = JSON.parse(json);
  check("tagged as a kata result", parsed.kind === "kata", parsed.kind);
  check("keeps the panel verbatim", JSON.stringify(parsed.panel) === JSON.stringify(panelOf("aaaoo")));
  check("keeps AKA's kata", parsed.aka.kataId === "kata_saifa" && parsed.aka.kataName === "Saifa");
  check("a kata nobody recorded stays null", parsed.ao.kataId === null, parsed.ao);
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
