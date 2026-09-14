
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
