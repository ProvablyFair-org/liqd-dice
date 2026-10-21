/**
 * LIQD Dice — Monte-Carlo simulation (Pass 1 + Pass 2).
 *
 * The dice outcome is a SINGLE bias-free draw in [0, 10000) at cursor 0, scaled /100 to a
 * roll in [0.00, 99.99] (src/rng.ts diceRoll). A bet wins if the roll lies inside (or, when
 * `inverted`, outside) the HALF-OPEN band [lower, upper) — lower inclusive, upper
 * exclusive, pinned by the operator-verifier boundary probes (E13). There is no
 * per-tile / sequence structure — the RNG null is simply "the draw is uniform on 0..9999 and serially
 * independent", which is a proper single-outcome multinomial, so standard chi² (df = bins−1)
 * is the correct test here.
 *
 * Pass 1 — auditor seeds, derived deterministically from the pinned SIM_MASTER_SEED (HMAC counter,
 * see randSeed below), independent of the casino's captured seeds:
 *   1. Draw uniformity (scored): histogram of the integer draw 0..9999 pooled into 100 bins
 *      of 100 values each over N draws; chi² vs N/100, df = 99.
 *   2. Serial independence (scored): lag-1 autocorrelation + runs test on the roll sequence
 *      (runs about the 50.00 midpoint).
 *   3. RTP convergence (informational + chart): a fixed strategy (under 50, 1.98×) simulated
 *      to N bets; running RTP → theoreticalRTP with a Standard-Error band SE = σ/√n.
 *   4. Effective-edge table (scored): for representative bands across all four modes, the
 *      simulated return converges to theoreticalRTP(band) = 1 − effectiveEdge(band); the max
 *      |simRTP − theoRTP| must fall inside a 5·SE + buffer tolerance.
 *
 * Pass 2 — casino seeds from the captured dataset's revealed serverSeeds. TWO screens:
 *   (a) SERVED-BAND PAYOUT-WEIGHTED RETURN (DICE-21, load-bearing): every revealed seed replayed for
 *       SIM_PASS2_NONCES nonces; early window = the captured nonce range (0..49), reference = the
 *       remainder; the statistic is the payout-weighted return of the bands the casino actually
 *       served, standardised by its EXACT per-bet mean and variance (a scaled Poisson-binomial across
 *       seeds, each pᵢ the served band's exact lattice win-probability), read against the one-sided
 *       normal (CLT) lower tail. EXACT moments + an ASYMPTOTIC tail — NOT an exact-lattice CDF (see
 *       src/config.ts SIM_PASS2_*).
 *   (b) DRAW-UNIFORMITY cherry-pick (supplementary): early window = nonces 0..49, late = 50..99;
 *       statistic = draw-uniformity chi² over SIM_CHERRY_BINS bins (n=50), scored against its EXACT
 *       discrete null (src/exact-chi2.ts); flag if earlyP < SIM_CHERRY_SEED_ALPHA AND lateP ≥ it.
 *   Every Pass-2 number is a deterministic function of the pinned dataset, so re-running this
 *   producer reproduces the artifact's Pass 2 byte-for-byte. A sampled null — a 10,000-replicate
 *   bootstrap redrawn per run — would instead make the flag count random.
 *
 * ARTIFACT PRECISION. Every statistic is written at FULL precision, never `toFixed`-rounded.
 * The verifier reconciles the artifact against its own recomputation: integers and pure-arithmetic
 * statistics exactly; libm-dependent floats (p-values, quantiles) at 1e-14 absolute + 1e-12
 * relative (src/diff.ts numbersAgree, since 2026-09-28); the served-band aggregate sums at 1e-9.
 * A rounded field would force a wider tolerance, and a tolerance is where a forgery hides. The
 * report rounds for reading; the artifact does not round at all.
 *
 * THIS SCRIPT IS NOT PART OF `npm test`. `npm test` is
 * `mocha && npm run verify` and scores the COMMITTED artifact, which `SIMULATION_SHA256` pins — so
 * the verdict of record is deterministic and Step 16 is not a fresh statistical experiment on every
 * run. Regeneration is `npm run test:full` (`mocha && npm run simulate && SIM_FRESH=1 npm run
 * verify`), which records the fresh hash instead of enforcing the pin.
 *
 * IF YOU REGENERATE, YOU MUST RE-PIN AND RE-SWEEP. `SIMULATION_SHA256` and
 * `SIMULATION_HTML_SHA256` in src/config.ts must be updated to the new files, and every Pass-1
 * figure quoted in the .md chapters (uniformity χ², serial z-scores, the nine band RTPs, the
 * convergence series and its Δ/SE) is now stale — sweep them in the same pass. Steps 16/19 will tell
 * you the pin is wrong; nothing will tell you the prose is.
 *
 * Output: outputs/simulation-results.json, outputs/rtp-convergence.html
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHmac } from 'node:crypto';

import { diceRoll, generateProvablyFairNumber } from './rng';
import { chiSquaredTest, lag1Autocorrelation, runsTest, inverseCriticalZ, binomialTailP, normalLowerTailP } from './stats';
import {
  RANGE, CURSOR, SCALE, HOUSE_EDGE, ALPHA, ALPHA_SCREEN, DATASET_SHA256,
  SIM_UNIFORMITY_DRAWS, SIM_SERIAL_DRAWS, SIM_EDGE_BETS, SIM_RTP_BETS, SIM_RTP_MARKS,
  SIM_EDGE_BANDS, SIM_RTP_STRATEGY, SIM_CHERRY_BINS, SIM_CHERRY_WINDOW, SIM_CHERRY_SEED_ALPHA,
  SIM_PASS2_NONCES, SIM_PASS2_EARLY_WINDOW, SIM_PASS2_ALPHA,
  SIM_MASTER_SEED,
  quotedMultiplier, discreteWinProbability, theoreticalRTP, diceWin, servedReturnSign,
} from './config';
import type { DiceParams } from './types';
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
// Pinned dataset hash — Pass 2 loads the dataset through the SHA-256-guarded loader, so a
// tampered dataset aborts the simulation rather than being scored.
// Single-sourced in src/config.ts so producer and verifier cannot pin different captures.
const EXPECTED_DATASET_HASH = DATASET_SHA256;

// DETERMINISTIC "fresh" seed stream (DICE-20). Every Pass-1 seed is HMAC-SHA256(SIM_MASTER_SEED,
// counter) truncated to 16 bytes → 32 hex chars (operator format). The seeds are auditor-generated
// and independent of the casino's captured server seeds — "fresh" in the sense DICE-20 requires —
// but consumed in a fixed order from a PINNED master seed, so the whole experiment reproduces
// bit-for-bit on any machine (replacing `crypto.randomBytes`, which made the artifact impossible to
// replay and its raw statistics attestable only by a nine-minute regeneration). The counter is a
// module-global reset to 0 at the top of `pass1()`, so a single `npm run simulate` is reproducible.
const SIM_MASTER_KEY = Buffer.from(SIM_MASTER_SEED, 'hex');
let simSeedCounter = 0;
const randSeed = (): string =>
  createHmac('sha256', SIM_MASTER_KEY).update(String(simSeedCounter++)).digest().subarray(0, 16).toString('hex');

// A fast single draw from a fresh seed stream — one HMAC per draw, cursor 0.
function drawFrom(serverSeed: string, clientSeed: string, nonce: number): number {
  return generateProvablyFairNumber(serverSeed, clientSeed, nonce, CURSOR, RANGE);
}

// ───────────────────────── Pass 1 ─────────────────────────
function pass1() {
  simSeedCounter = 0;   // reset the deterministic seed stream so `npm run simulate` is reproducible
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

  // (2) Serial independence on the roll sequence.
  // ALPHA_SCREEN, not ALPHA: Step 16 judges three screens, so each is Bonferroni-corrected to
  // ALPHA/3 and the STEP's level is ALPHA. Producer and verifier import the SAME constant (S-CONST)
  // — a `pass` boolean emitted here at a different level than the one the verifier applies is
  // exactly how the two sides of the cherry-pick null drift apart.
  const lag1 = lag1Autocorrelation(rollSeq);
  const zcrit = inverseCriticalZ(ALPHA_SCREEN);
  const lag1Z = lag1 * Math.sqrt(rollSeq.length);
  const runs = runsTest(runsSeq);

  // (3) RTP convergence for a fixed strategy (under 50 → 1.98×).
  const strat = SIM_RTP_STRATEGY;
  const mult = quotedMultiplier(strat);
  // SCHEMA 2: the INTEGER win count is stored beside every checkpoint.
  // Without it the verifier can only reconstruct `wins` from `rtp·n/m`, which works — the residual
  // is 0.0018 at the pinned depth — but it is a reconstruction with a numerical policy attached,
  // and the empirical win probability behind the standard error was ambiguous with the theoretical
  // one. Stored, the SE is a plain deterministic function of fields on the record.
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
      // n + se are stored so Steps 16-17 can RECOMPUTE the within-tolerance predicate from the
      // statistics rather than trusting this row's own `withinTol` boolean.
      // `wins` is schema 2: the integer count behind simulatedRTP, so the row's central
      // statistic is bound to a countable quantity rather than being a free real number.
      n: EDGE_BETS, wins: wi, se,
      withinTol: Math.abs(simRtp - theo) <= 5 * se + 1e-4,
    };
  });

  return {
    draws: P1_DRAWS,
    // Two-sided at ALPHA_SCREEN: the upper tail is the real test, the lower tail is the
    // fabrication screen (a chi-squared this good at n=2,000,000 was written, not measured). This is
    // an ordinary two-sided test with an ordinary size, unlike an equality predicate with no size.
    uniformity: { bins: BINS, n: P1_DRAWS, chi2: uni.chi2, df: uni.df, pValue: uni.pValue,
      pass: uni.pValue >= ALPHA_SCREEN / 2 && uni.pValue <= 1 - ALPHA_SCREEN / 2 },
    serial: {
      // n is stored so Step 16 can reject a serial block computed at a different depth, and
      // lag1Z is reconciled against lag1 · √n exactly. A step that reads the stored z and never
      // re-derives it from the correlation it is supposed to summarise passes a `lag1` of 1
      // sitting beside a small, stale `lag1Z`.
      n: SERIAL_DRAWS,
      lag1, lag1Z, zCritical: zcrit,
      runsZ: runs.z, runsP: runs.pValue,
      // SCHEMA 2: the runs test's own CELL COUNTS, so Step 16 can
      // re-derive `runsZ` and can tell the one condition worth rejecting — zero variance, i.e.
      // every roll on one side of the midpoint — from a z that merely landed on its expectation.
      // Rejecting `runsZ === 0` would be the defect; `variance === 0` is the real degeneracy.
      runs: runs.runs, runsExpected: runs.expected, n1: runs.n1, runsVariance: runs.variance,
      // criterion is the documented critical z at the Bonferroni-corrected α_screen = α/3, NOT a
      // hardcoded 3; Step 16 recomputes the same predicate from lag1Z + the α_screen it derives
      // itself. The predicate does NOT carry `lag1 !== 0 && runs.z !== 0`: both are legitimate
      // outcomes under the null.
      pass: Math.abs(lag1Z) < zcrit && runs.pValue >= ALPHA_SCREEN,
    },
    rtpConvergence: {
      strategy: 'under 50', params: strat, multiplier: mult,
      n: RTP_BETS, marks: [...SIM_RTP_MARKS],
      theoreticalRTP: theoreticalRTP(strat),
      // finalRTP is the LAST plotted point, bit-for-bit — Step 16 requires the identity, so a
      // series truncated to one cheap point, or a last point zeroed while finalRTP is left
      // untouched, is rejected.
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

  // A cherry-pick flag needs earlyP < α_seed AND lateP ≥ α_seed on two independent windows, so
  // under the null a seed flags at the COMPOUND rate a·(1 − a). Because the n=50 / 20-bin χ² is
  // DISCRETE, the achieved per-window rejection `a` is NOT the nominal 0.05 — it is the mass of
  // the smallest attainable tail below 0.05, derived in src/exact-chi2.ts. Both this producer
  // and the verifier import that one derivation.
  // The question is whether the OBSERVED flag count is ABOVE the chance rate: an EXACT one-sided
  // binomial tail P(X ≥ flagged). The decision level is the suite's single ALPHA (0.01) — the
  // same level Pass-1 uniformity, the serial screen and the pooled uniformity are judged at.
  const n = perSeed.length;
  const p0 = cherryFlagRate();
  const mean = n * p0;
  const binomialP = binomialTailP(n, flagged, p0);                   // exact one-sided P(X ≥ flagged)
  const nul = exactNull();

  // ── SERVED-BAND PAYOUT-WEIGHTED RETURN (DICE-21, load-bearing) ────────────────────────────────
  // Every revealed seed replayed for SIM_PASS2_NONCES nonces. Early window = the captured nonce
  // range (0..W−1, the 50 served nonces); reference = the remainder. Statistic = the payout-weighted
  // return of the bands the casino actually served, standardised by its EXACT per-bet mean/variance
  // (a scaled Poisson-binomial across seeds); the tail is the one-sided normal (CLT) lower tail. Each
  // pᵢ is discreteWinProbability(band) — the band's EXACT lattice win-probability. This producer emits
  // per-epoch ROWS; Step 17 (tests/steps/simulation.ts) RE-DERIVES every window from the revealed seed
  // and compares with exact equality, so a forged row has nothing to hide behind. See src/config.ts
  // SIM_PASS2_* for what is exact (the moments) vs asymptotic (the tail).
  const W2 = SIM_PASS2_EARLY_WINDOW;
  const betsByHash = new Map<string, typeof ds.bets>();
  for (const b of ds.bets) {
    const arr = betsByHash.get(b.hashedServerSeed);
    if (arr) arr.push(b); else betsByHash.set(b.hashedServerSeed, [b]);
  }
  const seedByHash = new Map(ds.seeds.map((s) => [s.hashedServerSeed, s]));
  const revealedHashes = [...betsByHash.keys()]
    .filter((h) => !!seedByHash.get(h)?.serverSeed && (betsByHash.get(h)?.length ?? 0) > 0)
    .sort();

  interface EpochRow {
    serverSeedHashed: string;
    earlyN: number; earlyReturn: number; earlyExpected: number; earlyVar: number;
    refN: number; refReturn: number; refExpected: number; refVar: number;
  }
  const perEpoch: EpochRow[] = [];
  const earlySigns: (-1 | 0 | 1)[] = [];
  for (const hash of revealedHashes) {
    const serverSeed = seedByHash.get(hash)!.serverSeed!;
    const epochBets = betsByHash.get(hash)!.slice().sort((a, b) => a.nonce - b.nonce);
    const clientSeed = epochBets[0].clientSeed;
    // Served band per early-window nonce (LIQD nonces are 0-based and contiguous 0..49). A missing
    // early nonce falls back to the nearest served band so the tiled reference window stays defined.
    const served: DiceParams[] = new Array(W2);
    for (const b of epochBets) if (b.nonce >= 0 && b.nonce < W2) served[b.nonce] = b.params;
    let last = served.find((x) => x) ?? epochBets[0].params;
    for (let i = 0; i < W2; i++) { if (!served[i]) served[i] = last; else last = served[i]; }

    let eR = 0, eE = 0, eV = 0, rR = 0, rE = 0, rV = 0;
    const earlyCells: { band: DiceParams; won: boolean }[] = [];
    for (let nn = 0; nn < SIM_PASS2_NONCES; nn++) {
      const band = served[nn % W2];
      const mult = quotedMultiplier(band);
      const p = discreteWinProbability(band);                        // EXACT lattice win-probability
      const roll = diceRoll(serverSeed, clientSeed, nn) / SCALE;
      const won = diceWin(roll, band);
      const ret = won ? mult : 0;
      const eRet = p * mult, vRet = p * (1 - p) * mult * mult;
      if (nn < W2) { eR += ret; eE += eRet; eV += vRet; earlyCells.push({ band, won }); }
      else         { rR += ret; rE += eRet; rV += vRet; }
    }
    earlySigns.push(servedReturnSign(earlyCells));
    perEpoch.push({
      serverSeedHashed: hash,
      earlyN: W2, earlyReturn: eR, earlyExpected: eE, earlyVar: eV,
      refN: SIM_PASS2_NONCES - W2, refReturn: rR, refExpected: rE, refVar: rV,
    });
  }

  const totalEarlyReturn   = perEpoch.reduce((a, r) => a + r.earlyReturn, 0);
  const totalEarlyExpected = perEpoch.reduce((a, r) => a + r.earlyExpected, 0);
  const totalEarlyVar      = perEpoch.reduce((a, r) => a + r.earlyVar, 0);
  // Direction split in EXACT rational arithmetic (servedReturnSign), not by comparing the two
  // float sums: an epoch can land exactly on its expectation (49.5 against 49.5), and the float
  // accumulations then differ in the last bits and would count the tie as "below". Strictly-below
  // and strictly-above are stored; the equal count is the remainder (no new artifact field).
  const sbBelow = earlySigns.filter((s) => s < 0).length;
  const sbAbove = earlySigns.filter((s) => s > 0).length;
  const aggEarlyZ = totalEarlyVar > 0 ? (totalEarlyReturn - totalEarlyExpected) / Math.sqrt(totalEarlyVar) : 0;
  const aggEarlyP = normalLowerTailP(aggEarlyZ);                     // one-sided lower tail (fixed in code; specified after the capture)
  const zAlpha = inverseCriticalZ(2 * SIM_PASS2_ALPHA), zPower = inverseCriticalZ(2 * 0.20);
  const totalEarlyBets = perEpoch.length * W2;
  const minDetectablePerBetPct = totalEarlyBets > 0
    ? ((zAlpha + zPower) * Math.sqrt(totalEarlyVar) / totalEarlyBets) * 100 : NaN;
  const servedBand = {
    nonces: SIM_PASS2_NONCES,
    earlyWindow: W2,
    alpha: SIM_PASS2_ALPHA,
    epochs: perEpoch.length,
    totalEarlyReturn, totalEarlyExpected, totalEarlyVar,
    directionBelow: sbBelow, directionAbove: sbAbove,
    aggEarlyZ, aggEarlyP, minDetectablePerBetPct,
    perEpoch,
  };

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
    // DICE-21 load-bearing realization: served-band payout-weighted return with EXACT per-bet
    // moments + one-sided normal (CLT) lower tail. Step 17 re-derives every row and scores it.
    servedBand,
  };
}

// ───────────────────────── Chart ─────────────────────────
// Rendered by src/chart.ts, a pure function of the series, so `tests/dice/artifactTests.ts` can
// re-render the committed chart from the committed JSON and assert byte identity.
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
if (p2.available) {
  console.log(`  Pass 2 casino seeds    : ${p2.seedsTested} seeds, exact null (${p2.nullSupportValues} support values from ${p2.nullPartitions} partitions), cherry-pick flags ${p2.cherryPickFlags} (expected ${p2.cherryPickExpected.toFixed(2)} at p0=${p2.cherryPickP0.toFixed(10)}, exact P(X≥${p2.cherryPickFlags})=${p2.cherryPickBinomialP.toFixed(4)} vs α=${p2.cherryPickAlpha} → ${p2.cherryPickConsistent ? 'consistent with chance ✓' : 'ELEVATED ✗'}), pooled real-roll p=${p2.pooledRealRollUniformity.pValue.toFixed(4)}`);
  const sb = p2.servedBand;
  console.log(`  Pass 2 served-band ret : ${sb.epochs} epochs × ${sb.nonces} nonces, aggregate early z=${sb.aggEarlyZ.toFixed(3)}, one-sided lower-tail p=${sb.aggEarlyP.toFixed(4)} vs α=${sb.alpha} → ${sb.aggEarlyP >= sb.alpha ? 'no return deficit detected at this power ✓' : 'RETURN DEFICIT — CHERRY-PICK SIGNAL ✗'} (${sb.directionBelow} below / ${sb.epochs - sb.directionBelow - sb.directionAbove} equal / ${sb.directionAbove} above expectation, exact arithmetic; detects a per-bet return deficit of ${sb.minDetectablePerBetPct.toFixed(3)} pp or more at 80% power)`);
}
writeChart(p1.rtpConvergence);

fs.writeFileSync(path.join(OUT, 'simulation-results.json'), JSON.stringify({
  // NO generatedAt / run metadata (DICE-20, DICE-27). The Pass-1 experiment is deterministic
  // (pinned SIM_MASTER_SEED), so the artifact must be byte-for-byte reproducible: a timestamp would
  // change the bytes on every regeneration and defeat the "census byte-for-byte" replay. The run's
  // own metadata lives in outputs/run/, never in the artifact of record.
  // SCHEMA VERSION. Schema 1 is the historical artifact, which stores
  // raw statistics only; schema 2 additionally stores the integer counts behind them. Step 16
  // scores an artifact by ITS OWN declared schema, so a schema-2 rule cannot be applied to a
  // schema-1 file and a regenerated artifact cannot be presented as the original experiment.
  schemaVersion: SIM_SCHEMA_VERSION,
  model: { range: RANGE, cursor: CURSOR, scale: SCALE, houseEdge: HOUSE_EDGE },
  pass1: p1, pass2: p2,
}, null, 2));
console.log('  Output: outputs/simulation-results.json, outputs/rtp-convergence.html\n');
export {};
