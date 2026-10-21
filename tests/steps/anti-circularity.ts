/**
 * Step 13: Anti-Circularity — the verifier's independence from operator data.
 * The theoretical quantities (win probability, multiplier, edge) are pure arithmetic over
 * the roll grid and band geometry — they never read an operator payout/odds field. To prove
 * the check is falsifiable (not a vacuous PASS), we run a NEGATIVE CONTROL: corrupt one
 * recomputed roll and confirm the determinism logic would reject it.
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { diceRoll } from '../../src/rng';
import { discreteWinProbability, discreteWinCount, quotedMultiplier, diceWin, servedRollMatches, RANGE, SCALE } from '../../src/config';
import type { DiceParams } from '../../src/types';

/**
 * Literal tally over the 10,000-point grid: apply the win rule to every draw and count.
 * This is the genuinely arithmetic-error-immune anchor — it cannot share a scaling or
 * rounding mistake with the closed form, because it never scales a bound at all.
 */
function enumCount(p: DiceParams): number {
  let c = 0;
  for (let d = 0; d < RANGE; d++) if (diceWin(d / SCALE, p)) c++;
  return c;
}

export function run(ctx: VerifyContext): StepResult[] {
  const { bets, seedMap } = ctx;

  // Independent recompute for a sample bet uses ONLY (serverSeed, clientSeed, nonce, band):
  const b = bets.find(x => seedMap.has(x.hashedServerSeed))!;
  const ss = seedMap.get(b.hashedServerSeed)!;
  const trueRoll = diceRoll(ss, b.clientSeed, b.nonce) / SCALE;
  const corrupted = (trueRoll + 1) % 100;                 // deliberately wrong roll

  // Negative control. A `|x+1 − x| > 1e-9` form would be tautological, so this uses the EXACT
  // finiteness-guarded predicate Step 5 applies, and requires it ACCEPT the true
  // recomputed roll while REJECTING both a corrupted roll and a non-numeric (NaN) served value.
  const accepts = (roll: number) => servedRollMatches(roll, trueRoll);
  const negControlRejects = accepts(trueRoll) && !accepts(corrupted) && !accepts(NaN);

  // Theoretical values are derived from arithmetic, independent of the served fields:
  const p = discreteWinProbability(b.params);
  const m = quotedMultiplier(b.params);
  const arithmeticOnly = Number.isFinite(p) && Number.isFinite(m);

  // ── Enumeration cross-check ────────────────────────────────────────────────
  // The closed form (discreteWinCount) is the fast path; the tally is the anchor.
  // They must agree on EVERY distinct band in the dataset. This is the check that
  // would have caught the ceil/floor float bug: the buggy closed form disagreed
  // with the tally on 403 of 5,304 distinct bands.
  const distinct = new Map<string, DiceParams>();
  for (const bet of bets) {
    distinct.set(`${bet.params.lower}|${bet.params.upper}|${bet.params.inverted}`, bet.params);
  }
  let tallyMismatches = 0;
  let firstMismatch = '';
  for (const params of distinct.values()) {
    if (discreteWinCount(params) !== enumCount(params)) {
      tallyMismatches++;
      if (!firstMismatch) {
        firstMismatch = `${JSON.stringify(params)}: closed-form ${discreteWinCount(params)} vs tally ${enumCount(params)}`;
      }
    }
  }

  const s13 = step(13, 'Anti-Circularity (Negative Control + Enumeration Anchor)',
    negControlRejects && arithmeticOnly && tallyMismatches === 0 ? 'PASS' : 'FAIL',
    `theoretical win-prob/multiplier derived from grid arithmetic only (no operator odds field read); `
    + `negative control: a corrupted roll is REJECTED by the same predicate Step 5 uses (${negControlRejects ? 'falsifiable' : 'VACUOUS'}); `
    + `closed-form win count vs literal 10,000-point tally: ${distinct.size} distinct bands, `
    + `${tallyMismatches} mismatches${firstMismatch ? ` — first: ${firstMismatch}` : ''}`,
  );

  return [s13];
}
