/** Execute declared mutations in disposable copies and require each expected guard to respond.
 * Direct mutations, structural forgeries and documented survivors have separate registries.
 * The source tree and published evidence remain unchanged. See AUDIT_CONTEXT.md §8.
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
  script?: string;
  runner?: 'verify' | 'mocha';
  expect?: string;
  survivor?: boolean;
  guard: string;
}

const REPO = path.join(__dirname, '..');
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
  'data/dice-master-6700bets.json',
  'outputs/simulation-results.json',
  'outputs/rtp-convergence.html',
  'outputs/report-figures.json',
  'outputs/verification-results.json',
];

/** Re-pin mutated evidence so the named semantic guard is tested beyond byte integrity. */
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

function run(cmd: string, args: string[]): { code: number; out: string } {
  try {
    const out = execFileSync(cmd, args, { cwd: sandbox, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}
const runVerify = () => run('npx', ['ts-node', 'tests/verify.ts']);
const runMocha = () => run('npx', ['mocha']);

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

let failures = 0;
let killed = 0;
let survivorsAsDeclared = 0;

registry.forEach((m, i) => {
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
  try {
    const result = m.runner === 'mocha' ? runMocha() : runVerify();

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
    if (new RegExp(`\\[(FAIL|FLAG)\\] Step ${named}\\b`).test(result.out)) {
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
  return out.split('\n').filter((l) => /\[(FAIL|FLAG)\]/.test(l)).slice(0, 6).join('\n') || '(no step lines emitted)';
}
function indent(s: string): string {
  return s.split('\n').map((l) => `        ${l}`).join('\n');
}

fs.rmSync(sandbox, { recursive: true, force: true });

console.log(`\n  ${killed} killed, ${survivorsAsDeclared} survivors as declared, ${failures} not as declared`);
if (failures > 0) {
  console.log('  FALSIFIABILITY BATTERY FAILED\n');
  process.exit(1);
}
console.log('  FALSIFIABILITY BATTERY PASSED — every declared mutation behaved as declared\n');
export {};
