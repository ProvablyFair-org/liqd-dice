// The client's D2 counterexample, executed — and the four sibling cases it exposed.
//
// FINDING (client QA 2026-09-10, D2): a required report artifact containing the literal bytes
// `{not JSON` passed all 21 verification steps. The `JSON.parse` throw was swallowed, which left
// the stored dataset hash empty, which fell into the "computed from a different dataset" branch,
// which was classified as STALE — a benign condition that "this run regenerates". The verifier
// approved an artifact it could not read, and then overwrote it.
//
// This script runs the five cases the rewritten Step 19 has to separate, and asserts for each:
//   1. `npm run verify` exits NON-ZERO;
//   2. the artifact's bytes are UNCHANGED afterwards — verification does not rewrite the evidence
//      it is evaluating (D1), so a second run sees the same input and fails the same way;
//   3. outputs/verification-results.json is likewise untouched.
// The malformed-JSON case is run TWICE to demonstrate the "running twice fails twice" property
// directly, and is left in place so the battery's own verify run is a third failure, attributed to
// Step 19 by the registry entry.
//
// usage: node malformed-report-figures.mjs <sandboxRepo>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repo = process.argv[2];
const RF = path.join(repo, 'outputs/report-figures.json');
const VR = path.join(repo, 'outputs/verification-results.json');

const pristineRF = fs.readFileSync(RF);
const pristineVR = fs.existsSync(VR) ? fs.readFileSync(VR) : null;
const original = JSON.parse(pristineRF.toString('utf8'));

function verify() {
  try {
    execFileSync('npx', ['ts-node', 'tests/verify.ts'], { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out: '' };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const problems = [];
function expectRejected(label, bytes, runs = 1) {
  fs.writeFileSync(RF, bytes);
  for (let i = 1; i <= runs; i++) {
    const r = verify();
    if (r.code === 0) {
      problems.push(`${label}: run ${i} EXITED 0 — the verifier approved it`);
    } else if (!/\[FAIL\] Step 19\b/.test(r.out)) {
      problems.push(`${label}: run ${i} failed, but not at Step 19`);
    }
    const now = fs.readFileSync(RF);
    if (!now.equals(Buffer.from(bytes))) {
      problems.push(`${label}: run ${i} REWROTE outputs/report-figures.json — verification must not modify the evidence it scores`);
      fs.writeFileSync(RF, bytes);   // restore so the next run tests the same input
    }
    if (pristineVR !== null && !fs.readFileSync(VR).equals(pristineVR)) {
      problems.push(`${label}: run ${i} rewrote outputs/verification-results.json`);
      fs.writeFileSync(VR, pristineVR);
    }
  }
  console.log(`  ${label}: rejected on ${runs} run(s), evidence bytes unchanged`);
}

// 1. THE REPORTED CASE — unparseable bytes. Twice, to show the outcome is stable.
expectRejected('malformed JSON (`{not JSON`)', '{not JSON', 2);

// 2. a JSON null — parses, but is not an object
expectRejected('JSON null', 'null');

// 3. a JSON array — parses, is an object by `typeof`, and is still the wrong shape
expectRejected('JSON array', JSON.stringify([original], null, 2));

// 4. a required field removed — everything else intact and internally consistent
const missing = { ...original };
delete missing.settlementResidual;
expectRejected('required field absent (settlementResidual)', JSON.stringify(missing, null, 2));

// 5. the WRONG DATASET — every figure correct for some other capture. Previously "stale".
const wrongDataset = { ...original, datasetSha256: 'f'.repeat(64) };
expectRejected('wrong dataset hash', JSON.stringify(wrongDataset, null, 2));

// Leave case 1 in place: the battery's own verify run is the third failure of the same input.
fs.writeFileSync(RF, '{not JSON');

if (problems.length > 0) {
  console.error('D2 REGRESSION — the rewritten Step 19 did not hold:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('all five report-artifact failure modes rejected; committed evidence byte-identical throughout');
