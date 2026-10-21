// Step 3 counterexample: relabel ONE bet with ANOTHER period's commitment hash, then re-pin
// DATASET_SHA256 (a forger edits the file and re-pins in the same commit). Step 3 (Hash
// Consistency Within Epoch) must then find an epoch whose bets do not share one hashedServerSeed.
// Until this entry existed no registry entry failed Step 3, although the step can fail.
//
// usage: node relabelled-commitment-hash.mjs <sandboxRepo>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = process.argv[2];
const dsPath = path.join(repo, 'data/dice-master-6700bets.json');
const ds = JSON.parse(fs.readFileSync(dsPath, 'utf8'));

const target = ds.bets.find((b) => b.epoch === 0);
const donor = ds.bets.find((b) => b.epoch !== 0 && b.hashedServerSeed !== target.hashedServerSeed);
if (!target || !donor) { console.error('no epoch-0 bet or no donor period found'); process.exit(1); }
const before = target.hashedServerSeed;
target.hashedServerSeed = donor.hashedServerSeed;

fs.writeFileSync(dsPath, JSON.stringify(ds, null, 2));
const newSha = crypto.createHash('sha256').update(fs.readFileSync(dsPath)).digest('hex');
const cfgPath = path.join(repo, 'src/config.ts');
let cfg = fs.readFileSync(cfgPath, 'utf8');
cfg = cfg.replace(/export const DATASET_SHA256 = '[0-9a-f]{64}'/, `export const DATASET_SHA256 = '${newSha}'`);
fs.writeFileSync(cfgPath, cfg);
console.log(`epoch 0 nonce ${target.nonce}: hashedServerSeed ${before.slice(0, 12)}… -> ${donor.hashedServerSeed.slice(0, 12)}… (epoch ${donor.epoch}); DATASET_SHA256 re-pinned to ${newSha}`);
