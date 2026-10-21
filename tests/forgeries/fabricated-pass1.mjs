// Reviewer A's counterexample, executed: fabricate a PERFECT Pass 1 that reconciles with every
// derived-field re-derivation the verifier performs, then re-pin SIMULATION_SHA256 so the forgery
// is scored by the statistical guards rather than stopped by a hash.
//
// usage: node forge-pass1.mjs <sandboxRepo>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = process.argv[2];
const simPath = path.join(repo, 'outputs/simulation-results.json');
const sim = JSON.parse(fs.readFileSync(simPath, 'utf8'));

const RANGE = 10000, HOUSE_EDGE = 0.01;
const wcPct = (p) => (p.inverted ? 100 - (p.upper - p.lower) : p.upper - p.lower);
const quotedMultiplier = (p) => { const wc = wcPct(p); return wc > 0 ? (100 / wc) * (1 - HOUSE_EDGE) : 0; };
const discreteWinCount = (p) => {
  const lo = Math.round(p.lower * 100), hi = Math.round(p.upper * 100);
  const inBand = Math.max(0, Math.min(RANGE, hi) - Math.max(0, lo));
  return p.inverted ? RANGE - inBand : inBand;
};
const discreteWinProbability = (p) => discreteWinCount(p) / RANGE;
const theoreticalRTP = (p) => discreteWinProbability(p) * quotedMultiplier(p);

const p1 = sim.pass1;

// 1. a PERFECT uniformity chi-squared: 0, p = 1.0
p1.uniformity.chi2 = 0;
p1.uniformity.pValue = 1;          // the verifier recomputes this from chi2 and gets exactly 1
p1.uniformity.pass = true;

// 2. PERFECT serial independence: no correlation at all, no runs deviation at all
p1.serial.lag1 = 0;
p1.serial.lag1Z = 0;               // == lag1 * sqrt(n), reconciles
p1.serial.runsZ = 0;
p1.serial.runsP = 1;               // == twoSidedNormalP(0), reconciles
p1.serial.pass = true;

// 3. every band's simulated RTP EXACTLY on theory, with every derived field recomputed by the
//    audit's own formulas so the per-field reconciliation passes
for (const r of p1.effectiveEdge) {
  const theo = theoreticalRTP(r.params), m = quotedMultiplier(r.params), pr = discreteWinProbability(r.params);
  const simRtp = theo;
  const se = Math.sqrt(pr * (m - simRtp) ** 2 + (1 - pr) * simRtp ** 2) / Math.sqrt(r.n);
  r.simulatedRTP = simRtp;
  r.quotedMultiplier = m;
  r.theoreticalRTP = theo;
  r.discreteWinPct = pr * 100;
  r.theoreticalEdgePct = (1 - theo) * 100;
  r.se = se;
  r.deltaSE = Math.abs(simRtp - theo) / se;   // 0
  r.tolSE = 5;
  r.withinTol = true;
}

// 4. every convergence point EXACTLY on theory, identity fields kept consistent
const rc = p1.rtpConvergence;
const convTheo = theoreticalRTP(rc.params);
for (const pt of rc.points) pt.rtp = convTheo;
rc.theoreticalRTP = convTheo;
rc.multiplier = quotedMultiplier(rc.params);
rc.finalRTP = rc.points[rc.points.length - 1].rtp;
rc.finalRTPRunning = rc.finalRTP;

fs.writeFileSync(simPath, JSON.stringify(sim, null, 2));

// 5. RE-PIN, exactly as a fabricating auditor would in the same commit. Without this the forgery is
//    stopped by the hash and we learn only that the hash works.
const cfgPath = path.join(repo, 'src/config.ts');
let cfg = fs.readFileSync(cfgPath, 'utf8');
const newSha = crypto.createHash('sha256').update(fs.readFileSync(simPath)).digest('hex');
cfg = cfg.replace(/export const SIMULATION_SHA256 = '[0-9a-f]{64}'/, `export const SIMULATION_SHA256 = '${newSha}'`);
fs.writeFileSync(cfgPath, cfg);
console.log(`forged Pass 1 written and SIMULATION_SHA256 re-pinned to ${newSha}`);
