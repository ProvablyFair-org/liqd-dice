/**
 * Semantic validation of the simulation artifact's statistics — the part Step 16 can RE-DERIVE.
 *
 * These are pure functions with no I/O, imported by `tests/steps/simulation.ts` and exercised
 * directly by `tests/dice/simChecksTests.ts`, so every decision boundary below has a unit vector
 * rather than only an end-to-end run.
 *
 * ═══ WHY THIS MODULE EXISTS ════════════════════════════════════════════════════════════════════
 *
 * TWO failure modes that pull in opposite directions and are answered together.
 *
 * AN SE THAT IS A NUMBER IS NOT THEREBY THE RIGHT NUMBER.
 * A convergence block that asserts `Number.isFinite(pt.se)` and nothing else accepts anything: a
 * reviewer changed the first plotted standard error from 0.03127046289391956 to 123456, re-pinned
 * the artifact, and the suite returned a Full Pass. The chart does not catch it either:
 * `src/chart.ts` clamps the ±5·SE ribbon to the plot box (`Math.min(ymax, …)`), so an absurd SE
 * and a correct one draw the same band. All seven plotted standard errors are otherwise
 * unvalidated numbers in a published figure.
 *
 * "A PERFECT FIT PROVES FABRICATION" IS A WRONG RULE.
 * Rejecting outright any artifact with `simulatedRTP === theoreticalRTP`, `deltaSE === 0`, a
 * convergence point exactly on theory, or `lag1 === 0` / `runsZ === 0` rejects events with
 * positive probability under the null. Counterexample: exactly 40,000 wins in 2,000,000 `over 98`
 * bets gives an RTP of exactly 0.99 — the theoretical value — and its probability is 0.0020149586,
 * one run in 496, not zero. A runs test can legitimately return z = 0 with perfectly healthy
 * variance. Such a suite calls an honest simulation a forgery, and a 1 % error bound does not
 * account for a whole family of extra rejection predicates bolted on beside it.
 *
 * THE ANSWER TO BOTH IS THE SAME: validate the STRUCTURE the statistics must have, and stop
 * inferring intent from how good they look.
 *
 * A convergence point is a running RTP over `n` bets of a single-band strategy, so it is not a free
 * real number. Every win pays the same multiplier m, so the published RTP is the producer's return
 * for an INTEGER `wins` in [0, n]; the candidate count is recovered from the published point and
 * the RTP is then VERIFIED against the return that count reconstructs to (`recoverWinCount`), the
 * counts must be non-decreasing and must not grow faster than the sample does, and the producer's
 * standard error is a deterministic function of `(n, rtp, wins, m)` — recomputable to the last bit
 * (`convergenceSE`). Under that, an SE of 123456 fails, and 40,000/2,000,000 passes, which is
 * exactly the pair of outcomes the two findings ask for.
 *
 * A ROUNDING RECOVERY LETS A FRACTIONAL WIN COUNT THROUGH.
 * A rule that recovers the count with `Math.round` and accepts any RTP within a quarter of a win
 * of an integer accepts impossible artifacts: an `over 98` RTP of 0.99000495 implies 40,000.2
 * wins, rounds to 40,000 and passes 21/21. Rounding is therefore only the CANDIDATE step: the
 * producer's return is reconstructed from that integer and the published RTP must be what it
 * produces. See the numerical policy below.
 *
 * WHAT IS LEFT UNPROVEN, SAID PLAINLY. None of this establishes that the simulation was run. A
 * forger who computes `wins`, `rtp` and `se` consistently produces an artifact that satisfies every
 * check here. That is declared limitation L1, and its remedy is regeneration, not verification.
 *
 * ═══ SCHEMA VERSIONING ═════════════════════════════════════════════════════════════════════════
 *
 * The shipped artifact (`generatedAt` 2026-09-09T17:56:13.338Z) carries no
 * win counts, so its counts are RECONSTRUCTED, and the reconstruction has a stated numerical policy
 * (below). Schema 2, which `src/simulate.ts` emits, stores the integer counts and the runs-test
 * cell counts directly, so a future artifact needs no reconstruction at all and the runs statistic
 * becomes re-derivable rather than merely bounded.
 *
 * The old artifact is preserved as a HISTORICAL INPUT under schema 1 and is validated by schema-1
 * rules. It is not re-labelled, not re-rendered under the new schema, and not regenerated: a new
 * schema or different floating-point arithmetic must not be able to masquerade as the original
 * experiment. `artifactSchemaVersion` reports which regime an artifact was scored under.
 */

/** The schema `src/simulate.ts` emits. Artifacts without the field are schema 1 (historical). */
export const SIM_SCHEMA_VERSION = 2;

/**
 * NUMERICAL COMPARISON POLICY — stated, not assumed.
 *
 * Recomputation of a stored statistic is compared exactly when it is an integer or a
 * pure-arithmetic statistic; libm-dependent floats (p-values, quantiles) are compared at 1e-14
 * absolute + 1e-12 relative (src/diff.ts numbersAgree, since 2026-09-28). Among the pure-arithmetic
 * values there is exactly one place where an exact comparison could be impossible, and it is
 * RECONSTRUCTED here rather than papered over with a tolerance.
 *
 * The producer accumulates the strategy's return as `won += m` once per win and reports
 * `rtp = won / n`. Repeated addition is not exact in binary64, so the naive inverse `rtp · n / m`
 * recovers the win COUNT with a small residual instead of landing on the integer.
 *
 * ── WHY A RESIDUAL CAP IS THE WRONG ANSWER ─────────────────────────────────────────────────────
 *
 * ROUNDING the quotient and accepting anything within RECONSTRUCTION_MAX_RESIDUAL of an integer
 * does the opposite of its job. A reviewer set the `over 98` band's RTP to
 * 0.99000495 — which is 40,000.2 wins in 2,000,000 bets at 49.5× — recomputed every derived field
 * and re-pinned the artifact, and `npm test` returned 21/21, exit 0: the cap let a published RTP
 * stand that NO win count produces, because 0.2 is inside 0.25. A win count is a count.
 * 40,000.2 wins is not an unusual result, it is an impossible one, and the decision rule has to
 * be able to say so.
 *
 * ── WHAT REPLACES IT: RECONSTRUCT, THEN VERIFY ────────────────────────────────────────────────
 *
 * The rounded quotient is now only a CANDIDATE. The check is the forward direction:
 *
 *   1. take the candidate INTEGER count `w = round(rtp·n/m)`;
 *   2. reconstruct the producer's return for exactly `w` wins — `reconstructReturn`, which is
 *      `won += m` run `w` times from zero, the producer's own accumulation, expression for
 *      expression (`src/simulate.ts`);
 *   3. require the published RTP to BE `reconstructedReturn / n`, bit for bit.
 *
 * All sixteen published statistics of the committed artifact — nine effective-edge rows and seven
 * convergence checkpoints — satisfy step 3 EXACTLY, so the honest artifact needs no tolerance at
 * all and none is spent on it.
 *
 * A FALLBACK exists for one case and one case only: a return summed in a different ORDER (or as
 * `w · m` in one multiplication) is a legitimate producer that lands a few ulps away. That case is
 * admitted only inside a bound DERIVED from the arithmetic — see `reconstructionTolerance` — not
 * inside a flat quarter-win. At the counterexample's depth that bound is 3.55e-7 wins, so
 * 40,000.2 misses it by six orders of magnitude and the row is rejected.
 *
 * ── WHAT THIS DELIBERATELY DOES NOT DO (G-VALID, the mirror risk) ─────────────────────────────
 *
 * It rejects the IMPOSSIBLE, never the merely surprising. Exactly 40,000 wins in 2,000,000 `over
 * 98` bets — RTP exactly 0.99, exactly the theoretical value, probability 0.0020149586 — passes,
 * because 40,000 is an integer and 40,000 accumulations of 49.5 over 2,000,000 bets IS 0.99. That
 * is the whole point, and reinstating a "too good to be true" rejection from the other direction
 * would be the same defect wearing the opposite sign. The test asserting it stays green is in
 * `tests/dice/simChecksTests.ts`.
 *
 * RECONSTRUCTION_MAX_RESIDUAL survives as an outer, fail-closed ceiling: past the depth where the
 * derived bound would approach half a win the candidate itself stops being unambiguous, and the
 * check refuses rather than guesses. That is what schema 2's stored counts are for.
 *
 * Once the integer is recovered, everything downstream is exact: `p = wins/n` is a ratio of
 * integers and the standard error is compared bit-for-bit.
 */
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

/**
 * Recover the integer win count behind a published running RTP, and VERIFY the published RTP
 * against the return that count reconstructs to.
 *
 * `stored` is schema 2's own count: when present it must be a valid integer count AND agree with
 * the reconstruction, so storing the field cannot be used to launder an RTP that no win count
 * produces.
 */
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

  // ── RECONSTRUCT THE PRODUCER'S RETURN FROM THE CANDIDATE INTEGER COUNT, THEN VERIFY ──────────
  // This is the check. `wins` is a COUNT, and `reconstructReturn(wins, m) / n` is the only RTP that
  // count can report. A rule that stopped at `Math.round` would accept an RTP that implied
  // 40,000.2 wins; this one reconstructs 40,000 wins, gets 0.99, sees that a published
  // 0.99000495 is not 0.99, and rejects the row.
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
  /** True when the point sits exactly on the theoretical RTP. INFORMATIONAL, never scored. */
  exactlyOnTheory: boolean;
  reason: string;
}

export interface SeriesCheck {
  ok: boolean;
  points: PointCheck[];
  /** Points sitting exactly on theory. Reported, never scored. */
  exactlyOnTheory: number;
  /** Points whose RTP is BIT-FOR-BIT the return their integer win count reconstructs to. */
  exactReconstructions: number;
  failures: string[];
}

/**
 * Validate a whole convergence series: every checkpoint's win count, its standard error, and the
 * cumulative consistency BETWEEN checkpoints (the marks are nested prefixes of ONE run, so the win
 * count cannot fall, and it cannot rise by more than the extra bets that were played).
 *
 * `theoreticalRTP` is used only to COUNT points that land exactly on theory. That count is reported
 * and never scored: an exact hit is a legitimate outcome under the null.
 */
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

/**
 * Wald–Wolfowitz runs statistic from its CELL COUNTS, so `runsZ` becomes a re-derivable quantity
 * rather than a raw number the verifier has to take on trust.
 *
 * The degenerate case is `variance === 0` — every observation on one side of the split, so there is
 * no runs distribution at all. That is the condition worth rejecting, and it is a statement about
 * the SAMPLE. `z === 0` is not: it means the observed run count landed on its expectation, which
 * happens routinely and is exactly what the audit is hoping to see.
 */
export function runsStatistic(runs: number, n1: number, n: number): { expected: number; variance: number; z: number; degenerate: boolean } {
  const n2 = n - n1;
  const expected = (2 * n1 * n2) / n + 1;
  const variance = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));
  const degenerate = !(variance > 0);
  const z = degenerate ? 0 : (runs - expected) / Math.sqrt(variance);
  return { expected, variance, z, degenerate };
}

/**
 * THE ERROR BUDGET, enumerated. Every scored predicate whose outcome depends on a random
 * draw, with the size of its own test. Advertising "α = 0.01" for a step that also carries five
 * further screens, plus a family of equality-based rejections that have no size at all, declares
 * a bound that does not describe the decision rule actually applied.
 *
 * The three Bonferroni-corrected Pass-1 screens still have a family-wise level of EXACTLY α = 0.01
 * between them; the claim of a 1 % error rate belongs to those three and is now written that way.
 * The remaining four are listed with their own sizes so the total is visible rather than implied.
 * Union bound over all seven: ≈ 0.0300 — dominated by Pass 1 (0.01) plus the two scored Pass-2
 * screens (0.01 each: the served-band return and the flag-count binomial), with the 5·SE band
 * screens contributing about 5.7e-6 in total.
 *
 * NOT IN THE LIST, ON PURPOSE: the pooled real-roll uniformity χ² (DICE-22). It is INFORMATIONAL
 * since 2026-09-29 — a rejection there prints INFO and cannot fail Step 17 (tests/steps/simulation.ts,
 * section (e)) — so it spends nothing from this budget. Only its artifact reconciliation is scored,
 * and that is a deterministic identity, not a statistical screen.
 *
 * NOT A STEP LEVEL EITHER. "The step's level is α = 0.01" must not be published for STEP 16, which
 * also scores S4 and S5: α = 0.01 is the level of S1–S3, and Step 16's own union bound is
 * STEP_16_BOUND ≈ 0.0100057. Small, but the published number has to be the one the decision rule
 * implies, not the one a subset of it implies.
 *
 * APPROXIMATION LIMITS, and what these numbers are NOT. These are the NOMINAL sizes of the reference
 * distributions — UPPER BOUNDS on the rejection probability under the null if those approximations
 * were exact — not measured failure frequencies, and no claim is made that any honest run trips
 * anything at this rate. The Pass-1 uniformity screen uses the asymptotic χ²; the serial screens
 * use the asymptotic normal at n = 200,000; the served-band return uses exact moments with the
 * asymptotic normal (CLT) lower tail; the 5·SE band screens use a normal approximation to a
 * bounded, highly skewed per-bet payout (a 99× band pays on 1 draw in 100), where 5·SE understates
 * the true tail at the extremes. The cherry-pick binomial is EXACT and, being discrete, is
 * conservative — its achieved size is strictly below α. A repeated-simulation study could calibrate
 * the rest empirically; nothing here proves the finite-sample sizes, and this list does not claim to.
 * The one figure in this repo that IS a measured frequency is the 1-trip-in-20 observed under the
 * UNCORRECTED configuration of the previous release, and it is reported as a measurement of that
 * configuration, not as a prediction for this one.
 */
export const SCORED_STATISTICAL_PREDICATES: readonly { id: string; step: number; screen: string; size: string }[] = [
  { id: 'S1', step: 16, screen: 'Pass-1 draw uniformity χ², two-sided (upper: non-uniform; lower: too uniform)', size: 'α/3 = 3.333e-3' },
  { id: 'S2', step: 16, screen: 'Pass-1 lag-1 autocorrelation |z| vs the two-sided critical z', size: 'α/3 = 3.333e-3' },
  { id: 'S3', step: 16, screen: 'Pass-1 Wald–Wolfowitz runs test, two-sided', size: 'α/3 = 3.333e-3' },
  { id: 'S4', step: 16, screen: 'nine effective-edge bands, each |simRTP − theory| ≤ 5·SE + 1e-4', size: '≈5.73e-7 per band, ≈5.16e-6 over nine' },
  { id: 'S5', step: 16, screen: 'RTP-convergence final point within 5·SE + 1e-4 of theory', size: '≈5.73e-7' },
  { id: 'S6', step: 17, screen: 'cherry-pick flag count, exact one-sided binomial', size: '≤ α = 0.01 (discrete, achieved size below α)' },
  { id: 'S7', step: 17, screen: 'served-band return, one-sided normal lower tail', size: 'α = 0.01' },
];

/**
 * Union bound over the screens STEP 16 ALONE scores: S1–S3 family-wise at α, plus the ten 5·SE band
 * checks. It exists so that "the step's level is α = 0.01" cannot be published for a step that also
 * scores S4 and S5. α = 0.01 is the level of the THREE corrected
 * screens; Step 16's own nominal bound is this number, and it is quoted from here rather than typed.
 *
 * The step's other rejections — derived-field reconciliation, population identity, integer win
 * counts and their reconstruction, cumulative consistency, exact standard errors, the sample-depth
 * pins — are DETERMINISTIC identities, not statistical tests. An honest artifact satisfies them with
 * probability 1, so they add nothing to this bound. That is the whole difference between them and
 * a "perfection proves fabrication" rule, which rejects outcomes that honest runs produce with
 * positive probability and is therefore an unpriced addition to the error budget.
 */
export const STEP_16_BOUND = 0.01 + 9 * 5.733e-7 + 5.733e-7;

/** Family-wise upper bound over SCORED_STATISTICAL_PREDICATES, by the union bound. */
export const FAMILY_WISE_BOUND = STEP_16_BOUND + 0.01 + 0.01;
