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
 * continuity-corrected normal approximation.
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

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return Math.sign(x) * y;
}
