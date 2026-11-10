/**
 * Derived report figures — the numbers the report cites that are neither a scored step's verdict
 * nor a simulation statistic, computed here from the pinned dataset and written to
 * `outputs/report-figures.json` by `npm run verify`.
 *
 * WHY THIS FILE EXISTS. A figure that appears only in prose has no producing artifact, and a
 * reader cannot re-derive it without reimplementing the auditor's reasoning. That is the class the
 * framework's prose check calls an "orphan figure", and it is how a hand-typed number survives a
 * review: it looks like a measurement and is actually a memory. Everything below is quoted in the
 * report — the settled-RTP span, the settlement residual's direction, the boundary-hit
 * expectation — so it is computed by committed code from the hash-pinned capture and
 * emitted, not typed.
 *
 * Where a comparison is at the scale of floating-point noise it is done in EXACT integer or
 * rational arithmetic (see `creditResidualSign`), because a double subtraction at 5e-9 reports the
 * subtraction's own error as if it were the measurement.
 */

import {
  RANGE, SCALE, HOUSE_EDGE, ALPHA, SIM_CHERRY_SEED_ALPHA,
  quotedMultiplier, discreteWinCount, discreteWinProbability,
  floor8CreditUnits, floor8CreditUnitsServed, amountUnits, creditResidualSign, creditResidual, diceWin, diceWinInclusive, payoutBasisPoints, bandMode,
  EXPECTED_PHASES,
} from './config';
import { cherryFlagRate } from './exact-chi2';
import { binomialTailP } from './stats';
import type { Bet, Seed } from './types';

export interface ReportFigures {
  bets: number;
  wins: number;
  /** RTP a player actually receives per (band, stake), after the production floor8 settlement. */
  settledRtp: {
    belowNominal: number; aboveNominal: number; exactlyNominal: number;
    minPct: number; maxPct: number; nominalPct: number; anyAtOrAbove100: boolean;
  };
  /** Direction of (settled credit − stake × multiplier), decided in exact arithmetic. */
  settlementResidual: {
    roundedDown: number; roundedUp: number; exactlyOnProduct: number;
    maxAbsUsdt: number; netUsdt: number;
    /** Captured wins whose credit the FLOAT closed form (100/wc)·0.99, floored, would get wrong (the quotient gets none wrong). */
    floatClosedFormMisses: number;
  };
  /** Power of the settled data against the band-boundary rule (the subject of evidence E17). */
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
  /** Live-bet aggregates (informational: variance illustration, never RTP evidence). Amounts summed in exact 1e-8 units. */
  live: { wageredUsdt: number; returnedUsdt: number; realizedRtpPct: number; meanRoll: number };
  /** Per phase id: rounds, epochs, wins, the served stake, the amounts and the (mode × win chance) classes played. */
  phases: Record<string, {
    bets: number; epochs: number; wins: number; stakeUsdt: number;
    wageredUsdt: number; returnedUsdt: number; realizedRtpPct: number;
    classes: number; fewestPerClass: number; mostPerClass: number;
  }>;
  /** Rounds per band mode over the whole capture. */
  modes: { under: number; over: number; inside: number; outside: number };
  /** LIQD's own verify endpoint, one stored reply per round. */
  verifier: { replies: number; equalServedRound: number };
  /** Player-set (Phase D) client seeds. */
  playerSeeds: { epochs: number; distinct: number; bets: number };
}

export function computeReportFigures(bets: Bet[], seeds: Seed[]): ReportFigures {
  const wins = bets.filter((b) => b.win);

  // ── settled RTP per (band, stake) under the production floor8 rule, vs the nominal 99%, exactly ──
  // rtp = (W / RANGE) · (creditUnits / stakeUnits)  vs  (1 − HOUSE_EDGE)
  // Both sides are rationals over integers, so the comparison carries no rounding at all.
  const edgeNum = BigInt(Math.round((1 - HOUSE_EDGE) * 1e8));      // 99000000 at a 1% edge
  let below = 0, above = 0, exact = 0, minRtp = Infinity, maxRtp = -Infinity;
  for (const b of bets) {
    const stakeUnits = amountUnits(b.betAmount)!;
    const w = BigInt(discreteWinCount(b.params));
    const creditUnits = floor8CreditUnits(b.betAmount, b.params);
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
  // Doing this on binary64(stake) × binary64(multiplier) instead reports every win as rounded and
  // none as exact, because the representation error in binary64(0.1) survives into the comparison.
  // See creditResidualSign.
  let down = 0, up = 0, onProduct = 0, maxAbs = 0, net = 0, floatMisses = 0;
  for (const b of wins) {
    const sign = creditResidualSign(b.winningAmount, b.betAmount, b.params);
    if (sign < 0) down++; else if (sign > 0) up++; else onProduct++;
    const d = creditResidual(b.winningAmount, b.betAmount, b.params);
    net += d;
    if (Math.abs(d) > maxAbs) maxAbs = Math.abs(d);
    if (floor8CreditUnitsServed(b.betAmount, quotedMultiplier(b.params)) !== amountUnits(b.winningAmount)) floatMisses++;
  }

  // ── boundary power: which bets could ever land on their upper bound at all ────
  // The roll ceiling is (RANGE − 1)/SCALE = 99.99, so a band with upper = 100 has an upper bound
  // no roll can reach — those bets carry ZERO power against the half-open rule.
  const reachable = bets.filter((b) => Math.round(b.params.upper * SCALE) <= RANGE - 1).length;
  const upperHits = bets.filter((b) => Math.round(Number(b.roll) * SCALE) === Math.round(b.params.upper * SCALE)).length;
  const lowerHits = bets.filter((b) => Math.round(Number(b.roll) * SCALE) === Math.round(b.params.lower * SCALE)).length;

  // How much power the SETTLED data has over the half-open rule, measured rather than argued.
  // Rule A (shipped): win ⇔ roll ∈ [lower, upper). Rule B: [lower, upper]. If the two reproduce the
  // same captured win flags, no settled bet can choose between them and the rule rests on the
  // production verifier probes (evidence E17) alone.
  let modelsDisagree = 0, okHalfOpen = 0, okInclusive = 0;
  for (const b of bets) {
    const roll = Number(b.roll);
    const winHalfOpen = diceWin(roll, b.params), winInclusive = diceWinInclusive(roll, b.params);
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

  // Amounts in exact 1e-8 units from the served decimal strings; converted to a double once, at the end.
  const U = 100000000;
  const sum = (list: Bet[], f: (b: Bet) => number | string) => list.reduce((a, b) => a + (amountUnits(f(b)) ?? 0n), 0n);
  const wageredU = sum(bets, (b) => b.betAmount), returnedU = sum(bets, (b) => b.winningAmount);
  const wagered = Number(wageredU) / U, returned = Number(returnedU) / U;
  const meanRoll = bets.reduce((a, b) => a + Number(b.roll), 0) / bets.length;

  const phases: ReportFigures['phases'] = {};
  for (const ph of EXPECTED_PHASES) {
    const pb = bets.filter((b) => b.phaseId === ph.id);
    const w = sum(pb, (b) => b.betAmount), r = sum(pb, (b) => b.winningAmount);
    const cells = new Map<string, number>();
    for (const b of pb) { const k = `${bandMode(b.params)}/${payoutBasisPoints(b.params)}`; cells.set(k, (cells.get(k) ?? 0) + 1); }
    const counts = [...cells.values()];
    phases[ph.id] = {
      bets: pb.length, epochs: seeds.filter((s) => s.phaseId === ph.id).length, wins: pb.filter((b) => b.win).length,
      stakeUsdt: Number(ph.stake),
      wageredUsdt: Number(w) / U, returnedUsdt: Number(r) / U, realizedRtpPct: w > 0n ? (Number(r) / Number(w)) * 100 : 0,
      classes: cells.size, fewestPerClass: counts.length ? Math.min(...counts) : 0, mostPerClass: counts.length ? Math.max(...counts) : 0,
    };
  }
  const modes = { under: 0, over: 0, inside: 0, outside: 0 };
  for (const b of bets) modes[bandMode(b.params)]++;
  const vReplies = bets.filter((b) => b.verifier && b.verifier.status === 200).length;
  const vEqual = bets.filter((b) => b.verifier && b.verifier.status === 200
    && b.verifier.outcome.roll === b.roll && b.verifier.outcome.win === b.win && b.verifier.outcome.multiplier === b.multiplier).length;
  const playerEpochs = seeds.filter((s) => s.playerSet);
  const playerEpochSet = new Set(playerEpochs.map((s) => s.epoch));

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
      maxAbsUsdt: maxAbs, netUsdt: net, floatClosedFormMisses: floatMisses,
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
    live: { wageredUsdt: wagered, returnedUsdt: returned, realizedRtpPct: (returned / wagered) * 100, meanRoll },
    phases,
    modes,
    verifier: { replies: vReplies, equalServedRound: vEqual },
    playerSeeds: { epochs: playerEpochs.length, distinct: new Set(playerEpochs.map((s) => s.clientSeed)).size, bets: bets.filter((b) => playerEpochSet.has(b.epoch)).length },
  };
}
