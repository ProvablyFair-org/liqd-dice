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
 * 9900/9800 = 1.0102…×). The price grid the model covers is every band width that has a win chance
 * and a multiplier above 1× (PRICE_GRID_MIN_BPS … PRICE_GRID_MAX_BPS); which of those widths outside
 * 1%–98% production accepts was not measured (limitation L7).
 */
export const RANGE = 10000;        // integer draw domain 0..9999
export const CURSOR = 0;           // fixed HMAC cursor for the single dice draw
export const SCALE = 100;          // roll = draw / 100  → 2 decimals, ceiling 99.99
export const HOUSE_EDGE = 0.01;
/**
 * The price grid in basis points of win chance (1 bp = 0.01 %): every band width with a win chance
 * whose multiplier 9900/bp is above 1×, i.e. bp 1 … 9899. A mathematical universe, not an operator
 * limit: the RTP-CLAIM table and the monotonicity step sweep all of it; the capture played 100 … 9800.
 */
export const PRICE_GRID_MIN_BPS = 1;
export const PRICE_GRID_MAX_BPS = 9899;

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
 * (win chance 98% … 1%, 1.0102× … 99×: the span of win chances the production capture played). Each target
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
export const DATASET_SHA256 = 'b5357d37d4c65b26e04915ddc8d59d2b8d144f81a51242f278080a1a2d8b8697';
/** The scored dataset's path, single-sourced for the verifier, the producer and the release manifest. */
export const DATASET_FILE = 'data/dice-prod-5935bets.json';

/**
 * ProvablyFair.org audit identifier. Single-sourced here so the emitted
 * `outputs/verification-results.json` carries the same ID the report chapters print (README.md,
 * MANIFEST.md), and DICE-28's "the audit ID is assigned" is machine-checkable rather than prose
 * only. `LQ` = LIQD; `04` = the fourth LIQD audit (blackjack, mines, plinko preceded it).
 *
 * The qualifier names the environment the SCORED dataset was captured on: `production`. Every scored
 * round was placed on `liqd.com` between 7 and 10 November 2026.
 */
export const AUDIT_ID = 'PF-2026-LQ04';
export const VERDICT_QUALIFIER = 'production';

/**
 * The number of numbered steps a complete run executes (21 scored + the informational Step 22).
 * tests/verify.ts compares the executed step count and numbering against it before any verdict is
 * printed, so a run that stopped early cannot present its partial list as the whole suite (G-EXEC).
 */
export const EXPECTED_STEPS = 22;

/**
 * THE AUDITED POPULATION, as CODE constants (G-BIND).
 *
 * A statement of how big this audit is that lives INSIDE the file being audited is no statement at
 * all: comparing `bets.length` against a planned total read from the dataset's own header is
 * self-referential, and the SHA-256 pin does not repair it. The pin proves the file has not changed
 * since WE pinned it, not that it is the capture. The consequence is concrete: delete the trailing
 * nonces of every epoch, rewrite the header counts and every `nonceEnd` to match, re-pin
 * `DATASET_SHA256`, regenerate the simulation, and a suite that trusts the header returns a Full Pass
 * on the shrunken dataset.
 *
 * A row count is not an identity. These constants are the audit's own statement of its population;
 * `meta` is checked AGAINST them rather than believed. Changing them is a visible source edit in
 * the same commit as the dataset, which is exactly the property a header field lacks.
 * Counterexample registered as `coherent population shrink` in `tests/mutations.json`.
 *
 * THE PRODUCTION PLAN (liqd.com, 7 to 10 November 2026), three capture files, four phases:
 *   A   7 Nov   25 epochs of 200   0.10 USDT   10 win chances (2% … 98%) × 5 band types
 *   D   10 Nov   5 epochs of 100   0.10 USDT   the Phase A settings, each epoch under a player-set client seed
 *   A+  10 Nov   1 epoch of 200    0.10 USDT   1% win chance (99×) in the four modes, 50 each (the Phase A top-up)
 *   C   10 Nov   2 epochs, 118+117 10.00 USDT  over 50 (50% win chance, 1.98×)
 * The values are the plans the capture runner executed (each file's meta); they are typed here, in
 * code, and the dataset header is reconciled AGAINST them (Steps 11-12), never used as the plan.
 * There is no separate tail phase: the 99× setting is the A+ top-up and the 49.5× setting is the 2%
 * win chance of Phase A.
 */
export interface PhasePlan {
  /** The runner's phase id (the dataset's `phaseId`). */
  id: string;
  /** The phase letter the runner recorded on every round (the dataset's `phase`). */
  phase: string;
  /** Index of the capture file the phase was played in (dataset `capture`). */
  capture: number;
  /** Rounds per epoch, in capture order. */
  epochSizes: readonly number[];
  /** The one stake of the phase, as LIQD serves it (an 8-dp decimal string, USDT). */
  stake: string;
  /** True when every epoch of the phase ran under a client seed set by the player (Phase D). */
  playerSeeds: boolean;
  /** The win chances (percent) the phase's plan plays. */
  winChances: readonly number[];
}
const PLAN_WIN_CHANCES: readonly number[] = [2, 5, 10, 20, 35, 50, 65, 80, 90, 98];
export const EXPECTED_PHASES: readonly PhasePlan[] = [
  { id: 'A', phase: 'A', capture: 0, epochSizes: Array.from({ length: 25 }, () => 200), stake: '0.10000000', playerSeeds: false, winChances: PLAN_WIN_CHANCES },
  { id: 'D', phase: 'D', capture: 1, epochSizes: [100, 100, 100, 100, 100], stake: '0.10000000', playerSeeds: true, winChances: PLAN_WIN_CHANCES },
  { id: 'A+', phase: 'A', capture: 1, epochSizes: [200], stake: '0.10000000', playerSeeds: false, winChances: [1] },
  { id: 'C', phase: 'C', capture: 2, epochSizes: [118, 117], stake: '10.00000000', playerSeeds: false, winChances: [50] },
];
/** One row per epoch, in dataset order (epoch 0 … EXPECTED_SEEDS − 1). */
export interface EpochPlan { epoch: number; phaseId: string; phase: string; capture: number; bets: number; stake: string; playerSeeds: boolean }
export const EXPECTED_EPOCHS: readonly EpochPlan[] = EXPECTED_PHASES.flatMap((ph) =>
  ph.epochSizes.map((bets) => ({ phaseId: ph.id, phase: ph.phase, capture: ph.capture, bets, stake: ph.stake, playerSeeds: ph.playerSeeds })),
).map((e, epoch) => ({ epoch, ...e }));
export const EXPECTED_SEEDS = EXPECTED_EPOCHS.length;                                  // 33
export const EXPECTED_BETS = EXPECTED_EPOCHS.reduce((a, e) => a + e.bets, 0);          // 5,935
export const EXPECTED_CAPTURES = new Set(EXPECTED_PHASES.map((ph) => ph.capture)).size; // 3
/** Rounds per phase id. The plan, in code, not `meta.phases`, which is inside the evidence. */
export const EXPECTED_PHASE_BETS: Readonly<Record<string, number>> = Object.fromEntries(
  EXPECTED_PHASES.map((ph) => [ph.id, ph.epochSizes.reduce((a, n) => a + n, 0)]),
);
/** The base stake (phases A, A+ and D) and the elevated stake (Phase C), as served. */
export const BASE_STAKE = '0.10000000';
export const ELEVATED_STAKE = '10.00000000';
/** Every win chance (percent) the plan plays, ascending: Phase A's ten plus the A+ top-up's 1%. */
export const EXPECTED_WIN_CHANCES: readonly number[] =
  [...new Set(EXPECTED_PHASES.flatMap((ph) => ph.winChances))].sort((a, z) => a - z);
/** The audited size of one epoch (throws on an epoch outside the plan). */
export function expectedEpochSize(epoch: number): number {
  const e = EXPECTED_EPOCHS[epoch];
  if (!e || e.epoch !== epoch) throw new Error(`expectedEpochSize: epoch ${epoch} is not in the plan`);
  return e.bets;
}
/** Profile floors the plan was sized for (DICE-12, DICE-06, DICE-15), asserted by Steps 12, 14 and 18. */
export const PHASE_C_MIN_BETS = 100;
export const PHASE_C_MIN_WINS = 100;
export const PHASE_D_MIN_DISTINCT_SEEDS = 2;
export const PHASE_A_MIN_BETS_PER_CLASS = 50;

/**
 * The boundary-probe record (evidence E17): LIQD's production verify endpoint asked, on 9 November
 * 2026, for rolls that land exactly on a band bound. Pinned here; Step 15 re-derives every probe.
 * E17_PROBES is the number of answered records in the file (22 planned probes and one re-sent
 * verify call of the capture itself).
 */
export const E17_FILE = 'evidence/E17-prod-verify-boundary-probes-2026-11-09.json';
export const E17_SHA256 = '3cf8d772f60f62793579db7f0041ef81e77aff490b95e03717fd96c23f82de98';
export const E17_PROBES = 23;

/**
 * Pass-2 served-band return scan (DICE-21): the level IS the suite's single ALPHA, single-sourced
 * here so the producer (src/simulate.ts) and the verifier (tests/steps/simulation.ts) cannot drift.
 * The early window of an epoch is expectedEpochSize(epoch).
 */
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
export const SIMULATION_SHA256 = '9e479965badc9bb646b0a6302837291c0704451df6e699e96a855883e70b0828';
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
 * randSeed()` every 50 bets (nonce = bet index mod 50). Target t (0-based,
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
 * `basisPoints` anywhere, and this is `Math.round(winChance% × 100)`, the win chance re-expressed in
 * hundredths of a percent. The evidence for the form is Step 7: the served `multiplier` equals
 * `9900/basisPoints` bit-for-bit on every captured win, while the float closed form
 * `(100/wc)·(1−edge)` matches only some of them (Step 7 prints both counts). So the quotient, not the
 * closed form, is what the server computes.
 */
export const PAYOUT_NUMERATOR = (1 - HOUSE_EDGE) * 10000;   // exactly 9900 at a 1% edge
export function payoutBasisPoints(p: DiceParams): number {
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
export function quotedMultiplier(p: DiceParams): number {
  const wc = continuousWinChancePct(p);
  return wc > 0 ? (100 / wc) * (1 - HOUSE_EDGE) : 0;
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
 * Win rule applied to a served roll: HALF-OPEN band [lower, upper), honouring `inverted`.
 * roll == lower wins, roll == upper loses; inverted is the exact complement. The boundary cases are
 * witnessed on LIQD's production verifier (evidence E17, re-derived by Step 15).
 */
export function diceWin(roll: number, p: DiceParams): boolean {
  const inBand = roll >= p.lower && roll < p.upper;
  return p.inverted ? !inBand : inBand;
}

/** The same band read as INCLUSIVE on both ends: the alternative rule the boundary probes are tested against. */
export function diceWinInclusive(roll: number, p: DiceParams): boolean {
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
 * WHY NOT A TOLERANCE. `continuousWinChancePct` computes `upper − lower` in binary64, so an
 * `over 99.99` band gives `100 − 99.99 = 0.010000000000005116`, a float multiplier of
 * 9899.999999994936 and an edge departure of 5.063813951489138e-13: a tolerance sized on the float
 * noise of the captured bands would sit within a factor of two of the noise at that band. In
 * integers there is no noise and no threshold (swept over every 2-dp band of the four families in
 * tests/dice/settlementTests.ts).
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
 * every band under the half-open rule. A window can therefore land EXACTLY on its expectation, and
 * the two binary64 accumulations then disagree in the last bits, so a float `<` would count an exact
 * tie as "below".
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
export function servedRollMatches(served: number, recomputed: number): boolean {
  if (!Number.isFinite(served) || !Number.isFinite(recomputed)) return false;
  const units = Math.round(served * SCALE);
  if (units / SCALE !== served) return false;            // served value is not on the 2-dp grid
  if (units < 0 || units >= RANGE) return false;         // outside the roll domain
  return served === recomputed;
}

const UNITS_PER_WHOLE = 100_000_000n;      // 1e8, the settlement grid

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
 * A string input is taken verbatim: the dataset keeps every money field as the 8-dp string LIQD
 * served, so no binary64 step sits between the served text and the comparison. For a number,
 * `String(x)` is the shortest decimal that round-trips to that binary64.
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

/**
 * THE SETTLEMENT RULE (scored by Steps 8, 10, 18 and 20).
 *
 *   credit = floor8( stake × 9900 / basisPoints )        computed exactly, on the decimal stake
 *
 * The exact product is rounded DOWN to the 1e-8 grid; a loss pays 0. Measured on the production
 * capture (data/dice-prod-5935bets.json): the rule reproduces the served winningAmount on every
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
export function floor8CreditUnits(stake: number | string, p: DiceParams): bigint {
  const bps = payoutBasisPoints(p);
  if (bps <= 0) throw new Error(`floor8CreditUnits: band with no win chance: ${JSON.stringify(p)}`);
  if (!Number.isInteger(PAYOUT_NUMERATOR)) throw new Error('floor8CreditUnits: PAYOUT_NUMERATOR is not an integer');
  const [sn, sd] = decimalFraction(stake);
  if (sn < 0n) throw new Error(`floor8CreditUnits: negative stake ${stake}`);
  // stake × PAYOUT_NUMERATOR / bps, in 1e-8 units, rounded down: floor(sn·N·1e8 / (sd·bps))
  return (sn * BigInt(PAYOUT_NUMERATOR) * UNITS_PER_WHOLE) / (sd * BigInt(bps));
}

/** The same floor on the served multiplier's decimal text: floor8(stake × multiplier). */
export function floor8CreditUnitsServed(stake: number | string, multiplier: number | string): bigint {
  const [sn, sd] = decimalFraction(stake);
  const [mn, md] = decimalFraction(multiplier);
  if (sn < 0n || mn < 0n) throw new Error(`floor8CreditUnitsServed: negative input ${stake} × ${multiplier}`);
  return (sn * mn * UNITS_PER_WHOLE) / (sd * md);
}

/**
 * A served amount as exact 1e-8 units, or null if it is not on the 8-dp grid. Read from the decimal
 * text, so `"0.10102040"` is 10102040 units with no binary64 step in between.
 */
export function amountUnits(x: number | string): bigint | null {
  const [n, d] = decimalFraction(x);
  const scaled = n * UNITS_PER_WHOLE;
  return scaled % d === 0n ? scaled / d : null;
}

/** Mode label for a band, for reporting/aggregation. */
export function bandMode(p: DiceParams): 'under' | 'over' | 'inside' | 'outside' {
  if (p.inverted) return 'outside';
  if (p.lower === 0) return 'under';
  if (p.upper === 100) return 'over';
  return 'inside';
}
