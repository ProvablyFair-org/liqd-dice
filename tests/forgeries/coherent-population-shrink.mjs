// Dataset counterexample: a COHERENT population shrink. Delete every nonce >= 30 from every epoch,
// then make the file agree with itself: meta.plannedTotal, meta.phases[].bets, every capture
// record's bets / verifierReplies, every seed record's nonceEnd and plannedBets, and re-pin
// DATASET_SHA256. A suite that takes its population from the dataset's own header returns a Full
// Pass on the shrunken file. Steps 4 and 11 take it from src/config.ts (G-BIND) and must fail.
//
// usage: node coherent-population-shrink.mjs <sandboxRepo>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = process.argv[2];
const KEEP = 30;
const dsPath = path.join(repo, 'data/dice-prod-5935bets.json');
const ds = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
const before = ds.bets.length;

ds.bets = ds.bets.filter((b) => b.nonce < KEEP);
const byPhase = {}, byCapture = {};
for (const b of ds.bets) { byPhase[b.phaseId] = (byPhase[b.phaseId] ?? 0) + 1; byCapture[b.capture] = (byCapture[b.capture] ?? 0) + 1; }
ds.meta.plannedTotal = ds.bets.length;
for (const k of Object.keys(ds.meta.phases)) ds.meta.phases[k].bets = byPhase[k] ?? 0;
for (const c of ds.meta.captures) {
  c.bets = byCapture[c.index] ?? 0; c.verifierReplies = c.bets;
  for (const k of Object.keys(c.phases)) c.phases[k].bets = byPhase[k] ?? 0;
}
for (const s of ds.seeds) { s.nonceEnd = KEEP - 1; s.plannedBets = KEEP; }

fs.writeFileSync(dsPath, JSON.stringify(ds, null, 2));
const newSha = crypto.createHash('sha256').update(fs.readFileSync(dsPath)).digest('hex');
const cfgPath = path.join(repo, 'src/config.ts');
let cfg = fs.readFileSync(cfgPath, 'utf8');
cfg = cfg.replace(/export const DATASET_SHA256 = '[0-9a-f]{64}'/, `export const DATASET_SHA256 = '${newSha}'`);
fs.writeFileSync(cfgPath, cfg);
console.log(`bets ${before} -> ${ds.bets.length}; every epoch cut to ${KEEP} rounds; phases ${JSON.stringify(byPhase)}; DATASET_SHA256 re-pinned to ${newSha}`);
