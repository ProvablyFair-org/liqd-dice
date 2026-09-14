/**
 * Recorded Dice model: uniform 0..9999 draw; half-open [lower, upper) win bands.
 * RTP and settlement derivations: AUDIT_CONTEXT.md §§4–5. Boundary and rounding
 * premises are stated there; matching the sample does not expose backend code.
 */
export const RANGE = 10000;        // integer draw domain 0..9999
export const CURSOR = 0;           // fixed HMAC cursor for the single dice draw
export const SCALE = 100;          // roll = draw / 100  → 2 decimals, ceiling 99.99
export const HOUSE_EDGE = 0.01;
export const MIN_ODDS = 1.0102;
export const MAX_ODDS = 9900;   // audit bound; E14 attests acceptance of a losing bet, not maximum enforcement

export const SIM_UNIFORMITY_DRAWS = 2_000_000;
export const SIM_SERIAL_DRAWS = 200_000;
export const SIM_EDGE_BETS = 2_000_000;
export const SIM_RTP_BETS = 20_000_000;
/** The sample sizes the convergence series must contain, in order. */
export const SIM_RTP_MARKS: readonly number[] = [1_000, 10_000, 100_000, 1_000_000, 5_000_000, 10_000_000, SIM_RTP_BETS];
/** Pass-2 cherry-pick screen geometry: one window is SIM_CHERRY_WINDOW draws over SIM_CHERRY_BINS bins. */
export const SIM_CHERRY_BINS = 20;
export const SIM_CHERRY_WINDOW = 50;
/** Nominal per-window screening threshold. The ACHIEVED rate is derived in src/exact-chi2.ts. */
export const SIM_CHERRY_SEED_ALPHA = 0.05;

export const ALPHA = 0.01;

/** Bonferroni family: uniformity, lag-1 and runs; no independence assumption required. */
export const ALPHA_SCREENS = 3;
export const ALPHA_SCREEN = ALPHA / ALPHA_SCREENS;

/**
 * SHA-256 of the pinned capture. Single-sourced here so the producer (`src/simulate.ts`) and the
 * verifier (`tests/verify.ts`) cannot pin different datasets.
 */
export const DATASET_SHA256 = 'ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34';

export const EXPECTED_BETS = 6700;
export const EXPECTED_SEEDS = 134;
export const EXPECTED_EPOCH_SIZE = 50;
/** Bets per capture phase. The plan, in code — not `meta.phases`, which is inside the evidence. */
export const EXPECTED_PHASE_BETS: Readonly<Record<string, number>> = { A: 5000, B: 1000, C: 200, D: 500 };

export const SIMULATION_SHA256 = '3da35d94342153d4f5345f5e8bdbc3cdfef5139bd752d3680898b35ffcbceebd';
export const SIMULATION_HTML_SHA256 = 'dadbd1859cff586eb42b96212d8d4271d578f9235d2a0bdbfe27d1dcf978f9be';

import type { DiceParams } from './types';

export const SIM_EDGE_BANDS: readonly { label: string; params: DiceParams }[] = [
  { label: 'under 50 (1.98×)', params: { lower: 0, upper: 50, inverted: false } },
  { label: 'over 50 (1.98×)', params: { lower: 50, upper: 100, inverted: false } },
  { label: 'under 10 (9.9×)', params: { lower: 0, upper: 10, inverted: false } },
  { label: 'over 90 (9.9×)', params: { lower: 90, upper: 100, inverted: false } },
  { label: 'inside 25-75 (1.98×)', params: { lower: 25, upper: 75, inverted: false } },
  { label: 'outside 25-75 (1.98×)', params: { lower: 25, upper: 75, inverted: true } },
  { label: 'over 98 (49.5×)', params: { lower: 98, upper: 100, inverted: false } },
  { label: 'over 99 (99×)', params: { lower: 99, upper: 100, inverted: false } },
  { label: 'under 1 (99×)', params: { lower: 0, upper: 1, inverted: false } },
];

/** The RTP-convergence strategy band — one definition, read by both the producer and Step 16. */
export const SIM_RTP_STRATEGY: DiceParams = { lower: 0, upper: 50, inverted: false };

/** Stable key for a band, for set-identity comparisons. */
export function bandKey(p: DiceParams): string {
  return `${p.lower}|${p.upper}|${p.inverted ? 1 : 0}`;
}

/** Continuous win chance in PERCENT under the recorded band model. */
export function continuousWinChancePct(p: DiceParams): number {
  const width = p.upper - p.lower;
  return p.inverted ? 100 - width : width;
}

/** Quotient model matching all 2,807 captured winning multipliers bit-for-bit.
 * Basis points are reconstructed from the band; backend implementation is unobserved.
 */
export const PAYOUT_NUMERATOR = (1 - HOUSE_EDGE) * 10000;   // exactly 9900 at a 1% edge
export function payoutBasisPoints(p: DiceParams): number {
  return Math.round(continuousWinChancePct(p) * 100);
}

export function quotedMultiplier(p: DiceParams): number {
  const wc = continuousWinChancePct(p);
  return wc > 0 ? (100 / wc) * (1 - HOUSE_EDGE) : 0;
}

export function discreteWinCount(p: DiceParams): number {
  const lo = Math.round(p.lower * SCALE);
  const hi = Math.round(p.upper * SCALE);
  if (Math.abs(p.lower * SCALE - lo) > 1e-6 || Math.abs(p.upper * SCALE - hi) > 1e-6) {
    throw new Error(`non-2dp band bound: ${JSON.stringify(p)}`);
  }
  // [lo, hi) clamped to the grid [0, RANGE)
  const inBand = Math.max(0, Math.min(RANGE, hi) - Math.max(0, lo));
  return p.inverted ? RANGE - inBand : inBand;
}

/** Modeled discrete win probability = winning outcomes / 10000. */
export function discreteWinProbability(p: DiceParams): number {
  return discreteWinCount(p) / RANGE;
}

/**
 * Win rule applied to a served roll — HALF-OPEN band [lower, upper), honouring `inverted`.
 * Boundary semantics pinned by operator-verifier probes with the roll exactly on each
 * bound (E13): roll == lower wins, roll == upper loses; inverted is the exact complement.
 */
export function diceWin(roll: number, p: DiceParams): boolean {
  const inBand = roll >= p.lower && roll < p.upper;
  return p.inverted ? !inBand : inBand;
}

/** Modeled edge before settlement rounding: 1 − P_discrete × quotedMultiplier.
 * The integer identity below proves the algebra; this float form supports reporting.
 */
export function effectiveEdge(p: DiceParams): number {
  return 1 - discreteWinProbability(p) * quotedMultiplier(p);
}

export function effectiveEdgeIsExact(p: DiceParams): boolean {
  const bps = payoutBasisPoints(p);
  if (bps <= 0) return false;
  if (!Number.isInteger(PAYOUT_NUMERATOR)) return false;   // the identity is only integral at an edge where it is
  return 100 * discreteWinCount(p) * PAYOUT_NUMERATOR === (PAYOUT_NUMERATOR / 100) * RANGE * bps;
}

/** Theoretical RTP for a band = P_discrete · quotedMultiplier = 1 − effectiveEdge. */
export function theoreticalRTP(p: DiceParams): number {
  return discreteWinProbability(p) * quotedMultiplier(p);
}

export function servedRollMatches(served: number, recomputed: number): boolean {
  if (!Number.isFinite(served) || !Number.isFinite(recomputed)) return false;
  const units = Math.round(served * SCALE);
  if (units / SCALE !== served) return false;            // served value is not on the 2-dp grid
  if (units < 0 || units >= RANGE) return false;         // outside the roll domain
  return served === recomputed;
}

/** Round to 8 decimal places (nearest; strips IEEE-754 dust from an already-8-dp value). */
export function round8(x: number): number {
  return Math.round(x * 1e8) / 1e8;
}

const UNITS_PER_WHOLE = 100_000_000n;      // 1e8 — the settlement grid
const HALF_UNIT = 50_000_000n;             // 0.5 · 1e8, the exact half-even tie point

export function creditResidualSign(credit: number | string, stake: number | string, p: DiceParams): -1 | 0 | 1 {
  const bps = payoutBasisPoints(p);
  if (bps <= 0) return 0;
  const [cn, cd] = decimalFraction(credit);
  const [sn, sd] = decimalFraction(stake);
  // compare cn/cd against (sn/sd)·(PAYOUT_NUMERATOR/bps)
  const num = BigInt(PAYOUT_NUMERATOR);
  const lhs = cn * sd * BigInt(bps);
  const rhs = sn * cd * num;
  return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}

/** Exact residual (settled credit − stake × multiplier) as a double, from the same exact rational. */
export function creditResidual(credit: number | string, stake: number | string, p: DiceParams): number {
  const bps = payoutBasisPoints(p);
  if (bps <= 0) return 0;
  const [cn, cd] = decimalFraction(credit);
  const [sn, sd] = decimalFraction(stake);
  const num = BigInt(PAYOUT_NUMERATOR);
  // (cn/cd) − (sn·num)/(sd·bps)  =  (cn·sd·bps − sn·num·cd) / (cd·sd·bps)
  const rn = cn * sd * BigInt(bps) - sn * num * cd;
  const rd = cd * sd * BigInt(bps);
  return Number(rn) / Number(rd);
}

/** Interpret a recorded decimal representation as an exact rational.
 * Number inputs use their round-trip decimal text. Original HTTP numeric text was
 * not retained in this capture; string inputs can preserve it in future captures.
 */
function decimalFraction(x: number | string): [bigint, bigint] {
  const s = typeof x === 'string' ? x.trim() : String(x);
  const m = /^(-?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
  if (!m) throw new Error(`decimalFraction: not a decimal literal: ${s}`);
  const sign = m[1] === '-' ? -1n : 1n;
  const intPart = m[2] || '0';
  const fracPart = m[3] || '';
  const exp = m[4] ? Number(m[4]) : 0;
  let n = sign * BigInt(intPart + fracPart);
  let d = 10n ** BigInt(fracPart.length);
  if (exp > 0) n *= 10n ** BigInt(exp);
  else if (exp < 0) d *= 10n ** BigInt(-exp);
  return [n, d];
}

/** The credit in exact integer 1e-8 units — the form with no rounding ambiguity at all. */
/** Two-stage 8-dp settlement: multiplier half-up, then product half-even.
 * The multiplier tie mode is assumed; observed product ties support half-even (§5).
 */
export function settledCreditUnits(stake: number, multiplier: number): bigint {
  const stakeUnits = BigInt(Math.round(stake * 1e8));
  const multUnits = BigInt(Math.round(multiplier * 1e8));   // stage 1: ROUND_8(multiplier)
  const product = stakeUnits * multUnits;                   // in 1e-16 units
  let q = product / UNITS_PER_WHOLE;
  const r = product % UNITS_PER_WHOLE;
  if (r > HALF_UNIT) q += 1n;
  else if (r === HALF_UNIT && (q % 2n) === 1n) q += 1n;     // exact tie → round to even
  return q;
}

export function settledCredit(stake: number, multiplier: number): number {
  const units = settledCreditUnits(stake, multiplier);
  if (units > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`settledCredit: ${units} units exceeds exact double range — use settledCreditUnits`);
  }
  return Number(units) / 1e8;
}

export function isSettlementTie(stake: number, multiplier: number): boolean {
  const product = BigInt(Math.round(stake * 1e8)) * BigInt(Math.round(multiplier * 1e8));
  return product % UNITS_PER_WHOLE === HALF_UNIT;
}

/** Mode label for a band, for reporting/aggregation. */
export function bandMode(p: DiceParams): 'under' | 'over' | 'inside' | 'outside' {
  if (p.inverted) return 'outside';
  if (p.lower === 0) return 'under';
  if (p.upper === 100) return 'over';
  return 'inside';
}
