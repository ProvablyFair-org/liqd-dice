/**
 * LIQD Dice — Verification suite
 * Run: npm run verify
 *
 * Loads the captured master dataset (SHA-256 guarded), runs all scored steps, and writes THIS RUN's
 * results — pass or fail — under `outputs/run/`, leaving every committed artifact byte-identical.
 *
 * ── VERIFICATION DOES NOT WRITE THE EVIDENCE IT SCORES ──────────────────────────────────────────
 * Overwriting `outputs/verification-results.json` and `outputs/report-figures.json` at the end of
 * EVERY run, including a failing one, destroys the evidence of a disagreement.
 * `report-figures.json` is an artifact of record that Step 19 itself scores, so a run
 * that disagreed with the committed evidence would replace the evidence of the disagreement and
 * the next run would pass. A reviewer executed that: FAIL on Node 24, then PASS on the re-run,
 * with nothing left to show the first result. Repeated testing must not be able to erase an
 * original disagreement.
 *
 * Two commands, deliberately distinct:
 *   • `npm run verify`  — scores the committed artifacts, writes ONLY under `outputs/run/`
 *                         (this run's results, plus a field-level diff against the committed
 *                         artifacts). Committed bytes are never touched. Run it twice on unchanged
 *                         input and you get the same outcome twice.
 *   • `npm run report`  — the same run with `PF_EMIT=1`: an EXPLICIT, intentional regeneration of
 *                         the committed artifacts, to be reviewed as a diff before publishing.
 *
 * The supported runtime is pinned and enforced before any of this happens — see `src/runtime.ts`.
 *
 * Note: Dice has NO multiplier config file — the payout is the quotient 9900/basisPoints, so there
 * is no config artifact to pin. `artifactHashes` carries the dataset pin and the
 * simulation artifact pins that Step 19 reconciles (`npm test` does not regenerate the
 * simulation; `npm run test:full` does and sets SIM_FRESH=1 to record rather than enforce).
 */

import * as fs from 'fs';
import * as path from 'path';

import { loadDataset } from '../src/loader';
import { DATASET_SHA256, SIMULATION_SHA256, SIMULATION_HTML_SHA256, AUDIT_ID, VERDICT_QUALIFIER } from '../src/config';
import { computeReportFigures } from '../src/report-figures';
import { assertSupportedRuntime, VALIDATED_RUNTIME } from '../src/runtime';
import { fieldDiff, beyondTolerance, maxima, DIFF_ATOL, DIFF_RTOL } from '../src/diff';
import { labelFor, profileCoverageBlock } from '../src/profile-map';
import { runRtpClaimGate, RTP_CLAIM_STEP } from '../src/rtp-settings';
import { rtpClaimVerdict, RTP_FIGURE_OVERSTATED } from '../src/rtp-claim';
import type { Bet, Seed } from '../src/types';
import type { VerifyContext, InfoItem } from './steps/context';

import * as commitment  from './steps/commitment';
import * as determinism from './steps/determinism';
import * as payouts     from './steps/payouts';
import * as dataset     from './steps/dataset';
import * as antiCirc    from './steps/anti-circularity';
import * as phaseD      from './steps/phase-d';
import * as boundary    from './steps/boundary';
import * as simulation  from './steps/simulation';
import * as liveFit     from './steps/live-fit';
import * as statistical from './steps/statistical';
import * as standardization from './steps/standardization';

const DATASET_PATH        = path.join(__dirname, '../data/dice-master-6700bets.json');
// Single-sourced in src/config.ts: declared here AND in src/simulate.ts, the same pin would let
// the producer and the verifier score different captures.
const EXPECTED_DATASET_HASH = DATASET_SHA256;
const OUTPUTS_DIR         = path.join(__dirname, '../outputs');
/** This run's results. Never a committed artifact; gitignored. */
const RUN_DIR             = path.join(OUTPUTS_DIR, 'run');
/** PF_EMIT=1 (npm run report) is the ONLY thing that rewrites a committed artifact. */
const EMIT                = process.env.PF_EMIT === '1';

// Refuse an unvalidated runtime BEFORE anything is read, scored or written (D1). An exact-equality
// suite on a runtime whose Math.exp differs in the last bit produces a FAIL that says nothing about
// the casino, and the honest response is to decline the run rather than to widen the comparison.
assertSupportedRuntime();

console.log('\n══════════════════════════════════════════════════════════');
console.log('  LIQD DICE — VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════');
console.log(`  Runtime: Node v${process.versions.node} (validated: ${VALIDATED_RUNTIME})`);
console.log(EMIT
  ? '  MODE: REPORT GENERATION (PF_EMIT=1) — the committed artifacts WILL be rewritten'
  : '  MODE: verification — committed artifacts are read-only; results go to outputs/run/');

// ── Dataset presence guard (graceful) ─────────────────────────────────────────
if (!fs.existsSync(DATASET_PATH)) {
  console.log('\n  [ERROR] Dataset not found at data/dice-master-6700bets.json');
  console.log('  Cannot run verification without the captured master dataset.');
  console.log('\n══════════════════════════════════════════════════════════\n');
  process.exit(1);
}

// ── Load dataset (SHA-256 guard exits(1) on mismatch) ─────────────────────────
const ds = loadDataset(DATASET_PATH, EXPECTED_DATASET_HASH);
const bets: Bet[]  = ds.bets;
const seeds: Seed[] = ds.seeds;

// seedMap: hashedServerSeed → revealed serverSeed
const seedMap = new Map<string, string>();
for (const s of seeds) {
  if (s.serverSeed) seedMap.set(s.hashedServerSeed, s.serverSeed);
}

// byHash: hashedServerSeed → bets[]
const byHash = new Map<string, Bet[]>();
for (const b of bets) {
  const arr = byHash.get(b.hashedServerSeed) ?? [];
  arr.push(b);
  byHash.set(b.hashedServerSeed, arr);
}

const phaseABets = bets.filter(b => b.phase === 'A');
const phaseBBets = bets.filter(b => b.phase === 'B');
const phaseCBets = bets.filter(b => b.phase === 'C');
const phaseDBets = bets.filter(b => b.phase === 'D');
const phaseEBets = bets.filter(b => b.phase === 'E');

if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

console.log(`  Dataset: ${bets.length} bets | Seeds: ${seeds.length} | SHA-256 verified`);
console.log(`  Phase A:${phaseABets.length} B:${phaseBBets.length} C:${phaseCBets.length} D:${phaseDBets.length} E:${phaseEBets.length}\n`);

const ctx: VerifyContext = {
  bets, seeds, seedMap, byHash,
  phaseA: phaseABets, phaseB: phaseBBets, phaseC: phaseCBets, phaseD: phaseDBets, phaseE: phaseEBets,
  outputsDir: OUTPUTS_DIR,
  datasetSha256: ds.sha256,
  expectedDatasetHash: EXPECTED_DATASET_HASH,
  meta: ds.meta,
  simArtifact: null,   // populated by the simulation step (FIX-3)
};

// ── Run scored steps ──────────────────────────────────────────────────────────

const results = [
  ...commitment.run(ctx),     // Steps  1– 4
  ...determinism.run(ctx),    // Steps  5– 6
  ...payouts.run(ctx),        // Steps  7–10
  ...dataset.run(ctx),        // Steps 11–12
  ...antiCirc.run(ctx),       // Step  13
  ...phaseD.run(ctx),         // Step  14
  ...boundary.run(ctx),       // Step  15
  ...simulation.run(ctx),     // Steps 16–17
  ...standardization.run(ctx),// Steps 18–21
  ...liveFit.run(ctx),        // Step  22
];

// ── Profile labels ──────────────────────────────────────────────────────────────
// Each scored step says which ProvablyFair.org Dice profile check it implements, so the conformance
// matrix is DERIVED from the artifact rather than written by hand and left to go stale. The label is
// attached here, to the emitted record only: src/profile-map.ts cannot change what any step asserts.
const labelled = results.map(r => ({ ...r, ...labelFor(r.step) }));

// ── Informational items ───────────────────────────────────────────────────────

const infoItems: InfoItem[] = statistical.run(ctx);

// ── RTP-CLAIM rule (1.2.0, Methodology v1.1; agreed 2026-09-29, 1.2.0 2026-10-14) ──────────────
// The per-setting exact RTP table held to the published claim (src/rtp-settings.ts). While the
// package switch RTP_CLAIM_RULE_ENFORCED (src/rtp-claim-switch.ts) is false this is printed only and no step moves; when it
// is true a miss (gate status OVERSTATED) marks the step carrying DICE-19 OVERSTATED: not a draw FAIL, not counted in
// hardFail, verdict RTP FIGURE OVERSTATED, exit 5 (decision D3, 2026-10-14). A committed table that no longer equals this
// run (or its pin) is a reproduction failure either way (gate status FAIL → step FAIL, exit 1).
const rtpClaim = runRtpClaimGate();
console.log('');
for (const line of rtpClaim.lines) console.log(`  ${line}`);
if (rtpClaim.status === 'FAIL' || rtpClaim.status === 'OVERSTATED') {
  // `labelled` (the emitted record) was copied from `results` above: mark the step in both, or the
  // artifact would carry it as PASS under another verdict.
  const status = rtpClaim.status;
  for (const list of [results, labelled] as any[][]) {
    const s = list.find(r => r.step === RTP_CLAIM_STEP);
    if (s) {
      s.status = status;
      s.detail += status === 'FAIL' ? ' — RTP-CLAIM: the committed table does not match this run or its pin (reproduction failure)'
        : ` — ${RTP_FIGURE_OVERSTATED} (RTP-CLAIM 1.2.0, enforced): ${rtpClaim.result.minimalFix}`;
    }
  }
  console.log(`  [${status === 'FAIL' ? 'FAIL' : RTP_FIGURE_OVERSTATED}] Step ${RTP_CLAIM_STEP} — re-scored by the enforced RTP-CLAIM rule (outcome ${rtpClaim.result.outcome})`);
}

// ── Summary ───────────────────────────────────────────────────────────────────

const passed   = results.filter(r => r.status === 'PASS').length;
const flags    = results.filter(r => r.status === 'FLAG').length;
const hardFail = results.filter(r => r.status === 'FAIL').length;
const overstated = results.filter(r => r.status === 'OVERSTATED').length;
// A FLAG's ORIGIN decides whether it bears on the verdict (profile policy FLAG, decided
// 2026-09-17). An operator-origin flag (the residual is about the game) downgrades the verdict to a
// Conditional Pass and exits 2; a capture-origin flag (an auditor-side capture-retry gap that the
// revealed seed reconstructs) is counted and disclosed but verdict-neutral — Full Pass, exit 0.
// INFO (profile policy INFORMATIONAL — the DICE-22 live-sample serial screen, Step 22;
// 2026-09-29) is not a flag: Step 22 is a numbered step that reports INFO and cannot fail — it is
// reported, never counted, never in the verdict or the exit code.
// A flag with no origin defaults to operator, so an unclassified flag can only ever err toward
// disclosure, never toward hiding one.
const informational = results.filter(r => r.status === 'INFO').length;
const captureFlags  = results.filter(r => r.status === 'FLAG' && r.origin === 'capture').length;
const operatorFlags = flags - captureFlags;
// The rule's ranking (src/rtp-claim.ts rtpClaimVerdict): draw fail 1 > INCOMPLETE 3 > RTP FIGURE OVERSTATED 5 >
// Conditional Pass 2 > Full Pass 0. Every step has run by this line (a throw ends the process), so the run is complete.
const { verdict, exit: verdictExit } = rtpClaimVerdict({ fails: hardFail, complete: true, overstated: overstated > 0, opFlags: operatorFlags });

if (infoItems.length > 0) {
  console.log('');
  console.log('  ┌── Informational Context (not scored) ──');
  for (const item of infoItems) console.log(`  │ ${item.label}: ${item.detail}`);
  console.log('  └──');
}

console.log('\n══════════════════════════════════════════════════════════');
console.log('  RESULTS SUMMARY');
console.log('══════════════════════════════════════════════════════════');
console.log(`  Passed:     ${passed}/${results.length}`);
console.log(`  Hard fails: ${hardFail}`);
if (overstated) console.log(`  RTP figure overstated: Step ${RTP_CLAIM_STEP} (RTP-CLAIM 1.2.0, enforced; not a draw fail)`);
console.log(`  Flags:      ${flags}`);
if (informational) console.log(`  Informational deviations: ${informational} (reported, not counted, verdict unchanged)`);
console.log(`\n  VERDICT: ${verdict}`);
console.log('══════════════════════════════════════════════════════════\n');

// NO run metadata in an artifact of record (F8: absent, not excluded). The run's timestamp, its
// runtime and whether the simulation pin was enforced belong to THIS RUN and are recorded in
// outputs/run/diff.json, never in the committed verification-results.json / report-figures.json.
const runAt = new Date().toISOString();
const verificationBody = {
  // The assigned (provisional) audit ID, single-sourced from src/config.ts so it agrees with the
  // README/MANIFEST chapters and is machine-checkable (DICE-28 "the audit ID is assigned").
  auditId: AUDIT_ID,
  verdictQualifier: VERDICT_QUALIFIER,
  totalBets: bets.length,
  totalSeeds: seeds.length,
  datasetSha256: ds.sha256,
  artifactHashes: {
    // Dice has NO multiplier config file — the payout is a formula (99/continuousWinChance).
    // There is no config artifact to pin, so the dataset is the only pinned artifact.
    // expected = the pin in this file; actual = the recomputed hash; match must be true
    // (loadDataset already exits(1) on mismatch, so a written file always has match: true).
    dataset: {
      file: 'data/dice-master-6700bets.json',
      expected: EXPECTED_DATASET_HASH,
      actual: ds.sha256,
      match: ds.sha256 === EXPECTED_DATASET_HASH,
      sha256: ds.sha256,
    },
    // Records WHICH simulation artifact Steps 16–17 actually scored (its actual sha256),
    // alongside the pin it is reconciled against. This IS
    // a pinned guard: `npm test` does not regenerate the artifact, Step 19 reconciles both
    // simulation files against `SIMULATION_SHA256` / `SIMULATION_HTML_SHA256`, and `SIM_FRESH=1`
    // (set by `npm run test:full`) switches the pin from enforce to record — a property of the run,
    // so it is recorded in outputs/run/diff.json (`simulationPinEnforced`), not here. Null if absent.
    simulation: ctx.simArtifact
      ? { ...ctx.simArtifact, expected: SIMULATION_SHA256, match: ctx.simArtifact.sha256 === SIMULATION_SHA256 }
      : null,
    simulationChart: { file: 'outputs/rtp-convergence.html', expected: SIMULATION_HTML_SHA256 },
  },
  steps: labelled,
  profileCoverage: profileCoverageBlock(),
  info: infoItems,
  // The one summary shape of every LIQD package (scripts/release-bar.mjs, review of 2026-09-28 F20):
  // captureFlags counts the capture-origin FLAGs; an INFO step is not a flag and is not counted.
  summary: { passed, flags, operatorFlags, captureFlags, hardFail, verdict },
};

// Derived report figures — the settled-RTP span, the settlement residual's direction, the
// Phase-D exposure and the boundary-hit expectation. These are quoted in the report, so they are
// emitted by committed code from the pinned dataset rather than typed into prose (an unsourced
// figure is indistinguishable from a remembered one).
const figuresBody = {
  datasetSha256: ds.sha256,
  ...computeReportFigures(bets, seeds),
};

const VERIFICATION_FILE = 'verification-results.json';
const FIGURES_FILE      = 'report-figures.json';
const write = (dir: string, name: string, body: unknown) =>
  fs.writeFileSync(path.join(dir, name), JSON.stringify(body, null, 2));
const readJsonOrNull = (p: string): unknown => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
};

/**
 * Fields on which this run disagrees with the committed artifacts BEYOND the reproduction
 * tolerance. Stays 0 on the emission path, which is regenerating those artifacts rather than
 * checking against them.
 */
let reproductionFailures = 0;

if (EMIT) {
  // ── EXPLICIT REPORT GENERATION (`npm run report`) ───────────────────────────────────────────
  // The only path that rewrites a committed artifact. It is a separate command precisely so that
  // replacing evidence is an act somebody chose, reviewed as a diff, rather than a side effect of
  // testing (D1).
  write(OUTPUTS_DIR, VERIFICATION_FILE, verificationBody);
  write(OUTPUTS_DIR, FIGURES_FILE, figuresBody);
  console.log(`  REPORT GENERATION: rewrote outputs/${VERIFICATION_FILE} and outputs/${FIGURES_FILE}`);
  console.log('  Review the diff before publishing — these are artifacts of record.');
} else {
  // ── VERIFICATION (`npm run verify`) ─────────────────────────────────────────────────────────
  // This run's results, pass or fail, plus a field-level diff against the committed artifacts. A
  // disagreement is RECORDED here; it is not resolved in favour of whichever run wrote last.
  fs.mkdirSync(RUN_DIR, { recursive: true });
  write(RUN_DIR, VERIFICATION_FILE, verificationBody);
  write(RUN_DIR, FIGURES_FILE, figuresBody);

  // NOTHING IS EXCLUDED (F9). Neither artifact carries run metadata — the run's timestamp, runtime
  // and pin mode are recorded below, in this run's diff.json only — so every leaf is compared.
  const committedVerification = readJsonOrNull(path.join(OUTPUTS_DIR, VERIFICATION_FILE));
  const committedFigures      = readJsonOrNull(path.join(OUTPUTS_DIR, FIGURES_FILE));
  const verificationDiff = fieldDiff(committedVerification, verificationBody, []);
  const figuresDiff      = fieldDiff(committedFigures, figuresBody, []);

  // THE GATE IS "BEYOND TOLERANCE", NOT "ANY FIELD". The last bits of a derived floating-point
  // statistic are a property of the machine, not of the result: regenerated on other hardware a
  // p-value moves by a unit in the last place. Scoring that as a disagreement trains a reader to
  // ignore the diff, which is the one outcome that makes it useless. The bound is declared in
  // src/diff.ts and sits far below the precision of any figure this audit publishes; outside it
  // is a DIFFERENT result, and the run exits 1.
  const realVerification = beyondTolerance(verificationDiff);
  const realFigures      = beyondTolerance(figuresDiff);
  const realTotal        = realVerification.length + realFigures.length;
  const allDiffs         = [...verificationDiff, ...figuresDiff];
  const gap              = maxima(allDiffs);

  write(RUN_DIR, 'diff.json', {
    runAt,
    runtime: process.versions.node,
    simulationPinEnforced: process.env.SIM_FRESH !== '1',
    verdict,
    tolerance: { atol: DIFF_ATOL, rtol: DIFF_RTOL, rule: '|a-b| <= atol + rtol*max(|a|,|b|); two distinct integers never agree' },
    reproduced: realTotal === 0,
    beyondToleranceCount: realTotal,
    withinToleranceCount: allDiffs.length - realTotal,
    largestGap: gap,
    note: 'Field-level diff between the COMMITTED artifacts and THIS RUN. Nothing is excluded: the '
      + 'committed artifacts carry no run metadata (this run\'s time, runtime and pin mode are recorded '
      + 'only here, in outputs/run/). Entries marked '
      + '`withinTolerance` are the same result computed on different hardware and are recorded, '
      + 'not scored. Any entry NOT so marked means this run disagrees with the committed evidence '
      + '— investigate it; do not re-run until it goes away, and do not regenerate the committed '
      + 'artifact to make it go away.',
    committedReadable: {
      [`outputs/${VERIFICATION_FILE}`]: committedVerification !== null,
      [`outputs/${FIGURES_FILE}`]: committedFigures !== null,
    },
    verificationResultsDiff: verificationDiff,
    reportFiguresDiff: figuresDiff,
  });

  console.log(`  Output (this run only): outputs/run/${VERIFICATION_FILE}, outputs/run/${FIGURES_FILE}, outputs/run/diff.json`);
  console.log('  Committed artifacts NOT modified. Use `npm run report` to propose replacements.');
  console.log(`  Reproduction vs the committed artifacts on Node ${process.versions.node}: `
    + `${realTotal === 0 ? 'REPRODUCED' : `${realTotal} field(s) BEYOND TOLERANCE`}`
    + `${allDiffs.length - realTotal > 0 ? ` (${allDiffs.length - realTotal} within tolerance` + (gap ? `, largest ${gap.absDiff.toExponential(2)} at ${gap.path}` : '') + ')' : ''}`);
  if (realTotal > 0) {
    console.log(`  ⚠ THIS RUN DISAGREES WITH THE COMMITTED EVIDENCE — ${realVerification.length} field(s) in ${VERIFICATION_FILE}, ${realFigures.length} in ${FIGURES_FILE}. See outputs/run/diff.json.`);
    for (const d of [...realVerification, ...realFigures].slice(0, 6)) {
      console.log(`      ${d.path}: committed ${JSON.stringify(d.committed)} vs this run ${JSON.stringify(d.thisRun)}`);
    }
  }
  reproductionFailures = realTotal;
}

// Exit non-zero on anything short of a clean Full Pass: a hard fail
// exits 1, an RTP FIGURE OVERSTATED (enforced RTP-CLAIM 1.2.0 miss) exits 5, and a Conditional Pass (an OPERATOR-origin FLAG — e.g. a missing simulation artifact)
// exits 2, so CI cannot mistake a degraded run for the verdict of record. A capture-origin FLAG is
// verdict-neutral (profile policy FLAG): it is disclosed but does not change the verdict class, so
// it does not force a non-zero exit.
// Reproduction beyond tolerance is a FAIL, not a warning: a gate that only prints is not one.
if (hardFail > 0 || reproductionFailures > 0 || !rtpClaim.tableMatches) process.exit(1);
// 5 RTP FIGURE OVERSTATED, 2 Conditional Pass, 0 Full Pass — the code rtpClaimVerdict ranked above.
if (verdictExit !== 0) process.exit(verdictExit);
export {};
