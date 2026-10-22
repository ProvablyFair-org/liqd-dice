/**
 * liqd Dice game math. The roll is a single bias-free draw on a discrete integer grid
 * (0..9999 → /100 → a value in [0.00, 99.99]). A bet defines a band { lower, upper,
 * inverted }; the win rule is HALF-OPEN — lower inclusive, upper EXCLUSIVE
 * (win iff roll >= lower && roll < upper; inverted takes the exact complement).
 *
 * The boundary semantics are pinned by direct probes of the operator's own verifier
 * with a roll landing exactly on each bound (evidence/E13-verify-endpoint-boundary-probes.json):
 * roll == upper LOSES a non-inverted band and WINS its inverted complement; roll == lower
 * does the opposite. An earlier release of this audit modelled the band as inclusive on
 * both ends — indistinguishable across all 6,700 settled bets, because a roll lands
 * exactly on a bound with probability 1/10,000 and none ever landed on an upper bound —
 * and derived a spurious effective-edge variation from it. Under the true half-open rule
 * every mode's winning region holds exactly 100·W grid points, so the effective edge is
 * exactly 1.00% on every bet.
 *
 * There is no external multiplier table: the payout multiplier is a closed-form function
 * of the band's win chance, derived here and cross-checked against every captured win.
 *
 * originals-dice limits: minOdds 1.0102, maxOdds 9900. House edge 1.00%.
 *
 * maxOdds 9900× was ACCEPTED live on 2026-09-01 by placing a 9900x
 * bet on qa (server accepted and settled it, `place-bet` 200, payout formula
 * stake x 9900) and by the UI clamping any higher multiplier to 9900x. NOTE the
 * operator's own `get-game-settings` config field reads maxOdds 99, which the
 * server does NOT enforce; the earlier 99 in this repo was that config field
 * taken on trust. See finding F-LIMITS in MANIFEST.md#verification-results (the operator's config API
 * misstating enforced behaviour is itself a trust-surface fact).
 * At 9900x the winning band is a single grid point (win chance 0.01%): under the half-open
 * rule (observed on the operator's verifier, E13; assumed for settlement, L2) it wins on exactly
 * 1/10000 -> exactly 99% RTP, so the extreme is fair, not player-favourable.
 */
export const RANGE = 10000;        // integer draw domain 0..9999
export const CURSOR = 0;           // fixed HMAC cursor for the single dice draw
export const SCALE = 100;          // roll = draw / 100  → 2 decimals, ceiling 99.99
export const HOUSE_EDGE = 0.01;
export const MIN_ODDS = 1.0102;
export const MAX_ODDS = 9900;   // live-witnessed ceiling (a 9900x bet settled), NOT the config field's 99

// Simulation sample depths — exported so the verify step (Steps 16–17) can recompute the
// edge-band and serial predicates at the SAME n the artifact was produced with, rather than
// trusting the artifact's stored `n`. NOTE the serial (lag-1 / runs)
// analysis runs on SIM_SERIAL_DRAWS, a 200,000-roll prefix of the SIM_UNIFORMITY_DRAWS sample —
// the uniformity histogram uses all 2,000,000; the serial screen uses the first 200,000.
export const SIM_UNIFORMITY_DRAWS = 2_000_000;
export const SIM_SERIAL_DRAWS = 200_000;
export const SIM_EDGE_BETS = 2_000_000;
/** RTP-convergence depth. Exported so Step 16 can require the series to END there. */
export const SIM_RTP_BETS = 20_000_000;
/** The sample sizes the convergence series must contain, in order. */
export const SIM_RTP_MARKS: readonly number[] = [1_000, 10_000, 100_000, 1_000_000, 5_000_000, 10_000_000, SIM_RTP_BETS];
/**
 * EDGE CONVERGENCE ON 98 TARGETS (DICE-20), added 22 October 2026 to standardize on the design of
 * the Duel dice audit (`v1.0.0`): 98 targets × 1,000,000 bets each. Duel's targets are "roll over
 * 2.00 … over 99.00"; on LIQD the same targets are the over-mode bands [X, 100) for X = 2, 3, …, 99
 * (win chance 98% … 1%, 1.0102× … 99×; LIQD's MIN_ODDS 1.0102 is exactly `over 2.00`). Each target
 * is scored within 5·SE + 1e-4 of its theoretical RTP, and the MEAN simulated RTP over the 98 targets
 * at each of SIM_TARGET_MARKS (Duel's marks) is the convergence series the chart draws.
 *
 * Everything above is unchanged from v1.0.0 and runs first, on the same seeds: the targets are
 * APPENDED, after the nine bands, on the continuation of the same pinned seed stream (see
 * SIM_TARGET_SEED_COUNTER_BASE).
 */
export const SIM_TARGET_BETS = 1_000_000;
/** Per-target sample sizes at which the cross-target mean RTP is recorded, in order; the last is SIM_TARGET_BETS. */
export const SIM_TARGET_MARKS: readonly number[] = [10_000, 50_000, 100_000, 500_000, SIM_TARGET_BETS];
/** Pass-2 cherry-pick screen geometry: one window is SIM_CHERRY_WINDOW draws over SIM_CHERRY_BINS bins. */
export const SIM_CHERRY_BINS = 20;
export const SIM_CHERRY_WINDOW = 50;
/** Nominal per-window screening threshold. The ACHIEVED rate is derived in src/exact-chi2.ts. */
export const SIM_CHERRY_SEED_ALPHA = 0.05;

/**
 * PASS-2 SERVED-BAND RETURN SCAN (DICE-21) — the load-bearing cherry-pick realization (the
 * ProvablyFair.org standard dice realization).
 *
 * Every revealed casino server seed is replayed for SIM_PASS2_NONCES nonces. The EARLY window is the
 * captured nonce range (0..SIM_PASS2_EARLY_WINDOW−1, i.e. the 50 nonces the operator actually
 * served in that epoch); the REFERENCE window is the remainder. The statistic is the payout-weighted
 * RETURN of the bands the casino actually served — a cherry-picking operator biases the PLAYER'S
 * return, which the draw-uniformity screen above (SIM_CHERRY_*) is blind to.
 *
 * WHAT IS EXACT, AND WHAT IS ASYMPTOTIC — stated precisely so the prose never overstates it. Each
 * served band contributes an INDEPENDENT scaled Bernoulli per nonce: it pays its multiplier `mult`
 * with the band's EXACT lattice win-probability `pᵢ = discreteWinProbability(band)` (the winning
 * grid points over RANGE, an exact rational), else 0. The aggregate early return is therefore a sum
 * of independent scaled Bernoullis across all served (seed, nonce) cells — a SCALED POISSON-BINOMIAL
 * — whose MEAN (Σ pᵢ·multᵢ) and VARIANCE (Σ pᵢ(1−pᵢ)·multᵢ²) are EXACT by linearity, regardless of
 * the multiplier heterogeneity this capture carries. Those exact per-bet moments are what standardise
 * the statistic. The TAIL is then the one-sided normal (CLT) lower tail of that ~6,700-term
 * aggregate. This is EXACT MOMENTS + an ASYMPTOTIC (CLT) TAIL — NOT an exact-lattice CDF: the exact
 * distribution of the aggregate return would be a convolution of heterogeneous scaled Binomials whose
 * support runs to a mean of 2^25 and up to 2^39 atoms on this multi-band capture (110 of 134 epochs
 * multi-band, up to 36 distinct multipliers per epoch), which is computationally intractable at
 * verify speed. A single-target-per-epoch re-capture (one band held across an epoch's nonces)
 * would collapse each per-seed return to m·Binomial and make the exact CDF tractable —
 * see MANIFEST.md load-bearing-premise row and L4. The one-sided lower-tail rule is fixed in code,
 * but it was specified AFTER the capture (2026-08-27; proposed by an external reviewer on
 * 2026-09-09), not before the data were seen: cherry-picking SHORTS the early window the
 * player saw, so the step rejects on aggP < α. Its detection power is about a 14.4 pp per-bet
 * return deficit at 80% power (printed by Step 17); a smaller selection effect passes it.
 *
 * The three SIM_PASS2_* exports are declared just below EXPECTED_EPOCH_SIZE / ALPHA, so the early
 * window and the significance level stay single-sourced (SIM_PASS2_EARLY_WINDOW == EXPECTED_EPOCH_SIZE,
 * SIM_PASS2_ALPHA == ALPHA).
 */
export const SIM_PASS2_NONCES = 10_000;

/**
 * The single significance level of the audit's statistics — Pass-1 uniformity, the serial screen,
 * the Pass-2 served-band return and cherry-pick flag-count test all use it, and so does the pooled
 * real-roll uniformity, which is informational (reported, not scored, since 2026-09-29).
 * Single-sourced here. Declared once in `src/simulate.ts` and again in
 * `tests/steps/simulation.ts`, it is exactly what lets the two sides of the cherry-pick null
 * drift apart.
 */
export const ALPHA = 0.01;

/**
 * MULTIPLICITY. Step 16 judges THREE independent screens on the same fresh-seed sample — draw
 * uniformity, lag-1 autocorrelation and the runs test — so judging each at ALPHA gives the STEP a
 * false-positive rate of 1 − (1 − ALPHA)³ = 2.97%, not 1%. That is not a theoretical objection: the
 * measured trip rate of `npm test` was 1 run in 20 (MANIFEST.md#reproduce-the-audit, Run-invariance), and a
 * scored step that fails ~3% of the time on honest data teaches its reader to re-run until green.
 *
 * Bonferroni: each screen is judged at ALPHA / ALPHA_SCREENS, so the STEP's family-wise level is
 * ALPHA. The uniformity screen is two-sided (its lower tail rejects a histogram closer to its
 * expectation than a 2,000,000-draw sample plausibly produces — see tests/steps/simulation.ts),
 * so it spends ALPHA_SCREEN/2 in each tail and its size is still ALPHA_SCREEN.
 *
 * Judging three screens without correcting at all would leave the step's advertised level and its
 * real level different numbers.
 */
export const ALPHA_SCREENS = 3;
export const ALPHA_SCREEN = ALPHA / ALPHA_SCREENS;

/**
 * SHA-256 of the pinned capture. Single-sourced here so the producer (`src/simulate.ts`) and the
 * verifier (`tests/verify.ts`) cannot pin different datasets.
 */
export const DATASET_SHA256 = 'ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34';

/**
 * ProvablyFair.org audit identifier — assigned, PROVISIONAL. Single-sourced here so the emitted
 * `outputs/verification-results.json` carries the same ID the report chapters print (README.md,
 * MANIFEST.md), and DICE-28's "the audit ID is assigned" is machine-checkable rather than prose
 * only. `LQ` = LIQD; `04` = the fourth LIQD audit (blackjack, mines, plinko preceded it). The
 * qualifier stays `provisional` because every bet was captured against the pre-production
 * environment (`qa.liqd.com`) before public launch — production parity is not established by this
 * capture and is not claimed. It is NOT upgraded to a final ID here: that is a publication act.
 */
export const AUDIT_ID = 'PF-2026-LQ04';
export const VERDICT_QUALIFIER = 'provisional';

/**
 * THE AUDITED POPULATION, as CODE constants (G-BIND).
 *
 * A statement of how big this audit is that lives INSIDE the file being audited is no statement at
 * all: comparing `bets.length` against `meta.plannedTotal` and `seeds.length` against
 * `Math.ceil(meta.plannedTotal / meta.epochSize)`, both read from the dataset's own header, is
 * self-referential, and the SHA-256 pin does not repair it — the pin proves the file has not
 * changed since WE pinned it, not that it is the capture. An external reviewer executed the
 * consequence: delete nonces 30–49 from every epoch (6,700 → 4,020 bets), set `meta.epochSize = 30`,
 * `meta.plannedTotal = 4020` and `meta.phases` to the new counts, set every `seeds[].nonceEnd = 29`,
 * re-pin `DATASET_SHA256`, regenerate the simulation — and the suite returned
 * **21/21 PROVABLY FAIR — Full Pass on a 4,020-bet dataset**.
 *
 * A row count is not an identity. These constants are the audit's own statement of its population;
 * `meta` is checked AGAINST them rather than believed. Changing them is a visible source edit in
 * the same commit as the dataset, which is exactly the property a header field lacks.
 * Counterexample registered as `coherent population shrink` in `tests/mutations.json`.
 */
export const EXPECTED_BETS = 6700;
export const EXPECTED_SEEDS = 134;
export const EXPECTED_EPOCH_SIZE = 50;
/** Bets per capture phase. The plan, in code — not `meta.phases`, which is inside the evidence. */
export const EXPECTED_PHASE_BETS: Readonly<Record<string, number>> = { A: 5000, B: 1000, C: 200, D: 500 };

/**
 * Pass-2 served-band return scan (DICE-21), completing the SIM_PASS2_* set whose design is documented
 * above. The early window IS the captured served depth per epoch, and the level IS the suite's single
 * ALPHA — both single-sourced here so the producer (src/simulate.ts) and the verifier
 * (tests/steps/simulation.ts) cannot drift.
 */
export const SIM_PASS2_EARLY_WINDOW = EXPECTED_EPOCH_SIZE;   // 50 — the captured served depth per epoch
export const SIM_PASS2_ALPHA = ALPHA;                        // the suite's single significance level (0.01)

/**
 * SHA-256 of the committed simulation artifacts that Steps 16–17 score.
 *
 * WHY THEY ARE PINNED. An `npm test` that ran `npm run simulate` first would have Step 16 score a
 * file written seconds earlier. `npm test` is `mocha && npm run verify` and scores THIS committed
 * artifact; regeneration is `npm run test:full`, which sets `SIM_FRESH=1` to record the fresh hash
 * instead of enforcing the pin.
 *
 * THE PASS-1 EXPERIMENT IS DETERMINISTIC AND BYTE-REPLAYABLE (DICE-20). The Pass-1 seed stream is no
 * longer `crypto.randomBytes`: it is derived from the pinned `SIM_MASTER_SEED` below by an HMAC
 * counter (`src/simulate.ts` detSeed), so the seeds are still auditor-generated and independent of
 * the casino's captured seeds — "fresh" in the sense DICE-20 means — but the whole experiment
 * reproduces bit-for-bit on any machine. `npm run simulate` writes the SAME bytes every time
 * (there is no run-metadata field in the artifact), so `npm run test:full` regenerates it and the
 * field diff is empty, and the raw Pass-1 statistics (uniformity χ², the serial correlation, each
 * band's simulated RTP, the convergence path) are now RE-DERIVABLE — by replaying the pinned
 * producer — rather than attested only by a nine-minute regeneration nobody could reproduce.
 *
 * WHAT THIS CHANGES FOR FABRICATION. Under the old fresh-entropy design a forged Pass-1 statistic,
 * moved within its own sampling distribution and re-pinned, was invisible (former limitation L1): a
 * regeneration produced DIFFERENT numbers, so it could not adjudicate the committed ones. With a
 * pinned master seed the producer is a pure function of visible source, so `npm run test:full` now
 * recomputes the EXACT committed statistics and the reproduction diff catches any figure that is not
 * what the declared experiment outputs. Changing the master seed to hand-pick a favourable statistic
 * is a visible one-line source edit that re-rolls every Pass-1 figure at once. The two-sided
 * uniformity screen, the structural win-count / standard-error validation and the per-field
 * re-derivation in `tests/steps/simulation.ts` remain — they are what a same-machine reader who does
 * not re-run the producer still relies on — but the pin is no longer the only thing standing between
 * a forged statistic and a Full Pass. Scored inside Step 19 (with the dataset pin), never allowed to
 * abort before the scored steps.
 */
export const SIMULATION_SHA256 = '55873640715d1f9e38d86e10227791337c5664dca094068b2d8d148fdf9ccd97';
export const SIMULATION_HTML_SHA256 = '6b7b6bb7c474a49b48effbd31dd69ca952e4af5ee451902dbaff4a745743e02c';

/**
 * The auditor's pinned entropy source for the Pass-1 simulation (DICE-20). Every "fresh" seed the
 * Pass-1 experiment uses is `HMAC-SHA256(SIM_MASTER_SEED, counter)[0..16]`, consumed in a fixed
 * order, so the experiment is DETERMINISTIC and byte-for-byte replayable while remaining independent
 * of the casino's captured server seeds. This is an auditor construction, not an operator field. Its
 * only requirement is to be fixed and disclosed; the value is arbitrary auditor entropy chosen once.
 */
export const SIM_MASTER_SEED = 'a11d17e5c0ffee5ea1ed0c5b1b7ea5e5d1ce5eed5a1710add1ce5eed10addba5';

import type { DiceParams } from './types';

/**
 * The canonical effective-edge band list. `src/simulate.ts` simulates exactly these and Step 16
 * requires the artifact's nine rows to BE these bands — distinct, all present. A step that
 * checked only `length === 9` would pass nine copies of the easiest band.
 */
export const SIM_EDGE_BANDS: readonly { label: string; params: DiceParams }[] = [
  { label: 'under 50 (1.98×)', params: { lower: 0, upper: 50, inverted: false } },
  { label: 'over 50 (1.98×)', params: { lower: 50, upper: 100, inverted: false } },
  { label: 'under 10 (9.9×)', params: { lower: 0, upper: 10, inverted: false } },
  { label: 'over 90 (9.9×)', params: { lower: 90, upper: 100, inverted: false } },
  { label: 'inside 25-75 (1.98×)', params: { lower: 25, upper: 75, inverted: false } },
  { label: 'outside 25-75 (1.98×)', params: { lower: 25, upper: 75, inverted: true } },
  { label: 'over 98 (49.5×)', params: { lower: 98, upper: 100, inverted: false } },
  { label: 'over 99 (99×)', params: { lower: 99, upper: 100, inverted: false } },
  { label: 'under 1 (99×)', params: { lower: 0, upper: 1, inverted: false } },
];

/** The RTP-convergence strategy band — one definition, read by both the producer and Step 16. */
export const SIM_RTP_STRATEGY: DiceParams = { lower: 0, upper: 50, inverted: false };

/**
 * The 98 edge-convergence targets: `over X` for X = 2 … 99, i.e. the band [X, 100). The order is
 * the artifact's row order and the order in which they consume seeds. Step 16 requires the
 * artifact's target rows to BE these bands, in this order.
 */
export const SIM_TARGETS: readonly { label: string; params: DiceParams }[] = Array.from(
  { length: 98 },
  (_, i) => ({ label: `over ${i + 2}.00`, params: { lower: i + 2, upper: 100, inverted: false } }),
);

/**
 * WHERE THE TARGETS' SEEDS COME FROM — the pre-existing seed source, unchanged.
 *
 * Every Pass-1 seed is `randSeed()` in `src/simulate.ts`: HMAC-SHA256(SIM_MASTER_SEED, counter)
 * truncated to 16 bytes (32 hex), the counter starting at 0 and rising by one per seed. That is the
 * v1.0.0 derivation, and the v1.0.0 blocks consume it in their v1.0.0 order, so they get the same
 * seeds and the same figures:
 *
 *   uniformity + serial      2 + SIM_UNIFORMITY_DRAWS/50 = 40,002 seeds   counters 0 … 40,001
 *   under-50 convergence     2 + SIM_RTP_BETS/50         = 400,002 seeds  counters 40,002 … 440,003
 *   nine bands               9 × (2 + SIM_EDGE_BETS/50)  = 360,018 seeds  counters 440,004 … 800,021
 *
 * The targets continue the SAME stream from counter 800,022, and each consumes it exactly as a band
 * does (`src/simulate.ts`): `s = randSeed(), c = randSeed()`, then a fresh server seed `s =
 * randSeed()` every 50 bets (nonce = bet index mod 50, like a real 50-bet epoch). Target t (0-based,
 * `over (t+2).00`) therefore uses counters SIM_TARGET_SEED_COUNTER_BASE + t·SIM_TARGET_SEEDS_EACH …
 * + SIM_TARGET_SEEDS_EACH − 1: its client seed at +1 and its server seeds at +2 … +20,001. No seed
 * was chosen, searched or re-rolled: the counters are fixed by this arithmetic on the pinned depths,
 * and Step 16 re-derives each target's first counter, client seed and first server seed from it.
 */
export const SIM_TARGET_SEED_COUNTER_BASE =
  (2 + SIM_UNIFORMITY_DRAWS / 50) + (2 + SIM_RTP_BETS / 50) + SIM_EDGE_BANDS.length * (2 + SIM_EDGE_BETS / 50);
export const SIM_TARGET_SEEDS_EACH = 2 + SIM_TARGET_BETS / 50;

/** Stable key for a band, for set-identity comparisons. */
export function bandKey(p: DiceParams): string {
  return `${p.lower}|${p.upper}|${p.inverted ? 1 : 0}`;
}

/** Continuous win chance in PERCENT for a band, as the operator prices it. */
export function continuousWinChancePct(p: DiceParams): number {
  const width = p.upper - p.lower;
  return p.inverted ? 100 - width : width;
}

/**
 * PAYOUT_NUMERATOR / basisPoints is the exact quotient the operator serves as `multiplier`.
 *
 * `basisPoints` is the AUDITOR'S construction, not an operator field: the capture contains no
 * `basisPoints` anywhere (grep the dataset — it is absent), and this is `Math.round(winChance% ×
 * 100)`, the win chance re-expressed in hundredths of a percent. The evidence for the form is that
 * the served `multiplier` equals `9900/basisPoints` bit-for-bit on all 2,807 captured wins while the
 * float closed form `(100/wc)·(1−edge)` matches only 1,719 of them — so the quotient, not the closed
 * form, is what the server computes. Wherever the report calls the multiplier "the operator's
 * bit-exact 9900/basisPoints value", that is what it means, and every such site now says so.
 */
export const PAYOUT_NUMERATOR = (1 - HOUSE_EDGE) * 10000;   // exactly 9900 at a 1% edge
export function payoutBasisPoints(p: DiceParams): number {
  return Math.round(continuousWinChancePct(p) * 100);
}

/**
 * The quoted multiplier — validated against every captured winningAmount:
 *   mult = (100 / winChance%) · (1 − edge) = 99 / winChance%
 * The operator settles the credit by the two-stage 8-dp rule in settledCredit — NOT at unbounded
 * precision. The served field itself is a full binary64 (e.g. 1.071776550828191 for basisPoints
 * 9237), not a display-rounded 1.07177655; the 8-dp rounding is the SETTLEMENT intermediate, not the
 * form the multiplier arrives in.
 *
 * PRECISION, stated rather than glossed. This closed form and the served
 * quotient `PAYOUT_NUMERATOR/basisPoints` are equal as RATIONALS but NOT as binary64: over the 2,807
 * captured wins they agree bit-for-bit on 1,719 and differ by up to 24 ULP on the other 1,088 (against
 * `99/winChance%` written that way: 1,823 agree, 984 differ, same 24-ULP worst case). The report must
 * therefore not call `9900/basisPoints == 99/continuousWinChance%` "bit-exact" — it is an exact
 * identity over the rationals and a 1-ULP-class disagreement in floating point. Step 7 pins the
 * served field against the QUOTIENT with `===`, which is why it reports 0 deviation; every other
 * consumer of this function rounds to 8 dp before it matters (`round8(quotedMultiplier(p))` was
 * verified equal to `round8(servedMultiplier)` on all 2,807 wins).
 *
 * Because the payout is priced on the CONTINUOUS win chance and the half-open band wins
 * on exactly 100·W grid points, the edge is exactly 1.00% for every band — nominal and
 * realised agree (see effectiveEdge below).
 */
export function quotedMultiplier(p: DiceParams): number {
  const wc = continuousWinChancePct(p);
  return wc > 0 ? (100 / wc) * (1 - HOUSE_EDGE) : 0;
}

/**
 * Number of integer roll outcomes (draw ∈ 0..9999, roll = draw/100) that WIN the band —
 * ANTI-CIRCULAR: pure arithmetic over the roll grid, never operator data. The band is
 * HALF-OPEN: roll ∈ [lower, upper) ⇔ draw ∈ [lower·100, upper·100 − 1], which is
 * upper·100 − lower·100 = 100·W points exactly, in every mode (E13 boundary probes).
 *
 * The bounds are scaled with Math.round, NOT ceil/floor: every band bound in the game is
 * a 2-dp decimal, so lower·100 is an integer in exact arithmetic — but IEEE-754 puts many
 * of the products just off it (1.1·100 = 110.00000000000001, 0.57·100 = 56.99999999999999),
 * and ceil/floor then land one grid point away. The assertion
 * keeps the rounding honest: if a bound ever stops being a 2-dp decimal, this throws
 * rather than silently rounding a real fraction.
 */
export function discreteWinCount(p: DiceParams): number {
  const lo = Math.round(p.lower * SCALE);
  const hi = Math.round(p.upper * SCALE);
  if (Math.abs(p.lower * SCALE - lo) > 1e-6 || Math.abs(p.upper * SCALE - hi) > 1e-6) {
    throw new Error(`non-2dp band bound: ${JSON.stringify(p)}`);
  }
  // [lo, hi) clamped to the grid [0, RANGE)
  const inBand = Math.max(0, Math.min(RANGE, hi) - Math.max(0, lo));
  return p.inverted ? RANGE - inBand : inBand;
}

/** TRUE discrete win probability = winning outcomes / 10000. */
export function discreteWinProbability(p: DiceParams): number {
  return discreteWinCount(p) / RANGE;
}

/**
 * Win rule applied to a served roll — HALF-OPEN band [lower, upper), honouring `inverted`.
 * Boundary semantics pinned by operator-verifier probes with the roll exactly on each
 * bound (E13): roll == lower wins, roll == upper loses; inverted is the exact complement.
 */
export function diceWin(roll: number, p: DiceParams): boolean {
  const inBand = roll >= p.lower && roll < p.upper;
  return p.inverted ? !inBand : inBand;
}

/**
 * EFFECTIVE house edge for a band, from the DISCRETE grid — the number a player actually
 * faces:  edge = 1 − P_discrete · quotedMultiplier.
 * Under the half-open rule the winning region holds exactly 100·W points, so
 * P_discrete = W/100 exactly and this evaluates to exactly HOUSE_EDGE (1.00%) for every
 * band in every mode — computed rather than assumed, so a future rule change would show.
 */
export function effectiveEdge(p: DiceParams): number {
  return 1 - discreteWinProbability(p) * quotedMultiplier(p);
}

/**
 * The SAME statement as `effectiveEdge(p) === HOUSE_EDGE`, in exact integers.
 *
 *   edge = 1 − (winCount/RANGE)·(PAYOUT_NUMERATOR/basisPoints) = HOUSE_EDGE
 *   ⇔ 100 · winCount · PAYOUT_NUMERATOR === (PAYOUT_NUMERATOR/100) · RANGE · basisPoints
 * i.e. at the audited 1% edge, 100·winCount·9900 === 99·10000·basisPoints. Every term is a small
 * integer (largest product 9.9e9, comfortably inside 2^53), so `===` is exact.
 *
 * WHY NOT A TOLERANCE. Asserting `|edge − 0.01| < 1e-12` and justifying that width as
 * "~150× the arithmetic noise", from the 6.3e-15 worst case across the captured bands, measures the
 * noise on the capture — and the capture does not contain the worst case. `continuousWinChancePct` computes `upper − lower` in binary64, so an `over 99.99` band gives
 * `100 − 99.99 = 0.010000000000005116`, a multiplier of 9899.999999994936 and an edge departure of
 * 5.063813951489138e-13 — the threshold was **1.97×** the noise, not 150×, and `over 99.99` is
 * precisely the 9900× extreme E14 recommends probing in a production recapture. A tolerance that is
 * 2× its own noise floor is a coin flip waiting for a band nobody sampled.
 *
 * In integers there is no noise and no threshold: verified with 0 violations over 59,998 bands
 * spanning the under / over / inside / outside families at every 2-dp bound.
 */
export function effectiveEdgeIsExact(p: DiceParams): boolean {
  const bps = payoutBasisPoints(p);
  if (bps <= 0) return false;
  if (!Number.isInteger(PAYOUT_NUMERATOR)) return false;   // the identity is only integral at an edge where it is
  return 100 * discreteWinCount(p) * PAYOUT_NUMERATOR === (PAYOUT_NUMERATOR / 100) * RANGE * bps;
}

/** Theoretical RTP for a band = P_discrete · quotedMultiplier = 1 − effectiveEdge. */
export function theoreticalRTP(p: DiceParams): number {
  return discreteWinProbability(p) * quotedMultiplier(p);
}

/**
 * Sign of (served-band return − its expectation) over a window of (band, won) cells, computed in
 * EXACT RATIONAL ARITHMETIC: −1 below expectation, 0 exactly on it, +1 above.
 *
 * WHY NOT COMPARE THE TWO FLOAT SUMS. Each cell's return is the multiplier 9900/basisPoints on a
 * win (else 0) and its expectation is winCount/RANGE × 9900/basisPoints, which is exactly 0.99 for
 * every band under the half-open rule. A 50-nonce window can therefore land EXACTLY on its
 * expectation (49.5 against 49.5), and the two binary64 accumulations then disagree in the last
 * bits (49.5 against 49.500000000000014), so a float `<` counts an exact tie as "below". The
 * capture has such windows; comparing the floats misclassified them.
 *
 * Per cell, return − expectation = (9900 / (RANGE·bps)) · (won·RANGE − winCount). The positive
 * factor 9900/RANGE does not change the sign, so the sign is that of Σ (won·RANGE − winCount)/bps,
 * summed here as a BigInt fraction. Only the sign is used; z and p stay the float statistic.
 */
export function servedReturnSign(cells: readonly { band: DiceParams; won: boolean }[]): -1 | 0 | 1 {
  let num = 0n, den = 1n;
  const gcd = (a: bigint, b: bigint): bigint => { a = a < 0n ? -a : a; while (b) { [a, b] = [b, a % b]; } return a; };
  for (const { band, won } of cells) {
    const bps = BigInt(payoutBasisPoints(band));
    if (bps <= 0n) throw new Error(`servedReturnSign: band with no win chance: ${JSON.stringify(band)}`);
    const term = (won ? BigInt(RANGE) : 0n) - BigInt(discreteWinCount(band));
    num = num * bps + term * den;
    den = den * bps;
    const g = gcd(num, den);
    if (g > 1n) { num /= g; den /= g; }
  }
  return num < 0n ? -1 : num > 0n ? 1 : 0;
}

/**
 * Does a SERVED roll equal a RECOMPUTED one? The single definition, imported by Steps 4, 5, 6, 13,
 * 14 and 18 — one predicate, six readers.
 *
 * EXACT, deliberately. Every roll is draw/100 for an integer draw
 * in [0, 10000), so a served roll that is genuinely the operator's outcome is the nearest binary64
 * to a 2-dp decimal, and the recomputed value is the nearest binary64 to the SAME decimal — they
 * are bit-identical, verified on all 6,700 captured rolls. Allowing |local − served| up
 * to 1e-9 is seven orders of magnitude wider than the 0.01 grid spacing: it could not admit a
 * wrong outcome, but it does admit a served value that is not on the grid at all (24.010000001), and
 * a tolerance nobody needs is a tolerance nobody audits. The finiteness guards stay: a non-numeric
 * served roll must be rejected explicitly, not silently by a false comparison.
 */
export function servedRollMatches(served: number, recomputed: number): boolean {
  if (!Number.isFinite(served) || !Number.isFinite(recomputed)) return false;
  const units = Math.round(served * SCALE);
  if (units / SCALE !== served) return false;            // served value is not on the 2-dp grid
  if (units < 0 || units >= RANGE) return false;         // outside the roll domain
  return served === recomputed;
}

/** Round to 8 decimal places (nearest; strips IEEE-754 dust from an already-8-dp value). */
export function round8(x: number): number {
  return Math.round(x * 1e8) / 1e8;
}

/**
 * The credited amount LIQD actually settles on a win, characterised from the capture.
 * Settlement is TWO-STAGE at 8 decimal places:
 *   credit = ROUND_HALF_EVEN_8( stake × ROUND_8(multiplier) )
 * i.e. the served multiplier is ROUNDED to 8 dp as the first settlement stage, and the product
 * of stake and that rounded value is then rounded half-EVEN
 * (banker's rounding) to 8 dp. This exact rule reproduces all 2,807 captured credits with
 * ZERO residual; naive ROUND_HALF_UP_8(stake × multiplier) misses 128 of them, and 274 of the
 * 2,807 wins land on an exact 8-dp tie where the rounding MODE decides the last unit. Against the
 * raw un-rounded product the residual is directionless: measured in the operator's own number system
 * (creditResidualSign — decimal stake × the exact rational multiplier), the settlement rounds the
 * player down on 1,341 wins and up on 1,316, lands EXACTLY on the product on 150, max |residual|
 * 5.5e-9 and net +4.9e-8 USDC over the whole capture — no house bias. The payout is therefore NOT
 * "full precision, no rounding" — but on 150 of the 2,807 wins nothing was rounded at all.
 *
 * ARITHMETIC. Stage 2 is
 * done in EXACT INTEGER arithmetic on 1e-8 units, because the rule's tie case is unreachable in
 * binary floating point. Forming `stake × round8(m) × 1e8` as a double
 * and calling it a tie when `|frac − 0.5| < 1e-6` is wrong in both halves at scale: the
 * product carries relative error ~1e-16, so at ≥ 9e9 units an exact .5 tie materialises as, e.g.,
 * 22297297297.499996 — outside a tie window that is itself 1e-6 wide in the WRONG units (1e-6 of a
 * unit, not of the ULP). Fuzzing 106,711 (stake, band) pairs against an independent Python
 * `decimal` reference found 7 mismatches, every one an exact tie at ≥ 9e9 units, e.g.
 * settledCredit(2.5, 9900/111) returned 222.97297297 where the rule gives 222.97297298. None is
 * reachable by THIS capture (its 274 ties all sit near 1e7 units, and Step 8 reproduces all 2,807
 * credits either way), but a production capture at $2.50 / $25 stakes would have raised false
 * FAILs against correct operator credits. In integer units the tie is `r === 5·10^7` — an exact
 * comparison with no window at all.
 *
 * Stage 1 (`round8` of the served multiplier) stays in doubles, and its tie behaviour is stated
 * rather than assumed away — "there is no tie to lose there" would be false.
 * Exact 8-dp ties in `9900/basisPoints` DO exist: at basisPoints 2048
 * (multiplier 4.833984375) and 6144 (1.611328125), both inside the swept range. `Math.round` is
 * half-UP, so stage 1 resolves those upward — while stage 2 is half-EVEN. The two stages therefore
 * use DIFFERENT tie modes, and the audit has no evidence for the operator's stage-1 mode, because no
 * captured bet touches either band.
 *
 * ONLY ONE OF THE TWO TIES DISCRIMINATES. At basisPoints 2048 the digit
 * before the tie is 7 — odd — so half-EVEN also rounds up: both modes give 4.83398438 and the tie
 * decides nothing. The discriminator is basisPoints **6144**, where half-up gives **1.61132813** and
 * half-even **1.61132812**. Even there the difference survives only at a stake that preserves it:
 * at $1 the credits differ, at $0.10 the stage-2 rounding erases it (both settle 0.16113281). So the
 * evidence that would close this premise is precisely a settled win on basisPoints 6144 at a stake
 * of $1 or more. The shipped sweep (`tests/dice/settlementTests.ts`) asserts `Math.round` agrees
 * with exact HALF-UP rounding on all 9,800 reachable basis points, which is trivially tie-safe by
 * that definition and would pass just as well if the operator rounded stage 1 half-even. Recorded as
 * an ASSUMED premise (see MANIFEST.md#limitations-and-trust, L6, and `.pf-assumptions`).
 */
const UNITS_PER_WHOLE = 100_000_000n;      // 1e8 — the settlement grid
const HALF_UNIT = 50_000_000n;             // 0.5 · 1e8, the exact half-even tie point

/**
 * Sign of (settled credit − stake × multiplier), computed EXACTLY: −1 if the settlement rounded
 * the player down, +1 if up, 0 if it landed exactly on the product.
 *
 * ── THE LESSON THIS FUNCTION EXISTS TO CARRY ──────────────────────────────────────────────────
 * A claim about how the OPERATOR rounds must be computed in the OPERATOR'S OWN NUMBER SYSTEM —
 * decimal — never in the auditor's binary64 representation of it.
 *
 * Taking `binary64Fraction()` of the stake and of the served multiplier — the EXACT RATIONAL VALUE
 * of each binary64, compared against the exact 8-dp decimal credit with no rounding of the product
 * back to binary64 — lets the representation error inside `binary64(0.1)`,
 * 0.1000000000000000055511151231257827…, survive into the comparison, so the function reports
 * a rounding direction for every single win: "down on 1,386, up on 1,421, none exactly on the
 * product".
 *
 * That is wrong. Witness, bet `vChEZ7Lu-yY1PMmq5fOz5`: `betAmount 0.1`, `multiplier 3.125`
 * (dyadic, therefore exact in binary64), `winningAmount 0.3125`. The exact decimal product is
 * 1/10 × 25/8 = 5/16 = 0.3125 — EXACTLY the credit. Nothing was rounded, yet MODEL 1
 * returns −1, "the settlement rounded the player down". 150 of the 2,807 wins
 * involve no rounding at all; 105 of them are the Phase-C `$10 × 1.98 = $19.80` bets — the very case
 * the report prints as an exact worked example (MANIFEST.md#verify-a-bet) while the harness called it rounded.
 *
 *   MODEL 1  binary64(stake) × binary64(mult), exact rationals   → 1,386 down / 1,421 up / 0 exact
 *   MODEL 2  decimal stake  × exact rational 9900/basisPoints    → 1,341 down / 1,316 up / 150 exact
 *
 * MODEL 2 is what ships, because the operator's ledger is decimal: the stake is a decimal amount the
 * player typed, and the multiplier is the rational 9900/basisPoints (see payoutBasisPoints). Both
 * sides are exact rationals over integers, so the comparison carries no rounding anywhere — and a
 * credit that IS the product is reported as landing on the product, which is the true statement.
 * (Computing MODEL 2 as decimal stake × decimal(served multiplier) gives the identical
 * 1,341 / 1,316 / 150, so the result does not turn on which decimal form of the multiplier is used.)
 *
 * The band, not the served `multiplier` field, is the input: that keeps the measurement
 * anti-circular and makes the "exact rational" explicit rather than reconstructed from a double.
 */
export function creditResidualSign(credit: number | string, stake: number | string, p: DiceParams): -1 | 0 | 1 {
  const bps = payoutBasisPoints(p);
  if (bps <= 0) return 0;
  const [cn, cd] = decimalFraction(credit);
  const [sn, sd] = decimalFraction(stake);
  // compare cn/cd against (sn/sd)·(PAYOUT_NUMERATOR/bps)
  const num = BigInt(PAYOUT_NUMERATOR);
  const lhs = cn * sd * BigInt(bps);
  const rhs = sn * cd * num;
  return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}

/** Exact residual (settled credit − stake × multiplier) as a double, from the same exact rational. */
export function creditResidual(credit: number | string, stake: number | string, p: DiceParams): number {
  const bps = payoutBasisPoints(p);
  if (bps <= 0) return 0;
  const [cn, cd] = decimalFraction(credit);
  const [sn, sd] = decimalFraction(stake);
  const num = BigInt(PAYOUT_NUMERATOR);
  // (cn/cd) − (sn·num)/(sd·bps)  =  (cn·sd·bps − sn·num·cd) / (cd·sd·bps)
  const rn = cn * sd * BigInt(bps) - sn * num * cd;
  const rd = cd * sd * BigInt(bps);
  return Number(rn) / Number(rd);
}

/**
 * Exact value of a DECIMAL literal as a rational [numerator, denominator].
 *
 * `String(x)` is the shortest decimal that round-trips to this binary64, which for every money field
 * in this capture is the decimal the operator wrote (`0.1`, `19.8`, `0.10717766`). That decimal — not
 * the binary64 that approximates it — is what the operator's ledger holds. A string input is taken
 * verbatim, so a capture that preserves the raw JSON text needs no round-trip at all.
 */
function decimalFraction(x: number | string): [bigint, bigint] {
  const s = typeof x === 'string' ? x.trim() : String(x);
  const m = /^(-?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
  if (!m) throw new Error(`decimalFraction: not a decimal literal: ${s}`);
  const sign = m[1] === '-' ? -1n : 1n;
  const intPart = m[2] || '0';
  const fracPart = m[3] || '';
  const exp = m[4] ? Number(m[4]) : 0;
  let n = sign * BigInt(intPart + fracPart);
  let d = 10n ** BigInt(fracPart.length);
  if (exp > 0) n *= 10n ** BigInt(exp);
  else if (exp < 0) d *= 10n ** BigInt(-exp);
  return [n, d];
}

/** The credit in exact integer 1e-8 units — the form with no rounding ambiguity at all. */
export function settledCreditUnits(stake: number, multiplier: number): bigint {
  const stakeUnits = BigInt(Math.round(stake * 1e8));
  const multUnits = BigInt(Math.round(multiplier * 1e8));   // stage 1: ROUND_8(multiplier)
  const product = stakeUnits * multUnits;                   // in 1e-16 units
  let q = product / UNITS_PER_WHOLE;
  const r = product % UNITS_PER_WHOLE;
  if (r > HALF_UNIT) q += 1n;
  else if (r === HALF_UNIT && (q % 2n) === 1n) q += 1n;     // exact tie → round to even
  return q;
}

export function settledCredit(stake: number, multiplier: number): number {
  const units = settledCreditUnits(stake, multiplier);
  // Above 2^53 − 1 units (about $90,071,992 credited) the BigInt no longer converts to a double
  // without loss, and a silently wrong credit is precisely the failure class this function was
  // rewritten to remove. The operator's own limits reach there in principle (max bet 9,898 at
  // 9900x is about $98M), so refuse rather than round: callers that need the extreme should use
  // settledCreditUnits, which stays exact. Unreachable in this capture — the largest CAPTURED
  // credit is $19.80 (1.98e9 units), the Phase-C $10 × 1.98 bets — but a guard nobody can trip is
  // cheaper than a defect nobody sees. (Note $990.00 is NOT a captured credit: it is E14's UI
  // "Payout On Win" display for a 9900× probe bet that LOST, so nothing was credited.)
  if (units > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`settledCredit: ${units} units exceeds exact double range — use settledCreditUnits`);
  }
  return Number(units) / 1e8;
}

/**
 * True when this (stake, multiplier) lands on an EXACT 8-dp half-way point — the case where the
 * rounding MODE decides the last unit, and the case a floating-point implementation cannot detect
 * above ~9e9 units.
 */
export function isSettlementTie(stake: number, multiplier: number): boolean {
  const product = BigInt(Math.round(stake * 1e8)) * BigInt(Math.round(multiplier * 1e8));
  return product % UNITS_PER_WHOLE === HALF_UNIT;
}

/** Mode label for a band, for reporting/aggregation. */
export function bandMode(p: DiceParams): 'under' | 'over' | 'inside' | 'outside' {
  if (p.inverted) return 'outside';
  if (p.lower === 0) return 'under';
  if (p.upper === 100) return 'over';
  return 'inside';
}
