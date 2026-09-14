/**
 * Steps 5–6: RNG Determinism & Win-Rule Reproduction
 * The heart of provable fairness: every served roll and win flag must recompute from the
 * revealed (serverSeed, clientSeed, nonce) with the published algorithm — no operator trust.
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { diceRoll } from '../../src/rng';
import { diceWin, servedRollMatches } from '../../src/config';

export function run(ctx: VerifyContext): StepResult[] {
  const { bets, seedMap } = ctx;

  // ── Step 5: Roll recomputation ───────────────────────────────────────────────
  let checked = 0, mismatches = 0;
  let sample = '';
  for (const b of bets) {
    const ss = seedMap.get(b.hashedServerSeed);
    if (!ss) continue;
    const local = diceRoll(ss, b.clientSeed, b.nonce);
    const served = Number(b.roll);
    if (!servedRollMatches(served, local)) { mismatches++; if (!sample) sample = `epoch ${b.epoch} nonce ${b.nonce}: local ${local} vs served ${b.roll}`; }
    checked++;
  }
  const s5 = step(5, 'Roll Recomputation',
    mismatches === 0 && checked === bets.length ? 'PASS' : 'FAIL',
    mismatches === 0
      ? `${checked}/${bets.length} bets: diceRoll(serverSeed, clientSeed, nonce) == served roll (byte-identical)`
      : `${mismatches} mismatches (e.g. ${sample})`,
  );

  // ── Step 6: Win-rule reproduction ────────────────────────────────────────────
  // The recomputed roll under the published band rule must reproduce the served win flag.
  let winChecked = 0, winFails = 0;
  for (const b of bets) {
    const ss = seedMap.get(b.hashedServerSeed);
    if (!ss) continue;
    const local = diceRoll(ss, b.clientSeed, b.nonce);
    if (diceWin(local, b.params) !== !!b.win) winFails++;
    winChecked++;
  }
  const s6 = step(6, 'Win-Rule Reproduction',
    winFails === 0 && winChecked === bets.length ? 'PASS' : 'FAIL',
    winFails === 0
      ? `${winChecked}/${bets.length} bets: recomputed roll ∈/∉ band reproduces the served win flag (inverted honoured)`
      : `${winFails} win-flag mismatches`,
  );

  return [s5, s6];
}
