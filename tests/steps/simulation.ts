/**
 * Steps 16–17: Simulation Cross-Check
 * Scores the frozen outputs/simulation-results.json (produced by `npm run simulate`):
 *   16 — Pass 1 (fresh seeds): draw uniformity + serial independence + effective-edge table +
 *        the RTP-convergence series, all within tolerance at the pinned sample depths.
 *   17 — Pass 2 (casino seeds): the DICE-21 load-bearing served-band PAYOUT-WEIGHTED RETURN scan —
 *        every revealed seed × 10,000 nonces, early window = the captured nonce range, reference =
 *        the remainder; the statistic is the payout-weighted return of the bands the casino actually
 *        served, standardised by its EXACT per-bet mean and variance (a scaled Poisson-binomial
 *        across seeds, each pᵢ the served band's exact lattice win-probability) and read against the
 *        one-sided normal (CLT) lower tail (EXACT moments, ASYMPTOTIC tail — NOT an exact-lattice
 *        CDF). Plus, RETAINED as supplementary, the exact-discrete draw-uniformity cherry-pick scan
 *        and the DICE-22 pooled real-roll uniformity — all RE-DERIVED here from the dataset's own
 *        revealed seeds and rolls.
 *
 * WHAT THIS STEP TRUSTS. Nothing in the artifact except the numbers it can re-derive or bound:
 *
 *   • every THRESHOLD comes from src/config.ts or from α — never from the artifact
 *     (a forged `zCritical` / `tolSE` / `cherryPickP0` cannot loosen the test);
 *   • every SAMPLE DEPTH is required to equal its `src/config.ts` constant — `pass1.draws`,
 *     `serial.n`, each band's `n`, and the convergence series' final `n` — without that,
 *     `pass1.draws = 1`, a truncated one-point convergence series and a
 *     `serial.n`-less block all pass;
 *   • every POPULATION is required to BE the right population, not merely the right size
 *     (G-BIND). The nine effective-edge rows must be the nine canonical `SIM_EDGE_BANDS`,
 *     distinct; the 134 per-seed rows must carry the dataset's own 134 distinct epochs. A count
 *     is not an identity: nine copies of the easiest band, or 134 copies of one unflagged seed,
 *     would otherwise return a Full Pass;
 *   • every Pass-2 STATISTIC is recomputed from `ctx.seeds` and `ctx.bets` — 134 × 100 HMACs and
 *     one 6,700-roll histogram, well under a second — and compared under the reproduction rule
 *     below. The artifact cannot report a per-seed p-value, a flag, a χ², or a pooled statistic
 *     that the verifier did not itself reproduce from the pinned dataset;
 *   • the artifact's own `pass` booleans are read ONLY for traceability. If a self-report
 *     disagrees with the recomputation the step HARD-FAILS.
 *
 * THE REPRODUCTION RULE. Integers and pure-arithmetic statistics are compared EXACTLY: the producer
 * writes full-precision doubles and both sides run the same deterministic arithmetic, so a tolerance
 * there would be unearned (S-EXACT). libm-dependent floats — p-values, the χ² beside them, normal
 * quantiles — are compared at 1e-14 absolute + 1e-12 relative (src/diff.ts numbersAgree, since
 * 2026-09-28; see `agree` below), and the served-band aggregate sums at 1e-9.
 *
 * ── THE RAW STATISTICS, AND THE FORGERY THAT SHOWED WHY THEY NEED SCORING ──────────────────────
 * Everything above re-derives the PINNED and DERIVED fields. Four RAW STATISTICS admit no such
 * treatment, because they are the simulation's actual output and nothing else can produce them:
 * `uniformity.chi2`, `serial.lag1`, `serial.runsZ`, and each band's `simulatedRTP`. A reviewer
 * rewrote the whole `pass1` block with `uniformity.chi2 = 0` (p = 1.0), `lag1 = 0`, `runsZ = 0`,
 * every band's `simulatedRTP` set exactly equal to theory and every convergence point exactly on
 * theory, then recomputed every derived field with OUR OWN formulas so the re-derivation
 * reconciled — and the suite returned 21/21 Full Pass. `README.md` claimed "a forged flag is
 * rejected rather than trusted"; a forged STATISTIC was trusted.
 *
 * Three changes, which ship together because each is weak alone:
 *
 *   1. DETERMINISM. `npm test` no longer regenerates the artifact before scoring it
 *      (`mocha && npm run verify`); Step 16 scores the COMMITTED artifact, pinned by
 *      `SIMULATION_SHA256` and reconciled in Step 19. Regeneration lives in `npm run test:full`.
 *   2. MULTIPLICITY. The three α-screens (uniformity, lag-1, runs) are judged at ALPHA_SCREEN =
 *      ALPHA/3 (Bonferroni), so the STEP's level is ALPHA. Each running at ALPHA instead makes the
 *      step's real false-positive rate on honest data 1 − 0.99³ = 2.97% — measured at 1 trip in
 *      20 runs.
 *   3. A TWO-SIDED UNIFORMITY SCREEN. The Pass-1 χ² is judged in BOTH tails: the upper tail is the
 *      real test (the draw is not uniform) and the lower tail rejects a histogram that sits closer
 *      to its expectation than a 2,000,000-draw sample plausibly can. That is an ordinary two-sided
 *      test with an ordinary size (ALPHA_SCREEN, half in each tail) and it is what rejects the
 *      reviewer's chi2 = 0.
 *
 * The pin is NOT the defence here and must not be mistaken for one — anyone who can forge the
 * artifact can re-pin it in the same commit. What survives a re-pinned forgery is the two-sided
 * screen plus the structural re-derivation below, and that is the configuration the counterexample
 * in `tests/structural-forgeries.json` exercises.
 *
 * ── WHAT IS DELIBERATELY NOT SCORED, AND WHY ───────────────────────────────────────────────────
 * A set of EQUALITY-BASED rejections under the banner "perfection is evidence of fabrication" —
 * `simulatedRTP === theoreticalRTP`, `deltaSE === 0`, a convergence point exactly on theory,
 * `lag1 === 0`, `runsZ === 0` — is absent on purpose. Such rejections are wrong.
 *
 * Every one of those is an event with positive probability under the null. Exactly 40,000 wins in
 * 2,000,000 `over 98` bets gives an RTP of exactly 0.99 — the theoretical value — with probability
 * 0.0020149586, about one run in 496. The runs test returns z = 0 whenever the observed run count
 * equals its expectation, which is a healthy sample, not a degenerate one. A suite carrying those
 * predicates declares an honest simulation a forgery, and the declared 1 % error bound accounts
 * for none of them. `SCORED_STATISTICAL_PREDICATES` in `src/sim-checks.ts` enumerates every
 * statistical screen that can move the verdict, with its size and its approximation limits.
 *
 * What replaces them is stronger, because it tests structure rather than intent: a convergence point
 * is the producer's return for an INTEGER win count, so the candidate count is recovered, the return
 * that count implies is RECONSTRUCTED and the published RTP must be what it produces (recovery by
 * `Math.round` alone accepts an `over 98` RTP of 0.99000495 — 40,000.2
 * wins — for a clean 21/21), the counts must
 * be cumulatively consistent across the nested checkpoints, and the standard error is recomputed
 * bit-for-bit from `(n, rtp, wins, m)` instead of merely being checked for finiteness. That last
 * point matters: checked only for finiteness, a plotted SE of 123456 passes verification AND chart
 * comparison, because `src/chart.ts` clamps the ±5·SE ribbon to the plot box. Perfection is reported as an
 * observation and never scored; an SE that no sample could produce is scored and fails.
 *
 * Records the actual sim artifact hash on ctx.simArtifact.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'node:crypto';
import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { chiSquaredPValue, chiSquaredTest, binomialTailP, inverseCriticalZ, twoSidedNormalP, normalLowerTailP } from '../../src/stats';
import {
  RANGE, SCALE, CURSOR, HOUSE_EDGE, ALPHA, ALPHA_SCREEN, ALPHA_SCREENS,
  SIM_UNIFORMITY_DRAWS, SIM_SERIAL_DRAWS, SIM_EDGE_BETS, SIM_RTP_BETS, SIM_RTP_MARKS,
  SIM_EDGE_BANDS, SIM_RTP_STRATEGY, SIM_CHERRY_BINS, SIM_CHERRY_WINDOW, SIM_CHERRY_SEED_ALPHA,
  SIM_PASS2_NONCES, SIM_PASS2_EARLY_WINDOW, SIM_PASS2_ALPHA,
  bandKey, theoreticalRTP, quotedMultiplier, discreteWinProbability, diceWin, servedReturnSign,
} from '../../src/config';
import { squareSum, upperTailBySquareSum, chi2FromSquareSum, cherryFlagRate, achievedSeedAlpha } from '../../src/exact-chi2';
import { numbersAgree } from '../../src/diff';
import { generateProvablyFairNumber, diceRoll } from '../../src/rng';
import type { DiceParams } from '../../src/types';
import {
  SIM_SCHEMA_VERSION, recoverWinCount, validateConvergenceSeries, runsStatistic,
  SCORED_STATISTICAL_PREDICATES, FAMILY_WISE_BOUND, STEP_16_BOUND,
} from '../../src/sim-checks';

/**
 * CHERRY_P0 — the null probability that one epoch is flagged. DERIVED in src/exact-chi2.ts from
 * the exact discrete null of the n=50 / 20-bin χ², and imported by BOTH the producer and this
 * verifier (S-CONST). It was previously a private literal here (0.0438147684) while
 * `src/simulate.ts` used 0.0475 — the two sides of the same test disagreeing on the null, which
 * is what made Step 17 print "DISAGREES with recomputation" on an untampered artifact.
 */
const CHERRY_P0 = cherryFlagRate();

/**
 * A RECOMPUTED libm-dependent float (a p-value, a chi² beside it, a normal quantile) against the
 * shipped one: the reproduction rule, 1e-14 absolute + 1e-12 relative (src/diff.ts numbersAgree),
 * not bit equality. These values come through Math.exp / Math.log (incomplete gamma, erf, AS 241),
 * which are not guaranteed bit-identical across platforms — 1-ulp drift was measured
 * on Linux for exactly this class (2026-09-28). A shipped value moved by more than the bound
 * still FAILs (tests/mutations.json: the three 'beyond the reproduction bound' entries). Integers
 * (df, counts) stay exact, and so does every pure-arithmetic statistic in this file.
 */
const agree = (a: unknown, b: unknown): boolean =>
  typeof a === 'number' && typeof b === 'number' && numbersAgree(a, b);

export function run(ctx: VerifyContext): StepResult[] {
  const file = path.join(ctx.outputsDir, 'simulation-results.json');
  if (!fs.existsSync(file)) {
    ctx.simArtifact = null;
    return [
      step(16, 'Simulation — Pass 1 (RNG)', 'FLAG', 'outputs/simulation-results.json absent — run `npm run simulate`'),
      step(17, 'Simulation — Pass 2 (Cherry-Pick)', 'FLAG', 'simulation artifact absent'),
    ];
  }
  const raw = fs.readFileSync(file);
  const sim = JSON.parse(raw.toString('utf8'));
  ctx.simArtifact = { file: 'outputs/simulation-results.json', sha256: createHash('sha256').update(raw).digest('hex') };

  // ── Step 16: Pass 1 — recompute every predicate from the stored statistics ─────
  const p1 = sim.pass1 ?? {};
  const modelOk = sim.model?.range === RANGE && sim.model?.houseEdge === HOUSE_EDGE
    && sim.model?.cursor === CURSOR && sim.model?.scale === SCALE;

  // (a) draw uniformity — depth pinned, p recomputed from the stored χ², self-report reconciled.
  // TWO-SIDED at ALPHA_SCREEN (ALPHA_SCREEN/2 per tail): the upper tail is the real test (the draw
  // is not uniform); the lower tail rejects a fabricated statistic (the draw is TOO uniform to be a
  // 2,000,000-sample χ², i.e. the statistic was written rather than measured).
  const uni = p1?.uniformity ?? {};
  const uniDepthOk = p1?.draws === SIM_UNIFORMITY_DRAWS && Number(uni.n) === SIM_UNIFORMITY_DRAWS
    && Number(uni.bins) === 100 && Number(uni.df) === 99;
  const uniP = chiSquaredPValue(Number(uni.chi2), Number(uni.df));
  const uniTooUniform = uniP > 1 - ALPHA_SCREEN / 2;
  const uniNonUniform = uniP < ALPHA_SCREEN / 2;
  const uniPass = modelOk && uniDepthOk && Number.isFinite(Number(uni.chi2))
    && !uniNonUniform && !uniTooUniform
    && agree(uni.pValue, uniP);                                // stored p must BE the recomputed p (reproduction bound)

  // (b) serial screen — depth pinned, and lag1Z re-derived from the correlation it summarises.
  // Both arms judged at ALPHA_SCREEN (Bonferroni), and both are already two-sided.
  const ser = p1?.serial ?? {};
  const zCrit = inverseCriticalZ(ALPHA_SCREEN);                // derived from α/k (not ser.zCritical)
  const lag1 = Number(ser.lag1), lag1Z = Number(ser.lag1Z), runsZ = Number(ser.runsZ);
  const lag1ZDerived = lag1 * Math.sqrt(SIM_SERIAL_DRAWS);
  const runsPDerived = twoSidedNormalP(runsZ);                 // derived from runsZ (not ser.runsP)

  // ── SCHEMA VERSION (D3/D4) ───────────────────────────────────────────────────────────────────
  // Schema 1 is the historical artifact: raw statistics only. Schema 2 additionally stores the
  // integer counts behind them, so the runs z becomes RE-DERIVABLE. The old artifact is scored
  // under schema-1 rules and is not re-labelled — a new schema must not be able to masquerade as
  // the original experiment.
  const schemaVersion = Number(sim.schemaVersion ?? 1);
  const schemaKnown = schemaVersion === 1 || schemaVersion === SIM_SCHEMA_VERSION;

  // Runs z from its own cell counts, when the artifact carries them. The DEGENERATE case is zero
  // VARIANCE (every observation on one side of the split) — a property of the sample. `runsZ === 0`
  // is NOT degeneracy: it means the run count landed on its expectation, which is a legitimate and
  // not especially unlikely outcome, and rejecting it was the D4 defect.
  let runsNote: string;
  let runsStructureOk = true;
  if (schemaVersion >= 2) {
    const runsCount = Number(ser.runs), n1 = Number(ser.n1), nSer = Number(ser.n);
    const okCounts = Number.isInteger(runsCount) && Number.isInteger(n1) && Number.isInteger(nSer)
      && n1 >= 0 && n1 <= nSer && runsCount >= 1 && runsCount <= nSer;
    const rs = okCounts ? runsStatistic(runsCount, n1, nSer) : null;
    runsStructureOk = okCounts && !!rs && !rs.degenerate && rs.z === runsZ;
    runsNote = !okCounts
      ? 'runs cell counts (runs, n1, n) absent or out of range — schema 2 requires them'
      : rs!.degenerate
        ? `runs variance is 0 (n1=${n1} of n=${nSer}) — every observation on one side of the split, so there is no runs distribution`
        : rs!.z === runsZ
          ? `runsZ RE-DERIVED from cell counts (runs=${runsCount}, n1=${n1}, n=${nSer}; variance ${rs!.variance.toExponential(4)} > 0)`
          : `runsZ ${runsZ} != ${rs!.z} re-derived from cell counts (runs=${runsCount}, n1=${n1}, n=${nSer})`;
  } else {
    runsNote = 'schema 1: runs cell counts absent, so runsZ is NOT re-derivable here — it is a raw '
      + 'statistic bounded only by its own two-sided screen (L1). A z of exactly 0 is an ordinary '
      + 'outcome and is not treated as evidence of anything';
  }

  // Schema 2 must also carry the threshold it was produced under, and it must be the one the
  // verifier applies (D7/D17: the shipped schema-1 artifact stores 2.576236081309571, the critical
  // z at the UNCORRECTED α — a stale field the verifier never reads).
  const zCriticalStored = Number(ser.zCritical);
  const zCriticalOk = schemaVersion >= 2 ? agree(zCriticalStored, zCrit) : true;
  const zCriticalNote = schemaVersion >= 2
    ? (zCriticalOk ? `stored zCritical ${zCriticalStored} IS the applied threshold` : `stored zCritical ${zCriticalStored} != applied ${zCrit}`)
    : `stored zCritical ${Number.isFinite(zCriticalStored) ? zCriticalStored : 'absent'} is a LEGACY schema-1 field at the uncorrected α and is not read; the threshold APPLIED is ${zCrit}`;

  const serialPass = schemaKnown && Number(ser.n) === SIM_SERIAL_DRAWS
    && Number.isFinite(lag1) && Number.isFinite(lag1Z) && lag1Z === lag1ZDerived
    && Math.abs(lag1Z) < zCrit
    && Number.isFinite(runsZ) && runsPDerived >= ALPHA_SCREEN && agree(ser.runsP, runsPDerived)
    && runsStructureOk && zCriticalOk;

  // (c) effective-edge table — the nine rows must BE the nine canonical bands, distinct
  const edgeRows: any[] = Array.isArray(p1?.effectiveEdge) ? p1.effectiveEdge : [];
  const wantBands = new Set(SIM_EDGE_BANDS.map((b) => bandKey(b.params)));
  const gotBands = new Set(edgeRows.map((r) => (r?.params ? bandKey(r.params) : 'INVALID')));
  const bandsIdentical = gotBands.size === wantBands.size
    && [...wantBands].every((k) => gotBands.has(k))
    && edgeRows.length === SIM_EDGE_BANDS.length;
  // Each row's DERIVED fields are re-derived here and required to match exactly, so the row
  // cannot carry a theory value, a multiplier, a win chance or an SE the band does not imply
  // (framework forged-artifact battery F4/F7). Only `simulatedRTP` is genuinely the simulation's
  // output; everything else on the row is a function of `params` and `n` — and of `simulatedRTP`
  // for the SE — so everything else is checked, not read.
  let edgeFieldMismatches = 0, edgeOnTheory = 0, edgeCountBad = 0, edgeCountExact = 0;
  const edgeCountNotes: string[] = [];
  const edgeWithin = edgeRows.filter((r) => {
    if (!r?.params || Number(r.n) !== SIM_EDGE_BETS) return false;   // each band at the pinned depth
    const theo = theoreticalRTP(r.params), m = quotedMultiplier(r.params), pr = discreteWinProbability(r.params);
    const simRtp = Number(r.simulatedRTP);
    if (!Number.isFinite(simRtp) || !Number.isFinite(theo) || !Number.isFinite(m) || !Number.isFinite(pr)) {
      edgeFieldMismatches++;
      return false;
    }
    const se = Math.sqrt(pr * (m - simRtp) ** 2 + (1 - pr) * simRtp ** 2) / Math.sqrt(Number(r.n));
    const fieldsOk = r.quotedMultiplier === m
      && r.theoreticalRTP === theo
      && r.discreteWinPct === pr * 100
      && r.theoreticalEdgePct === (1 - theo) * 100
      && r.se === se
      && r.deltaSE === Math.abs(simRtp - theo) / se
      && r.tolSE === 5;
    if (!fieldsOk) edgeFieldMismatches++;
    // STRUCTURE, not perfection (D4). A band's simulated RTP is the producer's return for an
    // INTEGER win count, so the candidate count is recovered and the RTP is then verified against
    // the return that count reconstructs to; schema 2 stores the count and it must then agree with
    // the RTP it is supposed to have produced. What is NOT rejected any more is `simRtp === theo`
    // or `deltaSE === 0`: exactly 40,000 wins in 2,000,000 `over 98` bets gives an RTP of exactly
    // 0.99 with probability 0.0020149586, and calling that a forgery was wrong.
    //
    // A recovery that stopped at `Math.round`, accepting anything within a quarter of a win of an
    // integer, lets `simulatedRTP = 0.99000495` on this same `over 98` band — 40,000.2 wins, a
    // FRACTIONAL count — round to 40,000 and return a 21/21 Full Pass. The count is instead
    // reconstructed forward (`reconstructReturn`) and the published RTP must BE what it produces.
    // The counterexample is registered as a declared mutation:
    // tests/forgeries/fractional-win-count.mjs.
    const rec = recoverWinCount(simRtp, Number(r.n), m, r.wins);
    if (!rec.ok) {
      edgeCountBad++;
      if (edgeCountNotes.length < 3) edgeCountNotes.push(`${r.label ?? 'band'}: ${rec.reason}`);
    } else if (rec.match === 'exact') edgeCountExact++;
    if (simRtp === theo) edgeOnTheory++;      // observed and reported; never scored
    return fieldsOk && rec.ok && Math.abs(simRtp - theo) <= 5 * se + 1e-4;
  }).length;
  const edgePass = bandsIdentical && edgeFieldMismatches === 0 && edgeCountBad === 0
    && edgeWithin === edgeRows.length;

  // (d) RTP convergence — the series must reach SIM_RTP_BETS at the documented marks, and the
  // headline finalRTP must BE the last plotted point.
  const rc = p1?.rtpConvergence ?? {};
  const convTheo = theoreticalRTP(SIM_RTP_STRATEGY);
  const convPts: any[] = Array.isArray(rc.points) ? rc.points : [];
  const marksOk = convPts.length === SIM_RTP_MARKS.length
    && SIM_RTP_MARKS.every((n, i) => Number(convPts[i]?.n) === n);
  const lastPt = convPts.length ? convPts[convPts.length - 1] : null;
  const convN = lastPt ? Number(lastPt.n) : 0;
  const convRtp = Number(rc.finalRTP);
  const convPr = discreteWinProbability(SIM_RTP_STRATEGY), convM = quotedMultiplier(SIM_RTP_STRATEGY);
  const convSe = convN > 0 ? Math.sqrt(convPr * (convM - convRtp) ** 2 + (1 - convPr) * convRtp ** 2) / Math.sqrt(convN) : Infinity;
  const convIdentity = marksOk && convN === SIM_RTP_BETS && Number(rc.n) === SIM_RTP_BETS
    && rc.params !== undefined && bandKey(rc.params) === bandKey(SIM_RTP_STRATEGY)
    && rc.multiplier === convM && rc.theoreticalRTP === convTheo
    && lastPt !== null && rc.finalRTP === lastPt.rtp && rc.finalRTPRunning === lastPt.rtp
    && convPts.every((pt) => Number.isFinite(Number(pt?.rtp)) && Number.isFinite(Number(pt?.se)));

  // ── EVERY PLOTTED STANDARD ERROR IS VALIDATED (D3) ──────────────────────────────────────────
  // Not `isFinite`. Each checkpoint's integer win count is recovered from its own published RTP,
  // the counts are required to be cumulatively consistent across the nested marks, and the SE is
  // recomputed from (n, rtp, wins, m) and compared bit-for-bit. This is what rejects the reviewer's
  // SE = 123456, which passed the old finiteness check and drew an IDENTICAL chart because
  // `src/chart.ts` clamps the ±5·SE ribbon to the plot box. Points sitting exactly on theory are
  // COUNTED and reported; they are not a rejection (D4).
  const series = validateConvergenceSeries(convPts, convM, convTheo);
  const convPass = convIdentity && series.ok && Number.isFinite(convRtp)
    && Math.abs(convRtp - convTheo) <= 5 * convSe + 1e-4;
  // Reported so the chapters can cite Δ/SE from a producing artifact instead of typing it
  // (an earlier RTP chapter's verdict table said "≈0.7·SE" against an artifact that gives 1.04).
  const convDeltaSE = Number.isFinite(convRtp) && convSe > 0 ? Math.abs(convRtp - convTheo) / convSe : NaN;

  const recomputed16 = uniPass && serialPass && edgePass && convPass;
  // Traceability: what the artifact says about itself, and whether it agrees with recomputation.
  const selfReport16 = p1?.uniformity?.pass === true && p1?.serial?.pass === true
    && edgeRows.length > 0 && edgeRows.every((r) => r.withinTol === true);
  const agree16 = recomputed16 === selfReport16;

  const fmt = (x: any, d: number) => (Number.isFinite(Number(x)) ? Number(x).toFixed(d) : String(x));
  const s16 = step(16, 'Simulation — Pass 1 (RNG + Edge)',
    recomputed16 && agree16 ? 'PASS' : 'FAIL',
    `scored against the COMMITTED artifact (pinned by SIMULATION_SHA256, reconciled in Step 19) — this step is deterministic, not a fresh experiment; artifact schema v${schemaVersion}${schemaKnown ? '' : ' (UNKNOWN SCHEMA)'}, verifier schema v${SIM_SCHEMA_VERSION}; ${ALPHA_SCREENS} screens Bonferroni-corrected to α_screen=${ALPHA_SCREEN.toExponential(3)} so THOSE THREE have a family-wise level of α=${ALPHA}. `
    + `draw uniformity chi²=${fmt(uni.chi2, 3)} df=${uni.df} at n=${uni.n} (pinned ${SIM_UNIFORMITY_DRAWS}) → recomputed p=${uniP.toFixed(4)}, two-sided: rejected if p<${(ALPHA_SCREEN / 2).toExponential(2)} (non-uniform) or p>${(1 - ALPHA_SCREEN / 2).toFixed(6)} (TOO uniform for a ${SIM_UNIFORMITY_DRAWS}-draw sample)${uniTooUniform ? ' — LOWER-TAIL REJECT' : ''}${uniNonUniform ? ' — UPPER-TAIL REJECT' : ''} (${uniPass ? 'ok' : 'FAIL'}); `
    + `serial at n=${ser.n} (pinned ${SIM_SERIAL_DRAWS}): lag1Z=${fmt(lag1Z, 3)} == lag1·√n (${lag1Z === lag1ZDerived ? 'reconciled' : 'MISMATCH'}) < zCrit ${zCrit.toFixed(4)} (the two-sided normal quantile at α_screen, AS 241), runsP=${runsPDerived.toFixed(4)} (derived from runsZ=${fmt(runsZ, 3)}) ≥ α_screen; ${runsNote}; ${zCriticalNote} (${serialPass ? 'ok' : 'FAIL'}); `
    + `effective-edge ${edgeWithin}/${edgeRows.length} bands within 5·SE+1e-4 of theory at n=${SIM_EDGE_BETS} (recomputed), band set ${bandsIdentical ? `identical to the ${SIM_EDGE_BANDS.length} canonical bands` : 'NOT the canonical band set'}, ${edgeFieldMismatches} row(s) whose derived fields disagree with re-derivation, ${edgeCountExact}/${edgeRows.length} row(s) whose simulatedRTP IS bit-for-bit the return their integer win count reconstructs to (the producer's own per-win accumulation, replayed) and ${edgeCountBad} row(s) whose simulatedRTP is the return of NO integer win count${edgeCountNotes.length ? ` (e.g. ${edgeCountNotes.join('; ')})` : ''}; `
    + `RTP convergence ${convPts.length} points at the pinned marks (${marksOk ? 'ok' : 'MARKS MISMATCH'}), ends at n=${convN} (pinned ${SIM_RTP_BETS}), finalRTP=${Number.isFinite(convRtp) ? (convRtp * 100).toFixed(3) : 'NaN'}% == last plotted point (${convIdentity ? 'reconciled' : 'MISMATCH'}) vs ${(convTheo * 100).toFixed(2)}%, Δ=${Number.isFinite(convDeltaSE) ? convDeltaSE.toFixed(4) : 'NaN'}·SE within the 5·SE band; ALL ${convPts.length} plotted standard errors RECOMPUTED from (n, rtp, wins, m) and compared exactly, win counts ${series.points.map((p) => p.wins).join('/')} (${series.points[0]?.winSource ?? 'n/a'}) cumulatively consistent and ${series.exactReconstructions}/${convPts.length} of them reconstructing bit-for-bit to the published RTP — ${series.ok ? 'reconciled' : `MISMATCH: ${series.failures.slice(0, 3).join('; ')}`} (${convPass ? 'ok' : 'FAIL'}); `
    + `model range/cursor/scale/edge ${modelOk ? 'ok' : 'FAIL'}; artifact self-report ${selfReport16 ? 'pass' : 'fail'}`
    + (agree16 ? '' : ' — DISAGREES with recomputation (artifact self-report tampered?)')
    // OBSERVED, NOT SCORED. A statistic landing exactly on its theoretical value is an event
    // with positive probability under the null — 0.0020149586 for exactly 40,000 wins in 2,000,000
    // `over 98` bets. It is recorded because it is worth a reader's attention, and it moves nothing.
    + `; OBSERVED (not scored): ${edgeOnTheory} effective-edge row(s) and ${series.exactlyOnTheory} convergence point(s) sit exactly on theory, and runsZ is ${runsZ === 0 ? 'exactly 0' : 'nonzero'} — all legitimate outcomes under the null, reported rather than rejected (client QA 2026-09-10, D4)`
    // DECLARED LIMITATION L1 (now NARROWED by the deterministic producer), and the error budget.
    + `; SCOPE — the raw Pass-1 statistics (uniformity.chi2, serial.lag1, serial.runsZ, each band's simulatedRTP, and the convergence series' own RTP path) are not recomputed inside THIS fast verify (that would re-run 40M draws), but the Pass-1 producer is now DETERMINISTIC — seeded from the pinned SIM_MASTER_SEED — so they are re-derivable by replaying it: npm run test:full regenerates the artifact byte-for-byte and the field diff is empty (DICE-20). A statistic forged SUBTLY is therefore no longer invisible the way it was under fresh entropy (former L1): a re-run reproduces the EXACT committed figures, so test:full exposes any figure that is not what the declared experiment outputs; changing SIM_MASTER_SEED to hand-pick one is a visible source edit that re-rolls every Pass-1 figure at once. What the FAST path still relies on for a reader who does not re-run the producer — that the statistics are STRUCTURALLY possible (integer win counts, cumulative consistency, exact standard errors) and fall inside their screens — is unchanged; that residual is declared limitation L1`
    + `; ERROR BUDGET — ${SCORED_STATISTICAL_PREDICATES.length} scored statistical screens across Steps 16-17: ${SCORED_STATISTICAL_PREDICATES.map((s) => `${s.id} ${s.screen} [${s.size}]`).join('; ')}. The α=${ALPHA} claim describes S1-S3 (family-wise, Bonferroni) ONLY — it is NOT this step's level: Step 16 also scores S4 and S5, so THIS STEP's own union bound is ≈${STEP_16_BOUND.toFixed(7)}, and over all ${SCORED_STATISTICAL_PREDICATES.length} screens across Steps 16-17 it is ≈${FAMILY_WISE_BOUND.toFixed(4)}. Everything else this step rejects on — derived-field reconciliation, population identity, sample-depth pins, integer win counts and their RECONSTRUCTION, cumulative consistency, exact standard errors — is a deterministic identity an honest artifact satisfies with probability 1, so it adds nothing to the budget (unlike the D4 'perfection' rules, which rejected honest outcomes and were unpriced). These sizes are NOMINAL UPPER BOUNDS from asymptotic reference distributions (χ² and normal), not measured failure frequencies, and no honest-run trip rate is claimed from them; the exact binomial S6 is conservative. Repeated fresh simulations could calibrate them and would not prove them`,
  );

  // ── Step 17: Pass 2 — RE-DERIVE the cherry-pick scan from the dataset ──────────
  const p2 = sim.pass2;
  const p2Available = p2?.available === true;

  let s17: StepResult;
  if (!p2Available) {
    s17 = step(17, 'Simulation — Pass 2 (Cherry-Pick)', 'FLAG', 'Pass 2 unavailable (dataset absent at simulate time)');
  } else {
    const perSeed: any[] = Array.isArray(p2.perSeed) ? p2.perSeed : [];

    // (a) the screen's geometry must be the one src/config.ts declares
    const geometryOk = p2.nullMethod === 'exact-discrete-tail'
      && Number(p2.cherryWindow) === SIM_CHERRY_WINDOW
      && Number(p2.cherryBins) === SIM_CHERRY_BINS
      && p2.cherrySeedAlphaNominal === SIM_CHERRY_SEED_ALPHA
      && p2.cherryPickAlpha === ALPHA
      && p2.cherrySeedAlphaAchieved === achievedSeedAlpha()
      && p2.cherryPickP0 === CHERRY_P0;

    // (b) POPULATION identity — one row per dataset seed, keyed by the seed's own epoch
    const wantEpochs = ctx.seeds.map((s) => s.epoch).sort((a, b) => a - b);
    const gotEpochs = perSeed.map((r) => Number(r?.epoch)).sort((a, b) => a - b);
    const epochsOk = perSeed.length === ctx.seeds.length
      && new Set(gotEpochs).size === perSeed.length
      && wantEpochs.every((e, i) => gotEpochs[i] === e);

    // (c) RE-DERIVE every per-seed statistic from the dataset's own revealed seeds.
    // 134 × 100 HMACs. The artifact is compared to this, never believed.
    const seedByEpoch = new Map(ctx.seeds.map((s) => [s.epoch, s]));
    let rowMismatches = 0, firstMismatch = '';
    let flags = 0, recomputedRows = 0;
    for (const row of perSeed) {
      const s = seedByEpoch.get(Number(row?.epoch));
      if (!s || !s.serverSeed) {
        rowMismatches++;
        if (!firstMismatch) firstMismatch = `epoch ${row?.epoch}: no revealed seed in the dataset`;
        continue;
      }
      const W = SIM_CHERRY_WINDOW;
      const early: number[] = [], late: number[] = [];
      for (let i = 0; i < W; i++) {
        early.push(generateProvablyFairNumber(s.serverSeed, s.clientSeed, i, CURSOR, RANGE));
        late.push(generateProvablyFairNumber(s.serverSeed, s.clientSeed, W + i, CURSOR, RANGE));
      }
      const eSq = squareSum(early), lSq = squareSum(late);
      const eP = upperTailBySquareSum(eSq), lP = upperTailBySquareSum(lSq);
      const flag = eP < SIM_CHERRY_SEED_ALPHA && lP >= SIM_CHERRY_SEED_ALPHA;
      recomputedRows++;
      if (flag) flags++;
      const ok = row.earlySq === eSq && row.lateSq === lSq
        && row.earlyChi2 === chi2FromSquareSum(eSq) && row.lateChi2 === chi2FromSquareSum(lSq)
        && row.earlyP === eP && row.lateP === lP && row.flag === flag;
      if (!ok) {
        rowMismatches++;
        if (!firstMismatch) firstMismatch = `epoch ${row.epoch}: stored (earlySq ${row.earlySq}, earlyP ${row.earlyP}, flag ${row.flag}) vs recomputed (${eSq}, ${eP}, ${flag})`;
      }
    }
    const perSeedOk = epochsOk && rowMismatches === 0 && recomputedRows === ctx.seeds.length;

    // (d) the flag-count test, at the suite's single α, against the derived null rate
    const n = perSeed.length;
    const binomP = binomialTailP(n, flags, CHERRY_P0);
    const cherryOk = perSeedOk && geometryOk && binomP >= ALPHA;

    // DECLARED LIMITATION L4 — the screen's RESOLUTION, derived here so the artifact carries it.
    // The smallest flag count whose exact upper tail falls below α is the smallest count this
    // screen could ever reject on. Anything gentler than that is invisible to it by construction,
    // whatever it does to RTP. Mirrors outputs/report-figures.json → cherryPickPower.
    let minRejectableFlags = n;
    for (let k = 0; k <= n; k++) {
      if (binomialTailP(n, k, CHERRY_P0) < ALPHA) { minRejectableFlags = k; break; }
    }

    // (e) pooled real-roll uniformity — recomputed from ctx.bets, not read from the artifact
    const pooledDraws = ctx.bets.map((b) => Math.round(Number(b.roll) * SCALE));
    const pooledHist = new Array(100).fill(0);
    for (const d of pooledDraws) pooledHist[Math.min(99, Math.floor(d / (RANGE / 100)))]++;
    const pooledRe = chiSquaredTest(pooledHist, new Array(100).fill(pooledDraws.length / 100));
    const pooledArt = p2.pooledRealRollUniformity ?? {};
    const pooledBound = Number(pooledArt.n) === ctx.bets.length
      && agree(pooledArt.chi2, pooledRe.chi2) && Number(pooledArt.df) === pooledRe.df
      && agree(pooledArt.pValue, pooledRe.pValue);
    // DICE-22 is policy INFORMATIONAL (2026-09-29): a live-roll uniformity rejection is reported,
    // never counted and never FAILs this step. What still FAILs is a pooled record in the artifact that
    // does not reconcile with the recomputation (a forged / stale artifact is integrity, not a fit).
    const pooledFitOk = pooledRe.pValue >= ALPHA;
    const pooledOk = pooledBound;
    if (pooledBound && !pooledFitOk)
      console.log(`  [INFO] Step 17 — DICE-22 pooled live-roll uniformity p=${pooledRe.pValue.toFixed(4)} below α=${ALPHA} (informational: reported, not counted, verdict unchanged)`);

    // ── (f) SERVED-BAND PAYOUT-WEIGHTED RETURN (DICE-21, load-bearing) ──────────────────────────
    // Every revealed seed × SIM_PASS2_NONCES nonces, RE-DERIVED here from the dataset's own revealed
    // seeds; early window = the captured nonce range (0..W−1), reference = the remainder. The
    // statistic is the payout-weighted return of the bands the casino actually served, standardised
    // by its EXACT per-bet mean and variance (a scaled Poisson-binomial across seeds — each pᵢ the
    // served band's exact lattice win-probability discreteWinProbability(band)); the tail is the
    // one-sided normal (CLT) lower tail. EXACT moments + an ASYMPTOTIC tail — NOT an exact-lattice
    // CDF (src/config.ts SIM_PASS2_*, MANIFEST.md load-bearing premise, L4). Every per-epoch row is
    // recomputed and compared with EXACT equality; the aggregate is reconciled and then scored, and a
    // re-derivation mismatch OR an anomalously LOW early return (aggP < α) HARD-FAILS the step.
    const sb = p2.servedBand ?? {};
    const W2 = SIM_PASS2_EARLY_WINDOW;
    const sbGeometryOk = Number(sb.nonces) === SIM_PASS2_NONCES
      && Number(sb.earlyWindow) === W2 && Number(sb.alpha) === SIM_PASS2_ALPHA;
    const sbPerEpoch: Array<Record<string, number | string>> = Array.isArray(sb.perEpoch) ? sb.perEpoch : [];
    // Population identity: one row per REVEALED epoch that carries bets, keyed by its commitment hash.
    const wantHashes = [...ctx.seedMap.keys()].filter((h) => (ctx.byHash.get(h) ?? []).length > 0).sort();
    const gotHashes = sbPerEpoch.map((r) => String(r.serverSeedHashed)).sort();
    const sbEpochsOk = sbPerEpoch.length === wantHashes.length
      && new Set(gotHashes).size === sbPerEpoch.length
      && wantHashes.every((h, i) => gotHashes[i] === h);

    let sbRowMismatches = 0, sbRecomputedRows = 0, sbFirstMismatch = '';
    let sbTotalEarlyReturn = 0, sbTotalEarlyExpected = 0, sbTotalEarlyVar = 0, sbBelow = 0, sbAbove = 0;
    for (const row of sbPerEpoch) {
      const hash = String(row.serverSeedHashed);
      const serverSeed = ctx.seedMap.get(hash);
      const epochBets = (ctx.byHash.get(hash) ?? []).slice().sort((a, b) => a.nonce - b.nonce);
      if (!serverSeed || epochBets.length === 0) {
        sbRowMismatches++;
        if (!sbFirstMismatch) sbFirstMismatch = `epoch ${hash.slice(0, 12)}: no revealed seed`;
        continue;
      }
      const clientSeed = epochBets[0].clientSeed;
      const served: DiceParams[] = new Array(W2);
      for (const b of epochBets) if (b.nonce >= 0 && b.nonce < W2) served[b.nonce] = b.params;
      let lastSeen = served.find((x) => x) ?? epochBets[0].params;
      for (let i = 0; i < W2; i++) { if (!served[i]) served[i] = lastSeen; else lastSeen = served[i]; }

      let eR = 0, eE = 0, eV = 0, rR = 0, rE = 0, rV = 0;
      const earlyCells: { band: DiceParams; won: boolean }[] = [];
      for (let nn = 0; nn < SIM_PASS2_NONCES; nn++) {
        const band = served[nn % W2];
        const mult = quotedMultiplier(band);
        const p = discreteWinProbability(band);                       // EXACT lattice win-probability
        const roll = diceRoll(serverSeed, clientSeed, nn) / SCALE;
        const won = diceWin(roll, band);
        const ret = won ? mult : 0;
        const eRet = p * mult, vRet = p * (1 - p) * mult * mult;
        if (nn < W2) { eR += ret; eE += eRet; eV += vRet; earlyCells.push({ band, won }); }
        else         { rR += ret; rE += eRet; rV += vRet; }
      }
      sbRecomputedRows++;
      const ok = row.earlyReturn === eR && row.earlyExpected === eE && row.earlyVar === eV
        && row.refReturn === rR && row.refExpected === rE && row.refVar === rV
        && Number(row.earlyN) === W2 && Number(row.refN) === SIM_PASS2_NONCES - W2;
      if (!ok) {
        sbRowMismatches++;
        if (!sbFirstMismatch) sbFirstMismatch = `epoch ${hash.slice(0, 12)}: stored earlyReturn ${row.earlyReturn} vs recomputed ${eR}`;
      }
      sbTotalEarlyReturn += eR; sbTotalEarlyExpected += eE; sbTotalEarlyVar += eV;
      // Direction in EXACT rational arithmetic (src/config.ts servedReturnSign): comparing the two
      // float sums counts an epoch that lands exactly on its expectation (49.5 against 49.5, which
      // the floats hold as 49.5 and 49.500000000000014) as "below".
      const sign = servedReturnSign(earlyCells);
      if (sign < 0) sbBelow++; else if (sign > 0) sbAbove++;
    }
    const sbEqual = sbRecomputedRows - sbBelow - sbAbove;
    // Aggregate the early-window return — exact Poisson-binomial moments (sums of per-bet exact
    // moments), one-sided normal (CLT) lower tail. Cherry-picking shorts the early window → reject on
    // p < α.
    const sbAggZ = sbTotalEarlyVar > 0 ? (sbTotalEarlyReturn - sbTotalEarlyExpected) / Math.sqrt(sbTotalEarlyVar) : 0;
    const sbAggP = normalLowerTailP(sbAggZ);
    const sbZAlpha = inverseCriticalZ(2 * SIM_PASS2_ALPHA), sbZPower = inverseCriticalZ(2 * 0.20);
    const sbTotalEarlyBets = sbRecomputedRows * W2;
    const sbMinDetectablePerBetPct = sbTotalEarlyBets > 0
      ? ((sbZAlpha + sbZPower) * Math.sqrt(sbTotalEarlyVar) / sbTotalEarlyBets) * 100 : NaN;
    // The stored aggregates must reconcile with the re-derivation (per-row is exact; the aggregate
    // sums carry ≤1e-9 of accumulation error), and the direction split must match exactly.
    const sbAggMatch = sbPerEpoch.length > 0
      && Math.abs(Number(sb.totalEarlyReturn) - sbTotalEarlyReturn) < 1e-9
      && Math.abs(Number(sb.totalEarlyExpected) - sbTotalEarlyExpected) < 1e-9
      && Math.abs(Number(sb.totalEarlyVar) - sbTotalEarlyVar) < 1e-9
      && Number(sb.directionBelow) === sbBelow && Number(sb.directionAbove) === sbAbove;
    const sbRederivedOk = sbGeometryOk && sbEpochsOk && sbRowMismatches === 0
      && sbRecomputedRows === wantHashes.length && sbAggMatch;
    const sbCherryClean = sbAggP >= SIM_PASS2_ALPHA;                   // HARD_FAIL on a cherry-pick signal
    const servedBandOk = sbRederivedOk && sbCherryClean;

    const recomputed17 = servedBandOk && cherryOk && pooledOk;
    const selfReport17 = p2.cherryPickConsistent === true && pooledArt.pass === true;
    const agree17 = (cherryOk && pooledOk && pooledFitOk) === selfReport17;

    s17 = step(17, 'Simulation — Pass 2 (Cherry-Pick)',
      recomputed17 && agree17 ? 'PASS' : 'FAIL',
      `DICE-21 served-band return (load-bearing): ${sbRecomputedRows} revealed epochs × ${SIM_PASS2_NONCES.toLocaleString()} nonces, ALL windows RE-DERIVED from the revealed seeds (early 0–${W2 - 1} = captured range, reference ${W2}–${SIM_PASS2_NONCES - 1}), ${sbRowMismatches} row mismatch${sbFirstMismatch ? ` (first: ${sbFirstMismatch})` : ''}, epoch identity ${sbEpochsOk ? 'ok' : 'MISMATCH'}, aggregate reconciliation ${sbAggMatch ? 'ok' : 'MISMATCH'}; `
      + `statistic = payout-weighted served-band return standardised by its EXACT per-bet mean and variance (a scaled Poisson-binomial across seeds, each pᵢ the served band's exact lattice win-probability) — EXACT moments, ASYMPTOTIC one-sided normal (CLT) lower tail, NOT an exact-lattice CDF (see MANIFEST.md load-bearing premise / L4): aggregate early z=${sbAggZ.toFixed(3)}, one-sided lower-tail p=${sbAggP.toFixed(4)} vs α=${SIM_PASS2_ALPHA} → ${sbCherryClean ? 'no return deficit detected at this power' : 'RETURN DEFICIT — CHERRY-PICK SIGNAL'}; the test detects a per-bet return deficit of ${Number.isFinite(sbMinDetectablePerBetPct) ? sbMinDetectablePerBetPct.toFixed(3) : 'n/a'} pp or more at 80% power, so a smaller selection effect would pass; direction split ${sbBelow} below / ${sbEqual} equal / ${sbAbove} above expectation (exact arithmetic) (${servedBandOk ? 'ok' : 'FAIL'}). `
      + `SUPPLEMENTARY draw-uniformity screen: ${n} casino seeds vs dataset ${ctx.seeds.length} (epoch identity ${epochsOk ? 'ok' : 'MISMATCH'}); `
      + `all ${recomputedRows} per-seed χ² windows RE-DERIVED from the revealed seeds (${SIM_CHERRY_WINDOW}+${SIM_CHERRY_WINDOW} draws each), ${rowMismatches} row mismatches${firstMismatch ? ` — first: ${firstMismatch}` : ''}; `
      + `null = exact discrete tail of the n=${SIM_CHERRY_WINDOW}/${SIM_CHERRY_BINS}-bin χ² (${p2.nullSupportValues} attainable values, ${p2.nullPartitions} partitions; geometry ${geometryOk ? 'ok' : 'MISMATCH'}); `
      + `cherry-pick flags ${flags} (recomputed) vs ${(n * CHERRY_P0).toFixed(2)} expected; exact binomial P(X≥${flags})=${binomP.toFixed(4)} vs α=${ALPHA} → ${cherryOk ? 'consistent with chance' : 'ELEVATED'}; `
      + `DICE-22 pooled real-roll uniformity over ${pooledDraws.length} captured rolls: chi²=${pooledRe.chi2.toFixed(3)} df=${pooledRe.df} → p=${pooledRe.pValue.toFixed(4)} (recomputed from the dataset; artifact ${pooledBound ? 'reconciled' : 'MISMATCH'}) (${!pooledOk ? 'FAIL' : pooledFitOk ? 'ok' : 'DEVIATION — informational, not counted'}); `
      + `supplementary-screen self-report ${selfReport17 ? 'pass' : 'fail'}`
      + (agree17 ? '' : ' — DISAGREES with recomputation (artifact self-report tampered?)')
      // DECLARED LIMITATION L4. The supplementary draw-uniformity screen's resolution and blind spot,
      // recomputed here rather than asserted in prose.
      + `; SCOPE — the served-band return is now the load-bearing return-based DICE-21 statistic; the draw-uniformity screen is retained as a supplementary exact-discrete check needing ${minRejectableFlags} flag(s) to reject at α=${ALPHA} (P(X≥${minRejectableFlags})=${binomialTailP(n, minRejectableFlags, CHERRY_P0).toFixed(4)}). The served-band tail is asymptotic (CLT) on exact moments, not an exact-lattice CDF — declared L4/load-bearing premise in MANIFEST.md; a single-target-per-epoch re-capture would make the exact CDF tractable. The load-bearing cherry-pick defence remains structural (client-seed-after-commitment)`,
    );
  }

  return [s16, s17];
}
