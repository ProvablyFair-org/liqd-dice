
import * as assert from 'node:assert';
import { exactNull, squareSum, upperTailBySquareSum, chi2FromSquareSum, achievedSeedAlpha, cherryFlagRate } from '../../src/exact-chi2';
import { SIM_CHERRY_BINS, SIM_CHERRY_WINDOW, SIM_CHERRY_SEED_ALPHA, RANGE } from '../../src/config';

const N = SIM_CHERRY_WINDOW;
const B = SIM_CHERRY_BINS;

/** Independent derivation: distribution of Σh² by a per-bin binomial-split DP, doubles only. */
function dpDistribution(n: number, b: number): Float64Array {
  const C: Float64Array[] = [];
  for (let i = 0; i <= n; i++) {
    const row = new Float64Array(n + 1);
    row[0] = 1;
    for (let k = 1; k <= i; k++) row[k] = C[i - 1][k - 1] + (k <= i - 1 ? C[i - 1][k] : 0);
    C.push(row);
  }
  let layer: Float64Array[] = [];
  for (let j = 0; j <= n; j++) { const a = new Float64Array(j * j + 1); a[j * j] = 1; layer.push(a); }
  for (let bins = 2; bins <= b; bins++) {
    const next: Float64Array[] = [];
    for (let j = 0; j <= n; j++) {
      const out = new Float64Array(j * j + 1);
      const p = 1 / bins;
      for (let h = 0; h <= j; h++) {
        const w = C[j][h] * Math.pow(p, h) * Math.pow(1 - p, j - h);
        if (w === 0) continue;
        const prev = layer[j - h], shift = h * h;
        for (let s = 0; s < prev.length; s++) if (prev[s] !== 0) out[s + shift] += w * prev[s];
      }
      next.push(out);
    }
    layer = next;
  }
  return layer[n];
}

describe('LIQD Dice — exact Pass-2 null', () => {
  const nul = exactNull();

  it('enumerates every partition of 50 into at most 20 parts', () => {
    assert.strictEqual(nul.partitions, 181274);
  });

  it('the statistic has 832 attainable values, spanning the equidistributed and degenerate extremes', () => {
    assert.strictEqual(nul.support.length, 832);
    assert.strictEqual(nul.support[0], 130);                        // 10 bins of 3 + 10 of 2
    assert.strictEqual(nul.support[nul.support.length - 1], N * N); // all 50 draws in one bin
  });

  it('is a probability distribution (total mass 1 to 1e-12)', () => {
    const mass = nul.probability.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(mass - 1) < 1e-12, `mass ${mass}`);
    assert.ok(nul.probability.every((p) => p > 0));
  });

  it('agrees with an INDEPENDENT dynamic-programming derivation to 1e-12 relative', () => {
    const dp = dpDistribution(N, B);
    let maxRel = 0;
    for (let i = 0; i < nul.support.length; i++) {
      const s = nul.support[i], exact = nul.probability[i];
      const rel = Math.abs(dp[s] - exact) / exact;
      if (rel > maxRel) maxRel = rel;
    }
    assert.ok(maxRel < 1e-12, `max relative difference ${maxRel}`);
    // and nothing OUTSIDE the enumerated support carries mass
    const support = new Set(nul.support);
    for (let s = 0; s < dp.length; s++) if (!support.has(s)) assert.strictEqual(dp[s], 0, `s=${s}`);
  });

  it('upper tails are monotone and end at the point mass of the extreme', () => {
    for (let i = 1; i < nul.support.length; i++) {
      assert.ok(nul.upperTail[i] <= nul.upperTail[i - 1], `tail not monotone at ${nul.support[i]}`);
    }
    assert.ok(Math.abs(nul.upperTail[0] - 1) < 1e-12);
    assert.strictEqual(nul.upperTail[nul.upperTail.length - 1], nul.probability[nul.probability.length - 1]);
    // a value above the maximum has zero tail; the minimum has the whole mass
    assert.strictEqual(upperTailBySquareSum(N * N + 1), 0);
    assert.ok(Math.abs(upperTailBySquareSum(0) - 1) < 1e-12);
  });

  it('the ACHIEVED per-window rejection is 0.0459237601, not the nominal 0.05', () => {
    // The discreteness is the whole point: P(p-value < 0.05) is the mass of the smallest
    // attainable tail strictly below 0.05, and there is no attainable tail AT 0.05.
    const a = achievedSeedAlpha();
    assert.ok(a < SIM_CHERRY_SEED_ALPHA, 'achieved rate must be below the nominal one');
    assert.strictEqual(a.toFixed(10), '0.0459237601');
    // it is attained at χ² = 30.8 (square sum 202)
    assert.strictEqual(upperTailBySquareSum(202), a);
    assert.strictEqual(chi2FromSquareSum(202), 30.8);
    // the next ATTAINABLE value below it must not reject — that is what makes 0.0459… the
    // achieved rate rather than an arbitrary number below 0.05
    const idx = nul.support.indexOf(202);
    assert.ok(idx > 0);
    assert.ok(nul.upperTail[idx - 1] >= SIM_CHERRY_SEED_ALPHA,
      `tail at the next attainable value ${nul.support[idx - 1]} is ${nul.upperTail[idx - 1]}, which would also reject`);
  });

  it('the compound flag rate is a·(1 − a) = 0.0438147684', () => {
    const a = achievedSeedAlpha();
    assert.strictEqual(cherryFlagRate(), a * (1 - a));
    assert.strictEqual(cherryFlagRate().toFixed(10), '0.0438147684');
  });

  it('squareSum bins the window exactly as χ² = (Σh² − n²/B)/(n/B)', () => {
    const per = RANGE / B;
    // one draw in every bin, 50 draws over 20 bins: 10 bins of 3, 10 of 2 is the minimum;
    // build a concrete window and check both the sum and the affine χ² map.
    const draws: number[] = [];
    for (let i = 0; i < N; i++) draws.push(Math.floor((i % B) * per));
    const h = new Array(B).fill(0);
    for (const d of draws) h[Math.min(B - 1, Math.floor(d / per))]++;
    const bySum = h.reduce((a, v) => a + v * v, 0);
    assert.strictEqual(squareSum(draws), bySum);
    const e = N / B;
    const byDefinition = h.reduce((a, v) => a + (v - e) ** 2 / e, 0);
    assert.ok(Math.abs(chi2FromSquareSum(bySum) - byDefinition) < 1e-9);
  });

  it('all 50 draws in one bin is the maximum statistic and has the smallest possible tail', () => {
    const draws = new Array(N).fill(0);
    assert.strictEqual(squareSum(draws), N * N);
    assert.strictEqual(upperTailBySquareSum(N * N), nul.probability[nul.probability.length - 1]);
  });
});
