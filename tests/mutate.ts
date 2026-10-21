/**
 * Falsifiability battery — `npm run mutate`.
 *
 * Runs every mutation declared in `tests/mutations.json` against a SANDBOX COPY of this repo and
 * checks that the suite breaks in exactly the way the mutation's `guard` says it must. The repo
 * being audited is never modified: the copy lives under the OS temp directory and `node_modules`
 * is symlinked, so a run costs a few seconds per mutation and leaves no residue. (That residue is
 * a real failure mode, not a hypothetical: a mutation runner that edits the working tree can
 * overwrite `outputs/*.json` — the artifacts of record — and leave the repo quietly inconsistent
 * with its own report.)
 *
 * WHY A RUNNER AT ALL. Without one, `tests/mutations.json` is an inert file: no npm script runs
 * it, and the registry documents a falsifiability property nobody executes. A declared guard that
 * is never run is prose.
 *
 * What each entry asserts:
 *   • `runner: "verify"` — `npm run verify` must exit non-zero AND the NAMED step must be the one
 *     that fails or flags. "The verdict flipped" is not enough: the point of naming a step is
 *     that the named guard is the one doing the work. Hardcode `9900` into Step 7 and the
 *     registry goes on claiming that doubling HOUSE_EDGE fails Step 7, while the run is in
 *     fact being saved by Steps 10/16/20/21. Only `[FAIL] Step N` or `[FLAG] Step N` is a KILL.
 *   • `expect: "[INFO] Step N"` — an entry aimed at an INFORMATIONAL numbered step (Step 22, policy
 *     INFORMATIONAL 2026-09-29). That step reports PASS or INFO and CANNOT FAIL, so it can never be
 *     killed. The entry must make the named step print `[INFO] Step N` with the run red (the red
 *     comes from other checks — for M-LIVESERIAL the reproduction gate and Step 19 — never from the
 *     INFO step itself), and it is counted SEPARATELY as an INFORMATIONAL SIGNAL — never as a kill.
 *   • `runner: "mocha"` — `npx mocha` must fail (unit vectors carry no step numbers).
 *   • `survivor: true` — the mutation must SURVIVE, and the entry must say why the audit cannot
 *     see it. A survivor declared as a survivor is evidence; a survivor quietly left out of the
 *     registry is a hole (S-MUTREG).
 *
 * Exit code 0 only if every entry behaved as declared.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

interface Mutation {
  name: string;
  /** Single-file find/replace form. Omitted when `script` is used. */
  file?: string;
  find?: string;
  replace?: string;
  find2?: string;
  replace2?: string;
  /**
   * Structural form: a committed .mjs under `tests/forgeries/` run as
   * `node <script> <sandbox>`. Some counterexamples cannot be expressed as a find/replace — a
   * fabricated Pass 1 rewrites four nested blocks and recomputes every derived field with our own
   * formulas, and a coherent population shrink deletes 2,680 records and doctors the header. Those
   * are exactly the forgeries that have got a Full Pass out of this suite, so the registry has
   * to be able to express them.
   */
  script?: string;
  runner?: 'verify' | 'mocha';
  expect?: string;
  survivor?: boolean;
  /**
   * RTP FIGURE OVERSTATED route (FIXPASS2 C3, 2026-10-14). `regen: true` does, in the sandbox, what an
   * auditor does after a change to the paytable or to the published figure: re-write
   * outputs/rtp-claim-table.json (`ts-node src/rtp-settings.ts`), re-pin RTP_CLAIM_TABLE_SHA256, and
   * re-emit the scored record (`PF_EMIT=1`), so the run that is judged reproduces its own committed
   * artifacts and nothing but the rule can decide it. `expectExit` / `expectVerdict` are then the
   * judgement: the verify run must exit with exactly that code, print that VERDICT, and mark the step
   * named in the guard `[RTP FIGURE OVERSTATED]`. Without `regen` the same edit stops at the table pin
   * (Step N FAIL, exit 1), which is what the external find/replace harness sees, and the runner checks
   * that too: a `regen` entry first runs the edited tree as it is (STALE layer: exit 1 and `[FAIL] Step N`
   * required — a stale RTP table is a reproduction failure even under a miss), then regenerates.
   */
  regen?: boolean;
  expectExit?: number;
  expectVerdict?: string;
  guard: string;
}

const REPO = path.join(__dirname, '..');
// THREE registries, deliberately separate files, for one reason: an external mutation harness
// reads `tests/mutations.json`, applies each entry itself as a single-file
// find/replace, and requires every entry there to name a step and fail. Anything that form cannot
// express, or that violates its "must fail" contract, has to live elsewhere or it reads as a
// broken guard.
//
//   tests/mutations.json          — single-file find/replace mutations the suite must KILL.
//                                   Read and executed by that external harness as well as by this
//                                   runner.
//   tests/structural-forgeries.json — counterexamples that CANNOT be a find/replace: a fabricated
//                                   Pass 1 rewrites ~40 nested fields and recomputes the derived
//                                   ones with our own formulas; a coherent population shrink
//                                   deletes 2,680 records, doctors the header and re-pins the SHA.
//                                   Each is a committed script under `tests/forgeries/`. These are
//                                   the two forgeries that returned a clean 21/21 Full Pass under
//                                   external review, so they are the most important entries
//                                   in the registry — and a find/replace harness cannot run them.
//                                   `npm run mutate` does, and it is the runner of record for them.
//   tests/mutation-survivors.json — mutations the suite provably CANNOT see, each with the reason.
//                                   A survivor in mutations.json would read as a broken guard.
const registry: Mutation[] = [
  ...JSON.parse(fs.readFileSync(path.join(REPO, 'tests/mutations.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(REPO, 'tests/structural-forgeries.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(REPO, 'tests/mutation-survivors.json'), 'utf8'))
    .map((m: Mutation) => ({ ...m, survivor: true })),
];

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dice-mutate-'));
fs.cpSync(REPO, sandbox, {
  recursive: true,
  filter: (src) => !src.includes(`${path.sep}node_modules`) && !src.includes(`${path.sep}.git${path.sep}`),
});
fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(sandbox, 'node_modules'), 'dir');

/**
 * Files a mutation may touch, snapshotted before and restored after every entry. `src/config.ts` is
 * on the list because of RE-PINNING, below; the artifacts are on it because a forgery may target
 * them directly.
 */
const MUTABLE = [
  'src/config.ts',
  // Added 2026-10-14 (C3 regen entries): the rule table, its pin, and every record a PF_EMIT run writes.
  'src/rtp-settings.ts',
  'outputs/rtp-claim-table.json',
  'data/dice-master-6700bets.json',
  'outputs/simulation-results.json',
  'outputs/rtp-convergence.html',
  'outputs/report-figures.json',
  'outputs/verification-results.json',
];

/**
 * RE-PIN every hash-pinned artifact after mutating it.
 *
 * WHY. With `SIMULATION_SHA256` in place and no re-pin, every artifact
 * mutation in the registry is stopped by the hash instead of by the guard it
 * names — turning a dozen declared guards into decoration, which is the precise failure
 * this runner exists to detect. A real forger re-pins in the same commit; so does this runner. The
 * hash is then proving nothing and the statistical/structural guards have to do the work.
 */
function repin(): void {
  const cfgPath = path.join(sandbox, 'src/config.ts');
  let cfg = fs.readFileSync(cfgPath, 'utf8');
  const pins: [RegExp, string][] = [
    [/(export const DATASET_SHA256 = ')[0-9a-f]{64}(')/, 'data/dice-master-6700bets.json'],
    [/(export const SIMULATION_SHA256 = ')[0-9a-f]{64}(')/, 'outputs/simulation-results.json'],
    [/(export const SIMULATION_HTML_SHA256 = ')[0-9a-f]{64}(')/, 'outputs/rtp-convergence.html'],
  ];
  for (const [re, rel] of pins) {
    const f = path.join(sandbox, rel);
    if (!fs.existsSync(f)) continue;
    const h = createHash('sha256').update(fs.readFileSync(f)).digest('hex');
    cfg = cfg.replace(re, `$1${h}$2`);
  }
  fs.writeFileSync(cfgPath, cfg);
}

function run(cmd: string, args: string[], env: Record<string, string> = {}): { code: number; out: string } {
  try {
    const out = execFileSync(cmd, args, { env: { ...process.env, ...env }, cwd: sandbox, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}
const runVerify = () => run('npx', ['ts-node', 'tests/verify.ts']);
const runMocha = () => run('npx', ['mocha']);

/** C3 `regen`: re-write and re-pin the rule table, then re-emit the scored record. Returns an error or null. */
function regenerate(): string | null {
  const w = run('npx', ['ts-node', 'src/rtp-settings.ts']);
  const h = w.out.match(/sha256 ([0-9a-f]{64})/);
  if (w.code !== 0 || !h) return `rtp-claim:write exited ${w.code}`;
  const rs = path.join(sandbox, 'src/rtp-settings.ts');
  const src = fs.readFileSync(rs, 'utf8');
  const next = src.replace(/(export const RTP_CLAIM_TABLE_SHA256 = ')[0-9a-f]{64}(')/, `$1${h[1]}$2`);
  if (next === src && !src.includes(h[1])) return 'RTP_CLAIM_TABLE_SHA256 not found in src/rtp-settings.ts';
  fs.writeFileSync(rs, next);
  const e = run('npx', ['ts-node', 'tests/verify.ts'], { PF_EMIT: '1' });
  if (!/VERDICT:/.test(e.out)) return `PF_EMIT=1 verify exited ${e.code} without a VERDICT line`;
  return null;
}

console.log('\n══ Falsifiability battery ══');
console.log(`  sandbox: ${sandbox}`);

// The baseline must be clean, or every mutation below is vacuous.
const baseline = runVerify();
if (baseline.code !== 0 || !/PROVABLY FAIR/.test(baseline.out)) {
  console.error('  BASELINE NOT CLEAN — every mutation would be vacuous. Aborting.');
  console.error(baseline.out.split('\n').slice(-25).join('\n'));
  process.exit(2);
}
console.log(`  baseline: verify exits 0, Full Pass ✓  (${registry.length} mutations declared)\n`);

/**
 * `npm run mutate -- <name prefix> …` runs only the entries whose name starts with one of the prefixes
 * (e.g. M-C3i M-C3ii). A PARTIAL RUN, labelled as such, exit 3 when every selected entry behaved as
 * declared; it never stands in for the battery (added 2026-10-14).
 */
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('-'));
let selected = 0;
let failures = 0;
let killed = 0;
let informationalSignals = 0;
let survivorsAsDeclared = 0;

registry.forEach((m, i) => {
  if (ONLY.length && !ONLY.some((o) => m.name === o || m.name.startsWith(`${o} `))) return;
  selected++;
  const label = `M${String(i).padStart(2, '0')} ${m.name}`;
  const snapshot = new Map<string, string | null>();
  const files = [...new Set([...MUTABLE, ...(m.file ? [m.file] : [])])];
  for (const rel of files) {
    const f = path.join(sandbox, rel);
    snapshot.set(rel, fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null);
  }
  const restore = () => {
    for (const [rel, body] of snapshot) {
      const f = path.join(sandbox, rel);
      if (body === null) { if (fs.existsSync(f)) fs.rmSync(f); } else fs.writeFileSync(f, body);
    }
  };

  if (m.script) {
    const scriptPath = path.join(sandbox, m.script);
    if (!fs.existsSync(scriptPath)) {
      console.log(`  ${label} — NOT RUN: forgery script ${m.script} absent ✗`);
      failures++;
      return;
    }
    const applied = run('node', [scriptPath, sandbox]);
    if (applied.code !== 0) {
      console.log(`  ${label} — NOT RUN: forgery script exited ${applied.code} ✗`);
      console.log(indent(applied.out.split('\n').slice(-6).join('\n')));
      failures++;
      restore();
      return;
    }
  } else {
    const target = path.join(sandbox, m.file!);
    const original = fs.readFileSync(target, 'utf8');
    if (!original.includes(m.find!)) {
      console.log(`  ${label} — NOT RUN: find string absent from ${m.file} ✗`);
      failures++;
      return;
    }
    let mutated = original.replace(m.find!, m.replace!);
    if (m.find2 !== undefined) {
      if (!mutated.includes(m.find2)) {
        console.log(`  ${label} — NOT RUN: find2 string absent from ${m.file} ✗`);
        failures++;
        return;
      }
      mutated = mutated.replace(m.find2, m.replace2!);
    }
    if (mutated === original) {
      console.log(`  ${label} — NOT RUN: find == replace, nothing mutated ✗`);
      failures++;
      return;
    }
    fs.writeFileSync(target, mutated);
    // Re-pin AFTER the edit, so an artifact mutation is judged by its declared guard rather than by
    // the SHA pin it happens to move. Scripts re-pin themselves (they model a forger who does).
    repin();
  }
  // STALE layer (framework rule: a committed table that no longer matches is a reproduction failure,
  // exit 1, even under a miss): the same edit WITHOUT regenerating must exit 1 with the named step FAIL.
  let staleNote = '';
  let staleOk = true;
  if (m.regen) {
    const stale = runVerify();
    const named = (m.guard.match(/Step\s+(\d+)/i) || [])[1];
    staleOk = stale.code === 1 && named !== undefined && new RegExp(`\\[FAIL\\] Step ${named}\\b`).test(stale.out);
    staleNote = `without regen: exit ${stale.code} (expected 1), [FAIL] Step ${named ?? '?'} ${staleOk ? 'printed' : 'NOT printed'}; `;
    const err = regenerate();
    if (err) {
      console.log(`  ${label} — NOT RUN: regen failed — ${err} ✗`);
      failures++;
      restore();
      return;
    }
  }
  try {
    const result = m.runner === 'mocha' ? runMocha() : runVerify();

    if (m.expectExit !== undefined) {
      // C3: judged by the exact exit code, the VERDICT line and the named step's re-scored marker.
      const named = (m.guard.match(/Step\s+(\d+)/i) || [])[1];
      const verdictLine = (result.out.match(/VERDICT: (.*)/) || [])[1]?.trim() ?? '(none)';
      const marker = named !== undefined && new RegExp(`\\[RTP FIGURE OVERSTATED\\] Step ${named}\\b`).test(result.out);
      const ok = staleOk && result.code === m.expectExit && (!m.expectVerdict || verdictLine === m.expectVerdict) && marker;
      console.log(`  ${label} — ${ok ? 'ends as declared ✓' : 'DID NOT END AS DECLARED ✗'}  ${staleNote}${m.regen ? 'with regen: ' : ''}exit ${result.code} (expected ${m.expectExit}), VERDICT: ${verdictLine}, [RTP FIGURE OVERSTATED] Step ${named ?? '?'} ${marker ? 'printed' : 'NOT printed'}`);
      if (ok) killed++; else { failures++; console.log(indent(stepLines(result.out))); }
      return;
    }

    if (m.survivor) {
      if (result.code === 0) {
        console.log(`  ${label} — SURVIVES as declared ✓  (${m.guard})`);
        survivorsAsDeclared++;
      } else {
        console.log(`  ${label} — declared a survivor but the suite CAUGHT it ✗ — the registry is out of date`);
        console.log(indent(stepLines(result.out)));
        failures++;
      }
      return;
    }

    if (result.code === 0) {
      console.log(`  ${label} — MUTATION SURVIVED ✗  suite still green`);
      failures++;
      return;
    }
    if (m.runner === 'mocha') {
      console.log(`  ${label} — mocha fails as declared ✓`);
      killed++;
      return;
    }
    const named = (m.guard.match(/Step\s+(\d+)/i) || [])[1];
    if (!named) {
      console.log(`  ${label} — NO STEP NAMED in the guard ✗  (say which step must fail)`);
      failures++;
      return;
    }
    // An entry aimed at an INFORMATIONAL step (expect "[INFO] Step N") is a signal, not a kill: the
    // step reports PASS or INFO and cannot fail (profile policy INFORMATIONAL, 2026-09-29).
    const informationalEntry = /^\[INFO\] Step \d+/.test(m.expect ?? '');
    if (informationalEntry) {
      if (new RegExp(`\\[INFO\\] Step ${named}\\b`).test(result.out)) {
        console.log(`  ${label} — Step ${named} reports INFO as declared (informational signal, not a kill) ✓`);
        informationalSignals++;
      } else {
        console.log(`  ${label} — DECLARED INFORMATIONAL SIGNAL ABSENT ✗  run red, but Step ${named} did not report INFO:`);
        console.log(indent(stepLines(result.out)));
        failures++;
      }
    } else if (new RegExp(`\\[(FAIL|FLAG)\\] Step ${named}\\b`).test(result.out)) {
      console.log(`  ${label} — Step ${named} fails as declared ✓`);
      killed++;
    } else {
      console.log(`  ${label} — DECLARED GUARD IS DECORATION ✗  verdict flipped, but Step ${named} did not fire:`);
      console.log(indent(stepLines(result.out)));
      failures++;
    }
  } finally {
    restore();
  }
});

function stepLines(out: string): string {
  return out.split('\n').filter((l) => /\[(FAIL|FLAG|INFO)\]/.test(l)).slice(0, 6).join('\n') || '(no step lines emitted)';
}
function indent(s: string): string {
  return s.split('\n').map((l) => `        ${l}`).join('\n');
}

fs.rmSync(sandbox, { recursive: true, force: true });

console.log(`\n  ${killed} killed, ${informationalSignals} informational signal(s), ${survivorsAsDeclared} survivors as declared, ${failures} not as declared`);
if (failures > 0) {
  console.log('  FALSIFIABILITY BATTERY FAILED\n');
  process.exit(1);
}
if (ONLY.length) {
  console.log(`  PARTIAL RUN (${ONLY.join(', ')}): ${selected} of ${registry.length} registered entries — this is not the battery result\n`);
  process.exit(selected === 0 ? 2 : 3);
}
console.log('  FALSIFIABILITY BATTERY PASSED — every declared mutation behaved as declared\n');
export {};
