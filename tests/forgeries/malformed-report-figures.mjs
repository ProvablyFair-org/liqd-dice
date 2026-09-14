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

const wrongDataset = { ...original, datasetSha256: 'f'.repeat(64) };
expectRejected('wrong dataset hash', JSON.stringify(wrongDataset, null, 2));

// Leave case 1 in place: the battery's own verify run is the third failure of the same input.
fs.writeFileSync(RF, '{not JSON');

if (problems.length > 0) {
  console.error('Report-figure validation failed:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('all five report-artifact failure modes rejected; committed evidence byte-identical throughout');
