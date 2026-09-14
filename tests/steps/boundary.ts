/** Check the roll domain, sampled odds and exact conditional RTP identity.
 * Endpoint boundary evidence and unobserved limits: AUDIT_CONTEXT.md §§4, 5 and 11.
 */
import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { effectiveEdge, effectiveEdgeIsExact, quotedMultiplier, payoutBasisPoints, discreteWinCount, bandMode, MAX_ODDS, HOUSE_EDGE, PAYOUT_NUMERATOR, RANGE, SCALE } from '../../src/config';

export function run(ctx: VerifyContext): StepResult[] {
  const { bets } = ctx;

  // Roll ceiling: no served roll exceeds 99.99.
  const maxRoll = Math.max(...bets.map(b => Number(b.roll)));
  // exact: the roll domain is the integer grid [0, RANGE), so the ceiling is a grid comparison
  const ceilingOk = Math.round(maxRoll * SCALE) <= RANGE - 1;

  // over(99) band {99,100}: a 1% win chance, so it pays exactly 99/1 = 99× — checked
  // against that band-specific multiplier, NOT against MAX_ODDS. The live-witnessed ceiling
  // is 9900× (win chance 0.01%, a single grid point; live-witnessed 2026-09-01), which
  // no captured bet reaches — the capture stopped at 99×. maxDepthOk records that scope
  // gap so the step states it rather than hiding it.
  const over99 = bets.filter(b => b.params.lower === 99 && b.params.upper === 100 && !b.params.inverted);
  // exact: 99 is (1 − HOUSE_EDGE)·10000 / 100 basis points, and quotedMultiplier lands on it bit-for-bit
  const over99Expected = (1 - HOUSE_EDGE) * 10000 / 100;
  const over99MultOk = over99.every(b => quotedMultiplier(b.params) === over99Expected);
  const over99Edge = over99.length ? effectiveEdge(over99[0].params) : NaN;
  const maxMultSeen = Math.max(...bets.map(b => quotedMultiplier(b.params)));
  const allWithinCeiling = bets.every(b => quotedMultiplier(b.params) <= MAX_ODDS);

  let minEdge = Infinity, maxEdge = -Infinity, favorable = 0, edgeRuleViolations = 0;
  let maxFloatDeparture = 0;
  const modeAgg: Record<string, { n: number; sum: number; min: number; max: number }> = {};
  for (const b of bets) {
    const e = effectiveEdge(b.params);
    if (e < minEdge) minEdge = e; if (e > maxEdge) maxEdge = e;
    if (e < -1e-9) favorable++;
    if (!effectiveEdgeIsExact(b.params)) edgeRuleViolations++;
    const dep = Math.abs(e - HOUSE_EDGE);          // reported, never scored: this is float noise
    if (dep > maxFloatDeparture) maxFloatDeparture = dep;
    const m = bandMode(b.params);
    (modeAgg[m] ||= { n: 0, sum: 0, min: Infinity, max: -Infinity });
    const g = modeAgg[m]; g.n++; g.sum += e; if (e < g.min) g.min = e; if (e > g.max) g.max = e;
  }
  // Coverage for the identity itself: exercise the 9900× extreme the capture does NOT contain, so
  // the integer form is shown to hold at the band whose float form departs by 5.06e-13.
  const extreme = { lower: 99.99, upper: 100, inverted: false };
  const extremeOk = effectiveEdgeIsExact(extreme);
  const extremeFloatDeparture = Math.abs(effectiveEdge(extreme) - HOUSE_EDGE);
  const modeStr = Object.entries(modeAgg)
    .map(([m, g]) => `${m} ${(g.sum / g.n * 100).toFixed(3)}% [${(g.min * 100).toFixed(3)}–${(g.max * 100).toFixed(3)}]`)
    .join('; ');

  // Coverage guard: the step must run over a non-empty set and actually exercise the
  // maxOdds boundary — otherwise Math.max(...[]) / [].every(...) would vacuously "pass".
  const coverOk = bets.length > 0 && over99.length > 0 && Number.isFinite(over99Edge) && extremeOk;
  const pass = coverOk && ceilingOk && over99MultOk && allWithinCeiling && favorable === 0 && edgeRuleViolations === 0;
  const s15 = step(15, 'Odds Boundary & Effective Edge',
    pass ? 'PASS' : ((favorable > 0 || edgeRuleViolations > 0) ? 'FAIL' : 'FLAG'),
    `${bets.length} bets scanned (coverage ${coverOk ? 'ok' : 'FAIL — empty set or the extreme band failed the identity'}); roll ceiling ≤ 99.99 (max ${maxRoll}, ${ceilingOk ? 'ok' : 'EXCEEDED'}); over(99) pays exactly 99× at edge ${(over99Edge * 100).toFixed(4)}% (${over99.length} bets); `
    + `audit odds bound ${MAX_ODDS}× (E14 records acceptance of a losing bet); max multiplier in capture ${maxMultSeen}×; captured odds within audit bound: ${allWithinCeiling}; winning settlement at ${MAX_ODDS}× and rejection above it remain unverified; `
    + `per-bet effective edge == 1.0000% asserted in EXACT INTEGERS (100·winCount·${PAYOUT_NUMERATOR} === ${PAYOUT_NUMERATOR / 100}·${RANGE}·basisPoints, no tolerance) on ${bets.length - edgeRuleViolations}/${bets.length} bets (${edgeRuleViolations} rule violations); `
    + `the float form of the same quantity departs from 0.01 by up to ${maxFloatDeparture.toExponential(2)} across the capture and ${extremeFloatDeparture.toExponential(2)} at the un-sampled 9900× extreme (upper 100 − lower 99.99 in binary64), which is why the assertion is integral; `
    + `Conditional analytical identity under the uniform-roll and half-open win model. E13 records two discriminating endpoint probes; no captured settlement discriminates the upper-bound rules. See AUDIT_CONTEXT.md §11, L2, L3 and L7; `
    + `modeled effective edge spans ${(minEdge * 100).toFixed(3)}%–${(maxEdge * 100).toFixed(3)}%, modeled player-favourable bands ${favorable}; `
    + `by mode: ${modeStr}`,
  );

  return [s15];
}
