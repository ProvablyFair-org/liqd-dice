/** Simulation structure, integer-return reconstruction and statistical screen definitions.
 * See AUDIT_CONTEXT.md §9 for sample depths, nominal error allowances and replay scope.
 */
/** The schema `src/simulate.ts` emits. Artifacts without the field are schema 1 (historical). */
export const SIM_SCHEMA_VERSION = 2;

export const RECONSTRUCTION_MAX_RESIDUAL = 0.25;

/**
 * Reconstruction is defined up to this win count. Above it the accumulation replay would be slow
 * AND the derived tolerance would approach half a win, so the candidate stops being unambiguous:
 * the check FAILS CLOSED instead of guessing. The deepest count in this audit is 9,997,675.
 */
export const RECONSTRUCTION_MAX_WINS = 50_000_000;

/**
 * The producer's accumulated return for exactly `wins` wins at multiplier `m`: `won += m`, once per
 * win, from zero — `src/simulate.ts` writes `st += 1; if (diceWin(...)) { wn += m; wi++; }` for the
 * bands and `staked += 1; if (w) { won += mult; wins++; }` for the convergence series. Losses add
 * nothing, so the value after `wins` wins does not depend on where the losses fell; the sequence of
 * partial sums is fixed and the result is reproducible bit for bit.
 *
 * Deliberately a loop and not `wins * m`: those two differ in the low bits (the committed series'
 * n=20,000,000 point sits 0.0018 wins away from `wins · m / n`), and it is the ACCUMULATION that
 * the published number has to match.
 */
export function reconstructReturn(wins: number, multiplier: number): number {
  let won = 0;
  for (let k = 0; k < wins; k++) won += multiplier;
  return won;
}

/**
 * How far, in WIN UNITS, a published RTP may sit from the candidate integer count when it is not a
 * bit-for-bit match — DERIVED from the floating-point arithmetic, not chosen.
 *
 * Summing `w` copies of `m` in any order gives `|S − w·m| ≤ (w−1)·u·w·m` with u = ε/2 (the standard
 * running-error bound for recursive summation); dividing by `n` and forming `rtp·n/m` each add at
 * most one rounding. Taking `w·ε` for the first term (twice the classical bound) and two more ulps
 * for the conversions gives, after dividing out `m/n`:
 *
 *     tolerance(w) = w·(w + 2)·ε      [win units]
 *
 * 3.55e-7 wins at w = 40,000; 0.0222 at w = 10^7, where the committed artifact's measured worst
 * case is 0.0018. A four-ulp floor covers small counts, where the quadratic term underestimates the
 * two conversion roundings. Capped by RECONSTRUCTION_MAX_RESIDUAL, which is the outer fail-closed
 * ceiling and is never widened by this function.
 */
export function reconstructionTolerance(wins: number): number {
  const derived = wins * (wins + 2) * Number.EPSILON;
  const floor = 4 * Number.EPSILON * Math.max(1, wins);
  return Math.min(RECONSTRUCTION_MAX_RESIDUAL, Math.max(derived, floor));
}

export interface WinCountRecovery {
  ok: boolean;
  /** The integer win count, or NaN when it could not be recovered. */
  wins: number;
  /** |rtp·n/m − wins| — how far the published RTP sits from an exact integer win count. */
  residual: number;
  /** 'stored' (schema 2) or 'reconstructed' (schema 1). */
  source: 'stored' | 'reconstructed';
  /**
   * How the published RTP was tied to the integer count: 'exact' — it IS the reconstructed
   * accumulation divided by n, bit for bit; 'bounded' — it sits inside the derived arithmetic
   * tolerance of it; 'none' — it could not be tied to any integer count.
   */
  match: 'exact' | 'bounded' | 'none';
  /** The RTP the candidate integer count actually produces: reconstructReturn(wins, m) / n. */
  reconstructedRTP: number;
  reason: string;
}

export function recoverWinCount(rtp: number, n: number, multiplier: number, stored?: unknown): WinCountRecovery {
  const fail = (
    reason: string, wins = NaN, residual = NaN,
    source: 'stored' | 'reconstructed' = 'reconstructed', reconstructedRTP = NaN,
  ): WinCountRecovery => ({ ok: false, wins, residual, source, match: 'none', reconstructedRTP, reason });

  if (!Number.isFinite(rtp) || !Number.isFinite(n) || !Number.isFinite(multiplier)) return fail('non-finite input');
  if (!Number.isInteger(n) || n <= 0) return fail(`sample size ${n} is not a positive integer`);
  if (!(multiplier > 0)) return fail(`multiplier ${multiplier} is not positive`);
  if (rtp < 0) return fail(`rtp ${rtp} is negative`);

  const raw = (rtp * n) / multiplier;
  if (!Number.isFinite(raw)) return fail('rtp·n/m is not finite');
  const wins = Math.round(raw);
  const residual = Math.abs(raw - wins);
  // Outer, fail-closed ceiling — applied BEFORE the reconstruction runs, so a hostile RTP cannot
  // buy an arbitrarily long accumulation loop.
  if (residual > RECONSTRUCTION_MAX_RESIDUAL) {
    return fail(`rtp ${rtp} at n=${n} implies ${raw} wins, ${residual} from the nearest integer (cap ${RECONSTRUCTION_MAX_RESIDUAL}) — no integer win count produces this RTP`, wins, residual);
  }
  if (wins < 0 || wins > n) return fail(`recovered win count ${wins} is outside [0, ${n}]`, wins, residual);
  if (wins > RECONSTRUCTION_MAX_WINS) {
    return fail(`recovered win count ${wins} is past the depth (${RECONSTRUCTION_MAX_WINS}) at which this reconstruction is defined — a deeper artifact must store its counts (schema ${SIM_SCHEMA_VERSION})`, wins, residual);
  }

  const reconstructedReturn = reconstructReturn(wins, multiplier);
  const reconstructedRTP = reconstructedReturn / n;
  const tol = reconstructionTolerance(wins);
  const match: 'exact' | 'bounded' | 'none' = reconstructedRTP === rtp
    ? 'exact'
    : (residual <= tol ? 'bounded' : 'none');
  if (match === 'none') {
    return fail(
      `rtp ${rtp} at n=${n} implies ${raw} wins; the candidate integer count ${wins} reconstructs to `
      + `${reconstructedRTP} (return ${reconstructedReturn} over ${n} bets), ${residual} wins away and outside `
      + `the derived arithmetic tolerance ${tol} — no integer win count produces this RTP`,
      wins, residual, 'reconstructed', reconstructedRTP,
    );
  }
  const how = match === 'exact'
    ? `count ${wins} reconstructs EXACTLY to the published RTP (return ${reconstructedReturn} over ${n} bets)`
    : `count ${wins} reconstructs to ${reconstructedRTP}, ${residual} wins from the published RTP — inside the derived tolerance ${tol}`;

  if (stored !== undefined) {
    if (typeof stored !== 'number' || !Number.isInteger(stored)) {
      return fail(`stored win count ${JSON.stringify(stored)} is not an integer`, wins, residual, 'stored', reconstructedRTP);
    }
    if (stored < 0 || stored > n) return fail(`stored win count ${stored} is outside [0, ${n}]`, stored, residual, 'stored', reconstructedRTP);
    if (stored !== wins) {
      return fail(`stored win count ${stored} disagrees with the ${wins} the published RTP implies`, stored, residual, 'stored', reconstructedRTP);
    }
    return { ok: true, wins: stored, residual, source: 'stored', match, reconstructedRTP, reason: `stored count agrees with the RTP it is supposed to have produced — ${how}` };
  }
  return { ok: true, wins, residual, source: 'reconstructed', match, reconstructedRTP, reason: `reconstructed from rtp·n/m and verified — ${how}` };
}

/**
 * The producer's standard error for a convergence checkpoint, reproduced expression for expression:
 *
 *     p    = wins / n                              (empirical win probability at the checkpoint)
 *     var  = p·(m − rtp)² + (1 − p)·(0 − rtp)²      (per-bet payout variance about the running RTP)
 *     SE   = sqrt(var / n)
 *
 * Written with the same association and the same operand order as `src/simulate.ts`, because the
 * comparison downstream is `===` and floating-point addition is not associative. Note this is the
 * EMPIRICAL p, not the theoretical win probability — the effective-edge rows use the theoretical
 * one, and conflating the two is what made the stored SE unreconstructible before schema 2.
 */
export function convergenceSE(n: number, rtp: number, wins: number, multiplier: number): number {
  const p = wins / n;
  const varr = p * (multiplier - rtp) ** 2 + (1 - p) * (0 - rtp) ** 2;
  return Math.sqrt(varr / n);
}

export interface PointCheck {
  n: number;
  ok: boolean;
  wins: number;
  winSource: 'stored' | 'reconstructed';
  /** Whether the published RTP IS the reconstructed return (exact) or merely inside its bound. */
  winMatch: 'exact' | 'bounded' | 'none';
  expectedSE: number;
  storedSE: number;
  exactlyOnTheory: boolean;
  reason: string;
}

export interface SeriesCheck {
  ok: boolean;
  points: PointCheck[];
  exactlyOnTheory: number;
  exactReconstructions: number;
  failures: string[];
}

export function validateConvergenceSeries(
  points: readonly { n?: unknown; rtp?: unknown; se?: unknown; wins?: unknown }[],
  multiplier: number,
  theoreticalRTP: number,
): SeriesCheck {
  const out: PointCheck[] = [];
  const failures: string[] = [];
  let exactlyOnTheory = 0;
  let exactReconstructions = 0;
  let prevN = 0, prevWins = 0;

  for (const pt of points) {
    // JSON NUMBERS, not anything Number() will coerce. A stringified statistic is not the statistic:
    // `"0.031270…"` would coerce to the right value and quietly change the artifact's type contract.
    const typesOk = typeof pt?.n === 'number' && typeof pt?.rtp === 'number' && typeof pt?.se === 'number';
    const n = Number(pt?.n), rtp = Number(pt?.rtp), storedSE = Number(pt?.se);
    const rec: WinCountRecovery = typesOk
      ? recoverWinCount(rtp, n, multiplier, pt?.wins)
      : { ok: false, wins: NaN, residual: NaN, source: 'reconstructed', match: 'none', reconstructedRTP: NaN, reason: `n/rtp/se must be JSON numbers (got ${typeof pt?.n}/${typeof pt?.rtp}/${typeof pt?.se})` };
    const onTheory = typesOk && rtp === theoreticalRTP;
    if (onTheory) exactlyOnTheory++;
    if (rec.ok && rec.match === 'exact') exactReconstructions++;

    let ok = rec.ok;
    let reason = rec.reason;

    if (ok) {
      if (!(n > prevN)) { ok = false; reason = `sample size ${n} does not exceed the previous checkpoint's ${prevN}`; }
      else if (rec.wins < prevWins) { ok = false; reason = `win count fell from ${prevWins} to ${rec.wins} between nested checkpoints`; }
      else if (rec.wins - prevWins > n - prevN) { ok = false; reason = `win count rose by ${rec.wins - prevWins} over only ${n - prevN} additional bets`; }
    }

    const expectedSE = ok ? convergenceSE(n, rtp, rec.wins, multiplier) : NaN;
    if (ok && !(Number.isFinite(storedSE) && storedSE === expectedSE)) {
      ok = false;
      reason = `stored SE ${storedSE} != ${expectedSE} recomputed from (n=${n}, rtp=${rtp}, wins=${rec.wins}, m=${multiplier})`;
    }

    if (!ok) failures.push(`n=${Number.isFinite(n) ? n : String(pt?.n)}: ${reason}`);
    out.push({ n, ok, wins: rec.wins, winSource: rec.source, winMatch: rec.match, expectedSE, storedSE, exactlyOnTheory: onTheory, reason });
    if (rec.ok) { prevN = n; prevWins = rec.wins; }
  }

  return { ok: failures.length === 0 && out.length > 0, points: out, exactlyOnTheory, exactReconstructions, failures };
}

export function runsStatistic(runs: number, n1: number, n: number): { expected: number; variance: number; z: number; degenerate: boolean } {
  const n2 = n - n1;
  const expected = (2 * n1 * n2) / n + 1;
  const variance = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));
  const degenerate = !(variance > 0);
  const z = degenerate ? 0 : (runs - expected) / Math.sqrt(variance);
  return { expected, variance, z, degenerate };
}

export const SCORED_STATISTICAL_PREDICATES: readonly { id: string; step: number; screen: string; size: string }[] = [
  { id: 'S1', step: 16, screen: 'Pass-1 draw uniformity χ², two-sided (upper: non-uniform; lower: too uniform)', size: 'α/3 = 3.333e-3' },
  { id: 'S2', step: 16, screen: 'Pass-1 lag-1 autocorrelation |z| vs the two-sided critical z', size: 'α/3 = 3.333e-3' },
  { id: 'S3', step: 16, screen: 'Pass-1 Wald–Wolfowitz runs test, two-sided', size: 'α/3 = 3.333e-3' },
  { id: 'S4', step: 16, screen: 'nine effective-edge bands, each |simRTP − theory| ≤ 5·SE + 1e-4', size: '≈5.73e-7 per band, ≈5.16e-6 over nine' },
  { id: 'S5', step: 16, screen: 'RTP-convergence final point within 5·SE + 1e-4 of theory', size: '≈5.73e-7' },
  { id: 'S6', step: 17, screen: 'cherry-pick flag count, exact one-sided binomial', size: '≤ α = 0.01 (discrete, achieved size below α)' },
  { id: 'S7', step: 17, screen: 'pooled real-roll uniformity χ², one-sided upper tail', size: 'α = 0.01' },
];

export const STEP_16_BOUND = 0.01 + 9 * 5.733e-7 + 5.733e-7;

/** Family-wise upper bound over SCORED_STATISTICAL_PREDICATES, by the union bound. */
export const FAMILY_WISE_BOUND = STEP_16_BOUND + 0.01 + 0.01;
