
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'node:crypto';

import { diceRoll, generateProvablyFairNumber } from './rng';
import { chiSquaredTest, lag1Autocorrelation, runsTest, inverseCriticalZ, binomialTailP } from './stats';
import {
  RANGE, CURSOR, SCALE, HOUSE_EDGE, ALPHA, ALPHA_SCREEN, DATASET_SHA256,
  SIM_UNIFORMITY_DRAWS, SIM_SERIAL_DRAWS, SIM_EDGE_BETS, SIM_RTP_BETS, SIM_RTP_MARKS,
  SIM_EDGE_BANDS, SIM_RTP_STRATEGY, SIM_CHERRY_BINS, SIM_CHERRY_WINDOW, SIM_CHERRY_SEED_ALPHA,
  quotedMultiplier, discreteWinProbability, theoreticalRTP, diceWin,
} from './config';
import { squareSum, upperTailBySquareSum, chi2FromSquareSum, cherryFlagRate, achievedSeedAlpha, exactNull } from './exact-chi2';
import { SIM_SCHEMA_VERSION } from './sim-checks';
import { loadDataset } from './loader';
import { renderConvergenceChart } from './chart';

const OUT = path.join(__dirname, '../outputs');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const P1_DRAWS = SIM_UNIFORMITY_DRAWS;   // Pass-1 uniformity draw sample (2,000,000)
const SERIAL_DRAWS = SIM_SERIAL_DRAWS;   // serial (lag-1 / runs) analysed on the first 200,000
const RTP_BETS = SIM_RTP_BETS;           // RTP convergence depth (20,000,000)
const EDGE_BETS = SIM_EDGE_BETS;         // per-band effective-edge sim depth (2,000,000)
const EXPECTED_DATASET_HASH = DATASET_SHA256;

const randSeed = () => randomBytes(16).toString('hex');   // 16 bytes → 32 hex chars (operator format)

// A fast single draw from a fresh seed stream — one HMAC per draw, cursor 0.
function drawFrom(serverSeed: string, clientSeed: string, nonce: number): number {
  return generateProvablyFairNumber(serverSeed, clientSeed, nonce, CURSOR, RANGE);
}

// ───────────────────────── Pass 1 ─────────────────────────
function pass1() {
  // (1) Draw uniformity over 100 bins.
  const BINS = 100, per = RANGE / BINS;
  const hist = new Array(BINS).fill(0);
  const rollSeq: number[] = [];
  const runsSeq: number[] = [];
  let ss = randSeed(); const cs = randSeed();
  for (let i = 0; i < P1_DRAWS; i++) {
    if (i % 50 === 0) ss = randSeed();               // rotate seed like real epochs
    const draw = drawFrom(ss, cs, i % 50);
    hist[Math.floor(draw / per)]++;
    if (i < SERIAL_DRAWS) { const roll = draw / SCALE; rollSeq.push(roll); runsSeq.push(roll >= 50 ? 1 : 0); }
  }
  const expected = new Array(BINS).fill(P1_DRAWS / BINS);
  const uni = chiSquaredTest(hist, expected);

  const lag1 = lag1Autocorrelation(rollSeq);
  const zcrit = inverseCriticalZ(ALPHA_SCREEN);
  const lag1Z = lag1 * Math.sqrt(rollSeq.length);
  const runs = runsTest(runsSeq);

  // (3) RTP convergence for a fixed strategy (under 50 → 1.98×).
  const strat = SIM_RTP_STRATEGY;
  const mult = quotedMultiplier(strat);
  const points: { n: number; wins: number; rtp: number; se: number }[] = [];
  let wins = 0, staked = 0, won = 0;
  let cs2 = randSeed(), ss2 = randSeed();
  const marks = new Set<number>(SIM_RTP_MARKS);
  for (let i = 1; i <= RTP_BETS; i++) {
    if (i % 50 === 1) ss2 = randSeed();
    const roll = drawFrom(ss2, cs2, i % 50) / SCALE;
    const w = diceWin(roll, strat);
    staked += 1; if (w) { won += mult; wins++; }
    if (marks.has(i)) {
      const rtp = won / staked;
      // per-bet payout variance for SE (0 or mult) — EMPIRICAL p, matching src/sim-checks.ts
      const p = wins / i, varr = p * (mult - rtp) ** 2 + (1 - p) * (0 - rtp) ** 2;
      points.push({ n: i, wins, rtp, se: Math.sqrt(varr / i) });
    }
  }
  const finalRtp = won / staked;

  // (4) Effective-edge table across modes — the canonical band list lives in src/config.ts
  // (SIM_EDGE_BANDS) and Step 16 requires the artifact's rows to BE those bands, distinct.
  const edgeRows = SIM_EDGE_BANDS.map(({ label, params: p }) => {
    const m = quotedMultiplier(p);
    let st = 0, wn = 0, wi = 0;
    let s = randSeed(), c = randSeed();
    for (let i = 0; i < EDGE_BETS; i++) {
      if (i % 50 === 0) s = randSeed();
      const roll = drawFrom(s, c, i % 50) / SCALE;
      st += 1; if (diceWin(roll, p)) { wn += m; wi++; }
    }
    const simRtp = wn / st, theo = theoreticalRTP(p);
    const pr = discreteWinProbability(p);
    const se = Math.sqrt(pr * (m - simRtp) ** 2 + (1 - pr) * simRtp ** 2) / Math.sqrt(EDGE_BETS);
    return {
      label, params: p, quotedMultiplier: m,
      discreteWinPct: pr * 100,
      theoreticalRTP: theo, theoreticalEdgePct: (1 - theo) * 100,
      simulatedRTP: simRtp, deltaSE: Math.abs(simRtp - theo) / se, tolSE: 5,
      n: EDGE_BETS, wins: wi, se,
      withinTol: Math.abs(simRtp - theo) <= 5 * se + 1e-4,
    };
  });

  return {
    draws: P1_DRAWS,
    uniformity: { bins: BINS, n: P1_DRAWS, chi2: uni.chi2, df: uni.df, pValue: uni.pValue,
      pass: uni.pValue >= ALPHA_SCREEN / 2 && uni.pValue <= 1 - ALPHA_SCREEN / 2 },
    serial: {
      n: SERIAL_DRAWS,
      lag1, lag1Z, zCritical: zcrit,
      runsZ: runs.z, runsP: runs.pValue,
      runs: runs.runs, runsExpected: runs.expected, n1: runs.n1, runsVariance: runs.variance,
      pass: Math.abs(lag1Z) < zcrit && runs.pValue >= ALPHA_SCREEN,
    },
    rtpConvergence: {
      strategy: 'under 50', params: strat, multiplier: mult,
      n: RTP_BETS, marks: [...SIM_RTP_MARKS],
      theoreticalRTP: theoreticalRTP(strat),
      finalRTP: points[points.length - 1].rtp,
      finalRTPRunning: finalRtp,
      points,
    },
    effectiveEdge: edgeRows,
  };
}

// ───────────────────────── Pass 2 ─────────────────────────
// Uses the revealed server seeds from the dataset (loaded lazily to avoid a hard dep when
// the dataset path is not present; simulation is still meaningful from Pass 1 alone).
function pass2() {
  const dsPath = path.join(__dirname, '../data/dice-master-6700bets.json');
  if (!fs.existsSync(dsPath)) return { available: false as const };
  const ds = loadDataset(dsPath, EXPECTED_DATASET_HASH);   // SHA-256-guarded (aborts on tamper)
  const seeds: { epoch: number; serverSeed: string | null; clientSeed: string }[] = ds.seeds;

  const W = SIM_CHERRY_WINDOW;

  // The per-window statistic is the INTEGER square sum S = Σ h_i² (χ² is an affine function of
  // it); its exact null is enumerated once in src/exact-chi2.ts. Storing S alongside the p-value
  // lets Step 17 re-derive both from the dataset's own seeds and compare with exact equality.
  let flagged = 0;
  const perSeed: {
    epoch: number; earlySq: number; lateSq: number;
    earlyChi2: number; lateChi2: number; earlyP: number; lateP: number; flag: boolean;
  }[] = [];
  // The row key is the SEED RECORD's own epoch, not the array index — the artifact row is bound
  // to the source record it was computed from, so the verifier can re-derive it (G-BIND).
  seeds.forEach((s) => {
    const epoch = s.epoch;
    if (!s.serverSeed) return;
    const early = Array.from({ length: W }, (_, i) => drawFrom(s.serverSeed!, s.clientSeed, i));
    const late = Array.from({ length: W }, (_, i) => drawFrom(s.serverSeed!, s.clientSeed, W + i));
    const earlySq = squareSum(early), lateSq = squareSum(late);
    const earlyP = upperTailBySquareSum(earlySq), lateP = upperTailBySquareSum(lateSq);
    const flag = earlyP < SIM_CHERRY_SEED_ALPHA && lateP >= SIM_CHERRY_SEED_ALPHA;
    if (flag) flagged++;
    perSeed.push({
      epoch, earlySq, lateSq,
      earlyChi2: chi2FromSquareSum(earlySq), lateChi2: chi2FromSquareSum(lateSq),
      earlyP, lateP, flag,
    });
  });

  // Pooled uniformity of all revealed real rolls (whole-dataset control).
  const allDraws: number[] = [];
  for (const b of ds.bets as { roll: number }[]) allDraws.push(Math.round(b.roll * SCALE));
  const pooled = chiSquaredTest(
    (() => { const h = new Array(100).fill(0); for (const d of allDraws) h[Math.min(99, Math.floor(d / (RANGE / 100)))]++; return h; })(),
    new Array(100).fill(allDraws.length / 100),
  );

  const n = perSeed.length;
  const p0 = cherryFlagRate();
  const mean = n * p0;
  const binomialP = binomialTailP(n, flagged, p0);                   // exact one-sided P(X ≥ flagged)
  const nul = exactNull();

  return {
    available: true as const,
    seedsTested: n,
    // The null is now exact and enumerated, not sampled: these two fields replace the old
    // `bootstrap: 10000` and are what make Pass 2 reproducible run to run.
    nullMethod: 'exact-discrete-tail' as const,
    nullPartitions: nul.partitions,
    nullSupportValues: nul.support.length,
    cherryWindow: W,
    cherryBins: SIM_CHERRY_BINS,
    cherrySeedAlphaNominal: SIM_CHERRY_SEED_ALPHA,
    cherrySeedAlphaAchieved: achievedSeedAlpha(),
    cherryPickFlags: flagged,
    cherryPickP0: p0,
    cherryPickExpected: mean,
    cherryPickBinomialP: binomialP,
    cherryPickAlpha: ALPHA,
    cherryPickConsistent: binomialP >= ALPHA,
    pooledRealRollUniformity: { n: allDraws.length, chi2: pooled.chi2, df: pooled.df, pValue: pooled.pValue, pass: pooled.pValue >= ALPHA },
    perSeed,
  };
}

function writeChart(rtp: { points: { n: number; rtp: number; se: number }[]; theoreticalRTP: number }) {
  fs.writeFileSync(path.join(OUT, 'rtp-convergence.html'), renderConvergenceChart(rtp));
}

// ───────────────────────── main ─────────────────────────
console.log('\n── LIQD Dice simulation ──');
const p1 = pass1();
console.log(`  Pass 1 draw uniformity : chi2=${p1.uniformity.chi2.toFixed(3)} df=${p1.uniformity.df} p=${p1.uniformity.pValue.toFixed(4)} ${p1.uniformity.pass ? '✓' : '✗'}`);
console.log(`  Pass 1 serial          : lag1Z=${p1.serial.lag1Z.toFixed(3)} runsP=${p1.serial.runsP.toFixed(4)} ${p1.serial.pass ? '✓' : '✗'}`);
console.log(`  Pass 1 RTP (under 50)  : sim ${(p1.rtpConvergence.finalRTP * 100).toFixed(3)}%  theo ${(p1.rtpConvergence.theoreticalRTP * 100).toFixed(3)}%`);
console.log(`  Pass 1 effective-edge  : ${p1.effectiveEdge.filter(r => r.withinTol).length}/${p1.effectiveEdge.length} bands within 5·SE`);
const p2 = pass2();
if (p2.available) console.log(`  Pass 2 casino seeds    : ${p2.seedsTested} seeds, exact null (${p2.nullSupportValues} support values from ${p2.nullPartitions} partitions), cherry-pick flags ${p2.cherryPickFlags} (expected ${p2.cherryPickExpected.toFixed(2)} at p0=${p2.cherryPickP0.toFixed(10)}, exact P(X≥${p2.cherryPickFlags})=${p2.cherryPickBinomialP.toFixed(4)} vs α=${p2.cherryPickAlpha} → ${p2.cherryPickConsistent ? 'consistent with chance ✓' : 'ELEVATED ✗'}), pooled real-roll p=${p2.pooledRealRollUniformity.pValue.toFixed(4)}`);
writeChart(p1.rtpConvergence);

fs.writeFileSync(path.join(OUT, 'simulation-results.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  schemaVersion: SIM_SCHEMA_VERSION,
  model: { range: RANGE, cursor: CURSOR, scale: SCALE, houseEdge: HOUSE_EDGE },
  pass1: p1, pass2: p2,
}, null, 2));
console.log('  Output: outputs/simulation-results.json, outputs/rtp-convergence.html\n');
export {};
