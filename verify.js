/**
 * STANDALONE VERIFIER — generated, do not edit.
 *
 *     node verify.js
 *
 * Runs the full scored verification with no `npm install`: this file contains the package's own
 * compiled verification code and reaches nothing outside Node's built-in modules. It reads the
 * committed artifacts from their normal locations and, exactly like `npm run verify`, writes only
 * under `outputs/run/` (PF_EMIT=1 still being the sole thing that rewrites a committed artifact).
 *
 * It is a BUILD PRODUCT of `tests/verify.ts` and the sources it imports — not a second implementation.
 * Rebuild with `audit-framework/tools/build-standalone-verifier.mjs <package>`;
 * `check-standalone.sh` fails the gate if this file and the TypeScript have drifted apart.
 *
 * Source entry : tests/verify.ts
 * Linked modules: 29
 */
'use strict';

var __PF_ROOT__ = __dirname;
var __nodeRequire = require;
var __modules = {
  "src/bias.js": function (module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawBiasBound = drawBiasBound;
/**
 * The audit's draw-bias bound for LIQD Dice (DICE-08, scored in Step 5).
 *
 * OUR audit helper, not part of the RNG: moved here from src/rng.ts on 20 Oct 2026 when src/rng.ts
 * was replaced by the module rebuilt from docs/ALGORITHM.md. It reads the rebuilt module's own
 * `maxFairFor`, so the bound describes the window the live draw (`generateProvablyFairNumber`)
 * applies, and nothing here re-implements the draw.
 */
const rng_1 = require("./rng");
const config_1 = require("./config");
/**
 * THE DRAW BIAS BOUND, COMPUTED FROM THE SAME NUMBERS THE DRAW USES.
 *
 * Every other RNG step proves the draw REPRODUCES — that the roll recorded is the roll the declared
 * algorithm computes from the revealed seed. None of them asks whether that algorithm draws the
 * 10,000 lattice points EQUALLY. If the accepted window `[0, maxFair)` did not hold a WHOLE number
 * of ranges, the low residues would be over-represented, and every one of the exact
 * recomputations in Step 5 would be an exact recomputation of a BIASED draw — Step 5 recomputes the
 * roll against the same helper, so it cannot see the bias on its own.
 *
 * This recomputes the bound from `RANGE` and the SAME `maxFairFor(RANGE)` the draw applies, so the
 * numbers a step prints describe the code that produced the rolls, not a claim typed beside it.
 * Because `maxFairFor(range) = floor(2^32/range) × range` is by construction a whole multiple of
 * `range`, the accepted window divides exactly: every residue 0..range−1 is produced by exactly
 * `maxFair / range` of the accepted uint32 values, its conditional probability given acceptance is
 * exactly 1/range and the worst-case bias is 0 — well inside the profile's 2^-32 ceiling. The
 * rejection census (how many of the 2^32 chunk values fall in the discarded tail `[maxFair, 2^32)`)
 * is returned too, as the profile asks when rejection sampling is the mechanism.
 *
 * NOTE this is an ARITHMETIC property of the audit module's constants — it holds for
 * every possible seed, not only the captured ones. It does NOT exercise the operator-side reject
 * branch, which no captured bet's first chunk reached (declared limitation L11, unchanged).
 *
 * Returned as numbers, never as a sentence: the profile's floor is 2^-32 and a reader has to be able
 * to compare the two.
 */
function drawBiasBound() {
    const range = config_1.RANGE;
    const domainSize = 4294967296; // 2^32 possible uint32 chunk values (0 .. 2^32−1)
    const maxFair = (0, rng_1.maxFairFor)(range); // the SAME bound the live draw applies
    const rangesAccepted = Math.floor(maxFair / range);
    const remainder = maxFair % range; // 0 ⇒ the accepted window holds a whole number of ranges
    // Residue counts across the ACCEPTED window [0, maxFair): a value v is accepted iff v < maxFair,
    // and each residue r is produced by floor((maxFair − 1 − r) / range) + 1 accepted values.
    const minResidueCount = Math.floor(maxFair / range);
    const maxResidueCount = remainder === 0 ? minResidueCount : minResidueCount + 1;
    // Bias = the largest gap between any residue's share of the accepted window and the ideal 1/range.
    const bias = Math.max(maxResidueCount / maxFair - 1 / range, 1 / range - minResidueCount / maxFair);
    const rejectedDrawsPerChunk = domainSize - maxFair; // values in the discarded tail [maxFair, 2^32)
    return {
        algorithm: 'uint32-rejection-mod-range',
        range,
        domainSize,
        maxFair,
        rangesAccepted,
        remainder,
        wholeNumberOfRanges: remainder === 0,
        minResidueCount,
        maxResidueCount,
        bias,
        exact: remainder === 0,
        rejectionSampling: true,
        rejectedDrawsPerChunk,
        rejectionProbabilityPerChunk: rejectedDrawsPerChunk / domainSize,
    };
}

  },
  "src/config.js": function (module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIM_RTP_STRATEGY = exports.SIM_EDGE_BANDS = exports.SIM_MASTER_SEED = exports.SIMULATION_HTML_SHA256 = exports.SIMULATION_SHA256 = exports.SIM_PASS2_ALPHA = exports.E20_PROBES = exports.E20_SHA256 = exports.E20_FILE = exports.E17_PROBES = exports.E17_SHA256 = exports.E17_FILE = exports.PHASE_A_MIN_BETS_PER_CLASS = exports.PHASE_D_MIN_DISTINCT_SEEDS = exports.PHASE_C_MIN_WINS = exports.PHASE_C_MIN_BETS = exports.EXPECTED_WIN_CHANCES = exports.ELEVATED_STAKE = exports.BASE_STAKE = exports.EXPECTED_PHASE_BETS = exports.EXPECTED_CAPTURES = exports.EXPECTED_BETS = exports.EXPECTED_SEEDS = exports.EXPECTED_EPOCHS = exports.EXPECTED_PHASES = exports.EXPECTED_STEPS = exports.VERDICT_QUALIFIER = exports.AUDIT_ID = exports.DATASET_FILE = exports.DATASET_SHA256 = exports.ALPHA_SCREEN = exports.ALPHA_SCREENS = exports.ALPHA = exports.SIM_PASS2_NONCES = exports.SIM_CHERRY_SEED_ALPHA = exports.SIM_CHERRY_WINDOW = exports.SIM_CHERRY_BINS = exports.SIM_TARGET_MARKS = exports.SIM_TARGET_BETS = exports.SIM_RTP_MARKS = exports.SIM_RTP_BETS = exports.SIM_EDGE_BETS = exports.SIM_SERIAL_DRAWS = exports.SIM_UNIFORMITY_DRAWS = exports.PRICE_GRID_MAX_BPS = exports.PRICE_GRID_MIN_BPS = exports.HOUSE_EDGE = exports.SCALE = exports.CURSOR = exports.RANGE = void 0;
exports.PAYOUT_NUMERATOR = exports.SIM_TARGET_SEEDS_EACH = exports.SIM_TARGET_SEED_COUNTER_BASE = exports.SIM_TARGETS = void 0;
exports.expectedEpochSize = expectedEpochSize;
exports.bandKey = bandKey;
exports.continuousWinChancePct = continuousWinChancePct;
exports.payoutBasisPoints = payoutBasisPoints;
exports.quotedMultiplier = quotedMultiplier;
exports.discreteWinCount = discreteWinCount;
exports.discreteWinProbability = discreteWinProbability;
exports.diceWin = diceWin;
exports.diceWinInclusive = diceWinInclusive;
exports.effectiveEdge = effectiveEdge;
exports.effectiveEdgeIsExact = effectiveEdgeIsExact;
exports.theoreticalRTP = theoreticalRTP;
exports.servedReturnSign = servedReturnSign;
exports.servedRollMatches = servedRollMatches;
exports.creditResidualSign = creditResidualSign;
exports.creditResidual = creditResidual;
exports.floor8CreditUnits = floor8CreditUnits;
exports.floor8CreditUnitsServed = floor8CreditUnitsServed;
exports.amountUnits = amountUnits;
exports.bandMode = bandMode;
/**
 * LIQD Dice game math. The roll is a single bias-free draw on a discrete integer grid
 * (0..9999 → /100 → a value in [0.00, 99.99]). A bet defines a band { lower, upper,
 * inverted }; the win rule is HALF-OPEN: lower inclusive, upper EXCLUSIVE
 * (win iff roll >= lower && roll < upper; inverted takes the exact complement).
 *
 * WHERE THE BOUNDARY RULE COMES FROM. No settled round of the production capture has its roll on a
 * band bound (Step 15 prints the count), so the settled data cannot tell a half-open band from one
 * that is inclusive on both ends. The rule is witnessed on LIQD's production verify endpoint
 * (POST https://liqd.com/api/v1/originals/dice/verify, 9 November 2026, logged out): 22 probes built
 * from revealed production seeds whose roll equals a band bound, or misses it by 0.01, in all four
 * modes (evidence/E17-prod-verify-boundary-probes-2026-11-09.json; Step 15 re-derives every probe).
 * Under the half-open rule every mode's winning region holds exactly 100·W grid points, so the
 * effective edge is exactly 1.00% on every bet. That SETTLEMENT applies the same rule on a roll that
 * lands on a bound is not witnessed by any settled round (limitation L2).
 *
 * There is no external multiplier table: the payout multiplier is a closed-form function
 * of the band's win chance, derived here and cross-checked against every captured win.
 *
 * LIMITS. No odds or bet-limit configuration is served in the production dice replies, and none was
 * read from the site. What is audited is what was played: win chances 1% to 98% (99× down to
 * 9900/9800 = 1.0102…×) and one round at 0.01% (9900×, Phase X), whose pricing LIQD's verifier also
 * returns (evidence E20). The price grid the model covers is every band width that has a win chance
 * and a multiplier above 1× (PRICE_GRID_MIN_BPS … PRICE_GRID_MAX_BPS); which of the widths between
 * 0.02% and 0.99% and above 98% production accepts was not measured (limitation L7).
 */
exports.RANGE = 10000; // integer draw domain 0..9999
exports.CURSOR = 0; // fixed HMAC cursor for the single dice draw
exports.SCALE = 100; // roll = draw / 100  → 2 decimals, ceiling 99.99
exports.HOUSE_EDGE = 0.01;
/**
 * The price grid in basis points of win chance (1 bp = 0.01 %): every band width with a win chance
 * whose multiplier 9900/bp is above 1×, i.e. bp 1 … 9899. A mathematical universe, not an operator
 * limit: the RTP-CLAIM table and the monotonicity step sweep all of it; the capture played 100 … 9800.
 */
exports.PRICE_GRID_MIN_BPS = 1;
exports.PRICE_GRID_MAX_BPS = 9899;
// Simulation sample depths — exported so the verify step (Steps 16–17) can recompute the
// edge-band and serial predicates at the SAME n the artifact was produced with, rather than
// trusting the artifact's stored `n`. NOTE the serial (lag-1 / runs)
// analysis runs on SIM_SERIAL_DRAWS, a 200,000-roll prefix of the SIM_UNIFORMITY_DRAWS sample —
// the uniformity histogram uses all 2,000,000; the serial screen uses the first 200,000.
exports.SIM_UNIFORMITY_DRAWS = 2000000;
exports.SIM_SERIAL_DRAWS = 200000;
exports.SIM_EDGE_BETS = 2000000;
/** RTP-convergence depth. Exported so Step 16 can require the series to END there. */
exports.SIM_RTP_BETS = 20000000;
/** The sample sizes the convergence series must contain, in order. */
exports.SIM_RTP_MARKS = [1000, 10000, 100000, 1000000, 5000000, 10000000, exports.SIM_RTP_BETS];
/**
 * EDGE CONVERGENCE ON 98 TARGETS (DICE-20): 98 targets × 1,000,000 bets each, "roll over
 * 2.00 … over 99.00"; on LIQD these are the over-mode bands [X, 100) for X = 2, 3, …, 99
 * (win chance 98% … 1%, 1.0102× … 99×: the span of win chances the production capture played). Each target
 * is scored within 5·SE + 1e-4 of its theoretical RTP, and the MEAN simulated RTP over the 98 targets
 * at each of SIM_TARGET_MARKS is the convergence series the chart draws.
 *
 * Everything above runs first, on the same seeds: the targets are
 * APPENDED, after the nine bands, on the continuation of the same pinned seed stream (see
 * SIM_TARGET_SEED_COUNTER_BASE).
 */
exports.SIM_TARGET_BETS = 1000000;
/** Per-target sample sizes at which the cross-target mean RTP is recorded, in order; the last is SIM_TARGET_BETS. */
exports.SIM_TARGET_MARKS = [10000, 50000, 100000, 500000, exports.SIM_TARGET_BETS];
/** Pass-2 cherry-pick screen geometry: one window is SIM_CHERRY_WINDOW draws over SIM_CHERRY_BINS bins. */
exports.SIM_CHERRY_BINS = 20;
exports.SIM_CHERRY_WINDOW = 50;
/** Nominal per-window screening threshold. The ACHIEVED rate is derived in src/exact-chi2.ts. */
exports.SIM_CHERRY_SEED_ALPHA = 0.05;
/**
 * PASS-2 SERVED-BAND RETURN SCAN (DICE-21): the load-bearing cherry-pick realization (the
 * ProvablyFair.org standard dice realization).
 *
 * Every revealed casino server seed is replayed for SIM_PASS2_NONCES nonces. The EARLY window is the
 * captured nonce range of that epoch (0..size−1, the nonces the operator actually served under that
 * seed; the size is the epoch's planned size in EXPECTED_EPOCHS, which differs by phase); the
 * REFERENCE window is the remainder. The statistic is the payout-weighted RETURN of the bands the
 * casino actually served: a cherry-picking operator biases the PLAYER'S return, which the
 * draw-uniformity screen above (SIM_CHERRY_*) is blind to.
 *
 * WHAT IS EXACT, AND WHAT IS ASYMPTOTIC, stated precisely so the prose never overstates it. Each
 * served band contributes an INDEPENDENT scaled Bernoulli per nonce: it pays its multiplier `mult`
 * with the band's EXACT lattice win-probability `pᵢ = discreteWinProbability(band)` (the winning
 * grid points over RANGE, an exact rational), else 0. The aggregate early return is therefore a sum
 * of independent scaled Bernoullis across all served (seed, nonce) cells, a SCALED POISSON-BINOMIAL,
 * whose MEAN (Σ pᵢ·multᵢ) and VARIANCE (Σ pᵢ(1−pᵢ)·multᵢ²) are EXACT by linearity, regardless of
 * the multiplier heterogeneity this capture carries. Those exact per-bet moments are what standardise
 * the statistic. The TAIL is then the one-sided normal (CLT) lower tail of that aggregate (one term
 * per captured round). This is EXACT MOMENTS + an ASYMPTOTIC (CLT) TAIL, NOT an exact-lattice CDF:
 * the exact distribution of the aggregate return is a convolution of heterogeneous scaled Binomials
 * (most epochs of this capture carry several distinct multipliers), which is not computed here. See
 * the MANIFEST.md load-bearing-premise row and L4. The one-sided lower-tail rule is fixed in code and
 * predates the production capture (it was fixed in September 2026): cherry-picking SHORTS the early
 * window the player saw, so the step rejects on aggP < α. Its detection power is printed by Step 17;
 * a smaller selection effect passes it.
 *
 * SIM_PASS2_ALPHA is declared below ALPHA so the significance level stays single-sourced.
 */
exports.SIM_PASS2_NONCES = 10000;
/**
 * The single significance level of the audit's statistics — Pass-1 uniformity, the serial screen,
 * the Pass-2 served-band return and cherry-pick flag-count test all use it, and so does the pooled
 * real-roll uniformity, which is informational (reported, not scored, since 2026-09-29).
 * Single-sourced here. Declared once in `src/simulate.ts` and again in
 * `tests/steps/simulation.ts`, it is exactly what lets the two sides of the cherry-pick null
 * drift apart.
 */
exports.ALPHA = 0.01;
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
exports.ALPHA_SCREENS = 3;
exports.ALPHA_SCREEN = exports.ALPHA / exports.ALPHA_SCREENS;
/**
 * SHA-256 of the pinned capture. Single-sourced here so the producer (`src/simulate.ts`) and the
 * verifier (`tests/verify.ts`) cannot pin different datasets.
 */
exports.DATASET_SHA256 = '41ea55fcadd903768be3a92725f2100fe2e794ab300d6842ce946124ea7d5042';
/** The scored dataset's path, single-sourced for the verifier, the producer and the release manifest. */
exports.DATASET_FILE = 'data/dice-prod-5936bets.json';
/**
 * ProvablyFair.org audit identifier. Single-sourced here so the emitted
 * `outputs/verification-results.json` carries the same ID the report chapters print (README.md,
 * MANIFEST.md), and DICE-28's "the audit ID is assigned" is machine-checkable rather than prose
 * only. `LQ` = LIQD; `04` = the fourth LIQD audit (blackjack, mines, plinko preceded it).
 *
 * The qualifier names the environment the SCORED dataset was captured on: `production`. Every scored
 * round was placed on `liqd.com` between 7 and 10 November 2026.
 */
exports.AUDIT_ID = 'PF-2026-LQ04';
exports.VERDICT_QUALIFIER = 'production';
/**
 * The number of numbered steps a complete run executes (21 scored + the informational Step 22).
 * tests/verify.ts compares the executed step count and numbering against it before any verdict is
 * printed, so a run that stopped early cannot present its partial list as the whole suite (G-EXEC).
 */
exports.EXPECTED_STEPS = 22;
const PLAN_WIN_CHANCES = [2, 5, 10, 20, 35, 50, 65, 80, 90, 98];
exports.EXPECTED_PHASES = [
    { id: 'A', phase: 'A', capture: 0, epochSizes: Array.from({ length: 25 }, () => 200), stake: '0.10000000', playerSeeds: false, winChances: PLAN_WIN_CHANCES },
    { id: 'D', phase: 'D', capture: 1, epochSizes: [100, 100, 100, 100, 100], stake: '0.10000000', playerSeeds: true, winChances: PLAN_WIN_CHANCES },
    { id: 'A+', phase: 'A', capture: 1, epochSizes: [200], stake: '0.10000000', playerSeeds: false, winChances: [1] },
    { id: 'C', phase: 'C', capture: 2, epochSizes: [118, 117], stake: '10.00000000', playerSeeds: false, winChances: [50] },
    { id: 'X', phase: 'X', capture: 3, epochSizes: [1], stake: '0.10000000', playerSeeds: false, winChances: [0.01] },
];
exports.EXPECTED_EPOCHS = exports.EXPECTED_PHASES.flatMap((ph) => ph.epochSizes.map((bets) => ({ phaseId: ph.id, phase: ph.phase, capture: ph.capture, bets, stake: ph.stake, playerSeeds: ph.playerSeeds }))).map((e, epoch) => ({ epoch, ...e }));
exports.EXPECTED_SEEDS = exports.EXPECTED_EPOCHS.length; // 34
exports.EXPECTED_BETS = exports.EXPECTED_EPOCHS.reduce((a, e) => a + e.bets, 0); // 5,936
exports.EXPECTED_CAPTURES = new Set(exports.EXPECTED_PHASES.map((ph) => ph.capture)).size; // 4
/** Rounds per phase id. The plan, in code, not `meta.phases`, which is inside the evidence. */
exports.EXPECTED_PHASE_BETS = Object.fromEntries(exports.EXPECTED_PHASES.map((ph) => [ph.id, ph.epochSizes.reduce((a, n) => a + n, 0)]));
/** The base stake (phases A, A+, D and X) and the elevated stake (Phase C), as served. */
exports.BASE_STAKE = '0.10000000';
exports.ELEVATED_STAKE = '10.00000000';
/** Every win chance (percent) the plan plays, ascending: Phase X's 0.01%, the A+ top-up's 1% and Phase A's ten. */
exports.EXPECTED_WIN_CHANCES = [...new Set(exports.EXPECTED_PHASES.flatMap((ph) => ph.winChances))].sort((a, z) => a - z);
/** The audited size of one epoch (throws on an epoch outside the plan). */
function expectedEpochSize(epoch) {
    const e = exports.EXPECTED_EPOCHS[epoch];
    if (!e || e.epoch !== epoch)
        throw new Error(`expectedEpochSize: epoch ${epoch} is not in the plan`);
    return e.bets;
}
/** Profile floors the plan was sized for (DICE-12, DICE-06, DICE-15), asserted by Steps 12, 14 and 18. */
exports.PHASE_C_MIN_BETS = 100;
exports.PHASE_C_MIN_WINS = 100;
exports.PHASE_D_MIN_DISTINCT_SEEDS = 2;
exports.PHASE_A_MIN_BETS_PER_CLASS = 50;
/**
 * The boundary-probe record (evidence E17): LIQD's production verify endpoint asked, on 9 November
 * 2026, for rolls that land exactly on a band bound. Pinned here; Step 15 re-derives every probe.
 * E17_PROBES is the number of answered records in the file (22 planned probes and one re-sent
 * verify call of the capture itself).
 */
exports.E17_FILE = 'evidence/E17-prod-verify-boundary-probes-2026-11-09.json';
exports.E17_SHA256 = '3cf8d772f60f62793579db7f0041ef81e77aff490b95e03717fd96c23f82de98';
exports.E17_PROBES = 23;
/**
 * The 9900x probe record (evidence E20): LIQD's production verify endpoint asked, on 10 November 2026, for 0.01 % bands (one
 * basis point) placed on, just below and just above four known rolls. Pinned here; Step 15 re-derives every probe with E17's.
 */
exports.E20_FILE = 'evidence/E20-prod-verify-9900x-probes-2026-11-10.json';
exports.E20_SHA256 = '78e57a33211b1d0ad4ce97fa1426c2c6e3db9bed8c04c60503b1d731d799c9b2';
exports.E20_PROBES = 10;
/**
 * Pass-2 served-band return scan (DICE-21): the level IS the suite's single ALPHA, single-sourced
 * here so the producer (src/simulate.ts) and the verifier (tests/steps/simulation.ts) cannot drift.
 * The early window of an epoch is expectedEpochSize(epoch).
 */
exports.SIM_PASS2_ALPHA = exports.ALPHA; // the suite's single significance level (0.01)
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
exports.SIMULATION_SHA256 = 'c6698388eb242683180135e687ec1f2074596eb87a19390dfe35176371913308';
exports.SIMULATION_HTML_SHA256 = '6b7b6bb7c474a49b48effbd31dd69ca952e4af5ee451902dbaff4a745743e02c';
/**
 * The auditor's pinned entropy source for the Pass-1 simulation (DICE-20). Every "fresh" seed the
 * Pass-1 experiment uses is `HMAC-SHA256(SIM_MASTER_SEED, counter)[0..16]`, consumed in a fixed
 * order, so the experiment is DETERMINISTIC and byte-for-byte replayable while remaining independent
 * of the casino's captured server seeds. This is an auditor construction, not an operator field. Its
 * only requirement is to be fixed and disclosed; the value is arbitrary auditor entropy chosen once.
 */
exports.SIM_MASTER_SEED = 'a11d17e5c0ffee5ea1ed0c5b1b7ea5e5d1ce5eed5a1710add1ce5eed10addba5';
/**
 * The canonical effective-edge band list. `src/simulate.ts` simulates exactly these and Step 16
 * requires the artifact's nine rows to BE these bands — distinct, all present. A step that
 * checked only `length === 9` would pass nine copies of the easiest band.
 */
exports.SIM_EDGE_BANDS = [
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
exports.SIM_RTP_STRATEGY = { lower: 0, upper: 50, inverted: false };
/**
 * The 98 edge-convergence targets: `over X` for X = 2 … 99, i.e. the band [X, 100). The order is
 * the artifact's row order and the order in which they consume seeds. Step 16 requires the
 * artifact's target rows to BE these bands, in this order.
 */
exports.SIM_TARGETS = Array.from({ length: 98 }, (_, i) => ({ label: `over ${i + 2}.00`, params: { lower: i + 2, upper: 100, inverted: false } }));
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
 * randSeed()` every 50 bets (nonce = bet index mod 50). Target t (0-based,
 * `over (t+2).00`) therefore uses counters SIM_TARGET_SEED_COUNTER_BASE + t·SIM_TARGET_SEEDS_EACH …
 * + SIM_TARGET_SEEDS_EACH − 1: its client seed at +1 and its server seeds at +2 … +20,001. No seed
 * was chosen, searched or re-rolled: the counters are fixed by this arithmetic on the pinned depths,
 * and Step 16 re-derives each target's first counter, client seed and first server seed from it.
 */
exports.SIM_TARGET_SEED_COUNTER_BASE = (2 + exports.SIM_UNIFORMITY_DRAWS / 50) + (2 + exports.SIM_RTP_BETS / 50) + exports.SIM_EDGE_BANDS.length * (2 + exports.SIM_EDGE_BETS / 50);
exports.SIM_TARGET_SEEDS_EACH = 2 + exports.SIM_TARGET_BETS / 50;
/** Stable key for a band, for set-identity comparisons. */
function bandKey(p) {
    return `${p.lower}|${p.upper}|${p.inverted ? 1 : 0}`;
}
/** Continuous win chance in PERCENT for a band, as the operator prices it. */
function continuousWinChancePct(p) {
    const width = p.upper - p.lower;
    return p.inverted ? 100 - width : width;
}
/**
 * PAYOUT_NUMERATOR / basisPoints is the exact quotient the operator serves as `multiplier`.
 *
 * `basisPoints` is the AUDITOR'S construction, not an operator field: the capture contains no
 * `basisPoints` anywhere, and this is `Math.round(winChance% × 100)`, the win chance re-expressed in
 * hundredths of a percent. The evidence for the form is Step 7: the served `multiplier` equals
 * `9900/basisPoints` bit-for-bit on every captured win, while the float closed form
 * `(100/wc)·(1−edge)` matches only some of them (Step 7 prints both counts). So the quotient, not the
 * closed form, is what the server computes.
 */
exports.PAYOUT_NUMERATOR = (1 - exports.HOUSE_EDGE) * 10000; // exactly 9900 at a 1% edge
function payoutBasisPoints(p) {
    return Math.round(continuousWinChancePct(p) * 100);
}
/**
 * The quoted multiplier as a float closed form:
 *   mult = (100 / winChance%) · (1 − edge) = 99 / winChance%
 * It is used for return and edge arithmetic (Steps 15-17, 21). It is NOT what the credit is settled
 * with: the credit is floor8(stake × 9900/basisPoints) on exact rationals (floor8CreditUnits).
 *
 * PRECISION, stated rather than glossed. This closed form and the served quotient
 * `PAYOUT_NUMERATOR/basisPoints` are equal as RATIONALS but NOT always as binary64 (Step 7 prints on
 * how many captured wins they agree bit-for-bit). The report must therefore not call
 * `9900/basisPoints == 99/continuousWinChance%` "bit-exact": it is an exact identity over the
 * rationals and can differ in the last bits in floating point. Step 7 pins the served field against
 * the QUOTIENT with `===`.
 *
 * Because the payout is priced on the CONTINUOUS win chance and the half-open band wins
 * on exactly 100·W grid points, the edge is exactly 1.00% for every band: nominal and
 * realised agree (see effectiveEdge below).
 */
function quotedMultiplier(p) {
    const wc = continuousWinChancePct(p);
    return wc > 0 ? (100 / wc) * (1 - exports.HOUSE_EDGE) : 0;
}
/**
 * Number of integer roll outcomes (draw ∈ 0..9999, roll = draw/100) that WIN the band.
 * ANTI-CIRCULAR: pure arithmetic over the roll grid, never operator data. The band is
 * HALF-OPEN: roll ∈ [lower, upper) ⇔ draw ∈ [lower·100, upper·100 − 1], which is
 * upper·100 − lower·100 = 100·W points exactly, in every mode (the rule witnessed by the production
 * verifier probes, evidence E17).
 *
 * The bounds are scaled with Math.round, NOT ceil/floor: every band bound in the game is
 * a 2-dp decimal, so lower·100 is an integer in exact arithmetic, but IEEE-754 puts many
 * of the products just off it (1.1·100 = 110.00000000000001, 0.57·100 = 56.99999999999999),
 * and ceil/floor then land one grid point away. The assertion
 * keeps the rounding honest: if a bound ever stops being a 2-dp decimal, this throws
 * rather than silently rounding a real fraction.
 */
function discreteWinCount(p) {
    const lo = Math.round(p.lower * exports.SCALE);
    const hi = Math.round(p.upper * exports.SCALE);
    if (Math.abs(p.lower * exports.SCALE - lo) > 1e-6 || Math.abs(p.upper * exports.SCALE - hi) > 1e-6) {
        throw new Error(`non-2dp band bound: ${JSON.stringify(p)}`);
    }
    // [lo, hi) clamped to the grid [0, RANGE)
    const inBand = Math.max(0, Math.min(exports.RANGE, hi) - Math.max(0, lo));
    return p.inverted ? exports.RANGE - inBand : inBand;
}
/** TRUE discrete win probability = winning outcomes / 10000. */
function discreteWinProbability(p) {
    return discreteWinCount(p) / exports.RANGE;
}
/**
 * Win rule applied to a served roll: HALF-OPEN band [lower, upper), honouring `inverted`.
 * roll == lower wins, roll == upper loses; inverted is the exact complement. The boundary cases are
 * witnessed on LIQD's production verifier (evidence E17, re-derived by Step 15).
 */
function diceWin(roll, p) {
    const inBand = roll >= p.lower && roll < p.upper;
    return p.inverted ? !inBand : inBand;
}
/** The same band read as INCLUSIVE on both ends: the alternative rule the boundary probes are tested against. */
function diceWinInclusive(roll, p) {
    const inBand = roll >= p.lower && roll <= p.upper;
    return p.inverted ? !inBand : inBand;
}
/**
 * EFFECTIVE house edge for a band, from the DISCRETE grid, the number a player actually
 * faces:  edge = 1 − P_discrete · quotedMultiplier.
 * Under the half-open rule the winning region holds exactly 100·W points, so
 * P_discrete = W/100 exactly and this evaluates to HOUSE_EDGE (1.00%) for every
 * band in every mode, computed rather than assumed, so a future rule change would show.
 */
function effectiveEdge(p) {
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
 * WHY NOT A TOLERANCE. `continuousWinChancePct` computes `upper − lower` in binary64, so an
 * `over 99.99` band gives `100 − 99.99 = 0.010000000000005116`, a float multiplier of
 * 9899.999999994936 and an edge departure of 5.063813951489138e-13: a tolerance sized on the float
 * noise of the captured bands would sit within a factor of two of the noise at that band. In
 * integers there is no noise and no threshold (swept over every 2-dp band of the four families in
 * tests/dice/settlementTests.ts).
 */
function effectiveEdgeIsExact(p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        return false;
    if (!Number.isInteger(exports.PAYOUT_NUMERATOR))
        return false; // the identity is only integral at an edge where it is
    return 100 * discreteWinCount(p) * exports.PAYOUT_NUMERATOR === (exports.PAYOUT_NUMERATOR / 100) * exports.RANGE * bps;
}
/** Theoretical RTP for a band = P_discrete · quotedMultiplier = 1 − effectiveEdge. */
function theoreticalRTP(p) {
    return discreteWinProbability(p) * quotedMultiplier(p);
}
/**
 * Sign of (served-band return − its expectation) over a window of (band, won) cells, computed in
 * EXACT RATIONAL ARITHMETIC: −1 below expectation, 0 exactly on it, +1 above.
 *
 * WHY NOT COMPARE THE TWO FLOAT SUMS. Each cell's return is the multiplier 9900/basisPoints on a
 * win (else 0) and its expectation is winCount/RANGE × 9900/basisPoints, which is exactly 0.99 for
 * every band under the half-open rule. A window can therefore land EXACTLY on its expectation, and
 * the two binary64 accumulations then disagree in the last bits, so a float `<` would count an exact
 * tie as "below".
 *
 * Per cell, return − expectation = (9900 / (RANGE·bps)) · (won·RANGE − winCount). The positive
 * factor 9900/RANGE does not change the sign, so the sign is that of Σ (won·RANGE − winCount)/bps,
 * summed here as a BigInt fraction. Only the sign is used; z and p stay the float statistic.
 */
function servedReturnSign(cells) {
    let num = 0n, den = 1n;
    const gcd = (a, b) => { a = a < 0n ? -a : a; while (b) {
        [a, b] = [b, a % b];
    } return a; };
    for (const { band, won } of cells) {
        const bps = BigInt(payoutBasisPoints(band));
        if (bps <= 0n)
            throw new Error(`servedReturnSign: band with no win chance: ${JSON.stringify(band)}`);
        const term = (won ? BigInt(exports.RANGE) : 0n) - BigInt(discreteWinCount(band));
        num = num * bps + term * den;
        den = den * bps;
        const g = gcd(num, den);
        if (g > 1n) {
            num /= g;
            den /= g;
        }
    }
    return num < 0n ? -1 : num > 0n ? 1 : 0;
}
/**
 * Does a SERVED roll equal a RECOMPUTED one? The single definition, imported by Steps 4, 5, 6, 13,
 * 14 and 18: one predicate, six readers.
 *
 * EXACT, deliberately. Every roll is draw/100 for an integer draw
 * in [0, 10000), so a served roll that is genuinely the operator's outcome is the nearest binary64
 * to a 2-dp decimal, and the recomputed value is the nearest binary64 to the SAME decimal: they
 * are bit-identical (Step 5 checks it on every captured roll). Allowing |local − served| up
 * to 1e-9 is seven orders of magnitude wider than the 0.01 grid spacing: it could not admit a
 * wrong outcome, but it does admit a served value that is not on the grid at all (24.010000001), and
 * a tolerance nobody needs is a tolerance nobody audits. The finiteness guards stay: a non-numeric
 * served roll must be rejected explicitly, not silently by a false comparison.
 */
function servedRollMatches(served, recomputed) {
    if (!Number.isFinite(served) || !Number.isFinite(recomputed))
        return false;
    const units = Math.round(served * exports.SCALE);
    if (units / exports.SCALE !== served)
        return false; // served value is not on the 2-dp grid
    if (units < 0 || units >= exports.RANGE)
        return false; // outside the roll domain
    return served === recomputed;
}
const UNITS_PER_WHOLE = 100000000n; // 1e8, the settlement grid
/**
 * Sign of (settled credit − stake × multiplier), computed EXACTLY: −1 if the settlement rounded
 * the player down, +1 if up, 0 if it landed exactly on the product.
 *
 * A claim about how the OPERATOR rounds must be computed in the OPERATOR'S OWN NUMBER SYSTEM,
 * decimal, never in the auditor's binary64 representation of it. Taking the exact rational value of
 * binary64(0.1) (0.1000000000000000055511151231257827…) into the comparison would report a rounding
 * direction for every single win, including the ones where nothing was rounded: 10.00 × 1.98 is
 * exactly 19.80, and 0.10 × 9900/5000 is exactly 0.198.
 *
 * So both sides are exact rationals over integers: the stake through its decimal text (the 8-dp
 * string LIQD serves), the multiplier as 9900/basisPoints from the band (see payoutBasisPoints). The
 * band, not the served `multiplier` field, is the input: that keeps the measurement anti-circular.
 * A credit that IS the product is reported as landing on the product.
 */
function creditResidualSign(credit, stake, p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        return 0;
    const [cn, cd] = decimalFraction(credit);
    const [sn, sd] = decimalFraction(stake);
    // compare cn/cd against (sn/sd)·(PAYOUT_NUMERATOR/bps)
    const num = BigInt(exports.PAYOUT_NUMERATOR);
    const lhs = cn * sd * BigInt(bps);
    const rhs = sn * cd * num;
    return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}
/** Exact residual (settled credit − stake × multiplier) as a double, from the same exact rational. */
function creditResidual(credit, stake, p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        return 0;
    const [cn, cd] = decimalFraction(credit);
    const [sn, sd] = decimalFraction(stake);
    const num = BigInt(exports.PAYOUT_NUMERATOR);
    // (cn/cd) − (sn·num)/(sd·bps)  =  (cn·sd·bps − sn·num·cd) / (cd·sd·bps)
    const rn = cn * sd * BigInt(bps) - sn * num * cd;
    const rd = cd * sd * BigInt(bps);
    return Number(rn) / Number(rd);
}
/**
 * Exact value of a DECIMAL literal as a rational [numerator, denominator].
 *
 * A string input is taken verbatim: the dataset keeps every money field as the 8-dp string LIQD
 * served, so no binary64 step sits between the served text and the comparison. For a number,
 * `String(x)` is the shortest decimal that round-trips to that binary64.
 */
function decimalFraction(x) {
    const s = typeof x === 'string' ? x.trim() : String(x);
    const m = /^(-?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m)
        throw new Error(`decimalFraction: not a decimal literal: ${s}`);
    const sign = m[1] === '-' ? -1n : 1n;
    const intPart = m[2] || '0';
    const fracPart = m[3] || '';
    const exp = m[4] ? Number(m[4]) : 0;
    let n = sign * BigInt(intPart + fracPart);
    let d = 10n ** BigInt(fracPart.length);
    if (exp > 0)
        n *= 10n ** BigInt(exp);
    else if (exp < 0)
        d *= 10n ** BigInt(-exp);
    return [n, d];
}
/**
 * THE SETTLEMENT RULE (scored by Steps 8, 10, 18 and 20).
 *
 *   credit = floor8( stake × 9900 / basisPoints )        computed exactly, on the decimal stake
 *
 * The exact product is rounded DOWN to the 1e-8 grid; a loss pays 0. Measured on the production
 * capture (data/dice-prod-5936bets.json): the rule reproduces the served winningAmount on every
 * win, at both stakes (Step 8 prints the counts), and it is the rule LIQD stated on 30 September
 * 2026 ("exact decimal maths and are then rounded down to 8 decimals"). A floor has no tie case and
 * no rounding mode to assume. What it means for the player: a credit is never above the exact
 * product and is below it by less than 0.00000001 USDT.
 *
 * Both inputs are exact rationals: the stake through its decimal text (the 8-dp string LIQD serves),
 * the multiplier as the integer quotient PAYOUT_NUMERATOR/basisPoints (Step 7 binds the served
 * multiplier to it bit-for-bit). `floor8CreditUnitsServed` applies the same floor to the served
 * multiplier's own decimal text, so Step 8 can score the served field and Step 20 the band,
 * independently.
 */
function floor8CreditUnits(stake, p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        throw new Error(`floor8CreditUnits: band with no win chance: ${JSON.stringify(p)}`);
    if (!Number.isInteger(exports.PAYOUT_NUMERATOR))
        throw new Error('floor8CreditUnits: PAYOUT_NUMERATOR is not an integer');
    const [sn, sd] = decimalFraction(stake);
    if (sn < 0n)
        throw new Error(`floor8CreditUnits: negative stake ${stake}`);
    // stake × PAYOUT_NUMERATOR / bps, in 1e-8 units, rounded down: floor(sn·N·1e8 / (sd·bps))
    return (sn * BigInt(exports.PAYOUT_NUMERATOR) * UNITS_PER_WHOLE) / (sd * BigInt(bps));
}
/** The same floor on the served multiplier's decimal text: floor8(stake × multiplier). */
function floor8CreditUnitsServed(stake, multiplier) {
    const [sn, sd] = decimalFraction(stake);
    const [mn, md] = decimalFraction(multiplier);
    if (sn < 0n || mn < 0n)
        throw new Error(`floor8CreditUnitsServed: negative input ${stake} × ${multiplier}`);
    return (sn * mn * UNITS_PER_WHOLE) / (sd * md);
}
/**
 * A served amount as exact 1e-8 units, or null if it is not on the 8-dp grid. Read from the decimal
 * text, so `"0.10102040"` is 10102040 units with no binary64 step in between.
 */
function amountUnits(x) {
    const [n, d] = decimalFraction(x);
    const scaled = n * UNITS_PER_WHOLE;
    return scaled % d === 0n ? scaled / d : null;
}
/** Mode label for a band, for reporting/aggregation. */
function bandMode(p) {
    if (p.inverted)
        return 'outside';
    if (p.lower === 0)
        return 'under';
    if (p.upper === 100)
        return 'over';
    return 'inside';
}

  },
  "src/diff.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Field-level diffs between a verification run and the committed artifacts it evaluated.
 *
 * ── WHY ─────────────────────────────────────────────────────────────────────────────────────────
 * A `npm run verify` that overwrote `outputs/verification-results.json` and
 * `outputs/report-figures.json` at the end of every run — including a FAILING run — would let a
 * run that disagreed with the committed evidence destroy the evidence of the disagreement, and
 * the next run would compare the repo against the file the failing run had just written, and
 * pass. That is not hypothetical: it was executed on Node 24 — fail, then pass,
 * with no trace of the first outcome.
 *
 * Verification therefore writes nothing into the committed paths. It writes this run's results — pass or
 * fail — under `outputs/run/`, together with a field-level diff against the committed artifact, so
 * the disagreement is recorded rather than resolved in favour of the newest run. Producing a
 * replacement for the committed artifacts is a separate, explicit command (`npm run report`).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.beyondTolerance = exports.DIFF_RTOL = exports.DIFF_ATOL = void 0;
exports.flattenLeaves = flattenLeaves;
exports.numbersAgree = numbersAgree;
exports.fieldDiff = fieldDiff;
exports.maxima = maxima;
/** Flatten a JSON value to `dotted.path` → leaf. Arrays index as `path[0]`. */
function flattenLeaves(value, prefix = '', out = new Map()) {
    if (value === null || typeof value !== 'object') {
        out.set(prefix, value);
        return out;
    }
    if (Array.isArray(value)) {
        if (value.length === 0)
            out.set(prefix, '<empty array>');
        value.forEach((v, i) => flattenLeaves(v, `${prefix}[${i}]`, out));
        return out;
    }
    const keys = Object.keys(value);
    if (keys.length === 0)
        out.set(prefix, '<empty object>');
    for (const k of keys)
        flattenLeaves(value[k], prefix ? `${prefix}.${k}` : k, out);
    return out;
}
/** The value as `JSON.stringify` would serialise it — `undefined` keys gone, dates as strings. */
const asWritten = (v) => JSON.parse(JSON.stringify(v ?? null));
/**
 * The reproduction tolerance.
 *
 * A pinned artifact asserts the identity of the committed EVIDENCE — its bytes and its SHA-256
 * are still the record, and `check-outputs` still re-asserts them. What this bound governs is a
 * different question: whether a RECOMPUTATION on another machine is the same result. It is not
 * the same question, because the last bits of a derived floating-point statistic are
 * environment-dependent: regenerated on a second machine, six p-values in this audit differ by
 * 1–12 units in the last place and everything else is byte-identical. Demanding byte identity of
 * derived statistics would make "reproduce it yourself" a claim no reader could ever satisfy,
 * and demanding nothing would let a genuinely different result pass as noise.
 *
 * The bound is 1e-14 absolute + 1e-12 relative — far below the precision of any figure this
 * audit publishes, and far above cross-runtime ULP drift.
 */
exports.DIFF_ATOL = 1e-14;
exports.DIFF_RTOL = 1e-12;
/**
 * Whether two numbers are the same result. Two DISTINCT integers never are: counts, populations,
 * epoch numbers and step numbers must match exactly, and this is the line that says so. Only an
 * integer PAIR is held to exact equality — an integer against a float is the cross-runtime case
 * (`0` on one machine, `5.55e-16` on another) and gets the tolerance, which is still tighter
 * than any distinct pair of integers could satisfy.
 */
function numbersAgree(a, b, atol = exports.DIFF_ATOL, rtol = exports.DIFF_RTOL) {
    if (Number.isNaN(a) || Number.isNaN(b))
        return Number.isNaN(a) && Number.isNaN(b);
    if (a === b)
        return true;
    if (!Number.isFinite(a) || !Number.isFinite(b))
        return false;
    if (Number.isInteger(a) && Number.isInteger(b))
        return false;
    return Math.abs(a - b) <= atol + rtol * Math.max(Math.abs(a), Math.abs(b));
}
/**
 * Every leaf on which `committed` and `thisRun` disagree, by path. `ignore` drops paths whose
 * dotted name matches exactly. verify passes an EMPTY list: the artifacts of record carry no run
 * metadata, so nothing differs by construction and nothing is excluded (F9).
 *
 * Numeric disagreements inside the tolerance are still REPORTED — the diff is a record of what
 * this run computed, and silently dropping them would hide drift that is creeping toward the
 * bound. They are marked `withinTolerance`, and it is `beyondTolerance()` below, not the length
 * of this array, that decides whether the run agrees with the committed evidence.
 */
function fieldDiff(committed, thisRun, ignore = [], tol = {}) {
    const atol = tol.atol ?? exports.DIFF_ATOL;
    const rtol = tol.rtol ?? exports.DIFF_RTOL;
    const a = flattenLeaves(committed);
    // Compare against what WOULD BE WRITTEN, not against the in-memory object. `JSON.stringify`
    // drops keys whose value is `undefined`, so an optional field left unset is absent from the
    // committed file but present-and-undefined in the live object — reported as a disagreement
    // between a file and itself. Round-tripping the fresh side removes that whole class.
    const b = flattenLeaves(asWritten(thisRun));
    const skip = new Set(ignore);
    const paths = [...new Set([...a.keys(), ...b.keys()])].sort();
    const out = [];
    for (const p of paths) {
        if (skip.has(p))
            continue;
        const inA = a.has(p), inB = b.has(p);
        const va = inA ? a.get(p) : '<absent>';
        const vb = inB ? b.get(p) : '<absent>';
        if (Object.is(va, vb))
            continue;
        if (typeof va === 'number' && typeof vb === 'number') {
            const absDiff = Math.abs(va - vb);
            const scale = Math.max(Math.abs(va), Math.abs(vb));
            out.push({
                path: p, committed: va, thisRun: vb, absDiff,
                relDiff: scale === 0 ? 0 : absDiff / scale,
                withinTolerance: numbersAgree(va, vb, atol, rtol),
            });
            continue;
        }
        out.push({ path: p, committed: va, thisRun: vb, withinTolerance: false });
    }
    return out;
}
/** The subset that is a real disagreement rather than cross-runtime float drift. */
const beyondTolerance = (diffs) => diffs.filter(d => !d.withinTolerance);
exports.beyondTolerance = beyondTolerance;
/** The largest gap seen on any numeric path, for the run record. `null` when there was none. */
function maxima(diffs) {
    let best = null;
    for (const d of diffs) {
        if (typeof d.absDiff !== 'number')
            continue;
        if (best === null || d.absDiff > best.absDiff)
            best = { path: d.path, absDiff: d.absDiff, relDiff: d.relDiff ?? 0 };
    }
    return best;
}

  },
  "src/domains.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * LIQD Dice — VALUE DOMAINS for every numeric leaf of the committed artifacts of record
 * (`outputs/simulation-results.json` and `outputs/report-figures.json`).
 *
 * ── Why this module exists ───────────────────────────────────────────────────────────────────────
 * Ported from the sibling liqd-plinko `src/domains.ts`. There, setting a committed emission
 * artifact's `totalConfigs` to **-1** printed a clean Full Pass: a negative count of configurations
 * is physically impossible and nothing rejected it as impossible. The SHA-256 pin only proves the
 * bytes did not move since WE pinned them — re-pin the forged artifact in the same commit (which is
 * exactly what a forger does next) and it walks through. The framework's `gate-values.sh` grades a
 * pin-only rejection of an impossible value as a failure, correctly.
 *
 * The fix is one rule, and it is the only rule that matters:
 *
 *     EVERY BOUND IS DERIVED FROM `src/config.ts` (the audited population, the sample depths, the
 *     odds limits, the roll grid) — NEVER FROM THE ARTIFACT BEING CHECKED. A bound the artifact
 *     supplies is a bound a forger sets.
 *
 * ── G-VALID: reject only the IMPOSSIBLE ──────────────────────────────────────────────────────────
 * The mirror defect costs exactly as much: a GENUINE result rejected for being surprising trains a
 * reader to re-run until green. So these domains encode PHYSICAL POSSIBILITY, not plausibility, and
 * nothing here rejects a value for being round, extreme, or equal to its own expectation. The traps
 * this game's artifacts contain — every one an honest committed value a naive name-based classifier
 * gets wrong:
 *
 *   `points[].rtp`                        a WINDOW RTP can legitimately be ABOVE 1: a short window mean is
 *                                         bounded by the price grid's largest multiplier, not by 1
 *   `serial.lag1`                         an autocorrelation, so [-1, 1] and often negative
 *   `serial.lag1Z` / `runsZ` / `.z`       signed z-scores, unbounded either way
 *   `cherryPickExpected`                  an EXPECTED count, a REAL that is legitimately not an integer
 *   `expectedUpperBoundHits`              an expected count legitimately < 1
 *   `theoreticalEdgePct`                  an edge percent that can be NEGATIVE (player-favourable)
 *   `realizedRtpPct`                      a realised RTP over a finite sample, legitimately > 100
 *   `netUsdt`                             a signed settlement residual, either sign
 *
 * Because a mistake in this table would either wave through a forgery or reject an honest audit,
 * Step 19 (`tests/steps/standardization.ts`) asserts BOTH directions against the committed
 * artifacts on every run: every numeric leaf satisfies its domain, AND every numeric leaf PATH is
 * covered by an explicit rule. There is no silent fallback — a new numeric field with no declared
 * domain FAILS Step 19, so the class cannot reopen quietly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.realBetween = exports.intBetween = exports.intAtMost = exports.exactly = exports.CHI_SQUARED = exports.PERCENT = exports.CORRELATION = exports.PROBABILITY = exports.NONNEG_INT = exports.POSITIVE_REAL = exports.NONNEG_REAL = exports.FINITE = void 0;
exports.collapsePath = collapsePath;
exports.domainRules = domainRules;
exports.numericLeaves = numericLeaves;
exports.validateDomains = validateDomains;
exports.describeDomainFailures = describeDomainFailures;
const config_1 = require("./config");
const D = (label, ok) => ({ label, ok });
// ── Primitive domains ────────────────────────────────────────────────────────────────────────────
/** Any real number that is not NaN/Infinity. The weakest domain; used only where the quantity
 *  genuinely has no physical bound (signed z-scores, signed residuals, signed deviations). */
exports.FINITE = D('a finite number', v => Number.isFinite(v));
exports.NONNEG_REAL = D('a non-negative real', v => Number.isFinite(v) && v >= 0);
exports.POSITIVE_REAL = D('a strictly positive real', v => Number.isFinite(v) && v > 0);
exports.NONNEG_INT = D('a non-negative integer', v => Number.isInteger(v) && v >= 0);
exports.PROBABILITY = D('a probability in [0,1]', v => Number.isFinite(v) && v >= 0 && v <= 1);
exports.CORRELATION = D('a correlation in [-1,1]', v => Number.isFinite(v) && v >= -1 && v <= 1);
exports.PERCENT = D('a percentage in [0,100]', v => Number.isFinite(v) && v >= 0 && v <= 100);
/** A chi-squared statistic is a sum of squares over positive expectations. */
exports.CHI_SQUARED = D('a non-negative chi-squared statistic', v => Number.isFinite(v) && v >= 0);
const exactly = (target, what) => D(`exactly ${target} (${what})`, v => v === target);
exports.exactly = exactly;
const intAtMost = (max, what) => D(`an integer in [0, ${max}] (${what})`, v => Number.isInteger(v) && v >= 0 && v <= max);
exports.intAtMost = intAtMost;
const intBetween = (lo, hi, what) => D(`an integer in [${lo}, ${hi}] (${what})`, v => Number.isInteger(v) && v >= lo && v <= hi);
exports.intBetween = intBetween;
const realBetween = (lo, hi, what) => D(`a real in [${lo}, ${hi}] (${what})`, v => Number.isFinite(v) && v >= lo && v <= hi);
exports.realBetween = realBetween;
// ── Derived domains — bounds from src/config.ts, never from a scored artifact ─────────────────────
/** The audited populations, stated in source (G-BIND). */
const SEED_COUNT = (0, exports.intAtMost)(config_1.EXPECTED_SEEDS, 'audited seed population');
const BET_COUNT = (0, exports.intAtMost)(config_1.EXPECTED_BETS, 'audited bet population');
const EPOCH_IDX = (0, exports.intAtMost)(config_1.EXPECTED_SEEDS - 1, 'epoch index within the audited population');
const EXPECTED_OVER_SEEDS = (0, exports.realBetween)(0, config_1.EXPECTED_SEEDS, 'expected count over the seed population');
const EXPECTED_OVER_BETS = (0, exports.realBetween)(0, config_1.EXPECTED_BETS, 'expected count over the bet population');
/** A band bound (lower/upper) is a value on the 0..100 percent axis the roll grid maps onto. */
const BAND_BOUND = (0, exports.realBetween)(0, config_1.SCALE, 'band bound on the 0..100 axis');
/** A served roll is draw/SCALE, so it lies in [0, (RANGE-1)/SCALE] = [0, 99.99]. */
const ROLL_VALUE = (0, exports.realBetween)(0, (config_1.RANGE - 1) / config_1.SCALE, 'a roll value on the 2-dp grid');
/** A quoted multiplier lies within the operator's declared odds limits. */
/** The price grid's multiplier span: 9900/bp over PRICE_GRID_MIN_BPS … PRICE_GRID_MAX_BPS (src/config.ts). */
const GRID_MIN_MULT = config_1.PAYOUT_NUMERATOR / config_1.PRICE_GRID_MAX_BPS;
const GRID_MAX_MULT = config_1.PAYOUT_NUMERATOR / config_1.PRICE_GRID_MIN_BPS;
const MULTIPLIER = (0, exports.realBetween)(GRID_MIN_MULT, GRID_MAX_MULT, 'quoted multiplier within the price grid');
/**
 * The attainable range of any PAYOUT AVERAGE — a theoretical RTP, a simulated RTP, or a WINDOW RTP.
 * A mean of drawn multipliers cannot fall outside 0 and the largest multiplier the game can pay
 * (GRID_MAX_MULT). NOT [0,1]: a short window legitimately averages above 1. */
const RTP = (0, exports.realBetween)(0, GRID_MAX_MULT, 'attainable payout average in [0, the largest grid multiplier]');
/** An RTP expressed as a PERCENT, so 100× the RTP domain — realizedRtpPct = 103.56 is honest. */
const RTP_PCT = (0, exports.realBetween)(0, GRID_MAX_MULT * config_1.SCALE, 'attainable payout average as a percent');
/**
 * A house-edge PERCENT. edge = 1 − RTP with RTP ∈ [0, GRID_MAX_MULT], so as a percent it runs from
 * 100·(1 − GRID_MAX_MULT) (a maximally player-favourable band) up to 100 (a zero-return band). Only the
 * impossible — an edge above 100% — is rejected; a negative edge is a real, disclosable outcome. */
const EDGE_PCT = (0, exports.realBetween)(100 * (1 - GRID_MAX_MULT), 100, 'house edge as a percent');
/** Collapse `a.b[3].c` to `a.b[].c` so one rule covers every element of a list. */
function collapsePath(path) {
    return path.replace(/\[\d+\]/g, '[]');
}
/**
 * Every numeric leaf of each committed artifact, with the domain it physically admits.
 * Ordering matters: the FIRST matching rule wins, so narrower (anchored) patterns come first.
 */
function domainRules() {
    return {
        // ── outputs/simulation-results.json ──────────────────────────────────────────────────────────
        'simulation-results.json': [
            // artifact schema version (1 = raw statistics only, 2 = also the integer counts behind them,
            // 3 = schema 2 plus the 98-target edge convergence and its cross-target mean).
            { path: /^\.schemaVersion$/, domain: (0, exports.intBetween)(1, 3, 'artifact schema version') },
            // model: config echoes — must equal the src/config.ts constants exactly.
            { path: /^\.model\.range$/, domain: (0, exports.exactly)(config_1.RANGE, 'RANGE') },
            { path: /^\.model\.cursor$/, domain: (0, exports.exactly)(config_1.CURSOR, 'CURSOR') },
            { path: /^\.model\.scale$/, domain: (0, exports.exactly)(config_1.SCALE, 'SCALE') },
            { path: /^\.model\.houseEdge$/, domain: (0, exports.exactly)(config_1.HOUSE_EDGE, 'HOUSE_EDGE') },
            // pass1 — uniformity
            { path: /^\.pass1\.draws$/, domain: (0, exports.exactly)(config_1.SIM_UNIFORMITY_DRAWS, 'SIM_UNIFORMITY_DRAWS') },
            { path: /^\.pass1\.uniformity\.bins$/, domain: (0, exports.intBetween)(1, config_1.RANGE, 'histogram bins over the roll grid') },
            { path: /^\.pass1\.uniformity\.n$/, domain: (0, exports.exactly)(config_1.SIM_UNIFORMITY_DRAWS, 'SIM_UNIFORMITY_DRAWS') },
            { path: /^\.pass1\.uniformity\.chi2$/, domain: exports.CHI_SQUARED },
            { path: /^\.pass1\.uniformity\.df$/, domain: (0, exports.intBetween)(1, config_1.RANGE, 'chi-squared degrees of freedom') },
            { path: /^\.pass1\.uniformity\.pValue$/, domain: exports.PROBABILITY },
            // pass1 — serial screen
            { path: /^\.pass1\.serial\.n$/, domain: (0, exports.exactly)(config_1.SIM_SERIAL_DRAWS, 'SIM_SERIAL_DRAWS') },
            { path: /^\.pass1\.serial\.lag1$/, domain: exports.CORRELATION },
            { path: /^\.pass1\.serial\.(lag1Z|runsZ)$/, domain: exports.FINITE },
            { path: /^\.pass1\.serial\.zCritical$/, domain: exports.NONNEG_REAL },
            { path: /^\.pass1\.serial\.runsP$/, domain: exports.PROBABILITY },
            // schema-2 runs cell counts (make runsZ re-derivable): a runs count and the count on one
            // side are integers in [0, n]; the expected count and variance are non-negative reals.
            { path: /^\.pass1\.serial\.runs$/, domain: (0, exports.intBetween)(1, config_1.SIM_SERIAL_DRAWS, 'Wald–Wolfowitz runs count') },
            { path: /^\.pass1\.serial\.n1$/, domain: (0, exports.intBetween)(0, config_1.SIM_SERIAL_DRAWS, 'observations on one side of the midpoint') },
            { path: /^\.pass1\.serial\.runsExpected$/, domain: exports.POSITIVE_REAL },
            { path: /^\.pass1\.serial\.runsVariance$/, domain: exports.NONNEG_REAL },
            // pass1 — RTP convergence
            { path: /^\.pass1\.rtpConvergence\.params\.(lower|upper)$/, domain: BAND_BOUND },
            { path: /^\.pass1\.rtpConvergence\.multiplier$/, domain: MULTIPLIER },
            { path: /^\.pass1\.rtpConvergence\.n$/, domain: (0, exports.exactly)(config_1.SIM_RTP_BETS, 'SIM_RTP_BETS') },
            { path: /^\.pass1\.rtpConvergence\.marks\[\]$/, domain: (0, exports.intBetween)(1, config_1.SIM_RTP_BETS, 'a convergence sample size') },
            { path: /^\.pass1\.rtpConvergence\.(theoreticalRTP|finalRTP|finalRTPRunning)$/, domain: RTP },
            { path: /^\.pass1\.rtpConvergence\.points\[\]\.n$/, domain: (0, exports.intBetween)(1, config_1.SIM_RTP_BETS, 'a convergence sample size') },
            { path: /^\.pass1\.rtpConvergence\.points\[\]\.wins$/, domain: (0, exports.intBetween)(0, config_1.SIM_RTP_BETS, 'schema-2 integer win count behind a convergence point') },
            { path: /^\.pass1\.rtpConvergence\.points\[\]\.rtp$/, domain: RTP },
            { path: /^\.pass1\.rtpConvergence\.points\[\]\.se$/, domain: exports.NONNEG_REAL },
            // pass1 — effective-edge bands
            { path: /^\.pass1\.effectiveEdge\[\]\.params\.(lower|upper)$/, domain: BAND_BOUND },
            { path: /^\.pass1\.effectiveEdge\[\]\.quotedMultiplier$/, domain: MULTIPLIER },
            { path: /^\.pass1\.effectiveEdge\[\]\.discreteWinPct$/, domain: exports.PERCENT },
            { path: /^\.pass1\.effectiveEdge\[\]\.(theoreticalRTP|simulatedRTP)$/, domain: RTP },
            { path: /^\.pass1\.effectiveEdge\[\]\.theoreticalEdgePct$/, domain: EDGE_PCT },
            { path: /^\.pass1\.effectiveEdge\[\]\.deltaSE$/, domain: exports.FINITE },
            { path: /^\.pass1\.effectiveEdge\[\]\.tolSE$/, domain: exports.POSITIVE_REAL },
            { path: /^\.pass1\.effectiveEdge\[\]\.n$/, domain: (0, exports.exactly)(config_1.SIM_EDGE_BETS, 'SIM_EDGE_BETS') },
            { path: /^\.pass1\.effectiveEdge\[\]\.wins$/, domain: (0, exports.intBetween)(0, config_1.SIM_EDGE_BETS, 'schema-2 integer win count behind a band RTP') },
            { path: /^\.pass1\.effectiveEdge\[\]\.se$/, domain: exports.NONNEG_REAL },
            // pass1 — edge convergence on the 98 over-mode targets, each with its per-mark running series
            { path: /^\.pass1\.targets\[\]\.params\.(lower|upper)$/, domain: BAND_BOUND },
            { path: /^\.pass1\.targets\[\]\.seedCounterFirst$/, domain: (0, exports.intBetween)(config_1.SIM_TARGET_SEED_COUNTER_BASE, config_1.SIM_TARGET_SEED_COUNTER_BASE + (config_1.SIM_TARGETS.length - 1) * config_1.SIM_TARGET_SEEDS_EACH, 'a target\'s first position in the pinned seed stream') },
            { path: /^\.pass1\.targets\[\]\.seedCounterCount$/, domain: (0, exports.exactly)(config_1.SIM_TARGET_SEEDS_EACH, 'SIM_TARGET_SEEDS_EACH') },
            { path: /^\.pass1\.targets\[\]\.quotedMultiplier$/, domain: MULTIPLIER },
            { path: /^\.pass1\.targets\[\]\.discreteWinPct$/, domain: exports.PERCENT },
            { path: /^\.pass1\.targets\[\]\.(theoreticalRTP|simulatedRTP)$/, domain: RTP },
            { path: /^\.pass1\.targets\[\]\.theoreticalEdgePct$/, domain: EDGE_PCT },
            { path: /^\.pass1\.targets\[\]\.deltaSE$/, domain: exports.FINITE },
            { path: /^\.pass1\.targets\[\]\.tolSE$/, domain: exports.POSITIVE_REAL },
            { path: /^\.pass1\.targets\[\]\.n$/, domain: (0, exports.exactly)(config_1.SIM_TARGET_BETS, 'SIM_TARGET_BETS') },
            { path: /^\.pass1\.targets\[\]\.wins$/, domain: (0, exports.intBetween)(0, config_1.SIM_TARGET_BETS, 'integer win count behind a target RTP') },
            { path: /^\.pass1\.targets\[\]\.se$/, domain: exports.NONNEG_REAL },
            { path: /^\.pass1\.targets\[\]\.marks\[\]\.n$/, domain: (0, exports.intBetween)(1, config_1.SIM_TARGET_BETS, 'a per-target sample size') },
            { path: /^\.pass1\.targets\[\]\.marks\[\]\.wins$/, domain: (0, exports.intBetween)(0, config_1.SIM_TARGET_BETS, 'integer win count at a mark') },
            { path: /^\.pass1\.targets\[\]\.marks\[\]\.rtp$/, domain: RTP },
            { path: /^\.pass1\.targets\[\]\.marks\[\]\.se$/, domain: exports.NONNEG_REAL },
            // pass1 — the 98-target mean RTP series (the convergence chart)
            { path: /^\.pass1\.targetConvergence\.targets$/, domain: (0, exports.exactly)(config_1.SIM_TARGETS.length, 'SIM_TARGETS.length') },
            { path: /^\.pass1\.targetConvergence\.perTargetBets$/, domain: (0, exports.exactly)(config_1.SIM_TARGET_BETS, 'SIM_TARGET_BETS') },
            { path: /^\.pass1\.targetConvergence\.totalBets$/, domain: (0, exports.exactly)(config_1.SIM_TARGETS.length * config_1.SIM_TARGET_BETS, 'SIM_TARGETS.length × SIM_TARGET_BETS') },
            { path: /^\.pass1\.targetConvergence\.marks\[\]$/, domain: (0, exports.intBetween)(1, config_1.SIM_TARGET_BETS, 'a per-target sample size') },
            { path: /^\.pass1\.targetConvergence\.(theoreticalRTP|finalRTP)$/, domain: RTP },
            { path: /^\.pass1\.targetConvergence\.(finalSE|finalDeltaSE)$/, domain: exports.NONNEG_REAL },
            { path: /^\.pass1\.targetConvergence\.points\[\]\.n$/, domain: (0, exports.intBetween)(1, config_1.SIM_TARGET_BETS, 'a per-target sample size') },
            { path: /^\.pass1\.targetConvergence\.points\[\]\.rtp$/, domain: RTP },
            { path: /^\.pass1\.targetConvergence\.points\[\]\.se$/, domain: exports.NONNEG_REAL },
            // pass2 — cherry-pick screen + exact null
            { path: /^\.pass2\.seedsTested$/, domain: SEED_COUNT },
            { path: /^\.pass2\.(nullPartitions|nullSupportValues)$/, domain: exports.NONNEG_INT },
            { path: /^\.pass2\.cherryWindow$/, domain: (0, exports.exactly)(config_1.SIM_CHERRY_WINDOW, 'SIM_CHERRY_WINDOW') },
            { path: /^\.pass2\.cherryBins$/, domain: (0, exports.exactly)(config_1.SIM_CHERRY_BINS, 'SIM_CHERRY_BINS') },
            { path: /^\.pass2\.(cherrySeedAlphaNominal|cherrySeedAlphaAchieved|cherryPickP0|cherryPickBinomialP|cherryPickAlpha)$/, domain: exports.PROBABILITY },
            { path: /^\.pass2\.cherryPickFlags$/, domain: SEED_COUNT },
            { path: /^\.pass2\.cherryPickExpected$/, domain: EXPECTED_OVER_SEEDS },
            { path: /^\.pass2\.pooledRealRollUniformity\.n$/, domain: BET_COUNT },
            { path: /^\.pass2\.pooledRealRollUniformity\.chi2$/, domain: exports.CHI_SQUARED },
            { path: /^\.pass2\.pooledRealRollUniformity\.df$/, domain: (0, exports.intBetween)(1, config_1.RANGE, 'chi-squared degrees of freedom') },
            { path: /^\.pass2\.pooledRealRollUniformity\.pValue$/, domain: exports.PROBABILITY },
            { path: /^\.pass2\.perSeed\[\]\.epoch$/, domain: EPOCH_IDX },
            // earlySq/lateSq are sums of squared bin counts over one window — a non-negative real.
            { path: /^\.pass2\.perSeed\[\]\.(earlySq|lateSq)$/, domain: exports.NONNEG_REAL },
            { path: /^\.pass2\.perSeed\[\]\.(earlyChi2|lateChi2)$/, domain: exports.CHI_SQUARED },
            { path: /^\.pass2\.perSeed\[\]\.(earlyP|lateP)$/, domain: exports.PROBABILITY },
            // pass2 — served-band payout-weighted return scan (DICE-21, load-bearing). A return / expected
            // return / variance is a non-negative real; the aggregate z is a signed z-score; the aggregate
            // p and alpha are probabilities; the direction counts and epoch count are over the seed
            // population; the detection power is a non-negative pp value.
            { path: /^\.pass2\.servedBand\.nonces$/, domain: (0, exports.exactly)(config_1.SIM_PASS2_NONCES, 'SIM_PASS2_NONCES') },
            { path: /^\.pass2\.servedBand\.earlyBets$/, domain: (0, exports.exactly)(config_1.EXPECTED_BETS, 'EXPECTED_BETS (one early cell per captured round)') },
            { path: /^\.pass2\.servedBand\.alpha$/, domain: exports.PROBABILITY },
            { path: /^\.pass2\.servedBand\.epochs$/, domain: SEED_COUNT },
            { path: /^\.pass2\.servedBand\.(totalEarlyReturn|totalEarlyExpected|totalEarlyVar)$/, domain: exports.NONNEG_REAL },
            { path: /^\.pass2\.servedBand\.(directionBelow|directionAbove)$/, domain: SEED_COUNT },
            { path: /^\.pass2\.servedBand\.aggEarlyZ$/, domain: exports.FINITE },
            { path: /^\.pass2\.servedBand\.aggEarlyP$/, domain: exports.PROBABILITY },
            { path: /^\.pass2\.servedBand\.minDetectablePerBetPct$/, domain: exports.NONNEG_REAL },
            { path: /^\.pass2\.servedBand\.perEpoch\[\]\.(earlyN|refN)$/, domain: (0, exports.intBetween)(0, config_1.SIM_PASS2_NONCES, 'nonces in a Pass-2 window') },
            { path: /^\.pass2\.servedBand\.perEpoch\[\]\.(earlyReturn|earlyExpected|earlyVar|refReturn|refExpected|refVar)$/, domain: exports.NONNEG_REAL },
        ],
        // ── outputs/report-figures.json ────────────────────────────────────────────────────────────────
        'report-figures.json': [
            { path: /^\.bets$/, domain: BET_COUNT },
            { path: /^\.wins$/, domain: BET_COUNT },
            { path: /^\.settledRtp\.(belowNominal|aboveNominal|exactlyNominal)$/, domain: BET_COUNT },
            { path: /^\.settledRtp\.(minPct|maxPct|nominalPct)$/, domain: RTP_PCT },
            { path: /^\.settlementResidual\.(roundedDown|roundedUp|exactlyOnProduct|floatClosedFormMisses)$/, domain: BET_COUNT },
            { path: /^\.settlementResidual\.maxAbsUsdt$/, domain: exports.NONNEG_REAL },
            { path: /^\.settlementResidual\.netUsdt$/, domain: exports.FINITE },
            { path: /^\.boundary\.(betsWithReachableUpperBound|betsWithUnreachableUpperBound|observedUpperBoundHits|observedLowerBoundHits|betsWhereBoundaryModelsDisagree|winFlagsReproducedHalfOpen|winFlagsReproducedInclusiveBothEnds)$/, domain: BET_COUNT },
            { path: /^\.boundary\.expectedUpperBoundHits$/, domain: EXPECTED_OVER_BETS },
            { path: /^\.cherryPickPower\.seeds$/, domain: SEED_COUNT },
            { path: /^\.cherryPickPower\.(nullFlagRate|pAtMinRejectable|alpha|seedAlphaNominal)$/, domain: exports.PROBABILITY },
            { path: /^\.cherryPickPower\.expectedFlags$/, domain: EXPECTED_OVER_SEEDS },
            { path: /^\.cherryPickPower\.minRejectableFlags$/, domain: SEED_COUNT },
            { path: /^\.live\.(wageredUsdt|returnedUsdt)$/, domain: exports.NONNEG_REAL },
            { path: /^\.live\.realizedRtpPct$/, domain: RTP_PCT },
            { path: /^\.live\.meanRoll$/, domain: ROLL_VALUE },
            // per-phase aggregates: counts over the audited population, served stakes and amounts, class counts
            { path: /^\.phases\.[^.]+\.(bets|wins|fewestPerClass|mostPerClass)$/, domain: BET_COUNT },
            { path: /^\.phases\.[^.]+\.epochs$/, domain: SEED_COUNT },
            { path: /^\.phases\.[^.]+\.classes$/, domain: (0, exports.intAtMost)(4 * config_1.RANGE, '(mode × basis-point) classes') },
            { path: /^\.phases\.[^.]+\.(stakeUsdt|wageredUsdt|returnedUsdt)$/, domain: exports.NONNEG_REAL },
            { path: /^\.phases\.[^.]+\.realizedRtpPct$/, domain: RTP_PCT },
            { path: /^\.modes\.(under|over|inside|outside)$/, domain: BET_COUNT },
            { path: /^\.verifier\.(replies|equalServedRound)$/, domain: BET_COUNT },
            { path: /^\.playerSeeds\.(epochs|distinct)$/, domain: SEED_COUNT },
            { path: /^\.playerSeeds\.bets$/, domain: BET_COUNT },
        ],
    };
}
/** Collect every numeric leaf of `doc` as `[collapsedPath, value]`. */
function numericLeaves(doc, path = '', out = []) {
    if (typeof doc === 'number') {
        out.push([collapsePath(path), doc]);
        return out;
    }
    if (doc === null || typeof doc !== 'object')
        return out;
    if (Array.isArray(doc)) {
        doc.forEach((v, i) => numericLeaves(v, `${path}[${i}]`, out));
        return out;
    }
    for (const [k, v] of Object.entries(doc))
        numericLeaves(v, `${path}.${k}`, out);
    return out;
}
/**
 * Validate every numeric leaf of `doc` against `rules`.
 *
 * A leaf matched by NO rule is a violation in its own right (`uncovered`). That is deliberate: an
 * unbounded new field is precisely how this class reopens, and a silent fallback to "must be finite"
 * would have accepted the impossible `-1`.
 */
function validateDomains(doc, rules) {
    const violations = [];
    const uncovered = [];
    const leaves = numericLeaves(doc);
    for (const [p, v] of leaves) {
        const rule = rules.find(r => r.path.test(p));
        if (!rule) {
            if (!uncovered.includes(p))
                uncovered.push(p);
            continue;
        }
        if (!rule.domain.ok(v))
            violations.push({ path: p, value: v, expected: rule.domain.label });
    }
    return { violations, uncovered, checked: leaves.length };
}
/** One-line summaries for a step's detail string. */
function describeDomainFailures(artifact, r) {
    const out = [];
    for (const v of r.violations.slice(0, 4)) {
        out.push(`${artifact}${v.path} = ${v.value} is not ${v.expected}`);
    }
    if (r.violations.length > 4)
        out.push(`${artifact}: +${r.violations.length - 4} more impossible value(s)`);
    for (const p of r.uncovered.slice(0, 4)) {
        out.push(`${artifact}${p} has no declared value domain (add one in src/domains.ts)`);
    }
    if (r.uncovered.length > 4)
        out.push(`${artifact}: +${r.uncovered.length - 4} more undeclared field(s)`);
    return out;
}

  },
  "src/exact-chi2.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * EXACT null distribution of the Pass-2 cherry-pick statistic.
 *
 * Pass 2 compares each epoch's early window (nonces 0..49) against its late window
 * (nonces 50..99) with a draw-uniformity χ² over SIM_CHERRY_BINS equal bins. Under the
 * null the bin counts are multinomial(n = SIM_CHERRY_WINDOW, 1/BINS each), so the
 * statistic is DISCRETE and its exact distribution is computable — there is no need for
 * a sampled null.
 *
 * WHY THIS EXISTS. A sampled null — a parametric bootstrap drawn inside `simulate.ts` — is
 * resampled on every run, so the SAME revealed seeds would yield a different flag count from one
 * rerun to the next, and at the high end the verifier's binomial tail falls below its threshold:
 * a fresh `npm test` fails Step 17 intermittently and additionally prints "DISAGREES with
 * recomputation (tampered?)", because the producer's self-report was written under a different
 * draw of the same null. A verifier whose verdict depends on a random draw is not a verifier.
 *
 * The statistic reduces to a single integer. With e = n/BINS expected per bin,
 *   χ² = Σ (h_i − e)² / e = (Σ h_i² − n²/BINS) / e
 * so χ² is an affine function of the integer SQUARE SUM  S = Σ h_i².  Everything below is
 * therefore computed in S-space, where equality is exact integer equality and no floating
 * comparison can drift: `squareSum()` produces S, `upperTailBySquareSum()` returns the exact
 * P(S ≥ s), and `chi2FromSquareSum()` is only ever used for reporting.
 *
 * The distribution is computed by ENUMERATING every partition of n into at most BINS parts
 * (181,274 of them for n=50/BINS=20) and accumulating, in exact BigInt integer arithmetic,
 * the number of bin assignments that realise each S:
 *
 *     assignments(λ) = ( n! / Π λ_i! ) · ( BINS! / Π_v m_v! )
 *
 * where m_v counts how many bins hold the value v (zeros included). Dividing by BINS^n — also
 * exact — gives the probability. The only floating-point operation in the whole derivation is
 * the final BigInt → double conversion of each probability. `tests/dice/rngTests.ts` re-derives
 * the same distribution by an INDEPENDENT method (a dynamic program over bins, binomial split
 * per bin, doubles throughout) and requires the two to agree — one distribution, two
 * derivations, in the spirit of S-CONST.
 *
 * Cost: ~0.2 s, computed once per process and memoised.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exactNull = exactNull;
exports.squareSum = squareSum;
exports.chi2FromSquareSum = chi2FromSquareSum;
exports.upperTailBySquareSum = upperTailBySquareSum;
exports.achievedSeedAlpha = achievedSeedAlpha;
exports.cherryFlagRate = cherryFlagRate;
const config_1 = require("./config");
const BINS = config_1.SIM_CHERRY_BINS;
const WINDOW = config_1.SIM_CHERRY_WINDOW;
function factorials(upTo) {
    const f = [1n];
    for (let i = 1; i <= upTo; i++)
        f.push(f[i - 1] * BigInt(i));
    return f;
}
function build() {
    const fact = factorials(Math.max(WINDOW, BINS));
    const counts = new Map();
    const parts = [];
    let partitions = 0;
    // Enumerate partitions of WINDOW into at most BINS parts, in non-increasing order.
    const rec = (remaining, maxPart, depth) => {
        if (remaining === 0) {
            partitions++;
            let s = 0;
            let denom = 1n;
            const multiplicity = new Map();
            for (let i = 0; i < depth; i++) {
                const v = parts[i];
                s += v * v;
                denom *= fact[v];
                multiplicity.set(v, (multiplicity.get(v) ?? 0) + 1);
            }
            multiplicity.set(0, BINS - depth); // the empty bins are part of the arrangement
            let arrangeDenom = 1n;
            for (const m of multiplicity.values())
                arrangeDenom *= fact[m];
            const ways = (fact[WINDOW] / denom) * (fact[BINS] / arrangeDenom);
            counts.set(s, (counts.get(s) ?? 0n) + ways);
            return;
        }
        if (depth === BINS)
            return;
        const hi = Math.min(remaining, maxPart);
        for (let v = hi; v >= 1; v--) {
            if (v * (BINS - depth) < remaining)
                break; // cannot finish with parts ≤ v
            parts[depth] = v;
            rec(remaining - v, v, depth + 1);
        }
    };
    rec(WINDOW, WINDOW, 0);
    const total = BigInt(BINS) ** BigInt(WINDOW);
    const support = [...counts.keys()].sort((a, b) => a - b);
    const totalNum = Number(total);
    const probability = support.map((s) => Number(counts.get(s)) / totalNum);
    const upperTail = new Array(support.length);
    let acc = 0;
    for (let i = support.length - 1; i >= 0; i--) {
        acc += probability[i];
        upperTail[i] = acc;
    }
    return { support, probability, upperTail, partitions };
}
let cached = null;
/** The exact null, computed once per process. */
function exactNull() {
    if (!cached)
        cached = build();
    return cached;
}
/** Bin the draws of one window and return the integer statistic S = Σ h_i². */
function squareSum(draws) {
    const per = config_1.RANGE / BINS;
    const h = new Array(BINS).fill(0);
    for (const d of draws)
        h[Math.min(BINS - 1, Math.floor(d / per))]++;
    let s = 0;
    for (const v of h)
        s += v * v;
    return s;
}
/** χ² for reporting only — the scored path stays in integer S-space. */
function chi2FromSquareSum(s) {
    const e = WINDOW / BINS;
    return (s - (WINDOW * WINDOW) / BINS) / e;
}
/** Exact one-sided p-value P(S ≥ s) under the uniform multinomial null. */
function upperTailBySquareSum(s) {
    const { support, upperTail } = exactNull();
    let lo = 0, hi = support.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (support[mid] < s)
            lo = mid + 1;
        else
            hi = mid;
    }
    return lo < support.length ? upperTail[lo] : 0;
}
/**
 * ACHIEVED rejection rate of the per-window screen at the nominal SIM_CHERRY_SEED_ALPHA.
 * Because the statistic is discrete, P(p-value < α) is not α: it is the mass of the smallest
 * attainable tail strictly below α. Derived, never typed in.
 */
function achievedSeedAlpha() {
    const { support, upperTail } = exactNull();
    for (let i = 0; i < support.length; i++)
        if (upperTail[i] < config_1.SIM_CHERRY_SEED_ALPHA)
            return upperTail[i];
    return 0;
}
/**
 * CHERRY_P0 — the probability that one epoch is flagged under the null.
 * A flag needs earlyP < α AND lateP ≥ α on independent windows, so the compound rate is
 * a·(1 − a) with a = achievedSeedAlpha(). This is the ONE definition of the null flag rate:
 * `src/simulate.ts` (producer) and `tests/steps/simulation.ts` (verifier) both import it from
 * here, so a divergence like the shipped 0.0475-vs-0.0438147684 split cannot recur (S-CONST).
 */
function cherryFlagRate() {
    const a = achievedSeedAlpha();
    return a * (1 - a);
}

  },
  "src/loader.js": function (module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDataset = loadDataset;
exports.revealedSeedMap = revealedSeedMap;
exports.seedByEpoch = seedByEpoch;
exports.betsByEpoch = betsByEpoch;
exports.phaseBets = phaseBets;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
function loadDataset(path, expectedSha256) {
    if (!(0, node_fs_1.existsSync)(path)) {
        console.error(`ERROR: dataset not found at ${path}`);
        process.exit(1);
    }
    const raw = (0, node_fs_1.readFileSync)(path);
    const sha256 = (0, node_crypto_1.createHash)('sha256').update(raw).digest('hex');
    if (expectedSha256 && sha256 !== expectedSha256) {
        console.error(`ERROR: dataset SHA-256 mismatch`);
        console.error(`  expected: ${expectedSha256}`);
        console.error(`  actual:   ${sha256}`);
        process.exit(1);
    }
    const parsed = JSON.parse(raw.toString('utf8'));
    return { ...parsed, sha256, path };
}
/** O(1) lookup: hashedServerSeed → its Seed entry (with revealed serverSeed once rotated). */
function revealedSeedMap(seeds) {
    const m = new Map();
    for (const s of seeds)
        m.set(s.hashedServerSeed, s);
    return m;
}
/** epoch index → Seed entry. */
function seedByEpoch(seeds) {
    const m = new Map();
    for (const s of seeds)
        m.set(s.epoch, s);
    return m;
}
/** epoch index → its bets. */
function betsByEpoch(bets) {
    const m = new Map();
    for (const b of bets) {
        const a = m.get(b.epoch);
        if (a)
            a.push(b);
        else
            m.set(b.epoch, [b]);
    }
    return m;
}
function phaseBets(bets, phase) {
    return bets.filter((b) => b.phase === phase);
}

  },
  "src/profile-map.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Which ProvablyFair.org Dice profile check each scored step implements.
 *
 * WHY THIS FILE EXISTS. The framework's game profile declares checks DICE-01 … DICE-30. This suite
 * scores 22 steps under its own numbering, which every chapter cites by number and which therefore
 * cannot be renumbered to match. Without a written mapping the only way to relate the two was to
 * read all 22 steps by hand and type the answer into the profile — where it went stale the moment a
 * step changed, silently, because nothing re-derived it. The mapping is declared here, emitted into
 * `outputs/verification-results.json` beside the step results, and read back by `pf-audit matrix`,
 * which prints the conformance matrix and exits 1 when a HARD_FAIL check has nothing implementing it.
 *
 * THIS FILE LABELS; IT DOES NOT CHECK. Nothing here can make a step pass or fail. An id claimed for
 * a step the step does not implement is a false statement in a published artifact, so the rule is
 * the profile's own `asserts` text: claim the check only if the step's assertion actually decides it.
 *
 * COVERAGE DESCRIBES THE PACKAGE, NOT THE STEP.
 *   full    — nothing the profile's `asserts` requires is unimplemented; where a check is split
 *             across two steps both say `full` and each note says which half it carries.
 *   partial — something the profile requires is implemented nowhere in this package, and the note
 *             says what. `partial` is a disclosure, never a softer word for `full`.
 * A check no step claims is absent from the matrix by construction: that is the point.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_CHECKS = exports.NOT_APPLICABLE = exports.STEP_CLAIMS = exports.PROFILE_VERSION = exports.PROFILE_GAME = void 0;
exports.profileCoverageBlock = profileCoverageBlock;
exports.labelFor = labelFor;
exports.PROFILE_GAME = 'dice';
exports.PROFILE_VERSION = '1.0.2';
/** Scored step number → the profile checks it implements. Every step 1..22 has an entry. */
exports.STEP_CLAIMS = {
    1: {
        claims: [{
                id: 'DICE-01', coverage: 'full',
                note: 'SHA-256(utf8(serverSeed)) == hashedServerSeed for every revealed seed; the count checked '
                    + 'is bound to the EXPECTED_SEEDS code constant (not the dataset count) by Step 11 / DICE-05 '
                    + '(G-BIND), which the profile asserts as part of this check',
            }],
    },
    2: {
        claims: [{
                id: 'DICE-02', coverage: 'full',
                note: 'the dataset holds four capture files: every in-file rotation is checked (next hash == the '
                    + 'next epoch\'s commitment) and each file is anchored by its own pre-capture pair (revealed, '
                    + 'hashing to its commitment, naming the file\'s first epoch). The links between the files run '
                    + 'through rotations outside this dataset and are not checked',
            }],
    },
    3: { claims: [{ id: 'DICE-03', coverage: 'full' }] },
    4: {
        claims: [{
                id: 'DICE-04', coverage: 'full',
                note: 'nonce contiguity, no-reuse and leading/trailing/short-epoch withholding are asserted, '
                    + 'and the epoch size is bound to src/config.ts not the dataset header (G-BIND); on THIS '
                    + 'capture every epoch is fully contiguous from nonce 0 with zero gaps (Step 4 prints the range). The capture-origin FLAG rule '
                    + 'the profile requires (decided 2026-09-17) is implemented: a nonce gap that the revealed '
                    + 'seed reconstructs is returned as a FLAG with origin = capture plus a limitation-row detail — '
                    + 'never a PASS — and verify.ts treats a capture-origin flag as verdict-neutral (Full Pass, '
                    + 'exit 0) while an operator-side gap or repeat is a HARD FAIL. The branch does not fire on '
                    + 'this gap-free capture but the mechanism is present, so DICE-04\'s assertion — a retry gap is '
                    + 'disclosed, an operator gap fails — is decided by the step',
            }],
    },
    5: {
        claims: [
            {
                id: 'DICE-07', coverage: 'full',
                note: 'diceRoll(serverSeed, clientSeed, nonce) / 100 reproduces the served roll byte-identically for '
                    + 'every bet with no tolerance; coverage == bets.length, itself bound to EXPECTED_BETS in '
                    + 'Step 11 / DICE-05',
            },
            {
                id: 'DICE-08', coverage: 'full',
                note: 'the draw-bias bound is computed from the same maxFairFor(RANGE) the live draw applies '
                    + '(src/bias.ts drawBiasBound, on src/rng.ts maxFairFor) and the step ASSERTS it: MAX_FAIR = 10000 × 429496 = 4,294,960,000 '
                    + 'is a whole number of ranges (a HARD FAIL otherwise) and the worst-case modulo bias is 0, '
                    + 'inside the 2^-32 ceiling, with the rejection census printed (7,296 of 2^32 chunk values in the '
                    + 'discarded tail). This is the complement to the recomputation half: without it every exact '
                    + 'recompute in this step could be an exact recompute of a biased draw. It is an arithmetic '
                    + 'property of the audit module\'s constants for all seeds; the operator-side reject branch remains '
                    + 'unexercised by the capture (L11, unchanged) — the profile asks for the computed bound, which '
                    + 'this prints, not for a live rejection witness',
            },
        ],
    },
    6: {
        claims: [{
                id: 'DICE-10', coverage: 'full',
                note: 'the recomputed roll under the half-open band rule reproduces the served win flag for every '
                    + 'captured bet, inverted honoured (the win-flag half), and LIQD\'s own production verify endpoint '
                    + 'reply stored for each round returns the same roll, win and multiplier; the roll-range half and '
                    + 'the boundary rule are Step 15',
            }],
    },
    7: { claims: [{ id: 'DICE-13', coverage: 'full' }] },
    8: {
        claims: [{
                id: 'DICE-11', coverage: 'full',
                note: 'winning credit == floor8(stake × multiplier), asserted exactly on the 1e-8 integer grid from '
                    + 'the served decimal text at both stakes of the plan (the winning half); the loss-⇒-0 half is '
                    + 'Step 9',
            }],
    },
    9: {
        claims: [{
                id: 'DICE-11', coverage: 'full',
                note: 'every losing bet pays exactly 0 with multiplier 0 (the loss half); the winning-credit half '
                    + 'is Step 8',
            }],
    },
    10: {
        claims: [{
                id: 'DICE-14', coverage: 'full',
                note: 'every captured band is priced inside the span of the plan\'s win chances (exact bound on the '
                    + 'integer basis points; the odds-bounds half as far as the capture carries it: LIQD\'s own odds '
                    + 'limits were not read, L7); the strict-monotonicity half is Step 21',
            }],
    },
    11: {
        claims: [
            {
                id: 'DICE-05', coverage: 'full',
                note: 'bets, seeds, epoch count and the size, phase and capture file of every epoch bound to '
                    + 'EXPECTED_BETS / EXPECTED_SEEDS / EXPECTED_EPOCHS in src/config.ts; the dataset header is '
                    + 'reconciled against them, never used as the denominator (G-BIND); per-phase counts are Step 12',
            },
            {
                id: 'DICE-26', coverage: 'full',
                note: 'the live SHA-256 of the dataset equals the pin in src/config.ts and loadDataset aborts '
                    + 'the run before any step on a mismatch; the simulation-artifact pins are Step 19',
            },
        ],
    },
    12: {
        claims: [
            {
                id: 'DICE-05', coverage: 'full',
                note: 'per-phase bet counts asserted against the EXPECTED_PHASES code plan both ways '
                    + '(no undeclared phase, every declared phase at its count); the population/epoch half is '
                    + 'Step 11',
            },
            {
                id: 'DICE-15', coverage: 'full',
                note: 'asserted against the plan in code: Phase A (the 7 November rounds and the A+ top-up) holds '
                    + 'every planned win chance, 1% to 98%, in each of the four band modes with at least '
                    + 'PHASE_A_MIN_BETS_PER_CLASS rounds per (mode × win chance) class; both ends of the planned '
                    + 'range are played (0.01 %, 9900×, in Phase X, and 98%); both stake tiers are present (0.10 USDT and the 10.00 '
                    + 'USDT of Phase C). There is no separate tail phase: 99× is the A+ top-up, 49.5× is the 2% '
                    + 'setting of Phase A and 9900× is the one round of Phase X, priced by LIQD\'s verifier in E20. Band widths between 0.02% and 0.99% and above 98% were not played (L7)',
            },
        ],
    },
    13: { claims: [{ id: 'DICE-18', coverage: 'full' }] },
    14: {
        claims: [{
                id: 'DICE-06', coverage: 'full',
                note: 'every epoch ran under its own client seed submitted by the auditor: 28 are "audit" + 12 hex '
                    + 'characters drawn from the browser CSPRNG at the rotation, and the 5 Phase D epochs carry a '
                    + 'player-set seed ("pfaudit-prod-dice-d<k>-" + 12 CSPRNG hex characters, not predictable from one '
                    + 'another). Step 14 asserts the seeds are distinct, that Phase D holds at least the profile floor '
                    + 'of distinct player-set seeds and that every Phase D roll recomputes under them, that the site '
                    + 'served back the submitted seed in every epoch, that every bet carries its epoch\'s seed and '
                    + 'every roll recomputes under it, and that altering the client seed changes the roll at the rate '
                    + 'the lattice predicts, measured over every bet. The generators are the runner\'s own description, '
                    + 'carried in the dataset (meta.captures[].runner.clientSeedGenerator). That each seed was submitted '
                    + 'after its commitment was served is the capture\'s own record of its ordering (L18)',
            }],
    },
    15: {
        claims: [
            {
                id: 'DICE-10', coverage: 'full',
                note: 'no served roll exceeds the 99.99 grid ceiling (the outcome-range half); the win-flag '
                    + 'half is Step 6',
            },
            {
                id: 'DICE-17', coverage: 'full',
                note: 'the half-open boundary rule is witnessed by LIQD\'s production verify endpoint (evidence '
                    + 'E17, 9 November 2026): Step 15 loads the pinned probe record, recomputes every probe from its '
                    + 'revealed production seed and requires LIQD\'s reply to equal the package rule; the probes with '
                    + 'the roll on a reachable upper bound are the ones that separate half-open from inclusive, and '
                    + 'the step counts them. The settled rounds have no power over the rule (no roll on a bound) and '
                    + 'settlement on a bound is not witnessed (L2). The roll range is asserted; the full-coverage '
                    + 'per-mode recompute is carried by Step 6 (DICE-10) and mode presence by Step 12 (DICE-15)',
            },
            {
                id: 'DICE-19', coverage: 'full',
                note: 'the effective edge is derived per served band from grid arithmetic and the multiplier '
                    + 'formula and asserted == 1.0000% in exact integers on every bet, compared with the claimed '
                    + '1%; the settled-RTP band under the floor8 rule is in report-figures settledRtp',
            },
        ],
    },
    16: {
        claims: [
            {
                id: 'DICE-20', coverage: 'full',
                note: 'scored against the pinned simulation artifact with every DERIVED field re-derived '
                    + '(multiplier, theoretical RTP, SE, deltaSE), a two-sided uniformity screen over 2,000,000 '
                    + 'draws, a serial screen, edge convergence on 98 over-mode targets (over 2.00 … over 99.00) '
                    + '× 1,000,000 bets each with the 98-target mean RTP as the convergence series (the targets continue the same pinned '
                    + 'seed stream after the Pass-1 blocks, at fixed counters re-derived in verify), 9 effective-edge bands × '
                    + '2,000,000 across all four modes, and the 20,000,000-bet under-50 convergence series, '
                    + 'all with standard errors and integer win counts recomputed from the artifact rows. The Pass-1 experiment is DETERMINISTIC '
                    + 'and BYTE-REPLAYABLE (DICE-20): the seed stream is HMAC(SIM_MASTER_SEED, counter) rather '
                    + 'than crypto.randomBytes, the artifact carries no run metadata, so `npm run simulate` '
                    + 'writes identical bytes every time and `npm run test:full` regenerates it with an empty '
                    + 'field diff — the raw Pass-1 statistics (uniformity.chi2, serial.lag1/runsZ, each band\'s '
                    + 'simulatedRTP, each target\'s win counts, the convergence paths) are re-derivable by replaying the pinned producer, '
                    + 'not merely attested by an unreproducible regeneration. Limitation L10 (a stale '
                    + 'zCritical field) is resolved: the artifact is schema 2 and '
                    + 'stores the correct zCritical, re-derived; L1 (a subtly forged statistic) '
                    + 'is NARROWED to the fast-verify path only: '
                    + 'the producer is a pure function of pinned source, so test:full reproduces the exact '
                    + 'committed figures and exposes any forgery, though the ~1s verify still does not recompute '
                    + 'the 138M-draw statistics. simulation.pass1.replayable = true',
            },
        ],
    },
    17: {
        claims: [
            {
                id: 'DICE-21', coverage: 'full',
                note: 'the load-bearing realization is the served-band PAYOUT-WEIGHTED RETURN scan (the '
                    + 'ProvablyFair.org standard dice realization): every revealed casino seed is replayed '
                    + 'for SIM_PASS2_NONCES = 10,000 nonces; the early window is the epoch\'s captured nonce range '
                    + '(0..size−1, the size the plan gives the epoch) and the reference window is the remainder; the '
                    + 'statistic is the payout-weighted return of the bands the casino actually served, '
                    + 'standardised by its EXACT per-bet mean (Σ pᵢ·multᵢ) and variance (Σ pᵢ(1−pᵢ)·multᵢ²) — a '
                    + 'scaled Poisson-binomial across seeds, each pᵢ the served band\'s EXACT lattice '
                    + 'win-probability discreteWinProbability(band) — and read against a one-sided '
                    + 'normal (CLT) lower-tail p vs α (cherry-picking shorts the early window the player saw). '
                    + 'The rule is fixed in code and predates the production capture (fixed in September 2026); '
                    + 'it detects only a per-bet '
                    + 'return deficit at or above the detection power Step 17 prints (80% power); a smaller '
                    + 'selection effect passes it. '
                    + 'Every per-epoch row is RE-DERIVED in Step 17 from the revealed seed at 10,000 nonces/seed '
                    + 'and compared with EXACT equality; the aggregate z, one-sided p, direction split (classified '
                    + 'in exact rational arithmetic, so an epoch exactly on expectation counts as equal) and '
                    + 'detection power are recomputed and printed. HONEST SCOPE — this is EXACT per-bet '
                    + 'mean/variance + an ASYMPTOTIC one-sided normal (CLT) lower tail; it is NOT an '
                    + 'exact-lattice CDF. The exact lower tail "on the outcome lattice" would be a convolution '
                    + 'of heterogeneous distinct-multiplier scaled Binomials (most epochs mix several win chances), '
                    + 'which is not computed. This exact-moments + CLT-tail realization is the standard realization '
                    + 'ProvablyFair.org dice packages ship, recorded as a load-bearing premise / limitation L4 in MANIFEST.md, ASSUMED '
                    + 'to satisfy DICE-21 full, not yet independently confirmed. The exact-discrete draw-uniformity '
                    + 'cherry-pick screen (n=50/20-bin χ², src/exact-chi2.ts) is RETAINED as a supplementary '
                    + 'check. The load-bearing cherry-pick defence remains structural (client-seed-after-commitment)',
            },
            {
                id: 'DICE-22', coverage: 'full',
                note: 'the uniform-lattice-fit half — the pooled captured-roll uniformity χ² over every '
                    + 'captured roll, recomputed from the dataset and reported here; informational (policy INFORMATIONAL, '
                    + '2026-09-29): a rejection is reported, never counted and never fails the step, while a '
                    + 'pooled record in the artifact that does not reconcile still FAILs; the serial-dependence half '
                    + 'is Step 22',
            },
        ],
    },
    18: {
        claims: [{
                id: 'DICE-12', coverage: 'full',
                note: 'Phase C: the planned rounds at the elevated stake (10.00 USDT, 100 times the base stake) on '
                    + 'over 50, a 50% win chance; every roll recomputes from (serverSeed, clientSeed, nonce) alone '
                    + '(diceRoll takes no wager argument); at least PHASE_C_MIN_WINS of them won and every win is '
                    + 'credited floor8(stake × 9900/basisPoints) from the band; the same band at the base stake in the '
                    + 'other phases carries the same served multiplier and the same rule, and the elevated credit is '
                    + 'exactly 100 times the base credit',
            }],
    },
    19: {
        claims: [
            {
                id: 'DICE-26', coverage: 'full',
                note: 'the dataset pin plus the simulation-results.json and rtp-convergence.html SHA-256 pins '
                    + 'in src/config.ts are reconciled here; the abort-before-any-step on a dataset mismatch is '
                    + 'Step 11 / loadDataset',
            },
            {
                id: 'DICE-27', coverage: 'full',
                note: 'the artifacts of record are pinned in src/config.ts, un-ignored by name in .gitignore, '
                    + 'carry no run metadata on any path (no generatedAt/runtime/pin-mode field — absent, not excluded; the field diff has no ignore list), and verify writes only to outputs/run/ (report-'
                    + 'figures.json is reconciled field-for-field by recomputation, L16). The value-domain half '
                    + 'the profile requires is implemented: src/domains.ts declares '
                    + 'a physically-derived domain for every numeric leaf of the committed simulation-results.json '
                    + 'and report-figures.json — every bound taken from src/config.ts (the audited population, the '
                    + 'sample depths, the price grid, the roll grid), never from the file being checked — and '
                    + 'Step 19 validates every numeric leaf of both artifacts on every run (the step prints the '
                    + 'count), failing if any '
                    + 'leaf is out of domain OR has no declared domain (so a new unbounded field cannot slip in)',
            },
        ],
    },
    20: {
        claims: [{
                id: 'DICE-11', coverage: 'full',
                note: 'the credited amount is asserted fully determined by (roll, band, stake) — credit == '
                    + 'floor8(stake × PAYOUT_NUMERATOR/basisPoints) with zero tolerance, across '
                    + 'all four modes and both wins and losses, anti-circularly (the served multiplier field is '
                    + 'never read); reinforces the exact payout arithmetic of Steps 8 and 9',
            }],
    },
    21: {
        claims: [{
                id: 'DICE-14', coverage: 'full',
                note: 'the quoted multiplier (the formula value 99/winChance for each captured band; on wins '
                    + 'Step 7 binds the served value to the same rational, 9900/basisPoints) is strictly '
                    + 'decreasing across the plan\'s win-chance points (exactly the plan\'s) and the quotient '
                    + 'PAYOUT_NUMERATOR/basisPoints across every basis point of the price grid, with zero '
                    + 'inversions (the monotonicity half); the odds-bounds half is Step 10',
            }],
    },
    22: {
        claims: [{
                id: 'DICE-22', coverage: 'full',
                note: 'the serial-dependence half — lag-1 autocorrelation and a Wald–Wolfowitz runs test on the '
                    + 'captured rolls in capture order, judged by the framework cross-game rule |lag1 z| < 3 '
                    + 'AND runs p ≥ 0.01; the uniform-lattice-fit half is Step 17 (also informational). A numbered '
                    + 'step that reports INFO and CANNOT FAIL: it returns PASS or INFO, never FAIL or FLAG, so it is '
                    + 'not scored (policy INFORMATIONAL, 2026-09-29) — verify.ts reports an INFO but never counts it '
                    + 'and never lets it change the verdict class. tests/mutations.json M-LIVESERIAL sorts the rolls '
                    + 'into value order, driving lag-1 → +1 and collapsing the runs test, and this step reports '
                    + 'INFO; npm run mutate records that as an INFORMATIONAL SIGNAL, not a kill — the run goes red '
                    + 'on other checks (the reproduction gate, and Step 19, whose recomputed report figures change '
                    + 'when the bets are reordered), never because this step failed',
            }],
    },
};
/**
 * Checks this casino's design makes inapplicable. The reason is the declaration: a check that simply
 * never appears is a gap, and one that says why it cannot apply is an answer. Each corresponds to an
 * `applies` predicate in the profile that evaluates false against declarations/liqd.dice.json.
 */
exports.NOT_APPLICABLE = [
    {
        id: 'DICE-16',
        reason: 'applies={path: money.balanceField, notNull: true} is false — money.balanceField is null: '
            + 'the capture carries no running wallet-balance ledger, so there is no consecutive-bet delta to '
            + 'reconcile (declared L5 / R-CREDIT). The stakeWallet / winningAmountWallet settle-response '
            + 'fields ARE reconciled exactly against the settlement rule in Step 10, but the profile '
            + 'explicitly does not count those as a balance ledger',
    },
    {
        id: 'DICE-24',
        reason: 'applies={path: rng.operatorVerifier.published, eq: true} is false — '
            + 'rng.operatorVerifier.published is false: LIQD publishes no verifier source file, so there is no '
            + 'derive.js to hash-match to computeRoll. LIQD\'s verify ENDPOINT exists and is used as a second '
            + 'check (a stored reply for every captured round, Step 6, and the boundary probes E17, Step 15); '
            + 'the limitations register (DICE-30) carries the row',
    },
];
/**
 * Checks a package artifact answers rather than a scored step. `none` means the artifact does not
 * exist — recorded so the gap is machine-readable instead of merely absent.
 */
exports.PACKAGE_CHECKS = [
    {
        id: 'DICE-09', artifact: 'tests/dice/rngTests.ts', coverage: 'full',
        note: 'the mocha unit suite (npx mocha prints the count) reproduces captured production rounds of '
            + 'every phase from their revealed seeds, the specification\'s HMAC vectors (tests/dice/rngSpecTests.ts), '
            + 'and LIQD\'s production verify-endpoint replies of evidence E17, against the shipped src/rng.ts',
    },
    {
        id: 'DICE-23', artifact: 'MANIFEST.md#verification-results', coverage: 'full',
        note: 'the S5 fairness-integrity matrix carries the full standardized framework set S5-1 … '
            + 'S5-8 between the <!-- S5-MATRIX:START/END --> markers, each row exactly one verdict '
            + '(Pass / Flag / Hard Fail / Not tested — disclosed) tied to a scored step or the capture: '
            + 'S5-1 seed substitution [Step 1,2], S5-2 client-seed [Step 14], S5-3 stake-conditional '
            + '[Step 18], S5-4 cherry-picking [Step 17], S5-5 seed-rotation race [Not tested — disclosed, '
            + 'archetype-excluded, R-RACE], S5-6 multiplier tampering [Step 7,20 — dice has no table, the '
            + 'multiplier is the 9900/basisPoints formula re-derived from the band], S5-7 nonce '
            + 'manipulation [Step 4], S5-8 modulo bias [Step 16,17 + rng rejection sampling]. The '
            + 'dice-specific band-hunt probe is carried as a supplementary row (S5-D1) after the markers, '
            + 'per the framework convention. Validated against the framework check-exploit-matrix rules',
    },
    {
        id: 'DICE-25', artifact: 'MANIFEST.md#verify-a-bet', coverage: 'full',
        note: 'MANIFEST "Verify a bet" carries an ordered six-step player path stating, in order and in the declaration\'s own field names: where the seed is revealed '
            + '(by the rotation that ends the epoch), which fields to use '
            + '(hashedServerSeed, serverSeed, clientSeed, nonce, params{lower,upper,inverted}, betAmount), the '
            + 'exact commitment encoding (SHA-256(utf8(serverSeed)), the hex string as text, not its bytes), '
            + 'the roll formula (HMAC-SHA256 over clientSeed:nonce:0, maxFair rejection, draw/100), the '
            + 'half-open win rule, the 9900/basisPoints multiplier and the round-down credit; '
            + 'a fully worked instance on a production round follows in the same section',
    },
    {
        id: 'DICE-28', artifact: 'package.json (test) + .nvmrc + tests/ + src/config.ts (AUDIT_ID)', coverage: 'full',
        note: 'a fresh clone runs npm test to 22/22 Full Pass in ~8 s (standalone verify.js ~1 s) with '
            + 'the runtime pinned (engines >=22.23.1 <23, .nvmrc 22.23.1) and pinned artifacts untouched; the audit ID is '
            + 'SET — AUDIT_ID = PF-2026-LQ04 in src/config.ts, emitted into '
            + 'verification-results.json and printed in README.md / MANIFEST.md, with verdictQualifier '
            + '"production": the scored capture is the liqd.com production capture of 7 to 10 November 2026. '
            + 'The remaining release-gate sub-requirements hold: npm run test:full regenerates the '
            + 'simulation and diffs it field-by-field into outputs/run/diff.json with nothing beyond '
            + 'tolerance (the Pass-1 experiment is deterministic — DICE-20 — so regeneration reproduces '
            + 'byte-for-byte), the scored-step count in README/MANIFEST/verify equals the suite, and the '
            + 'runtime is pinned',
    },
    {
        id: 'DICE-29', artifact: 'tests/mutations.json + tests/structural-forgeries.json + tests/mutation-survivors.json', coverage: 'full',
        note: 'step-named mutations and structural forgeries run by tests/mutate.ts in a disposable copy '
            + '(npm run mutate prints the counts); every step that can fail is failed by at least one entry '
            + '— Step 17 by the forged served-band early return; Step 22 cannot fail and its entry is an '
            + 'INFO signal, counted separately from the kills. No survivor is declared: removing the rejection '
            + 'guard from the audit RNG is killed by Step 17, whose 10,000-nonce replay holds a cell with a first '
            + 'chunk in the rejected tail (L11 remains about the operator\'s server); forgery scripts that re-pin the '
            + 'hash they invalidate are included',
    },
    {
        id: 'DICE-30', artifact: 'MANIFEST.md#limitations-and-trust + MANIFEST.md#evidence', coverage: 'full',
        note: 'MANIFEST.md carries the declared-limitations register with magnitudes and a '
            + 'load-bearing-premises table (each ASSUMED row with "could the data contradict it?"); MANIFEST Evidence '
            + 'numbers every exhibit; declaration package.internalFoldersPresent is empty, so no '
            + 'internal working material ships in the package',
    },
];
/** The block emitted alongside the step results. */
function profileCoverageBlock() {
    return {
        game: exports.PROFILE_GAME,
        profileVersion: exports.PROFILE_VERSION,
        notApplicable: exports.NOT_APPLICABLE,
        packageChecks: exports.PACKAGE_CHECKS,
    };
}
/** The label fields for one scored step, to be merged into its emitted record. */
function labelFor(step) {
    const entry = exports.STEP_CLAIMS[step];
    if (!entry)
        return { profileIds: [], profileChecks: [], profileNote: 'no mapping declared for this step' };
    return entry.claims.length
        ? { profileIds: entry.claims.map(c => c.id), profileChecks: entry.claims }
        : { profileIds: [], profileChecks: [], profileNote: entry.reason ?? 'no reason given' };
}

  },
  "src/report-figures.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Derived report figures — the numbers the report cites that are neither a scored step's verdict
 * nor a simulation statistic, computed here from the pinned dataset and written to
 * `outputs/report-figures.json` by `npm run verify`.
 *
 * WHY THIS FILE EXISTS. A figure that appears only in prose has no producing artifact, and a
 * reader cannot re-derive it without reimplementing the auditor's reasoning. That is the class the
 * framework's prose check calls an "orphan figure", and it is how a hand-typed number survives a
 * review: it looks like a measurement and is actually a memory. Everything below is quoted in the
 * report — the settled-RTP span, the settlement residual's direction, the boundary-hit
 * expectation — so it is computed by committed code from the hash-pinned capture and
 * emitted, not typed.
 *
 * Where a comparison is at the scale of floating-point noise it is done in EXACT integer or
 * rational arithmetic (see `creditResidualSign`), because a double subtraction at 5e-9 reports the
 * subtraction's own error as if it were the measurement.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeReportFigures = computeReportFigures;
const config_1 = require("./config");
const exact_chi2_1 = require("./exact-chi2");
const stats_1 = require("./stats");
function computeReportFigures(bets, seeds) {
    const wins = bets.filter((b) => b.win);
    // ── settled RTP per (band, stake) under the production floor8 rule, vs the nominal 99%, exactly ──
    // rtp = (W / RANGE) · (creditUnits / stakeUnits)  vs  (1 − HOUSE_EDGE)
    // Both sides are rationals over integers, so the comparison carries no rounding at all.
    const edgeNum = BigInt(Math.round((1 - config_1.HOUSE_EDGE) * 1e8)); // 99000000 at a 1% edge
    let below = 0, above = 0, exact = 0, minRtp = Infinity, maxRtp = -Infinity;
    for (const b of bets) {
        const stakeUnits = (0, config_1.amountUnits)(b.betAmount);
        const w = BigInt((0, config_1.discreteWinCount)(b.params));
        const creditUnits = (0, config_1.floor8CreditUnits)(b.betAmount, b.params);
        // (w/RANGE)·(creditUnits/stakeUnits) vs edgeNum/1e8  ⇒  1e8·w·creditUnits vs edgeNum·RANGE·stakeUnits
        const lhs = 100000000n * w * creditUnits;
        const rhs = edgeNum * BigInt(config_1.RANGE) * stakeUnits;
        if (lhs < rhs)
            below++;
        else if (lhs > rhs)
            above++;
        else
            exact++;
        const r = (Number(w) / config_1.RANGE) * (Number(creditUnits) / Number(stakeUnits));
        if (r < minRtp)
            minRtp = r;
        if (r > maxRtp)
            maxRtp = r;
    }
    // ── settlement residual against the raw un-rounded product ────────────────────
    // In the OPERATOR'S number system: decimal stake × the exact rational multiplier 9900/basisPoints.
    // Doing this on binary64(stake) × binary64(multiplier) instead reports every win as rounded and
    // none as exact, because the representation error in binary64(0.1) survives into the comparison.
    // See creditResidualSign.
    let down = 0, up = 0, onProduct = 0, maxAbs = 0, net = 0, floatMisses = 0;
    for (const b of wins) {
        const sign = (0, config_1.creditResidualSign)(b.winningAmount, b.betAmount, b.params);
        if (sign < 0)
            down++;
        else if (sign > 0)
            up++;
        else
            onProduct++;
        const d = (0, config_1.creditResidual)(b.winningAmount, b.betAmount, b.params);
        net += d;
        if (Math.abs(d) > maxAbs)
            maxAbs = Math.abs(d);
        if ((0, config_1.floor8CreditUnitsServed)(b.betAmount, (0, config_1.quotedMultiplier)(b.params)) !== (0, config_1.amountUnits)(b.winningAmount))
            floatMisses++;
    }
    // ── boundary power: which bets could ever land on their upper bound at all ────
    // The roll ceiling is (RANGE − 1)/SCALE = 99.99, so a band with upper = 100 has an upper bound
    // no roll can reach — those bets carry ZERO power against the half-open rule.
    const reachable = bets.filter((b) => Math.round(b.params.upper * config_1.SCALE) <= config_1.RANGE - 1).length;
    const upperHits = bets.filter((b) => Math.round(Number(b.roll) * config_1.SCALE) === Math.round(b.params.upper * config_1.SCALE)).length;
    const lowerHits = bets.filter((b) => Math.round(Number(b.roll) * config_1.SCALE) === Math.round(b.params.lower * config_1.SCALE)).length;
    // How much power the SETTLED data has over the half-open rule, measured rather than argued.
    // Rule A (shipped): win ⇔ roll ∈ [lower, upper). Rule B: [lower, upper]. If the two reproduce the
    // same captured win flags, no settled bet can choose between them and the rule rests on the
    // production verifier probes (evidence E17) alone.
    let modelsDisagree = 0, okHalfOpen = 0, okInclusive = 0;
    for (const b of bets) {
        const roll = Number(b.roll);
        const winHalfOpen = (0, config_1.diceWin)(roll, b.params), winInclusive = (0, config_1.diceWinInclusive)(roll, b.params);
        if (winHalfOpen !== winInclusive)
            modelsDisagree++;
        if (winHalfOpen === !!b.win)
            okHalfOpen++;
        if (winInclusive === !!b.win)
            okInclusive++;
    }
    // Pass-2 screen power: the smallest flag count the exact binomial tail rejects at ALPHA.
    const p0 = (0, exact_chi2_1.cherryFlagRate)();
    let minRejectable = seeds.length + 1, pAtMin = 0;
    for (let k = 0; k <= seeds.length; k++) {
        const pk = (0, stats_1.binomialTailP)(seeds.length, k, p0);
        if (pk < config_1.ALPHA) {
            minRejectable = k;
            pAtMin = pk;
            break;
        }
    }
    // Amounts in exact 1e-8 units from the served decimal strings; converted to a double once, at the end.
    const U = 100000000;
    const sum = (list, f) => list.reduce((a, b) => a + ((0, config_1.amountUnits)(f(b)) ?? 0n), 0n);
    const wageredU = sum(bets, (b) => b.betAmount), returnedU = sum(bets, (b) => b.winningAmount);
    const wagered = Number(wageredU) / U, returned = Number(returnedU) / U;
    const meanRoll = bets.reduce((a, b) => a + Number(b.roll), 0) / bets.length;
    const phases = {};
    for (const ph of config_1.EXPECTED_PHASES) {
        const pb = bets.filter((b) => b.phaseId === ph.id);
        const w = sum(pb, (b) => b.betAmount), r = sum(pb, (b) => b.winningAmount);
        const cells = new Map();
        for (const b of pb) {
            const k = `${(0, config_1.bandMode)(b.params)}/${(0, config_1.payoutBasisPoints)(b.params)}`;
            cells.set(k, (cells.get(k) ?? 0) + 1);
        }
        const counts = [...cells.values()];
        phases[ph.id] = {
            bets: pb.length, epochs: seeds.filter((s) => s.phaseId === ph.id).length, wins: pb.filter((b) => b.win).length,
            stakeUsdt: Number(ph.stake),
            wageredUsdt: Number(w) / U, returnedUsdt: Number(r) / U, realizedRtpPct: w > 0n ? (Number(r) / Number(w)) * 100 : 0,
            classes: cells.size, fewestPerClass: counts.length ? Math.min(...counts) : 0, mostPerClass: counts.length ? Math.max(...counts) : 0,
        };
    }
    const modes = { under: 0, over: 0, inside: 0, outside: 0 };
    for (const b of bets)
        modes[(0, config_1.bandMode)(b.params)]++;
    const vReplies = bets.filter((b) => b.verifier && b.verifier.status === 200).length;
    const vEqual = bets.filter((b) => b.verifier && b.verifier.status === 200
        && b.verifier.outcome.roll === b.roll && b.verifier.outcome.win === b.win && b.verifier.outcome.multiplier === b.multiplier).length;
    const playerEpochs = seeds.filter((s) => s.playerSet);
    const playerEpochSet = new Set(playerEpochs.map((s) => s.epoch));
    return {
        bets: bets.length,
        wins: wins.length,
        settledRtp: {
            belowNominal: below, aboveNominal: above, exactlyNominal: exact,
            minPct: minRtp * 100, maxPct: maxRtp * 100, nominalPct: (1 - config_1.HOUSE_EDGE) * 100,
            anyAtOrAbove100: maxRtp >= 1,
        },
        settlementResidual: {
            roundedDown: down, roundedUp: up, exactlyOnProduct: onProduct,
            maxAbsUsdt: maxAbs, netUsdt: net, floatClosedFormMisses: floatMisses,
        },
        boundary: {
            betsWithReachableUpperBound: reachable,
            betsWithUnreachableUpperBound: bets.length - reachable,
            expectedUpperBoundHits: reachable / config_1.RANGE,
            observedUpperBoundHits: upperHits,
            observedLowerBoundHits: lowerHits,
            betsWhereBoundaryModelsDisagree: modelsDisagree,
            winFlagsReproducedHalfOpen: okHalfOpen,
            winFlagsReproducedInclusiveBothEnds: okInclusive,
        },
        cherryPickPower: {
            seeds: seeds.length, nullFlagRate: p0, expectedFlags: seeds.length * p0,
            minRejectableFlags: minRejectable, pAtMinRejectable: pAtMin,
            alpha: config_1.ALPHA, seedAlphaNominal: config_1.SIM_CHERRY_SEED_ALPHA,
        },
        live: { wageredUsdt: wagered, returnedUsdt: returned, realizedRtpPct: (returned / wagered) * 100, meanRoll },
        phases,
        modes,
        verifier: { replies: vReplies, equalServedRound: vEqual },
        playerSeeds: { epochs: playerEpochs.length, distinct: new Set(playerEpochs.map((s) => s.clientSeed)).size, bets: bets.filter((b) => playerEpochSet.has(b.epoch)).length },
    };
}

  },
  "src/rng.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * PROVENANCE (header rewritten on 10 Nov 2026; everything below this comment is the
 * module byte for byte as integrated on 20 Oct 2026).
 *
 * This module was BUILT FROM A WRITTEN SPECIFICATION, not ported from LIQD's code: the implementer
 * read only a specification and a module-interface file (docs/INTERFACE.md), and never opened
 * LIQD's code or its client bundle. The specification shipped in this release, docs/ALGORITHM.md, is
 * re-grounded on production sources only (LIQD's public pages, the liqd.com production capture of
 * 7 to 10 November 2026 and LIQD's production verify endpoint); the derivation it specifies is the
 * one this module implements, and tests/dice/rngSpecTests.ts runs the specification's production
 * vectors against it.
 *
 * LIQD's own verifier is NOT the source of this module. Its replies are run as a SECOND CHECK: the
 * stored verify reply of every captured round (Step 6) and the boundary probes of evidence E17
 * (Step 15, tests/dice/rngTests.ts). The audit's draw-bias bound is src/bias.ts, built on this
 * module's maxFairFor.
 *
 * Units: diceRoll returns the roll as an INTEGER in hundredths (0..9999); callers divide by
 * SCALE (src/config.ts) for the 0.00..99.99 value LIQD serves. Server seeds must be lowercase hex
 * (the commitment is over the seed text); every captured seed is.
 *
 * Agreement with the capture is re-measured on every run: Step 5 of `npm run verify` recomputes
 * every captured roll with this module, and Step 1 every commitment.
 *
 * An input no captured round reaches: when all eight chunks of a digest are rejected this module
 * throws. LIQD's public technical page describes a redraw at cursor + 1,000,000 for that case
 * (specification O2); it has probability about (1.7e-6)^8 per draw and was not observed (L11).
 */
// LIQD Dice outcome derivation, clean-room implementation.
// Built only from ALGORITHM.md (the spec) and INTERFACE.md (export names/types).
// Section references below (e.g. "§1.2") point into ALGORITHM.md.
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256Buffer = sha256Buffer;
exports.commitHash = commitHash;
exports.getProvablyFairHmacSalt = getProvablyFairHmacSalt;
exports.maxFairFor = maxFairFor;
exports.generateProvablyFairNumber = generateProvablyFairNumber;
exports.diceRoll = diceRoll;
const crypto_1 = require("crypto");
// §1.1: the server seed is lowercase hex (32 chars witnessed). We require
// non-empty, even-length, lowercase hex so that both the ASCII form (used by
// the commitment) and the decoded-byte form (used as HMAC key) are unambiguous.
// Uppercase is rejected because it would decode to the same key but hash to a
// different commitment.
const HEX_SEED = /^(?:[0-9a-f]{2})+$/;
function assertServerSeed(serverSeed) {
    if (typeof serverSeed !== "string" || !HEX_SEED.test(serverSeed)) {
        throw new Error("serverSeed must be non-empty, even-length, lowercase hex");
    }
}
function assertNonNegInt(name, value) {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error(`${name} must be a non-negative safe integer`);
    }
}
const TWO_POW_32 = 4294967296;
// SHA-256 over raw bytes, lowercase hex.
function sha256Buffer(buf) {
    return (0, crypto_1.createHash)("sha256").update(buf).digest("hex");
}
// §1.2: the published commitment is SHA-256 over the seed's ASCII characters,
// NOT over the bytes the hex decodes to.
function commitHash(serverSeedHexString) {
    assertServerSeed(serverSeedHexString);
    return sha256Buffer(Buffer.from(serverSeedHexString, "ascii"));
}
// §2 Step 1: message = clientSeed ":" nonce ":" cursor, nonce and cursor as
// plain base-10 with no padding. Encoding to bytes (UTF-8, O7) happens at the
// HMAC call site.
function getProvablyFairHmacSalt(clientSeed, nonce, cursor) {
    if (typeof clientSeed !== "string")
        throw new Error("clientSeed must be a string");
    assertNonNegInt("nonce", nonce);
    assertNonNegInt("cursor", cursor);
    return `${clientSeed}:${nonce.toString(10)}:${cursor.toString(10)}`;
}
// §2 Step 2: LIMIT = floor(2^32 / N) * N. A 32-bit chunk is accepted only if
// it is strictly below this value, so every residue mod N is equally likely.
function maxFairFor(range) {
    if (!Number.isSafeInteger(range) || range < 1 || range > TWO_POW_32) {
        throw new Error("range must be an integer in [1, 2^32]");
    }
    return Math.floor(TWO_POW_32 / range) * range;
}
// §2 Step 1: HMAC-SHA256 keyed by the hex-DECODED server seed, over the UTF-8
// message.
function hmacDigest(serverSeed, clientSeed, nonce, cursor) {
    assertServerSeed(serverSeed);
    const key = Buffer.from(serverSeed, "hex");
    const message = Buffer.from(getProvablyFairHmacSalt(clientSeed, nonce, cursor), "utf8");
    return (0, crypto_1.createHmac)("sha256", key).update(message).digest();
}
// §2 Step 2: walk the 32-byte digest in eight 4-byte big-endian chunks; the
// first chunk below LIMIT gives the draw as chunk mod range. If all eight are
// rejected the spec has no settled continuation (O2), so we throw rather than
// invent one.
function generateProvablyFairNumber(serverSeed, clientSeed, nonce, cursor, range) {
    const limit = maxFairFor(range);
    const digest = hmacDigest(serverSeed, clientSeed, nonce, cursor);
    for (let i = 0; i + 4 <= digest.length; i += 4) {
        const v = digest.readUInt32BE(i);
        if (v < limit)
            return v % range;
    }
    throw new Error("all 32-bit chunks of the digest were rejected (spec O2: continuation unspecified)");
}
// §2 Step 2: the dice roll is the draw over N = 10000 outcomes at cursor 0,
// an integer in hundredths (0..9999 shown as 0.00..99.99).
function diceRoll(serverSeed, clientSeed, nonce) {
    return generateProvablyFairNumber(serverSeed, clientSeed, nonce, 0, 10000);
}

  },
  "src/rtp-claim-switch.js": function (module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTP_CLAIM_RULE_ENFORCED = void 0;
/**
 * RTP-CLAIM enforcement switch for this package, read by ./rtp-claim.
 *
 *   false  the RTP-CLAIM outcome and the per-setting table are computed and printed as INFO;
 *          no verdict moves.
 *   true   the outcome is scored on the game profile's -19 check: a miss is OVERSTATED and the
 *          package verdict RTP FIGURE OVERSTATED (rule 1.2.0); NO_CLAIM, NOTED and PUBLISHED stay
 *          INFO either way.
 *
 * ./rtp-claim is a byte-identical copy of the framework rule (conformance C-13 compares SHA-256s);
 * this file is the only per-package part of it. bin/sync-rtp-claim.mjs creates it with false when
 * it is missing and never overwrites it.
 */
exports.RTP_CLAIM_RULE_ENFORCED = true;

  },
  "src/rtp-claim.js": function (module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RtpClaimAccumulator = exports.ratStr = exports.cmp = exports.mul = exports.sub = exports.add = exports.RTP_CLAIM_PLACES = exports.RTP_CLAIM_BAND = exports.RTP_FIGURE_OVERSTATED_EXIT = exports.RTP_FIGURE_OVERSTATED = exports.RTP_CLAIM_RULE_VERSION = exports.RTP_CLAIM_RULE_ID = exports.RTP_CLAIM_RULE_ENFORCED = void 0;
exports.rtpClaimVerdict = rtpClaimVerdict;
exports.checkNoClaimSource = checkNoClaimSource;
exports.rat = rat;
exports.parseRational = parseRational;
exports.rationalFromDouble = rationalFromDouble;
exports.toFixed = toFixed;
exports.evaluateRtpClaim = evaluateRtpClaim;
exports.rtpClaimStatus = rtpClaimStatus;
exports.formatRtpClaim = formatRtpClaim;
exports.rtpClaimTable = rtpClaimTable;
exports.rtpClaimGate = rtpClaimGate;
/**
 * RTP-CLAIM — the rule for what a casino's published RTP has to mean.
 *
 * 1.0.0 — agreed 2026-09-29. Rule text:
 *
 *   "the casino can publish either
 *    1. a single number ("99% rtp") → every setting has to be within the band of it
 *    2. a range ("rtp 98.65–99.07% depending on settings"), anywhere findable, fairness page or
 *       rules is fine → every setting has to sit inside it, and the range has to be the real
 *       one: bottom = their actual worst setting, top = their actual best (within the band).
 *       no "up to 99%", no range wider than reality
 *    … our audit publishes the full per-setting table …
 *    band: pass if within 0.1pp of what they state, past that on the house side is a fail.
 *    player-favourable never fails"
 *
 * 1.1.0 — NO CLAIM. Agreed 2026-10-01. Rule text:
 *
 *   "locking the claim to the figure shown to players, on the game page, fairness page or help
 *    page. a game with no shown figure is marked no claim and still gets its full per-setting
 *    table."
 *
 * So a claim has a third kind, { kind: 'none', source }: no RTP figure is shown to players. Its
 * source must name every place a figure can be shown (the game page, the fairness page, the help
 * page) and state that no RTP figure is shown there — an absence is stated by listing where it was
 * looked for, never by one look. A no-claim still gets the full per-setting table (true min, true
 * max, every row). Its outcome is NO_CLAIM: never a FAIL, enforced or not, and no setting is a
 * house-side failure, because there is no figure to fall short of. flat and range are unchanged
 * from 1.0.0.
 *
 * 1.2.0 — Methodology v1.1, 2026-10-14: an edge stated in the game's own settings counts as the published
 * figure; the rule is enforced, and a miss is reported as RTP FIGURE OVERSTATED, not NOT PROVABLY FAIR,
 * since the draws themselves pass. What changes:
 *
 *   - PLACES. A figure can be shown on the game page, the fairness page, the help page, the bet
 *     panel, the rules, or in the game settings the casino's site loads (a stated edge or RTP there
 *     counts as published). A no-claim's source names all six.
 *   - PER-SETTING figures. { kind: 'per-setting', figures: { [setting]: rtp }, source }: each row is
 *     held to its own published figure. A row with no figure is 'unstated': printed, never a miss.
 *   - STAKE TIERS (D2). { kind: 'tiered', tiers: [{ tier, rtp, source }], source }: a row carries the
 *     stake tier it was priced at (SettingRtp.tier) and is held to the figure the casino states for
 *     that tier. A tier with no stated figure is 'unstated': printed as information, never a miss.
 *   - NOTED (D3). { kind: 'noted', source, text }: a site-wide line, rakeback, zero-edge or a
 *     promotion. It is recorded and tabled, never tested: outcome NOTED, never a miss.
 *   - REAL FIGURES PUBLISHED (D3). A flat or range claim may carry realFiguresPublished: { source }:
 *     the casino publishes the real per-setting figures elsewhere it controls. A miss then has the
 *     outcome PUBLISHED, never a miss. A bare paytable does NOT qualify (code cannot tell the two
 *     apart; the package's source string must name the published figures, not a paytable).
 *   - THE OUTCOME OF A MISS (D3). A house-side miss is outcome FAIL in the table (a fail until
 *     fixed) and, when enforced, the -19 check's status is OVERSTATED: the package's verdict is
 *     RTP_FIGURE_OVERSTATED ("RTP FIGURE OVERSTATED", exit RTP_FIGURE_OVERSTATED_EXIT), never
 *     "NOT PROVABLY FAIR" and never a pass. Precedence in a package verdict: a failed draw check
 *     (NOT PROVABLY FAIR, exit 1) > INCOMPLETE (exit 3) > RTP FIGURE OVERSTATED (exit 5) > Conditional
 *     Pass (exit 2) > Full Pass (exit 0). See rtpClaimVerdict.
 *
 * Industry context: GLI-11 v2.0 §4.4.1(b) requires the minimum RTP to hold "at all times … at the
 * lowest end of a non-linear paytable" (it names keno spot combinations), and the lab reports the
 * minimum and maximum theoretical payout. This rule is the same idea stated for a published claim.
 *
 * ENFORCEMENT. The rule is scored only where a package switches it on: RTP_CLAIM_RULE_ENFORCED,
 * imported from ./rtp-claim-switch, default false. Off: a package computes the per-setting table
 * and this rule's outcome and PRINTS them as INFO; no verdict moves. On: the outcome is scored on
 * the game profile's -19 check (a miss → OVERSTATED, see 1.2.0); NO_CLAIM, NOTED and PUBLISHED
 * stay INFO either way.
 *
 * Two files, two roles. THIS file is the rule: every package carries a byte-identical copy
 * (src/rtp-claim.ts) and the framework's conformance gate (C-13) compares the copy's SHA-256 with
 * the framework's core/rtp-claim.ts, so no package can change the rule. The SWITCH is the only
 * per-package part: src/rtp-claim-switch.ts beside the copy, a one-line file exporting
 * `RTP_CLAIM_RULE_ENFORCED: boolean`. `node bin/sync-rtp-claim.mjs` re-vendors this file into the
 * packages, creates a missing switch file with false and never overwrites an existing one; its
 * `--check` compares the copies' bytes and reports each package's switch value. Switching a
 * package on is an edit to that package's switch file only.
 *
 * ARITHMETIC. Everything is exact: RTPs, the claim and the band are rationals over bigint. A
 * per-setting RTP is given either as a Rational or as a plain decimal string ("0.99", "98.65%"
 * is NOT accepted — percentages are written as fractions of 1). Nothing here uses a float.
 *
 * This file must stay self-contained (Node built-ins and ./rtp-claim-switch only): it is vendored
 * verbatim.
 */
const fs = __importStar(require("fs"));
const crypto_1 = require("crypto");
const rtp_claim_switch_1 = require("./rtp-claim-switch");
Object.defineProperty(exports, "RTP_CLAIM_RULE_ENFORCED", { enumerable: true, get: function () { return rtp_claim_switch_1.RTP_CLAIM_RULE_ENFORCED; } });
/** Rule identity, printed with every outcome. */
exports.RTP_CLAIM_RULE_ID = 'RTP-CLAIM';
exports.RTP_CLAIM_RULE_VERSION = '1.2.0 (Methodology v1.1: places, per-setting, stake tiers, noted, published, RTP Figure Overstated; agreed 2026-10-14; 1.1.0 2026-10-01; 1.0.0 2026-09-29)';
/** The verdict a package prints when the enforced rule finds a miss and no draw check failed (D3). */
exports.RTP_FIGURE_OVERSTATED = 'RTP FIGURE OVERSTATED';
/** Its exit code: distinct from 0 Full Pass, 1 NOT PROVABLY FAIR, 2 Conditional Pass, 3 INCOMPLETE, 4 stale bundle. */
exports.RTP_FIGURE_OVERSTATED_EXIT = 5;
/**
 * The package verdict with the rule folded in, so every carrier ranks the outcomes the same way:
 * a failed draw check > INCOMPLETE > RTP FIGURE OVERSTATED > Conditional Pass > Full Pass.
 * `overstated` is true when the -19 check's status is OVERSTATED.
 */
function rtpClaimVerdict(v) {
    if (v.fails > 0)
        return { verdict: 'NOT PROVABLY FAIR', exit: 1 };
    if (!v.complete)
        return { verdict: 'INCOMPLETE', exit: 3 };
    if (v.overstated)
        return { verdict: exports.RTP_FIGURE_OVERSTATED, exit: exports.RTP_FIGURE_OVERSTATED_EXIT };
    if (v.opFlags > 0)
        return { verdict: 'PROVABLY FAIR — Conditional Pass', exit: 2 };
    return { verdict: 'PROVABLY FAIR — Full Pass', exit: 0 };
}
/**
 * The band: 0.1 percentage point = 0.001 as a fraction of 1. Policy: a setting within 0.1 pp of
 * what the casino states passes; past that on the house side is a fail; player-favourable
 * (above the claim) never fails. For a range claim the published ends must also be within 0.1 pp
 * of the true worst / best setting ("no range wider than reality").
 */
exports.RTP_CLAIM_BAND = '0.001';
/**
 * Every place the rule lets a casino show its figure (1.1.0: the first three; 1.2.0 adds the bet
 * panel, the rules and the game settings the site loads). A no-claim names each.
 */
exports.RTP_CLAIM_PLACES = ['game page', 'fairness page', 'help page', 'bet panel', 'rules', 'game settings'];
/**
 * A no-claim's source, held to what the rule asks of it: a non-empty string that names each of
 * RTP_CLAIM_PLACES and says "no RTP figure" (case-insensitive). Throws, naming what is missing.
 */
function checkNoClaimSource(source) {
    if (typeof source !== 'string' || source.trim() === '') {
        throw new Error('rtp-claim: a no-claim needs a source saying where a figure was looked for and that none is shown');
    }
    const t = source.toLowerCase();
    const missing = exports.RTP_CLAIM_PLACES.filter(p => !t.includes(p));
    if (!/\bno rtp figure/.test(t))
        missing.push('"no RTP figure"');
    if (missing.length) {
        throw new Error(`rtp-claim: a no-claim source must name the ${exports.RTP_CLAIM_PLACES.join(', the ')} and say "no RTP figure"; missing: ${missing.join(', ')}`);
    }
}
// ---------------------------------------------------------------------------------------------
// exact rationals
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TEN = BigInt(10);
function gcd(a, b) {
    if (a < ZERO)
        a = -a;
    if (b < ZERO)
        b = -b;
    while (b !== ZERO) {
        const t = a % b;
        a = b;
        b = t;
    }
    return a;
}
function rat(n, d = ONE) {
    if (d === ZERO)
        throw new Error('rtp-claim: zero denominator');
    if (d < ZERO) {
        n = -n;
        d = -d;
    }
    const g = gcd(n, d) || ONE;
    return { n: n / g, d: d / g };
}
/** "0.99", "-1.5", "12", "989/1000" → exact Rational. No exponents, no percent signs. */
function parseRational(s) {
    const t = s.trim();
    const frac = /^(-?\d+)\s*\/\s*(\d+)$/.exec(t);
    if (frac)
        return rat(BigInt(frac[1]), BigInt(frac[2]));
    const dec = /^(-?)(\d+)(?:\.(\d+))?$/.exec(t);
    if (!dec)
        throw new Error(`rtp-claim: not an exact decimal or fraction: "${s}"`);
    const sign = dec[1] === '-' ? -ONE : ONE;
    const whole = dec[2];
    const fracDigits = dec[3] ?? '';
    return rat(sign * BigInt(whole + fracDigits), TEN ** BigInt(fracDigits.length));
}
/**
 * The exact value of a finite double (every double is m·2^e). For an RTP a package derives
 * numerically — a recursive EV engine, a double-precision convolution — the rule is then exact on
 * that figure, and the package states the figure's own precision beside it.
 */
function rationalFromDouble(x) {
    if (!Number.isFinite(x))
        throw new Error(`rtp-claim: ${x} is not a finite number`);
    const dv = new DataView(new ArrayBuffer(8));
    dv.setFloat64(0, x);
    const hi = dv.getUint32(0), lo = dv.getUint32(4);
    const sign = hi >>> 31 ? -ONE : ONE;
    const exp = (hi >>> 20) & 0x7ff;
    let mant = (BigInt(hi & 0xfffff) << BigInt(32)) | BigInt(lo);
    let e;
    if (exp === 0)
        e = -1074;
    else {
        mant |= ONE << BigInt(52);
        e = exp - 1075;
    }
    return e >= 0 ? rat(sign * mant * (ONE << BigInt(e)), ONE) : rat(sign * mant, ONE << BigInt(-e));
}
const asRat = (v) => (typeof v === 'string' ? parseRational(v) : rat(v.n, v.d));
const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
exports.add = add;
const sub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
exports.sub = sub;
const mul = (a, b) => rat(a.n * b.n, a.d * b.d);
exports.mul = mul;
const cmp = (a, b) => {
    const l = a.n * b.d, r = b.n * a.d;
    return l < r ? -1 : l > r ? 1 : 0;
};
exports.cmp = cmp;
const ratStr = (a) => `${a.n}/${a.d}`;
exports.ratStr = ratStr;
/** Decimal string with `places` decimals, rounded half away from zero. Display only. */
function toFixed(a, places) {
    const neg = a.n < ZERO;
    const n = neg ? -a.n : a.n;
    const scale = TEN ** BigInt(places);
    const q = (n * scale * BigInt(2) + a.d) / (a.d * BigInt(2));
    const s = q.toString().padStart(places + 1, '0');
    const body = places > 0 ? `${s.slice(0, s.length - places)}.${s.slice(s.length - places)}` : s;
    return (neg && q !== ZERO ? '-' : '') + body;
}
/** Decimal string with `places` decimals, rounded toward -infinity / +infinity. */
function toFixedDir(a, places, dir) {
    const scale = TEN ** BigInt(places);
    const num = a.n * scale;
    let q = num / a.d; // truncates toward zero
    const exact = q * a.d === num;
    if (!exact) {
        if (dir === 'down' && num < ZERO)
            q -= ONE;
        if (dir === 'up' && num > ZERO)
            q += ONE;
    }
    const neg = q < ZERO;
    const s = (neg ? -q : q).toString().padStart(places + 1, '0');
    const body = places > 0 ? `${s.slice(0, s.length - places)}.${s.slice(s.length - places)}` : s;
    return (neg ? '-' : '') + body;
}
const HUNDRED = { n: BigInt(100), d: ONE };
const pct = (a) => toFixed((0, exports.mul)(a, HUNDRED), 6);
const big = (x) => (typeof x === 'bigint' ? x : BigInt(x));
/**
 * a/b < c/d for positive denominators; exact. A double comparison decides only when the two
 * quotients are separated by more than 1e-9 relative — each Number() conversion and division is
 * correctly rounded, so the double quotients carry at most ~4·2^-53 relative error and cannot swap
 * order across that gap. Anything closer (or not finite as a double) is decided in bigint.
 */
function lt(an, ad, cn, cd) {
    const qa = Number(an) / Number(ad), qc = Number(cn) / Number(cd);
    if (Number.isFinite(qa) && Number.isFinite(qc)) {
        const scale = Math.max(Math.abs(qa), Math.abs(qc));
        if (Math.abs(qc - qa) > 1e-9 * scale)
            return qa < qc;
    }
    return big(an) * big(cd) < big(cn) * big(ad);
}
function refOf(lo, hi) {
    const band = parseRational(exports.RTP_CLAIM_BAND);
    if ((0, exports.cmp)(lo, hi) > 0)
        throw new Error('rtp-claim: range claim with min > max');
    return { lo, hi, floor: (0, exports.sub)(lo, band), ceil: (0, exports.add)(hi, band) };
}
const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';
/**
 * Streaming form of the rule, for settings counted in millions (a limbo target grid). Every
 * setting still goes through the exact comparison; only what is RETAINED for the table is capped.
 * Per-setting and tiered claims keep every row (their tables are small and each row has its own
 * reference).
 */
class RtpClaimAccumulator {
    constructor(claim, opts = {}) {
        this.n = 0;
        this.houseFails = 0;
        this.fav = 0;
        this.unstated = 0;
        this.minV = null;
        this.maxV = null;
        this.rows = [];
        this.buckets = new Map();
        this.claim = claim;
        this.retain = opts.retainRows ?? 'all';
        if (claim.kind !== 'none' && !nonEmpty(claim.source))
            throw new Error(`rtp-claim: a ${claim.kind} claim needs a source`);
        const stray = (allowed) => {
            const extra = ['rtp', 'min', 'max', 'figures', 'tiers', 'text', 'realFiguresPublished'].filter(k => k in claim && !allowed.includes(k));
            if (extra.length)
                throw new Error(`rtp-claim: a ${claim.kind === 'none' ? 'no-claim states no figure, but' : `${claim.kind} claim`} carries ${extra.join(', ')}`);
        };
        this.ref = null;
        this.keyed = null;
        switch (claim.kind) {
            case 'none':
                checkNoClaimSource(claim.source);
                stray([]);
                return;
            case 'noted':
                if (!nonEmpty(claim.text))
                    throw new Error('rtp-claim: a noted claim needs the text it records');
                stray(['text']);
                return;
            case 'flat':
            case 'range': {
                stray(claim.kind === 'flat' ? ['rtp', 'realFiguresPublished'] : ['min', 'max', 'realFiguresPublished']);
                const p = claim.realFiguresPublished;
                if (p !== undefined) {
                    if (!nonEmpty(p.source))
                        throw new Error('rtp-claim: realFiguresPublished needs the source of the published figures');
                    if (/paytable/i.test(p.source))
                        throw new Error('rtp-claim: a bare paytable is not published RTP figures (D3); name where the figures themselves are published');
                }
                const lo = claim.kind === 'flat' ? parseRational(claim.rtp) : parseRational(claim.min);
                const hi = claim.kind === 'flat' ? lo : parseRational(claim.max);
                this.ref = refOf(lo, hi);
                return;
            }
            case 'per-setting':
            case 'tiered': {
                stray(claim.kind === 'per-setting' ? ['figures'] : ['tiers']);
                if (this.retain !== 'all')
                    throw new Error(`rtp-claim: a ${claim.kind} claim keeps every row (retainRows 'all')`);
                const m = new Map();
                if (claim.kind === 'per-setting') {
                    for (const [k, v] of Object.entries(claim.figures ?? {})) {
                        const f = parseRational(v);
                        m.set(k, refOf(f, f));
                    }
                }
                else {
                    for (const t of claim.tiers ?? []) {
                        if (!nonEmpty(t.tier) || !nonEmpty(t.source))
                            throw new Error('rtp-claim: every stated tier needs a tier name and a source');
                        if (m.has(t.tier))
                            throw new Error(`rtp-claim: tier "${t.tier}" stated twice`);
                        const f = parseRational(t.rtp);
                        m.set(t.tier, refOf(f, f));
                    }
                }
                if (m.size === 0)
                    throw new Error(`rtp-claim: a ${claim.kind} claim states no figure; use kind 'none'`);
                this.keyed = m;
                return;
            }
            default:
                throw new Error(`rtp-claim: unknown claim kind ${claim.kind}`);
        }
    }
    /**
     * One setting. `num/den` is its exact RTP (den > 0). `label` may be a thunk so a grid of
     * millions does not build millions of strings; `bucket` groups the committed summary; `tier` is
     * the stake tier the setting is priced at (required under a tiered claim).
     */
    add(label, num, den, bucket, tier) {
        if ((typeof den === 'bigint' ? den <= ZERO : den <= 0))
            throw new Error('rtp-claim: non-positive denominator');
        if (typeof num === 'number' && !Number.isSafeInteger(num))
            throw new Error(`rtp-claim: numerator ${num} is not an exact integer`);
        if (typeof den === 'number' && !Number.isSafeInteger(den))
            throw new Error(`rtp-claim: denominator ${den} is not an exact integer`);
        if (this.claim.kind === 'tiered' && !nonEmpty(tier))
            throw new Error('rtp-claim: under a tiered claim every setting needs its stake tier');
        this.n++;
        const name = () => (typeof label === 'string' ? label : label());
        let keptName = null;
        const nm = () => (keptName ?? (keptName = name()));
        let ref = this.ref;
        if (this.keyed) {
            ref = this.keyed.get(this.claim.kind === 'tiered' ? tier : nm()) ?? null;
            if (ref === null)
                this.unstated++;
        }
        // No reference (no claim, noted, unstated): no floor and no ceiling, so neither house-side nor favourable.
        const house = ref !== null && lt(num, den, ref.floor.n, ref.floor.d);
        const fav = !house && ref !== null && lt(ref.ceil.n, ref.ceil.d, num, den);
        if (house)
            this.houseFails++;
        if (fav)
            this.fav++;
        if (this.minV === null || lt(num, den, this.minV.n, this.minV.d))
            this.minV = { s: nm(), n: num, d: den };
        if (this.maxV === null || lt(this.maxV.n, this.maxV.d, num, den))
            this.maxV = { s: nm(), n: num, d: den };
        if (this.retain === 'all' || (house && this.rows.length < this.retain)) {
            const k = { s: nm(), r: rat(big(num), big(den)), ref };
            if (tier !== undefined)
                k.tier = tier;
            this.rows.push(k);
        }
        if (bucket !== undefined) {
            const b = this.buckets.get(bucket);
            if (!b)
                this.buckets.set(bucket, { settings: 1, minN: num, minD: den, maxN: num, maxD: den, house: house ? 1 : 0, fav: fav ? 1 : 0 });
            else {
                b.settings++;
                if (lt(num, den, b.minN, b.minD)) {
                    b.minN = num;
                    b.minD = den;
                }
                if (lt(b.maxN, b.maxD, num, den)) {
                    b.maxN = num;
                    b.maxD = den;
                }
                if (house)
                    b.house++;
                if (fav)
                    b.fav++;
            }
        }
    }
    result() {
        if (this.n === 0 || !this.minV || !this.maxV)
            throw new Error('rtp-claim: no settings — a rule over nothing is not a pass');
        if (this.keyed && this.unstated === this.n)
            throw new Error(`rtp-claim: the ${this.claim.kind} claim holds no setting (every row unstated); use kind 'none'`);
        const band = parseRational(exports.RTP_CLAIM_BAND);
        const loR = rat(big(this.minV.n), big(this.minV.d));
        const hiR = rat(big(this.maxV.n), big(this.maxV.d));
        const minV = this.minV, maxV = this.maxV;
        const claim = this.claim;
        const published = (claim.kind === 'flat' || claim.kind === 'range') && claim.realFiguresPublished !== undefined;
        const gapOf = (r, f) => (0, exports.cmp)(r, f.lo) < 0 ? (0, exports.sub)(r, f.lo) : (0, exports.cmp)(r, f.hi) > 0 ? (0, exports.sub)(r, f.hi) : rat(ZERO);
        const row = (k) => {
            const base = { setting: k.s, ...(k.tier !== undefined ? { tier: k.tier } : {}), rtpExact: (0, exports.ratStr)(k.r), rtpPct: pct(k.r) };
            if (claim.kind === 'none')
                return { ...base, gapPp: null, side: 'no-claim', outcome: 'NO_CLAIM' };
            if (claim.kind === 'noted')
                return { ...base, gapPp: null, side: 'noted', outcome: 'NOTED' };
            if (k.ref === null)
                return { ...base, gapPp: null, side: 'unstated', outcome: 'INFO' };
            const side = (0, exports.cmp)(k.r, k.ref.floor) < 0 ? 'house-side-beyond-band'
                : (0, exports.cmp)(k.r, k.ref.ceil) > 0 ? 'player-favourable' : 'within-band';
            return { ...base, gapPp: toFixed((0, exports.mul)(gapOf(k.r, k.ref), HUNDRED), 6), side,
                outcome: side === 'house-side-beyond-band' && !published ? 'FAIL' : side === 'house-side-beyond-band' ? 'INFO' : 'PASS' };
        };
        const rows = this.rows.map(row);
        if (this.retain !== 'all') {
            // Always carry the two extremes, even when they pass.
            const have = new Set(rows.map(r => r.setting));
            if (!have.has(minV.s))
                rows.unshift(row({ s: minV.s, r: loR, ref: this.ref }));
            if (!have.has(maxV.s) && maxV.s !== minV.s)
                rows.push(row({ s: maxV.s, r: hiR, ref: this.ref }));
        }
        // The honest range, in percent with 2 decimals rounded outward (bottom down, top up): always
        // within 0.01 pp of the truth, so inside the band.
        const trueRange = `${toFixedDir((0, exports.mul)(loR, HUNDRED), 2, 'down')}–${toFixedDir((0, exports.mul)(hiR, HUNDRED), 2, 'up')}%`;
        const buckets = [...this.buckets.entries()].map(([k, b]) => ({
            bucket: k, settings: b.settings,
            minPct: pct(rat(big(b.minN), big(b.minD))), maxPct: pct(rat(big(b.maxN), big(b.maxD))),
            houseSideFailures: b.house, playerFavourable: b.fav,
        }));
        const common = {
            rule: exports.RTP_CLAIM_RULE_ID,
            ruleVersion: exports.RTP_CLAIM_RULE_VERSION,
            enforced: rtp_claim_switch_1.RTP_CLAIM_RULE_ENFORCED,
            bandPp: toFixed((0, exports.mul)(band, HUNDRED), 2),
            claim,
            settings: this.n,
            trueMin: { setting: minV.s, rtpExact: (0, exports.ratStr)(loR), rtpPct: pct(loR) },
            trueMax: { setting: maxV.s, rtpExact: (0, exports.ratStr)(hiR), rtpPct: pct(hiR) },
        };
        const tail = { unstated: this.unstated, rowsComplete: this.retain === 'all', rows, buckets };
        if (claim.kind === 'none' || claim.kind === 'noted') {
            // Nothing to hold: every setting is measured and tabled; none is held to a figure.
            return {
                ...common, houseSideFailures: 0, playerFavourable: 0,
                worst: { setting: minV.s, gapPp: null }, rangeChecks: [],
                outcome: claim.kind === 'none' ? 'NO_CLAIM' : 'NOTED',
                minimalFix: claim.kind === 'none'
                    ? `none — no RTP figure is shown to players, so there is no claim to hold; the true range is ${trueRange}`
                    : `none — a noted line (site-wide, rakeback, zero-edge or promotion) is recorded, not tested; the true range is ${trueRange}`,
                ...tail,
            };
        }
        const rangeChecks = [];
        let worst;
        if (claim.kind === 'flat' || claim.kind === 'range') {
            const f = this.ref;
            worst = { setting: minV.s, gapPp: toFixed((0, exports.mul)(gapOf(loR, f), HUNDRED), 6) };
            if (claim.kind === 'range') {
                const gMin = (0, exports.sub)(f.lo, loR);
                rangeChecks.push({
                    id: 'published-min-vs-true-min',
                    publishedPct: pct(f.lo), truePct: pct(loR), gapPp: toFixed((0, exports.mul)(gMin, HUNDRED), 6),
                    outcome: (0, exports.cmp)(gMin, rat(-band.n, band.d)) < 0 ? 'FAIL' : 'PASS',
                    why: 'the published bottom must be the actual worst setting within the band — no range wider than reality (a bottom above the worst setting shows up as house-side rows)',
                });
                const gMax = (0, exports.sub)(f.hi, hiR);
                rangeChecks.push({
                    id: 'published-max-vs-true-max',
                    publishedPct: pct(f.hi), truePct: pct(hiR), gapPp: toFixed((0, exports.mul)(gMax, HUNDRED), 6),
                    outcome: (0, exports.cmp)(gMax, band) > 0 ? 'FAIL' : 'PASS',
                    why: 'the published top must be the actual best setting within the band — no "up to", no range wider than reality',
                });
            }
        }
        else {
            // per-setting / tiered: the row furthest below its own reference.
            let w = null;
            for (const k of this.rows) {
                if (k.ref === null)
                    continue;
                const g = gapOf(k.r, k.ref);
                if (w === null || (0, exports.cmp)(g, w.g) < 0)
                    w = { s: k.s, g };
            }
            const ww = w;
            worst = { setting: ww.s, gapPp: toFixed((0, exports.mul)(ww.g, HUNDRED), 6) };
        }
        const miss = this.houseFails > 0 || rangeChecks.some(c => c.outcome === 'FAIL');
        const outcome = !miss ? 'PASS' : published ? 'PUBLISHED' : 'FAIL';
        let minimalFix;
        if (outcome === 'PASS')
            minimalFix = 'none — the claim holds for every setting it states a figure for';
        else if (outcome === 'PUBLISHED') {
            minimalFix = `none — the figure is missed by ${this.houseFails} setting(s), but the real per-setting figures are published (${claim.realFiguresPublished.source}); the true range is ${trueRange}`;
        }
        else if (claim.kind === 'flat') {
            const f = this.ref;
            minimalFix = `publish the real range "rtp ${trueRange} depending on settings", or change the ${this.houseFails} setting(s) below ${pct(f.floor)}% so each returns at least ${pct(f.floor)}%`;
        }
        else if (claim.kind === 'range') {
            const parts = [];
            if (this.houseFails > 0)
                parts.push(`${this.houseFails} setting(s) sit below the published bottom by more than the band`);
            for (const c of rangeChecks)
                if (c.outcome === 'FAIL')
                    parts.push(`${c.id} off by ${c.gapPp} pp`);
            minimalFix = `publish the real range "rtp ${trueRange} depending on settings" (${parts.join('; ')})`;
        }
        else {
            const what = claim.kind === 'tiered'
                ? `tier(s) ${[...new Set(this.rows.filter(k => k.ref !== null && (0, exports.cmp)(k.r, k.ref.floor) < 0).map(k => k.tier))].join(', ')}`
                : `${this.houseFails} setting(s)`;
            minimalFix = `publish the real figure for ${what} (worst ${worst.setting} at ${worst.gapPp} pp), or change them so each returns at least its published figure less the band`;
        }
        return { ...common, houseSideFailures: this.houseFails, playerFavourable: this.fav, worst, rangeChecks, outcome, minimalFix, ...tail };
    }
}
exports.RtpClaimAccumulator = RtpClaimAccumulator;
/** The rule over a list: every row retained (the full per-setting table). */
function evaluateRtpClaim(input, claim, opts = {}) {
    const acc = new RtpClaimAccumulator(claim, opts);
    for (const s of input) {
        const r = asRat(s.rtp);
        acc.add(s.setting, r.n, r.d, undefined, s.tier);
    }
    return acc.result();
}
/** Outcomes that are never a miss, enforced or not. */
const NEVER_A_MISS = ['NO_CLAIM', 'NOTED', 'PUBLISHED'];
/**
 * The status a package's -19 step takes from this rule. Not enforced → 'INFO' (printed, never
 * counted, verdict unchanged). Enforced → 'PASS', or 'OVERSTATED' for a miss (1.2.0: the
 * package verdict is RTP FIGURE OVERSTATED, see rtpClaimVerdict — never NOT PROVABLY FAIR).
 * NO_CLAIM, NOTED and PUBLISHED → 'INFO' either way.
 */
function rtpClaimStatus(r) {
    if (!rtp_claim_switch_1.RTP_CLAIM_RULE_ENFORCED || NEVER_A_MISS.includes(r.outcome))
        return 'INFO';
    return r.outcome === 'PASS' ? 'PASS' : 'OVERSTATED';
}
/** The claim in one phrase, for the console. */
function claimText(c) {
    switch (c.kind) {
        case 'flat': return `flat ${pct(parseRational(c.rtp))}%`;
        case 'range': return `range ${pct(parseRational(c.min))}–${pct(parseRational(c.max))}%`;
        case 'per-setting': return `per-setting figures (${Object.keys(c.figures).length} stated)`;
        case 'tiered': return `stake tiers ${c.tiers.map(t => `${t.tier} ${pct(parseRational(t.rtp))}%`).join(' · ')}`;
        case 'none': return 'no claim: no RTP figure shown to players';
        case 'noted': return `noted, not tested: "${c.text}"`;
    }
}
/**
 * Console lines for a verifier. Deliberately free of the "[PASS] / [FAIL] / [INFO] Step N"
 * markers and of upper-case verdict words while the rule is not enforced, so no existing
 * output parser (mutation batteries, release bars) can read it as a step.
 */
function formatRtpClaim(r, maxRows = 10) {
    const n = r.settings.toLocaleString('en-US');
    const off = 'informational (RTP_CLAIM_RULE_ENFORCED = false) — reported only, verdict unchanged';
    if (r.claim.kind === 'none' || r.claim.kind === 'noted') {
        return [
            `rtp-claim: ${r.enforced ? `ENFORCED — ${r.outcome}, never scored as a miss` : off}`,
            `rtp-claim:   ${claimText(r.claim)} — source: ${r.claim.source}`,
            `rtp-claim:   true range ${r.trueMin.rtpPct}–${r.trueMax.rtpPct}% over ${n} settings · true min ${r.trueMin.rtpPct}% (${r.trueMin.setting}) · true max ${r.trueMax.rtpPct}% (${r.trueMax.setting})`,
            `rtp-claim:   outcome ${r.enforced ? r.outcome : r.outcome.toLowerCase().replace('_', ' ')} (never a miss, enforced or not) · per-setting table: `
                + (r.rowsComplete ? `all ${n} rows` : `${r.rows.length.toLocaleString('en-US')} rows retained of ${n}, ${r.buckets.length} buckets`),
        ];
    }
    const said = (o) => (!r.enforced ? o.toLowerCase() : o === 'FAIL' ? exports.RTP_FIGURE_OVERSTATED : o);
    const lines = [
        `rtp-claim: ${r.enforced ? `ENFORCED — ${said(r.outcome)}` : off}`,
        `rtp-claim:   claim ${claimText(r.claim)} — source: ${r.claim.source}`,
        `rtp-claim:   band ±${r.bandPp} pp · ${n} settings · true min ${r.trueMin.rtpPct}% (${r.trueMin.setting}) · true max ${r.trueMax.rtpPct}% (${r.trueMax.setting})`,
        `rtp-claim:   house side beyond band: ${r.houseSideFailures.toLocaleString('en-US')} · player-favourable beyond band: ${r.playerFavourable.toLocaleString('en-US')}`
            + (r.unstated ? ` · no figure stated: ${r.unstated.toLocaleString('en-US')} (information only)` : '')
            + ` · worst ${r.worst.setting} at ${r.worst.gapPp} pp`,
    ];
    if ((r.claim.kind === 'flat' || r.claim.kind === 'range') && r.claim.realFiguresPublished) {
        lines.push(`rtp-claim:   real per-setting figures published: ${r.claim.realFiguresPublished.source}`);
    }
    for (const c of r.rangeChecks)
        lines.push(`rtp-claim:   ${c.id}: published ${c.publishedPct}% vs true ${c.truePct}% (${c.gapPp} pp) → ${r.enforced ? c.outcome : c.outcome.toLowerCase()}`);
    const bad = r.rows.filter(x => x.side === 'house-side-beyond-band').slice(0, maxRows);
    for (const b of bad)
        lines.push(`rtp-claim:     house side ${b.setting}${b.tier !== undefined ? ` [tier ${b.tier}]` : ''}: ${b.rtpPct}% (${b.gapPp} pp)`);
    if (r.houseSideFailures > bad.length)
        lines.push(`rtp-claim:     … ${(r.houseSideFailures - bad.length).toLocaleString('en-US')} more house-side setting(s) — see the committed table`);
    lines.push(`rtp-claim:   outcome ${said(r.outcome)}${r.enforced ? '' : ` (a miss is scored as ${exports.RTP_FIGURE_OVERSTATED.toLowerCase()} only when enforced)`} · minimal fix: ${r.minimalFix}`);
    return lines;
}
/**
 * The committed per-setting table (outputs/rtp-claim-table.json): the result minus `enforced`,
 * which is policy, not measurement — so flipping the switch does not rewrite evidence. One row per
 * line, so a table of ten thousand settings stays diffable.
 */
function rtpClaimTable(r, meta) {
    const { enforced: _e, rows, buckets, ...rest } = r;
    const head = JSON.stringify({ ...meta, ...rest }, null, 2).replace(/\n}$/, '');
    const list = (xs) => xs.length === 0 ? '[]' : `[\n${xs.map(x => `    ${JSON.stringify(x)}`).join(',\n')}\n  ]`;
    return `${head},\n  "buckets": ${list(buckets)},\n  "rows": ${list(rows)}\n}\n`;
}
/**
 * The verifier hook. Recomputes nothing itself: it takes this run's result and table text, holds
 * the committed table to both (bytes and pin), and returns the lines to print. A committed table
 * that disagrees is evidence that no longer matches its code — the caller treats it as a
 * reproduction failure (exit 1) whether or not the rule is enforced, because it is about the
 * artifact, not about the claim.
 */
function rtpClaimGate(r, tableText, committedPath, pinnedSha256) {
    let committed = null;
    try {
        committed = fs.readFileSync(committedPath, 'utf8');
    }
    catch {
        committed = null;
    }
    const sha = committed === null ? null : (0, crypto_1.createHash)('sha256').update(committed).digest('hex');
    const bytesMatch = committed === tableText;
    const pinMatch = sha === pinnedSha256;
    const tableMatches = bytesMatch && pinMatch;
    const lines = formatRtpClaim(r);
    lines.push(`rtp-claim:   committed table ${committedPath.split(/[\\/]/).slice(-2).join('/')}: `
        + (committed === null ? 'ABSENT'
            : `${bytesMatch ? 'equals this run' : 'DIFFERS from this run'}; sha256 ${sha.slice(0, 16)}… ${pinMatch ? 'matches' : 'DOES NOT MATCH'} the pin`));
    const s = rtpClaimStatus(r);
    const status = s === 'INFO' ? 'INFO' : !tableMatches ? 'FAIL' : s;
    return { result: r, tableMatches, status, lines };
}

  },
  "src/rtp-settings.js": function (module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTP_CLAIM_TABLE_SHA256 = exports.RTP_CLAIM_TABLE = exports.RTP_CLAIM_STEP = exports.RTP_CLAIM = void 0;
exports.computeRtpClaim = computeRtpClaim;
exports.rtpClaimTableText = rtpClaimTableText;
exports.runRtpClaimGate = runRtpClaimGate;
/**
 * RTP-CLAIM wiring — LIQD Dice: the per-setting exact RTP table and the claim it is held to.
 *
 * The rule is src/rtp-claim.ts, a byte-identical copy of the framework's core/rtp-claim.ts (its
 * SHA-256 is compared by conformance C-13), and the enforcement switch RTP_CLAIM_RULE_ENFORCED is
 * this package's src/rtp-claim-switch.ts, read by that copy. Rule 1.2.0 (Methodology v1.1) 2026-10-14: the claim
 * source names the game page, one of the rule's six places (decision D3); an enforced miss would be RTP FIGURE OVERSTATED. Rule 1.0.0 agreed
 * 2026-09-29.
 *
 * SETTINGS. The price of a band depends only on its width: every band width on the roll grid whose
 * multiplier is above 1×, in basis points bp = 1 … 9899 (src/config.ts PRICE_GRID_MIN_BPS /
 * PRICE_GRID_MAX_BPS; multiplier 9900/bp), 9,899 settings; normal and inverted bands of the same
 * width are the same price. This is the whole grid, not LIQD's accepted range: the capture played
 * 1 % … 98 %, and LIQD's own limits were not read (MANIFEST limitation L7).
 * EXACT RTP. The half-open band wins on exactly bp of the 10,000 draws (src/config.ts discreteWinCount)
 * × the quoted multiplier PAYOUT_NUMERATOR / bp = 9900/bp (the exact quotient the operator serves,
 * src/config.ts PAYOUT_NUMERATOR). The round-down of a credit to 8 decimals lowers a settled RTP by
 * less than one 0.00000001 unit per win (outputs/report-figures.json settledRtp), which is not in
 * this table.
 * CLAIM. Flat 1 % house edge = RTP 99/100: the figure the live page shows the player (liqd.com
 * "Edge: 1.00%", RTP 99%, read 2026-10-01, evidence/rtp-page-labels-2026-10-01.json), the same as
 * HOUSE_EDGE = 0.01 (src/config.ts).
 *
 *   npm run rtp-claim:write    rewrite outputs/rtp-claim-table.json and print its SHA-256 to pin
 */
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto_1 = require("crypto");
const rtp_claim_1 = require("./rtp-claim");
const config_1 = require("./config");
exports.RTP_CLAIM = {
    kind: 'flat',
    rtp: '0.99',
    source: 'LIQD Dice: the game page liqd.com/originals/dice shows "Released: September 2026 | Edge: 1.00%" and RTP 99% (read 2026-10-01, evidence/rtp-page-labels-2026-10-01.json). Same figure as HOUSE_EDGE = 0.01, a flat 1 % house edge (src/config.ts HOUSE_EDGE; declaration outcome.edge.claimed 0.01)',
};
/** The scored step that carries DICE-19 (src/profile-map.ts). */
exports.RTP_CLAIM_STEP = 15;
exports.RTP_CLAIM_TABLE = path.join(__dirname, '..', 'outputs', 'rtp-claim-table.json');
/** SHA-256 of the committed table — re-pin with the run that rewrote it (npm run rtp-claim:write). */
exports.RTP_CLAIM_TABLE_SHA256 = '4c1c589c87cc3351209005e145311f400bc07d994519d4e940e19ed6e3c17707';
function computeRtpClaim() {
    if (!Number.isInteger(config_1.PAYOUT_NUMERATOR))
        throw new Error('PAYOUT_NUMERATOR is not an integer');
    const acc = new rtp_claim_1.RtpClaimAccumulator(exports.RTP_CLAIM);
    for (let bp = config_1.PRICE_GRID_MIN_BPS; bp <= config_1.PRICE_GRID_MAX_BPS; bp++) {
        // P(win) × multiplier = bp/RANGE × PAYOUT_NUMERATOR/bp
        acc.add(`win chance ${(bp / 100).toFixed(2)}%`, BigInt(bp) * BigInt(config_1.PAYOUT_NUMERATOR), BigInt(config_1.RANGE) * BigInt(bp));
    }
    return acc.result();
}
function rtpClaimTableText(r) {
    return (0, rtp_claim_1.rtpClaimTable)(r, {
        package: 'liqd/dice', game: 'dice',
        settingSpace: 'every band width on the roll grid whose multiplier is above 1x, win chance 0.01 % … 98.99 % in basis points (multiplier 9900/bp); the production capture played 1 % … 98 %',
        rtpMethod: 'exact rational: bp/10000 winning draws × the quoted multiplier 9900/bp',
    });
}
function runRtpClaimGate() {
    const r = computeRtpClaim();
    return (0, rtp_claim_1.rtpClaimGate)(r, rtpClaimTableText(r), exports.RTP_CLAIM_TABLE, exports.RTP_CLAIM_TABLE_SHA256);
}
if (require.main === module) {
    const text = rtpClaimTableText(computeRtpClaim());
    fs.writeFileSync(exports.RTP_CLAIM_TABLE, text);
    console.log(`wrote outputs/rtp-claim-table.json sha256 ${(0, crypto_1.createHash)('sha256').update(text).digest('hex')}`);
}

  },
  "src/runtime.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * The SUPPORTED RUNTIME, declared in code and enforced before any scored step runs.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────────────────────────
 * The pristine package was extracted twice. On Node v22.23.1 it returned 21/21 Full Pass. On
 * a Node 24 release it FAILED, because one probability differed by a single ULP.
 *
 * WHICH PROBABILITY. The field reported is
 * `cherryPickPower.pAtMinRejectable` in `outputs/report-figures.json` — a BINOMIAL upper-tail
 * probability, `binomialTailP` in `src/stats.ts`, whose every term carries a `p ** i` and a
 * `(1 - p) ** (n - i)`. ECMAScript leaves the `**` operator implementation-approximated exactly as
 * it leaves `Math.exp` and `Math.log` (§21.3.2), so V8 is free to change the last bit between
 * releases. Step 19 compares the committed `report-figures.json` against a fresh recomputation as
 * EXACT JSON TEXT, so one bit in one field of one group is enough to fail the step.
 *
 * The chi-squared p-values carry the same exposure — they are built from `Math.exp`/`Math.log` and
 * Step 16 requires `uni.pValue === ` its own recomputation — and would fail the same way. Both are
 * instances of one rule: this suite compares stored statistics against recomputation with `===` on
 * purpose (S-EXACT).
 *
 * Two honest repairs exist. The first is to make every statistical calculation deterministic across
 * runtimes — a from-scratch exp/log, or a decimal library — which is a large change to the numerical
 * core of the audit and would itself need validating. The second, taken here, is to state the
 * runtime the package was actually validated on, enforce it, and narrow the advertised prerequisite
 * to match. What is NOT acceptable is a blanket epsilon on the comparison: the exact comparisons are
 * what make a forged artifact visible, and widening them to hide a runtime disagreement would trade
 * a reproducibility bug for a detection hole. Hashes, roll values, counts, winning multipliers and
 * currency comparisons stay exact regardless.
 *
 * WHAT WAS ACTUALLY EXECUTED. Every figure in this package was produced on the runtime named in
 * VALIDATED_RUNTIME below. Node 24 was NOT re-tested by this repository, before or after the fix —
 * the pin exists precisely so that an untested runtime is refused rather than silently scored. The
 * failing run is an external report, not our observation: our record of it names v24.13.1, the
 * report has since also cited a different Node 24 patch release, and this package deliberately
 * does not restate a patch version it did not witness. What the pin acts on is the MAJOR, and Node
 * 24 is what both reports agree on. Declared as limitation L17.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATED_RUNTIME = exports.SUPPORTED_NODE_MAJOR = void 0;
exports.nodeMajor = nodeMajor;
exports.isSupportedRuntime = isSupportedRuntime;
exports.unsupportedRuntimeMessage = unsupportedRuntimeMessage;
exports.assertSupportedRuntime = assertSupportedRuntime;
/** The Node major version this package is validated for and will run on. */
exports.SUPPORTED_NODE_MAJOR = 22;
/** The exact runtime every committed figure was produced on. */
exports.VALIDATED_RUNTIME = 'Node.js v22.23.1 (npm 10.9.8)';
function nodeMajor(version = process.versions.node) {
    return Number(version.split('.')[0]);
}
function isSupportedRuntime(version = process.versions.node) {
    return nodeMajor(version) === exports.SUPPORTED_NODE_MAJOR;
}
function unsupportedRuntimeMessage(version = process.versions.node) {
    return [
        '',
        '══════════════════════════════════════════════════════════',
        '  UNSUPPORTED RUNTIME — verification refused',
        '══════════════════════════════════════════════════════════',
        `  Running on   : Node v${version}`,
        `  Supported    : Node ${exports.SUPPORTED_NODE_MAJOR}.x`,
        `  Validated on : ${exports.VALIDATED_RUNTIME}`,
        '',
        '  This suite compares stored statistics against recomputation: integers exactly, and',
        '  libm-dependent floats at 1e-14 absolute + 1e-12 relative (src/diff.ts). Its',
        '  probabilities are built from ** and from Math.exp/Math.log, which ECMAScript leaves',
        '  implementation-approximated, so a different V8 can move them — that is how',
        '  report-figures.json disagreed on cherryPickPower.pAtMinRejectable under Node 24.',
        '  Rather than widen the comparison — which is what makes a forged artifact visible —',
        '  this package refuses to score itself on a runtime it was not validated on.',
        '',
        `  Install Node ${exports.SUPPORTED_NODE_MAJOR}.x and re-run. Nothing was written; no evidence was touched.`,
        '══════════════════════════════════════════════════════════',
        '',
    ].join('\n');
}
/** Refuse to run on an unvalidated runtime. Called before any scored step, and before any write. */
function assertSupportedRuntime() {
    if (isSupportedRuntime())
        return;
    console.error(unsupportedRuntimeMessage());
    process.exit(1);
}

  },
  "src/sim-checks.js": function (module, exports, require, __filename, __dirname) {
"use strict";
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
 * A convergence block that asserts `Number.isFinite(pt.se)` and nothing else accepts anything:
 * changing the first plotted standard error from 0.03127046289391956 to 123456 and re-pinning
 * the artifact returned a Full Pass. The chart does not catch it either:
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAMILY_WISE_BOUND = exports.STEP_16_BOUND = exports.S5_POINTS = exports.S4_ROWS = exports.SCORED_STATISTICAL_PREDICATES = exports.RECONSTRUCTION_MAX_WINS = exports.RECONSTRUCTION_MAX_RESIDUAL = exports.SIM_SCHEMA_VERSION = void 0;
exports.simSeedAt = simSeedAt;
exports.rowSE = rowSE;
exports.crossTargetPoint = crossTargetPoint;
exports.crossTargetTheory = crossTargetTheory;
exports.reconstructReturn = reconstructReturn;
exports.reconstructionTolerance = reconstructionTolerance;
exports.recoverWinCount = recoverWinCount;
exports.convergenceSE = convergenceSE;
exports.validateConvergenceSeries = validateConvergenceSeries;
exports.runsStatistic = runsStatistic;
/**
 * The schema `src/simulate.ts` emits. Artifacts without the field are schema 1 (historical).
 * Schema 3 (22 October 2026) is schema 2 plus the 98-target edge convergence: `pass1.targets[]`
 * (one row per target, with its seed-stream position and its integer win counts at every mark) and
 * `pass1.targetConvergence`, the cross-target mean of those rows. Every schema-2 block is unchanged.
 */
exports.SIM_SCHEMA_VERSION = 3;
const node_crypto_1 = require("node:crypto");
const config_1 = require("./config");
/**
 * The Pass-1 seed at a given position of the pinned stream: HMAC-SHA256(SIM_MASTER_SEED, counter)
 * truncated to 16 bytes, 32 hex characters. The SAME expression as `randSeed()` in
 * `src/simulate.ts` (unchanged since 19 September 2026); restated here so Step 16 can re-derive a
 * target's seeds from its counter without running the producer.
 */
function simSeedAt(counter) {
    return (0, node_crypto_1.createHmac)('sha256', Buffer.from(config_1.SIM_MASTER_SEED, 'hex')).update(String(counter)).digest().subarray(0, 16).toString('hex');
}
/**
 * The standard error of a band or target row's simulated RTP at the band's EXACT lattice win
 * probability `pr`: SE = sqrt(pr·(m − rtp)² + (1 − pr)·rtp²) / sqrt(n). The expression the
 * effective-edge rows have used since v1.0.0, single-sourced for the target rows.
 */
function rowSE(pr, m, rtp, n) {
    return Math.sqrt(pr * (m - rtp) ** 2 + (1 - pr) * rtp ** 2) / Math.sqrt(n);
}
/**
 * One point of the cross-target convergence series: the MEAN simulated RTP over the targets at a
 * common per-target sample size, and its standard error. The targets run on disjoint stretches of
 * the seed stream, so they are independent and the variance of the mean is the sum of the
 * per-target variances over T²:
 *
 *     rtp = Σ rtpₜ / T          se = sqrt(Σ seₜ²) / T
 *
 * where rtpₜ and seₜ are the target's own running RTP and standard error at that mark
 * (`convergenceSE`, SE = σ/√n). Summed in the targets' declared order. The producer and Step 16
 * both call this, Step 16 on values it has first re-derived from the integer win counts.
 */
function crossTargetPoint(perTarget) {
    let sr = 0, sv = 0;
    for (const t of perTarget) {
        sr += t.rtp;
        sv += t.se ** 2;
    }
    const T = perTarget.length;
    return { rtp: sr / T, se: Math.sqrt(sv) / T };
}
/** The theoretical value of the cross-target mean: Σ theoreticalRTPₜ / T, summed in declared order. */
function crossTargetTheory(theo) {
    let s = 0;
    for (const t of theo)
        s += t;
    return s / theo.length;
}
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
 * does the opposite of its job. Setting the `over 98` band's RTP to
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
 * Every published RTP of the committed artifact satisfies step 3 EXACTLY — the nine effective-edge
 * rows and seven under-50 checkpoints, and (since 22 October 2026) the 98 target rows and their 490
 * per-mark checkpoints — so the honest artifact needs no tolerance at all and none is spent on it.
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
exports.RECONSTRUCTION_MAX_RESIDUAL = 0.25;
/**
 * Reconstruction is defined up to this win count. Above it the accumulation replay would be slow
 * AND the derived tolerance would approach half a win, so the candidate stops being unambiguous:
 * the check FAILS CLOSED instead of guessing. The deepest count in this audit is 9,997,675.
 */
exports.RECONSTRUCTION_MAX_WINS = 50000000;
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
function reconstructReturn(wins, multiplier) {
    let won = 0;
    for (let k = 0; k < wins; k++)
        won += multiplier;
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
function reconstructionTolerance(wins) {
    const derived = wins * (wins + 2) * Number.EPSILON;
    const floor = 4 * Number.EPSILON * Math.max(1, wins);
    return Math.min(exports.RECONSTRUCTION_MAX_RESIDUAL, Math.max(derived, floor));
}
/**
 * Recover the integer win count behind a published running RTP, and VERIFY the published RTP
 * against the return that count reconstructs to.
 *
 * `stored` is schema 2's own count: when present it must be a valid integer count AND agree with
 * the reconstruction, so storing the field cannot be used to launder an RTP that no win count
 * produces.
 */
function recoverWinCount(rtp, n, multiplier, stored) {
    const fail = (reason, wins = NaN, residual = NaN, source = 'reconstructed', reconstructedRTP = NaN) => ({ ok: false, wins, residual, source, match: 'none', reconstructedRTP, reason });
    if (!Number.isFinite(rtp) || !Number.isFinite(n) || !Number.isFinite(multiplier))
        return fail('non-finite input');
    if (!Number.isInteger(n) || n <= 0)
        return fail(`sample size ${n} is not a positive integer`);
    if (!(multiplier > 0))
        return fail(`multiplier ${multiplier} is not positive`);
    if (rtp < 0)
        return fail(`rtp ${rtp} is negative`);
    const raw = (rtp * n) / multiplier;
    if (!Number.isFinite(raw))
        return fail('rtp·n/m is not finite');
    const wins = Math.round(raw);
    const residual = Math.abs(raw - wins);
    // Outer, fail-closed ceiling — applied BEFORE the reconstruction runs, so a hostile RTP cannot
    // buy an arbitrarily long accumulation loop.
    if (residual > exports.RECONSTRUCTION_MAX_RESIDUAL) {
        return fail(`rtp ${rtp} at n=${n} implies ${raw} wins, ${residual} from the nearest integer (cap ${exports.RECONSTRUCTION_MAX_RESIDUAL}) — no integer win count produces this RTP`, wins, residual);
    }
    if (wins < 0 || wins > n)
        return fail(`recovered win count ${wins} is outside [0, ${n}]`, wins, residual);
    if (wins > exports.RECONSTRUCTION_MAX_WINS) {
        return fail(`recovered win count ${wins} is past the depth (${exports.RECONSTRUCTION_MAX_WINS}) at which this reconstruction is defined — a deeper artifact must store its counts (schema ${exports.SIM_SCHEMA_VERSION})`, wins, residual);
    }
    // ── RECONSTRUCT THE PRODUCER'S RETURN FROM THE CANDIDATE INTEGER COUNT, THEN VERIFY ──────────
    // This is the check. `wins` is a COUNT, and `reconstructReturn(wins, m) / n` is the only RTP that
    // count can report. A rule that stopped at `Math.round` would accept an RTP that implied
    // 40,000.2 wins; this one reconstructs 40,000 wins, gets 0.99, sees that a published
    // 0.99000495 is not 0.99, and rejects the row.
    const reconstructedReturn = reconstructReturn(wins, multiplier);
    const reconstructedRTP = reconstructedReturn / n;
    const tol = reconstructionTolerance(wins);
    const match = reconstructedRTP === rtp
        ? 'exact'
        : (residual <= tol ? 'bounded' : 'none');
    if (match === 'none') {
        return fail(`rtp ${rtp} at n=${n} implies ${raw} wins; the candidate integer count ${wins} reconstructs to `
            + `${reconstructedRTP} (return ${reconstructedReturn} over ${n} bets), ${residual} wins away and outside `
            + `the derived arithmetic tolerance ${tol} — no integer win count produces this RTP`, wins, residual, 'reconstructed', reconstructedRTP);
    }
    const how = match === 'exact'
        ? `count ${wins} reconstructs EXACTLY to the published RTP (return ${reconstructedReturn} over ${n} bets)`
        : `count ${wins} reconstructs to ${reconstructedRTP}, ${residual} wins from the published RTP — inside the derived tolerance ${tol}`;
    if (stored !== undefined) {
        if (typeof stored !== 'number' || !Number.isInteger(stored)) {
            return fail(`stored win count ${JSON.stringify(stored)} is not an integer`, wins, residual, 'stored', reconstructedRTP);
        }
        if (stored < 0 || stored > n)
            return fail(`stored win count ${stored} is outside [0, ${n}]`, stored, residual, 'stored', reconstructedRTP);
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
function convergenceSE(n, rtp, wins, multiplier) {
    const p = wins / n;
    const varr = p * (multiplier - rtp) ** 2 + (1 - p) * (0 - rtp) ** 2;
    return Math.sqrt(varr / n);
}
/**
 * Validate a whole convergence series: every checkpoint's win count, its standard error, and the
 * cumulative consistency BETWEEN checkpoints (the marks are nested prefixes of ONE run, so the win
 * count cannot fall, and it cannot rise by more than the extra bets that were played).
 *
 * `theoreticalRTP` is used only to COUNT points that land exactly on theory. That count is reported
 * and never scored: an exact hit is a legitimate outcome under the null.
 */
function validateConvergenceSeries(points, multiplier, theoreticalRTP) {
    const out = [];
    const failures = [];
    let exactlyOnTheory = 0;
    let exactReconstructions = 0;
    let prevN = 0, prevWins = 0;
    for (const pt of points) {
        // JSON NUMBERS, not anything Number() will coerce. A stringified statistic is not the statistic:
        // `"0.031270…"` would coerce to the right value and quietly change the artifact's type contract.
        const typesOk = typeof pt?.n === 'number' && typeof pt?.rtp === 'number' && typeof pt?.se === 'number';
        const n = Number(pt?.n), rtp = Number(pt?.rtp), storedSE = Number(pt?.se);
        const rec = typesOk
            ? recoverWinCount(rtp, n, multiplier, pt?.wins)
            : { ok: false, wins: NaN, residual: NaN, source: 'reconstructed', match: 'none', reconstructedRTP: NaN, reason: `n/rtp/se must be JSON numbers (got ${typeof pt?.n}/${typeof pt?.rtp}/${typeof pt?.se})` };
        const onTheory = typesOk && rtp === theoreticalRTP;
        if (onTheory)
            exactlyOnTheory++;
        if (rec.ok && rec.match === 'exact')
            exactReconstructions++;
        let ok = rec.ok;
        let reason = rec.reason;
        if (ok) {
            if (!(n > prevN)) {
                ok = false;
                reason = `sample size ${n} does not exceed the previous checkpoint's ${prevN}`;
            }
            else if (rec.wins < prevWins) {
                ok = false;
                reason = `win count fell from ${prevWins} to ${rec.wins} between nested checkpoints`;
            }
            else if (rec.wins - prevWins > n - prevN) {
                ok = false;
                reason = `win count rose by ${rec.wins - prevWins} over only ${n - prevN} additional bets`;
            }
        }
        const expectedSE = ok ? convergenceSE(n, rtp, rec.wins, multiplier) : NaN;
        if (ok && !(Number.isFinite(storedSE) && storedSE === expectedSE)) {
            ok = false;
            reason = `stored SE ${storedSE} != ${expectedSE} recomputed from (n=${n}, rtp=${rtp}, wins=${rec.wins}, m=${multiplier})`;
        }
        if (!ok)
            failures.push(`n=${Number.isFinite(n) ? n : String(pt?.n)}: ${reason}`);
        out.push({ n, ok, wins: rec.wins, winSource: rec.source, winMatch: rec.match, expectedSE, storedSE, exactlyOnTheory: onTheory, reason });
        if (rec.ok) {
            prevN = n;
            prevWins = rec.wins;
        }
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
function runsStatistic(runs, n1, n) {
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
 * Union bound over all seven: ≈ 0.0300625 — dominated by Pass 1 (0.01) plus the two scored Pass-2
 * screens (0.01 each: the served-band return and the flag-count binomial), with the 5·SE row and
 * final-point screens (107 rows + 2 points) contributing about 6.25e-5 in total.
 *
 * NOT IN THE LIST, ON PURPOSE: the pooled real-roll uniformity χ² (DICE-22). It is INFORMATIONAL
 * since 2026-09-29 — a rejection there prints INFO and cannot fail Step 17 (tests/steps/simulation.ts,
 * section (e)) — so it spends nothing from this budget. Only its artifact reconciliation is scored,
 * and that is a deterministic identity, not a statistical screen.
 *
 * NOT A STEP LEVEL EITHER. "The step's level is α = 0.01" must not be published for STEP 16, which
 * also scores S4 and S5: α = 0.01 is the level of S1–S3, and Step 16's own union bound is
 * STEP_16_BOUND ≈ 0.0100625. Small, but the published number has to be the one the decision rule
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
 */
exports.SCORED_STATISTICAL_PREDICATES = [
    { id: 'S1', step: 16, screen: 'Pass-1 draw uniformity χ², two-sided (upper: non-uniform; lower: too uniform)', size: 'α/3 = 3.333e-3' },
    { id: 'S2', step: 16, screen: 'Pass-1 lag-1 autocorrelation |z| vs the two-sided critical z', size: 'α/3 = 3.333e-3' },
    { id: 'S3', step: 16, screen: 'Pass-1 Wald–Wolfowitz runs test, two-sided', size: 'α/3 = 3.333e-3' },
    { id: 'S4', step: 16, screen: 'nine effective-edge bands and 98 over-mode targets, each |simRTP − theory| ≤ 5·SE + 1e-4', size: '≈5.73e-7 per row, ≈6.13e-5 over 107' },
    { id: 'S5', step: 16, screen: 'the under-50 convergence final point and the 98-target mean RTP, each within 5·SE + 1e-4 of theory', size: '≈5.73e-7 each, ≈1.15e-6 for both' },
    { id: 'S6', step: 17, screen: 'cherry-pick flag count, exact one-sided binomial', size: '≤ α = 0.01 (discrete, achieved size below α)' },
    { id: 'S7', step: 17, screen: 'served-band return, one-sided normal lower tail', size: 'α = 0.01' },
];
/** Rows scored by S4 (nine bands + 98 targets) and points scored by S5 (two series' final points). */
exports.S4_ROWS = 9 + 98;
exports.S5_POINTS = 2;
/**
 * Union bound over the screens STEP 16 ALONE scores: S1–S3 family-wise at α, plus the 107 5·SE row
 * checks (S4) and the two 5·SE final-point checks (S5). It exists so that "the step's level is α = 0.01" cannot be published for a step that also
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
exports.STEP_16_BOUND = 0.01 + exports.S4_ROWS * 5.733e-7 + exports.S5_POINTS * 5.733e-7;
/** Family-wise upper bound over SCORED_STATISTICAL_PREDICATES, by the union bound. */
exports.FAMILY_WISE_BOUND = exports.STEP_16_BOUND + 0.01 + 0.01;

  },
  "src/stats.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Statistical helpers for the LIQD Dice simulation + verify steps.
 * Chi-squared p-values via exact regularized incomplete gamma.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.combination = combination;
exports.binomialTailP = binomialTailP;
exports.regularizedGamma = regularizedGamma;
exports.logGamma = logGamma;
exports.chiSquaredPValue = chiSquaredPValue;
exports.chiSquaredTest = chiSquaredTest;
exports.lag1Autocorrelation = lag1Autocorrelation;
exports.runsTest = runsTest;
exports.normalQuantile = normalQuantile;
exports.inverseCriticalZ = inverseCriticalZ;
exports.twoSidedNormalP = twoSidedNormalP;
exports.normalLowerTailP = normalLowerTailP;
function combination(n, k) {
    if (k < 0 || k > n)
        return 0;
    if (k === 0 || k === n)
        return 1;
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
function binomialTailP(n, k, p) {
    if (k <= 0)
        return 1;
    if (k > n)
        return 0;
    let s = 0;
    for (let i = k; i <= n; i++)
        s += combination(n, i) * p ** i * (1 - p) ** (n - i);
    return Math.min(1, s);
}
function regularizedGamma(a, x) {
    if (x < 0 || a <= 0)
        return NaN;
    if (x === 0)
        return 0;
    const gln = logGamma(a);
    if (x < a + 1) {
        let ap = a;
        let sum = 1 / a;
        let del = sum;
        for (let n = 0; n < 200; n++) {
            ap += 1;
            del *= x / ap;
            sum += del;
            if (Math.abs(del) < Math.abs(sum) * 1e-14)
                break;
        }
        return sum * Math.exp(-x + a * Math.log(x) - gln);
    }
    else {
        let b = x + 1 - a;
        let c = 1 / 1e-300;
        let d = 1 / b;
        let h = d;
        for (let i = 1; i <= 200; i++) {
            const an = -i * (i - a);
            b += 2;
            d = an * d + b;
            if (Math.abs(d) < 1e-300)
                d = 1e-300;
            c = b + an / c;
            if (Math.abs(c) < 1e-300)
                c = 1e-300;
            d = 1 / d;
            const delta = d * c;
            h *= delta;
            if (Math.abs(delta - 1) < 1e-14)
                break;
        }
        return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
    }
}
function logGamma(x) {
    const c = [
        76.18009172947146, -86.50532032941677, 24.01409824083091,
        -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
    ];
    let y = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++)
        ser += c[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function chiSquaredPValue(chiSq, df) {
    return 1 - regularizedGamma(df / 2, chiSq / 2);
}
function chiSquaredTest(observed, expected) {
    if (observed.length !== expected.length)
        throw new Error('length mismatch');
    // Pools cells with expected < 5 inward from BOTH ends. At Pass-2 n=50 over 25 cells
    // (expected 2/cell) this pools the front and back to ≥5 and leaves interior cells at 2,
    // producing a nonstandard pooled statistic. That is sound in Pass 2 because the same
    // pooling is applied identically to every bootstrap replicate and to the observed value,
    // so the empirical p-value stays valid regardless of the pooling rule.
    const obs = [...observed];
    const exp = [...expected];
    while (obs.length > 2 && exp[0] < 5) {
        obs[1] += obs[0];
        exp[1] += exp[0];
        obs.shift();
        exp.shift();
    }
    while (obs.length > 2 && exp[exp.length - 1] < 5) {
        const n = obs.length;
        obs[n - 2] += obs[n - 1];
        exp[n - 2] += exp[n - 1];
        obs.pop();
        exp.pop();
    }
    let chi2 = 0;
    for (let i = 0; i < obs.length; i++) {
        if (exp[i] > 0)
            chi2 += (obs[i] - exp[i]) ** 2 / exp[i];
    }
    const df = obs.length - 1;
    return { chi2, df, pValue: chiSquaredPValue(chi2, df) };
}
function lag1Autocorrelation(series) {
    const n = series.length;
    let mean = 0;
    for (let i = 0; i < n; i++)
        mean += series[i];
    mean /= n;
    let num = 0, den = 0;
    for (let i = 0; i < n - 1; i++)
        num += (series[i] - mean) * (series[i + 1] - mean);
    for (let i = 0; i < n; i++)
        den += (series[i] - mean) ** 2;
    return den === 0 ? 0 : num / den;
}
function runsTest(series) {
    const n = series.length;
    let n1 = 0, runs = 1;
    let prev = series[0];
    if (prev === 1)
        n1++;
    for (let i = 1; i < n; i++) {
        if (series[i] === 1)
            n1++;
        if (series[i] !== prev) {
            runs++;
            prev = series[i];
        }
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
function normalQuantile(p) {
    if (!(p > 0 && p < 1))
        return NaN;
    const q = p - 0.5;
    let r;
    if (Math.abs(q) <= 0.425) {
        r = 0.180625 - q * q;
        return q * (((((((2509.0809287301226727 * r + 33430.575583588128105) * r + 67265.770927008700853) * r + 45921.953931549871457) * r + 13731.693765509461125) * r + 1971.5909503065514427) * r + 133.14166789178437745) * r + 3.387132872796366608)
            / (((((((5226.495278852545925 * r + 28729.085735721942674) * r + 39307.89580009271061) * r + 21213.794301586595867) * r + 5394.1960214247511077) * r + 687.1870074920579083) * r + 42.313330701600911252) * r + 1);
    }
    r = q < 0 ? p : 1 - p;
    r = Math.sqrt(-Math.log(r));
    let val;
    if (r <= 5) {
        r -= 1.6;
        val = (((((((7.7454501427834140764e-4 * r + 0.0227238449892691845833) * r + 0.24178072517745061177) * r + 1.27045825245236838258) * r + 3.64784832476320460504) * r + 5.7694972214606914055) * r + 4.6303378461565452959) * r + 1.42343711074968357734)
            / (((((((1.05075007164441684324e-9 * r + 5.475938084995344946e-4) * r + 0.0151986665636164571966) * r + 0.14810397642748007459) * r + 0.68976733498510000455) * r + 1.6763848301838038494) * r + 2.05319162663775882187) * r + 1);
    }
    else {
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
function inverseCriticalZ(alpha) {
    return -normalQuantile(alpha / 2);
}
function normalCDF(z) {
    return 0.5 * (1 + erf(z / Math.SQRT2));
}
/** Two-sided normal tail p-value for a z-score — lets a verifier re-derive runsP from runsZ. */
function twoSidedNormalP(z) {
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
function normalLowerTailP(z) {
    return normalCDF(z);
}
function erf(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
        - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return Math.sign(x) * y;
}

  },
  "src/types.js": function (module, exports, require, __filename, __dirname) {
"use strict";
// Types mirror the scored dataset data/dice-prod-5936bets.json: the liqd.com production capture of
// 7 to 10 November 2026 (four capture files, phases A, D, A+, C and X), converted to the package shape
// { meta, seeds[], bets[] }. Field names match the dataset verbatim.
Object.defineProperty(exports, "__esModule", { value: true });

  },
  "tests/steps/anti-circularity.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Step 13: Anti-Circularity — the verifier's independence from operator data.
 * The theoretical quantities (win probability, multiplier, edge) are pure arithmetic over
 * the roll grid and band geometry — they never read an operator payout/odds field. To prove
 * the check is falsifiable (not a vacuous PASS), we run a NEGATIVE CONTROL: corrupt one
 * recomputed roll and confirm the determinism logic would reject it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
/**
 * Literal tally over the 10,000-point grid: apply the win rule to every draw and count.
 * This is the genuinely arithmetic-error-immune anchor — it cannot share a scaling or
 * rounding mistake with the closed form, because it never scales a bound at all.
 */
function enumCount(p) {
    let c = 0;
    for (let d = 0; d < config_1.RANGE; d++)
        if ((0, config_1.diceWin)(d / config_1.SCALE, p))
            c++;
    return c;
}
function run(ctx) {
    const { bets, seedMap } = ctx;
    // Independent recompute for a sample bet uses ONLY (serverSeed, clientSeed, nonce, band):
    const b = bets.find(x => seedMap.has(x.hashedServerSeed));
    const ss = seedMap.get(b.hashedServerSeed);
    const trueRoll = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce) / config_1.SCALE;
    const corrupted = (trueRoll + 1) % 100; // deliberately wrong roll
    // Negative control. A `|x+1 − x| > 1e-9` form would be tautological, so this uses the EXACT
    // finiteness-guarded predicate Step 5 applies, and requires it ACCEPT the true
    // recomputed roll while REJECTING both a corrupted roll and a non-numeric (NaN) served value.
    const accepts = (roll) => (0, config_1.servedRollMatches)(roll, trueRoll);
    const negControlRejects = accepts(trueRoll) && !accepts(corrupted) && !accepts(NaN);
    // Theoretical values are derived from arithmetic, independent of the served fields:
    const p = (0, config_1.discreteWinProbability)(b.params);
    const m = (0, config_1.quotedMultiplier)(b.params);
    const arithmeticOnly = Number.isFinite(p) && Number.isFinite(m);
    // ── Enumeration cross-check ────────────────────────────────────────────────
    // The closed form (discreteWinCount) is the fast path; the tally is the anchor.
    // They must agree on EVERY distinct band in the dataset. This is the check that
    // catches a ceil/floor scaling of the bounds: IEEE-754 puts many 2-dp products just off
    // their integer, and a ceil/floor closed form then disagrees with the tally.
    const distinct = new Map();
    for (const bet of bets) {
        distinct.set(`${bet.params.lower}|${bet.params.upper}|${bet.params.inverted}`, bet.params);
    }
    let tallyMismatches = 0;
    let firstMismatch = '';
    for (const params of distinct.values()) {
        if ((0, config_1.discreteWinCount)(params) !== enumCount(params)) {
            tallyMismatches++;
            if (!firstMismatch) {
                firstMismatch = `${JSON.stringify(params)}: closed-form ${(0, config_1.discreteWinCount)(params)} vs tally ${enumCount(params)}`;
            }
        }
    }
    const s13 = (0, context_1.step)(13, 'Anti-Circularity (Negative Control + Enumeration Anchor)', negControlRejects && arithmeticOnly && tallyMismatches === 0 ? 'PASS' : 'FAIL', `theoretical win-prob/multiplier derived from grid arithmetic only (no operator odds field read); `
        + `negative control: a corrupted roll is REJECTED by the same predicate Step 5 uses (${negControlRejects ? 'falsifiable' : 'VACUOUS'}); `
        + `closed-form win count vs literal 10,000-point tally: ${distinct.size} distinct bands, `
        + `${tallyMismatches} mismatches${firstMismatch ? ` — first: ${firstMismatch}` : ''}`);
    return [s13];
}

  },
  "tests/steps/boundary.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Step 15: Boundary Rule, Roll Range & Effective-Edge Integrity (DICE-10, DICE-17, DICE-19)
 *
 * THREE THINGS, kept apart because they have different evidentiary weight.
 *
 * 1. THE BOUNDARY RULE AND THE 9900× PRICE, WITNESSED ON LIQD'S PRODUCTION VERIFIER (evidence E17, E20). No settled round of
 *    the capture has its roll on a band bound (counted below), so the settled data cannot choose
 *    between a half-open band [lower, upper) and one that is inclusive on both ends: both rules
 *    reproduce every captured win flag. The rule is therefore read off LIQD's own verify endpoint on
 *    liqd.com, asked on 9 November 2026 for revealed production seeds and nonces whose roll equals a
 *    band bound, or misses it by 0.01. This step loads that record (pinned by SHA-256), recomputes
 *    every probe's roll from its seed with src/rng.ts, and requires LIQD's reply to equal the
 *    package's roll, win (half-open rule) and multiplier. It then counts the probes on which the
 *    two candidate rules DISAGREE (roll == upper bound, upper below 100): those are the ones that
 *    carry the evidence, and every one of them must agree with half-open.
 *    WHAT IT IS NOT: these are VERIFIER replies. That settlement (place-bet) applies the same rule
 *    to a roll on a bound is not witnessed by any settled round (limitation L2).
 *
 * 2. THE ROLL RANGE: every served roll is on the grid 0.00 … 99.99.
 *
 * 3. THE EFFECTIVE EDGE, A MODEL IDENTITY. `1 − (100·W/10000)·(9900/(100·W))` is 0.01 by algebra
 *    for every 2-dp band, so no dataset can make the per-bet assertion fail. What it DOES catch is
 *    a change to our own model (a rule or pricing edit, including an inclusive-upper regression that
 *    no settled bet could witness), and that is worth a scored step. It is asserted in EXACT
 *    INTEGERS (`effectiveEdgeIsExact`: 100·winCount·9900 === 99·RANGE·basisPoints), not within a
 *    float tolerance: `continuousWinChancePct` subtracts in binary64, and at an `over 99.99` band
 *    the float form departs from 0.01 by 5.06e-13.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_crypto_1 = require("node:crypto");
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
function run(ctx) {
    const { bets, seeds } = ctx;
    // ── (1) the boundary probes of record ────────────────────────────────────────
    const epochOfSeed = new Map(seeds.filter((s) => s.serverSeed).map((s) => [s.serverSeed, s]));
    const settled = new Set(bets.map((b) => `${b.epoch}|${b.nonce}`));
    const records = [
        { name: 'E17', file: config_1.E17_FILE, sha: config_1.E17_SHA256, n: config_1.E17_PROBES },
        { name: 'E20', file: config_1.E20_FILE, sha: config_1.E20_SHA256, n: config_1.E20_PROBES },
    ];
    let probeNote = '';
    let probesOk = true;
    let nProbes = 0, replyOk = 0, onLower = 0, onUpper = 0, discriminating = 0, discriminatingHalfOpen = 0, unsettledProbes = 0, controls = 0;
    let oneBp = 0, oneBpWins = 0, oneBpPriced = 0;
    const discModes = new Set(), lowerModes = new Set();
    const notes = [];
    for (const rec of records) {
        const file = path.join(ctx.outputsDir, '..', rec.file);
        if (!fs.existsSync(file)) {
            probesOk = false;
            notes.push(`${rec.file} ABSENT`);
            continue;
        }
        const raw = fs.readFileSync(file);
        const sha = (0, node_crypto_1.createHash)('sha256').update(raw).digest('hex');
        let probes = [];
        try {
            probes = (JSON.parse(raw.toString('utf8')).probes ?? []);
        }
        catch {
            probes = [];
        }
        nProbes += probes.length;
        const bad = [];
        let ok = 0;
        for (const pr of probes) {
            let rq;
            let rp;
            try {
                rq = JSON.parse(pr.request.body);
                rp = JSON.parse(pr.body);
            }
            catch {
                bad.push(`${pr.id}: unreadable`);
                continue;
            }
            const seed = epochOfSeed.get(rq.serverSeed);
            // The probe must use a seed LIQD revealed in THIS capture (it hashes to that epoch's commitment)
            // and that epoch's client seed; the reply must be the stored bytes (its SHA-256).
            const provenanceOk = !!seed && (0, rng_1.commitHash)(rq.serverSeed) === seed.hashedServerSeed && rq.clientSeed === seed.clientSeed
                && pr.status === 200 && (0, node_crypto_1.createHash)('sha256').update(pr.body, 'utf8').digest('hex') === pr.bodySha256
                && pr.request.method === 'POST' && pr.request.url === 'https://liqd.com/api/v1/originals/dice/verify';
            const roll = (0, rng_1.diceRoll)(rq.serverSeed, rq.clientSeed, rq.nonce) / config_1.SCALE;
            const win = (0, config_1.diceWin)(roll, rq.params);
            const bps = (0, config_1.payoutBasisPoints)(rq.params);
            const mult = win ? config_1.PAYOUT_NUMERATOR / bps : 0;
            const agrees = rp.outcome.roll === roll && rp.outcome.win === win && rp.outcome.multiplier === mult;
            if (provenanceOk && agrees)
                ok++;
            else
                bad.push(`${pr.id}: ${provenanceOk ? 'reply differs from the package rule' : 'provenance'}`);
            if (bps === 1) {
                oneBp++;
                if (rp.outcome.win) {
                    oneBpWins++;
                    if (rp.outcome.multiplier === config_1.PAYOUT_NUMERATOR)
                        oneBpPriced++;
                }
            }
            const lowerHit = roll === rq.params.lower, upperHit = roll === rq.params.upper;
            if (lowerHit) {
                onLower++;
                lowerModes.add((0, config_1.bandMode)(rq.params));
            }
            if (upperHit)
                onUpper++;
            if (!lowerHit && !upperHit)
                controls++;
            if (seed && !settled.has(`${seed.epoch}|${rq.nonce}`))
                unsettledProbes++;
            // The two candidate rules disagree exactly when the roll sits on the upper bound.
            if ((0, config_1.diceWin)(roll, rq.params) !== (0, config_1.diceWinInclusive)(roll, rq.params)) {
                discriminating++;
                discModes.add((0, config_1.bandMode)(rq.params));
                if (rp.outcome.win === win)
                    discriminatingHalfOpen++;
            }
        }
        replyOk += ok;
        if (!(sha === rec.sha && probes.length === rec.n && ok === probes.length))
            probesOk = false;
        notes.push(`${rec.file} sha256 ${sha.slice(0, 16)}… ${sha === rec.sha ? 'matches its pin' : '≠ PIN'}, ${ok}/${probes.length} replies equal the package rule (pinned count ${rec.n})${bad.length ? ` (${bad.slice(0, 3).join('; ')})` : ''}`);
    }
    probesOk = probesOk && discriminating > 0 && discriminatingHalfOpen === discriminating && onLower > 0 && oneBpWins > 0 && oneBpPriced === oneBpWins;
    probeNote = `${notes.join('; ')}; in all ${replyOk}/${nProbes} answered probes, each on a seed revealed in this capture, LIQD's reply equals the package's roll, half-open win and 9900/basisPoints multiplier; `
        + `roll == lower bound on ${onLower} (wins the band; modes ${[...lowerModes].sort().join(', ')}), roll == upper bound on ${onUpper}, ${controls} with no bound hit (controls 0.01 off a bound, range-edge rolls inside their band, and one re-sent verify call of the capture); `
        + `${discriminating} probes separate half-open from inclusive-both-ends (the roll is on a reachable upper bound; modes ${[...discModes].sort().join(', ')}; an over band's upper bound is 100, which no roll reaches) and ${discriminatingHalfOpen}/${discriminating} follow half-open; ${unsettledProbes} probes use nonces never settled in the capture; `
        + `the 9900× setting (one basis point, E20): ${oneBp} probes on a 0.01 % band, ${oneBpWins} of them winning, priced ${config_1.PAYOUT_NUMERATOR}× on ${oneBpPriced}/${oneBpWins}`;
    // ── (2) roll range ───────────────────────────────────────────────────────────
    const rolls = bets.map((b) => Math.round(Number(b.roll) * config_1.SCALE));
    const maxRoll = Math.max(...rolls), minRoll = Math.min(...rolls);
    const rangeOk = minRoll >= 0 && maxRoll <= config_1.RANGE - 1 && bets.every((b) => Math.round(Number(b.roll) * config_1.SCALE) / config_1.SCALE === Number(b.roll));
    // Power of the SETTLED data over the boundary rule, measured rather than argued.
    let lowerHits = 0, upperHits = 0, rulesDisagree = 0;
    for (const b of bets) {
        const r = Number(b.roll);
        if (r === b.params.lower)
            lowerHits++;
        if (r === b.params.upper)
            upperHits++;
        if ((0, config_1.diceWin)(r, b.params) !== (0, config_1.diceWinInclusive)(r, b.params))
            rulesDisagree++;
    }
    // ── (3) top of the captured range, and the per-bet edge identity ─────────────
    // The highest-multiplier setting the plan played (its smallest win chance) must be priced at
    // exactly PAYOUT_NUMERATOR/basisPoints and carry the 1.0000% edge on every round, and every win
    // there must have been served at that multiplier. The highest setting with a captured WIN is
    // reported separately: a 0.01 % round wins once in 10,000, so its pricing is witnessed by E20.
    const planMinBps = Math.round(Math.min(...config_1.EXPECTED_WIN_CHANCES) * 100);
    const minBps = Math.min(...bets.map(b => (0, config_1.payoutBasisPoints)(b.params)));
    const topBets = bets.filter(b => (0, config_1.payoutBasisPoints)(b.params) === minBps);
    const topExpected = config_1.PAYOUT_NUMERATOR / minBps;
    const topMultOk = minBps === planMinBps
        && topBets.every(b => (b.win ? Number(b.multiplier) === topExpected : Number(b.multiplier) === 0))
        && topBets.every(b => (0, config_1.effectiveEdgeIsExact)(b.params));
    const topEdge = topBets.length ? (0, config_1.effectiveEdge)(topBets[0].params) : NaN;
    const winBps = Math.min(...bets.filter(b => b.win).map(b => (0, config_1.payoutBasisPoints)(b.params)));
    const topWinBets = bets.filter(b => (0, config_1.payoutBasisPoints)(b.params) === winBps);
    const topWinOk = topWinBets.filter(b => b.win).every(b => Number(b.multiplier) === config_1.PAYOUT_NUMERATOR / winBps);
    let minEdge = Infinity, maxEdge = -Infinity, favorable = 0, edgeRuleViolations = 0, maxFloatDeparture = 0;
    const modeAgg = {};
    for (const b of bets) {
        const e = (0, config_1.effectiveEdge)(b.params);
        if (e < minEdge)
            minEdge = e;
        if (e > maxEdge)
            maxEdge = e;
        if (e < -1e-9)
            favorable++;
        if (!(0, config_1.effectiveEdgeIsExact)(b.params))
            edgeRuleViolations++;
        const dep = Math.abs(e - config_1.HOUSE_EDGE); // reported, never scored: this is float noise
        if (dep > maxFloatDeparture)
            maxFloatDeparture = dep;
        const m = (0, config_1.bandMode)(b.params);
        (modeAgg[m] || (modeAgg[m] = { n: 0, sum: 0, min: Infinity, max: -Infinity }));
        const g = modeAgg[m];
        g.n++;
        g.sum += e;
        if (e < g.min)
            g.min = e;
        if (e > g.max)
            g.max = e;
    }
    // The identity at the narrowest band of the price grid, which the capture does not contain.
    const extreme = { lower: 99.99, upper: 100, inverted: false };
    const extremeOk = (0, config_1.effectiveEdgeIsExact)(extreme);
    const extremeFloatDeparture = Math.abs((0, config_1.effectiveEdge)(extreme) - config_1.HOUSE_EDGE);
    const modeStr = Object.entries(modeAgg)
        .map(([m, g]) => `${m} ${(g.sum / g.n * 100).toFixed(3)}% [${(g.min * 100).toFixed(3)}–${(g.max * 100).toFixed(3)}]`)
        .join('; ');
    // Coverage guard: a non-empty set that reaches the top setting with at least one win there.
    const coverOk = bets.length > 0 && topBets.length > 0 && topWinBets.some(b => b.win) && Number.isFinite(topEdge) && extremeOk;
    const pass = coverOk && probesOk && rangeOk && topMultOk && topWinOk && favorable === 0 && edgeRuleViolations === 0;
    const s15 = (0, context_1.step)(15, 'Boundary Rule, Roll Range & Effective Edge', pass ? 'PASS' : ((favorable > 0 || edgeRuleViolations > 0 || !probesOk || !rangeOk) ? 'FAIL' : 'FLAG'), `BOUNDARY RULE AND 9900× PRICE (LIQD's production verify endpoint, 9 and 10 November 2026): ${probeNote}. `
        + `Settled data: ${lowerHits} of ${bets.length} rolls on their band's lower bound and ${upperHits} on its upper bound; the two rules disagree about ${rulesDisagree} captured win flags, so the settled rounds have no power over the rule and it rests on these verifier replies; that settlement treats a roll on a bound the same way is not witnessed (declared limitation L2). `
        + `ROLL RANGE: ${bets.length} served rolls on the 0.01 grid, min ${(minRoll / config_1.SCALE).toFixed(2)}, max ${(maxRoll / config_1.SCALE).toFixed(2)} (ceiling ${((config_1.RANGE - 1) / config_1.SCALE).toFixed(2)}, ${rangeOk ? 'ok' : 'OUT OF RANGE'}). `
        + `TOP OF THE CAPTURED RANGE: win chance ${(minBps / 100).toFixed(2)}% is priced ${config_1.PAYOUT_NUMERATOR}/${minBps} = ${topExpected}× at edge ${(topEdge * 100).toFixed(4)}% (${topBets.length} round(s), ${topBets.filter(b => b.win).length} won, every loss served multiplier 0: ${topMultOk ? 'ok' : 'MISPRICED'}); the highest setting with a captured win, ${(winBps / 100).toFixed(2)}%, pays exactly ${config_1.PAYOUT_NUMERATOR / winBps}× on ${topWinBets.filter(b => b.win).length} win(s) (${topWinOk ? 'ok' : 'MISPRICED'}). `
        + `EFFECTIVE EDGE: per-bet edge == 1.0000% asserted in EXACT INTEGERS (100·winCount·${config_1.PAYOUT_NUMERATOR} === ${config_1.PAYOUT_NUMERATOR / 100}·${config_1.RANGE}·basisPoints, no tolerance) on ${bets.length - edgeRuleViolations}/${bets.length} bets (${edgeRuleViolations} rule violations; coverage ${coverOk ? 'ok' : 'FAIL'}); `
        + `the float form of the same quantity departs from 0.01 by up to ${maxFloatDeparture.toExponential(2)} across the capture and ${extremeFloatDeparture.toExponential(2)} at an over 99.99 band, which is why the assertion is integral; `
        + `MODEL IDENTITY, not a measurement of the operator: it holds by algebra for every 2-dp band, so no dataset can falsify it; it enforces OUR rule set (declared limitation L3); `
        + `effective edge spans ${(minEdge * 100).toFixed(3)}%–${(maxEdge * 100).toFixed(3)}%, player-favourable bets ${favorable} (${favorable === 0 ? 'none' : 'EXPLOIT'}); `
        + `by mode: ${modeStr}`);
    return [s15];
}

  },
  "tests/steps/commitment.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Steps 1–4: Commit-Reveal Integrity
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
function run(ctx) {
    const { seeds, byHash, bets, seedMap } = ctx;
    // ── Step 1: Seed hash integrity ─────────────────────────────────────────────
    // liqd commitment = SHA-256( utf8_bytes( serverSeed_hex_string ) ), via commitHash.
    let checked = 0, fails = 0;
    for (const s of seeds) {
        if (!s.serverSeed)
            continue;
        if ((0, rng_1.commitHash)(s.serverSeed) !== s.hashedServerSeed)
            fails++;
        checked++;
    }
    const s1 = (0, context_1.step)(1, 'Seed Hash Integrity', fails === 0 && checked === seeds.length && checked === config_1.EXPECTED_SEEDS ? 'PASS' : 'FAIL', `${checked}/${config_1.EXPECTED_SEEDS} revealed seeds checked (the audited epoch count, src/config.ts); SHA-256(utf8(serverSeed)) == hashedServerSeed; ${fails} mismatches`);
    // ── Step 2: Next-seed pre-commitment chain ──────────────────────────────────
    // The dataset holds EXPECTED_CAPTURES capture files. Inside a file every epoch's
    // nextHashedServerSeed must BE the next epoch's commitment. Between files there is no link to
    // check: the account's seed pair kept rotating in between (rounds outside this dataset), so each
    // file is anchored by its own pre-capture pair instead.
    //
    // PRE-CAPTURE LINK, one per file. The in-file transitions show the chain was never broken DURING
    // a file, but on their own they say nothing about the file's first epoch: its commitment is simply
    // the first thing the file saw. Each file also carries `preCapture`, the seed pair that was active
    // BEFORE its first bet, with its own revealed server seed and its `nextHashedServerSeed`. Two
    // checks turn that into evidence: the pre-capture seed must hash to its own commitment, and its
    // `nextHashedServerSeed` must BE the commitment of the file's first epoch. Together they place
    // that commitment EARLIER IN THE CHAIN than the file's first bet.
    //
    // WHAT IT IS NOT. A hash chain orders records; it does not date them. This establishes that the
    // first epoch's commitment was already fixed by a record the capture holds from before the first
    // bet, as recorded BY THE CAPTURE. The anchor for "before" is the auditor's own capture record,
    // not an independently authenticated timestamp, so the detail string below says "conditional on
    // the attested chronology" and names limitation L18.
    const byEpoch = [...seeds].sort((a, b) => a.epoch - b.epoch);
    const captures = Array.isArray(ctx.meta.captures) ? ctx.meta.captures : [];
    let promoChecked = 0, promoFails = 0;
    for (let i = 0; i + 1 < byEpoch.length; i++) {
        if (byEpoch[i].capture !== byEpoch[i + 1].capture)
            continue; // a file boundary: no in-dataset link
        promoChecked++;
        if (byEpoch[i].nextHashedServerSeed !== byEpoch[i + 1].hashedServerSeed)
            promoFails++;
    }
    const expectedTransitions = config_1.EXPECTED_SEEDS - config_1.EXPECTED_CAPTURES;
    let preOkCount = 0, crossLinked = 0;
    const preNotes = [];
    for (const c of captures) {
        const pre = c.preCapture;
        const first = byEpoch.find((s) => s.capture === c.index);
        if (!pre || !pre.hashedServerSeed || !pre.revealedServerSeed || !pre.nextHashedServerSeed || !first) {
            preNotes.push(`file ${c.index}: no pre-capture record`);
            continue;
        }
        const preCommitOk = (0, rng_1.commitHash)(pre.revealedServerSeed) === pre.hashedServerSeed;
        const preLinkOk = pre.nextHashedServerSeed === first.hashedServerSeed;
        if (preCommitOk && preLinkOk)
            preOkCount++;
        else
            preNotes.push(`file ${c.index}: commitment ${preCommitOk ? 'ok' : 'MISMATCH'}, link to epoch ${first.epoch} ${preLinkOk ? 'ok' : 'MISMATCH'}`);
        // Measured, not required: does the previous file's last next-hash reach this file?
        const prevLast = [...byEpoch].reverse().find((s) => s.capture === c.index - 1);
        if (prevLast && (prevLast.nextHashedServerSeed === pre.hashedServerSeed || prevLast.nextHashedServerSeed === first.hashedServerSeed))
            crossLinked++;
    }
    const preOk = captures.length === config_1.EXPECTED_CAPTURES && preOkCount === config_1.EXPECTED_CAPTURES;
    const s2 = (0, context_1.step)(2, 'Next-Seed Pre-Commitment Chain', promoFails === 0 && promoChecked === expectedTransitions && preOk ? 'PASS' : 'FAIL', (promoFails === 0
        ? `${promoChecked}/${expectedTransitions} in-file transitions: nextHashedServerSeed == next epoch's hashedServerSeed (chain INTACT inside each of the ${config_1.EXPECTED_CAPTURES} capture files)`
        : `${promoChecked - promoFails}/${expectedTransitions} match; ${promoFails} mismatch`)
        + `; pre-capture link ${preOkCount}/${config_1.EXPECTED_CAPTURES}: the pair each file recorded before its first bet reveals a seed that hashes to its own commitment, and its nextHashedServerSeed IS the commitment of the file's first epoch`
        + (preNotes.length ? ` (${preNotes.join('; ')})` : '')
        + `; ${crossLinked}/${config_1.EXPECTED_CAPTURES - 1} file-to-file links are in the dataset (the last next-hash of one file is not the next file's pre-capture pair or first commitment: the account's seed pair rotated in between, outside this dataset, so each file stands on its own anchor)`
        + '. A hash chain orders records, it does not date them: that each anchor predates its file\'s first bet is the auditor\'s capture record, an ASSUMED premise, not independently authenticated timing (declared limitation L18), so the no-post-hoc-choice reading of it is CONDITIONAL on that attested chronology');
    // ── Step 3: Hash consistency within epoch ────────────────────────────────────
    const betsByEpoch = new Map();
    for (const b of bets) {
        const arr = betsByEpoch.get(b.epoch) ?? [];
        arr.push(b);
        betsByEpoch.set(b.epoch, arr);
    }
    let epochsMultipleHashes = 0;
    for (const [, epochBets] of betsByEpoch) {
        const hashes = new Set(epochBets.map(b => b.hashedServerSeed));
        if (hashes.size !== 1)
            epochsMultipleHashes++;
    }
    const s3CoverageOk = betsByEpoch.size === seeds.length;
    const s3 = (0, context_1.step)(3, 'Hash Consistency Within Epoch', epochsMultipleHashes === 0 && s3CoverageOk ? 'PASS' : 'FAIL', `${betsByEpoch.size}/${seeds.length} epochs: all bets within each epoch share the same hashedServerSeed; ${epochsMultipleHashes} violations`);
    // ── Step 4: Nonce audit ──────────────────────────────────────────────────────
    // Per epoch: single client seed, nonces contiguous from nonceStart. A gap is a disclosed
    // artifact only if the seed is revealed AND every recorded bet's roll recomputes; else hard-fail.
    const hardFailures = [];
    const disclosedGaps = [];
    let epochsChecked = 0;
    let trailingAuditorRecorded = false;
    for (const [hash, epochBets] of byHash) {
        const sorted = [...epochBets].sort((a, b) => a.nonce - b.nonce);
        const nonces = sorted.map(b => b.nonce);
        const epochNum = sorted[0].epoch;
        const phase = sorted[0].phase;
        const clientSeeds = new Set(sorted.map(b => b.clientSeed));
        if (clientSeeds.size !== 1)
            hardFailures.push(`Epoch ${epochNum}: ${clientSeeds.size} distinct client seeds`);
        const nonceSet = new Set(nonces);
        const minNonce = Math.min(...nonces);
        const maxNonce = Math.max(...nonces);
        // Nonce-REUSE guard: interior contiguity alone treats a duplicated
        // nonce as a benign "gap", so a replayed draw could pass. Require distinct nonces = bet count.
        if (nonceSet.size !== nonces.length) {
            hardFailures.push(`Epoch ${epochNum}: nonce reuse — ${nonces.length} bets but only ${nonceSet.size} distinct nonces`);
        }
        const missing = [];
        for (let n = minNonce; n <= maxNonce; n++)
            if (!nonceSet.has(n))
                missing.push(n);
        // Withholding guard.
        // Interior contiguity alone cannot see bets withheld BEFORE the first or AFTER the last
        // recorded nonce. The three bounds below have DIFFERENT evidentiary weight:
        //   • leading  — operator-sourced (the rotate response's post-rotation nonce), a real guard;
        //   • epoch size — the plan (src/config.ts EXPECTED_EPOCHS) fixes the rounds of every epoch, so
        //                  a short epoch exposes a dropped bet ANYWHERE (interior or last), a real invariant;
        //   • trailing — operator-witnessed ONLY if operatorBetCount was captured; otherwise nonceEnd
        //                is the auditor's OWN last recorded nonce and can be checked for internal
        //                consistency only. Trailing withholding is not observable client-side (R-ORPHAN).
        const seedEntry = seeds.find(s => s.hashedServerSeed === hash);
        if (!seedEntry) {
            hardFailures.push(`Epoch ${epochNum}: no seed entry for hash ${hash.slice(0, 12)}…`);
        }
        else {
            if (seedEntry.nonceStart != null && minNonce !== seedEntry.nonceStart) {
                hardFailures.push(`Epoch ${epochNum}: first observed nonce ${minNonce} != operator post-rotation nonce ${seedEntry.nonceStart} (leading bets withheld?)`);
            }
            // G-BIND: the epoch size comes from src/config.ts (EXPECTED_EPOCHS, one row per epoch), NOT
            // from the dataset. Read from the dataset, this guard catches only an INCOHERENT forgery:
            // drop the trailing nonces of every epoch, rewrite the header and every seed record to match,
            // and a dataset-sourced size agrees with the shrunken data. Against a coherent shrink a
            // dataset-sourced bound is not an invariant at all.
            const plan = config_1.EXPECTED_EPOCHS[epochNum];
            if (!plan) {
                hardFailures.push(`Epoch ${epochNum}: not in the audited plan (src/config.ts EXPECTED_EPOCHS)`);
            }
            else {
                if (epochBets.length !== plan.bets) {
                    hardFailures.push(`Epoch ${epochNum}: ${epochBets.length} bets != audited epoch size ${plan.bets} (src/config.ts)`);
                }
                if (seedEntry.plannedBets !== plan.bets) {
                    hardFailures.push(`Epoch ${epochNum}: seed record plannedBets ${seedEntry.plannedBets} != audited epoch size ${plan.bets}`);
                }
                if (maxNonce !== plan.bets - 1 && missing.length === 0) {
                    hardFailures.push(`Epoch ${epochNum}: last nonce ${maxNonce} != audited epoch size ${plan.bets} - 1`);
                }
            }
            if (seedEntry.operatorBetCount != null) {
                if (maxNonce !== seedEntry.operatorBetCount - 1) {
                    hardFailures.push(`Epoch ${epochNum}: last observed nonce ${maxNonce} != operator bet count ${seedEntry.operatorBetCount} - 1 (trailing bets withheld?)`);
                }
            }
            else {
                if (seedEntry.nonceEnd != null && maxNonce !== seedEntry.nonceEnd) {
                    hardFailures.push(`Epoch ${epochNum}: record inconsistent, max nonce ${maxNonce} != recorded nonceEnd ${seedEntry.nonceEnd}`);
                }
                trailingAuditorRecorded = true;
            }
        }
        if (missing.length > 0) {
            const ss = seedMap.get(hash);
            let allVerify = ss !== undefined;
            if (ss) {
                for (const b of sorted) {
                    const served = Number(b.roll);
                    const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce) / config_1.SCALE;
                    if (!(0, config_1.servedRollMatches)(served, local)) {
                        allVerify = false;
                        break;
                    }
                }
            }
            if (allVerify)
                disclosedGaps.push(`epoch ${epochNum} (Phase ${phase}), nonce ${missing.join(',')} orphaned; all recorded bets verify`);
            else
                hardFailures.push(`Epoch ${epochNum}: unverifiable nonce gap at ${missing.join(',')}`);
        }
        epochsChecked++;
    }
    if (epochsChecked !== seeds.length || epochsChecked !== config_1.EXPECTED_SEEDS)
        hardFailures.push(`coverage: audited ${epochsChecked}/${config_1.EXPECTED_SEEDS} epochs`);
    const planSizeOk = [...byHash.values()].filter((eb) => eb.length === config_1.EXPECTED_EPOCHS[eb[0].epoch]?.bets).length;
    let s4status;
    let s4detail;
    // A reconstructable capture-retry gap is a FLAG with origin = capture — NEVER a PASS. Profile
    // DICE-04 (decided 2026-09-17): an operator-side gap or repeat is a HARD FAIL; a gap the capture
    // log attributes to an auditor-side retry, where the revealed seed reconstructs every recorded
    // bet, is disclosed with a limitation row and counted, but is verdict-neutral (origin = capture
    // is not scored against the game). Returning PASS here would erase the disclosure. On THIS capture
    // every epoch is fully contiguous so the branch does not fire, but the mechanism is present
    // so a future capture that DID retry is disclosed rather than absorbed.
    let s4origin;
    if (hardFailures.length > 0) {
        s4status = 'FAIL';
        s4detail = `${hardFailures.length} violations: ${hardFailures.slice(0, 3).join('; ')}`;
    }
    else if (disclosedGaps.length > 0) {
        s4status = 'FLAG';
        s4origin = 'capture';
        s4detail = `LIMITATION ROW (origin = capture, verdict class unchanged): ${epochsChecked} epochs, single client seed each, nonces otherwise contiguous; ${disclosedGaps.length} nonce gap${disclosedGaps.length === 1 ? '' : 's'} attributable to an auditor-side capture retry — the revealed seed reconstructs every recorded bet in the affected epoch, so no operator draw is withheld or unverifiable, but the gap is DISCLOSED not passed over (${disclosedGaps.join('; ')}). An operator-side gap or repeat would be a HARD FAIL; this is not one.`;
    }
    else {
        s4status = 'PASS';
        s4detail = `${epochsChecked} epochs: single client seed each, distinct contiguous nonces 0..size−1 with the size the plan gives each epoch (${[...new Set(config_1.EXPECTED_EPOCHS.map((e) => e.bets))].sort((x, y) => x - y).join(' / ')} rounds; no interior gaps, no reuse); first nonce == nonceStart in ${epochsChecked}/${seeds.length} (the leading bound: the post-rotation nonce served by the rotation reply that opened the epoch); ${planSizeOk}/${config_1.EXPECTED_SEEDS} epochs hold exactly their planned number of bets, the size bound to src/config.ts not to the dataset (G-BIND); `
            + (trailingAuditorRecorded
                ? 'trailing bound is auditor-recorded (no operator end counter in this capture); trailing withholding is not observable client-side, see R-ORPHAN and declared limitation L13 in MANIFEST.md'
                : 'trailing bound operator-witnessed via operatorBetCount');
    }
    const s4 = (0, context_1.step)(4, 'Nonce Audit', s4status, s4detail, s4origin);
    return [s1, s2, s3, s4];
}

  },
  "tests/steps/context.js": function (module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step = step;
function step(num, name, status, detail, origin) {
    const tag = status === 'PASS' ? '[PASS]' : status === 'INFO' ? '[INFO]' : status === 'FLAG' ? '[FLAG]' : '[FAIL]';
    const originTag = status === 'FLAG' && origin ? ` (origin=${origin})` : '';
    console.log(`  ${tag} Step ${num} — ${name}${originTag}`);
    if (status !== 'PASS')
        console.log(`         ${detail}`);
    // `origin` is included ONLY on a FLAG, so a PASS/FAIL record is byte-identical to before this
    // field existed and the reproduction diff sees nothing new.
    return status === 'FLAG' && origin
        ? { step: num, name, status, detail, origin }
        : { step: num, name, status, detail };
}

  },
  "tests/steps/dataset.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Steps 11–12: Dataset Integrity & Coverage
 *
 * POPULATION BINDING (G-BIND). Taking the audited population from the dataset's OWN header makes the
 * plan self-referential: comparing `bets.length` to a planned total in the header, or the observed
 * phase counts to `meta.phases`, reads fields inside the file being scored. Shrink the data, doctor
 * the header, re-pin `DATASET_SHA256`, and the repo is internally consistent again. The SHA pin
 * cannot help; it proves the file has not changed since WE pinned it, not that it is the capture.
 *
 * The expected cardinality therefore comes from CODE constants (`EXPECTED_BETS`, `EXPECTED_SEEDS`,
 * `EXPECTED_EPOCHS`, `EXPECTED_PHASES` in `src/config.ts`) and `meta` is checked AGAINST them: the
 * header is evidence to be reconciled, not the plan. Registered as `coherent population shrink` in
 * `tests/mutations.json`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const config_1 = require("../../src/config");
const MODES = ['under', 'over', 'inside', 'outside'];
/** 9900/bp as a display value (the exact quotient). */
const PAYOUT_NUMERATOR_OVER = (bp) => config_1.PAYOUT_NUMERATOR / bp;
function run(ctx) {
    const { bets, seeds, meta, datasetSha256, expectedDatasetHash } = ctx;
    // ── Step 11: Dataset integrity ───────────────────────────────────────────────
    const hashOk = datasetSha256 === expectedDatasetHash;
    const seed0Ok = seeds.length > 0 && seeds[0].serverSeed != null; // recurring miss guard
    const allRevealed = seeds.every(s => s.serverSeed != null);
    // (a) the population IS the audited population, against src/config.ts, never against meta
    const betCountOk = bets.length === config_1.EXPECTED_BETS;
    const seedCountOk = seeds.length === config_1.EXPECTED_SEEDS;
    // (b) every epoch is the epoch the plan says it is: its size, its phase, its capture file
    const perEpoch = new Map();
    for (const b of bets)
        perEpoch.set(b.epoch, (perEpoch.get(b.epoch) ?? 0) + 1);
    const seedOf = new Map(seeds.map((s) => [s.epoch, s]));
    let epochPlanOk = 0;
    for (const e of config_1.EXPECTED_EPOCHS) {
        const s = seedOf.get(e.epoch);
        if (perEpoch.get(e.epoch) === e.bets && s && s.phaseId === e.phaseId && s.phase === e.phase && s.capture === e.capture && s.plannedBets === e.bets)
            epochPlanOk++;
    }
    const epochsOk = perEpoch.size === config_1.EXPECTED_SEEDS && epochPlanOk === config_1.EXPECTED_SEEDS;
    // (c) each epoch's nonces are exactly 0..size−1 with the size from the plan: a withheld trailing
    //     bet cannot be absorbed by shrinking a declared size, because the size is not declared here
    let nonceGaps = 0;
    const byEpochNonces = new Map();
    for (const b of bets) {
        let ns = byEpochNonces.get(b.epoch);
        if (!ns) {
            ns = new Set();
            byEpochNonces.set(b.epoch, ns);
        }
        ns.add(b.nonce);
    }
    for (const e of config_1.EXPECTED_EPOCHS) {
        const ns = byEpochNonces.get(e.epoch);
        let gap = !ns || ns.size !== e.bets;
        for (let i = 0; !gap && i < e.bets; i++)
            if (!ns.has(i))
                gap = true;
        if (gap)
            nonceGaps++;
    }
    // (d) the header is RECONCILED against the constants, not trusted as the plan
    const captures = Array.isArray(meta.captures) ? meta.captures : [];
    const captureBets = (c) => config_1.EXPECTED_EPOCHS.filter((e) => e.capture === c).reduce((a, e) => a + e.bets, 0);
    const captureEpochs = (c) => config_1.EXPECTED_EPOCHS.filter((e) => e.capture === c).length;
    const capturesOk = captures.length === config_1.EXPECTED_CAPTURES
        && captures.every((c, i) => c.index === i && c.bets === captureBets(i) && c.epochs?.count === captureEpochs(i) && c.status === 'completed' && c.verifierReplies === captureBets(i));
    const metaAgrees = meta.plannedTotal === config_1.EXPECTED_BETS && meta.epochs === config_1.EXPECTED_SEEDS && capturesOk;
    // (e) one id per bet: a round counted twice would inflate every count above
    const idsOk = new Set(bets.map((b) => b.id)).size === bets.length;
    const countsOk = betCountOk && seedCountOk && epochsOk && nonceGaps === 0 && metaAgrees && idsOk;
    const sizes = [...new Set(config_1.EXPECTED_EPOCHS.map((e) => e.bets))].sort((x, y) => x - y);
    const s11 = (0, context_1.step)(11, 'Dataset Integrity', hashOk && seed0Ok && allRevealed && countsOk ? 'PASS' : 'FAIL', `SHA-256 pin ${hashOk ? 'match' : 'MISMATCH'}; population bound to src/config.ts, NOT to the dataset header (G-BIND): `
        + `${bets.length}/${config_1.EXPECTED_BETS} bets (${betCountOk ? 'ok' : 'WRONG POPULATION'}), ${seeds.length}/${config_1.EXPECTED_SEEDS} seeds (${seedCountOk ? 'ok' : 'WRONG POPULATION'}), `
        + `${epochPlanOk}/${config_1.EXPECTED_SEEDS} epochs match the plan row for row (size ${sizes.join(' / ')}, phase, capture file) (${epochsOk ? 'ok' : 'EPOCH PLAN MISMATCH'}), ${nonceGaps} epoch(s) not holding exactly the nonces 0..size−1; ${new Set(bets.map((b) => b.id)).size} distinct bet ids (${idsOk ? 'ok' : 'DUPLICATE'}); `
        + `dataset header reconciles with those constants (meta.plannedTotal=${meta.plannedTotal}, meta.epochs=${meta.epochs}, ${captures.length} capture files each complete, with its own epoch and bet counts: ${metaAgrees ? 'ok' : 'DISAGREES'}); `
        + `seed[0].serverSeed ${seed0Ok ? 'present' : 'NULL'}; ${seeds.filter(s => s.serverSeed != null).length}/${seeds.length} seeds revealed (100% verifiable ${allRevealed ? 'yes' : 'NO'})`);
    // ── Step 12: Phase & mode coverage (DICE-15) ─────────────────────────────────
    // The plan is EXPECTED_PHASES (code), not meta.phases (inside the evidence). Both directions:
    // every planned phase present at its planned count, and no phase in the data that is not planned.
    const byPhase = {};
    for (const b of bets)
        byPhase[b.phaseId] = (byPhase[b.phaseId] || 0) + 1;
    const planOk = Object.entries(config_1.EXPECTED_PHASE_BETS).every(([k, n]) => byPhase[k] === n)
        && Object.keys(byPhase).every(k => k in config_1.EXPECTED_PHASE_BETS);
    // meta.phases is reconciled against the same constants rather than believed.
    const metaPhasesOk = config_1.EXPECTED_PHASES.every((ph) => meta.phases?.[ph.id]?.bets === config_1.EXPECTED_PHASE_BETS[ph.id] && meta.phases?.[ph.id]?.stake === ph.stake && meta.phases?.[ph.id]?.phase === ph.phase)
        && Object.keys(meta.phases ?? {}).every(k => k in config_1.EXPECTED_PHASE_BETS);
    // Per phase: the phase letter, the one stake (the served 8-dp string) and the win chances are the plan's.
    const phaseNotes = [];
    let phasesOk = true;
    for (const ph of config_1.EXPECTED_PHASES) {
        const pb = bets.filter((b) => b.phaseId === ph.id);
        const letterOk = pb.every((b) => b.phase === ph.phase);
        const stakeOk = pb.length > 0 && pb.every((b) => String(b.betAmount) === ph.stake);
        const wantBps = new Set(ph.winChances.map((w) => Math.round(w * 100)));
        const gotBps = new Set(pb.map((b) => (0, config_1.payoutBasisPoints)(b.params)));
        const bpsOk = gotBps.size === wantBps.size && [...gotBps].every((x) => wantBps.has(x));
        const modes = new Set(pb.map((b) => (0, config_1.bandMode)(b.params)));
        if (!(letterOk && stakeOk && bpsOk))
            phasesOk = false;
        phaseNotes.push(`${ph.id} ${pb.length} at ${ph.stake} (${stakeOk ? 'ok' : 'STAKE MISMATCH'}), win chance ${[...gotBps].sort((x, y) => x - y).map((x) => x / 100).join('/')}% (${bpsOk ? 'the plan\'s' : 'NOT the plan\'s'}), modes ${[...modes].join(',')}`);
    }
    // Both stake tiers present (the base stake and the elevated Phase C stake), and no other.
    const stakes = new Set(bets.map(b => String(b.betAmount)));
    const tiersOk = stakes.size === 2 && stakes.has(config_1.BASE_STAKE) && stakes.has(config_1.ELEVATED_STAKE);
    // Phase A coverage (the phase letter A: the 7 Nov rounds and the A+ top-up): every planned win
    // chance in every one of the four modes, at least PHASE_A_MIN_BETS_PER_CLASS rounds per
    // (mode, win chance) class, both ends of the range (the lowest and the highest planned win chance).
    const aBets = bets.filter((b) => b.phase === 'A');
    const aPlanBps = [...new Set(config_1.EXPECTED_PHASES.filter((ph) => ph.phase === 'A').flatMap((ph) => ph.winChances))].map((w) => Math.round(w * 100));
    const cellCount = new Map();
    for (const b of aBets) {
        const k = `${(0, config_1.bandMode)(b.params)}/${(0, config_1.payoutBasisPoints)(b.params)}`;
        cellCount.set(k, (cellCount.get(k) ?? 0) + 1);
    }
    const wantCells = MODES.flatMap((m) => aPlanBps.map((bp) => `${m}/${bp}`));
    const cellsPresent = wantCells.filter((k) => (cellCount.get(k) ?? 0) >= config_1.PHASE_A_MIN_BETS_PER_CLASS).length;
    const cellMin = Math.min(...wantCells.map((k) => cellCount.get(k) ?? 0));
    const cellsOk = cellsPresent === wantCells.length && cellCount.size === wantCells.length;
    const allBps = new Set(bets.map((b) => (0, config_1.payoutBasisPoints)(b.params)));
    const planAll = config_1.EXPECTED_WIN_CHANCES.map((w) => Math.round(w * 100));
    const endsOk = allBps.has(Math.min(...planAll)) && allBps.has(Math.max(...planAll)) && allBps.size === planAll.length;
    const modesAll = new Set(bets.map(b => (0, config_1.bandMode)(b.params)));
    const modesOk = MODES.every(m => modesAll.has(m));
    const s12 = (0, context_1.step)(12, 'Phase & Mode Coverage', planOk && metaPhasesOk && phasesOk && tiersOk && cellsOk && endsOk && modesOk ? 'PASS' : 'FAIL', `phases ${JSON.stringify(byPhase)} match the CODE plan ${JSON.stringify(config_1.EXPECTED_PHASE_BETS)} (${planOk}); dataset header meta.phases reconciles with it (${metaPhasesOk}); `
        + `per phase: ${phaseNotes.join('; ')}; `
        + `both stake tiers present, ${config_1.BASE_STAKE} and ${config_1.ELEVATED_STAKE} USDT, and no other (${tiersOk}); `
        + `Phase A (A and the A+ top-up, ${aBets.length} rounds): ${cellsPresent}/${wantCells.length} (mode × win chance) classes hold at least ${config_1.PHASE_A_MIN_BETS_PER_CLASS} rounds (fewest ${cellMin}), all 4 modes [${[...modesAll].join(',')}] at each of the ${aPlanBps.length} planned win chances (${cellsOk}); `
        + `both ends of the planned range played, ${Math.min(...planAll) / 100}% (${PAYOUT_NUMERATOR_OVER(Math.min(...planAll))}×) and ${Math.max(...planAll) / 100}% (${PAYOUT_NUMERATOR_OVER(Math.max(...planAll))}×) (${endsOk}). There is no separate tail phase: the 9900× setting is the one round of Phase X, the 99× setting is the A+ top-up and the 49.5× setting is the 2% win chance of Phase A`);
    return [s11, s12];
}

  },
  "tests/steps/determinism.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Steps 5–6: RNG Determinism & Win-Rule Reproduction
 * The heart of provable fairness: every served roll and win flag must recompute from the
 * revealed (serverSeed, clientSeed, nonce) with the published algorithm — no operator trust.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const bias_1 = require("../../src/bias");
const config_1 = require("../../src/config");
/**
 * The profile's ceiling on modulo bias (methodology S2, DICE-08): a draw biased by more than one
 * part in 2^32, without rejection sampling to correct it, is a hard fail. Declared here as the
 * number it is so the comparison is arithmetic.
 */
const BIAS_CEILING = Math.pow(2, -32);
function run(ctx) {
    const { bets, seedMap } = ctx;
    // ── Step 5: Roll recomputation + draw bias bound ─────────────────────────────
    // DICE-07: every served roll recomputes byte-identically from (serverSeed, clientSeed, nonce).
    // DICE-08: the draw is exactly uniform on its 10,000-point lattice — an arithmetic bound over the
    // same maxFairFor(RANGE) the draw applies, so the step also decides that the roll Step 5
    // recomputes is a draw from a uniform lattice, not an exact recomputation of a biased one.
    let checked = 0, mismatches = 0;
    let sample = '';
    for (const b of bets) {
        const ss = seedMap.get(b.hashedServerSeed);
        if (!ss)
            continue;
        const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce) / config_1.SCALE;
        const served = Number(b.roll);
        // Finiteness guard: a non-numeric served roll makes
        // `Math.abs(local - NaN) > 1e-9` false, silently passing; reject it explicitly.
        if (!(0, config_1.servedRollMatches)(served, local)) {
            mismatches++;
            if (!sample)
                sample = `epoch ${b.epoch} nonce ${b.nonce}: local ${local} vs served ${b.roll}`;
        }
        checked++;
    }
    const rollsOk = mismatches === 0 && checked === bets.length;
    // Draw bias bound (DICE-08). Computed from the same numbers the draw uses; holds for every seed,
    // not only the captured ones. A violation is a HARD FAIL (methodology S2).
    const b = (0, bias_1.drawBiasBound)();
    const biasIssues = [];
    if (!b.wholeNumberOfRanges) {
        biasIssues.push(`MAX_FAIR ${b.maxFair} is not a whole number of ${b.range}-wide ranges `
            + `(${b.maxFair} % ${b.range} = ${b.remainder}); the low ${b.remainder} residues are over-represented`);
    }
    if (!(b.bias <= BIAS_CEILING)) {
        biasIssues.push(`worst-case modulo bias ${b.bias} exceeds the 2^-32 ceiling ${BIAS_CEILING}`);
    }
    const biasOk = biasIssues.length === 0;
    const s5 = (0, context_1.step)(5, 'Roll Recomputation & Draw Bias Bound', rollsOk && biasOk ? 'PASS' : 'FAIL', !rollsOk
        ? `${mismatches} roll mismatches (e.g. ${sample})`
        : !biasOk
            ? `DRAW BIAS: ${biasIssues.join('; ')}`
            : `${checked}/${bets.length} bets: diceRoll(serverSeed, clientSeed, nonce) / 100 == served roll (byte-identical). `
                + `Draw uniformity (DICE-08): rejection sampling over the ${b.domainSize.toLocaleString()}-value uint32 domain `
                + `accepts MAX_FAIR = ${b.range} × ${b.rangesAccepted} = ${b.maxFair.toLocaleString()}, an exact whole number of `
                + `ranges, so each of the ${b.range.toLocaleString()} residues receives exactly ${b.rangesAccepted.toLocaleString()} `
                + `of the accepted values and the worst-case modulo bias is ${b.bias}, inside the 2^-32 ceiling `
                + `(${BIAS_CEILING}). Rejection census: ${b.rejectedDrawsPerChunk.toLocaleString()} of ${b.domainSize.toLocaleString()} `
                + `chunk values fall in the discarded tail [MAX_FAIR, 2^32) — a per-chunk rejection probability of `
                + `${b.rejectionProbabilityPerChunk.toExponential(3)}`);
    // ── Step 6: Win-rule reproduction ────────────────────────────────────────────
    // The recomputed roll under the published band rule must reproduce the served win flag.
    //
    // SECOND WITNESS, also scored: LIQD's own verify endpoint. After each epoch's seed was revealed the
    // capture posted every round's revealed inputs to https://liqd.com/api/v1/originals/dice/verify and
    // stored the reply; the dataset carries it per bet (`verifier`). The reply must exist (HTTP 200),
    // must have been asked for THIS round's inputs (the revealed server seed, the round's client seed,
    // nonce and band), and its roll, win and multiplier must equal the served round AND this
    // recomputation. The recomputation is the test; the verifier is LIQD saying the same thing.
    let winChecked = 0, winFails = 0;
    let vReplies = 0, vRequestOk = 0, vServedOk = 0, vLocalOk = 0;
    for (const b of bets) {
        const ss = seedMap.get(b.hashedServerSeed);
        if (!ss)
            continue;
        const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce) / config_1.SCALE;
        const localWin = (0, config_1.diceWin)(local, b.params);
        if (localWin !== !!b.win)
            winFails++;
        winChecked++;
        const v = b.verifier;
        if (!v || v.status !== 200 || !v.outcome || !v.request)
            continue;
        vReplies++;
        const rq = v.request;
        if (rq.serverSeed === ss && rq.clientSeed === b.clientSeed && rq.nonce === b.nonce
            && rq.params?.lower === b.params.lower && rq.params?.upper === b.params.upper && rq.params?.inverted === b.params.inverted)
            vRequestOk++;
        if (v.outcome.roll === b.roll && v.outcome.win === b.win && v.outcome.multiplier === b.multiplier)
            vServedOk++;
        if ((0, config_1.servedRollMatches)(Number(v.outcome.roll), local) && v.outcome.win === localWin)
            vLocalOk++;
    }
    const verifierOk = vReplies === bets.length && vRequestOk === bets.length && vServedOk === bets.length && vLocalOk === bets.length;
    const s6 = (0, context_1.step)(6, 'Win-Rule Reproduction', winFails === 0 && winChecked === bets.length && verifierOk ? 'PASS' : 'FAIL', (winFails === 0
        ? `${winChecked}/${bets.length} bets: recomputed roll ∈/∉ band reproduces the served win flag (inverted honoured)`
        : `${winFails} win-flag mismatches`)
        + `; LIQD's production verify endpoint (stored reply per round): ${vReplies}/${bets.length} replies HTTP 200, ${vRequestOk}/${bets.length} asked with the round's own revealed inputs, ${vServedOk}/${bets.length} return the served roll, win and multiplier, ${vLocalOk}/${bets.length} equal this recomputation`);
    return [s5, s6];
}

  },
  "tests/steps/live-fit.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Step 22 — Live-Sample Serial Independence (informational; profile check DICE-22, policy
 * INFORMATIONAL — 2026-09-29).
 *
 * WHAT IT CARRIES. DICE-22 asserts the captured rolls fit the uniform lattice AND show no serial
 * dependence, informational only. The uniform-lattice-fit half is the pooled real-roll χ² in
 * Step 17, recomputed from the dataset on every captured roll — and it too is INFORMATIONAL: a fit
 * rejection there prints INFO and does not fail Step 17 (only a stored record that does not
 * reconcile with the recomputation fails). THIS step carries the serial-dependence half — lag-1
 * autocorrelation and a Wald–Wolfowitz runs test on the live rolls in capture order — which
 * nothing else in the package computed. Together the two halves are the whole of DICE-22.
 *
 * WHY IT IS A NUMBERED STEP AND NOT AN InfoItem. It is a numbered step that reports INFO and
 * CANNOT FAIL: it returns PASS or INFO, never FAIL or FLAG, so it is not scored. It is numbered so
 * that its output is on the step list and in outputs/verification-results.json, where the
 * reproduction gate binds it, and so that a mutation can show the screen is not vacuous: an
 * InfoItem (statistical.ts) prints nothing a mutation can be checked against. `tests/mutations.json`
 * sorts the captured rolls into value order (M-LIVESERIAL): the draw stream becomes monotonic,
 * lag-1 → +1, the runs test collapses, and THIS step reports INFO. `npm run mutate` records that as
 * an INFORMATIONAL SIGNAL, not as a kill. The run goes red on other checks — the reproduction gate,
 * because the step's committed status/detail changed, and Step 19, whose recomputed report figures
 * (the settlementResidual group) change when the bets are reordered (measured 2026-10-02) — never
 * because this step failed.
 *
 * WHY IT NEVER BEARS THE VERDICT. A live-sample serial screen of a few thousand rolls has little power and the profile fixes
 * DICE-22 at policy INFORMATIONAL (2026-09-29). So when the screen trips this step returns INFO,
 * which verify.ts reports but never counts as a flag and never lets change the verdict (Full Pass,
 * exit 0).
 * The authoritative serial-independence evidence remains the Pass-1 simulation over fresh seeds
 * (Step 16), whose 200,000-roll screen has the power the live sample does not. This step is the
 * live-sample cross-check the profile asks for, at the power a live sample affords.
 *
 * THE THRESHOLD is the framework's cross-game serial-independence rule — |lag1 z| < 3 AND runs
 * p ≥ 0.01 — the same rule the Pass-1 serial screen and every sibling audit apply, not a bespoke
 * bound invented here. Runs are taken about the 50.00 midpoint of the [0.00, 99.99] roll range.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const stats_1 = require("../../src/stats");
const config_1 = require("../../src/config");
/** Framework cross-game serial-independence thresholds (informational live-fit). */
const LAG1_Z_MAX = 3;
const RUNS_P_MIN = 0.01;
/** Midpoint of the [0.00, 99.99] roll range — the runs test's dichotomy. */
const ROLL_MIDPOINT = 50;
function run(ctx) {
    // Capture order: the dataset array as loaded (chronological within the capture). A per-bet nonce
    // reorder would be caught by Step 4; here the ORDER itself is the object under test.
    const rolls = ctx.bets.map((b) => Number(b.roll));
    const n = rolls.length;
    // Population bound to the code constant (G-BIND): the serial screen must run on the whole audited
    // population, not on whatever count the dataset header claims. Step 11 / DICE-05 already binds
    // bets.length to EXPECTED_BETS; this re-asserts it locally so a truncated input cannot quietly
    // shrink the sample the screen is computed over.
    const populationOk = n === config_1.EXPECTED_BETS;
    const lag1 = (0, stats_1.lag1Autocorrelation)(rolls);
    const lag1Z = lag1 * Math.sqrt(n);
    const runsSeq = rolls.map((r) => (r >= ROLL_MIDPOINT ? 1 : 0));
    const runs = (0, stats_1.runsTest)(runsSeq);
    const independent = populationOk
        && Number.isFinite(lag1Z) && Math.abs(lag1Z) < LAG1_Z_MAX
        && runs.variance > 0 && runs.pValue >= RUNS_P_MIN;
    const detail = `serial independence of the ${n} captured rolls in capture order (pinned population ${config_1.EXPECTED_BETS}${populationOk ? '' : ' — MISMATCH'}): `
        + `lag-1 autocorrelation ${lag1.toFixed(6)} → z ${lag1Z.toFixed(3)} (|z| < ${LAG1_Z_MAX}); `
        + `Wald–Wolfowitz runs about roll ${ROLL_MIDPOINT.toFixed(2)}: ${runs.runs} runs vs ${runs.expected.toFixed(1)} expected `
        + `(n1=${runs.n1} of ${runs.n}, variance ${runs.variance.toExponential(4)}), z ${runs.z.toFixed(3)}, p ${runs.pValue.toFixed(4)} (≥ ${RUNS_P_MIN}); `
        + `${independent ? 'no serial dependence detected' : 'SERIAL DEPENDENCE — reported as INFO, not counted'}. `
        + `INFORMATIONAL (profile policy INFORMATIONAL): a ${n}-roll serial screen has little power and NEVER bears the verdict — the authoritative serial evidence is the Pass-1 simulation over 200,000 fresh-seed rolls (Step 16). `
        + `The uniform-lattice-fit half of DICE-22 is the pooled real-roll χ² in Step 17 (also informational).`;
    // Verdict-neutral by construction: a trip is INFO, which verify.ts reports but never counts as a
    // flag and never lets change the verdict class (Full Pass, exit 0).
    return [
        independent
            ? (0, context_1.step)(22, 'Live-Sample Serial Independence (informational)', 'PASS', detail)
            : (0, context_1.step)(22, 'Live-Sample Serial Independence (informational)', 'INFO', detail),
    ];
}

  },
  "tests/steps/payouts.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Steps 7–10: Payout Integrity
 * The credited amount must equal stake × the derived multiplier, and the multiplier must
 * equal the fair-odds formula (99 / continuousWinChance) — never a trusted operator field.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const config_1 = require("../../src/config");
function run(ctx) {
    const { bets } = ctx;
    // ── Step 7: Multiplier derivation ────────────────────────────────────────────
    // Served multiplier on wins == PAYOUT_NUMERATOR / basisPoints, where basisPoints =
    // round(winChance% × 100) is the win chance re-expressed in hundredths of a percent.
    //
    // `basisPoints` is the AUDITOR'S construction and appears nowhere in the capture. The evidence
    // that it is the operator's form is that the quotient matches the served field bit-for-bit on
    // every captured win, while the float closed form `(100/wc)·(1−edge)` matches only some of them
    // (both counts are printed below). Pinned with strict `===`, so a served multiplier off by even
    // 1 ULP is caught.
    //
    // The numerator is DERIVED from HOUSE_EDGE, not typed as 9900: the mutation registry declares
    // that doubling HOUSE_EDGE must fail THIS step, and a hardcoded 9900 would make that declared
    // guard stop guarding. (1 − 0.01)·10000 is exactly 9900 in binary64; the assertion below keeps
    // that true if the edge ever changes to a value where it is not.
    const numeratorIntegral = Number.isInteger(config_1.PAYOUT_NUMERATOR);
    let mChecked = 0, mFails = 0, maxDev = 0, closedFormAgrees = 0;
    for (const b of bets) {
        if (!b.win)
            continue;
        const bp = (0, config_1.payoutBasisPoints)(b.params); // integer basis points (auditor-derived)
        const served = config_1.PAYOUT_NUMERATOR / bp; // operator's exact multiplier
        const dev = Math.abs(Number(b.multiplier) - served);
        if (dev > maxDev)
            maxDev = dev;
        if (Number(b.multiplier) !== served)
            mFails++; // bit-exact pin, not tolerance
        // The float closed form is the SAME rational and a DIFFERENT binary64 on many bands. Counted, so
        // the report does not call the two forms "bit-exact" equal.
        if (Number(b.multiplier) === (0, config_1.quotedMultiplier)(b.params))
            closedFormAgrees++;
        mChecked++;
    }
    const s7 = (0, context_1.step)(7, 'Multiplier Derivation', mFails === 0 && mChecked > 0 && numeratorIntegral ? 'PASS' : 'FAIL', `${mChecked} winning bets: served multiplier == ${config_1.PAYOUT_NUMERATOR}/basisPoints, numerator derived as (1 − HOUSE_EDGE ${config_1.HOUSE_EDGE})·10000${numeratorIntegral ? '' : ' — NON-INTEGRAL, the derivation is unsound at this edge'} (bit-exact ===); max deviation ${maxDev.toExponential(2)}; ${mFails} mismatches. `
        + `basisPoints = round(winChance%·100) is AUDITOR-DERIVED — the field does not appear in the capture; `
        + `the float closed form (100/winChance%)·(1−edge) is the same rational but a different binary64, agreeing bit-for-bit on only ${closedFormAgrees}/${mChecked} of these wins`);
    // ── Step 8: Credit arithmetic ────────────────────────────────────────────────
    // The credit is settled by the production rule, exactly:
    //   credit == floor8( stake × multiplier )   (floor8CreditUnitsServed, on the served multiplier)
    // asserted on the 1e-8 integer grid with ZERO tolerance, every input taken from its decimal text,
    // at BOTH stakes of the plan. Step 20 asserts the same rule from the band alone
    // (9900/basisPoints), never reading the served multiplier.
    let cChecked = 0, cFails = 0, cRawResidual = 0, firstCreditFail = '';
    let resBelow = 0, resAbove = 0, resExact = 0, resNet = 0, offGrid = 0;
    const perStake = new Map();
    for (const b of bets) {
        const credited = (0, config_1.amountUnits)(b.winningAmount);
        if (credited === null)
            offGrid++;
        const expected = b.win ? (0, config_1.floor8CreditUnitsServed)(b.betAmount, b.multiplier) : 0n;
        if (credited !== expected) {
            cFails++;
            if (!firstCreditFail)
                firstCreditFail = `epoch ${b.epoch} nonce ${b.nonce}: credited ${b.winningAmount} vs floor8 ${expected} units`;
        }
        if (b.win) {
            // Direction and magnitude of the settlement against the raw un-rounded product, in the
            // OPERATOR'S number system: decimal stake × the exact rational 9900/basisPoints.
            const raw = Math.abs((0, config_1.creditResidual)(b.winningAmount, b.betAmount, b.params));
            if (raw > cRawResidual)
                cRawResidual = raw;
            resNet += (0, config_1.creditResidual)(b.winningAmount, b.betAmount, b.params);
            const sign = (0, config_1.creditResidualSign)(b.winningAmount, b.betAmount, b.params);
            if (sign < 0)
                resBelow++;
            else if (sign > 0)
                resAbove++;
            else
                resExact++;
            const k = String(b.betAmount);
            const row = perStake.get(k) ?? { wins: 0, ok: 0, down: 0, exact: 0 };
            row.wins++;
            if (credited === expected)
                row.ok++;
            if (sign < 0)
                row.down++;
            if (sign === 0)
                row.exact++;
            perStake.set(k, row);
        }
        cChecked++;
    }
    const wins = resBelow + resAbove + resExact;
    const stakeRows = [config_1.BASE_STAKE, config_1.ELEVATED_STAKE].map((k) => ({ k, r: perStake.get(k) ?? { wins: 0, ok: 0, down: 0, exact: 0 } }));
    const bothStakes = stakeRows.every(({ r }) => r.wins > 0 && r.ok === r.wins) && perStake.size === stakeRows.length;
    const s8 = (0, context_1.step)(8, 'Credit Arithmetic', cFails === 0 && offGrid === 0 && resAbove === 0 && cChecked === bets.length && bothStakes ? 'PASS' : 'FAIL', `${cChecked}/${bets.length} bets: winningAmount == floor8(stake × multiplier) exactly on the 1e-8 grid, from the served decimal text (loss ⇒ 0); ${cFails} mismatches${firstCreditFail ? ` — first: ${firstCreditFail}` : ''}; ${offGrid} amounts off the 8-dp grid; `
        + `per stake: ${stakeRows.map(({ k, r }) => `${k} USDT ${r.ok}/${r.wins} wins (${r.exact} exactly the product, ${r.down} rounded down)`).join('; ')}; `
        + `against the raw un-rounded product (decimal stake × exact 9900/basisPoints, the operator's own number system, not binary64) the settlement rounds the player DOWN on ${resBelow} and UP on ${resAbove} of ${wins} wins, and lands EXACTLY on the product on ${resExact} (no rounding at all), max |credit − stake×mult| ${cRawResidual.toExponential(2)}, net ${resNet >= 0 ? '+' : ''}${resNet.toExponential(2)} USDT; `
        + `round-down is the rule LIQD stated on 30 September 2026: a credit is never above the exact product and is below it by less than one 0.00000001 unit`);
    // ── Step 9: Loss settlement ──────────────────────────────────────────────────
    // Every losing bet pays exactly 0 and has multiplier 0.
    let lChecked = 0, lFails = 0;
    for (const b of bets) {
        if (b.win)
            continue;
        lChecked++;
        if (Number(b.winningAmount) !== 0 || Number(b.multiplier) !== 0)
            lFails++;
    }
    const s9 = (0, context_1.step)(9, 'Loss Settlement', lFails === 0 && lChecked > 0 ? 'PASS' : 'FAIL', `${lChecked} losing bets: winningAmount == 0 and multiplier == 0; ${lFails} violations`);
    // ── Step 10: Wallet credit consistency + odds bounds ─────────────────────────
    // Wallet-denominated amounts must settle by the SAME exact rule as the game credit, and every
    // captured band's multiplier must lie inside the span the plan played.
    //
    // Three assertions, all exact:
    //   • winningAmountWallet == floor8(stakeWallet × multiplier): the same production rule
    //     Step 8 applies to the game credit, with ZERO tolerance;
    //   • winningAmountWallet == winningAmount and stakeWallet == betAmount, as decimal amounts: the
    //     wallet and game ledgers are the same money in this capture (USDT on both sides), so a
    //     divergence in either direction is a real finding rather than a rounding artefact;
    //   • the quoted multiplier of every captured band is inside [9900/maxBps, 9900/minBps] of the
    //     plan's win chances (src/config.ts EXPECTED_WIN_CHANCES). This is a bound on the CAPTURE
    //     against its plan. LIQD's own odds limits were not read (limitation L7).
    const planBps = config_1.EXPECTED_WIN_CHANCES.map((w) => Math.round(w * 100));
    const minBps = Math.min(...planBps), maxBps = Math.max(...planBps);
    let wChecked = 0, wFails = 0, wLedgerFails = 0, boundFails = 0, wMissing = 0;
    let firstWalletFail = '';
    for (const b of bets) {
        const q = (0, config_1.quotedMultiplier)(b.params);
        const bp = (0, config_1.payoutBasisPoints)(b.params);
        if (bp < minBps || bp > maxBps || !(q > 0))
            boundFails++; // exact bound on the integer basis points, no tolerance
        if (b.stakeWallet == null || b.winningAmountWallet == null) {
            wMissing++;
            continue;
        }
        const expW = b.win ? (0, config_1.floor8CreditUnitsServed)(b.stakeWallet, b.multiplier) : 0n;
        if ((0, config_1.amountUnits)(b.winningAmountWallet) !== expW) {
            wFails++;
            if (!firstWalletFail)
                firstWalletFail = `epoch ${b.epoch} nonce ${b.nonce}: wallet credit ${b.winningAmountWallet} != settled ${expW}`;
        }
        if ((0, config_1.amountUnits)(b.winningAmountWallet) !== (0, config_1.amountUnits)(b.winningAmount) || (0, config_1.amountUnits)(b.stakeWallet) !== (0, config_1.amountUnits)(b.betAmount))
            wLedgerFails++;
        wChecked++;
    }
    // DECLARED LIMITATION L5 (R-CREDIT). No wallet BALANCE before/after a bet is in any production
    // dice reply, so there is no balance ledger to reconcile. stakeWallet and winningAmountWallet ARE
    // present and are checked above with zero tolerance, but they are settle-RESPONSE fields, so what
    // this step establishes is that the operator's reported credit is internally consistent with the
    // formula, not what the wallet was actually credited. Counted so the artifact carries it.
    const balanceLedgerRows = bets.filter((b) => b.balanceOk !== null
        && b.balanceOk !== undefined).length;
    const s10 = (0, context_1.step)(10, 'Wallet Credit & Odds Bounds', wFails === 0 && wLedgerFails === 0 && boundFails === 0 && wMissing === 0 && wChecked === bets.length ? 'PASS' : 'FAIL', `${wChecked}/${bets.length} bets (${wMissing} missing wallet fields): winningAmountWallet == floor8(stakeWallet × multiplier) exactly (${wFails} bad${firstWalletFail ? ` — first: ${firstWalletFail}` : ''}); `
        + `wallet ledger == game ledger (winningAmountWallet == winningAmount, stakeWallet == betAmount) on ${wChecked - wLedgerFails}/${wChecked} (${wLedgerFails} divergent); `
        + `every captured band is priced inside the plan's span, win chance ${(minBps / 100).toFixed(2)}%–${(maxBps / 100).toFixed(2)}% = ${config_1.PAYOUT_NUMERATOR / maxBps}×–${config_1.PAYOUT_NUMERATOR / minBps}× (${boundFails} outside; a bound on the capture against its plan in src/config.ts: LIQD's own odds limits were not read, declared limitation L7); `
        + `wallet BALANCE ledger present on ${balanceLedgerRows}/${bets.length} bets (no balance field in the production dice replies): stakeWallet/winningAmountWallet are settle-RESPONSE fields, so this step establishes internal consistency with the formula, NOT what the wallet was credited: declared limitation L5 / R-CREDIT`);
    return [s7, s8, s9, s10];
}

  },
  "tests/steps/phase-d.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Step 14: Client-Seed Control (DICE-06)
 *
 * In every epoch of the production capture the client seed was submitted by the auditor with the
 * rotation that opened the epoch. Two kinds:
 *   • 28 epochs (phases A, A+ and C): `audit` + 12 hex characters, drawn from the browser CSPRNG at
 *     the moment of the rotation, after the commitment for that epoch had been served;
 *   • 5 epochs (Phase D): a player-set seed with a chosen, recognisable text,
 *     `pfaudit-prod-dice-d<k>-` + 12 hex characters of the browser CSPRNG, one per epoch. These five
 *     were drawn when the plan was built and SUBMITTED at the rotation that opened their epoch, after
 *     the commitment for that epoch had been served. They are not predictable from one another: the
 *     12 hex characters are fresh CSPRNG output in each.
 *
 * The step asserts, from the dataset alone:
 *   (a) every epoch's seed record names one client seed and every bet of that epoch carries it;
 *   (b) the 33 client seeds are distinct; the Phase D epochs, and only they, carry the runner's
 *       player-set mark and the player-set format; Phase D holds at least
 *       PHASE_D_MIN_DISTINCT_SEEDS distinct seeds;
 *   (c) the site took what was submitted: the served client seed IS the submitted one in every
 *       epoch, and the commitment the runner held when it submitted the seed IS the epoch's
 *       commitment;
 *   (d) every roll recomputes under that seed, so the seed the player chose is the one LIQD drew
 *       with (not ignored or overridden), counted separately for Phase D;
 *   (e) the seed is load-bearing: altering the client seed changes the roll at the rate the outcome
 *       lattice predicts (1 − 1/10,000 per bet), measured over every bet.
 * That each seed was submitted AFTER its commitment was served is the capture's own record of its
 * own ordering (the runner's `drawnAfter` field and the event times), not an independently
 * authenticated chronology (L18).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
/** The auditor's client-seed formats on the production capture. */
const AUDITOR_SEED = /^audit[0-9a-f]{12}$/;
const PLAYER_SEED = /^pfaudit-prod-dice-d[1-9]-[0-9a-f]{12}$/;
function run(ctx) {
    const { bets, seeds, seedMap } = ctx;
    // (a) one client seed per epoch, carried by every bet of the epoch
    const seedOfEpoch = new Map(seeds.map((s) => [s.epoch, s.clientSeed]));
    let carried = 0, notCarried = 0;
    for (const b of bets) {
        if (seedOfEpoch.get(b.epoch) === b.clientSeed)
            carried++;
        else
            notCarried++;
    }
    // (b) distinct seeds; the player-set epochs are exactly the plan's Phase D epochs
    const distinct = new Set(seeds.map((s) => s.clientSeed)).size;
    const planPlayer = new Set(config_1.EXPECTED_EPOCHS.filter((e) => e.playerSeeds).map((e) => e.epoch));
    let kindOk = 0;
    for (const s of seeds) {
        const wantPlayer = planPlayer.has(s.epoch);
        if (s.playerSet === wantPlayer && (wantPlayer ? PLAYER_SEED : AUDITOR_SEED).test(s.clientSeed))
            kindOk++;
    }
    const dSeeds = seeds.filter((s) => planPlayer.has(s.epoch));
    const dDistinct = new Set(dSeeds.map((s) => s.clientSeed)).size;
    // (c) the site took the submitted seed, submitted after the epoch's commitment was served
    const taken = seeds.filter((s) => s.submittedClientSeed === s.clientSeed).length;
    const after = seeds.filter((s) => s.drawnAfter === s.hashedServerSeed).length;
    // (d) every roll recomputes under the epoch's client seed; (e) sensitivity over every bet
    let checked = 0, fails = 0, dChecked = 0, dFails = 0, changed = 0;
    for (const b of bets) {
        const ss = seedMap.get(b.hashedServerSeed);
        if (!ss)
            continue;
        const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce);
        const ok = (0, config_1.servedRollMatches)(Number(b.roll), local / config_1.SCALE);
        if (!ok)
            fails++;
        checked++;
        if (planPlayer.has(b.epoch)) {
            dChecked++;
            if (!ok)
                dFails++;
        }
        if ((0, rng_1.diceRoll)(ss, b.clientSeed + 'x', b.nonce) !== local)
            changed++;
    }
    const dBets = bets.filter((b) => planPlayer.has(b.epoch)).length;
    const expectedChanged = checked * (1 - 1 / config_1.RANGE);
    // An unused client seed changes 0 rolls; a used one leaves a roll unchanged only on a 1-in-10,000
    // collision. The bound is half the population: far from both.
    const sensitivityOk = checked > 0 && changed > checked / 2;
    const ok = notCarried === 0 && carried === bets.length
        && seeds.length === config_1.EXPECTED_SEEDS && distinct === seeds.length && kindOk === seeds.length
        && dSeeds.length === planPlayer.size && dDistinct >= config_1.PHASE_D_MIN_DISTINCT_SEEDS && dDistinct === dSeeds.length
        && taken === seeds.length && after === seeds.length
        && fails === 0 && checked === bets.length && checked > 0
        && dFails === 0 && dChecked === dBets && dChecked > 0 && sensitivityOk;
    const s14 = (0, context_1.step)(14, 'Client-Seed Control', ok ? 'PASS' : 'FAIL', `${seeds.length} epochs, each under its own client seed submitted by the auditor: ${distinct}/${seeds.length} distinct; ${kindOk}/${seeds.length} of the kind the plan gives the epoch (${seeds.length - dSeeds.length} audit+12-hex seeds drawn from the browser CSPRNG at the rotation, ${dSeeds.length} player-set Phase D seeds pfaudit-prod-dice-d<k>-+12-hex); `
        + `Phase D: ${dDistinct} distinct player-set seeds (floor ${config_1.PHASE_D_MIN_DISTINCT_SEEDS}), ${dChecked - dFails}/${dBets} Phase D rolls recompute under them (${dFails} fail); `
        + `${taken}/${seeds.length} epochs served the submitted seed back, and in ${after}/${seeds.length} the commitment the runner held when it submitted the seed is the epoch's commitment; `
        + `${carried}/${bets.length} bets carry their epoch's client seed (${notCarried} do not); ${checked - fails}/${bets.length} rolls recompute under it (${fails} fail); `
        + `client-seed sensitivity: appending one character to the client seed changes the roll on ${changed}/${checked} bets (the 10,000-point lattice predicts ${expectedChanged.toFixed(1)}; 0 would mean the seed is not used) (${sensitivityOk}). `
        + `That each seed was submitted after its commitment was served is the capture's own record of its ordering, not independently authenticated (L18)`);
    return [s14];
}

  },
  "tests/steps/simulation.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Steps 16–17: Simulation Cross-Check
 * Scores the frozen outputs/simulation-results.json (produced by `npm run simulate`):
 *   16 — Pass 1 (fresh seeds): draw uniformity + serial independence + effective-edge table +
 *        the RTP-convergence series + edge
 *        convergence on 98 over-mode targets × 1,000,000 bets and their cross-target mean RTP, all
 *        within tolerance at the pinned sample depths.
 *   17 — Pass 2 (casino seeds): the DICE-21 load-bearing served-band PAYOUT-WEIGHTED RETURN scan —
 *        every revealed seed × 10,000 nonces, early window = the captured nonce range, reference =
 *        the remainder; the statistic is the payout-weighted return of the bands the casino actually
 *        served, standardised by its EXACT per-bet mean and variance (a scaled Poisson-binomial
 *        across seeds, each pᵢ the served band's exact lattice win-probability) and read against the
 *        one-sided normal (CLT) lower tail (EXACT moments, ASYMPTOTIC tail — NOT an exact-lattice
 *        CDF). Plus, RETAINED as supplementary, the exact-discrete draw-uniformity cherry-pick scan
 *        and the DICE-22 pooled real-roll uniformity — all RE-DERIVED here from the dataset's own
 *        revealed seeds and rolls.
 *
 * WHAT THIS STEP TRUSTS. Nothing in the artifact except the numbers it can re-derive or bound:
 *
 *   • every THRESHOLD comes from src/config.ts or from α — never from the artifact
 *     (a forged `zCritical` / `tolSE` / `cherryPickP0` cannot loosen the test);
 *   • every SAMPLE DEPTH is required to equal its `src/config.ts` constant — `pass1.draws`,
 *     `serial.n`, each band's `n`, and the convergence series' final `n` — without that,
 *     `pass1.draws = 1`, a truncated one-point convergence series and a
 *     `serial.n`-less block all pass;
 *   • every POPULATION is required to BE the right population, not merely the right size
 *     (G-BIND). The nine effective-edge rows must be the nine canonical `SIM_EDGE_BANDS`,
 *     distinct; the per-seed rows must carry the dataset's own distinct epochs, one per seed. A count
 *     is not an identity: nine copies of the easiest band, or one copy of an unflagged seed per epoch,
 *     would otherwise return a Full Pass;
 *   • every Pass-2 STATISTIC is recomputed from `ctx.seeds` and `ctx.bets` — 100 HMACs per seed and
 *     one histogram of the captured rolls, well under a second — and compared under the reproduction rule
 *     below. The artifact cannot report a per-seed p-value, a flag, a χ², or a pooled statistic
 *     that the verifier did not itself reproduce from the pinned dataset;
 *   • the artifact's own `pass` booleans are read ONLY for traceability. If a self-report
 *     disagrees with the recomputation the step HARD-FAILS.
 *
 * THE REPRODUCTION RULE. Integers and pure-arithmetic statistics are compared EXACTLY: the producer
 * writes full-precision doubles and both sides run the same deterministic arithmetic, so a tolerance
 * there would be unearned (S-EXACT). libm-dependent floats — p-values, the χ² beside them, normal
 * quantiles — are compared at 1e-14 absolute + 1e-12 relative (src/diff.ts numbersAgree, since
 * 2026-09-28; see `agree` below), and the served-band aggregate sums at 1e-9.
 *
 * ── THE RAW STATISTICS, AND THE FORGERY THAT SHOWED WHY THEY NEED SCORING ──────────────────────
 * Everything above re-derives the PINNED and DERIVED fields. Four RAW STATISTICS admit no such
 * treatment, because they are the simulation's actual output and nothing else can produce them:
 * `uniformity.chi2`, `serial.lag1`, `serial.runsZ`, and each band's `simulatedRTP`. An attacker
 * rewrote the whole `pass1` block with `uniformity.chi2 = 0` (p = 1.0), `lag1 = 0`, `runsZ = 0`,
 * every band's `simulatedRTP` set exactly equal to theory and every convergence point exactly on
 * theory, then recomputed every derived field with OUR OWN formulas so the re-derivation
 * reconciled — and the suite returned 21/21 Full Pass. `README.md` claimed "a forged flag is
 * rejected rather than trusted"; a forged STATISTIC was trusted.
 *
 * Three changes, which ship together because each is weak alone:
 *
 *   1. DETERMINISM. `npm test` no longer regenerates the artifact before scoring it
 *      (`mocha && npm run verify`); Step 16 scores the COMMITTED artifact, pinned by
 *      `SIMULATION_SHA256` and reconciled in Step 19. Regeneration lives in `npm run test:full`.
 *   2. MULTIPLICITY. The three α-screens (uniformity, lag-1, runs) are judged at ALPHA_SCREEN =
 *      ALPHA/3 (Bonferroni), so the STEP's level is ALPHA. Each running at ALPHA instead makes the
 *      step's real false-positive rate on honest data 1 − 0.99³ = 2.97% — measured at 1 trip in
 *      20 runs.
 *   3. A TWO-SIDED UNIFORMITY SCREEN. The Pass-1 χ² is judged in BOTH tails: the upper tail is the
 *      real test (the draw is not uniform) and the lower tail rejects a histogram that sits closer
 *      to its expectation than a 2,000,000-draw sample plausibly can. That is an ordinary two-sided
 *      test with an ordinary size (ALPHA_SCREEN, half in each tail) and it is what rejects the
 *      forged chi2 = 0.
 *
 * The pin is NOT the defence here and must not be mistaken for one — anyone who can forge the
 * artifact can re-pin it in the same commit. What survives a re-pinned forgery is the two-sided
 * screen plus the structural re-derivation below, and that is the configuration the counterexample
 * in `tests/structural-forgeries.json` exercises.
 *
 * ── WHAT IS DELIBERATELY NOT SCORED, AND WHY ───────────────────────────────────────────────────
 * A set of EQUALITY-BASED rejections under the banner "perfection is evidence of fabrication" —
 * `simulatedRTP === theoreticalRTP`, `deltaSE === 0`, a convergence point exactly on theory,
 * `lag1 === 0`, `runsZ === 0` — is absent on purpose. Such rejections are wrong.
 *
 * Every one of those is an event with positive probability under the null. Exactly 40,000 wins in
 * 2,000,000 `over 98` bets gives an RTP of exactly 0.99 — the theoretical value — with probability
 * 0.0020149586, about one run in 496. The runs test returns z = 0 whenever the observed run count
 * equals its expectation, which is a healthy sample, not a degenerate one. A suite carrying those
 * predicates declares an honest simulation a forgery, and the declared 1 % error bound accounts
 * for none of them. `SCORED_STATISTICAL_PREDICATES` in `src/sim-checks.ts` enumerates every
 * statistical screen that can move the verdict, with its size and its approximation limits.
 *
 * What replaces them is stronger, because it tests structure rather than intent: a convergence point
 * is the producer's return for an INTEGER win count, so the candidate count is recovered, the return
 * that count implies is RECONSTRUCTED and the published RTP must be what it produces (recovery by
 * `Math.round` alone accepts an `over 98` RTP of 0.99000495 — 40,000.2
 * wins — for a clean 21/21), the counts must
 * be cumulatively consistent across the nested checkpoints, and the standard error is recomputed
 * bit-for-bit from `(n, rtp, wins, m)` instead of merely being checked for finiteness. That last
 * point matters: checked only for finiteness, a plotted SE of 123456 passes verification AND chart
 * comparison, because `src/chart.ts` clamps the ±5·SE ribbon to the plot box. Perfection is reported as an
 * observation and never scored; an SE that no sample could produce is scored and fails.
 *
 * Records the actual sim artifact hash on ctx.simArtifact.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_crypto_1 = require("node:crypto");
const context_1 = require("./context");
const stats_1 = require("../../src/stats");
const config_1 = require("../../src/config");
const exact_chi2_1 = require("../../src/exact-chi2");
const diff_1 = require("../../src/diff");
const rng_1 = require("../../src/rng");
const sim_checks_1 = require("../../src/sim-checks");
/**
 * CHERRY_P0 — the null probability that one epoch is flagged. DERIVED in src/exact-chi2.ts from
 * the exact discrete null of the n=50 / 20-bin χ², and imported by BOTH the producer and this
 * verifier (S-CONST). It was previously a private literal here (0.0438147684) while
 * `src/simulate.ts` used 0.0475 — the two sides of the same test disagreeing on the null, which
 * is what made Step 17 print "DISAGREES with recomputation" on an untampered artifact.
 */
const CHERRY_P0 = (0, exact_chi2_1.cherryFlagRate)();
/**
 * A RECOMPUTED libm-dependent float (a p-value, a chi² beside it, a normal quantile) against the
 * shipped one: the reproduction rule, 1e-14 absolute + 1e-12 relative (src/diff.ts numbersAgree),
 * not bit equality. These values come through Math.exp / Math.log (incomplete gamma, erf, AS 241),
 * which are not guaranteed bit-identical across platforms — 1-ulp drift was measured
 * on Linux for exactly this class (2026-09-28). A shipped value moved by more than the bound
 * still FAILs (tests/mutations.json: the three 'beyond the reproduction bound' entries). Integers
 * (df, counts) stay exact, and so does every pure-arithmetic statistic in this file.
 */
const agree = (a, b) => typeof a === 'number' && typeof b === 'number' && (0, diff_1.numbersAgree)(a, b);
function run(ctx) {
    const file = path.join(ctx.outputsDir, 'simulation-results.json');
    if (!fs.existsSync(file)) {
        ctx.simArtifact = null;
        return [
            (0, context_1.step)(16, 'Simulation — Pass 1 (RNG)', 'FLAG', 'outputs/simulation-results.json absent — run `npm run simulate`'),
            (0, context_1.step)(17, 'Simulation — Pass 2 (Cherry-Pick)', 'FLAG', 'simulation artifact absent'),
        ];
    }
    const raw = fs.readFileSync(file);
    const sim = JSON.parse(raw.toString('utf8'));
    ctx.simArtifact = { file: 'outputs/simulation-results.json', sha256: (0, node_crypto_1.createHash)('sha256').update(raw).digest('hex') };
    // ── Step 16: Pass 1 — recompute every predicate from the stored statistics ─────
    const p1 = sim.pass1 ?? {};
    const modelOk = sim.model?.range === config_1.RANGE && sim.model?.houseEdge === config_1.HOUSE_EDGE
        && sim.model?.cursor === config_1.CURSOR && sim.model?.scale === config_1.SCALE;
    // (a) draw uniformity — depth pinned, p recomputed from the stored χ², self-report reconciled.
    // TWO-SIDED at ALPHA_SCREEN (ALPHA_SCREEN/2 per tail): the upper tail is the real test (the draw
    // is not uniform); the lower tail rejects a fabricated statistic (the draw is TOO uniform to be a
    // 2,000,000-sample χ², i.e. the statistic was written rather than measured).
    const uni = p1?.uniformity ?? {};
    const uniDepthOk = p1?.draws === config_1.SIM_UNIFORMITY_DRAWS && Number(uni.n) === config_1.SIM_UNIFORMITY_DRAWS
        && Number(uni.bins) === 100 && Number(uni.df) === 99;
    const uniP = (0, stats_1.chiSquaredPValue)(Number(uni.chi2), Number(uni.df));
    const uniTooUniform = uniP > 1 - config_1.ALPHA_SCREEN / 2;
    const uniNonUniform = uniP < config_1.ALPHA_SCREEN / 2;
    const uniPass = modelOk && uniDepthOk && Number.isFinite(Number(uni.chi2))
        && !uniNonUniform && !uniTooUniform
        && agree(uni.pValue, uniP); // stored p must BE the recomputed p (reproduction bound)
    // (b) serial screen — depth pinned, and lag1Z re-derived from the correlation it summarises.
    // Both arms judged at ALPHA_SCREEN (Bonferroni), and both are already two-sided.
    const ser = p1?.serial ?? {};
    const zCrit = (0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN); // derived from α/k (not ser.zCritical)
    const lag1 = Number(ser.lag1), lag1Z = Number(ser.lag1Z), runsZ = Number(ser.runsZ);
    const lag1ZDerived = lag1 * Math.sqrt(config_1.SIM_SERIAL_DRAWS);
    const runsPDerived = (0, stats_1.twoSidedNormalP)(runsZ); // derived from runsZ (not ser.runsP)
    // ── SCHEMA VERSION ─────────────────────────────────────────────────────────────────────────
    // Schema 1 is the historical artifact: raw statistics only. Schema 2 additionally stores the
    // integer counts behind them, so the runs z becomes RE-DERIVABLE. The old artifact is scored
    // under schema-1 rules and is not re-labelled — a new schema must not be able to masquerade as
    // the original experiment.
    const schemaVersion = Number(sim.schemaVersion ?? 1);
    const schemaKnown = schemaVersion === 1 || schemaVersion === sim_checks_1.SIM_SCHEMA_VERSION;
    // Runs z from its own cell counts, when the artifact carries them. The DEGENERATE case is zero
    // VARIANCE (every observation on one side of the split) — a property of the sample. `runsZ === 0`
    // is NOT degeneracy: it means the run count landed on its expectation, which is a legitimate and
    // not especially unlikely outcome, and rejecting it would be a defect.
    let runsNote;
    let runsStructureOk = true;
    if (schemaVersion >= 2) {
        const runsCount = Number(ser.runs), n1 = Number(ser.n1), nSer = Number(ser.n);
        const okCounts = Number.isInteger(runsCount) && Number.isInteger(n1) && Number.isInteger(nSer)
            && n1 >= 0 && n1 <= nSer && runsCount >= 1 && runsCount <= nSer;
        const rs = okCounts ? (0, sim_checks_1.runsStatistic)(runsCount, n1, nSer) : null;
        runsStructureOk = okCounts && !!rs && !rs.degenerate && rs.z === runsZ;
        runsNote = !okCounts
            ? 'runs cell counts (runs, n1, n) absent or out of range — schema 2 requires them'
            : rs.degenerate
                ? `runs variance is 0 (n1=${n1} of n=${nSer}) — every observation on one side of the split, so there is no runs distribution`
                : rs.z === runsZ
                    ? `runsZ RE-DERIVED from cell counts (runs=${runsCount}, n1=${n1}, n=${nSer}; variance ${rs.variance.toExponential(4)} > 0)`
                    : `runsZ ${runsZ} != ${rs.z} re-derived from cell counts (runs=${runsCount}, n1=${n1}, n=${nSer})`;
    }
    else {
        runsNote = 'schema 1: runs cell counts absent, so runsZ is NOT re-derivable here — it is a raw '
            + 'statistic bounded only by its own two-sided screen (L1). A z of exactly 0 is an ordinary '
            + 'outcome and is not treated as evidence of anything';
    }
    // Schema 2 must also carry the threshold it was produced under, and it must be the one the
    // verifier applies (the shipped schema-1 artifact stores 2.576236081309571, the critical
    // z at the UNCORRECTED α — a stale field the verifier never reads).
    const zCriticalStored = Number(ser.zCritical);
    const zCriticalOk = schemaVersion >= 2 ? agree(zCriticalStored, zCrit) : true;
    const zCriticalNote = schemaVersion >= 2
        ? (zCriticalOk ? `stored zCritical ${zCriticalStored} IS the applied threshold` : `stored zCritical ${zCriticalStored} != applied ${zCrit}`)
        : `stored zCritical ${Number.isFinite(zCriticalStored) ? zCriticalStored : 'absent'} is a LEGACY schema-1 field at the uncorrected α and is not read; the threshold APPLIED is ${zCrit}`;
    const serialPass = schemaKnown && Number(ser.n) === config_1.SIM_SERIAL_DRAWS
        && Number.isFinite(lag1) && Number.isFinite(lag1Z) && lag1Z === lag1ZDerived
        && Math.abs(lag1Z) < zCrit
        && Number.isFinite(runsZ) && runsPDerived >= config_1.ALPHA_SCREEN && agree(ser.runsP, runsPDerived)
        && runsStructureOk && zCriticalOk;
    // (c) effective-edge table — the nine rows must BE the nine canonical bands, distinct
    const edgeRows = Array.isArray(p1?.effectiveEdge) ? p1.effectiveEdge : [];
    const wantBands = new Set(config_1.SIM_EDGE_BANDS.map((b) => (0, config_1.bandKey)(b.params)));
    const gotBands = new Set(edgeRows.map((r) => (r?.params ? (0, config_1.bandKey)(r.params) : 'INVALID')));
    const bandsIdentical = gotBands.size === wantBands.size
        && [...wantBands].every((k) => gotBands.has(k))
        && edgeRows.length === config_1.SIM_EDGE_BANDS.length;
    // Each row's DERIVED fields are re-derived here and required to match exactly, so the row
    // cannot carry a theory value, a multiplier, a win chance or an SE the band does not imply
    // (framework forged-artifact battery F4/F7). Only `simulatedRTP` is genuinely the simulation's
    // output; everything else on the row is a function of `params` and `n` — and of `simulatedRTP`
    // for the SE — so everything else is checked, not read.
    let edgeFieldMismatches = 0, edgeOnTheory = 0, edgeCountBad = 0, edgeCountExact = 0;
    const edgeCountNotes = [];
    const edgeWithin = edgeRows.filter((r) => {
        if (!r?.params || Number(r.n) !== config_1.SIM_EDGE_BETS)
            return false; // each band at the pinned depth
        const theo = (0, config_1.theoreticalRTP)(r.params), m = (0, config_1.quotedMultiplier)(r.params), pr = (0, config_1.discreteWinProbability)(r.params);
        const simRtp = Number(r.simulatedRTP);
        if (!Number.isFinite(simRtp) || !Number.isFinite(theo) || !Number.isFinite(m) || !Number.isFinite(pr)) {
            edgeFieldMismatches++;
            return false;
        }
        const se = Math.sqrt(pr * (m - simRtp) ** 2 + (1 - pr) * simRtp ** 2) / Math.sqrt(Number(r.n));
        const fieldsOk = r.quotedMultiplier === m
            && r.theoreticalRTP === theo
            && r.discreteWinPct === pr * 100
            && r.theoreticalEdgePct === (1 - theo) * 100
            && r.se === se
            && r.deltaSE === Math.abs(simRtp - theo) / se
            && r.tolSE === 5;
        if (!fieldsOk)
            edgeFieldMismatches++;
        // STRUCTURE, not perfection. A band's simulated RTP is the producer's return for an
        // INTEGER win count, so the candidate count is recovered and the RTP is then verified against
        // the return that count reconstructs to; schema 2 stores the count and it must then agree with
        // the RTP it is supposed to have produced. What is NOT rejected any more is `simRtp === theo`
        // or `deltaSE === 0`: exactly 40,000 wins in 2,000,000 `over 98` bets gives an RTP of exactly
        // 0.99 with probability 0.0020149586, and calling that a forgery was wrong.
        //
        // A recovery that stopped at `Math.round`, accepting anything within a quarter of a win of an
        // integer, lets `simulatedRTP = 0.99000495` on this same `over 98` band — 40,000.2 wins, a
        // FRACTIONAL count — round to 40,000 and return a 21/21 Full Pass. The count is instead
        // reconstructed forward (`reconstructReturn`) and the published RTP must BE what it produces.
        // The counterexample is registered as a declared mutation:
        // tests/forgeries/fractional-win-count.mjs.
        const rec = (0, sim_checks_1.recoverWinCount)(simRtp, Number(r.n), m, r.wins);
        if (!rec.ok) {
            edgeCountBad++;
            if (edgeCountNotes.length < 3)
                edgeCountNotes.push(`${r.label ?? 'band'}: ${rec.reason}`);
        }
        else if (rec.match === 'exact')
            edgeCountExact++;
        if (simRtp === theo)
            edgeOnTheory++; // observed and reported; never scored
        return fieldsOk && rec.ok && Math.abs(simRtp - theo) <= 5 * se + 1e-4;
    }).length;
    const edgePass = bandsIdentical && edgeFieldMismatches === 0 && edgeCountBad === 0
        && edgeWithin === edgeRows.length;
    // (d) RTP convergence — the series must reach SIM_RTP_BETS at the documented marks, and the
    // headline finalRTP must BE the last plotted point.
    const rc = p1?.rtpConvergence ?? {};
    const convTheo = (0, config_1.theoreticalRTP)(config_1.SIM_RTP_STRATEGY);
    const convPts = Array.isArray(rc.points) ? rc.points : [];
    const marksOk = convPts.length === config_1.SIM_RTP_MARKS.length
        && config_1.SIM_RTP_MARKS.every((n, i) => Number(convPts[i]?.n) === n);
    const lastPt = convPts.length ? convPts[convPts.length - 1] : null;
    const convN = lastPt ? Number(lastPt.n) : 0;
    const convRtp = Number(rc.finalRTP);
    const convPr = (0, config_1.discreteWinProbability)(config_1.SIM_RTP_STRATEGY), convM = (0, config_1.quotedMultiplier)(config_1.SIM_RTP_STRATEGY);
    const convSe = convN > 0 ? Math.sqrt(convPr * (convM - convRtp) ** 2 + (1 - convPr) * convRtp ** 2) / Math.sqrt(convN) : Infinity;
    const convIdentity = marksOk && convN === config_1.SIM_RTP_BETS && Number(rc.n) === config_1.SIM_RTP_BETS
        && rc.params !== undefined && (0, config_1.bandKey)(rc.params) === (0, config_1.bandKey)(config_1.SIM_RTP_STRATEGY)
        && rc.multiplier === convM && rc.theoreticalRTP === convTheo
        && lastPt !== null && rc.finalRTP === lastPt.rtp && rc.finalRTPRunning === lastPt.rtp
        && convPts.every((pt) => Number.isFinite(Number(pt?.rtp)) && Number.isFinite(Number(pt?.se)));
    // ── EVERY PLOTTED STANDARD ERROR IS VALIDATED ───────────────────────────────────────────────
    // Not `isFinite`. Each checkpoint's integer win count is recovered from its own published RTP,
    // the counts are required to be cumulatively consistent across the nested marks, and the SE is
    // recomputed from (n, rtp, wins, m) and compared bit-for-bit. This is what rejects the forged
    // SE = 123456, which passed the old finiteness check and drew an IDENTICAL chart because
    // `src/chart.ts` clamps the ±5·SE ribbon to the plot box. Points sitting exactly on theory are
    // COUNTED and reported; they are not a rejection.
    const series = (0, sim_checks_1.validateConvergenceSeries)(convPts, convM, convTheo);
    const convPass = convIdentity && series.ok && Number.isFinite(convRtp)
        && Math.abs(convRtp - convTheo) <= 5 * convSe + 1e-4;
    // Reported so the chapters can cite Δ/SE from a producing artifact instead of typing it
    // (an earlier RTP chapter's verdict table said "≈0.7·SE" against an artifact that gives 1.04).
    const convDeltaSE = Number.isFinite(convRtp) && convSe > 0 ? Math.abs(convRtp - convTheo) / convSe : NaN;
    // (e) EDGE CONVERGENCE ON 98 TARGETS. The rows
    // must BE the 98 canonical SIM_TARGETS in order; each sits at its fixed position in the pinned
    // seed stream (SIM_TARGET_SEED_COUNTER_BASE + t·SIM_TARGET_SEEDS_EACH), and its client seed and
    // first server seed are RE-DERIVED from that position (simSeedAt), so a row cannot have been run
    // on seeds of its own choosing. Every derived field is re-derived, its RTP must be the return of
    // its stored integer win count (reconstructed forward), it must sit within 5·SE + 1e-4 of theory,
    // and its per-mark running series is validated like the under-50 series (integer counts
    // reconstructing bit for bit, cumulatively consistent, every SE recomputed exactly), with the
    // last mark identical to the row.
    const tgtRows = Array.isArray(p1?.targets) ? p1.targets : [];
    const targetsIdentical = tgtRows.length === config_1.SIM_TARGETS.length
        && config_1.SIM_TARGETS.every((t, i) => !!tgtRows[i]?.params && (0, config_1.bandKey)(tgtRows[i].params) === (0, config_1.bandKey)(t.params));
    let tgtWithin = 0, tgtFieldBad = 0, tgtSeedBad = 0, tgtCountBad = 0, tgtCountExact = 0, tgtMarksBad = 0, tgtMarkExact = 0, tgtOnTheory = 0;
    const tgtNotes = [];
    const perTargetMarks = [];
    tgtRows.forEach((r, i) => {
        const label = String(r?.label ?? `target ${i}`);
        const okShape = !!r?.params && Number(r.n) === config_1.SIM_TARGET_BETS && typeof r.simulatedRTP === 'number';
        const m = okShape ? (0, config_1.quotedMultiplier)(r.params) : NaN, pr = okShape ? (0, config_1.discreteWinProbability)(r.params) : NaN;
        const theo = okShape ? (0, config_1.theoreticalRTP)(r.params) : NaN;
        const simRtp = Number(r?.simulatedRTP);
        const se = okShape ? (0, sim_checks_1.rowSE)(pr, m, simRtp, config_1.SIM_TARGET_BETS) : NaN;
        const first = config_1.SIM_TARGET_SEED_COUNTER_BASE + i * config_1.SIM_TARGET_SEEDS_EACH;
        const seedOk = r?.seedCounterFirst === first && r?.seedCounterCount === config_1.SIM_TARGET_SEEDS_EACH
            && r?.clientSeed === (0, sim_checks_1.simSeedAt)(first + 1) && r?.firstServerSeed === (0, sim_checks_1.simSeedAt)(first + 2);
        const fieldsOk = okShape && r.quotedMultiplier === m && r.theoreticalRTP === theo
            && r.discreteWinPct === pr * 100 && r.theoreticalEdgePct === (1 - theo) * 100
            && r.se === se && r.deltaSE === Math.abs(simRtp - theo) / se && r.tolSE === 5;
        const rec = okShape ? (0, sim_checks_1.recoverWinCount)(simRtp, config_1.SIM_TARGET_BETS, m, r.wins) : null;
        const marks = Array.isArray(r?.marks) ? r.marks : [];
        const series = (0, sim_checks_1.validateConvergenceSeries)(marks, m, theo);
        const lastMark = marks[marks.length - 1];
        const marksOk = series.ok && marks.length === config_1.SIM_TARGET_MARKS.length
            && config_1.SIM_TARGET_MARKS.every((nAt, k) => marks[k]?.n === nAt)
            && lastMark?.wins === r?.wins && lastMark?.rtp === r?.simulatedRTP;
        if (!fieldsOk)
            tgtFieldBad++;
        if (!seedOk)
            tgtSeedBad++;
        if (!rec?.ok)
            tgtCountBad++;
        else if (rec.match === 'exact')
            tgtCountExact++;
        if (!marksOk)
            tgtMarksBad++;
        if (simRtp === theo)
            tgtOnTheory++; // observed and reported; never scored
        tgtMarkExact += series.exactReconstructions;
        if (tgtNotes.length < 3) {
            if (!seedOk)
                tgtNotes.push(`${label}: not at its seed-stream position ${first} (or its seeds are not simSeedAt(${first + 1}), simSeedAt(${first + 2}))`);
            else if (!rec?.ok)
                tgtNotes.push(`${label}: ${rec?.reason ?? 'malformed row'}`);
            else if (!fieldsOk)
                tgtNotes.push(`${label}: a derived field disagrees with re-derivation`);
            else if (!marksOk)
                tgtNotes.push(`${label} marks: ${series.ok ? 'mark sizes or last mark do not match the row' : series.failures.slice(0, 1).join('')}`);
        }
        perTargetMarks.push(series.points.map((pt, k) => ({ rtp: Number(marks[k]?.rtp), se: pt.expectedSE })));
        if (fieldsOk && seedOk && rec?.ok && marksOk && Math.abs(simRtp - theo) <= 5 * se + 1e-4)
            tgtWithin++;
    });
    const targetsPass = targetsIdentical && tgtFieldBad === 0 && tgtSeedBad === 0 && tgtCountBad === 0
        && tgtMarksBad === 0 && tgtWithin === config_1.SIM_TARGETS.length;
    // (f) THE 98-TARGET MEAN — the convergence series the chart draws. Every plotted point is
    // RECOMPUTED from the targets' validated per-mark values (crossTargetPoint: mean RTP and
    // SE = sqrt(Σ SEₜ²)/98) and must equal the stored point exactly, so neither a plotted mean nor a
    // plotted SE can be edited on its own (`src/chart.ts` clamps the ±5·SE ribbon to the plot box,
    // so an absurd SE draws the same chart). finalRTP must BE the last point.
    const tc = p1?.targetConvergence ?? {};
    const tcPts = Array.isArray(tc.points) ? tc.points : [];
    const tcTheo = (0, sim_checks_1.crossTargetTheory)(config_1.SIM_TARGETS.map((t) => (0, config_1.theoreticalRTP)(t.params)));
    const tcRecomputed = targetsIdentical && perTargetMarks.every((ms) => ms.length === config_1.SIM_TARGET_MARKS.length)
        ? config_1.SIM_TARGET_MARKS.map((nAt, k) => ({ n: nAt, ...(0, sim_checks_1.crossTargetPoint)(perTargetMarks.map((ms) => ms[k])) }))
        : [];
    const tcPointsMatch = tcRecomputed.length === config_1.SIM_TARGET_MARKS.length && tcPts.length === tcRecomputed.length
        && tcRecomputed.every((q, k) => tcPts[k]?.n === q.n && tcPts[k]?.rtp === q.rtp && tcPts[k]?.se === q.se);
    const tcLast = tcPts.length ? tcPts[tcPts.length - 1] : null;
    const tcRtp = Number(tc.finalRTP), tcSe = tcLast ? Number(tcLast.se) : Infinity;
    const tcIdentity = tc.method === 'cross-target mean' && tc.targets === config_1.SIM_TARGETS.length
        && tc.perTargetBets === config_1.SIM_TARGET_BETS && tc.totalBets === config_1.SIM_TARGETS.length * config_1.SIM_TARGET_BETS
        && Array.isArray(tc.marks) && tc.marks.length === config_1.SIM_TARGET_MARKS.length && config_1.SIM_TARGET_MARKS.every((nAt, k) => tc.marks[k] === nAt)
        && tc.theoreticalRTP === tcTheo && tcLast !== null && tc.finalRTP === tcLast.rtp && tc.finalSE === tcLast.se
        && tc.finalDeltaSE === Math.abs(tcRtp - tcTheo) / tcSe;
    const tcPass = tcIdentity && tcPointsMatch && Number.isFinite(tcRtp) && Math.abs(tcRtp - tcTheo) <= 5 * tcSe + 1e-4;
    const tcDeltaSE = Number.isFinite(tcRtp) && tcSe > 0 ? Math.abs(tcRtp - tcTheo) / tcSe : NaN;
    const recomputed16 = uniPass && serialPass && edgePass && convPass && targetsPass && tcPass;
    // Traceability: what the artifact says about itself, and whether it agrees with recomputation.
    const selfReport16 = p1?.uniformity?.pass === true && p1?.serial?.pass === true
        && edgeRows.length > 0 && edgeRows.every((r) => r.withinTol === true)
        && tgtRows.length > 0 && tgtRows.every((r) => r.withinTol === true);
    const agree16 = recomputed16 === selfReport16;
    const fmt = (x, d) => (Number.isFinite(Number(x)) ? Number(x).toFixed(d) : String(x));
    const s16 = (0, context_1.step)(16, 'Simulation — Pass 1 (RNG + Edge)', recomputed16 && agree16 ? 'PASS' : 'FAIL', `scored against the COMMITTED artifact (pinned by SIMULATION_SHA256, reconciled in Step 19) — this step is deterministic, not a fresh experiment; artifact schema v${schemaVersion}${schemaKnown ? '' : ' (UNKNOWN SCHEMA)'}, verifier schema v${sim_checks_1.SIM_SCHEMA_VERSION}; ${config_1.ALPHA_SCREENS} screens Bonferroni-corrected to α_screen=${config_1.ALPHA_SCREEN.toExponential(3)} so THOSE THREE have a family-wise level of α=${config_1.ALPHA}. `
        + `draw uniformity chi²=${fmt(uni.chi2, 3)} df=${uni.df} at n=${uni.n} (pinned ${config_1.SIM_UNIFORMITY_DRAWS}) → recomputed p=${uniP.toFixed(4)}, two-sided: rejected if p<${(config_1.ALPHA_SCREEN / 2).toExponential(2)} (non-uniform) or p>${(1 - config_1.ALPHA_SCREEN / 2).toFixed(6)} (TOO uniform for a ${config_1.SIM_UNIFORMITY_DRAWS}-draw sample)${uniTooUniform ? ' — LOWER-TAIL REJECT' : ''}${uniNonUniform ? ' — UPPER-TAIL REJECT' : ''} (${uniPass ? 'ok' : 'FAIL'}); `
        + `serial at n=${ser.n} (pinned ${config_1.SIM_SERIAL_DRAWS}): lag1Z=${fmt(lag1Z, 3)} == lag1·√n (${lag1Z === lag1ZDerived ? 'reconciled' : 'MISMATCH'}) < zCrit ${zCrit.toFixed(4)} (the two-sided normal quantile at α_screen, AS 241), runsP=${runsPDerived.toFixed(4)} (derived from runsZ=${fmt(runsZ, 3)}) ≥ α_screen; ${runsNote}; ${zCriticalNote} (${serialPass ? 'ok' : 'FAIL'}); `
        + `effective-edge ${edgeWithin}/${edgeRows.length} bands within 5·SE+1e-4 of theory at n=${config_1.SIM_EDGE_BETS} (recomputed), band set ${bandsIdentical ? `identical to the ${config_1.SIM_EDGE_BANDS.length} canonical bands` : 'NOT the canonical band set'}, ${edgeFieldMismatches} row(s) whose derived fields disagree with re-derivation, ${edgeCountExact}/${edgeRows.length} row(s) whose simulatedRTP IS bit-for-bit the return their integer win count reconstructs to (the producer's own per-win accumulation, replayed) and ${edgeCountBad} row(s) whose simulatedRTP is the return of NO integer win count${edgeCountNotes.length ? ` (e.g. ${edgeCountNotes.join('; ')})` : ''}; `
        + `RTP convergence ${convPts.length} points at the pinned marks (${marksOk ? 'ok' : 'MARKS MISMATCH'}), ends at n=${convN} (pinned ${config_1.SIM_RTP_BETS}), finalRTP=${Number.isFinite(convRtp) ? (convRtp * 100).toFixed(3) : 'NaN'}% == last plotted point (${convIdentity ? 'reconciled' : 'MISMATCH'}) vs ${(convTheo * 100).toFixed(2)}%, Δ=${Number.isFinite(convDeltaSE) ? convDeltaSE.toFixed(4) : 'NaN'}·SE within the 5·SE band; ALL ${convPts.length} plotted standard errors RECOMPUTED from (n, rtp, wins, m) and compared exactly, win counts ${series.points.map((p) => p.wins).join('/')} (${series.points[0]?.winSource ?? 'n/a'}) cumulatively consistent and ${series.exactReconstructions}/${convPts.length} of them reconstructing bit-for-bit to the published RTP — ${series.ok ? 'reconciled' : `MISMATCH: ${series.failures.slice(0, 3).join('; ')}`} (${convPass ? 'ok' : 'FAIL'}); `
        + `98-target edge convergence: ${tgtWithin}/${tgtRows.length} targets (over ${config_1.SIM_TARGETS[0].params.lower}.00 … over ${config_1.SIM_TARGETS[config_1.SIM_TARGETS.length - 1].params.lower}.00) within 5·SE+1e-4 of theory at n=${config_1.SIM_TARGET_BETS} each (recomputed), target set ${targetsIdentical ? `identical to the ${config_1.SIM_TARGETS.length} canonical targets in order` : 'NOT the canonical target set'}, seed-stream positions ${config_1.SIM_TARGET_SEED_COUNTER_BASE} + t×${config_1.SIM_TARGET_SEEDS_EACH} with client seed and first server seed RE-DERIVED from SIM_MASTER_SEED (${tgtSeedBad} row(s) off position), ${tgtFieldBad} row(s) whose derived fields disagree with re-derivation, ${tgtCountExact}/${tgtRows.length} row(s) whose simulatedRTP IS bit-for-bit the return of its integer win count and ${tgtCountBad} the return of NO integer win count, ${tgtMarksBad} per-target mark series failing validation (${tgtMarkExact}/${tgtRows.length * config_1.SIM_TARGET_MARKS.length} marks reconstructing bit-for-bit, every mark SE recomputed exactly)${tgtNotes.length ? ` (e.g. ${tgtNotes.join('; ')})` : ''} (${targetsPass ? 'ok' : 'FAIL'}); `
        + `98-target mean RTP (the convergence chart): ${tcPts.length} points at ${config_1.SIM_TARGET_MARKS.map((x) => x.toLocaleString('en-US')).join('/')} bets per target, every plotted mean and SE RECOMPUTED from the targets' marks and compared exactly (${tcPointsMatch ? 'reconciled' : 'MISMATCH'}), mean simulated RTP=${Number.isFinite(tcRtp) ? (tcRtp * 100).toFixed(4) : 'NaN'}% over ${(config_1.SIM_TARGETS.length * config_1.SIM_TARGET_BETS).toLocaleString('en-US')} bets == last plotted point (${tcIdentity ? 'reconciled' : 'MISMATCH'}) vs ${(tcTheo * 100).toFixed(4)}%, SE=${Number.isFinite(tcSe) ? (tcSe * 100).toFixed(4) : 'NaN'} pp, Δ=${Number.isFinite(tcDeltaSE) ? tcDeltaSE.toFixed(4) : 'NaN'}·SE within the 5·SE band (${tcPass ? 'ok' : 'FAIL'}); `
        + `model range/cursor/scale/edge ${modelOk ? 'ok' : 'FAIL'}; artifact self-report ${selfReport16 ? 'pass' : 'fail'}`
        + (agree16 ? '' : ' — DISAGREES with recomputation (artifact self-report tampered?)')
        // OBSERVED, NOT SCORED. A statistic landing exactly on its theoretical value is an event
        // with positive probability under the null — 0.0020149586 for exactly 40,000 wins in 2,000,000
        // `over 98` bets. It is recorded because it is worth a reader's attention, and it moves nothing.
        + `; OBSERVED (not scored): ${tgtOnTheory} target row(s), ${edgeOnTheory} effective-edge row(s) and ${series.exactlyOnTheory} convergence point(s) sit exactly on theory, and runsZ is ${runsZ === 0 ? 'exactly 0' : 'nonzero'} — all legitimate outcomes under the null, reported rather than rejected`
        // DECLARED LIMITATION L1 (NARROWED by the deterministic producer), and the error budget.
        + `; SCOPE — the raw Pass-1 statistics (uniformity.chi2, serial.lag1, serial.runsZ, each band's and target's simulatedRTP, and the convergence series' own RTP path) are not recomputed inside THIS fast verify (that would re-run 138M draws), but the Pass-1 producer is DETERMINISTIC — seeded from the pinned SIM_MASTER_SEED — so they are re-derivable by replaying it: npm run test:full regenerates the artifact byte-for-byte and the field diff is empty (DICE-20). A statistic forged SUBTLY is therefore not invisible (L1): a re-run reproduces the EXACT committed figures, so test:full exposes any figure that is not what the declared experiment outputs; changing SIM_MASTER_SEED to hand-pick one is a visible source edit that re-rolls every Pass-1 figure at once. What the FAST path still relies on for a reader who does not re-run the producer — that the statistics are STRUCTURALLY possible (integer win counts, cumulative consistency, exact standard errors) and fall inside their screens — is unchanged; that residual is declared limitation L1`
        + `; ERROR BUDGET — ${sim_checks_1.SCORED_STATISTICAL_PREDICATES.length} scored statistical screens across Steps 16-17: ${sim_checks_1.SCORED_STATISTICAL_PREDICATES.map((s) => `${s.id} ${s.screen} [${s.size}]`).join('; ')}. The α=${config_1.ALPHA} claim describes S1-S3 (family-wise, Bonferroni) ONLY — it is NOT this step's level: Step 16 also scores S4 and S5, so THIS STEP's own union bound is ≈${sim_checks_1.STEP_16_BOUND.toFixed(7)}, and over all ${sim_checks_1.SCORED_STATISTICAL_PREDICATES.length} screens across Steps 16-17 it is ≈${sim_checks_1.FAMILY_WISE_BOUND.toFixed(4)}. Everything else this step rejects on — derived-field reconciliation, population identity, sample-depth pins, integer win counts and their RECONSTRUCTION, cumulative consistency, exact standard errors — is a deterministic identity an honest artifact satisfies with probability 1, so it adds nothing to the budget (unlike 'perfection' rules, which reject honest outcomes and are unpriced). These sizes are NOMINAL UPPER BOUNDS from asymptotic reference distributions (χ² and normal), not measured failure frequencies, and no honest-run trip rate is claimed from them; the exact binomial S6 is conservative. Repeated fresh simulations could calibrate them and would not prove them`);
    // ── Step 17: Pass 2 — RE-DERIVE the cherry-pick scan from the dataset ──────────
    const p2 = sim.pass2;
    const p2Available = p2?.available === true;
    let s17;
    if (!p2Available) {
        s17 = (0, context_1.step)(17, 'Simulation — Pass 2 (Cherry-Pick)', 'FLAG', 'Pass 2 unavailable (dataset absent at simulate time)');
    }
    else {
        const perSeed = Array.isArray(p2.perSeed) ? p2.perSeed : [];
        // (a) the screen's geometry must be the one src/config.ts declares
        const geometryOk = p2.nullMethod === 'exact-discrete-tail'
            && Number(p2.cherryWindow) === config_1.SIM_CHERRY_WINDOW
            && Number(p2.cherryBins) === config_1.SIM_CHERRY_BINS
            && p2.cherrySeedAlphaNominal === config_1.SIM_CHERRY_SEED_ALPHA
            && p2.cherryPickAlpha === config_1.ALPHA
            && p2.cherrySeedAlphaAchieved === (0, exact_chi2_1.achievedSeedAlpha)()
            && p2.cherryPickP0 === CHERRY_P0;
        // (b) POPULATION identity — one row per dataset seed, keyed by the seed's own epoch
        const wantEpochs = ctx.seeds.map((s) => s.epoch).sort((a, b) => a - b);
        const gotEpochs = perSeed.map((r) => Number(r?.epoch)).sort((a, b) => a - b);
        const epochsOk = perSeed.length === ctx.seeds.length
            && new Set(gotEpochs).size === perSeed.length
            && wantEpochs.every((e, i) => gotEpochs[i] === e);
        // (c) RE-DERIVE every per-seed statistic from the dataset's own revealed seeds.
        // 100 HMACs per seed. The artifact is compared to this, never believed.
        const seedByEpoch = new Map(ctx.seeds.map((s) => [s.epoch, s]));
        let rowMismatches = 0, firstMismatch = '';
        let flags = 0, recomputedRows = 0;
        for (const row of perSeed) {
            const s = seedByEpoch.get(Number(row?.epoch));
            if (!s || !s.serverSeed) {
                rowMismatches++;
                if (!firstMismatch)
                    firstMismatch = `epoch ${row?.epoch}: no revealed seed in the dataset`;
                continue;
            }
            const W = config_1.SIM_CHERRY_WINDOW;
            const early = [], late = [];
            for (let i = 0; i < W; i++) {
                early.push((0, rng_1.generateProvablyFairNumber)(s.serverSeed, s.clientSeed, i, config_1.CURSOR, config_1.RANGE));
                late.push((0, rng_1.generateProvablyFairNumber)(s.serverSeed, s.clientSeed, W + i, config_1.CURSOR, config_1.RANGE));
            }
            const eSq = (0, exact_chi2_1.squareSum)(early), lSq = (0, exact_chi2_1.squareSum)(late);
            const eP = (0, exact_chi2_1.upperTailBySquareSum)(eSq), lP = (0, exact_chi2_1.upperTailBySquareSum)(lSq);
            const flag = eP < config_1.SIM_CHERRY_SEED_ALPHA && lP >= config_1.SIM_CHERRY_SEED_ALPHA;
            recomputedRows++;
            if (flag)
                flags++;
            const ok = row.earlySq === eSq && row.lateSq === lSq
                && row.earlyChi2 === (0, exact_chi2_1.chi2FromSquareSum)(eSq) && row.lateChi2 === (0, exact_chi2_1.chi2FromSquareSum)(lSq)
                && row.earlyP === eP && row.lateP === lP && row.flag === flag;
            if (!ok) {
                rowMismatches++;
                if (!firstMismatch)
                    firstMismatch = `epoch ${row.epoch}: stored (earlySq ${row.earlySq}, earlyP ${row.earlyP}, flag ${row.flag}) vs recomputed (${eSq}, ${eP}, ${flag})`;
            }
        }
        const perSeedOk = epochsOk && rowMismatches === 0 && recomputedRows === ctx.seeds.length;
        // (d) the flag-count test, at the suite's single α, against the derived null rate
        const n = perSeed.length;
        const binomP = (0, stats_1.binomialTailP)(n, flags, CHERRY_P0);
        const cherryOk = perSeedOk && geometryOk && binomP >= config_1.ALPHA;
        // DECLARED LIMITATION L4 — the screen's RESOLUTION, derived here so the artifact carries it.
        // The smallest flag count whose exact upper tail falls below α is the smallest count this
        // screen could ever reject on. Anything gentler than that is invisible to it by construction,
        // whatever it does to RTP. Mirrors outputs/report-figures.json → cherryPickPower.
        let minRejectableFlags = n;
        for (let k = 0; k <= n; k++) {
            if ((0, stats_1.binomialTailP)(n, k, CHERRY_P0) < config_1.ALPHA) {
                minRejectableFlags = k;
                break;
            }
        }
        // (e) pooled real-roll uniformity — recomputed from ctx.bets, not read from the artifact
        const pooledDraws = ctx.bets.map((b) => Math.round(Number(b.roll) * config_1.SCALE));
        const pooledHist = new Array(100).fill(0);
        for (const d of pooledDraws)
            pooledHist[Math.min(99, Math.floor(d / (config_1.RANGE / 100)))]++;
        const pooledRe = (0, stats_1.chiSquaredTest)(pooledHist, new Array(100).fill(pooledDraws.length / 100));
        const pooledArt = p2.pooledRealRollUniformity ?? {};
        const pooledBound = Number(pooledArt.n) === ctx.bets.length
            && agree(pooledArt.chi2, pooledRe.chi2) && Number(pooledArt.df) === pooledRe.df
            && agree(pooledArt.pValue, pooledRe.pValue);
        // DICE-22 is policy INFORMATIONAL (2026-09-29): a live-roll uniformity rejection is reported,
        // never counted and never FAILs this step. What still FAILs is a pooled record in the artifact that
        // does not reconcile with the recomputation (a forged / stale artifact is integrity, not a fit).
        const pooledFitOk = pooledRe.pValue >= config_1.ALPHA;
        const pooledOk = pooledBound;
        if (pooledBound && !pooledFitOk)
            console.log(`  [INFO] Step 17 — DICE-22 pooled live-roll uniformity p=${pooledRe.pValue.toFixed(4)} below α=${config_1.ALPHA} (informational: reported, not counted, verdict unchanged)`);
        // ── (f) SERVED-BAND PAYOUT-WEIGHTED RETURN (DICE-21, load-bearing) ──────────────────────────
        // Every revealed seed × SIM_PASS2_NONCES nonces, RE-DERIVED here from the dataset's own revealed
        // seeds; early window = the epoch's captured nonce range (0..size−1), reference = the remainder. The
        // statistic is the payout-weighted return of the bands the casino actually served, standardised
        // by its EXACT per-bet mean and variance (a scaled Poisson-binomial across seeds — each pᵢ the
        // served band's exact lattice win-probability discreteWinProbability(band)); the tail is the
        // one-sided normal (CLT) lower tail. EXACT moments + an ASYMPTOTIC tail — NOT an exact-lattice
        // CDF (src/config.ts SIM_PASS2_*, MANIFEST.md load-bearing premise, L4). Every per-epoch row is
        // recomputed and compared with EXACT equality; the aggregate is reconciled and then scored, and a
        // re-derivation mismatch OR an anomalously LOW early return (aggP < α) HARD-FAILS the step.
        const sb = p2.servedBand ?? {};
        const sbGeometryOk = Number(sb.nonces) === config_1.SIM_PASS2_NONCES
            && Number(sb.earlyBets) === config_1.EXPECTED_BETS && Number(sb.alpha) === config_1.SIM_PASS2_ALPHA;
        const sbPerEpoch = Array.isArray(sb.perEpoch) ? sb.perEpoch : [];
        // Population identity: one row per REVEALED epoch that carries bets, keyed by its commitment hash.
        const wantHashes = [...ctx.seedMap.keys()].filter((h) => (ctx.byHash.get(h) ?? []).length > 0).sort();
        const gotHashes = sbPerEpoch.map((r) => String(r.serverSeedHashed)).sort();
        const sbEpochsOk = sbPerEpoch.length === wantHashes.length
            && new Set(gotHashes).size === sbPerEpoch.length
            && wantHashes.every((h, i) => gotHashes[i] === h);
        let sbRowMismatches = 0, sbRecomputedRows = 0, sbFirstMismatch = '';
        let sbTotalEarlyReturn = 0, sbTotalEarlyExpected = 0, sbTotalEarlyVar = 0, sbBelow = 0, sbAbove = 0, sbTotalEarlyBets = 0;
        for (const row of sbPerEpoch) {
            const hash = String(row.serverSeedHashed);
            const serverSeed = ctx.seedMap.get(hash);
            const epochBets = (ctx.byHash.get(hash) ?? []).slice().sort((a, b) => a.nonce - b.nonce);
            if (!serverSeed || epochBets.length === 0) {
                sbRowMismatches++;
                if (!sbFirstMismatch)
                    sbFirstMismatch = `epoch ${hash.slice(0, 12)}: no revealed seed`;
                continue;
            }
            const clientSeed = epochBets[0].clientSeed;
            // The early window IS this epoch's captured nonce range: its planned size in src/config.ts.
            const W2 = (0, config_1.expectedEpochSize)(epochBets[0].epoch);
            const served = new Array(W2);
            for (const b of epochBets)
                if (b.nonce >= 0 && b.nonce < W2)
                    served[b.nonce] = b.params;
            let lastSeen = served.find((x) => x) ?? epochBets[0].params;
            for (let i = 0; i < W2; i++) {
                if (!served[i])
                    served[i] = lastSeen;
                else
                    lastSeen = served[i];
            }
            let eR = 0, eE = 0, eV = 0, rR = 0, rE = 0, rV = 0;
            const earlyCells = [];
            for (let nn = 0; nn < config_1.SIM_PASS2_NONCES; nn++) {
                const band = served[nn % W2];
                const mult = (0, config_1.quotedMultiplier)(band);
                const p = (0, config_1.discreteWinProbability)(band); // EXACT lattice win-probability
                const roll = (0, rng_1.diceRoll)(serverSeed, clientSeed, nn) / config_1.SCALE;
                const won = (0, config_1.diceWin)(roll, band);
                const ret = won ? mult : 0;
                const eRet = p * mult, vRet = p * (1 - p) * mult * mult;
                if (nn < W2) {
                    eR += ret;
                    eE += eRet;
                    eV += vRet;
                    earlyCells.push({ band, won });
                }
                else {
                    rR += ret;
                    rE += eRet;
                    rV += vRet;
                }
            }
            sbRecomputedRows++;
            sbTotalEarlyBets += W2;
            const ok = row.earlyReturn === eR && row.earlyExpected === eE && row.earlyVar === eV
                && row.refReturn === rR && row.refExpected === rE && row.refVar === rV
                && Number(row.earlyN) === W2 && Number(row.refN) === config_1.SIM_PASS2_NONCES - W2;
            if (!ok) {
                sbRowMismatches++;
                if (!sbFirstMismatch)
                    sbFirstMismatch = `epoch ${hash.slice(0, 12)}: stored earlyReturn ${row.earlyReturn} vs recomputed ${eR}`;
            }
            sbTotalEarlyReturn += eR;
            sbTotalEarlyExpected += eE;
            sbTotalEarlyVar += eV;
            // Direction in EXACT rational arithmetic (src/config.ts servedReturnSign): comparing the two
            // float sums counts an epoch that lands exactly on its expectation (49.5 against 49.5, which
            // the floats hold as 49.5 and 49.500000000000014) as "below".
            const sign = (0, config_1.servedReturnSign)(earlyCells);
            if (sign < 0)
                sbBelow++;
            else if (sign > 0)
                sbAbove++;
        }
        const sbEqual = sbRecomputedRows - sbBelow - sbAbove;
        // Aggregate the early-window return — exact Poisson-binomial moments (sums of per-bet exact
        // moments), one-sided normal (CLT) lower tail. Cherry-picking shorts the early window → reject on
        // p < α.
        const sbAggZ = sbTotalEarlyVar > 0 ? (sbTotalEarlyReturn - sbTotalEarlyExpected) / Math.sqrt(sbTotalEarlyVar) : 0;
        const sbAggP = (0, stats_1.normalLowerTailP)(sbAggZ);
        const sbZAlpha = (0, stats_1.inverseCriticalZ)(2 * config_1.SIM_PASS2_ALPHA), sbZPower = (0, stats_1.inverseCriticalZ)(2 * 0.20);
        const sbMinDetectablePerBetPct = sbTotalEarlyBets > 0
            ? ((sbZAlpha + sbZPower) * Math.sqrt(sbTotalEarlyVar) / sbTotalEarlyBets) * 100 : NaN;
        // The stored aggregates must reconcile with the re-derivation (per-row is exact; the aggregate
        // sums carry ≤1e-9 of accumulation error), and the direction split must match exactly.
        const sbAggMatch = sbPerEpoch.length > 0
            && Math.abs(Number(sb.totalEarlyReturn) - sbTotalEarlyReturn) < 1e-9
            && Math.abs(Number(sb.totalEarlyExpected) - sbTotalEarlyExpected) < 1e-9
            && Math.abs(Number(sb.totalEarlyVar) - sbTotalEarlyVar) < 1e-9
            && Number(sb.directionBelow) === sbBelow && Number(sb.directionAbove) === sbAbove;
        const sbRederivedOk = sbGeometryOk && sbEpochsOk && sbRowMismatches === 0
            && sbRecomputedRows === wantHashes.length && sbAggMatch;
        const sbCherryClean = sbAggP >= config_1.SIM_PASS2_ALPHA; // HARD_FAIL on a cherry-pick signal
        const servedBandOk = sbRederivedOk && sbCherryClean;
        const recomputed17 = servedBandOk && cherryOk && pooledOk;
        const selfReport17 = p2.cherryPickConsistent === true && pooledArt.pass === true;
        const agree17 = (cherryOk && pooledOk && pooledFitOk) === selfReport17;
        s17 = (0, context_1.step)(17, 'Simulation — Pass 2 (Cherry-Pick)', recomputed17 && agree17 ? 'PASS' : 'FAIL', `DICE-21 served-band return (load-bearing): ${sbRecomputedRows} revealed epochs × ${config_1.SIM_PASS2_NONCES.toLocaleString()} nonces, ALL windows RE-DERIVED from the revealed seeds (early window = each epoch's captured nonces 0…size−1, size ${[...new Set(config_1.EXPECTED_EPOCHS.map((e) => e.bets))].sort((x, y) => x - y).join(' / ')} by the plan, ${sbTotalEarlyBets} early cells in all; reference = the rest of the ${config_1.SIM_PASS2_NONCES.toLocaleString()}), ${sbRowMismatches} row mismatch${sbFirstMismatch ? ` (first: ${sbFirstMismatch})` : ''}, epoch identity ${sbEpochsOk ? 'ok' : 'MISMATCH'}, aggregate reconciliation ${sbAggMatch ? 'ok' : 'MISMATCH'}; `
            + `statistic = payout-weighted served-band return standardised by its EXACT per-bet mean and variance (a scaled Poisson-binomial across seeds, each pᵢ the served band's exact lattice win-probability) — EXACT moments, ASYMPTOTIC one-sided normal (CLT) lower tail, NOT an exact-lattice CDF (see MANIFEST.md load-bearing premise / L4): aggregate early z=${sbAggZ.toFixed(3)}, one-sided lower-tail p=${sbAggP.toFixed(4)} vs α=${config_1.SIM_PASS2_ALPHA} → ${sbCherryClean ? 'no return deficit detected at this power' : 'RETURN DEFICIT — CHERRY-PICK SIGNAL'}; the test detects a per-bet return deficit of ${Number.isFinite(sbMinDetectablePerBetPct) ? sbMinDetectablePerBetPct.toFixed(3) : 'n/a'} pp or more at 80% power, so a smaller selection effect would pass; direction split ${sbBelow} below / ${sbEqual} equal / ${sbAbove} above expectation (exact arithmetic) (${servedBandOk ? 'ok' : 'FAIL'}). `
            + `SUPPLEMENTARY draw-uniformity screen: ${n} casino seeds vs dataset ${ctx.seeds.length} (epoch identity ${epochsOk ? 'ok' : 'MISMATCH'}); `
            + `all ${recomputedRows} per-seed χ² windows RE-DERIVED from the revealed seeds (${config_1.SIM_CHERRY_WINDOW}+${config_1.SIM_CHERRY_WINDOW} draws each), ${rowMismatches} row mismatches${firstMismatch ? ` — first: ${firstMismatch}` : ''}; `
            + `null = exact discrete tail of the n=${config_1.SIM_CHERRY_WINDOW}/${config_1.SIM_CHERRY_BINS}-bin χ² (${p2.nullSupportValues} attainable values, ${p2.nullPartitions} partitions; geometry ${geometryOk ? 'ok' : 'MISMATCH'}); `
            + `cherry-pick flags ${flags} (recomputed) vs ${(n * CHERRY_P0).toFixed(2)} expected; exact binomial P(X≥${flags})=${binomP.toFixed(4)} vs α=${config_1.ALPHA} → ${cherryOk ? 'consistent with chance' : 'ELEVATED'}; `
            + `DICE-22 pooled real-roll uniformity over ${pooledDraws.length} captured rolls: chi²=${pooledRe.chi2.toFixed(3)} df=${pooledRe.df} → p=${pooledRe.pValue.toFixed(4)} (recomputed from the dataset; artifact ${pooledBound ? 'reconciled' : 'MISMATCH'}) (${!pooledOk ? 'FAIL' : pooledFitOk ? 'ok' : 'DEVIATION — informational, not counted'}); `
            + `supplementary-screen self-report ${selfReport17 ? 'pass' : 'fail'}`
            + (agree17 ? '' : ' — DISAGREES with recomputation (artifact self-report tampered?)')
            // DECLARED LIMITATION L4. The supplementary draw-uniformity screen's resolution and blind spot,
            // recomputed here rather than asserted in prose.
            + `; SCOPE — the served-band return is the load-bearing return-based DICE-21 statistic; the draw-uniformity screen is retained as a supplementary exact-discrete check needing ${minRejectableFlags} flag(s) to reject at α=${config_1.ALPHA} (P(X≥${minRejectableFlags})=${(0, stats_1.binomialTailP)(n, minRejectableFlags, CHERRY_P0).toFixed(4)}). The served-band tail is asymptotic (CLT) on exact moments, not an exact-lattice CDF — declared L4/load-bearing premise in MANIFEST.md. The load-bearing cherry-pick defence remains structural (client-seed-after-commitment)`);
    }
    return [s16, s17];
}

  },
  "tests/steps/standardization.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Steps 18–21: Standardization-parity steps. Each is recomputed from the raw dataset (or the
 * pure-arithmetic engine), never read from an operator summary field, and each carries a
 * coverage assertion so a pass over an empty set cannot occur.
 *
 *   18  Bet-Size Invariance (Phase C) — the elevated-stake rounds (10.00 USDT on over 50) recompute
 *                                  like every other round and are paid by the same rule as the same
 *                                  band at the base stake; at least PHASE_C_MIN_WINS of them won, so
 *                                  the payout path is exercised, not only the roll
 *   19  Artifact Hash + Value-Domain Integrity — pinned SHA-256 of the dataset AND of the
 *                                  simulation artifacts, plus a value-domain check of every numeric
 *                                  leaf of the committed simulation-results.json / report-figures.json
 *   20  Settlement Determinism   — credited amount fully determined by (roll, band, stake),
 *                                  across all four modes and both win & loss
 *   21  Multiplier Monotonicity  — the quoted multiplier is strictly decreasing in win chance over
 *                                  the plan's win chances AND over the whole basis-point price grid
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_crypto_1 = require("node:crypto");
const context_1 = require("./context");
const report_figures_1 = require("../../src/report-figures");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
const domains_1 = require("../../src/domains");
function run(ctx) {
    const { bets, seedMap } = ctx;
    const out = [];
    // ── Step 18: Bet-Size Invariance (Phase C, DICE-12) ─────────────────────────
    // Phase C is the elevated-stake phase: ELEVATED_STAKE (10.00 USDT, 100 times the base stake) on
    // one band with a 50% win chance, so that about half the rounds win and the PAYOUT path is
    // exercised at the higher stake, not only the roll. Asserted, all exact:
    //   (a) the phase holds the planned number of rounds (at least PHASE_C_MIN_BETS), every one at
    //       ELEVATED_STAKE as served, on one band;
    //   (b) every Phase C roll recomputes from (serverSeed, clientSeed, nonce) alone: diceRoll takes
    //       exactly three arguments, so no wager can enter the draw;
    //   (c) at least PHASE_C_MIN_WINS Phase C rounds won, and every one is credited
    //       floor8(stake × 9900/basisPoints), from the band, never from the served multiplier;
    //   (d) the SAME band at the base stake (it is one of the Phase A / D settings) carries the same
    //       served multiplier on its wins and is credited by the same rule, and the two credits stand
    //       in exactly the ratio of the two stakes.
    {
        const c = bets.filter((b) => b.phaseId === 'C');
        const cBands = new Set(c.map((b) => (0, config_1.bandKey)(b.params)));
        const cStakeOk = c.length > 0 && c.every((b) => String(b.betAmount) === config_1.ELEVATED_STAKE);
        let chk = 0, bad = 0;
        for (const b of c) {
            const ss = seedMap.get(b.hashedServerSeed);
            if (!ss)
                continue;
            chk++;
            if (!(0, config_1.servedRollMatches)(Number(b.roll), (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce) / config_1.SCALE))
                bad++;
        }
        const cWins = c.filter((b) => b.win);
        const cCreditOk = cWins.filter((b) => (0, config_1.amountUnits)(b.winningAmount) === (0, config_1.floor8CreditUnits)(b.betAmount, b.params)).length;
        const cLossOk = c.filter((b) => !b.win && (0, config_1.amountUnits)(b.winningAmount) === 0n).length;
        // the same band at the base stake
        const base = bets.filter((b) => b.phaseId !== 'C' && cBands.has((0, config_1.bandKey)(b.params)) && String(b.betAmount) === config_1.BASE_STAKE);
        const baseWins = base.filter((b) => b.win);
        const baseCreditOk = baseWins.filter((b) => (0, config_1.amountUnits)(b.winningAmount) === (0, config_1.floor8CreditUnits)(b.betAmount, b.params)).length;
        const mults = new Set([...cWins, ...baseWins].map((b) => Number(b.multiplier)));
        const cCredit = cWins.length ? (0, config_1.amountUnits)(cWins[0].winningAmount) : null;
        const baseCredit = baseWins.length ? (0, config_1.amountUnits)(baseWins[0].winningAmount) : null;
        const stakeRatio = (0, config_1.amountUnits)(config_1.ELEVATED_STAKE) / (0, config_1.amountUnits)(config_1.BASE_STAKE);
        const ratioOk = cCredit !== null && baseCredit !== null && cCredit === baseCredit * stakeRatio
            && (0, config_1.amountUnits)(config_1.ELEVATED_STAKE) % (0, config_1.amountUnits)(config_1.BASE_STAKE) === 0n;
        const drawArity = rng_1.diceRoll.length;
        const ok = c.length === config_1.EXPECTED_PHASE_BETS.C && c.length >= config_1.PHASE_C_MIN_BETS && cBands.size === 1 && cStakeOk
            && chk === c.length && bad === 0 && drawArity === 3
            && cWins.length >= config_1.PHASE_C_MIN_WINS && cCreditOk === cWins.length && cLossOk === c.length - cWins.length
            && baseWins.length > 0 && baseCreditOk === baseWins.length && mults.size === 1 && ratioOk;
        const band = c.length ? c[0].params : null;
        out.push((0, context_1.step)(18, 'Bet-Size Invariance (Phase C)', ok ? 'PASS' : 'FAIL', `Phase C: ${c.length}/${config_1.EXPECTED_PHASE_BETS.C} rounds (floor ${config_1.PHASE_C_MIN_BETS}) at ${config_1.ELEVATED_STAKE} USDT (${cStakeOk ? 'every one' : 'NOT every one'}), ${stakeRatio}× the base stake ${config_1.BASE_STAKE}, on ${cBands.size} band${band ? ` (${(0, config_1.bandMode)(band)} ${band.lower}, win chance ${(0, config_1.continuousWinChancePct)(band)}%)` : ''}; `
            + `${chk - bad}/${c.length} rolls recompute from (serverSeed, clientSeed, nonce) alone (diceRoll takes ${drawArity} arguments and no wager); `
            + `${cWins.length} wins (floor ${config_1.PHASE_C_MIN_WINS}): ${cCreditOk}/${cWins.length} credited floor8(stake × ${config_1.PAYOUT_NUMERATOR}/basisPoints)${cWins.length ? ` = ${cWins[0].winningAmount}` : ''}, ${cLossOk}/${c.length - cWins.length} losses paid 0; `
            + `the same band at the base stake: ${base.length} rounds in the other phases, ${baseWins.length} wins, ${baseCreditOk}/${baseWins.length} credited by the same rule${baseWins.length ? ` = ${baseWins[0].winningAmount}` : ''}; one served multiplier on the wins at both stakes (${[...mults].join(', ')}×; ${mults.size === 1}); the elevated credit is exactly ${stakeRatio}× the base credit (${ratioOk})`
            + (c.length === 0 ? '; COVERAGE FAIL: no Phase C rounds' : '')));
    }
    // ── Step 19: Artifact Hash Integrity ────────────────────────────────────────
    // Three artifacts of record, all reconciled here:
    //   • the pinned capture — its SHA-256 must equal the pin in src/config.ts;
    //   • outputs/simulation-results.json (+ its twin chart) — the simulation Steps 16–17 score.
    //     Pinned, because otherwise `npm test` regenerates it from fresh
    //     seeds seconds before scoring it, and the artifact of record is whatever the last run
    //     happened to produce. `SIM_FRESH=1` (set by `npm run test:full`) RECORDS the fresh hash
    //     instead of enforcing the pin, so a deliberate regeneration is not a false alarm.
    //     DELIBERATELY NOT AN ABORT: exiting before any scored step on a sim-hash mismatch means
    //     an artifact forgery is reported by a forged-artifact battery
    //     as NOT RUN rather than CAUGHT — a pin that pre-empts the guards
    //     tells you the pin works and nothing about whether the statistics are real. Here the run
    //     continues, the statistical guards in Step 16/17 get their shot, and this step records the
    //     mismatch. Nor is the pin a defence against a fabricating auditor, who re-pins in the same
    //     commit; that is what Step 16's two-sided screen and its structural validation are for.
    //   • outputs/report-figures.json — the derived figures the REPORT quotes. Every number in it
    //     is a deterministic function of the pinned capture, so the committed file must equal a
    //     fresh recomputation exactly. Without this the file would be an unscored artifact: a
    //     forged settled-RTP span or Phase-D z-score would change the published prose and no step
    //     would notice.
    {
        const hashOk = ctx.datasetSha256 === ctx.expectedDatasetHash;
        const simFresh = process.env.SIM_FRESH === '1';
        const simPins = [
            { label: 'simulation-results.json', file: 'simulation-results.json', expected: config_1.SIMULATION_SHA256 },
            { label: 'rtp-convergence.html', file: 'rtp-convergence.html', expected: config_1.SIMULATION_HTML_SHA256 },
        ];
        const simNotes = [];
        let simForged = false;
        for (const pin of simPins) {
            const fp = path.join(ctx.outputsDir, pin.file);
            if (!fs.existsSync(fp)) {
                simForged = true;
                simNotes.push(`${pin.label} ABSENT — the artifact Steps 16–17 score is missing`);
                continue;
            }
            const actual = (0, node_crypto_1.createHash)('sha256').update(fs.readFileSync(fp)).digest('hex');
            // A regeneration that reproduces the pinned bytes records exactly what the default path
            // records: the mode of the run is not evidence, and a committed artifact must not change with
            // it (F8/F9 — run metadata absent, not excluded). Only a fresh run that DISAGREES with the pin
            // is described differently, and that disagreement is then a real diff against the committed copy.
            if (simFresh && actual !== pin.expected) {
                simNotes.push(`${pin.label} FRESH run (SIM_FRESH=1): sha256 ${actual.slice(0, 16)}… — pin NOT enforced; re-pin in src/config.ts to publish this run`);
            }
            else if (actual !== pin.expected) {
                simForged = true;
                simNotes.push(`${pin.label} sha256 ${actual.slice(0, 16)}… ≠ pin ${pin.expected.slice(0, 16)}… — the scored simulation is not the committed one`);
            }
            else {
                simNotes.push(`${pin.label} sha256 ${actual.slice(0, 16)}… matches its pin`);
            }
        }
        const rfPath = path.join(ctx.outputsDir, 'report-figures.json');
        const freshObj = (0, report_figures_1.computeReportFigures)(ctx.bets, ctx.seeds);
        const fresh = JSON.stringify(freshObj, null, 2);
        // FIVE outcomes, each named and each a HARD FAIL except agreement:
        //
        //   absent | parse-error | schema-error | dataset-mismatch | field-mismatch  → FAIL
        //   agreement                                                                → PASS
        //
        // ── WHY EVERY NON-AGREEMENT IS A FAIL ────────────────────────────────────────────────────────
        // Swallowing a `JSON.parse` throw (`catch { storedBody = '<unparseable>' }`) leaves `storedHash`
        // as the empty string, which falls into the "computed from a different dataset" branch, which
        // reads as STALE — a benign condition that "this run regenerates". A required artifact of
        // record containing the literal bytes `{not JSON` then scores a clean 21/21 Full Pass, and the
        // run rewrites the file, erasing the thing it failed to read. A verifier must never approve
        // an artifact it could not read, and a parse failure is not permission to regenerate.
        //
        // There is no stale branch either. A `datasetSha256` that does not match the capture being
        // scored means the shipped figures were derived from some other capture; that is a mismatch to
        // report, not a licence to silently overwrite. Regeneration lives in one explicit place
        // (`npm run report`), so this step can afford to be strict — and `npm run verify` no longer
        // writes here at all, which is what makes "running twice fails twice" true.
        //
        // ── WHY ABSENCE IS A FAIL ────────────────────────────────────────────────────────────────────
        // A branch reading `absent — this run writes it` and leaving the step PASSING is the
        // existsSync fall-through a forged-artifact battery flags: deleting a shipped
        // artifact then scores a clean 21/21 Full Pass.
        //
        // The question the fall-through begs is whether report-figures.json is an ARTIFACT OF RECORD
        // or a RUN PRODUCT, and the repo answers it in three places already: `.gitignore` un-ignores it
        // explicitly (`!outputs/report-figures.json`), MANIFEST.md#evidence lists it as evidence item **E15**,
        // and the overview cites it BY NAME as the trace for published figures (`report-figures.json →
        // boundary`, `→ cherryPickPower`). It is a producing
        // artifact — the source those numbers are allowed to trace to. So it is an artifact of
        // record, and its absence means the shipped copy of the report's derived figures is gone: nobody
        // can check that the published numbers are the ones this pipeline produced. That must FAIL.
        //
        // It is NOT sufficient that a deleted file regenerates byte-identically. It does — verified —
        // but that only shows the figures are a deterministic function of the pinned dataset. A repo
        // with a genuine absent-artifact defect regenerates identically too, so byte-identity cannot
        // separate the two cases; the repo has to make the call. This is the call. Declared as
        // limitation L16 in MANIFEST.md.
        //
        // CONSEQUENCE, stated so it is not a surprise: outputs/report-figures.json MUST be committed.
        // A clone that does not carry it fails Step 19 on its first run, by design.
        // The schema this artifact must satisfy, declared here rather than inferred from whatever the
        // file happens to contain: the two envelope fields plus every top-level figure group the report
        // cites. Derived from the producer (`computeReportFigures`) so the two cannot drift apart.
        // No generatedAt: the artifact carries no run metadata (absent, not excluded — F8).
        const RF_ENVELOPE_FIELDS = ['datasetSha256'];
        const RF_REQUIRED_FIELDS = [...RF_ENVELOPE_FIELDS, ...Object.keys(freshObj)];
        let rfForged = false;
        let rfNote;
        if (!fs.existsSync(rfPath)) {
            rfForged = true;
            rfNote = 'outputs/report-figures.json ABSENT — the artifact of record for the report\'s derived '
                + 'figures (evidence E15) is missing, so the published numbers cannot be checked against the '
                + 'file that produced them. Regenerating it here would prove only that they are a deterministic '
                + 'function of the pinned dataset, not that the shipped file was ever produced';
        }
        else {
            let stored;
            let parseError = null;
            try {
                stored = JSON.parse(fs.readFileSync(rfPath, 'utf8'));
            }
            catch (e) {
                parseError = e instanceof Error ? e.message : String(e);
            }
            if (parseError !== null) {
                rfForged = true;
                rfNote = `outputs/report-figures.json PARSE ERROR — the artifact of record could not be read as JSON (${parseError.slice(0, 120)}). `
                    + 'A verifier must not approve an artifact it could not read, and a parse failure is not permission to regenerate';
            }
            else if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) {
                rfForged = true;
                rfNote = `outputs/report-figures.json SCHEMA ERROR — expected a JSON object, got ${stored === null ? 'null' : Array.isArray(stored) ? 'an array' : typeof stored}`;
            }
            else {
                const obj = stored;
                const missing = RF_REQUIRED_FIELDS.filter((k) => !Object.prototype.hasOwnProperty.call(obj, k));
                const storedHash = typeof obj.datasetSha256 === 'string' ? obj.datasetSha256 : '';
                if (missing.length > 0) {
                    rfForged = true;
                    rfNote = `outputs/report-figures.json SCHEMA ERROR — required field(s) absent: ${missing.join(', ')}. `
                        + `The artifact must carry ${RF_REQUIRED_FIELDS.length} top-level fields (${RF_ENVELOPE_FIELDS.join(', ')} plus every figure group the report cites)`;
                }
                else if (!/^[0-9a-f]{64}$/.test(storedHash)) {
                    rfForged = true;
                    rfNote = `outputs/report-figures.json SCHEMA ERROR — datasetSha256 is not a SHA-256 hex digest (${JSON.stringify(obj.datasetSha256)?.slice(0, 40)})`;
                }
                else if (storedHash !== ctx.datasetSha256) {
                    // NOT "stale, regenerated by this run" any more. The shipped figures were derived from a
                    // capture that is not the one being scored; that is a mismatch to report.
                    rfForged = true;
                    rfNote = `outputs/report-figures.json DATASET MISMATCH — it declares dataset ${storedHash.slice(0, 16)}… but the capture being scored is ${ctx.datasetSha256.slice(0, 16)}…, `
                        + 'so the shipped derived figures were not computed from this capture. Regenerate deliberately with `npm run report` and review the diff; verification will not do it for you';
                }
                else {
                    const body = { ...obj };
                    delete body.datasetSha256;
                    const storedBody = JSON.stringify(body, null, 2);
                    if (storedBody !== fresh) {
                        rfForged = true;
                        // Name the first disagreeing top-level group, so the failure points somewhere.
                        const firstBad = Object.keys(freshObj).find((k) => JSON.stringify(body[k]) !== JSON.stringify(freshObj[k]))
                            ?? Object.keys(body).find((k) => !(k in freshObj)) ?? '(field order)';
                        rfNote = `outputs/report-figures.json FIELD MISMATCH — it claims THIS dataset but DISAGREES with recomputation from it (first disagreeing group: ${firstBad}) — the report's derived figures do not follow from the capture`;
                    }
                    else {
                        rfNote = 'outputs/report-figures.json reconciles with a fresh recomputation from the pinned dataset, field for field '
                            + `(${RF_REQUIRED_FIELDS.length}/${RF_REQUIRED_FIELDS.length} required fields present, dataset hash matches)`;
                    }
                }
            }
        }
        // ── VALUE DOMAINS of the committed artifacts of record ──────────────────────────────────────
        // A SHA-256 pin proves the bytes did not move since we pinned them; it says nothing about
        // whether a value inside is physically possible, and a forger re-pins in the same commit. So
        // every numeric leaf of the two committed artifacts the report quotes — simulation-results.json
        // (pinned) and report-figures.json (recomputed above) — must be a value the game physically
        // admits, with EVERY BOUND derived from src/domains.ts (which reads src/config.ts: the audited
        // population, the sample depths, the odds limits, the roll grid) and NEVER from the file being
        // checked. A leaf with NO declared domain fails too, so a new unbounded field cannot slip in
        // quietly. Ported from the sibling liqd-plinko src/domains.ts. (DICE-27.)
        const rules = (0, domains_1.domainRules)();
        const domainBad = [];
        let domainLeaves = 0;
        for (const rel of ['simulation-results.json', 'report-figures.json']) {
            const p = path.join(ctx.outputsDir, rel);
            if (!fs.existsSync(p)) {
                // Absence is already a FAIL above (sim) / a FAIL in the report-figures branch; Step 19 does
                // not double-report it, but it must not silently score a file it never read.
                domainBad.push(`${rel}: not present, so its values were not domain-checked`);
                continue;
            }
            let doc;
            try {
                doc = JSON.parse(fs.readFileSync(p, 'utf8'));
            }
            catch (e) {
                domainBad.push(`${rel}: not valid JSON (${e.message})`);
                continue;
            }
            const r = (0, domains_1.validateDomains)(doc, rules[rel]);
            domainLeaves += r.checked;
            domainBad.push(...(0, domains_1.describeDomainFailures)(rel, r));
        }
        const domainOk = domainBad.length === 0;
        out.push((0, context_1.step)(19, 'Artifact Hash + Value-Domain Integrity', hashOk && !rfForged && !simForged && domainOk ? 'PASS' : 'FAIL', `SHA-256 of ${config_1.DATASET_FILE} = ${ctx.datasetSha256.slice(0, 16)}… ${hashOk ? 'matches' : '≠'} the pin ${ctx.expectedDatasetHash.slice(0, 16)}… (loader aborts on mismatch before any step runs); `
            + `${simNotes.join('; ')} — the pin proves the scored simulation is the committed one, NOT that its statistics are real (that is Step 16's two-sided uniformity screen plus its structural validation of the win counts and standard errors); `
            + `${rfNote}`
            + `; value domains: ${domainLeaves} numeric leaf/leaves of the committed simulation-results.json and report-figures.json checked against bounds derived from src/config.ts (a leaf out of domain OR with no declared domain fails)`
            + (domainOk ? '' : ` — FAIL: ${domainBad.slice(0, 5).join('; ')}${domainBad.length > 5 ? `; +${domainBad.length - 5} more` : ''}`)));
    }
    // ── Step 20: Settlement Determinism (settlement table) ──────────────────────
    // ANTI-CIRCULAR AND EXACT. The expected credit is built from the auditor's OWN derived
    // multiplier, pure band arithmetic; the served `multiplier` field is never read here (Step 7 is
    // what pins that), and settled by the production rule floor8(stake × 9900/basisPoints) with ZERO
    // tolerance.
    //
    // WHICH DERIVATION, AND WHY IT MATTERS. The multiplier is the rational 9900/basisPoints. Reaching
    // it through `quotedMultiplier(params)`, the float closed form `(100/winChance%)·(1−edge)`, gives
    // the SAME NUMBER over the rationals and can give a DIFFERENT binary64, because
    // `continuousWinChancePct` computes `upper − lower` in binary64 (an `over 99.99` band gives a
    // float multiplier of 9899.999999994936 where the quotient is 9900). A credit floored from the
    // float can therefore land one unit below the correct one. `PAYOUT_NUMERATOR / payoutBasisPoints(p)`
    // is an integer-over-integer quotient, taken in BigInt by floor8CreditUnits: the operator's own
    // number system (see `creditResidualSign`). Regression vectors: tests/dice/settlementTests.ts.
    {
        let chk = 0, bad = 0;
        const modesSeen = new Set();
        let wins = 0, losses = 0;
        const fails = [];
        for (const b of bets) {
            chk++;
            modesSeen.add((0, config_1.bandMode)(b.params));
            const win = (0, config_1.diceWin)(Number(b.roll), b.params);
            if (win)
                wins++;
            else
                losses++;
            const expected = win ? (0, config_1.floor8CreditUnits)(b.betAmount, b.params) : 0n;
            const credited = (0, config_1.amountUnits)(b.winningAmount);
            // win flag must match the roll/band rule AND the credit must be the determined amount
            if (win !== !!b.win || credited !== expected) {
                bad++;
                if (fails.length < 3)
                    fails.push(`epoch ${b.epoch} nonce ${b.nonce}: credited ${b.winningAmount} vs determined ${expected} units`);
            }
        }
        const coverOk = modesSeen.size === 4 && wins > 0 && losses > 0;
        out.push((0, context_1.step)(20, 'Settlement Determinism', bad === 0 && coverOk ? 'PASS' : 'FAIL', `${chk}/${bets.length} bets: outcome (win/loss) and credited amount are fully determined by (roll, band, stake) — credit == floor8(stake × PAYOUT_NUMERATOR/basisPoints), the exact integer-basis-point quotient, never the served multiplier and never the float closed form, with zero tolerance — and match the served settlement — ${bad} mismatch` +
            (fails.length ? ` (e.g. ${fails.join('; ')})` : '') +
            `; coverage: modes [${[...modesSeen].join(',')}], ${wins} wins / ${losses} losses` +
            (coverOk ? '' : '; COVERAGE FAIL')));
    }
    // ── Step 21: Multiplier Monotonicity & Range ────────────────────────────────
    {
        // Distinct captured win chances → their QUOTED multiplier (the formula 99/winChance computed from
        // each captured band; this step never reads the served field — on wins Step 7 binds the served
        // value to the same rational, 9900/basisPoints), sorted by win chance ascending.
        const pts = new Map();
        let rangeMin = Infinity, rangeMax = -Infinity;
        for (const b of bets) {
            const wc = +(0, config_1.continuousWinChancePct)(b.params).toFixed(4);
            const m = (0, config_1.quotedMultiplier)(b.params);
            pts.set(wc, m);
            if (m < rangeMin)
                rangeMin = m;
            if (m > rangeMax)
                rangeMax = m;
        }
        const sorted = [...pts.entries()].sort((a, z) => a[0] - z[0]);
        let inversions = 0;
        for (let i = 1; i < sorted.length; i++)
            if (sorted[i][1] >= sorted[i - 1][1] - 1e-12)
                inversions++;
        // The captured win chances must BE the plan's (src/config.ts EXPECTED_WIN_CHANCES), both ways:
        // the plan holds a fixed list of win chances, so a count threshold would test nothing.
        const planWc = [...config_1.EXPECTED_WIN_CHANCES].sort((a, z) => a - z);
        const spanOk = sorted.length === planWc.length && sorted.every(([wc], i) => wc === planWc[i]);
        const planMin = config_1.PAYOUT_NUMERATOR / Math.round(planWc[planWc.length - 1] * 100), planMax = config_1.PAYOUT_NUMERATOR / Math.round(planWc[0] * 100);
        const rangeOk = Math.abs(rangeMin - planMin) < 1e-9 && Math.abs(rangeMax - planMax) < 1e-9;
        // The same property over the WHOLE price grid, which no capture can cover: the quotient
        // PAYOUT_NUMERATOR/bp over every basis point of the grid (every band width whose multiplier is
        // above 1×), strictly decreasing.
        let gridPoints = 0, gridInversions = 0, prev = Infinity;
        for (let bp = config_1.PRICE_GRID_MIN_BPS; bp <= config_1.PRICE_GRID_MAX_BPS; bp++) {
            const m = config_1.PAYOUT_NUMERATOR / bp;
            gridPoints++;
            if (!(m < prev) || !(m > 1))
                gridInversions++;
            prev = m;
        }
        out.push((0, context_1.step)(21, 'Multiplier Monotonicity & Range', inversions === 0 && gridInversions === 0 && gridPoints > 0 && rangeOk && spanOk ? 'PASS' : 'FAIL', `${sorted.length} distinct win-chance points in the capture (${spanOk ? 'exactly' : 'NOT'} the plan's ${planWc.length}: ${planWc.join(', ')}%); quoted multiplier (formula 99/winChance, computed from each captured band; on wins Step 7 binds the served value to the same rational, 9900/basisPoints) strictly decreasing in win chance (${inversions} inversions); `
            + `over the whole price grid, ${config_1.PAYOUT_NUMERATOR}/basisPoints is strictly decreasing and above 1× across all ${gridPoints} basis points ${config_1.PRICE_GRID_MIN_BPS}…${config_1.PRICE_GRID_MAX_BPS} (${gridInversions} violations); `
            + `quoted multipliers for the captured bands span ${rangeMin.toFixed(4)}×–${rangeMax.toFixed(4)}×, the plan's ${planMin.toFixed(4)}×–${planMax.toFixed(4)}× (${rangeOk ? 'ok' : 'NOT THE PLAN SPAN'}). LIQD's own odds limits were not read (declared limitation L7)`));
    }
    return out;
}

  },
  "tests/steps/statistical.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Informational items (NOT scored) — realized RTP + per-mode effective edge + roll spread.
 * Authoritative statistical evidence is the Pass 1 simulation (fresh seeds, 2M draws).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const config_1 = require("../../src/config");
function run(ctx) {
    const { bets } = ctx;
    const items = [];
    if (bets.length === 0) {
        items.push({ label: 'Live bets', detail: 'No bets in dataset' });
        return items;
    }
    // Realized RTP (informational: variance over the captured bets, not the theoretical edge), summed
    // in exact 1e-8 units from the served decimal strings, in total and per phase.
    const usdt = (u) => `${u / 100000000n}.${String(u % 100000000n).padStart(8, '0')}`;
    const sums = (list) => {
        let w = 0n, r = 0n;
        for (const b of list) {
            w += (0, config_1.amountUnits)(b.betAmount) ?? 0n;
            r += (0, config_1.amountUnits)(b.winningAmount) ?? 0n;
        }
        return { w, r, pct: w > 0n ? Number(r * 1000000n / w) / 10000 : NaN };
    };
    const all = sums(bets);
    items.push({
        label: 'Realized RTP (variance)',
        detail: `${all.pct.toFixed(2)}% (${usdt(all.w)} USDT wagered, ${usdt(all.r)} USDT returned over ${bets.length} bets; informational, a variance illustration only: the edge evidence is the deterministic effective edge, Step 15, and the simulation, Step 16). `
            + `Per phase: ${config_1.EXPECTED_PHASES.map((ph) => { const x = sums(bets.filter((b) => b.phaseId === ph.id)); return `${ph.id} ${x.pct.toFixed(2)}% (${usdt(x.w)} wagered, ${usdt(x.r)} returned)`; }).join('; ')}.`,
    });
    // Deterministic mean effective edge + per-mode spread (the finding, from arithmetic).
    const modeAgg = {};
    let sumAll = 0;
    for (const b of bets) {
        const e = (0, config_1.effectiveEdge)(b.params);
        sumAll += e;
        const m = (0, config_1.bandMode)(b.params);
        (modeAgg[m] || (modeAgg[m] = { n: 0, sum: 0, min: Infinity, max: -Infinity }));
        const g = modeAgg[m];
        g.n++;
        g.sum += e;
        if (e < g.min)
            g.min = e;
        if (e > g.max)
            g.max = e;
    }
    items.push({ label: 'Mean effective edge', detail: `${(sumAll / bets.length * 100).toFixed(4)}% (target 1.00%; exact under the half-open grid rule)` });
    for (const [m, g] of Object.entries(modeAgg)) {
        items.push({ label: `Effective edge — ${m}`, detail: `mean ${(g.sum / g.n * 100).toFixed(3)}%, range ${(g.min * 100).toFixed(3)}–${(g.max * 100).toFixed(3)}% (n=${g.n})` });
    }
    // Roll spread sanity.
    const rolls = bets.map(b => Number(b.roll));
    items.push({ label: 'Roll range', detail: `min ${Math.min(...rolls).toFixed(2)}, max ${Math.max(...rolls).toFixed(2)} (ceiling 99.99), mean ${(rolls.reduce((a, b) => a + b, 0) / rolls.length).toFixed(3)}` });
    const wins = bets.filter(b => b.win).length;
    items.push({ label: 'Live win rate', detail: `${wins}/${bets.length} = ${(wins / bets.length * 100).toFixed(2)}% (mixed win chances — informational)` });
    // Odds limits: not read from the operator. The production dice replies serve no limits field.
    const mults = bets.map(b => (0, config_1.quotedMultiplier)(b.params));
    items.push({
        label: 'Odds limits',
        detail: `no operator odds or bet-limit configuration is in the production capture (none is served in the dice replies, none was read from the site); captured multiplier span ${Math.min(...mults).toFixed(4)}×–${Math.max(...mults).toFixed(4)}×. What LIQD accepts outside that span was not measured (declared limitation L7).`,
    });
    // Converter-side self-check fields present and ignored.
    items.push({
        label: 'Converter-side self-check fields',
        detail: 'per-bet and per-seed self-check fields written by the converter (localRoll, localWin, verified, commitVerified, chainLinkOk) are present in the dataset but IGNORED by verification; every scored figure is re-derived from primitives. See MANIFEST.md#dataset-and-capture.',
    });
    return items;
}

  },
  "tests/verify.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * LIQD Dice — Verification suite
 * Run: npm run verify
 *
 * Loads the captured master dataset (SHA-256 guarded), runs all scored steps, and writes THIS RUN's
 * results — pass or fail — under `outputs/run/`, leaving every committed artifact byte-identical.
 *
 * ── VERIFICATION DOES NOT WRITE THE EVIDENCE IT SCORES ──────────────────────────────────────────
 * Overwriting `outputs/verification-results.json` and `outputs/report-figures.json` at the end of
 * EVERY run, including a failing one, destroys the evidence of a disagreement.
 * `report-figures.json` is an artifact of record that Step 19 itself scores, so a run
 * that disagreed with the committed evidence would replace the evidence of the disagreement and
 * the next run would pass. Executed: FAIL on Node 24, then PASS on the re-run,
 * with nothing left to show the first result. Repeated testing must not be able to erase an
 * original disagreement.
 *
 * Two commands, deliberately distinct:
 *   • `npm run verify`  — scores the committed artifacts, writes ONLY under `outputs/run/`
 *                         (this run's results, plus a field-level diff against the committed
 *                         artifacts). Committed bytes are never touched. Run it twice on unchanged
 *                         input and you get the same outcome twice.
 *   • `npm run report`  — the same run with `PF_EMIT=1`: an EXPLICIT, intentional regeneration of
 *                         the committed artifacts, to be reviewed as a diff before publishing.
 *
 * The supported runtime is pinned and enforced before any of this happens — see `src/runtime.ts`.
 *
 * Note: Dice has NO multiplier config file — the payout is the quotient 9900/basisPoints, so there
 * is no config artifact to pin. `artifactHashes` carries the dataset pin and the
 * simulation artifact pins that Step 19 reconciles (`npm test` does not regenerate the
 * simulation; `npm run test:full` does and sets SIM_FRESH=1 to record rather than enforce).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const loader_1 = require("../src/loader");
const config_1 = require("../src/config");
const report_figures_1 = require("../src/report-figures");
const runtime_1 = require("../src/runtime");
const diff_1 = require("../src/diff");
const profile_map_1 = require("../src/profile-map");
const rtp_settings_1 = require("../src/rtp-settings");
const rtp_claim_1 = require("../src/rtp-claim");
const commitment = __importStar(require("./steps/commitment"));
const determinism = __importStar(require("./steps/determinism"));
const payouts = __importStar(require("./steps/payouts"));
const dataset = __importStar(require("./steps/dataset"));
const antiCirc = __importStar(require("./steps/anti-circularity"));
const phaseD = __importStar(require("./steps/phase-d"));
const boundary = __importStar(require("./steps/boundary"));
const simulation = __importStar(require("./steps/simulation"));
const liveFit = __importStar(require("./steps/live-fit"));
const statistical = __importStar(require("./steps/statistical"));
const standardization = __importStar(require("./steps/standardization"));
const DATASET_PATH = path.join(__dirname, '..', config_1.DATASET_FILE);
// Single-sourced in src/config.ts: declared here AND in src/simulate.ts, the same pin would let
// the producer and the verifier score different captures.
const EXPECTED_DATASET_HASH = config_1.DATASET_SHA256;
const OUTPUTS_DIR = path.join(__dirname, '../outputs');
/** This run's results. Never a committed artifact; gitignored. */
const RUN_DIR = path.join(OUTPUTS_DIR, 'run');
/** PF_EMIT=1 (npm run report) is the ONLY thing that rewrites a committed artifact. */
const EMIT = process.env.PF_EMIT === '1';
// Refuse an unvalidated runtime BEFORE anything is read, scored or written. An exact-equality
// suite on a runtime whose Math.exp differs in the last bit produces a FAIL that says nothing about
// the casino, and the honest response is to decline the run rather than to widen the comparison.
(0, runtime_1.assertSupportedRuntime)();
console.log('\n══════════════════════════════════════════════════════════');
console.log('  LIQD DICE — VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════');
console.log(`  Runtime: Node v${process.versions.node} (validated: ${runtime_1.VALIDATED_RUNTIME})`);
console.log(EMIT
    ? '  MODE: REPORT GENERATION (PF_EMIT=1) — the committed artifacts WILL be rewritten'
    : '  MODE: verification — committed artifacts are read-only; results go to outputs/run/');
// ── Dataset presence guard (graceful) ─────────────────────────────────────────
if (!fs.existsSync(DATASET_PATH)) {
    console.log(`\n  [ERROR] Dataset not found at ${config_1.DATASET_FILE}`);
    console.log('  Cannot run verification without the captured master dataset.');
    console.log('\n══════════════════════════════════════════════════════════\n');
    process.exit(1);
}
// ── Load dataset (SHA-256 guard exits(1) on mismatch) ─────────────────────────
const ds = (0, loader_1.loadDataset)(DATASET_PATH, EXPECTED_DATASET_HASH);
const bets = ds.bets;
const seeds = ds.seeds;
// seedMap: hashedServerSeed → revealed serverSeed
const seedMap = new Map();
for (const s of seeds) {
    if (s.serverSeed)
        seedMap.set(s.hashedServerSeed, s.serverSeed);
}
// byHash: hashedServerSeed → bets[]
const byHash = new Map();
for (const b of bets) {
    const arr = byHash.get(b.hashedServerSeed) ?? [];
    arr.push(b);
    byHash.set(b.hashedServerSeed, arr);
}
if (!fs.existsSync(OUTPUTS_DIR))
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
console.log(`  Dataset: ${bets.length} bets | Seeds: ${seeds.length} | SHA-256 verified`);
{
    const perPhase = new Map();
    for (const b of bets)
        perPhase.set(b.phaseId, (perPhase.get(b.phaseId) ?? 0) + 1);
    console.log(`  Phases: ${[...perPhase].map(([k, n]) => `${k} ${n}`).join(' · ')}\n`);
}
const ctx = {
    bets, seeds, seedMap, byHash,
    outputsDir: OUTPUTS_DIR,
    datasetSha256: ds.sha256,
    expectedDatasetHash: EXPECTED_DATASET_HASH,
    meta: ds.meta,
    simArtifact: null, // populated by the simulation step
};
// ── Run scored steps ──────────────────────────────────────────────────────────
const results = [
    ...commitment.run(ctx), // Steps  1– 4
    ...determinism.run(ctx), // Steps  5– 6
    ...payouts.run(ctx), // Steps  7–10
    ...dataset.run(ctx), // Steps 11–12
    ...antiCirc.run(ctx), // Step  13
    ...phaseD.run(ctx), // Step  14
    ...boundary.run(ctx), // Step  15
    ...simulation.run(ctx), // Steps 16–17
    ...standardization.run(ctx), // Steps 18–21
    ...liveFit.run(ctx), // Step  22
];
// ── Execution completeness (G-EXEC) ────────────────────────────────────────────
// The verdict below is computed over `results`. A run that executed fewer steps than the suite
// holds, or steps out of order, must not reach a verdict at all: the step count is compared with
// EXPECTED_STEPS (src/config.ts), a number from OUTSIDE the results array.
if (results.length !== config_1.EXPECTED_STEPS || !results.every((r, i) => r.step === i + 1)) {
    console.error(`\n  [ERROR] executed ${results.length} step(s) [${results.map((r) => r.step).join(', ')}], expected steps 1..${config_1.EXPECTED_STEPS}: no verdict is given for an incomplete run`);
    process.exit(1);
}
// ── Profile labels ──────────────────────────────────────────────────────────────
// Each scored step says which ProvablyFair.org Dice profile check it implements, so the conformance
// matrix is DERIVED from the artifact rather than written by hand and left to go stale. The label is
// attached here, to the emitted record only: src/profile-map.ts cannot change what any step asserts.
const labelled = results.map(r => ({ ...r, ...(0, profile_map_1.labelFor)(r.step) }));
// ── Informational items ───────────────────────────────────────────────────────
const infoItems = statistical.run(ctx);
// ── RTP-CLAIM rule (1.2.0, Methodology v1.1; agreed 2026-09-29, 1.2.0 2026-10-14) ──────────────
// The per-setting exact RTP table held to the published claim (src/rtp-settings.ts). While the
// package switch RTP_CLAIM_RULE_ENFORCED (src/rtp-claim-switch.ts) is false this is printed only and no step moves; when it
// is true a miss (gate status OVERSTATED) marks the step carrying DICE-19 OVERSTATED: not a draw FAIL, not counted in
// hardFail, verdict RTP FIGURE OVERSTATED, exit 5 (decision D3, 2026-10-14). A committed table that no longer equals this
// run (or its pin) is a reproduction failure either way (gate status FAIL → step FAIL, exit 1).
const rtpClaim = (0, rtp_settings_1.runRtpClaimGate)();
console.log('');
for (const line of rtpClaim.lines)
    console.log(`  ${line}`);
if (rtpClaim.status === 'FAIL' || rtpClaim.status === 'OVERSTATED') {
    // `labelled` (the emitted record) was copied from `results` above: mark the step in both, or the
    // artifact would carry it as PASS under another verdict.
    const status = rtpClaim.status;
    for (const list of [results, labelled]) {
        const s = list.find(r => r.step === rtp_settings_1.RTP_CLAIM_STEP);
        if (s) {
            s.status = status;
            s.detail += status === 'FAIL' ? ' — RTP-CLAIM: the committed table does not match this run or its pin (reproduction failure)'
                : ` — ${rtp_claim_1.RTP_FIGURE_OVERSTATED} (RTP-CLAIM 1.2.0, enforced): ${rtpClaim.result.minimalFix}`;
        }
    }
    console.log(`  [${status === 'FAIL' ? 'FAIL' : rtp_claim_1.RTP_FIGURE_OVERSTATED}] Step ${rtp_settings_1.RTP_CLAIM_STEP} — re-scored by the enforced RTP-CLAIM rule (outcome ${rtpClaim.result.outcome})`);
}
// ── Summary ───────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.status === 'PASS').length;
const flags = results.filter(r => r.status === 'FLAG').length;
const hardFail = results.filter(r => r.status === 'FAIL').length;
const overstated = results.filter(r => r.status === 'OVERSTATED').length;
// A FLAG's ORIGIN decides whether it bears on the verdict (profile policy FLAG, decided
// 2026-09-17). An operator-origin flag (the residual is about the game) downgrades the verdict to a
// Conditional Pass and exits 2; a capture-origin flag (an auditor-side capture-retry gap that the
// revealed seed reconstructs) is counted and disclosed but verdict-neutral — Full Pass, exit 0.
// INFO (profile policy INFORMATIONAL — the DICE-22 live-sample serial screen, Step 22;
// 2026-09-29) is not a flag: Step 22 is a numbered step that reports INFO and cannot fail — it is
// reported, never counted, never in the verdict or the exit code.
// A flag with no origin defaults to operator, so an unclassified flag can only ever err toward
// disclosure, never toward hiding one.
const informational = results.filter(r => r.status === 'INFO').length;
const captureFlags = results.filter(r => r.status === 'FLAG' && r.origin === 'capture').length;
const operatorFlags = flags - captureFlags;
// The rule's ranking (src/rtp-claim.ts rtpClaimVerdict): draw fail 1 > INCOMPLETE 3 > RTP FIGURE OVERSTATED 5 >
// Conditional Pass 2 > Full Pass 0. Every step has run by this line (a throw ends the process), so the run is complete.
const { verdict, exit: verdictExit } = (0, rtp_claim_1.rtpClaimVerdict)({ fails: hardFail, complete: true, overstated: overstated > 0, opFlags: operatorFlags });
if (infoItems.length > 0) {
    console.log('');
    console.log('  ┌── Informational Context (not scored) ──');
    for (const item of infoItems)
        console.log(`  │ ${item.label}: ${item.detail}`);
    console.log('  └──');
}
console.log('\n══════════════════════════════════════════════════════════');
console.log('  RESULTS SUMMARY');
console.log('══════════════════════════════════════════════════════════');
console.log(`  Passed:     ${passed}/${results.length}`);
console.log(`  Hard fails: ${hardFail}`);
if (overstated)
    console.log(`  RTP figure overstated: Step ${rtp_settings_1.RTP_CLAIM_STEP} (RTP-CLAIM 1.2.0, enforced; not a draw fail)`);
console.log(`  Flags:      ${flags}`);
if (informational)
    console.log(`  Informational deviations: ${informational} (reported, not counted, verdict unchanged)`);
console.log(`\n  VERDICT: ${verdict}`);
console.log('══════════════════════════════════════════════════════════\n');
// NO run metadata in an artifact of record (F8: absent, not excluded). The run's timestamp, its
// runtime and whether the simulation pin was enforced belong to THIS RUN and are recorded in
// outputs/run/diff.json, never in the committed verification-results.json / report-figures.json.
const runAt = new Date().toISOString();
const verificationBody = {
    // The assigned audit ID, single-sourced from src/config.ts so it agrees with the
    // README/MANIFEST chapters and is machine-checkable (DICE-28 "the audit ID is assigned").
    auditId: config_1.AUDIT_ID,
    verdictQualifier: config_1.VERDICT_QUALIFIER,
    totalBets: bets.length,
    totalSeeds: seeds.length,
    datasetSha256: ds.sha256,
    artifactHashes: {
        // Dice has NO multiplier config file — the payout is a formula (99/continuousWinChance).
        // There is no config artifact to pin, so the dataset is the only pinned artifact.
        // expected = the pin in this file; actual = the recomputed hash; match must be true
        // (loadDataset already exits(1) on mismatch, so a written file always has match: true).
        dataset: {
            file: config_1.DATASET_FILE,
            expected: EXPECTED_DATASET_HASH,
            actual: ds.sha256,
            match: ds.sha256 === EXPECTED_DATASET_HASH,
            sha256: ds.sha256,
        },
        // Records WHICH simulation artifact Steps 16–17 actually scored (its actual sha256),
        // alongside the pin it is reconciled against. This IS
        // a pinned guard: `npm test` does not regenerate the artifact, Step 19 reconciles both
        // simulation files against `SIMULATION_SHA256` / `SIMULATION_HTML_SHA256`, and `SIM_FRESH=1`
        // (set by `npm run test:full`) switches the pin from enforce to record — a property of the run,
        // so it is recorded in outputs/run/diff.json (`simulationPinEnforced`), not here. Null if absent.
        simulation: ctx.simArtifact
            ? { ...ctx.simArtifact, expected: config_1.SIMULATION_SHA256, match: ctx.simArtifact.sha256 === config_1.SIMULATION_SHA256 }
            : null,
        simulationChart: { file: 'outputs/rtp-convergence.html', expected: config_1.SIMULATION_HTML_SHA256 },
    },
    steps: labelled,
    profileCoverage: (0, profile_map_1.profileCoverageBlock)(),
    info: infoItems,
    // The one summary shape of every LIQD package (scripts/release-bar.mjs):
    // captureFlags counts the capture-origin FLAGs; an INFO step is not a flag and is not counted.
    summary: { passed, flags, operatorFlags, captureFlags, hardFail, verdict },
};
// Derived report figures — the settled-RTP span, the settlement residual's direction, the
// Phase-D exposure and the boundary-hit expectation. These are quoted in the report, so they are
// emitted by committed code from the pinned dataset rather than typed into prose (an unsourced
// figure is indistinguishable from a remembered one).
const figuresBody = {
    datasetSha256: ds.sha256,
    ...(0, report_figures_1.computeReportFigures)(bets, seeds),
};
const VERIFICATION_FILE = 'verification-results.json';
const FIGURES_FILE = 'report-figures.json';
const write = (dir, name, body) => fs.writeFileSync(path.join(dir, name), JSON.stringify(body, null, 2));
const readJsonOrNull = (p) => {
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
    catch {
        return null;
    }
};
/**
 * Fields on which this run disagrees with the committed artifacts BEYOND the reproduction
 * tolerance. Stays 0 on the emission path, which is regenerating those artifacts rather than
 * checking against them.
 */
let reproductionFailures = 0;
if (EMIT) {
    // ── EXPLICIT REPORT GENERATION (`npm run report`) ───────────────────────────────────────────
    // The only path that rewrites a committed artifact. It is a separate command precisely so that
    // replacing evidence is an act somebody chose, reviewed as a diff, rather than a side effect of
    // testing.
    write(OUTPUTS_DIR, VERIFICATION_FILE, verificationBody);
    write(OUTPUTS_DIR, FIGURES_FILE, figuresBody);
    console.log(`  REPORT GENERATION: rewrote outputs/${VERIFICATION_FILE} and outputs/${FIGURES_FILE}`);
    console.log('  Review the diff before publishing — these are artifacts of record.');
}
else {
    // ── VERIFICATION (`npm run verify`) ─────────────────────────────────────────────────────────
    // This run's results, pass or fail, plus a field-level diff against the committed artifacts. A
    // disagreement is RECORDED here; it is not resolved in favour of whichever run wrote last.
    fs.mkdirSync(RUN_DIR, { recursive: true });
    write(RUN_DIR, VERIFICATION_FILE, verificationBody);
    write(RUN_DIR, FIGURES_FILE, figuresBody);
    // NOTHING IS EXCLUDED (F9). Neither artifact carries run metadata — the run's timestamp, runtime
    // and pin mode are recorded below, in this run's diff.json only — so every leaf is compared.
    const committedVerification = readJsonOrNull(path.join(OUTPUTS_DIR, VERIFICATION_FILE));
    const committedFigures = readJsonOrNull(path.join(OUTPUTS_DIR, FIGURES_FILE));
    const verificationDiff = (0, diff_1.fieldDiff)(committedVerification, verificationBody, []);
    const figuresDiff = (0, diff_1.fieldDiff)(committedFigures, figuresBody, []);
    // THE GATE IS "BEYOND TOLERANCE", NOT "ANY FIELD". The last bits of a derived floating-point
    // statistic are a property of the machine, not of the result: regenerated on other hardware a
    // p-value moves by a unit in the last place. Scoring that as a disagreement trains a reader to
    // ignore the diff, which is the one outcome that makes it useless. The bound is declared in
    // src/diff.ts and sits far below the precision of any figure this audit publishes; outside it
    // is a DIFFERENT result, and the run exits 1.
    const realVerification = (0, diff_1.beyondTolerance)(verificationDiff);
    const realFigures = (0, diff_1.beyondTolerance)(figuresDiff);
    const realTotal = realVerification.length + realFigures.length;
    const allDiffs = [...verificationDiff, ...figuresDiff];
    const gap = (0, diff_1.maxima)(allDiffs);
    write(RUN_DIR, 'diff.json', {
        runAt,
        runtime: process.versions.node,
        simulationPinEnforced: process.env.SIM_FRESH !== '1',
        verdict,
        tolerance: { atol: diff_1.DIFF_ATOL, rtol: diff_1.DIFF_RTOL, rule: '|a-b| <= atol + rtol*max(|a|,|b|); two distinct integers never agree' },
        reproduced: realTotal === 0,
        beyondToleranceCount: realTotal,
        withinToleranceCount: allDiffs.length - realTotal,
        largestGap: gap,
        note: 'Field-level diff between the COMMITTED artifacts and THIS RUN. Nothing is excluded: the '
            + 'committed artifacts carry no run metadata (this run\'s time, runtime and pin mode are recorded '
            + 'only here, in outputs/run/). Entries marked '
            + '`withinTolerance` are the same result computed on different hardware and are recorded, '
            + 'not scored. Any entry NOT so marked means this run disagrees with the committed evidence '
            + '— investigate it; do not re-run until it goes away, and do not regenerate the committed '
            + 'artifact to make it go away.',
        committedReadable: {
            [`outputs/${VERIFICATION_FILE}`]: committedVerification !== null,
            [`outputs/${FIGURES_FILE}`]: committedFigures !== null,
        },
        verificationResultsDiff: verificationDiff,
        reportFiguresDiff: figuresDiff,
    });
    console.log(`  Output (this run only): outputs/run/${VERIFICATION_FILE}, outputs/run/${FIGURES_FILE}, outputs/run/diff.json`);
    console.log('  Committed artifacts NOT modified. Use `npm run report` to propose replacements.');
    console.log(`  Reproduction vs the committed artifacts on Node ${process.versions.node}: `
        + `${realTotal === 0 ? 'REPRODUCED' : `${realTotal} field(s) BEYOND TOLERANCE`}`
        + `${allDiffs.length - realTotal > 0 ? ` (${allDiffs.length - realTotal} within tolerance` + (gap ? `, largest ${gap.absDiff.toExponential(2)} at ${gap.path}` : '') + ')' : ''}`);
    if (realTotal > 0) {
        console.log(`  ⚠ THIS RUN DISAGREES WITH THE COMMITTED EVIDENCE — ${realVerification.length} field(s) in ${VERIFICATION_FILE}, ${realFigures.length} in ${FIGURES_FILE}. See outputs/run/diff.json.`);
        for (const d of [...realVerification, ...realFigures].slice(0, 6)) {
            console.log(`      ${d.path}: committed ${JSON.stringify(d.committed)} vs this run ${JSON.stringify(d.thisRun)}`);
        }
    }
    reproductionFailures = realTotal;
}
// Exit non-zero on anything short of a clean Full Pass: a hard fail
// exits 1, an RTP FIGURE OVERSTATED (enforced RTP-CLAIM 1.2.0 miss) exits 5, and a Conditional Pass (an OPERATOR-origin FLAG — e.g. a missing simulation artifact)
// exits 2, so CI cannot mistake a degraded run for the verdict of record. A capture-origin FLAG is
// verdict-neutral (profile policy FLAG): it is disclosed but does not change the verdict class, so
// it does not force a non-zero exit.
// Reproduction beyond tolerance is a FAIL, not a warning: a gate that only prints is not one.
if (hardFail > 0 || reproductionFailures > 0 || !rtpClaim.tableMatches)
    process.exit(1);
// 5 RTP FIGURE OVERSTATED, 2 Conditional Pass, 0 Full Pass — the code rtpClaimVerdict ranked above.
if (verdictExit !== 0)
    process.exit(verdictExit);

  },
};
var __cache = {};

function __flatten(from, spec) {
  var base = from ? from.split('/').slice(0, -1).join('/') : '';
  var parts = (base ? base + '/' + spec : spec).split('/');
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (p === '' || p === '.') continue;
    if (p === '..') { out.pop(); continue; }
    out.push(p);
  }
  return out.join('/');
}

function __resolve(from, spec) {
  var joined = __flatten(from, spec);
  var candidates = [joined, joined + '.js', joined + '.json', joined + '/index.js'];
  for (var c = 0; c < candidates.length; c++) {
    if (Object.prototype.hasOwnProperty.call(__modules, candidates[c])) return candidates[c];
  }
  return null;
}

function __require(from, spec) {
  if (!spec.startsWith('.')) return __nodeRequire(spec);
  var id = __resolve(from, spec);
  if (!id) {
    // Not TypeScript, so tsc never emitted it — a .mjs/.cjs/.json asset the package SHIPS, such as
    // a capture reference module. Load the real file off disk relative to the package root. The
    // bundle stays self-contained for compiled code without pretending the package has no other
    // files; if the asset is genuinely missing, the error names it rather than hiding it.
    var abs = __PF_ROOT__ + '/' + __flatten(from, spec);
    try { return __nodeRequire(abs); } catch (e) {
      throw new Error('standalone verifier: unresolved module "' + spec + '" from "' + from + '" (' + e.message + ')');
    }
  }
  if (__cache[id]) return __cache[id].exports;
  var module = { exports: {} };
  __cache[id] = module;
  var dir = id.split('/').slice(0, -1).join('/');
  __modules[id](
    module,
    module.exports,
    function (s) { return __require(id, s); },
    __PF_ROOT__ + '/' + id,
    dir ? __PF_ROOT__ + '/' + dir : __PF_ROOT__
  );
  return module.exports;
}

__require('', './tests/verify.js');
