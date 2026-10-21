/**
 * Step 15: Odds Boundary & Effective-Edge Integrity
 *
 * Confirms the maxOdds (9900×, live-witnessed) / roll-ceiling (99.99) boundaries behave, and
 * recomputes the DISCRETE effective edge for every captured band from grid arithmetic. Under the
 * half-open win rule (E13 boundary probes) every mode's winning region holds exactly 100·W points,
 * so the effective edge is exactly 1.0000% on every bet.
 *
 * WHAT THIS STEP IS, HONESTLY. The per-bet edge assertion is a MODEL IDENTITY,
 * not a measurement of the operator. `1 − (100·W/10000)·(9900/(100·W))` is 0.01 by algebra for every
 * 2-dp band, so no dataset — this one or any other — can make it fail. What it DOES catch is a change
 * to our own model (a rule or pricing edit, including an inclusive-upper regression that no settled
 * bet could witness), and that is worth a scored step; what it does not do is confirm the operator's
 * boundary rule. That rests entirely on E13, and E13 is weaker than it looks: only 2 of
 * its 7 probes discriminate half-open from inclusive-both-ends (probe 1, `roll == upper` on a
 * non-inverted band, and probe 5, `roll == upper` inverted). The settled data has ZERO power — both
 * rules reproduce all 6,700 win flags with 0 disagreements (`outputs/report-figures.json`
 * `boundary.betsWhereBoundaryModelsDisagree`). The step therefore states the conditionality in its
 * own detail string rather than leaving it to a chapter.
 *
 * ARITHMETIC. The identity is asserted in EXACT INTEGERS
 * (`effectiveEdgeIsExact`: 100·winCount·9900 === 99·RANGE·basisPoints), not as
 * `|edge − 0.01| < 1e-12`. A 1e-12 width can be justified as "~150× the arithmetic noise" from the
 * 6.3e-15 worst case ACROSS THE CAPTURE — but `continuousWinChancePct` subtracts in binary64, so an
 * `over 99.99` band (`100 − 99.99 = 0.010000000000005116`) departs by 5.063813951489138e-13. Such a
 * threshold is 1.97× its own noise floor, on precisely the 9900× extreme E14 recommends probing next.
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

  // Effective edge across all bets — the finding.
  // Per-bet assertion, in EXACT INTEGERS: under the
  // half-open rule EVERY bet's winning region holds exactly 100·W grid points, so
  // 100·winCount·9900 === 99·RANGE·basisPoints with no tolerance at all. Asserting this per bet —
  // not merely `favorable === 0` — means a boundary-rule regression surfaces as a HARD FAIL here,
  // not only in the E13 mocha vectors: an inclusive-upper mutation makes the edge 0.01 − 0.0099/W
  // (still positive, so `favorable` stays 0 and would NOT catch it), which the integer identity
  // rejects outright. It is enforcement of the MODEL, conditional on the E13 boundary semantics —
  // see the header: no dataset can falsify it.
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
    + `live-witnessed maxOdds ${MAX_ODDS}× (win chance 0.01%); max multiplier in capture ${maxMultSeen}× — the 99×–${MAX_ODDS}× tail was not sampled live; all captured within ceiling: ${allWithinCeiling}; `
    + `per-bet effective edge == 1.0000% asserted in EXACT INTEGERS (100·winCount·${PAYOUT_NUMERATOR} === ${PAYOUT_NUMERATOR / 100}·${RANGE}·basisPoints, no tolerance) on ${bets.length - edgeRuleViolations}/${bets.length} bets (${edgeRuleViolations} rule violations); `
    + `the float form of the same quantity departs from 0.01 by up to ${maxFloatDeparture.toExponential(2)} across the capture and ${extremeFloatDeparture.toExponential(2)} at the un-sampled 9900× extreme (upper 100 − lower 99.99 in binary64), which is why the assertion is integral; `
    + `MODEL IDENTITY, not a measurement of the operator: this holds by algebra for every 2-dp band, so no dataset can falsify it — it enforces OUR rule set, and the operator's boundary rule rests on the E13 probes alone (2 of 7 discriminate; the settled data has zero power, see report-figures boundary.betsWhereBoundaryModelsDisagree) — declared limitations L2 (E13) and L3 (model identity) in MANIFEST.md; the un-sampled 99×–9900× tail is L7; `
    + `effective edge spans ${(minEdge * 100).toFixed(3)}%–${(maxEdge * 100).toFixed(3)}%, player-favourable bets ${favorable} (${favorable === 0 ? 'none — not exploitable' : 'EXPLOIT'}); `
    + `by mode: ${modeStr}`,
  );

  return [s15];
}
