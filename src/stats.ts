/**
 * Statistical helpers for the LIQD Dice simulation + verify steps.
 * Chi-squared p-values via exact regularized incomplete gamma.
 */

export function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 0; i < k; i++) {
    c = (c * (n - i)) / (i + 1);
  }
  return c;
}

/**
 * Exact upper binomial tail P(X >= k) for X ~ Binomial(n, p). Used for the Pass-2
 * cherry-pick test (is the observed flag count above the chance rate?) — replaces the
 * earlier continuity-corrected normal approximation, which was slightly generous.
 */
export function binomialTailP(n: number, k: number, p: number): number {
  if (k <= 0) return 1;
  if (k > n) return 0;
  let s = 0;
  for (let i = k; i <= n; i++) s += combination(n, i) * p ** i * (1 - p) ** (n - i);
  return Math.min(1, s);
}

export function regularizedGamma(a: number, x: number): number {
  if (x < 0 || a <= 0) return NaN;
  if (x === 0) return 0;
  const gln = logGamma(a);
  if (x < a + 1) {
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let n = 0; n < 200; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - gln);
  } else {
    let b = x + 1 - a;
    let c = 1 / 1e-300;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= 200; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c;
      if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      const delta = d * c;
      h *= delta;
      if (Math.abs(delta - 1) < 1e-14) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
  }
}

export function logGamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

export function chiSquaredPValue(chiSq: number, df: number): number {
  return 1 - regularizedGamma(df / 2, chiSq / 2);
}

export interface ChiSquaredResult {
  chi2: number;
  df: number;
  pValue: number;
}

export function chiSquaredTest(observed: number[], expected: number[]): ChiSquaredResult {
  if (observed.length !== expected.length) throw new Error('length mismatch');
  // Pools cells with expected < 5 inward from BOTH ends. At Pass-2 n=50 over 25 cells
  // (expected 2/cell) this pools the front and back to ≥5 and leaves interior cells at 2,
  // producing a nonstandard pooled statistic. That is sound in Pass 2 because the same
  // pooling is applied identically to every bootstrap replicate and to the observed value,
  // so the empirical p-value stays valid regardless of the pooling rule.
  const obs = [...observed];
  const exp = [...expected];
  while (obs.length > 2 && exp[0] < 5) {
    obs[1] += obs[0]; exp[1] += exp[0]; obs.shift(); exp.shift();
  }
  while (obs.length > 2 && exp[exp.length - 1] < 5) {
    const n = obs.length;
    obs[n - 2] += obs[n - 1]; exp[n - 2] += exp[n - 1]; obs.pop(); exp.pop();
  }
  let chi2 = 0;
  for (let i = 0; i < obs.length; i++) {
    if (exp[i] > 0) chi2 += (obs[i] - exp[i]) ** 2 / exp[i];
  }
  const df = obs.length - 1;
  return { chi2, df, pValue: chiSquaredPValue(chi2, df) };
}

export function lag1Autocorrelation(series: number[]): number {
  const n = series.length;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += series[i];
  mean /= n;
  let num = 0, den = 0;
  for (let i = 0; i < n - 1; i++) num += (series[i] - mean) * (series[i + 1] - mean);
  for (let i = 0; i < n; i++) den += (series[i] - mean) ** 2;
  return den === 0 ? 0 : num / den;
}

export interface RunsTestResult {
  runs: number;
  expected: number;
  z: number;
  pValue: number;
  /** Sample size, and the count of observations on the `1` side. Emitted so a verifier can */
  n: number;
  /** re-derive `z` from the cell counts instead of trusting it. */
  n1: number;
  /** The runs variance. Zero — not `z === 0` — is the degenerate case worth rejecting. */
  variance: number;
}

export function runsTest(series: number[]): RunsTestResult {
  const n = series.length;
  let n1 = 0, runs = 1;
  let prev = series[0];
  if (prev === 1) n1++;
  for (let i = 1; i < n; i++) {
    if (series[i] === 1) n1++;
    if (series[i] !== prev) { runs++; prev = series[i]; }
  }
  const n2 = n - n1;
  const expected = (2 * n1 * n2) / n + 1;
  const varRuns = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));
  const z = varRuns > 0 ? (runs - expected) / Math.sqrt(varRuns) : 0;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  return { runs, expected, z, pValue, n, n1, variance: varRuns };
}

/**
 * Standard-normal inverse CDF (quantile function), Wichura's AS 241 / PPND16.
 *
 * ── WHY AS 241 AND NOT A RATIONAL FIT ───────────────────────────────────────────────────────────
 * Abramowitz & Stegun 26.2.23, a three-term rational fit, has a stated error bound of |ε| < 4.5e-4.
 * At the Bonferroni-corrected ALPHA_SCREEN = 0.01/3 it returns **2.935529862881156**, while the
 * true two-sided critical z is **2.935199468866706** — a departure of 3.3e-4, consistent with the
 * fit's own bound. That is harmless as a THRESHOLD (the approximation is slightly conservative: a
 * larger critical z rejects less often, so the test's real size is a little BELOW its nominal α,
 * never above). It is not harmless as a REPORTED NUMBER: printing 2.936 and describing it as the
 * critical z at α/3 reads as a rounded quantile and is not one — 2.9352 is. Three different
 * quantities are easy to confuse here: the artifact's stored legacy field (2.576236081309571, the
 * same approximation at the UNCORRECTED α = 0.01), the value a rational fit applies (2.9355…), and
 * the value the prose means (the true critical z, 2.9352…).
 *
 * ── AND WHY THE ARGUMENT IS `α/2`, NOT `1 − α/2` ────────────────────────────────────────────────
 * Writing the threshold as `normalQuantile(1 - alpha/2)` and publishing it with an error term of
 * "~1e-16" — AS 241's own accuracy — understates it by two orders of magnitude, because the error
 * is not in AS 241, it is in the ARGUMENT. With ALPHA_SCREEN = 0.01/3, the exact
 * value of `1 - alpha/2` is not representable: binary64 rounds it by 3.84e-17, and near p ≈ 0.9983
 * the quantile's slope 1/φ(z) ≈ 186 amplifies that into ~7.1e-15 of z. Measured, on the validated
 * runtime, against the true critical z computed independently at 90 decimal digits:
 *
 *   true two-sided critical z at ALPHA_SCREEN   2.9351994688667059210814763461956…
 *   nearest binary64                            2.935199468866706
 *   normalQuantile(1 - ALPHA_SCREEN/2)          2.9351994688666982   — 7.67e-15 low (17.3 ULP)
 *   -normalQuantile(ALPHA_SCREEN/2)             2.9351994688667054   — 5.69e-16 low ( 1.3 ULP)
 *
 * `alpha/2` is a halving, which binary64 performs exactly, so the lower-tail form hands AS 241 the
 * argument the declared α actually implies and the amplified rounding disappears. The negation is
 * exact. That is why `inverseCriticalZ` is written as `-normalQuantile(alpha / 2)`.
 *
 * THE ERROR TERM THAT REMAINS, stated rather than claimed away. The applied threshold is within
 * about 1.3 ULP (5.7e-16) of the true critical z — AS 241's own ~1e-16 relative accuracy plus the
 * rounding of the result into binary64. It is not exact and this file does not say it is. At this
 * size it moves no verdict: the screened statistics sit whole decimal places away from the threshold,
 * and the two-sided tail the applied z actually carries, 0.0033333333333333396…, departs from the
 * declared ALPHA_SCREEN = 0.0033333333333333335… by 6.1e-18. The `1 − α/2` form's 7.67e-15 is
 * equally harmless operationally — what would be wrong is a SENTENCE claiming there is nothing
 * left to document as an error term, when there is one.
 *
 * Reference quantiles, the boundary behaviour, and both of the numbers above are asserted in
 * `tests/dice/statsTests.ts`.
 *
 * NOTE the residual honest caveat, which no quantile implementation removes: this is the ASYMPTOTIC
 * normal reference distribution for the lag-1 and runs statistics. Its accuracy as a quantile says
 * nothing about how closely the finite-sample distribution of those statistics at n = 200,000
 * follows the normal — see the error-budget note in `tests/steps/simulation.ts`.
 */
export function normalQuantile(p: number): number {
  if (!(p > 0 && p < 1)) return NaN;
  const q = p - 0.5;
  let r: number;
  if (Math.abs(q) <= 0.425) {
    r = 0.180625 - q * q;
    return q * (((((((2509.0809287301226727 * r + 33430.575583588128105) * r + 67265.770927008700853) * r + 45921.953931549871457) * r + 13731.693765509461125) * r + 1971.5909503065514427) * r + 133.14166789178437745) * r + 3.387132872796366608)
      / (((((((5226.495278852545925 * r + 28729.085735721942674) * r + 39307.89580009271061) * r + 21213.794301586595867) * r + 5394.1960214247511077) * r + 687.1870074920579083) * r + 42.313330701600911252) * r + 1);
  }
  r = q < 0 ? p : 1 - p;
  r = Math.sqrt(-Math.log(r));
  let val: number;
  if (r <= 5) {
    r -= 1.6;
    val = (((((((7.7454501427834140764e-4 * r + 0.0227238449892691845833) * r + 0.24178072517745061177) * r + 1.27045825245236838258) * r + 3.64784832476320460504) * r + 5.7694972214606914055) * r + 4.6303378461565452959) * r + 1.42343711074968357734)
      / (((((((1.05075007164441684324e-9 * r + 5.475938084995344946e-4) * r + 0.0151986665636164571966) * r + 0.14810397642748007459) * r + 0.68976733498510000455) * r + 1.6763848301838038494) * r + 2.05319162663775882187) * r + 1);
  } else {
    r -= 5;
    val = (((((((2.01033439929228813265e-7 * r + 2.71155556874348757815e-5) * r + 0.0012426609473880784386) * r + 0.026532189526576123093) * r + 0.29656057182850489123) * r + 1.7848265399172913358) * r + 5.4637849111641143699) * r + 6.6579046435011037772)
      / (((((((2.04426310338993978564e-15 * r + 1.4215117583164458887e-7) * r + 1.8463183175100546818e-5) * r + 7.868691311456132591e-4) * r + 0.0148753612908506148525) * r + 0.13692988092273580531) * r + 0.59983220655588793769) * r + 1);
  }
  return q < 0 ? -val : val;
}

/**
 * The TWO-SIDED critical z at level `alpha` — the z with P(|Z| > z) = α.
 *
 * Written as the NEGATED LOWER-tail quantile. `−Φ⁻¹(α/2)` and `Φ⁻¹(1 − α/2)` are the same number
 * over the reals; they are not the same binary64, because `1 - alpha / 2` rounds and the quantile's
 * slope near p ≈ 1 amplifies that rounding, while `alpha / 2` is exact. See the note on
 * `normalQuantile` for the measured difference at ALPHA_SCREEN (17.3 ULP vs 1.3 ULP).
 */
export function inverseCriticalZ(alpha: number): number {
  return -normalQuantile(alpha / 2);
}

function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** Two-sided normal tail p-value for a z-score — lets a verifier re-derive runsP from runsZ. */
export function twoSidedNormalP(z: number): number {
  return 2 * (1 - normalCDF(Math.abs(z)));
}

/**
 * One-sided LOWER-tail normal p-value: P(Z ≤ z). Used by the Pass-2 served-band return scan
 * (DICE-21), where the aggregate early return is standardised by its EXACT per-bet mean and variance
 * (a scaled Poisson-binomial) and the resulting z is read against the ASYMPTOTIC normal (CLT) lower
 * tail — cherry-picking shorts the early window, so a suspicious epoch sits in the lower tail. This
 * is the CLT tail of the exact-moments statistic, not an exact-lattice CDF (see src/config.ts
 * SIM_PASS2_* and MANIFEST.md). Shares the same `normalCDF` as `twoSidedNormalP`.
 */
export function normalLowerTailP(z: number): number {
  return normalCDF(z);
}

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return Math.sign(x) * y;
}
