/** Score saved Pass-1 summaries and recompute Pass 2 from the revealed seeds.
 * Statistical definitions and replay boundaries: AUDIT_CONTEXT.md §9.
 */
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'node:crypto';
import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { chiSquaredPValue, chiSquaredTest, binomialTailP, inverseCriticalZ, twoSidedNormalP } from '../../src/stats';
import {
  RANGE, SCALE, CURSOR, HOUSE_EDGE, ALPHA, ALPHA_SCREEN, ALPHA_SCREENS,
  SIM_UNIFORMITY_DRAWS, SIM_SERIAL_DRAWS, SIM_EDGE_BETS, SIM_RTP_BETS, SIM_RTP_MARKS,
  SIM_EDGE_BANDS, SIM_RTP_STRATEGY, SIM_CHERRY_BINS, SIM_CHERRY_WINDOW, SIM_CHERRY_SEED_ALPHA,
  bandKey, theoreticalRTP, quotedMultiplier, discreteWinProbability,
} from '../../src/config';
import { squareSum, upperTailBySquareSum, chi2FromSquareSum, cherryFlagRate, achievedSeedAlpha } from '../../src/exact-chi2';
import { generateProvablyFairNumber } from '../../src/rng';
import {
  SIM_SCHEMA_VERSION, recoverWinCount, validateConvergenceSeries, runsStatistic,
  SCORED_STATISTICAL_PREDICATES, FAMILY_WISE_BOUND, STEP_16_BOUND,
} from '../../src/sim-checks';

const CHERRY_P0 = cherryFlagRate();

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
  ctx.simArtifact = { file: 'outputs/simulation-results.json', sha256: createHash('sha256').update(raw).digest('hex'), generatedAt: sim.generatedAt ?? null };

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
    && uni.pValue === uniP;                                    // stored p must BE the recomputed p

  // (b) serial screen — depth pinned, and lag1Z re-derived from the correlation it summarises.
  // Both arms judged at ALPHA_SCREEN (Bonferroni), and both are already two-sided.
  const ser = p1?.serial ?? {};
  const zCrit = inverseCriticalZ(ALPHA_SCREEN);                // derived from α/k (not ser.zCritical)
  const lag1 = Number(ser.lag1), lag1Z = Number(ser.lag1Z), runsZ = Number(ser.runsZ);
  const lag1ZDerived = lag1 * Math.sqrt(SIM_SERIAL_DRAWS);
  const runsPDerived = twoSidedNormalP(runsZ);                 // derived from runsZ (not ser.runsP)

  const schemaVersion = Number(sim.schemaVersion ?? 1);
  const schemaKnown = schemaVersion === 1 || schemaVersion === SIM_SCHEMA_VERSION;

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

  const zCriticalStored = Number(ser.zCritical);
  const zCriticalOk = schemaVersion >= 2 ? zCriticalStored === zCrit : true;
  const zCriticalNote = schemaVersion >= 2
    ? (zCriticalOk ? `stored zCritical ${zCriticalStored} IS the applied threshold` : `stored zCritical ${zCriticalStored} != applied ${zCrit}`)
    : `stored zCritical ${Number.isFinite(zCriticalStored) ? zCriticalStored : 'absent'} is a schema-1 field at the uncorrected α and is not read; the threshold APPLIED is ${zCrit}`;

  const serialPass = schemaKnown && Number(ser.n) === SIM_SERIAL_DRAWS
    && Number.isFinite(lag1) && Number.isFinite(lag1Z) && lag1Z === lag1ZDerived
    && Math.abs(lag1Z) < zCrit
    && Number.isFinite(runsZ) && runsPDerived >= ALPHA_SCREEN && ser.runsP === runsPDerived
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

  const series = validateConvergenceSeries(convPts, convM, convTheo);
  const convPass = convIdentity && series.ok && Number.isFinite(convRtp)
    && Math.abs(convRtp - convTheo) <= 5 * convSe + 1e-4;
  // Reported so the chapters can cite Δ/SE from a producing artifact instead of typing it
  // (rtp-analysis.md's verdict table said "≈0.7·SE" against an artifact that gives 1.04).
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
    + `; OBSERVED (not scored): ${edgeOnTheory} effective-edge row(s) and ${series.exactlyOnTheory} convergence point(s) sit exactly on theory, and runsZ is ${runsZ === 0 ? 'exactly 0' : 'nonzero'} — all legitimate outcomes under the null, reported rather than rejected`
    // DECLARED LIMITATION L1, and the error budget the verdict actually rests on.
    + `; SCOPE — saved Pass-1 summaries satisfy structural consistency, integer-return reconstruction and the declared statistical screens. The original random inputs were not retained; their raw statistics cannot be replayed. npm run test:full generates a new experiment. See AUDIT_CONTEXT.md §9 and §11, L1`
    + `; STATISTICAL ALLOWANCES — ${SCORED_STATISTICAL_PREDICATES.length} screens across Steps 16-17: ${SCORED_STATISTICAL_PREDICATES.map((s) => `${s.id} ${s.screen} [${s.size}]`).join('; ')}. S1-S3 use Bonferroni at α=${ALPHA}; the combined nominal allowance is ≈${STEP_16_BOUND.toFixed(7)} for Step 16 and ≈${FAMILY_WISE_BOUND.toFixed(4)} across both steps. Chi-squared and normal components use asymptotic reference distributions; these are not measured finite-sample failure frequencies. Deterministic reconciliation checks are separate. See AUDIT_CONTEXT.md §9`,
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
      && pooledArt.chi2 === pooledRe.chi2 && Number(pooledArt.df) === pooledRe.df
      && pooledArt.pValue === pooledRe.pValue;
    const pooledOk = pooledBound && pooledRe.pValue >= ALPHA;

    const recomputed17 = cherryOk && pooledOk;
    const selfReport17 = p2.cherryPickConsistent === true && pooledArt.pass === true;
    const agree17 = recomputed17 === selfReport17;

    s17 = step(17, 'Simulation — Pass 2 (Cherry-Pick)',
      recomputed17 && agree17 ? 'PASS' : 'FAIL',
      `${n} casino seeds vs dataset ${ctx.seeds.length} (epoch identity ${epochsOk ? 'ok' : 'MISMATCH'}); `
      + `all ${recomputedRows} per-seed χ² windows RE-DERIVED from the revealed seeds (${SIM_CHERRY_WINDOW}+${SIM_CHERRY_WINDOW} draws each), ${rowMismatches} row mismatches${firstMismatch ? ` — first: ${firstMismatch}` : ''}; `
      + `null = exact discrete tail of the n=${SIM_CHERRY_WINDOW}/${SIM_CHERRY_BINS}-bin χ² (${p2.nullSupportValues} attainable values, ${p2.nullPartitions} partitions; geometry ${geometryOk ? 'ok' : 'MISMATCH'}); `
      + `achieved per-window rejection ${achievedSeedAlpha().toFixed(10)} at nominal α_seed ${SIM_CHERRY_SEED_ALPHA} → flag rate p0=${CHERRY_P0.toFixed(10)} (derived, not read); `
      + `cherry-pick flags ${flags} (recomputed) vs ${(n * CHERRY_P0).toFixed(2)} expected; exact binomial P(X≥${flags})=${binomP.toFixed(4)} vs α=${ALPHA} → ${cherryOk ? 'consistent with chance' : 'ELEVATED'}; `
      + `pooled real-roll uniformity over ${pooledDraws.length} captured rolls: chi²=${pooledRe.chi2.toFixed(3)} df=${pooledRe.df} → p=${pooledRe.pValue.toFixed(4)} (recomputed from the dataset; artifact ${pooledBound ? 'reconciled' : 'MISMATCH'}) (${pooledOk ? 'ok' : 'FAIL'}); `
      + `artifact self-report ${selfReport17 ? 'pass' : 'fail'}`
      + (agree17 ? '' : ' — DISAGREES with recomputation (artifact self-report tampered?)')
      // DECLARED LIMITATION L4. Resolution and blind spot, recomputed here rather than asserted in
      // prose: the smallest flag count this screen can reject at α, and what the statistic is
      // blind to by construction.
      + `; SCOPE — rejection requires ${minRejectableFlags} flags at α=${ALPHA} (P(X≥${minRejectableFlags})=${binomialTailP(n, minRejectableFlags, CHERRY_P0).toFixed(4)}). This tests the defined early-window uniformity pattern; it does not rule out every seed-selection strategy. Client-seed control and predictability are assessed separately in AUDIT_CONTEXT.md §9 and §11, L4 and L12`,
    );
  }

  return [s16, s17];
}
