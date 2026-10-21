// Reviewer A's dataset counterexample, executed verbatim: delete nonces 30..49 from every epoch
// (6,700 -> 4,020 bets), set meta.epochSize = 30, meta.plannedTotal = 4020, meta.phases to the new
// counts, every seeds[].nonceEnd = 29, then re-pin DATASET_SHA256. Before the G-BIND fix this
// returned 21/21 PROVABLY FAIR — Full Pass on a 4,020-bet dataset.
//
// usage: node shrink-population.mjs <sandboxRepo>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = process.argv[2];
const KEEP = 30;
const dsPath = path.join(repo, 'data/dice-master-6700bets.json');
const ds = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
const before = ds.bets.length;

ds.bets = ds.bets.filter((b) => b.nonce < KEEP);
const byPhase = {};
for (const b of ds.bets) byPhase[b.phase] = (byPhase[b.phase] ?? 0) + 1;
ds.meta.epochSize = KEEP;
ds.meta.plannedTotal = ds.bets.length;
for (const k of Object.keys(ds.meta.phases)) ds.meta.phases[k].bets = byPhase[k] ?? 0;
for (const s of ds.seeds) s.nonceEnd = KEEP - 1;

fs.writeFileSync(dsPath, JSON.stringify(ds, null, 2));
const newSha = crypto.createHash('sha256').update(fs.readFileSync(dsPath)).digest('hex');
const cfgPath = path.join(repo, 'src/config.ts');
let cfg = fs.readFileSync(cfgPath, 'utf8');
cfg = cfg.replace(/export const DATASET_SHA256 = '[0-9a-f]{64}'/, `export const DATASET_SHA256 = '${newSha}'`);
fs.writeFileSync(cfgPath, cfg);
console.log(`bets ${before} -> ${ds.bets.length}; epochSize=${KEEP}; phases ${JSON.stringify(byPhase)}; DATASET_SHA256 re-pinned to ${newSha}`);
