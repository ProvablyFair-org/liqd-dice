/**
 * Steps 5–6: RNG Determinism & Win-Rule Reproduction
 * The heart of provable fairness: every served roll and win flag must recompute from the
 * revealed (serverSeed, clientSeed, nonce) with the published algorithm — no operator trust.
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { diceRoll } from '../../src/rng';
import { drawBiasBound } from '../../src/bias';
import { diceWin, servedRollMatches, SCALE } from '../../src/config';

/**
 * The profile's ceiling on modulo bias (methodology S2, DICE-08): a draw biased by more than one
 * part in 2^32, without rejection sampling to correct it, is a hard fail. Declared here as the
 * number it is so the comparison is arithmetic.
 */
const BIAS_CEILING = Math.pow(2, -32);

export function run(ctx: VerifyContext): StepResult[] {
  const { bets, seedMap } = ctx;

  // ── Step 5: Roll recomputation + draw bias bound ─────────────────────────────
  // DICE-07: every served roll recomputes byte-identically from (serverSeed, clientSeed, nonce).
  // DICE-08: the draw is exactly uniform on its 10,000-point lattice — an arithmetic bound over the
  // same maxFairFor(RANGE) the draw applies, so the step also decides that the roll Step 5
  // recomputes is a draw from a uniform lattice, not an exact recomputation of a biased one.
  let checked = 0, mismatches = 0;
  let sample = '';
  for (const b of bets) {
    const ss = seedMap.get(b.hashedServerSeed);
    if (!ss) continue;
    const local = diceRoll(ss, b.clientSeed, b.nonce) / SCALE;
    const served = Number(b.roll);
    // Finiteness guard: a non-numeric served roll makes
    // `Math.abs(local - NaN) > 1e-9` false, silently passing; reject it explicitly.
    if (!servedRollMatches(served, local)) { mismatches++; if (!sample) sample = `epoch ${b.epoch} nonce ${b.nonce}: local ${local} vs served ${b.roll}`; }
    checked++;
  }
  const rollsOk = mismatches === 0 && checked === bets.length;

  // Draw bias bound (DICE-08). Computed from the same numbers the draw uses; holds for every seed,
  // not only the captured ones. A violation is a HARD FAIL (methodology S2).
  const b = drawBiasBound();
  const biasIssues: string[] = [];
  if (!b.wholeNumberOfRanges) {
    biasIssues.push(
      `MAX_FAIR ${b.maxFair} is not a whole number of ${b.range}-wide ranges `
      + `(${b.maxFair} % ${b.range} = ${b.remainder}); the low ${b.remainder} residues are over-represented`,
    );
  }
  if (!(b.bias <= BIAS_CEILING)) {
    biasIssues.push(`worst-case modulo bias ${b.bias} exceeds the 2^-32 ceiling ${BIAS_CEILING}`);
  }
  const biasOk = biasIssues.length === 0;

  const s5 = step(5, 'Roll Recomputation & Draw Bias Bound',
    rollsOk && biasOk ? 'PASS' : 'FAIL',
    !rollsOk
      ? `${mismatches} roll mismatches (e.g. ${sample})`
      : !biasOk
        ? `DRAW BIAS: ${biasIssues.join('; ')}`
        : `${checked}/${bets.length} bets: diceRoll(serverSeed, clientSeed, nonce) / 100 == served roll (byte-identical). `
          + `Draw uniformity (DICE-08): rejection sampling over the ${b.domainSize.toLocaleString()}-value uint32 domain `
          + `accepts MAX_FAIR = ${b.range} × ${b.rangesAccepted} = ${b.maxFair.toLocaleString()}, an exact whole number of `
          + `ranges, so each of the ${b.range.toLocaleString()} residues receives exactly ${b.rangesAccepted.toLocaleString()} `
          + `of the accepted values and the worst-case modulo bias is ${b.bias}, inside the 2^-32 ceiling `
          + `(${BIAS_CEILING}). Rejection census: ${b.rejectedDrawsPerChunk.toLocaleString()} of ${b.domainSize.toLocaleString()} `
          + `chunk values fall in the discarded tail [MAX_FAIR, 2^32) — a per-chunk rejection probability of `
          + `${b.rejectionProbabilityPerChunk.toExponential(3)}`,
  );

  // ── Step 6: Win-rule reproduction ────────────────────────────────────────────
  // The recomputed roll under the published band rule must reproduce the served win flag.
  let winChecked = 0, winFails = 0;
  for (const b of bets) {
    const ss = seedMap.get(b.hashedServerSeed);
    if (!ss) continue;
    const local = diceRoll(ss, b.clientSeed, b.nonce) / SCALE;
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
