/** Verify the pinned evidence and write current results under outputs/run/.
 * PF_EMIT=1 explicitly replaces the published verification and report-figure files.
 * Certification and coverage: AUDIT_CONTEXT.md §§1, 7, 11 and 13.
 */
import * as fs from 'fs';
import * as path from 'path';

import { loadDataset } from '../src/loader';
import { DATASET_SHA256, SIMULATION_SHA256, SIMULATION_HTML_SHA256 } from '../src/config';
import { computeReportFigures } from '../src/report-figures';
import { assertSupportedRuntime, VALIDATED_RUNTIME } from '../src/runtime';
import { fieldDiff } from '../src/diff';
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
import * as statistical from './steps/statistical';
import * as standardization from './steps/standardization';

const DATASET_PATH        = path.join(__dirname, '../data/dice-master-6700bets.json');
const EXPECTED_DATASET_HASH = DATASET_SHA256;
const OUTPUTS_DIR         = path.join(__dirname, '../outputs');
/** This run's results. Never a committed artifact; gitignored. */
const RUN_DIR             = path.join(OUTPUTS_DIR, 'run');
/** PF_EMIT=1 (npm run report) is the ONLY thing that rewrites a committed artifact. */
const EMIT                = process.env.PF_EMIT === '1';

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
  simArtifact: null,   // populated by the simulation step
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
];

// ── Informational items ───────────────────────────────────────────────────────

const infoItems: InfoItem[] = statistical.run(ctx);

// ── Summary ───────────────────────────────────────────────────────────────────

const passed   = results.filter(r => r.status === 'PASS').length;
const flags    = results.filter(r => r.status === 'FLAG').length;
const hardFail = results.filter(r => r.status === 'FAIL').length;
const verdict  = hardFail > 0
  ? 'NOT PROVABLY FAIR'
  : flags > 0
    ? 'PROVABLY FAIR — Conditional Pass'
    : 'PROVABLY FAIR — Full Pass';

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
console.log(`  Flags:      ${flags}`);
console.log(`\n  VERDICT: ${verdict}`);
console.log('  Scope: recorded pre-production sample (qa.liqd.com, 27 August 2026)');
console.log(hardFail > 0 || flags > 0
  ? '  Certification: no passing certification from this run; production remains unassessed'
  : '  Certification: provisional, pending anonymous production validation');
console.log('══════════════════════════════════════════════════════════\n');

const verificationBody = {
  generatedAt: new Date().toISOString(),
  runtime: process.versions.node,
  totalBets: bets.length,
  totalSeeds: seeds.length,
  datasetSha256: ds.sha256,
  assessment: {
    environment: 'pre-production',
    host: 'qa.liqd.com',
    captureDate: '2026-08-27',
    scope: 'Recorded sample and documented game model; see AUDIT_CONTEXT.md',
    certificationStatus: hardFail > 0 || flags > 0 ? 'review-required' : 'provisional',
    productionValidation: 'pending',
    finalCertificationCondition: 'Anonymous production capture completed, reviewed and published with passing verification for its stated scope',
  },
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
    simulation: ctx.simArtifact
      ? { ...ctx.simArtifact, expected: SIMULATION_SHA256, match: ctx.simArtifact.sha256 === SIMULATION_SHA256, pinEnforced: process.env.SIM_FRESH !== '1' }
      : null,
    simulationChart: { file: 'outputs/rtp-convergence.html', expected: SIMULATION_HTML_SHA256 },
  },
  steps: results,
  info: infoItems,
  summary: { passed, flags, hardFail, verdict },
};

// Derived report figures — the settled-RTP span, the settlement residual's direction, the
// Phase-D exposure and the boundary-hit expectation. These are quoted in the report, so they are
// emitted by committed code from the pinned dataset rather than typed into prose (an unsourced
// figure is indistinguishable from a remembered one).
const figuresBody = {
  generatedAt: new Date().toISOString(),
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

if (EMIT) {
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

  // `generatedAt` differs by construction on every run, and `runtime` is a property of the run
  // rather than of the evidence; both are excluded so the diff shows disagreements only.
  const committedVerification = readJsonOrNull(path.join(OUTPUTS_DIR, VERIFICATION_FILE));
  const committedFigures      = readJsonOrNull(path.join(OUTPUTS_DIR, FIGURES_FILE));
  const verificationDiff = fieldDiff(committedVerification, verificationBody, ['generatedAt', 'runtime']);
  const figuresDiff      = fieldDiff(committedFigures, figuresBody, ['generatedAt']);
  write(RUN_DIR, 'diff.json', {
    generatedAt: verificationBody.generatedAt,
    runtime: process.versions.node,
    verdict,
    note: 'Field-level diff between the COMMITTED artifacts and THIS RUN. `generatedAt` (and the '
      + 'run\'s `runtime`) are excluded because they differ by construction. A non-empty diff means '
      + 'this run disagrees with the committed evidence — investigate it; do not re-run until it '
      + 'goes away, and do not regenerate the committed artifact to make it go away.',
    committedReadable: {
      [`outputs/${VERIFICATION_FILE}`]: committedVerification !== null,
      [`outputs/${FIGURES_FILE}`]: committedFigures !== null,
    },
    verificationResultsDiff: verificationDiff,
    reportFiguresDiff: figuresDiff,
  });

  console.log(`  Output (this run only): outputs/run/${VERIFICATION_FILE}, outputs/run/${FIGURES_FILE}, outputs/run/diff.json`);
  console.log('  Committed artifacts NOT modified. Use `npm run report` to propose replacements.');
  if (verificationDiff.length || figuresDiff.length) {
    console.log(`  ⚠ THIS RUN DISAGREES WITH THE COMMITTED EVIDENCE — ${verificationDiff.length} field(s) in ${VERIFICATION_FILE}, ${figuresDiff.length} in ${FIGURES_FILE}. See outputs/run/diff.json.`);
  }
}

if (hardFail > 0) process.exit(1);
if (flags > 0) process.exit(2);
export {};
