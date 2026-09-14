
import * as assert from 'node:assert';
import { normalQuantile, inverseCriticalZ, runsTest, twoSidedNormalP } from '../../src/stats';
import { ALPHA, ALPHA_SCREEN, ALPHA_SCREENS } from '../../src/config';

/**
 * Reference quantiles of the standard normal. Independent source: Python 3
 * `statistics.NormalDist().inv_cdf(p)` (CPython's own implementation of Wichura's algorithm),
 * executed 2026-09-10.
 *
 * NOT claimed to be the nearest binary64 to each true quantile. That source is itself AS 241, so its
 * own error is of order 1 ULP, and an independent 90-digit recomputation (2026-09-11) puts two of
 * these rows one ULP off the true nearest double: Φ⁻¹(0.975) is 1.9599639845400538556… (nearest
 * 1.9599639845400538, tabled as 1.959963984540054) and Φ⁻¹(0.9) is 1.2815515655446005934… (nearest
 * 1.2815515655446006, tabled as 1.2815515655446004). These are reference vectors at the 1e-14 level
 * the assertion below actually uses, and the table says so rather than implying exactness.
 */
const REFERENCE_QUANTILES: readonly [number, number][] = [
  [0.5,                  0],
  [0.9,                  1.2815515655446004],
  [0.975,                1.959963984540054],
  [0.99,                 2.3263478740408408],
  [0.995,                2.5758293035489004],
  // Φ⁻¹ of this ROUNDED double — confirmed nearest-binary64 by the 90-digit recomputation
  // (2.9351994688666987759…). It is NOT the critical z at ALPHA_SCREEN; see the block below.
  [0.9983333333333333,   2.9351994688666987],
  [0.999,                3.090232306167813],
  [0.000001,            -4.753424308822899],
];

describe('normal quantile (AS 241)', () => {
  it('matches independent reference quantiles to within 1e-14', () => {
    for (const [p, expected] of REFERENCE_QUANTILES) {
      const got = normalQuantile(p);
      assert.ok(Math.abs(got - expected) < 1e-14, `Φ⁻¹(${p}) = ${got}, reference ${expected}`);
    }
  });

  it('is odd about the median, to within 1e-14', () => {
    for (const p of [0.001, 0.01, 0.1, 0.3, 0.4249, 0.4251]) {
      assert.ok(Math.abs(normalQuantile(p) + normalQuantile(1 - p)) < 1e-14, `p=${p}`);
    }
  });

  it('is continuous across the branch boundary at |p − 0.5| = 0.425', () => {
    // AS 241 switches from the central rational fit to the tail fit here; a discontinuity would
    // mean one of the two branches was transcribed wrongly.
    const below = normalQuantile(0.5 + 0.425 - 1e-12);
    const above = normalQuantile(0.5 + 0.425 + 1e-12);
    assert.ok(Math.abs(above - below) < 1e-10, `${below} vs ${above}`);
  });

  it('is strictly increasing', () => {
    let prev = -Infinity;
    for (let p = 0.001; p < 1; p += 0.0007) {
      const v = normalQuantile(p);
      assert.ok(v > prev, `not increasing at p=${p}`);
      prev = v;
    }
  });

  it('returns NaN outside the open unit interval', () => {
    for (const p of [0, 1, -0.1, 1.1, Number.NaN]) assert.ok(Number.isNaN(normalQuantile(p)));
  });
});

describe('the critical z the suite actually applies', () => {
  /**
   * The true two-sided critical z at ALPHA_SCREEN is 2.9351994688667059210814763461956…, from an
   * independent BigInt fixed-point computation at 90 decimal digits (erf by its Taylor series, π by
   * Machin's formula, the tail inverted by bisection; run 2026-09-11 on the validated runtime). That
   * computation reproduces erf(1) = 0.8427007929497148693412206350826092592960… to all 40 digits and
   * returns the same binary64 as CPython for Φ⁻¹(0.995), Φ⁻¹(0.99) and Φ⁻¹(0.999).
   *
   * NEAREST_DOUBLE is the nearest binary64 to it — exact value 2.9351994688667057964437390182865…,
   * which is 1.246e-16 BELOW the true z. The true z is therefore not a double and the residual error
   * cannot be measured from inside binary64; the ULP distances below are what IS measurable here,
   * and the 90-digit figures are quoted in the comments where they matter.
   */
  const NEAREST_DOUBLE = 2.935199468866706;
  const ULP = 2 ** -51;                 // one ULP at this magnitude: 4.440892098500626e-16

  it('is the two-sided critical z at the Bonferroni-corrected screen level', () => {
    assert.strictEqual(ALPHA_SCREENS, 3);
    assert.strictEqual(ALPHA_SCREEN, ALPHA / 3);
    // Built from the LOWER tail: alpha/2 is an exact halving, 1 - alpha/2 is not (minor 3).
    assert.strictEqual(inverseCriticalZ(ALPHA_SCREEN), -normalQuantile(ALPHA_SCREEN / 2));
  });

  it('equals 2.9351994688667054, one ULP below the nearest double to the true critical z', () => {
    const z = inverseCriticalZ(ALPHA_SCREEN);
    assert.strictEqual(z, 2.9351994688667054, `applied threshold ${z}`);
    assert.strictEqual(z - NEAREST_DOUBLE, -ULP, 'exactly one ULP low, not zero and not seventeen');
    // THE ERROR TERM, asserted instead of claimed away. Against the 90-digit true z the gap is
    // 5.687e-16 = 1.28 ULP — AS 241's own accuracy plus the rounding of the result into binary64.
    // It is not exact, and nothing in this package says it is.
    assert.notStrictEqual(z, NEAREST_DOUBLE, 'the applied threshold is NOT the nearest double');
  });

  it('REJECTS the `1 - alpha/2` form: the same number over the reals, 17 ULP out in binary64', () => {
    // The quantile-rounding difference as an executable vector. Both expressions are Φ⁻¹ at the same real number;
    // only one of them is handed an argument binary64 can represent.
    const lower = -normalQuantile(ALPHA_SCREEN / 2);          // what the code now applies
    const upper = normalQuantile(1 - ALPHA_SCREEN / 2);       // what it applied until 2026-09-11
    assert.notStrictEqual(lower, upper, 'the two forms must be distinguishable, or there is no finding');
    assert.strictEqual(upper, 2.9351994688666982);
    assert.strictEqual((upper - NEAREST_DOUBLE) / ULP, -17, 'the upper-tail form is 17 ULP low');
    assert.ok(Math.abs(lower - NEAREST_DOUBLE) < Math.abs(upper - NEAREST_DOUBLE),
      'the lower-tail form must be the more accurate one, or the change was pointless');
    // The rounding that causes it, at the source. AS 241's tail branch computes `r = 1 - p`
    // internally, so `1 - alpha/2` is rounded on the way in and cannot be recovered on the way out:
    assert.strictEqual(ALPHA_SCREEN / 2, 0.0016666666666666668);          // the halving is exact…
    assert.notStrictEqual(1 - (1 - ALPHA_SCREEN / 2), ALPHA_SCREEN / 2);  // …the round trip is not
    assert.strictEqual(1 - (1 - ALPHA_SCREEN / 2), 0.0016666666666667052);
  });

  it('distinguishes the precise quantile from an approximation and the uncorrected schema-1 field', () => {
    const z = inverseCriticalZ(ALPHA_SCREEN);
    assert.ok(Math.abs(z - 2.935529862881156) > 3e-4, 'the critical value must use the precise quantile');
    assert.ok(Math.abs(z - 2.576236081309571) > 0.3, 'the artifact\'s schema-1 zCritical is at the UNCORRECTED alpha');
    assert.ok(z < 2.935529862881156, 'a smaller critical z rejects more often, not less');
  });

  it('reproduces the textbook two-sided criticals', () => {
    assert.ok(Math.abs(inverseCriticalZ(0.05) - 1.959963984540054) < 1e-14);
    assert.ok(Math.abs(inverseCriticalZ(0.01) - 2.5758293035489004) < 1e-14);
  });
});

describe('runs test carries its own cell counts (schema 2)', () => {
  it('emits n, n1 and the variance, and z is reproducible from them', () => {
    const series = Array.from({ length: 2001 }, (_, i) => (i % 3 === 0 ? 1 : 0));
    const r = runsTest(series);
    assert.strictEqual(r.n, series.length);
    assert.strictEqual(r.n1, series.filter((x) => x === 1).length);
    assert.ok(r.variance > 0);
    assert.strictEqual(r.z, (r.runs - r.expected) / Math.sqrt(r.variance));
    assert.strictEqual(r.pValue, twoSidedNormalP(r.z));
  });

  it('an all-one-side series is degenerate: zero variance, z forced to 0', () => {
    const r = runsTest(new Array(1000).fill(1));
    assert.strictEqual(r.n1, 1000);
    assert.ok(!(r.variance > 0));
    assert.strictEqual(r.z, 0);
  });
});
