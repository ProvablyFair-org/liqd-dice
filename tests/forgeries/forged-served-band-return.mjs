// Cherry-pick counterexample, executed: forge ONE revealed epoch's early-window served-band return
// to an anomalously LOW value — the exact shape a cherry-picking operator's short early window would
// take — and coherently reduce the stored aggregate `totalEarlyReturn` by the same delta so the
// aggregate self-reconciles. Then re-pin SIMULATION_SHA256 so the forgery is scored by Step 17's
// re-derivation rather than stopped by the hash.
//
// WHAT MUST REJECT IT: Step 17 re-derives every per-epoch early/reference return from the revealed
// seed at 10,000 nonces/seed and compares with EXACT equality. The forged row no longer equals its
// own re-derivation, so the step HARD-FAILS on a per-epoch mismatch — and it does so EVEN THOUGH the
// stored aggregate was doctored to reconcile, which is the point: the load-bearing check is the
// per-epoch re-derivation, not a self-consistent aggregate. (The aggregate z the step tests for a
// cherry-pick is itself RE-DERIVED from the revealed seeds, so a forger cannot move it by editing the
// artifact at all.)
//
// usage: node forged-served-band-return.mjs <sandboxRepo>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const repo = process.argv[2];
const simPath = path.join(repo, 'outputs/simulation-results.json');
const sim = JSON.parse(fs.readFileSync(simPath, 'utf8'));

const sb = sim.pass2 && sim.pass2.servedBand;
if (!sb || !Array.isArray(sb.perEpoch) || sb.perEpoch.length === 0) {
  console.error('forged-served-band-return: pass2.servedBand.perEpoch absent — nothing to forge');
  process.exit(1);
}

// Forge the first epoch's early return to zero — a maximally player-unfavourable early window — and
// keep the aggregate coherent so ONLY the per-epoch re-derivation can catch it.
const row = sb.perEpoch[0];
const delta = row.earlyReturn;                 // remove this epoch's whole early return
row.earlyReturn = 0;
sb.totalEarlyReturn = sb.totalEarlyReturn - delta;

fs.writeFileSync(simPath, JSON.stringify(sim, null, 2));

// RE-PIN, exactly as a fabricating auditor would in the same commit.
const cfgPath = path.join(repo, 'src/config.ts');
let cfg = fs.readFileSync(cfgPath, 'utf8');
const newSha = crypto.createHash('sha256').update(fs.readFileSync(simPath)).digest('hex');
cfg = cfg.replace(/export const SIMULATION_SHA256 = '[0-9a-f]{64}'/, `export const SIMULATION_SHA256 = '${newSha}'`);
fs.writeFileSync(cfgPath, cfg);
console.log(`forged servedBand.perEpoch[0].earlyReturn ${delta} -> 0 (aggregate kept coherent) and SIMULATION_SHA256 re-pinned to ${newSha}`);
