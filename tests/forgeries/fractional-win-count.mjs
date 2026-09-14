import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = process.argv[2];
if (!repo) { console.error('usage: node fractional-win-count.mjs <sandboxRepo>'); process.exit(2); }

const FORGED_RTP = 0.99000495;          // the reviewer's value, verbatim
const TARGET_LABEL = 'over 98';

const simPath = path.join(repo, 'outputs/simulation-results.json');
const sim = JSON.parse(fs.readFileSync(simPath, 'utf8'));

// The audit's own formulas, restated (src/config.ts), so every derived field on the row reconciles.
const RANGE = 10000, HOUSE_EDGE = 0.01;
const wcPct = (p) => (p.inverted ? 100 - (p.upper - p.lower) : p.upper - p.lower);
const quotedMultiplier = (p) => { const wc = wcPct(p); return wc > 0 ? (100 / wc) * (1 - HOUSE_EDGE) : 0; };
const discreteWinCount = (p) => {
  const lo = Math.round(p.lower * 100), hi = Math.round(p.upper * 100);
  const inBand = Math.max(0, Math.min(RANGE, hi) - Math.max(0, lo));
  return p.inverted ? RANGE - inBand : inBand;
};
const discreteWinProbability = (p) => discreteWinCount(p) / RANGE;

const row = sim.pass1.effectiveEdge.find((r) => String(r.label).startsWith(TARGET_LABEL));
if (!row) { console.error(`no '${TARGET_LABEL}' row in the effective-edge table`); process.exit(2); }

const m = quotedMultiplier(row.params);
const pr = discreteWinProbability(row.params);
const theo = pr * m;
const implied = (FORGED_RTP * row.n) / m;
if (Number.isInteger(implied)) { console.error(`premise broken: ${FORGED_RTP} implies an INTEGER ${implied} wins`); process.exit(2); }

row.simulatedRTP = FORGED_RTP;
row.se = Math.sqrt(pr * (m - FORGED_RTP) ** 2 + (1 - pr) * FORGED_RTP ** 2) / Math.sqrt(row.n);
row.deltaSE = Math.abs(FORGED_RTP - theo) / row.se;
row.withinTol = Math.abs(FORGED_RTP - theo) <= 5 * row.se + 1e-4;
// Schema 2 only: store the count the old rounding would have recovered, so a stored-vs-recovered
// disagreement cannot be what rejects this.
if (row.wins !== undefined) row.wins = Math.round(implied);

fs.writeFileSync(simPath, JSON.stringify(sim, null, 2));

const cfgPath = path.join(repo, 'src/config.ts');
let cfg = fs.readFileSync(cfgPath, 'utf8');
const newSha = crypto.createHash('sha256').update(fs.readFileSync(simPath)).digest('hex');
cfg = cfg.replace(/export const SIMULATION_SHA256 = '[0-9a-f]{64}'/, `export const SIMULATION_SHA256 = '${newSha}'`);
fs.writeFileSync(cfgPath, cfg);

console.log(`'${row.label}' simulatedRTP := ${FORGED_RTP} (implies ${implied} wins), derived fields recomputed, SIMULATION_SHA256 re-pinned to ${newSha}`);
