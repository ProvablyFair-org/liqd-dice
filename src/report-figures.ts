/**
 * Derived report figures — the numbers the report cites that are neither a scored step's verdict
 * nor a simulation statistic, computed here from the pinned dataset and written to
 * `outputs/report-figures.json` by `npm run verify`.
 *
 * WHY THIS FILE EXISTS. A figure that appears only in prose has no producing artifact, and a
 * reader cannot re-derive it without reimplementing the auditor's reasoning. That is the class the
 * framework's prose check calls an "orphan figure", and it is how a hand-typed number survives a
 * review: it looks like a measurement and is actually a memory. Everything below is quoted in the
 * report — the settled-RTP span, the settlement residual's direction, the Phase-D exposure, the
 * boundary-hit expectation — so it is computed by committed code from the hash-pinned capture and
 * emitted, not typed.
 *
 * Where a comparison is at the scale of floating-point noise it is done in EXACT integer or
 * rational arithmetic (see `creditResidualSign`), because a double subtraction at 5e-9 reports the
 * subtraction's own error as if it were the measurement.
 */

import {
  RANGE, SCALE, HOUSE_EDGE, ALPHA, SIM_CHERRY_SEED_ALPHA,
  quotedMultiplier, discreteWinCount, discreteWinProbability,
  settledCreditUnits, creditResidualSign, creditResidual, isSettlementTie,
} from './config';
import { cherryFlagRate } from './exact-chi2';
import { binomialTailP } from './stats';
import type { Bet, Seed } from './types';

export interface ReportFigures {
  bets: number;
  wins: number;
  /** RTP a player actually receives per (band, stake), after 8-dp settlement rounding. */
  settledRtp: {
    belowNominal: number; aboveNominal: number; exactlyNominal: number;
    minPct: number; maxPct: number; nominalPct: number; anyAtOrAbove100: boolean;
  };
  /** Direction of (settled credit − stake × multiplier), decided in exact arithmetic. */
  settlementResidual: {
    roundedDown: number; roundedUp: number; exactlyOnProduct: number;
    maxAbsUsdc: number; netUsdc: number; exactTies: number;
  };
  /** Power of the settled data against the band-boundary rule (E13's subject). */
  boundary: {
    betsWithReachableUpperBound: number; betsWithUnreachableUpperBound: number;
    expectedUpperBoundHits: number; observedUpperBoundHits: number; observedLowerBoundHits: number;
    /** Bets whose served win flag the two candidate rules disagree about. Zero ⇒ zero power. */
    betsWhereBoundaryModelsDisagree: number;
    /** Bets each rule reproduces. Equal counts ⇒ the settled data cannot choose between them. */
    winFlagsReproducedHalfOpen: number; winFlagsReproducedInclusiveBothEnds: number;
  };
  /**
   * Power of the Pass-2 cherry-pick screen: with n seeds at the derived null flag rate p0, the
   * smallest flag count the exact binomial rejects at ALPHA. Below that the screen cannot reject,
   * whatever the operator did.
   */
  cherryPickPower: {
    seeds: number; nullFlagRate: number; expectedFlags: number;
    minRejectableFlags: number; pAtMinRejectable: number; alpha: number; seedAlphaNominal: number;
  };
  /** Phase-D exposure: the epochs whose client seeds were derivable in advance. */
  phaseD: {
    firstEpoch: number; lastEpoch: number; epochs: number; bets: number;
    stakedUsdc: number; paidUsdc: number; expectedUsdc: number; z: number;
  };
  /** Live-bet aggregates (informational — variance illustration, never RTP evidence). */
  live: { wageredUsdc: number; returnedUsdc: number; realizedRtpPct: number; meanRoll: number };
}

export function computeReportFigures(bets: Bet[], seeds: Seed[]): ReportFigures {
  const wins = bets.filter((b) => b.win);

  // ── settled RTP per (band, stake), compared to the nominal 99% in exact integers ──
  // rtp = (W / RANGE) · (creditUnits / stakeUnits)  vs  (1 − HOUSE_EDGE)
  // Both sides are rationals over integers, so the comparison carries no rounding at all.
  const edgeNum = BigInt(Math.round((1 - HOUSE_EDGE) * 1e8));      // 99000000 at a 1% edge
  let below = 0, above = 0, exact = 0, minRtp = Infinity, maxRtp = -Infinity;
  for (const b of bets) {
    const stakeUnits = BigInt(Math.round(Number(b.betAmount) * 1e8));
    const w = BigInt(discreteWinCount(b.params));
    const creditUnits = settledCreditUnits(Number(b.betAmount), quotedMultiplier(b.params));
    // (w/RANGE)·(creditUnits/stakeUnits) vs edgeNum/1e8  ⇒  1e8·w·creditUnits vs edgeNum·RANGE·stakeUnits
    const lhs = 100000000n * w * creditUnits;
    const rhs = edgeNum * BigInt(RANGE) * stakeUnits;
    if (lhs < rhs) below++; else if (lhs > rhs) above++; else exact++;
    const r = (Number(w) / RANGE) * (Number(creditUnits) / Number(stakeUnits));
    if (r < minRtp) minRtp = r;
    if (r > maxRtp) maxRtp = r;
  }

  // ── settlement residual against the raw un-rounded product ────────────────────
  // In the OPERATOR'S number system: decimal stake × the exact rational multiplier 9900/basisPoints.
  // Doing this on binary64(stake) × binary64(multiplier) instead — which is what shipped until
  // 2026-09-09 — reports every win as rounded and none as exact, because the representation error in
  // binary64(0.1) survives into the comparison. See creditResidualSign.
  let down = 0, up = 0, onProduct = 0, maxAbs = 0, net = 0, ties = 0;
  for (const b of wins) {
    const stake = Number(b.betAmount), mult = Number(b.multiplier);
    const sign = creditResidualSign(b.winningAmount, b.betAmount, b.params);
    if (sign < 0) down++; else if (sign > 0) up++; else onProduct++;
    const d = creditResidual(b.winningAmount, b.betAmount, b.params);
    net += d;
    if (Math.abs(d) > maxAbs) maxAbs = Math.abs(d);
    if (isSettlementTie(stake, mult)) ties++;
  }

  // ── boundary power: which bets could ever land on their upper bound at all ────
  // The roll ceiling is (RANGE − 1)/SCALE = 99.99, so a band with upper = 100 has an upper bound
  // no roll can reach — those bets carry ZERO power against the half-open rule.
  const reachable = bets.filter((b) => Math.round(b.params.upper * SCALE) <= RANGE - 1).length;
  const upperHits = bets.filter((b) => Math.round(Number(b.roll) * SCALE) === Math.round(b.params.upper * SCALE)).length;
  const lowerHits = bets.filter((b) => Math.round(Number(b.roll) * SCALE) === Math.round(b.params.lower * SCALE)).length;

  // How much power the SETTLED data has over the half-open rule, measured rather than argued.
  // Rule A (shipped): win ⇔ roll ∈ [lower, upper). Rule B (inclusive comparison model): [lower, upper].
  // If the two reproduce the same 6,700 win flags, no settled bet can choose between them and the
  // whole "effective edge is exactly 1%" headline rests on E13 alone.
  let modelsDisagree = 0, okHalfOpen = 0, okInclusive = 0;
  for (const b of bets) {
    const roll = Number(b.roll), p = b.params;
    const inHalfOpen = roll >= p.lower && roll < p.upper;
    const inInclusive = roll >= p.lower && roll <= p.upper;
    const winHalfOpen = p.inverted ? !inHalfOpen : inHalfOpen;
    const winInclusive = p.inverted ? !inInclusive : inInclusive;
    if (winHalfOpen !== winInclusive) modelsDisagree++;
    if (winHalfOpen === !!b.win) okHalfOpen++;
    if (winInclusive === !!b.win) okInclusive++;
  }

  // Pass-2 screen power: the smallest flag count the exact binomial tail rejects at ALPHA.
  const p0 = cherryFlagRate();
  let minRejectable = seeds.length + 1, pAtMin = 0;
  for (let k = 0; k <= seeds.length; k++) {
    const pk = binomialTailP(seeds.length, k, p0);
    if (pk < ALPHA) { minRejectable = k; pAtMin = pk; break; }
  }

  // ── Phase-D exposure ─────────────────────────────────────────────────────────
  const d = bets.filter((b) => b.phase === 'D');
  const dEpochs = [...new Set(d.map((b) => b.epoch))].sort((x, y) => x - y);
  let staked = 0, paid = 0, expected = 0, variance = 0;
  for (const b of d) {
    const s = Number(b.betAmount), m = quotedMultiplier(b.params), p = discreteWinProbability(b.params);
    staked += s; paid += Number(b.winningAmount);
    expected += s * p * m;
    variance += s * s * p * (1 - p) * m * m;
  }

  const wagered = bets.reduce((a, b) => a + Number(b.betAmount), 0);
  const returned = bets.reduce((a, b) => a + Number(b.winningAmount), 0);
  const meanRoll = bets.reduce((a, b) => a + Number(b.roll), 0) / bets.length;

  return {
    bets: bets.length,
    wins: wins.length,
    settledRtp: {
      belowNominal: below, aboveNominal: above, exactlyNominal: exact,
      minPct: minRtp * 100, maxPct: maxRtp * 100, nominalPct: (1 - HOUSE_EDGE) * 100,
      anyAtOrAbove100: maxRtp >= 1,
    },
    settlementResidual: {
      roundedDown: down, roundedUp: up, exactlyOnProduct: onProduct,
      maxAbsUsdc: maxAbs, netUsdc: net, exactTies: ties,
    },
    boundary: {
      betsWithReachableUpperBound: reachable,
      betsWithUnreachableUpperBound: bets.length - reachable,
      expectedUpperBoundHits: reachable / RANGE,
      observedUpperBoundHits: upperHits,
      observedLowerBoundHits: lowerHits,
      betsWhereBoundaryModelsDisagree: modelsDisagree,
      winFlagsReproducedHalfOpen: okHalfOpen,
      winFlagsReproducedInclusiveBothEnds: okInclusive,
    },
    cherryPickPower: {
      seeds: seeds.length, nullFlagRate: p0, expectedFlags: seeds.length * p0,
      minRejectableFlags: minRejectable, pAtMinRejectable: pAtMin,
      alpha: ALPHA, seedAlphaNominal: SIM_CHERRY_SEED_ALPHA,
    },
    phaseD: {
      firstEpoch: dEpochs[0], lastEpoch: dEpochs[dEpochs.length - 1], epochs: dEpochs.length,
      bets: d.length, stakedUsdc: staked, paidUsdc: paid, expectedUsdc: expected,
      z: (paid - expected) / Math.sqrt(variance),
    },
    live: { wageredUsdc: wagered, returnedUsdc: returned, realizedRtpPct: (returned / wagered) * 100, meanRoll },
  };
}
