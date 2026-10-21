/**
 * The audit's draw-bias bound for LIQD Dice (DICE-08, scored in Step 5).
 *
 * OUR audit helper, not part of the RNG: moved here from src/rng.ts on 20 Oct 2026 when src/rng.ts
 * was replaced by the module rebuilt from docs/ALGORITHM.md. It reads the rebuilt module's own
 * `maxFairFor`, so the bound describes the window the live draw (`generateProvablyFairNumber`)
 * applies, and nothing here re-implements the draw.
 */
import { maxFairFor } from './rng';
import { RANGE } from './config';

/**
 * THE DRAW BIAS BOUND, COMPUTED FROM THE SAME NUMBERS THE DRAW USES.
 *
 * Every other RNG step proves the draw REPRODUCES — that the roll recorded is the roll the declared
 * algorithm computes from the revealed seed. None of them asks whether that algorithm draws the
 * 10,000 lattice points EQUALLY. If the accepted window `[0, maxFair)` did not hold a WHOLE number
 * of ranges, the low residues would be over-represented, and every one of the 6,700 exact
 * recomputations in Step 5 would be an exact recomputation of a BIASED draw — Step 5 recomputes the
 * roll against the same helper, so it cannot see the bias on its own.
 *
 * This recomputes the bound from `RANGE` and the SAME `maxFairFor(RANGE)` the draw applies, so the
 * numbers a step prints describe the code that produced the rolls, not a claim typed beside it.
 * Because `maxFairFor(range) = floor(2^32/range) × range` is by construction a whole multiple of
 * `range`, the accepted window divides exactly: every residue 0..range−1 is produced by exactly
 * `maxFair / range` of the accepted uint32 values, its conditional probability given acceptance is
 * exactly 1/range and the worst-case bias is 0 — well inside the profile's 2^-32 ceiling. The
 * rejection census (how many of the 2^32 chunk values fall in the discarded tail `[maxFair, 2^32)`)
 * is returned too, as the profile asks when rejection sampling is the mechanism.
 *
 * NOTE this is an ARITHMETIC property of the audit module's constants — it holds for
 * every possible seed, not only the 6,700 captured. It does NOT exercise the operator-side reject
 * branch, which no captured bet's first chunk reached (declared limitation L11, unchanged).
 *
 * Returned as numbers, never as a sentence: the profile's floor is 2^-32 and a reader has to be able
 * to compare the two.
 */
export function drawBiasBound(): {
  algorithm: 'uint32-rejection-mod-range';
  range: number;
  domainSize: number;
  maxFair: number;
  rangesAccepted: number;
  remainder: number;
  wholeNumberOfRanges: boolean;
  minResidueCount: number;
  maxResidueCount: number;
  bias: number;
  exact: boolean;
  rejectionSampling: boolean;
  rejectedDrawsPerChunk: number;
  rejectionProbabilityPerChunk: number;
} {
  const range = RANGE;
  const domainSize = 0x1_0000_0000;             // 2^32 possible uint32 chunk values (0 .. 2^32−1)
  const maxFair = maxFairFor(range);            // the SAME bound the live draw applies
  const rangesAccepted = Math.floor(maxFair / range);
  const remainder = maxFair % range;            // 0 ⇒ the accepted window holds a whole number of ranges
  // Residue counts across the ACCEPTED window [0, maxFair): a value v is accepted iff v < maxFair,
  // and each residue r is produced by floor((maxFair − 1 − r) / range) + 1 accepted values.
  const minResidueCount = Math.floor(maxFair / range);
  const maxResidueCount = remainder === 0 ? minResidueCount : minResidueCount + 1;
  // Bias = the largest gap between any residue's share of the accepted window and the ideal 1/range.
  const bias = Math.max(
    maxResidueCount / maxFair - 1 / range,
    1 / range - minResidueCount / maxFair,
  );
  const rejectedDrawsPerChunk = domainSize - maxFair;  // values in the discarded tail [maxFair, 2^32)
  return {
    algorithm: 'uint32-rejection-mod-range',
    range,
    domainSize,
    maxFair,
    rangesAccepted,
    remainder,
    wholeNumberOfRanges: remainder === 0,
    minResidueCount,
    maxResidueCount,
    bias,
    exact: remainder === 0,
    rejectionSampling: true,
    rejectedDrawsPerChunk,
    rejectionProbabilityPerChunk: rejectedDrawsPerChunk / domainSize,
  };
}
