
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  SIM_SCHEMA_VERSION, RECONSTRUCTION_MAX_RESIDUAL, FAMILY_WISE_BOUND, STEP_16_BOUND,
  SCORED_STATISTICAL_PREDICATES,
  recoverWinCount, convergenceSE, validateConvergenceSeries, runsStatistic,
  reconstructReturn, reconstructionTolerance,
} from '../../src/sim-checks';
import { theoreticalRTP, quotedMultiplier, discreteWinProbability, SIM_EDGE_BETS, ALPHA_SCREEN } from '../../src/config';
import { twoSidedNormalP, inverseCriticalZ } from '../../src/stats';

/** The `under 50` convergence strategy: multiplier 1.98, theory 0.99. */
const M = 1.98;
const THEO = 0.99;

/** The committed schema-1 artifact's series, verbatim — the reference the checks must accept. */
const COMMITTED_POINTS = [
  { n: 1_000, rtp: 1.0375200000000067, se: 0.03127046289391956 },
  { n: 10_000, rtp: 0.9951479999998745, se: 0.009899866151095175 },
  { n: 100_000, rtp: 0.9917819999997746, se: 0.003130649811901676 },
  { n: 1_000_000, rtp: 0.9894554999937634, se: 0.0009899998502624888 },
  { n: 5_000_000, rtp: 0.9899184240268278, se: 0.00044274145804190423 },
  { n: 10_000_000, rtp: 0.9900619741251958, se: 0.0003130654877432553 },
  { n: 20_000_000, rtp: 0.9897698251742976, se: 0.00022137072378924333 },
];

describe('simulation checks — win-count recovery (schema 1 reconstruction)', () => {
  it('recovers the integer win count behind each committed convergence point', () => {
    const expected = [524, 5026, 50090, 499725, 2499794, 5000313];
    COMMITTED_POINTS.slice(0, 6).forEach((pt, i) => {
      const rec = recoverWinCount(pt.rtp, pt.n, M);
      assert.strictEqual(rec.ok, true, rec.reason);
      assert.strictEqual(rec.wins, expected[i], `n=${pt.n}`);
      assert.strictEqual(rec.source, 'reconstructed');
    });
  });

  it('the reconstruction residual stays far inside the declared cap at the deepest checkpoint', () => {
    const rec = recoverWinCount(0.9897698251742976, 20_000_000, M);
    assert.strictEqual(rec.ok, true);
    assert.strictEqual(rec.wins, 9_997_675);
    // Measured worst case across the committed series. The cap is 0.25; this is two orders below.
    assert.ok(rec.residual < 0.01, `residual ${rec.residual} unexpectedly large`);
    assert.ok(rec.residual < RECONSTRUCTION_MAX_RESIDUAL);
  });

  it('rejects an RTP that no integer win count produces', () => {
    // Halfway between two attainable RTPs at n=1000: (524.5 · 1.98) / 1000.
    const rec = recoverWinCount((524.5 * M) / 1000, 1000, M);
    assert.strictEqual(rec.ok, false);
    assert.match(rec.reason, /no integer win count produces this RTP/);
  });

  it('rejects out-of-range and non-integer sample sizes and multipliers', () => {
    assert.strictEqual(recoverWinCount(0.99, 0, M).ok, false);
    assert.strictEqual(recoverWinCount(0.99, 1000.5, M).ok, false);
    assert.strictEqual(recoverWinCount(0.99, 1000, 0).ok, false);
    assert.strictEqual(recoverWinCount(Number.NaN, 1000, M).ok, false);
    assert.strictEqual(recoverWinCount(-0.5, 1000, M).ok, false);
    // rtp above the multiplier means more wins than bets
    assert.strictEqual(recoverWinCount(M * 1.5, 1000, M).ok, false);
  });

  it('schema 2: a stored count must agree with the RTP it claims to have produced', () => {
    assert.strictEqual(recoverWinCount(COMMITTED_POINTS[0].rtp, 1000, M, 524).ok, true);
    assert.strictEqual(recoverWinCount(COMMITTED_POINTS[0].rtp, 1000, M, 524).source, 'stored');
    const bad = recoverWinCount(COMMITTED_POINTS[0].rtp, 1000, M, 600);
    assert.strictEqual(bad.ok, false);
    assert.match(bad.reason, /disagrees with the 524/);
    assert.strictEqual(recoverWinCount(COMMITTED_POINTS[0].rtp, 1000, M, 524.5).ok, false);
    assert.strictEqual(recoverWinCount(COMMITTED_POINTS[0].rtp, 1000, M, -1).ok, false);
    assert.strictEqual(recoverWinCount(COMMITTED_POINTS[0].rtp, 1000, M, '524').ok, false);
  });
});

describe('a published RTP must be the return an INTEGER win count produces', () => {
  const BAND = { lower: 98, upper: 100, inverted: false };
  const BAND_M = quotedMultiplier(BAND);            // 49.5
  const FORGED = 0.99000495;

  it('the counterexample really does imply a fractional win count', () => {
    assert.strictEqual(BAND_M, 49.5);
    assert.strictEqual((FORGED * SIM_EDGE_BETS) / BAND_M, 40000.2);
    assert.ok(!Number.isInteger((FORGED * SIM_EDGE_BETS) / BAND_M));
    // …and it is inside the old quarter-win cap, which is exactly why it passed.
    assert.ok(Math.abs(40000.2 - 40000) < RECONSTRUCTION_MAX_RESIDUAL);
  });

  it('REJECTS the reviewer\'s 0.99000495 over-98 RTP (40,000.2 wins)', () => {
    const rec = recoverWinCount(FORGED, SIM_EDGE_BETS, BAND_M);
    assert.strictEqual(rec.ok, false, 'a fractional win count must not be rounded into acceptance');
    assert.strictEqual(rec.match, 'none');
    assert.strictEqual(rec.wins, 40_000);            // the candidate…
    assert.strictEqual(rec.reconstructedRTP, 0.99);  // …and what that candidate actually produces
    assert.match(rec.reason, /no integer win count produces this RTP/);
  });

  it('a stored schema-2 count cannot launder it either', () => {
    // A forger who also writes the rounded count gets the same answer: the RTP still is not the
    // return of 40,000 wins.
    const rec = recoverWinCount(FORGED, SIM_EDGE_BETS, BAND_M, 40_000);
    assert.strictEqual(rec.ok, false);
    assert.match(rec.reason, /no integer win count produces this RTP/);
  });

  it('rejects every fractional offset down to a hundredth of a win', () => {
    for (const offset of [0.5, 0.2, 0.1, 0.05, 0.01, -0.01, -0.2]) {
      const rtp = ((40_000 + offset) * BAND_M) / SIM_EDGE_BETS;
      const rec = recoverWinCount(rtp, SIM_EDGE_BETS, BAND_M);
      assert.strictEqual(rec.ok, false, `${offset} wins from an integer must be rejected (rtp ${rtp})`);
    }
  });

  it('accepts the committed over-98 row, whose count is an integer 40,217', () => {
    const rec = recoverWinCount(0.99537075, SIM_EDGE_BETS, BAND_M);
    assert.strictEqual(rec.ok, true, rec.reason);
    assert.strictEqual(rec.wins, 40_217);
    assert.strictEqual(rec.match, 'exact', 'the committed artifact needs no tolerance at all');
    assert.strictEqual(rec.reconstructedRTP, 0.99537075);
  });

  it('every committed convergence point reconstructs EXACTLY — no tolerance is spent', () => {
    const r = validateConvergenceSeries(COMMITTED_POINTS, M, THEO);
    assert.strictEqual(r.ok, true, r.failures.join('; '));
    assert.strictEqual(r.exactReconstructions, COMMITTED_POINTS.length);
    r.points.forEach((p) => assert.strictEqual(p.winMatch, 'exact', `n=${p.n}`));
  });

  it('reconstructReturn replays the producer\'s accumulation, not wins × m', () => {
    // The deepest committed checkpoint: 9,997,675 wins at 1.98×. The accumulated sum and the single
    // multiplication differ, and it is the ACCUMULATION the published RTP matches.
    const wins = 9_997_675, n = 20_000_000;
    const accumulated = reconstructReturn(wins, M);
    assert.notStrictEqual(accumulated, wins * M, 'repeated addition is not the product in binary64');
    assert.strictEqual(accumulated / n, COMMITTED_POINTS[6].rtp);
  });

  it('the tolerance is DERIVED and stays orders below the counterexample', () => {
    const tol = reconstructionTolerance(40_000);
    assert.ok(Math.abs(tol - 3.552e-7) < 1e-9, `tolerance ${tol}`);
    assert.ok(tol < 0.2, 'the derived bound must not reach the 0.2-win forgery');
    // It never exceeds the outer fail-closed ceiling, and it grows with the count, not with taste.
    assert.ok(reconstructionTolerance(10_000_000) <= RECONSTRUCTION_MAX_RESIDUAL);
    assert.ok(reconstructionTolerance(10_000_000) > reconstructionTolerance(40_000));
    assert.ok(reconstructionTolerance(1e9) === RECONSTRUCTION_MAX_RESIDUAL);
  });

  it('fails closed past the depth where the reconstruction is defined', () => {
    const n = 500_000_000, wins = 100_000_000;
    const rec = recoverWinCount((wins * 1) / n, n, 1);
    assert.strictEqual(rec.ok, false);
    assert.match(rec.reason, /past the depth/);
  });

  it('accepts a producer that sums in a different order (bounded, not exact)', () => {
    // A legitimate variant: the same integer count, the return formed as one multiplication. It
    // lands a few ulps from the replay and is admitted by the DERIVED bound — nothing wider.
    const wins = 1_000_805, n = SIM_EDGE_BETS;
    const rtp = (wins * M) / n;
    const rec = recoverWinCount(rtp, n, M);
    assert.strictEqual(rec.ok, true, rec.reason);
    assert.strictEqual(rec.wins, wins);
    assert.ok(rec.residual <= reconstructionTolerance(wins), `residual ${rec.residual}`);
  });
});

describe('simulation checks — every plotted standard error', () => {
  it('accepts the committed series exactly, and counts zero points on theory', () => {
    const r = validateConvergenceSeries(COMMITTED_POINTS, M, THEO);
    assert.strictEqual(r.ok, true, r.failures.join('; '));
    assert.strictEqual(r.exactlyOnTheory, 0);
    r.points.forEach((p) => assert.strictEqual(p.storedSE, p.expectedSE, `n=${p.n}`));
  });

  it('REJECTS the reviewer\'s se = 123456 on the first plotted point', () => {
    const mutated = COMMITTED_POINTS.map((p, i) => (i === 0 ? { ...p, se: 123456 } : p));
    const r = validateConvergenceSeries(mutated, M, THEO);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.failures.length, 1);
    assert.match(r.failures[0], /^n=1000: stored SE 123456 != 0\.03127046289391956/);
  });

  it('rejects a standard error wrong in the last bit', () => {
    const nudged = COMMITTED_POINTS.map((p, i) => (i === 3 ? { ...p, se: p.se * (1 + Number.EPSILON) } : p));
    const r = validateConvergenceSeries(nudged, M, THEO);
    assert.strictEqual(r.ok, false, 'a one-ULP standard-error edit must not pass');
  });

  it('rejects a non-finite or absent standard error', () => {
    for (const se of [Number.NaN, Infinity, undefined, null, '0.03127046289391956']) {
      const r = validateConvergenceSeries(
        COMMITTED_POINTS.map((p, i) => (i === 0 ? { ...p, se } : p)), M, THEO,
      );
      assert.strictEqual(r.ok, false, `se=${String(se)} must be rejected`);
    }
  });

  it('the SE formula is the producer\'s, expression for expression', () => {
    // Independent restatement: p = wins/n, var = p(m−rtp)² + (1−p)rtp², SE = sqrt(var/n).
    const n = 1000, wins = 524, rtp = COMMITTED_POINTS[0].rtp;
    const p = wins / n;
    const expected = Math.sqrt((p * (M - rtp) ** 2 + (1 - p) * (0 - rtp) ** 2) / n);
    assert.strictEqual(convergenceSE(n, rtp, wins, M), expected);
    assert.strictEqual(convergenceSE(n, rtp, wins, M), COMMITTED_POINTS[0].se);
  });
});

describe('simulation checks — cumulative consistency across nested checkpoints', () => {
  it('rejects a win count that falls between nested marks', () => {
    // Point 2 rewritten so its implied win count is below point 1's, which is impossible for
    // running totals over one sample.
    const pts = [
      { n: 1_000, rtp: (524 * M) / 1_000, se: convergenceSE(1_000, (524 * M) / 1_000, 524, M) },
      { n: 10_000, rtp: (400 * M) / 10_000, se: convergenceSE(10_000, (400 * M) / 10_000, 400, M) },
    ];
    const r = validateConvergenceSeries(pts, M, THEO);
    assert.strictEqual(r.ok, false);
    assert.match(r.failures[0], /win count fell from 524 to 400/);
  });

  it('rejects a win count that grows faster than the sample does', () => {
    const pts = [
      { n: 1_000, rtp: (100 * M) / 1_000, se: convergenceSE(1_000, (100 * M) / 1_000, 100, M) },
      { n: 2_000, rtp: (1_500 * M) / 2_000, se: convergenceSE(2_000, (1_500 * M) / 2_000, 1_500, M) },
    ];
    const r = validateConvergenceSeries(pts, M, THEO);
    assert.strictEqual(r.ok, false);
    assert.match(r.failures[0], /win count rose by 1400 over only 1000 additional bets/);
  });

  it('rejects a non-increasing sample size', () => {
    const pts = [
      { n: 10_000, rtp: (5_000 * M) / 10_000, se: convergenceSE(10_000, (5_000 * M) / 10_000, 5_000, M) },
      { n: 1_000, rtp: (500 * M) / 1_000, se: convergenceSE(1_000, (500 * M) / 1_000, 500, M) },
    ];
    assert.strictEqual(validateConvergenceSeries(pts, M, THEO).ok, false);
  });
});

describe('an exact statistical fit is NOT evidence of fabrication', () => {
  it('accepts a consistent 40,000 / 2,000,000 `over 98` summary at exactly 0.99 RTP', () => {
    const band = { lower: 98, upper: 100, inverted: false };
    const m = quotedMultiplier(band);
    const theo = theoreticalRTP(band);
    const pr = discreteWinProbability(band);
    const wins = 40_000;
    const simRtp = (wins * m) / SIM_EDGE_BETS;

    // The premise of the counterexample: this really is exactly the theoretical value.
    assert.strictEqual(m, 49.5);
    assert.strictEqual(theo, 0.99);
    assert.strictEqual(pr, 0.02);
    assert.strictEqual(simRtp, 0.99);
    assert.strictEqual(simRtp, theo);

    // …and the win count behind it is a perfectly ordinary integer, which is what the check tests.
    const rec = recoverWinCount(simRtp, SIM_EDGE_BETS, m);
    assert.strictEqual(rec.ok, true, rec.reason);
    assert.strictEqual(rec.wins, wins);
    assert.strictEqual(recoverWinCount(simRtp, SIM_EDGE_BETS, m, wins).ok, true);
    assert.strictEqual(rec.match, 'exact');
    assert.strictEqual(rec.reconstructedRTP, theo);
    assert.strictEqual(reconstructReturn(wins, m) / SIM_EDGE_BETS, 0.99);

    // Its probability is 0.0020149586… — about one run in 496, not zero.
    const logP = lnChoose(SIM_EDGE_BETS, wins) + wins * Math.log(0.02) + (SIM_EDGE_BETS - wins) * Math.log(0.98);
    assert.ok(Math.abs(Math.exp(logP) - 0.0020149586) < 1e-9, `P(X=40000) = ${Math.exp(logP)}`);
  });

  it('accepts a convergence series sitting exactly on theory, and reports it', () => {
    const pts = [1_000, 10_000, 100_000].map((n) => ({
      n, rtp: THEO, se: convergenceSE(n, THEO, n / 2, M),
    }));
    const r = validateConvergenceSeries(pts, M, THEO);
    assert.strictEqual(r.ok, true, r.failures.join('; '));
    assert.strictEqual(r.exactlyOnTheory, 3, 'exact hits must be COUNTED, not rejected');
  });

  it('accepts a runs test with z exactly 0 and healthy variance', () => {
    // A balanced split whose observed run count is exactly its expectation.
    const n = 200_000, n1 = 100_000;
    const rs = runsStatistic((2 * n1 * (n - n1)) / n + 1, n1, n);
    assert.strictEqual(rs.z, 0);
    assert.strictEqual(rs.degenerate, false);
    assert.ok(rs.variance > 0, 'a balanced split has positive runs variance');
  });

  it('DOES reject a runs test with zero variance — every observation on one side', () => {
    const degenerate = runsStatistic(1, 200_000, 200_000);
    assert.strictEqual(degenerate.degenerate, true);
    // `-0` in IEEE-754 — the numerator is `0 · (0 − n)`. Not positive is the property that matters.
    assert.ok(!(degenerate.variance > 0), `variance ${degenerate.variance}`);
    assert.strictEqual(runsStatistic(1, 0, 200_000).degenerate, true);
  });

  it('re-derives what the COMMITTED artifact\'s own schema allows, and proves which branch that is', () => {
    const sim = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../outputs/simulation-results.json'), 'utf8'));
    const ser = sim?.pass1?.serial ?? {};
    const schemaVersion = Number(sim.schemaVersion ?? 1);
    assert.ok(schemaVersion === 1 || schemaVersion === SIM_SCHEMA_VERSION,
      `unknown artifact schema ${schemaVersion}`);

    const runsZ = Number(ser.runsZ);
    assert.ok(Number.isFinite(runsZ), 'the artifact must carry a finite runsZ under either schema');

    if (schemaVersion >= 2) {
      // STRONG FORM: (runs, n1, n) are stored, so runsZ is a derived quantity and must be re-derived
      // to the bit. Nothing here is taken on trust.
      const runs = Number(ser.runs), n1 = Number(ser.n1), n = Number(ser.n);
      assert.ok(Number.isInteger(runs) && Number.isInteger(n1) && Number.isInteger(n),
        `schema ${schemaVersion} must store integer cell counts, got runs=${ser.runs} n1=${ser.n1} n=${ser.n}`);
      const rs = runsStatistic(runs, n1, n);
      assert.strictEqual(rs.degenerate, false, `runs variance is 0 at n1=${n1} of n=${n}`);
      assert.strictEqual(rs.z, runsZ,
        `stored runsZ ${runsZ} != ${rs.z} re-derived from (runs=${runs}, n1=${n1}, n=${n})`);
      // Schema 2 also has to carry the threshold it was produced under.
      assert.strictEqual(Number(ser.zCritical), inverseCriticalZ(ALPHA_SCREEN));
      return;
    }

    // SCHEMA 1 — the committed case. The cell counts are absent, and that absence is asserted here
    // rather than assumed, so this test starts failing the moment the artifact gains them (at which
    // point the branch above takes over and the check gets strictly stronger, never quieter).
    assert.strictEqual(schemaVersion, 1);
    assert.strictEqual(ser.runs, undefined, 'schema 1 must not carry a runs count — if it does, the artifact is mislabelled');
    assert.strictEqual(ser.n1, undefined, 'schema 1 must not carry n1 — if it does, the artifact is mislabelled');
    assert.strictEqual(Number(ser.n), 200_000, 'the serial depth IS stored under schema 1');

    // What schema 1 DOES support: runsP is a deterministic function of runsZ alone, so the stored
    // p-value must BE the recomputed one, exactly. This is the assertion the old case should have
    // made — it can fail, and a fabricated or hand-edited runsP makes it fail.
    assert.strictEqual(Number(ser.runsP), twoSidedNormalP(runsZ),
      `stored runsP ${ser.runsP} != ${twoSidedNormalP(runsZ)} recomputed from runsZ ${runsZ}`);

    // And the counts really are unrecoverable from what is stored: (runs, n1) is a two-dimensional
    // preimage of a single z at fixed n, so many integer pairs reproduce this runsZ. Demonstrated,
    // not asserted in prose — if a unique preimage existed, schema 2 would be unnecessary.
    const preimages: Array<[number, number]> = [];
    for (let n1 = 99_000; n1 <= 101_000 && preimages.length < 2; n1++) {
      const { expected, variance, degenerate } = runsStatistic(0, n1, 200_000);
      if (degenerate) continue;
      const runs = Math.round(expected + runsZ * Math.sqrt(variance));
      if (runsStatistic(runs, n1, 200_000).z === runsZ) preimages.push([runs, n1]);
    }
    assert.ok(preimages.length >= 2,
      `schema 1 cannot pin the cell counts: found ${preimages.length} exact preimage(s) of runsZ=${runsZ}`);
  });
});

describe('the declared error budget describes the decision rule', () => {
  it('enumerates every screen that can move the verdict', () => {
    assert.strictEqual(SCORED_STATISTICAL_PREDICATES.length, 7);
    assert.deepStrictEqual(SCORED_STATISTICAL_PREDICATES.map((s) => s.id), ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7']);
    assert.deepStrictEqual([...new Set(SCORED_STATISTICAL_PREDICATES.map((s) => s.step))], [16, 17]);
  });

  it('the family-wise bound is ABOVE the three-screen alpha, not equal to it', () => {
    assert.ok(FAMILY_WISE_BOUND > 0.01, 'the whole family cannot be bounded by one screen group\'s alpha');
    assert.ok(Math.abs(FAMILY_WISE_BOUND - 0.0300057) < 1e-6, `bound ${FAMILY_WISE_BOUND}`);
  });

  it('STEP 16\'s own bound is above α too — it scores more than the three screens', () => {
    assert.ok(STEP_16_BOUND > 0.01, 'a step scoring S1-S5 is not bounded by S1-S3\'s alpha');
    assert.ok(Math.abs(STEP_16_BOUND - 0.0100057) < 1e-7, `step-16 bound ${STEP_16_BOUND}`);
    // …and the two Pass-2 screens are the rest of the family.
    assert.strictEqual(FAMILY_WISE_BOUND, STEP_16_BOUND + 0.01 + 0.01);
    const step16Screens = SCORED_STATISTICAL_PREDICATES.filter((s) => s.step === 16);
    assert.strictEqual(step16Screens.length, 5, 'Step 16 scores five statistical screens, not three');
  });

  it('the verifier declares the schema version it implements', () => {
    assert.strictEqual(SIM_SCHEMA_VERSION, 2);
  });
});

function lnChoose(n: number, k: number): number {
  return lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);
}
function lnGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
