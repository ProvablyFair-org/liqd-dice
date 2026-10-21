/**
 * EXACT null distribution of the Pass-2 cherry-pick statistic.
 *
 * Pass 2 compares each epoch's early window (nonces 0..49) against its late window
 * (nonces 50..99) with a draw-uniformity χ² over SIM_CHERRY_BINS equal bins. Under the
 * null the bin counts are multinomial(n = SIM_CHERRY_WINDOW, 1/BINS each), so the
 * statistic is DISCRETE and its exact distribution is computable — there is no need for
 * a sampled null.
 *
 * WHY THIS EXISTS. A sampled null — a parametric bootstrap drawn inside `simulate.ts` — is
 * resampled on every run, so the SAME 134 revealed seeds yield a different flag count from one
 * rerun to the next, and at the high end the verifier's binomial tail falls below its threshold:
 * a fresh `npm test` fails Step 17 intermittently and additionally prints "DISAGREES with
 * recomputation (tampered?)", because the producer's self-report was written under a different
 * draw of the same null. A verifier whose verdict depends on a random draw is not a verifier.
 *
 * The statistic reduces to a single integer. With e = n/BINS expected per bin,
 *   χ² = Σ (h_i − e)² / e = (Σ h_i² − n²/BINS) / e
 * so χ² is an affine function of the integer SQUARE SUM  S = Σ h_i².  Everything below is
 * therefore computed in S-space, where equality is exact integer equality and no floating
 * comparison can drift: `squareSum()` produces S, `upperTailBySquareSum()` returns the exact
 * P(S ≥ s), and `chi2FromSquareSum()` is only ever used for reporting.
 *
 * The distribution is computed by ENUMERATING every partition of n into at most BINS parts
 * (181,274 of them for n=50/BINS=20) and accumulating, in exact BigInt integer arithmetic,
 * the number of bin assignments that realise each S:
 *
 *     assignments(λ) = ( n! / Π λ_i! ) · ( BINS! / Π_v m_v! )
 *
 * where m_v counts how many bins hold the value v (zeros included). Dividing by BINS^n — also
 * exact — gives the probability. The only floating-point operation in the whole derivation is
 * the final BigInt → double conversion of each probability. `tests/dice/rngTests.ts` re-derives
 * the same distribution by an INDEPENDENT method (a dynamic program over bins, binomial split
 * per bin, doubles throughout) and requires the two to agree — one distribution, two
 * derivations, in the spirit of S-CONST.
 *
 * Cost: ~0.2 s, computed once per process and memoised.
 */

import { SIM_CHERRY_BINS, SIM_CHERRY_WINDOW, SIM_CHERRY_SEED_ALPHA, RANGE } from './config';

export interface ExactNull {
  /** Sorted list of attainable square sums S = Σ h_i². */
  support: number[];
  /** probability[i] = P(S === support[i]). */
  probability: number[];
  /** upperTail[i] = P(S ≥ support[i]). */
  upperTail: number[];
  /** Number of integer partitions enumerated (n into ≤ BINS parts). */
  partitions: number;
}

const BINS = SIM_CHERRY_BINS;
const WINDOW = SIM_CHERRY_WINDOW;

function factorials(upTo: number): bigint[] {
  const f: bigint[] = [1n];
  for (let i = 1; i <= upTo; i++) f.push(f[i - 1] * BigInt(i));
  return f;
}

function build(): ExactNull {
  const fact = factorials(Math.max(WINDOW, BINS));
  const counts = new Map<number, bigint>();
  const parts: number[] = [];
  let partitions = 0;

  // Enumerate partitions of WINDOW into at most BINS parts, in non-increasing order.
  const rec = (remaining: number, maxPart: number, depth: number): void => {
    if (remaining === 0) {
      partitions++;
      let s = 0;
      let denom = 1n;
      const multiplicity = new Map<number, number>();
      for (let i = 0; i < depth; i++) {
        const v = parts[i];
        s += v * v;
        denom *= fact[v];
        multiplicity.set(v, (multiplicity.get(v) ?? 0) + 1);
      }
      multiplicity.set(0, BINS - depth);            // the empty bins are part of the arrangement
      let arrangeDenom = 1n;
      for (const m of multiplicity.values()) arrangeDenom *= fact[m];
      const ways = (fact[WINDOW] / denom) * (fact[BINS] / arrangeDenom);
      counts.set(s, (counts.get(s) ?? 0n) + ways);
      return;
    }
    if (depth === BINS) return;
    const hi = Math.min(remaining, maxPart);
    for (let v = hi; v >= 1; v--) {
      if (v * (BINS - depth) < remaining) break;    // cannot finish with parts ≤ v
      parts[depth] = v;
      rec(remaining - v, v, depth + 1);
    }
  };
  rec(WINDOW, WINDOW, 0);

  const total = BigInt(BINS) ** BigInt(WINDOW);
  const support = [...counts.keys()].sort((a, b) => a - b);
  const totalNum = Number(total);
  const probability = support.map((s) => Number(counts.get(s)!) / totalNum);
  const upperTail = new Array<number>(support.length);
  let acc = 0;
  for (let i = support.length - 1; i >= 0; i--) { acc += probability[i]; upperTail[i] = acc; }
  return { support, probability, upperTail, partitions };
}

let cached: ExactNull | null = null;
/** The exact null, computed once per process. */
export function exactNull(): ExactNull {
  if (!cached) cached = build();
  return cached;
}

/** Bin the draws of one window and return the integer statistic S = Σ h_i². */
export function squareSum(draws: number[]): number {
  const per = RANGE / BINS;
  const h = new Array<number>(BINS).fill(0);
  for (const d of draws) h[Math.min(BINS - 1, Math.floor(d / per))]++;
  let s = 0;
  for (const v of h) s += v * v;
  return s;
}

/** χ² for reporting only — the scored path stays in integer S-space. */
export function chi2FromSquareSum(s: number): number {
  const e = WINDOW / BINS;
  return (s - (WINDOW * WINDOW) / BINS) / e;
}

/** Exact one-sided p-value P(S ≥ s) under the uniform multinomial null. */
export function upperTailBySquareSum(s: number): number {
  const { support, upperTail } = exactNull();
  let lo = 0, hi = support.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (support[mid] < s) lo = mid + 1; else hi = mid; }
  return lo < support.length ? upperTail[lo] : 0;
}

/**
 * ACHIEVED rejection rate of the per-window screen at the nominal SIM_CHERRY_SEED_ALPHA.
 * Because the statistic is discrete, P(p-value < α) is not α: it is the mass of the smallest
 * attainable tail strictly below α. Derived, never typed in.
 */
export function achievedSeedAlpha(): number {
  const { support, upperTail } = exactNull();
  for (let i = 0; i < support.length; i++) if (upperTail[i] < SIM_CHERRY_SEED_ALPHA) return upperTail[i];
  return 0;
}

/**
 * CHERRY_P0 — the probability that one epoch is flagged under the null.
 * A flag needs earlyP < α AND lateP ≥ α on independent windows, so the compound rate is
 * a·(1 − a) with a = achievedSeedAlpha(). This is the ONE definition of the null flag rate:
 * `src/simulate.ts` (producer) and `tests/steps/simulation.ts` (verifier) both import it from
 * here, so a divergence like the shipped 0.0475-vs-0.0438147684 split cannot recur (S-CONST).
 */
export function cherryFlagRate(): number {
  const a = achievedSeedAlpha();
  return a * (1 - a);
}
