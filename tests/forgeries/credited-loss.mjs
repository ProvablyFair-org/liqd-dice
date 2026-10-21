// Step 9 counterexample: credit ONE losing bet with 0.00000001 (one settlement unit), then re-pin
// DATASET_SHA256 (a forger edits the file and re-pins in the same commit). Step 9 (Loss Settlement)
// must then find a losing row whose recorded credit is not zero. Until this entry existed no
// registry entry failed Step 9, although the step can fail.
//
// usage: node credited-loss.mjs <sandboxRepo>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = process.argv[2];
const dsPath = path.join(repo, 'data/dice-master-6700bets.json');
const ds = JSON.parse(fs.readFileSync(dsPath, 'utf8'));

const target = ds.bets.find((b) => !b.win && Number(b.winningAmount) === 0);
if (!target) { console.error('no losing bet found'); process.exit(1); }
target.winningAmount = 0.00000001;

fs.writeFileSync(dsPath, JSON.stringify(ds, null, 2));
const newSha = crypto.createHash('sha256').update(fs.readFileSync(dsPath)).digest('hex');
const cfgPath = path.join(repo, 'src/config.ts');
let cfg = fs.readFileSync(cfgPath, 'utf8');
cfg = cfg.replace(/export const DATASET_SHA256 = '[0-9a-f]{64}'/, `export const DATASET_SHA256 = '${newSha}'`);
fs.writeFileSync(cfgPath, cfg);
console.log(`epoch ${target.epoch} nonce ${target.nonce}: losing bet credited 0.00000001; DATASET_SHA256 re-pinned to ${newSha}`);
