/**
 * Step 15: Boundary Rule, Roll Range & Effective-Edge Integrity (DICE-10, DICE-17, DICE-19)
 *
 * THREE THINGS, kept apart because they have different evidentiary weight.
 *
 * 1. THE BOUNDARY RULE, WITNESSED ON LIQD'S PRODUCTION VERIFIER (evidence E17). No settled round of
 *    the capture has its roll on a band bound (counted below), so the settled data cannot choose
 *    between a half-open band [lower, upper) and one that is inclusive on both ends: both rules
 *    reproduce every captured win flag. The rule is therefore read off LIQD's own verify endpoint on
 *    liqd.com, asked on 9 November 2026 for revealed production seeds and nonces whose roll equals a
 *    band bound, or misses it by 0.01. This step loads that record (pinned by SHA-256), recomputes
 *    every probe's roll from its seed with src/rng.ts, and requires LIQD's reply to equal the
 *    package's roll, win (half-open rule) and multiplier. It then counts the probes on which the
 *    two candidate rules DISAGREE (roll == upper bound, upper below 100): those are the ones that
 *    carry the evidence, and every one of them must agree with half-open.
 *    WHAT IT IS NOT: these are VERIFIER replies. That settlement (place-bet) applies the same rule
 *    to a roll on a bound is not witnessed by any settled round (limitation L2).
 *
 * 2. THE ROLL RANGE: every served roll is on the grid 0.00 … 99.99.
 *
 * 3. THE EFFECTIVE EDGE, A MODEL IDENTITY. `1 − (100·W/10000)·(9900/(100·W))` is 0.01 by algebra
 *    for every 2-dp band, so no dataset can make the per-bet assertion fail. What it DOES catch is
 *    a change to our own model (a rule or pricing edit, including an inclusive-upper regression that
 *    no settled bet could witness), and that is worth a scored step. It is asserted in EXACT
 *    INTEGERS (`effectiveEdgeIsExact`: 100·winCount·9900 === 99·RANGE·basisPoints), not within a
 *    float tolerance: `continuousWinChancePct` subtracts in binary64, and at an `over 99.99` band
 *    the float form departs from 0.01 by 5.06e-13.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'node:crypto';
import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { diceRoll, commitHash } from '../../src/rng';
import { effectiveEdge, effectiveEdgeIsExact, payoutBasisPoints, bandMode, diceWin, diceWinInclusive, HOUSE_EDGE, PAYOUT_NUMERATOR, RANGE, SCALE, EXPECTED_WIN_CHANCES, E17_FILE, E17_SHA256, E17_PROBES } from '../../src/config';
import type { DiceParams } from '../../src/types';

interface ProbeRecord {
  id: string; status: number; bodySha256: string; body: string;
  request: { method: string; url: string; body: string };
}

export function run(ctx: VerifyContext): StepResult[] {
  const { bets, seeds } = ctx;

  // ── (1) the boundary probes of record ────────────────────────────────────────
  const epochOfSeed = new Map(seeds.filter((s) => s.serverSeed).map((s) => [s.serverSeed as string, s]));
  const settled = new Set(bets.map((b) => `${b.epoch}|${b.nonce}`));
  const file = path.join(ctx.outputsDir, '..', E17_FILE);
  let probeNote = '';
  let probesOk = false;
  let nProbes = 0, replyOk = 0, onLower = 0, onUpper = 0, discriminating = 0, discriminatingHalfOpen = 0, unsettledProbes = 0, controls = 0;
  const discModes = new Set<string>(), lowerModes = new Set<string>();
  if (!fs.existsSync(file)) {
    probeNote = `${E17_FILE} ABSENT: the boundary rule has no witness`;
  } else {
    const raw = fs.readFileSync(file);
    const sha = createHash('sha256').update(raw).digest('hex');
    let probes: ProbeRecord[] = [];
    try { probes = (JSON.parse(raw.toString('utf8')).probes ?? []) as ProbeRecord[]; } catch { probes = []; }
    nProbes = probes.length;
    const bad: string[] = [];
    for (const pr of probes) {
      let rq: { serverSeed: string; clientSeed: string; nonce: number; params: DiceParams };
      let rp: { outcome: { roll: number; win: boolean; multiplier: number } };
      try { rq = JSON.parse(pr.request.body); rp = JSON.parse(pr.body); } catch { bad.push(`${pr.id}: unreadable`); continue; }
      const seed = epochOfSeed.get(rq.serverSeed);
      // The probe must use a seed LIQD revealed in THIS capture (it hashes to that epoch's commitment)
      // and that epoch's client seed; the reply must be the stored bytes (its SHA-256).
      const provenanceOk = !!seed && commitHash(rq.serverSeed) === seed.hashedServerSeed && rq.clientSeed === seed.clientSeed
        && pr.status === 200 && createHash('sha256').update(pr.body, 'utf8').digest('hex') === pr.bodySha256
        && pr.request.method === 'POST' && pr.request.url === 'https://liqd.com/api/v1/originals/dice/verify';
      const roll = diceRoll(rq.serverSeed, rq.clientSeed, rq.nonce) / SCALE;
      const win = diceWin(roll, rq.params);
      const mult = win ? PAYOUT_NUMERATOR / payoutBasisPoints(rq.params) : 0;
      const agrees = rp.outcome.roll === roll && rp.outcome.win === win && rp.outcome.multiplier === mult;
      if (provenanceOk && agrees) replyOk++; else bad.push(`${pr.id}: ${provenanceOk ? 'reply differs from the package rule' : 'provenance'}`);
      const lowerHit = roll === rq.params.lower, upperHit = roll === rq.params.upper;
      if (lowerHit) { onLower++; lowerModes.add(bandMode(rq.params)); }
      if (upperHit) onUpper++;
      if (!lowerHit && !upperHit) controls++;
      if (seed && !settled.has(`${seed.epoch}|${rq.nonce}`)) unsettledProbes++;
      // The two candidate rules disagree exactly when the roll sits on the upper bound.
      if (diceWin(roll, rq.params) !== diceWinInclusive(roll, rq.params)) {
        discriminating++; discModes.add(bandMode(rq.params));
        if (rp.outcome.win === win) discriminatingHalfOpen++;
      }
    }
    probesOk = sha === E17_SHA256 && nProbes === E17_PROBES && replyOk === nProbes
      && discriminating > 0 && discriminatingHalfOpen === discriminating && onLower > 0;
    probeNote = `${E17_FILE} sha256 ${sha.slice(0, 16)}… ${sha === E17_SHA256 ? 'matches its pin' : '≠ PIN'}; ${nProbes}/${E17_PROBES} answered probes, each on a seed revealed in this capture: LIQD's reply equals the package's roll, half-open win and 9900/basisPoints multiplier on ${replyOk}/${nProbes}`
      + (bad.length ? ` (${bad.slice(0, 3).join('; ')})` : '')
      + `; roll == lower bound on ${onLower} (wins the band; modes ${[...lowerModes].sort().join(', ')}), roll == upper bound on ${onUpper}, ${controls} with no bound hit (controls 0.01 off a bound, the range-edge roll inside its band, and one re-sent verify call of the capture); `
      + `${discriminating} probes separate half-open from inclusive-both-ends (the roll is on a reachable upper bound; modes ${[...discModes].sort().join(', ')}; an over band's upper bound is 100, which no roll reaches) and ${discriminatingHalfOpen}/${discriminating} follow half-open; ${unsettledProbes} probes use nonces never settled in the capture`;
  }

  // ── (2) roll range ───────────────────────────────────────────────────────────
  const rolls = bets.map((b) => Math.round(Number(b.roll) * SCALE));
  const maxRoll = Math.max(...rolls), minRoll = Math.min(...rolls);
  const rangeOk = minRoll >= 0 && maxRoll <= RANGE - 1 && bets.every((b) => Math.round(Number(b.roll) * SCALE) / SCALE === Number(b.roll));

  // Power of the SETTLED data over the boundary rule, measured rather than argued.
  let lowerHits = 0, upperHits = 0, rulesDisagree = 0;
  for (const b of bets) {
    const r = Number(b.roll);
    if (r === b.params.lower) lowerHits++;
    if (r === b.params.upper) upperHits++;
    if (diceWin(r, b.params) !== diceWinInclusive(r, b.params)) rulesDisagree++;
  }

  // ── (3) top of the captured range, and the per-bet edge identity ─────────────
  // The highest-multiplier setting the plan played (its smallest win chance) must be priced at
  // exactly PAYOUT_NUMERATOR/basisPoints and carry the 1.0000% edge.
  const planMinBps = Math.round(Math.min(...EXPECTED_WIN_CHANCES) * 100);
  const minBps = Math.min(...bets.map(b => payoutBasisPoints(b.params)));
  const topBets = bets.filter(b => payoutBasisPoints(b.params) === minBps);
  const topExpected = PAYOUT_NUMERATOR / minBps;
  const topMultOk = minBps === planMinBps
    && topBets.every(b => !b.win || Number(b.multiplier) === topExpected)
    && topBets.every(b => effectiveEdgeIsExact(b.params));
  const topEdge = topBets.length ? effectiveEdge(topBets[0].params) : NaN;

  let minEdge = Infinity, maxEdge = -Infinity, favorable = 0, edgeRuleViolations = 0, maxFloatDeparture = 0;
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
  // The identity at the narrowest band of the price grid, which the capture does not contain.
  const extreme = { lower: 99.99, upper: 100, inverted: false };
  const extremeOk = effectiveEdgeIsExact(extreme);
  const extremeFloatDeparture = Math.abs(effectiveEdge(extreme) - HOUSE_EDGE);
  const modeStr = Object.entries(modeAgg)
    .map(([m, g]) => `${m} ${(g.sum / g.n * 100).toFixed(3)}% [${(g.min * 100).toFixed(3)}–${(g.max * 100).toFixed(3)}]`)
    .join('; ');

  // Coverage guard: a non-empty set that reaches the top setting with at least one win there.
  const coverOk = bets.length > 0 && topBets.length > 0 && topBets.some(b => b.win) && Number.isFinite(topEdge) && extremeOk;
  const pass = coverOk && probesOk && rangeOk && topMultOk && favorable === 0 && edgeRuleViolations === 0;
  const s15 = step(15, 'Boundary Rule, Roll Range & Effective Edge',
    pass ? 'PASS' : ((favorable > 0 || edgeRuleViolations > 0 || !probesOk || !rangeOk) ? 'FAIL' : 'FLAG'),
    `BOUNDARY RULE (LIQD's production verify endpoint, 9 November 2026): ${probeNote}. `
    + `Settled data: ${lowerHits} of ${bets.length} rolls on their band's lower bound and ${upperHits} on its upper bound; the two rules disagree about ${rulesDisagree} captured win flags, so the settled rounds have no power over the rule and it rests on these verifier replies; that settlement treats a roll on a bound the same way is not witnessed (declared limitation L2). `
    + `ROLL RANGE: ${bets.length} served rolls on the 0.01 grid, min ${(minRoll / SCALE).toFixed(2)}, max ${(maxRoll / SCALE).toFixed(2)} (ceiling ${((RANGE - 1) / SCALE).toFixed(2)}, ${rangeOk ? 'ok' : 'OUT OF RANGE'}). `
    + `TOP OF THE CAPTURED RANGE: win chance ${(minBps / 100).toFixed(2)}% pays exactly ${PAYOUT_NUMERATOR}/${minBps} = ${topExpected}× at edge ${(topEdge * 100).toFixed(4)}% (${topBets.length} bets, ${topBets.filter(b => b.win).length} wins, ${topMultOk ? 'ok' : 'MISPRICED'}); narrower bands (above ${topExpected}×) were not played: declared limitation L7. `
    + `EFFECTIVE EDGE: per-bet edge == 1.0000% asserted in EXACT INTEGERS (100·winCount·${PAYOUT_NUMERATOR} === ${PAYOUT_NUMERATOR / 100}·${RANGE}·basisPoints, no tolerance) on ${bets.length - edgeRuleViolations}/${bets.length} bets (${edgeRuleViolations} rule violations; coverage ${coverOk ? 'ok' : 'FAIL'}); `
    + `the float form of the same quantity departs from 0.01 by up to ${maxFloatDeparture.toExponential(2)} across the capture and ${extremeFloatDeparture.toExponential(2)} at an over 99.99 band, which is why the assertion is integral; `
    + `MODEL IDENTITY, not a measurement of the operator: it holds by algebra for every 2-dp band, so no dataset can falsify it; it enforces OUR rule set (declared limitation L3); `
    + `effective edge spans ${(minEdge * 100).toFixed(3)}%–${(maxEdge * 100).toFixed(3)}%, player-favourable bets ${favorable} (${favorable === 0 ? 'none' : 'EXPLOIT'}); `
    + `by mode: ${modeStr}`,
  );

  return [s15];
}
