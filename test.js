/**
 * STANDALONE UNIT SUITE — generated, do not edit.
 *
 *     node test.js
 *
 * Runs the package's own unit tests with no `npm install` and no mocha. The test sources are
 * unchanged; `describe`/`it` are bound to Node's built-in `node:test` runner instead of mocha's.
 *
 * It is a BUILD PRODUCT of every unit-test file under `tests/` (the *Tests.ts spec set).
 * Rebuild with `audit-framework/tools/build-standalone-verifier.mjs <package> --tests`.
 *
 * Linked modules: 23
 */
'use strict';

var __nodeTest = require('node:test');
function __mochaCtx() {
  return { timeout: function () {}, slow: function () {}, retries: function () {} };
}
function __wrap(fn) {
  if (typeof fn !== 'function') return fn;
  return function () { return fn.call(__mochaCtx()); };
}
function __bind(name) {
  var orig = __nodeTest[name];
  var bound = function (desc, fn) { return orig(desc, __wrap(fn)); };
  // carry .skip / .only / .todo through so a suite can still disable a case
  for (var k in orig) { if (typeof orig[k] === 'function') bound[k] = orig[k]; }
  bound.skip = orig.skip; bound.only = orig.only; bound.todo = orig.todo;
  return bound;
}
// HOOKS NEED THE SHIM TOO, and leaving them out is not a cosmetic miss. mines' QA-01 suite calls
// this.timeout(600_000) inside a before(...) hook for a million-round replay. Unwrapped, that hook
// threw, Node cancelled every test in the suite, and the run reported "38 pass, 0 fail" while
// SEVEN tests had silently never executed — a green result over a hole. Caught 2026-09-11 by the
// unit-count parity check (mocha 45 vs standalone 38), which is the entire reason that check exists.
function __bindHook(name) {
  var orig = __nodeTest[name];
  return function (fn) { return orig(__wrap(fn)); };
}
globalThis.describe   = __bind('describe');
globalThis.it         = __bind('it');
globalThis.before     = __bindHook('before');
globalThis.after      = __bindHook('after');
globalThis.beforeEach = __bindHook('beforeEach');
globalThis.afterEach  = __bindHook('afterEach');


var __PF_ROOT__ = __dirname;
var __nodeRequire = require;
var __modules = {
  "src/chart.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * The RTP-convergence chart, as a pure function of the convergence series.
 *
 * WHY IT IS ITS OWN MODULE. `outputs/rtp-convergence.html` is the twin output
 * of the same `npm run simulate` that writes `outputs/simulation-results.json`, and it is quoted in
 * the report as a picture of that series. Rendered by a private function inside `src/simulate.ts`,
 * nothing could check that the committed chart is the chart of the committed series — the two
 * could drift apart silently, and a reader looking at the picture would be looking at a different
 * run than the one Steps 16–17 score. It lives here so
 * `tests/dice/artifactTests.ts` can re-render from the committed JSON and assert byte identity,
 * which is a stronger statement than the SHA pin: the pin says the file has not changed, this says
 * the file IS this data.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderConvergenceChart = renderConvergenceChart;
function renderConvergenceChart(rtp) {
    const pts = rtp.points;
    const W = 900, H = 420, ml = 70, mr = 30, mt = 30, mb = 50;
    const iw = W - ml - mr, ih = H - mt - mb;
    const xs = pts.map(p => Math.log10(p.n));
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const ymin = 0.95, ymax = 1.05;
    const X = (n) => ml + (Math.log10(n) - xmin) / (xmax - xmin) * iw;
    const Y = (v) => mt + (ymax - v) / (ymax - ymin) * ih;
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.n).toFixed(1)},${Y(p.rtp).toFixed(1)}`).join(' ');
    const bandTop = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.n).toFixed(1)},${Y(Math.min(ymax, p.rtp + 5 * p.se)).toFixed(1)}`).join(' ');
    const bandBot = pts.slice().reverse().map((p) => `L${X(p.n).toFixed(1)},${Y(Math.max(ymin, p.rtp - 5 * p.se)).toFixed(1)}`).join(' ');
    const theoY = Y(rtp.theoreticalRTP);
    const xticks = pts.map(p => `<text x="${X(p.n).toFixed(1)}" y="${H - mb + 18}" font-size="11" text-anchor="middle" fill="#666">${p.n >= 1e6 ? p.n / 1e6 + 'M' : p.n >= 1e3 ? p.n / 1e3 + 'k' : p.n}</text>`).join('');
    const yticks = [0.95, 0.97, 0.99, 1.01, 1.03, 1.05].map(v => `<line x1="${ml}" y1="${Y(v).toFixed(1)}" x2="${W - mr}" y2="${Y(v).toFixed(1)}" stroke="#eee"/><text x="${ml - 8}" y="${(Y(v) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="#666">${(v * 100).toFixed(0)}%</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="system-ui,sans-serif">
<rect width="${W}" height="${H}" fill="#fff"/>${yticks}${xticks}
<path d="${bandTop} ${bandBot} Z" fill="#3b82f6" opacity="0.12"/>
<line x1="${ml}" y1="${theoY.toFixed(1)}" x2="${W - mr}" y2="${theoY.toFixed(1)}" stroke="#16a34a" stroke-dasharray="5,4" stroke-width="1.5"/>
<text x="${W - mr}" y="${(theoY - 6).toFixed(1)}" font-size="11" text-anchor="end" fill="#16a34a">theoretical RTP ${(rtp.theoreticalRTP * 100).toFixed(2)}%</text>
<path d="${line}" fill="none" stroke="#1e3a8a" stroke-width="2"/>
<text x="${ml}" y="18" font-size="13" font-weight="600" fill="#111">Dice RTP convergence — under 50 (1.98×), ±5·SE band (SE = σ/√n)</text>
<text x="${(ml + iw / 2).toFixed(0)}" y="${H - 8}" font-size="11" text-anchor="middle" fill="#666">bets (log scale)</text>
</svg>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>Dice RTP convergence</title></head><body style="margin:24px;font-family:system-ui">${svg}</body></html>`;
}

  },
  "src/config.js": function (module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYOUT_NUMERATOR = exports.SIM_RTP_STRATEGY = exports.SIM_EDGE_BANDS = exports.SIM_MASTER_SEED = exports.SIMULATION_HTML_SHA256 = exports.SIMULATION_SHA256 = exports.SIM_PASS2_ALPHA = exports.SIM_PASS2_EARLY_WINDOW = exports.EXPECTED_PHASE_BETS = exports.EXPECTED_EPOCH_SIZE = exports.EXPECTED_SEEDS = exports.EXPECTED_BETS = exports.VERDICT_QUALIFIER = exports.AUDIT_ID = exports.DATASET_SHA256 = exports.ALPHA_SCREEN = exports.ALPHA_SCREENS = exports.ALPHA = exports.SIM_PASS2_NONCES = exports.SIM_CHERRY_SEED_ALPHA = exports.SIM_CHERRY_WINDOW = exports.SIM_CHERRY_BINS = exports.SIM_RTP_MARKS = exports.SIM_RTP_BETS = exports.SIM_EDGE_BETS = exports.SIM_SERIAL_DRAWS = exports.SIM_UNIFORMITY_DRAWS = exports.MAX_ODDS = exports.MIN_ODDS = exports.HOUSE_EDGE = exports.SCALE = exports.CURSOR = exports.RANGE = void 0;
exports.bandKey = bandKey;
exports.continuousWinChancePct = continuousWinChancePct;
exports.payoutBasisPoints = payoutBasisPoints;
exports.quotedMultiplier = quotedMultiplier;
exports.discreteWinCount = discreteWinCount;
exports.discreteWinProbability = discreteWinProbability;
exports.diceWin = diceWin;
exports.effectiveEdge = effectiveEdge;
exports.effectiveEdgeIsExact = effectiveEdgeIsExact;
exports.theoreticalRTP = theoreticalRTP;
exports.servedReturnSign = servedReturnSign;
exports.servedRollMatches = servedRollMatches;
exports.round8 = round8;
exports.creditResidualSign = creditResidualSign;
exports.creditResidual = creditResidual;
exports.settledCreditUnits = settledCreditUnits;
exports.settledCredit = settledCredit;
exports.isSettlementTie = isSettlementTie;
exports.bandMode = bandMode;
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
exports.RANGE = 10000; // integer draw domain 0..9999
exports.CURSOR = 0; // fixed HMAC cursor for the single dice draw
exports.SCALE = 100; // roll = draw / 100  → 2 decimals, ceiling 99.99
exports.HOUSE_EDGE = 0.01;
exports.MIN_ODDS = 1.0102;
exports.MAX_ODDS = 9900; // live-witnessed ceiling (a 9900x bet settled), NOT the config field's 99
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
/** Pass-2 cherry-pick screen geometry: one window is SIM_CHERRY_WINDOW draws over SIM_CHERRY_BINS bins. */
exports.SIM_CHERRY_BINS = 20;
exports.SIM_CHERRY_WINDOW = 50;
/** Nominal per-window screening threshold. The ACHIEVED rate is derived in src/exact-chi2.ts. */
exports.SIM_CHERRY_SEED_ALPHA = 0.05;
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
exports.DATASET_SHA256 = 'ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34';
/**
 * ProvablyFair.org audit identifier — assigned, PROVISIONAL. Single-sourced here so the emitted
 * `outputs/verification-results.json` carries the same ID the report chapters print (README.md,
 * MANIFEST.md), and DICE-28's "the audit ID is assigned" is machine-checkable rather than prose
 * only. `LQ` = LIQD; `04` = the fourth LIQD audit (blackjack, mines, plinko preceded it). The
 * qualifier stays `provisional` because every bet was captured against the pre-production
 * environment (`qa.liqd.com`) before public launch — production parity is not established by this
 * capture and is not claimed. It is NOT upgraded to a final ID here: that is a publication act.
 */
exports.AUDIT_ID = 'PF-2026-LQ04';
exports.VERDICT_QUALIFIER = 'provisional';
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
exports.EXPECTED_BETS = 6700;
exports.EXPECTED_SEEDS = 134;
exports.EXPECTED_EPOCH_SIZE = 50;
/** Bets per capture phase. The plan, in code — not `meta.phases`, which is inside the evidence. */
exports.EXPECTED_PHASE_BETS = { A: 5000, B: 1000, C: 200, D: 500 };
/**
 * Pass-2 served-band return scan (DICE-21), completing the SIM_PASS2_* set whose design is documented
 * above. The early window IS the captured served depth per epoch, and the level IS the suite's single
 * ALPHA — both single-sourced here so the producer (src/simulate.ts) and the verifier
 * (tests/steps/simulation.ts) cannot drift.
 */
exports.SIM_PASS2_EARLY_WINDOW = exports.EXPECTED_EPOCH_SIZE; // 50 — the captured served depth per epoch
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
exports.SIMULATION_SHA256 = '8576e0a88526da4a0131afbc4e2de9bf0b52380432ee8b08f7863552b9ad3bbc';
exports.SIMULATION_HTML_SHA256 = '5cbdf7027ad7132b858c6a9e47b2f80354689fae63370d641973fba7e277e67d';
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
 * `basisPoints` anywhere (grep the dataset — it is absent), and this is `Math.round(winChance% ×
 * 100)`, the win chance re-expressed in hundredths of a percent. The evidence for the form is that
 * the served `multiplier` equals `9900/basisPoints` bit-for-bit on all 2,807 captured wins while the
 * float closed form `(100/wc)·(1−edge)` matches only 1,719 of them — so the quotient, not the closed
 * form, is what the server computes. Wherever the report calls the multiplier "the operator's
 * bit-exact 9900/basisPoints value", that is what it means, and every such site now says so.
 */
exports.PAYOUT_NUMERATOR = (1 - exports.HOUSE_EDGE) * 10000; // exactly 9900 at a 1% edge
function payoutBasisPoints(p) {
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
function quotedMultiplier(p) {
    const wc = continuousWinChancePct(p);
    return wc > 0 ? (100 / wc) * (1 - exports.HOUSE_EDGE) : 0;
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
 * Win rule applied to a served roll — HALF-OPEN band [lower, upper), honouring `inverted`.
 * Boundary semantics pinned by operator-verifier probes with the roll exactly on each
 * bound (E13): roll == lower wins, roll == upper loses; inverted is the exact complement.
 */
function diceWin(roll, p) {
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
 * every band under the half-open rule. A 50-nonce window can therefore land EXACTLY on its
 * expectation (49.5 against 49.5), and the two binary64 accumulations then disagree in the last
 * bits (49.5 against 49.500000000000014), so a float `<` counts an exact tie as "below". The
 * capture has such windows; comparing the floats misclassified them.
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
/** Round to 8 decimal places (nearest; strips IEEE-754 dust from an already-8-dp value). */
function round8(x) {
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
const UNITS_PER_WHOLE = 100000000n; // 1e8 — the settlement grid
const HALF_UNIT = 50000000n; // 0.5 · 1e8, the exact half-even tie point
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
 * `String(x)` is the shortest decimal that round-trips to this binary64, which for every money field
 * in this capture is the decimal the operator wrote (`0.1`, `19.8`, `0.10717766`). That decimal — not
 * the binary64 that approximates it — is what the operator's ledger holds. A string input is taken
 * verbatim, so a capture that preserves the raw JSON text needs no round-trip at all.
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
/** The credit in exact integer 1e-8 units — the form with no rounding ambiguity at all. */
function settledCreditUnits(stake, multiplier) {
    const stakeUnits = BigInt(Math.round(stake * 1e8));
    const multUnits = BigInt(Math.round(multiplier * 1e8)); // stage 1: ROUND_8(multiplier)
    const product = stakeUnits * multUnits; // in 1e-16 units
    let q = product / UNITS_PER_WHOLE;
    const r = product % UNITS_PER_WHOLE;
    if (r > HALF_UNIT)
        q += 1n;
    else if (r === HALF_UNIT && (q % 2n) === 1n)
        q += 1n; // exact tie → round to even
    return q;
}
function settledCredit(stake, multiplier) {
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
function isSettlementTie(stake, multiplier) {
    const product = BigInt(Math.round(stake * 1e8)) * BigInt(Math.round(multiplier * 1e8));
    return product % UNITS_PER_WHOLE === HALF_UNIT;
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
 * pass. That is not hypothetical: a reviewer executed exactly that on Node 24 — fail, then pass,
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
 * resampled on every run, so the SAME 134 revealed seeds yield a different flag count from one
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
  "src/rng.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * PROVENANCE (header added on integration, 20 Oct 2026; everything below this comment is the
 * clean-room module byte for byte).
 *
 * This module was REBUILT FROM A WRITTEN SPECIFICATION, not ported from LIQD's code:
 *   spec      docs/ALGORITHM.md, a copy of games/liqd-dice/ALGORITHM.md in the ProvablyFair.org audit
 *             framework (SHA-256 212674d0…a80593e2). Written from LIQD's public pages and screens, the
 *             standard provably-fair construction, LIQD's verify-endpoint replies (E13) and the 6,700
 *             live bets, without opening LIQD's code or any port of it (its §8 lists every file read).
 *   rebuild   written by an implementer who read ONLY that spec and a module-interface file, and
 *             never opened LIQD's code, its client bundle, or this package's earlier src/rng.ts.
 *   self-test tests/dice/rngSpecTests.ts (the spec's vectors and properties).
 *
 * LIQD's own verifier is NOT the source of this module. Its replies are run as a SECOND CHECK: the
 * E13 verify-endpoint replies and the session-recorded verify vectors in tests/dice/rngTests.ts.
 * The audit's draw-bias bound is src/bias.ts, built on this module's maxFairFor.
 *
 * Units: diceRoll returns the roll as an INTEGER in hundredths (0..9999); callers divide by
 * SCALE (src/config.ts) for the 0.00..99.99 value LIQD serves. Server seeds must be lowercase hex
 * (the commitment is over the seed text); every captured seed is.
 *
 * Three-way agreement measured on integration (20 Oct 2026, all 6,700 captured bets): this module vs
 * the live bets, roll 6,700/6,700 and commitment 134/134 seed records (bets paired to seeds by
 * hashing, 6,700/6,700); vs LIQD's verify endpoint, E13 7/7 probe replies and 1/1 settled-bet
 * cross-check, session-recorded vectors 8/8; vs the ProvablyFair.org site verifier's dice module
 * (its source, run from a local checkout; the deployed page was not run) 6,700/6,700 draws. Step 5 of
 * `npm run verify` re-measures the first on every run.
 *
 * Where this module and the earlier ported module differ on inputs no captured bet reaches: when all
 * eight chunks of a digest are rejected (spec O2, continuation unspecified) this module throws,
 * while the earlier module, and the site verifier, moved to cursor + 1,000,000. 0 of the 6,700
 * captured draws had even its first chunk rejected (L11).
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
  "src/runtime.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * The SUPPORTED RUNTIME, declared in code and enforced before any scored step runs.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────────────────────────
 * A reviewer extracted the pristine package twice. On Node v22.23.1 it returned 21/21 Full Pass. On
 * a Node 24 release it FAILED, because one probability differed by a single ULP.
 *
 * WHICH PROBABILITY. The field the reviewer reported is
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
 * failing run is the reviewer's report, not our observation: our record of it names v24.13.1, the
 * reviewer has since also cited a different Node 24 patch release, and this package deliberately
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAMILY_WISE_BOUND = exports.STEP_16_BOUND = exports.SCORED_STATISTICAL_PREDICATES = exports.RECONSTRUCTION_MAX_WINS = exports.RECONSTRUCTION_MAX_RESIDUAL = exports.SIM_SCHEMA_VERSION = void 0;
exports.reconstructReturn = reconstructReturn;
exports.reconstructionTolerance = reconstructionTolerance;
exports.recoverWinCount = recoverWinCount;
exports.convergenceSE = convergenceSE;
exports.validateConvergenceSeries = validateConvergenceSeries;
exports.runsStatistic = runsStatistic;
/** The schema `src/simulate.ts` emits. Artifacts without the field are schema 1 (historical). */
exports.SIM_SCHEMA_VERSION = 2;
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
exports.SCORED_STATISTICAL_PREDICATES = [
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
exports.STEP_16_BOUND = 0.01 + 9 * 5.733e-7 + 5.733e-7;
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
// Types mirror the exact capture schema in data/dice-master-6700bets.json
// (liqd-dice-capture-v1). Field names match the dataset verbatim.
Object.defineProperty(exports, "__esModule", { value: true });

  },
  "tests/__standalone-entry.js": function (module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./dice/artifactTests");
require("./dice/captureRetryTests");
require("./dice/clientSeedTests");
require("./dice/commitmentTests");
require("./dice/exactNullTests");
require("./dice/rngSpecTests");
require("./dice/rngTests");
require("./dice/runtimeTests");
require("./dice/settlementTests");
require("./dice/simChecksTests");
require("./dice/statsTests");

  },
  "tests/dice/artifactTests.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Artifacts of record — the committed files this audit's verdict is computed from.
 *
 * WHY. A `npm test` that ran `npm run simulate` and then scored the file it had just written would
 * make `outputs/simulation-results.json` whatever the last run happened to produce, pinned by
 * nothing. It is pinned in `src/config.ts` and scored by Step 19; these tests assert the same pins
 * at the mocha layer, so a mismatch surfaces before the verifier runs.
 *
 * The chart test is deliberately stronger than a hash. `outputs/rtp-convergence.html` is the twin of
 * the JSON's convergence series and is what a reader looks at; a hash proves only that the file has
 * not changed. Re-rendering it from the committed series and asserting byte identity proves the
 * picture IS the data — the two cannot drift apart while both are committed.
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
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const node_crypto_1 = require("node:crypto");
const config_1 = require("../../src/config");
const chart_1 = require("../../src/chart");
const REPO = path.join(__dirname, '../..');
const sha = (p) => (0, node_crypto_1.createHash)('sha256').update(fs.readFileSync(p)).digest('hex');
const SIM_JSON = path.join(REPO, 'outputs/simulation-results.json');
const SIM_HTML = path.join(REPO, 'outputs/rtp-convergence.html');
const DATASET = path.join(REPO, 'data/dice-master-6700bets.json');
describe('LIQD Dice artifacts of record', () => {
    it('data/dice-master-6700bets.json hash matches DATASET_SHA256', () => {
        assert.strictEqual(sha(DATASET), config_1.DATASET_SHA256);
    });
    it('outputs/simulation-results.json hash matches SIMULATION_SHA256', () => {
        assert.strictEqual(sha(SIM_JSON), config_1.SIMULATION_SHA256, 'the committed simulation is not the pinned one — re-pin in src/config.ts if the regeneration was deliberate');
    });
    it('outputs/rtp-convergence.html hash matches SIMULATION_HTML_SHA256', () => {
        assert.strictEqual(sha(SIM_HTML), config_1.SIMULATION_HTML_SHA256);
    });
    it('the committed chart IS the committed convergence series, byte for byte', () => {
        const sim = JSON.parse(fs.readFileSync(SIM_JSON, 'utf8'));
        const rendered = (0, chart_1.renderConvergenceChart)(sim.pass1.rtpConvergence);
        assert.strictEqual(rendered, fs.readFileSync(SIM_HTML, 'utf8'), 'the chart and the JSON come from different simulation runs');
    });
    it('the dataset carries the audited population (G-BIND, constants not header fields)', () => {
        // The same binding Steps 11/12 enforce, asserted here too so a shrunken-and-re-pinned dataset
        // fails at the mocha layer as well. The counts come from src/config.ts; `meta` is reconciled
        // against them, never read as the plan.
        const ds = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
        assert.strictEqual(ds.bets.length, config_1.EXPECTED_BETS);
        assert.strictEqual(ds.seeds.length, config_1.EXPECTED_SEEDS);
        const perEpoch = new Map();
        for (const b of ds.bets)
            perEpoch.set(b.epoch, (perEpoch.get(b.epoch) ?? 0) + 1);
        assert.strictEqual(perEpoch.size, config_1.EXPECTED_SEEDS);
        for (const [e, n] of perEpoch)
            assert.strictEqual(n, config_1.EXPECTED_EPOCH_SIZE, `epoch ${e}`);
        const byPhase = {};
        for (const b of ds.bets)
            byPhase[b.phase] = (byPhase[b.phase] ?? 0) + 1;
        assert.deepStrictEqual(byPhase, { ...config_1.EXPECTED_PHASE_BETS });
        assert.strictEqual(ds.meta.plannedTotal, config_1.EXPECTED_BETS);
        assert.strictEqual(ds.meta.epochSize, config_1.EXPECTED_EPOCH_SIZE);
    });
});

  },
  "tests/dice/captureRetryTests.js": function (module, exports, require, __filename, __dirname) {
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
/**
 * Local transport simulations; these tests never contact the casino.
 *
 * They test capture/bet-operation.reference.mjs, a reference record that the capture of record did
 * not use (see that file's header). Passing them says nothing about how
 * data/dice-master-6700bets.json was collected.
 */
const assert = __importStar(require("node:assert"));
const { createBetOperation, isRetryable } = require('../../capture/bet-operation.reference.mjs');
describe('capture request retries', () => {
    it('replays the same logical bet after a timeout following settlement', async () => {
        const ledger = new Map();
        const keys = [];
        let generated = 0;
        let requests = 0;
        const operation = createBetOperation({
            params: { lower: 0, upper: 50, inverted: false }, amount: 0.1,
            newKey: () => `request-${++generated}`,
            place: async (_params, _amount, key) => {
                keys.push(key);
                if (!ledger.has(key))
                    ledger.set(key, { betId: ledger.size + 1 });
                if (++requests === 1)
                    throw Object.assign(new Error('response lost after settlement'), { kind: 'TRANSIENT' });
                return ledger.get(key);
            },
        });
        await assert.rejects(operation(), /response lost/);
        assert.deepStrictEqual(await operation(), { betId: 1 });
        assert.deepStrictEqual(keys, ['request-1', 'request-1']);
        assert.strictEqual(ledger.size, 1);
        assert.strictEqual(generated, 1);
    });
    it('allocates a different identity for the next logical bet', async () => {
        let generated = 0;
        const options = {
            params: { lower: 0, upper: 50, inverted: false }, amount: 0.1,
            newKey: () => `request-${++generated}`,
            place: async (_params, _amount, key) => key,
        };
        const first = createBetOperation(options), second = createBetOperation(options);
        assert.strictEqual(await first(), 'request-1');
        assert.strictEqual(await second(), 'request-2');
        assert.strictEqual(await first(), 'request-1');
    });
    it('keeps the submitted parameters stable when the caller edits its plan', async () => {
        const params = { lower: 0, upper: 50, inverted: false };
        const operation = createBetOperation({ params, amount: 0.1, newKey: () => 'key',
            place: async (p, amount) => ({ params: p, amount }),
        });
        params.upper = 99;
        const submitted = await operation();
        assert.deepStrictEqual(submitted, { params: { lower: 0, upper: 50, inverted: false }, amount: 0.1 });
        assert.ok(Object.isFrozen(submitted.params));
    });
    it('retries transient errors and stops on schema, API, authentication or unknown errors', () => {
        assert.strictEqual(isRetryable({ kind: 'TRANSIENT' }), true);
        for (const error of [{ kind: 'SCHEMA' }, { kind: 'API' }, { kind: 'AUTH' }, new Error('unknown'), null]) {
            assert.strictEqual(isRetryable(error), false);
        }
    });
});

  },
  "tests/dice/clientSeedTests.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Client-seed selection ordering, with controlled dependencies — `capture/client-seed.reference.mjs`.
 *
 * ── WHY ────────────────────────────────────────────────────────────────────────────────────────
 * The 2026-08-27 capture built Phase D's client seeds as `pfaudit-${STAMP}-${epoch}` from one
 * process-start timestamp, so the next nine were fully determined by any one of them. The audit
 * leaned on those bets for the claim that the operator cannot pre-evaluate candidate server seeds
 * against a client seed it does not know. A predictable value submitted after a commitment does not
 * deliver that: whoever chooses future server seeds already knows the client seed.
 *
 * The properties asserted here are the ones the claim needs — and they are asserted by INJECTING
 * the randomness source and observing the call order, because "the code looks like it does this"
 * is not evidence that it does.
 *
 *   1. no client seed exists before the commitment has been received and recorded;
 *   2. the CSPRNG is called once per epoch, after that check, with fresh material each time;
 *   3. no client seed is constructed solely from a timestamp or a counter;
 *   4. the commitment that preceded each choice is recorded.
 *
 * WHAT THIS DOES NOT ESTABLISH — and neither does any test in this file — is that the commitment
 * was PUBLISHED before the choice in any sense a third party could check. What is recorded is the
 * auditor's own account of the auditor's own ordering. Independent authentication of the commitment
 * chronology needs a witness outside the capture; it is listed as future evidence, not claimed here.
 * A statistical test of a handful of client seeds would not prove unpredictability either, so there
 * is deliberately no such test below.
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
const assert = __importStar(require("node:assert"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClientSeedChooser } = require('../../capture/client-seed.reference.mjs');
const COMMITMENT_A = 'a'.repeat(64);
const COMMITMENT_B = 'b'.repeat(64);
/** A randomness source that records every call and returns distinct, non-repeating material. */
function trackedRandom(log) {
    let calls = 0;
    return (n) => {
        calls++;
        log.push(`randomBytes(${n})#${calls}`);
        return { toString: () => String(calls).padStart(n * 2, '0') };
    };
}
describe('client-seed selection ordering (D5)', () => {
    it('REFUSES to generate before the commitment has been received', () => {
        const log = [];
        const chooser = createClientSeedChooser({ randomBytes: trackedRandom(log) });
        for (const commitment of [undefined, null, '', 'not-a-hash', 'a'.repeat(63), 'A'.repeat(64)]) {
            assert.throws(() => chooser.chooseAfterCommitment({ epoch: 3, tag: 'pfaudit', commitment }), /refusing to generate before the server commitment/, `commitment ${JSON.stringify(commitment)} must be refused`);
        }
        assert.deepStrictEqual(log, [], 'the CSPRNG must not be touched when the commitment is missing');
        assert.strictEqual(chooser.record.length, 0);
    });
    it('the commitment check happens BEFORE the CSPRNG call, per epoch', () => {
        const log = [];
        const chooser = createClientSeedChooser({
            randomBytes: (n) => { log.push('random'); return { toString: () => 'ab'.repeat(n) }; },
        });
        // A failed attempt, then a successful one: the ordering shows in the log.
        assert.throws(() => chooser.chooseAfterCommitment({ epoch: 0, tag: 'audit', commitment: null }));
        log.push('commitment-received');
        chooser.chooseAfterCommitment({ epoch: 0, tag: 'audit', commitment: COMMITMENT_A });
        assert.deepStrictEqual(log, ['commitment-received', 'random'], 'randomness must be drawn only after the commitment is in hand');
    });
    it('calls the generator exactly once per epoch, with fresh material each time', () => {
        const log = [];
        const chooser = createClientSeedChooser({ randomBytes: trackedRandom(log) });
        const seeds = [0, 1, 2, 3, 4].map((epoch) => chooser.chooseAfterCommitment({ epoch, tag: 'pfaudit', commitment: COMMITMENT_A }).clientSeed);
        assert.strictEqual(log.length, 5, 'one CSPRNG call per epoch, no more and no fewer');
        assert.strictEqual(new Set(seeds).size, 5, 'every epoch gets distinct material');
        assert.deepStrictEqual(log, [1, 2, 3, 4, 5].map((i) => `randomBytes(16)#${i}`));
    });
    it('no client seed is a function of the timestamp and epoch alone', () => {
        // The exact failure mode: same clock, same epoch sequence, two runs. Under a
        // `pfaudit-${STAMP}-${E}` scheme these two arrays are identical.
        const frozenClock = () => '2026-09-10T00:00:00.000Z';
        const run = () => {
            let calls = 0;
            const chooser = createClientSeedChooser({
                randomBytes: (n) => { calls++; return { toString: () => `${calls}${Math.random()}`.padEnd(n * 2, '0').slice(0, n * 2) }; },
                now: frozenClock,
            });
            return [0, 1, 2].map((epoch) => chooser.chooseAfterCommitment({ epoch, tag: 'pfaudit', commitment: COMMITMENT_A }).clientSeed);
        };
        const a = run(), b = run();
        a.forEach((seed, i) => assert.notStrictEqual(seed, b[i], `epoch ${i}: a frozen clock and a fixed epoch must NOT reproduce the client seed`));
        // …and the seed carries at least 128 bits of fresh material beyond its label.
        a.forEach((seed) => assert.ok(seed.split('-').pop().length >= 32, `too little entropy in ${seed}`));
    });
    it('records which commitment preceded each choice', () => {
        const chooser = createClientSeedChooser({ randomBytes: trackedRandom([]) });
        chooser.chooseAfterCommitment({ epoch: 7, tag: 'audit', commitment: COMMITMENT_A, commitmentSource: 'provably-fair/active' });
        chooser.chooseAfterCommitment({ epoch: 8, tag: 'audit', commitment: COMMITMENT_B, commitmentSource: 'provably-fair/rotate' });
        assert.deepStrictEqual(chooser.record.map((r) => [r.epoch, r.precededByCommitment, r.commitmentSource]), [
            [7, COMMITMENT_A, 'provably-fair/active'],
            [8, COMMITMENT_B, 'provably-fair/rotate'],
        ]);
        assert.ok(chooser.record.every((r) => r.entropySource === 'csprng'));
    });
    it('the label may keep an epoch prefix — the unpredictable part is separate', () => {
        const chooser = createClientSeedChooser({ randomBytes: trackedRandom([]) });
        const { clientSeed } = chooser.chooseAfterCommitment({ epoch: 124, tag: 'pfaudit', commitment: COMMITMENT_A });
        assert.ok(clientSeed.startsWith('pfaudit-124-'), clientSeed);
        assert.notStrictEqual(clientSeed, 'pfaudit-124');
    });
    it('rejects a configuration with too little entropy, rather than accepting it quietly', () => {
        assert.throws(() => createClientSeedChooser({ randomBytes: trackedRandom([]), entropyBytes: 4 }), /at least 16/);
        assert.throws(() => createClientSeedChooser({}), /randomBytes is required/);
    });
    it('the HISTORICAL dataset is unchanged — its Phase-D seeds still show the defect', () => {
        // The correction is documentary for the shipped capture. Do not "fix" the artifact of record.
        const ds = require('../../data/dice-master-6700bets.json');
        const phaseD = ds.bets.filter((b) => b.phase === 'D');
        assert.strictEqual(phaseD.length, 500);
        assert.ok(phaseD.every((b) => /^pfaudit-\d+-\d+$/.test(b.clientSeed)), 'the historical Phase-D client seeds must be preserved exactly as captured');
        // …and they really are predictable from one another: same stamp, consecutive epoch index.
        const stamps = new Set(phaseD.map((b) => b.clientSeed.split('-')[1]));
        assert.strictEqual(stamps.size, 1, 'one process-start stamp across all of Phase D — this is the defect, recorded');
    });
});

  },
  "tests/dice/commitmentTests.js": function (module, exports, require, __filename, __dirname) {
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
const assert = __importStar(require("node:assert"));
const commitment_1 = require("../steps/commitment");
const dataset = require('../../data/dice-master-6700bets.json');
function checkPreCapture(preCapture) {
    const seedMap = new Map(dataset.seeds.map(s => [s.hashedServerSeed, s.serverSeed]));
    const byHash = new Map(dataset.seeds.map(s => [s.hashedServerSeed,
        dataset.bets.filter(b => b.hashedServerSeed === s.hashedServerSeed)]));
    const ctx = {
        bets: dataset.bets, seeds: dataset.seeds, seedMap, byHash,
        meta: { ...dataset.meta, preCapture },
    };
    const saved = console.log;
    try {
        console.log = () => { };
        return (0, commitment_1.run)(ctx).find(result => result.step === 2);
    }
    finally {
        console.log = saved;
    }
}
describe('pre-capture commitment evidence', () => {
    it('accepts the recorded hash and link to epoch zero', () => {
        assert.strictEqual(checkPreCapture(dataset.meta.preCapture).status, 'PASS');
    });
    it('fails when the record or a required field is absent', () => {
        const pre = dataset.meta.preCapture;
        for (const missing of [undefined, null, {},
            { ...pre, hashedServerSeed: null }, { ...pre, revealedServerSeed: null },
            { ...pre, nextHashedServerSeed: null }]) {
            assert.strictEqual(checkPreCapture(missing).status, 'FAIL');
        }
    });
    it('fails when the revealed seed or epoch-zero link is changed', () => {
        const pre = dataset.meta.preCapture;
        assert.strictEqual(checkPreCapture({ ...pre, revealedServerSeed: '0'.repeat(64) }).status, 'FAIL');
        assert.strictEqual(checkPreCapture({ ...pre, nextHashedServerSeed: '0'.repeat(64) }).status, 'FAIL');
    });
});

  },
  "tests/dice/exactNullTests.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * The exact discrete null behind Pass 2 (src/exact-chi2.ts), and its INDEPENDENT re-derivation.
 *
 * WHY IT IS EXACT. Scoring each epoch against a 10,000-replicate parametric bootstrap redrawn on
 * every run makes the flag count itself random: the same 134 seeds produce 9, 10 or 11 flags, and
 * at 11 the verifier's binomial tail crosses its threshold, so a clean `npm test` fails Step 17
 * about 6% of the time and additionally prints "DISAGREES with recomputation (tampered?)" because
 * the producer's self-report was written under a different draw of the same null.
 *
 * The statistic is discrete, so the null needs no sampling at all. `src/exact-chi2.ts` enumerates
 * every partition of 50 into at most 20 parts and accumulates exact BigInt assignment counts. The
 * test below re-derives the SAME distribution by a completely different route — a dynamic program
 * that splits one bin at a time with a Binomial(j, 1/b) weight, in doubles from end to end — and
 * requires the two to agree. Two derivations, one distribution: the shape of check that catches a
 * producer/verifier split.
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
const assert = __importStar(require("node:assert"));
const exact_chi2_1 = require("../../src/exact-chi2");
const config_1 = require("../../src/config");
const N = config_1.SIM_CHERRY_WINDOW;
const B = config_1.SIM_CHERRY_BINS;
/** Independent derivation: distribution of Σh² by a per-bin binomial-split DP, doubles only. */
function dpDistribution(n, b) {
    const C = [];
    for (let i = 0; i <= n; i++) {
        const row = new Float64Array(n + 1);
        row[0] = 1;
        for (let k = 1; k <= i; k++)
            row[k] = C[i - 1][k - 1] + (k <= i - 1 ? C[i - 1][k] : 0);
        C.push(row);
    }
    let layer = [];
    for (let j = 0; j <= n; j++) {
        const a = new Float64Array(j * j + 1);
        a[j * j] = 1;
        layer.push(a);
    }
    for (let bins = 2; bins <= b; bins++) {
        const next = [];
        for (let j = 0; j <= n; j++) {
            const out = new Float64Array(j * j + 1);
            const p = 1 / bins;
            for (let h = 0; h <= j; h++) {
                const w = C[j][h] * Math.pow(p, h) * Math.pow(1 - p, j - h);
                if (w === 0)
                    continue;
                const prev = layer[j - h], shift = h * h;
                for (let s = 0; s < prev.length; s++)
                    if (prev[s] !== 0)
                        out[s + shift] += w * prev[s];
            }
            next.push(out);
        }
        layer = next;
    }
    return layer[n];
}
describe('LIQD Dice — exact Pass-2 null', () => {
    const nul = (0, exact_chi2_1.exactNull)();
    it('enumerates every partition of 50 into at most 20 parts', () => {
        assert.strictEqual(nul.partitions, 181274);
    });
    it('the statistic has 832 attainable values, spanning the equidistributed and degenerate extremes', () => {
        assert.strictEqual(nul.support.length, 832);
        assert.strictEqual(nul.support[0], 130); // 10 bins of 3 + 10 of 2
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
            if (rel > maxRel)
                maxRel = rel;
        }
        assert.ok(maxRel < 1e-12, `max relative difference ${maxRel}`);
        // and nothing OUTSIDE the enumerated support carries mass
        const support = new Set(nul.support);
        for (let s = 0; s < dp.length; s++)
            if (!support.has(s))
                assert.strictEqual(dp[s], 0, `s=${s}`);
    });
    it('upper tails are monotone and end at the point mass of the extreme', () => {
        for (let i = 1; i < nul.support.length; i++) {
            assert.ok(nul.upperTail[i] <= nul.upperTail[i - 1], `tail not monotone at ${nul.support[i]}`);
        }
        assert.ok(Math.abs(nul.upperTail[0] - 1) < 1e-12);
        assert.strictEqual(nul.upperTail[nul.upperTail.length - 1], nul.probability[nul.probability.length - 1]);
        // a value above the maximum has zero tail; the minimum has the whole mass
        assert.strictEqual((0, exact_chi2_1.upperTailBySquareSum)(N * N + 1), 0);
        assert.ok(Math.abs((0, exact_chi2_1.upperTailBySquareSum)(0) - 1) < 1e-12);
    });
    it('the ACHIEVED per-window rejection is 0.0459237601, not the nominal 0.05', () => {
        // The discreteness is the whole point: P(p-value < 0.05) is the mass of the smallest
        // attainable tail strictly below 0.05, and there is no attainable tail AT 0.05.
        const a = (0, exact_chi2_1.achievedSeedAlpha)();
        assert.ok(a < config_1.SIM_CHERRY_SEED_ALPHA, 'achieved rate must be below the nominal one');
        assert.strictEqual(a.toFixed(10), '0.0459237601');
        // it is attained at χ² = 30.8 (square sum 202)
        assert.strictEqual((0, exact_chi2_1.upperTailBySquareSum)(202), a);
        assert.strictEqual((0, exact_chi2_1.chi2FromSquareSum)(202), 30.8);
        // the next ATTAINABLE value below it must not reject — that is what makes 0.0459… the
        // achieved rate rather than an arbitrary number below 0.05
        const idx = nul.support.indexOf(202);
        assert.ok(idx > 0);
        assert.ok(nul.upperTail[idx - 1] >= config_1.SIM_CHERRY_SEED_ALPHA, `tail at the next attainable value ${nul.support[idx - 1]} is ${nul.upperTail[idx - 1]}, which would also reject`);
    });
    it('the compound flag rate is a·(1 − a) = 0.0438147684', () => {
        const a = (0, exact_chi2_1.achievedSeedAlpha)();
        assert.strictEqual((0, exact_chi2_1.cherryFlagRate)(), a * (1 - a));
        assert.strictEqual((0, exact_chi2_1.cherryFlagRate)().toFixed(10), '0.0438147684');
    });
    it('squareSum bins the window exactly as χ² = (Σh² − n²/B)/(n/B)', () => {
        const per = config_1.RANGE / B;
        // one draw in every bin, 50 draws over 20 bins: 10 bins of 3, 10 of 2 is the minimum;
        // build a concrete window and check both the sum and the affine χ² map.
        const draws = [];
        for (let i = 0; i < N; i++)
            draws.push(Math.floor((i % B) * per));
        const h = new Array(B).fill(0);
        for (const d of draws)
            h[Math.min(B - 1, Math.floor(d / per))]++;
        const bySum = h.reduce((a, v) => a + v * v, 0);
        assert.strictEqual((0, exact_chi2_1.squareSum)(draws), bySum);
        const e = N / B;
        const byDefinition = h.reduce((a, v) => a + (v - e) ** 2 / e, 0);
        assert.ok(Math.abs((0, exact_chi2_1.chi2FromSquareSum)(bySum) - byDefinition) < 1e-9);
    });
    it('all 50 draws in one bin is the maximum statistic and has the smallest possible tail', () => {
        const draws = new Array(N).fill(0);
        assert.strictEqual((0, exact_chi2_1.squareSum)(draws), N * N);
        assert.strictEqual((0, exact_chi2_1.upperTailBySquareSum)(N * N), nul.probability[nul.probability.length - 1]);
    });
});

  },
  "tests/dice/rngSpecTests.js": function (module, exports, require, __filename, __dirname) {
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
/**
 * Spec self-test: docs/ALGORITHM.md vectors and properties, run against src/rng.ts.
 *
 * Written by the clean-room implementer together with src/rng.ts, from docs/ALGORITHM.md and the module
 * interface alone (never from LIQD's code). Integrated 20 Oct 2026: the checks are unchanged; only the
 * import path, the mocha wrapper and the reporting (failures collected instead of printed) were adapted.
 */
const assert = __importStar(require("assert"));
// Self-test for rng.ts against the worked vectors in ALGORITHM.md §5 plus
// properties. Win rule and payout (§3) are not part of rng.ts; they are
// re-derived here only so each vector is checked input -> every output.
const crypto_1 = require("crypto");
const rng_1 = require("../../src/rng");
const EXPECTED_CHECKS = 84;
function runSelftest() {
    let pass = 0;
    let total = 0;
    const failed = [];
    function check(name, ok, detail = "") {
        total++;
        if (ok)
            pass++;
        if (!ok)
            failed.push(`${name}${detail ? "  (" + detail + ")" : ""}`);
    }
    function throws(fn) {
        try {
            fn();
            return false;
        }
        catch {
            return true;
        }
    }
    // --- exact decimal helpers (§1.1 hundredths, §3.3 1e-8 grid) -------------
    function toUnits(dec, places) {
        const [i, f = ""] = dec.split(".");
        if (f.length > places)
            throw new Error(`too many decimals: ${dec}`);
        return BigInt(i) * 10n ** BigInt(places) + BigInt((f + "0".repeat(places)).slice(0, places));
    }
    function fmt(units, places) {
        const s = units.toString().padStart(places + 1, "0");
        const out = `${s.slice(0, -places)}.${s.slice(-places)}`.replace(/0+$/, "").replace(/\.$/, "");
        return out;
    }
    // §3.1
    function winAndWidth(roll, lower, upper, inverted) {
        const L = Number(toUnits(lower, 2));
        const U = Number(toUnits(upper, 2));
        const inBand = L <= roll && roll < U;
        return inverted ? { win: !inBand, width: 10000 - (U - L) } : { win: inBand, width: U - L };
    }
    // §3.3 stage 1: 9900/width rounded to nearest at 8 decimals (half-up on a tie, O3)
    function m8Units(width) {
        const num = 9900n * 10n ** 8n;
        const w = BigInt(width);
        let q = num / w;
        const r = num % w;
        if (2n * r >= w)
            q += 1n;
        return q;
    }
    // §3.3 stage 2: amount x m8 at 1e-16, half-even to 1e-8
    function stage2(amount, m8) {
        const raw = toUnits(amount, 8) * m8; // scale 1e-16
        const base = 10n ** 8n;
        let q = raw / base;
        const r = raw % base;
        if (2n * r > base || (2n * r === base && q % 2n === 1n))
            q += 1n;
        return { raw, won: q };
    }
    const V = [
        { id: "V1", seed: "015307d5a3f62db476210c3797bac8b7", commit: "918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8",
            client: "auditf2456fc140ac", nonce: 0, lower: "0", upper: "92.37", inverted: false, amount: "0.1",
            hmac: "475461d14638cca3e385e940e763bf808fa6ef6c05f1a83c333dc25e586c5b6e", u32: 1196712401, roll: 2401, win: true, width: 9237,
            mult: 1.071776550828191, m8: "1.07177655", raw: "0.107177655", won: "0.10717766" },
        { id: "V2", seed: "36a8d90f5e7cd710ae29bfc89eb709c7", commit: "11ff13d04fe380139447a5c1643da301ee883ee6e3e10e11b0b5f56189c651f9",
            client: "audit4195522a3970", nonce: 47, lower: "99", upper: "100", inverted: false, amount: "0.1",
            hmac: "bd93f34cf8d0aef107a4d487d17b8fd5373d9599badd953830bddccece381674", u32: 3180589900, roll: 9900, win: true, width: 100,
            mult: 99, won: "9.9" },
        { id: "V3", seed: "015307d5a3f62db476210c3797bac8b7", commit: "918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8",
            client: "auditf2456fc140ac", nonce: 18, lower: "10.22", upper: "66.49", inverted: false, amount: "0.1",
            hmac: "4d760f8d17c14858f9b7fe6568156de067a40dbffb23c68d5743767c5eb1ce1d", u32: 1299582861, roll: 2861, win: true, width: 5627,
            mult: 1.759374444641905, m8: "1.75937444", raw: "0.175937444", won: "0.17593744" },
        { id: "V4", seed: "015307d5a3f62db476210c3797bac8b7", commit: "918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8",
            client: "auditf2456fc140ac", nonce: 41, lower: "46.27", upper: "56.35", inverted: true, amount: "0.1",
            hmac: "cab70be16f56a77447dd92143b4a3f1e81609922136bc8781b491589383a53f9", u32: 3400993761, roll: 3761, win: true, width: 8992,
            mult: 1.1009786476868328, m8: "1.10097865", raw: "0.110097865", won: "0.11009786" },
        { id: "V5", seed: "bfde02800431d623efda4473c8966a25", commit: "a315d0f959b19e8a2762fa90abde4b94c1915528e296d92a85b5db2921cf8ffa",
            client: "audit085813da8559", nonce: 0, lower: "50", upper: "100", inverted: false, amount: "10",
            hmac: "7abf491376aafaeb9efd6de1ed3651eef9c2a91eed254d1f780152c41a31fa3d", u32: 2059356435, roll: 6435, win: true, width: 5000,
            mult: 1.98, won: "19.8" },
    ];
    for (const v of V) {
        check(`${v.id} commitHash`, (0, rng_1.commitHash)(v.seed) === v.commit);
        const salt = (0, rng_1.getProvablyFairHmacSalt)(v.client, v.nonce, 0);
        check(`${v.id} message`, salt === `${v.client}:${v.nonce}:0`, salt);
        const digest = (0, crypto_1.createHmac)("sha256", Buffer.from(v.seed, "hex")).update(Buffer.from(salt, "utf8")).digest();
        check(`${v.id} HMAC`, digest.toString("hex") === v.hmac);
        check(`${v.id} u32`, digest.readUInt32BE(0) === v.u32, String(digest.readUInt32BE(0)));
        const roll = (0, rng_1.diceRoll)(v.seed, v.client, v.nonce);
        check(`${v.id} diceRoll`, roll === v.roll, String(roll));
        check(`${v.id} generateProvablyFairNumber`, (0, rng_1.generateProvablyFairNumber)(v.seed, v.client, v.nonce, 0, 10000) === v.roll);
        const ww = winAndWidth(roll, v.lower, v.upper, v.inverted);
        check(`${v.id} win`, ww.win === v.win);
        check(`${v.id} width`, ww.width === v.width, String(ww.width));
        check(`${v.id} multiplier double`, 9900 / ww.width === v.mult, String(9900 / ww.width));
        const m8 = m8Units(ww.width);
        if (v.m8)
            check(`${v.id} m8`, fmt(m8, 8) === v.m8, fmt(m8, 8));
        const s2 = stage2(v.amount, m8);
        if (v.raw)
            check(`${v.id} amount x m8`, fmt(s2.raw, 16) === v.raw, fmt(s2.raw, 16));
        check(`${v.id} amount_won`, fmt(s2.won, 8) === v.won, fmt(s2.won, 8));
    }
    // V6: LIQD verify endpoint roll
    check("V6 diceRoll nonce 1000", (0, rng_1.diceRoll)("015307d5a3f62db476210c3797bac8b7", "auditf2456fc140ac", 1000) === 361);
    check("V6 display 3.61", ((0, rng_1.diceRoll)("015307d5a3f62db476210c3797bac8b7", "auditf2456fc140ac", 1000) / 100).toFixed(2) === "3.61");
    // §3.1 half-open probes from the spec (roll 361)
    check("probe [0,3.61) loss", winAndWidth(361, "0", "3.61", false).win === false);
    check("probe [3.61,10) win", winAndWidth(361, "3.61", "10", false).win === true);
    check("probe inverted [0.5,3.61] win", winAndWidth(361, "0.5", "3.61", true).win === true);
    check("probe inverted [3.61,10] loss", winAndWidth(361, "3.61", "10", true).win === false);
    check("probe [3.61,100] win", winAndWidth(361, "3.61", "100", false).win === true);
    check("probe widths 362/639/9689/9639 multipliers", 9900 / winAndWidth(361, "0", "3.62", false).width === 27.34806629834254 &&
        9900 / 639 === 15.492957746478874 && 9900 / 9689 === 1.0217772731964083 && 9900 / 9639 === 1.0270774976657329);
    // --- properties ----------------------------------------------------------
    const seed1 = V[0].seed;
    check("hash check true", (0, rng_1.commitHash)(seed1) === V[0].commit);
    check("hash check false (seed off by one char)", (0, rng_1.commitHash)(seed1.slice(0, -1) + "6") !== V[0].commit);
    check("hash check false (decoded bytes instead of ASCII)", (0, rng_1.sha256Buffer)(Buffer.from(seed1, "hex")) !== V[0].commit);
    check("sha256Buffer empty", (0, rng_1.sha256Buffer)(Buffer.alloc(0)) === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    check("maxFairFor(10000) = 4294960000", (0, rng_1.maxFairFor)(10000) === 4294960000);
    check("maxFairFor(1) = 2^32", (0, rng_1.maxFairFor)(1) === 2 ** 32);
    check("maxFairFor(2^32) = 2^32", (0, rng_1.maxFairFor)(2 ** 32) === 2 ** 32);
    check("maxFairFor(3) multiple of 3, gap < 3", (0, rng_1.maxFairFor)(3) % 3 === 0 && 2 ** 32 - (0, rng_1.maxFairFor)(3) < 3);
    // Bias report (§2 Step 2): rejected mass and plain-mod deviation
    const rejected = 2 ** 32 - (0, rng_1.maxFairFor)(10000);
    check("rejected window = 7296", rejected === 7296);
    check("rejection probability = 7296/2^32 ~ 1.7e-6", Math.abs(rejected / 2 ** 32 - 1.7e-6) < 0.05e-6, (rejected / 2 ** 32).toExponential(3));
    const hi = Math.floor(2 ** 32 / 10000) + 1, lo = Math.floor(2 ** 32 / 10000);
    check("plain-mod counts 429497 x 7296 + 429496 x 2704 = 2^32", hi === 429497 && lo === 429496 && hi * 7296 + lo * 2704 === 2 ** 32);
    check("plain-mod per-outcome deviation <= 2^-32", Math.abs(hi / 2 ** 32 - 1e-4) <= 2 ** -32 && Math.abs(lo / 2 ** 32 - 1e-4) <= 2 ** -32);
    let inRange = true;
    let minR = Infinity, maxR = -Infinity;
    for (let n = 0; n < 20000; n++) {
        const r = (0, rng_1.diceRoll)(seed1, "auditf2456fc140ac", n);
        if (!Number.isInteger(r) || r < 0 || r > 9999)
            inRange = false;
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
    }
    check("diceRoll integer in 0..9999 over 20000 nonces", inRange, `min ${minR} max ${maxR}`);
    let genOk = true;
    for (const range of [1, 2, 37, 10000, 2 ** 31, 2 ** 32]) {
        for (let n = 0; n < 200; n++) {
            const r = (0, rng_1.generateProvablyFairNumber)(seed1, "x", n, 3, range);
            if (!Number.isInteger(r) || r < 0 || r >= range)
                genOk = false;
        }
    }
    check("generateProvablyFairNumber in [0, range) for ranges 1..2^32", genOk);
    check("salt cursor format", (0, rng_1.getProvablyFairHmacSalt)("pfaudit-1787856766341-124", 12, 1) === "pfaudit-1787856766341-124:12:1");
    check("throws: uppercase seed", throws(() => (0, rng_1.diceRoll)(seed1.toUpperCase(), "c", 0)));
    check("throws: odd-length seed", throws(() => (0, rng_1.commitHash)("abc")));
    check("throws: negative nonce", throws(() => (0, rng_1.diceRoll)(seed1, "c", -1)));
    check("throws: range 0", throws(() => (0, rng_1.maxFairFor)(0)));
    check("throws: range > 2^32", throws(() => (0, rng_1.maxFairFor)(2 ** 32 + 1)));
    return { pass, total, failed };
}
describe("LIQD Dice RNG, spec self-test (docs/ALGORITHM.md)", () => {
    it(`passes all ${EXPECTED_CHECKS} spec vector and property checks`, () => {
        const r = runSelftest();
        assert.deepStrictEqual(r.failed, []);
        assert.strictEqual(r.total, EXPECTED_CHECKS);
        assert.strictEqual(r.pass, EXPECTED_CHECKS);
    });
});

  },
  "tests/dice/rngTests.js": function (module, exports, require, __filename, __dirname) {
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
const assert = __importStar(require("node:assert"));
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
describe('LIQD Dice RNG', () => {
    // SECOND CHECK, not the source: src/rng.ts was rebuilt from docs/ALGORITHM.md (its own spec vectors
    // are tests/dice/rngSpecTests.ts). diceRoll returns integer hundredths, so rolls are compared as
    // diceRoll / SCALE. Vectors derived during the 2026-08-27 live session from the operator's
    // /api/v1/originals/dice/verify endpoint (read-only). Raw request/response pairs
    // were not retained, so these are session-recorded values, not a shipped capture;
    // the audit's named RNG anchor is the 6,700 settled rolls (Step 5).
    const S = '00112233445566778899aabbccddeeff';
    const C = 'audittest';
    const serverVectors = [
        [0, 93.22], [1, 0.79], [2, 81.91], [3, 97.36],
        [4, 90.34], [5, 64.99], [6, 9.48], [7, 93.41],
    ];
    it('reproduces the operator verify endpoint byte-for-byte (8 vectors)', () => {
        for (const [nonce, roll] of serverVectors) {
            assert.ok(Math.abs((0, rng_1.diceRoll)(S, C, nonce) / config_1.SCALE - roll) < 1e-9, `nonce ${nonce}: ${(0, rng_1.diceRoll)(S, C, nonce) / config_1.SCALE} != ${roll}`);
        }
    });
    it('draws are integers in [0, 10000)', () => {
        for (const [nonce] of serverVectors) {
            const draw = (0, rng_1.generateProvablyFairNumber)(S, C, nonce, config_1.CURSOR, config_1.RANGE);
            assert.ok(Number.isInteger(draw) && draw >= 0 && draw < config_1.RANGE);
        }
    });
    it('recomputes a real captured winning bet from its revealed seed', () => {
        const serverSeed = '015307d5a3f62db476210c3797bac8b7';
        const clientSeed = 'auditf2456fc140ac';
        const nonce = 0;
        const params = { lower: 0, upper: 92.37, inverted: false };
        const roll = (0, rng_1.diceRoll)(serverSeed, clientSeed, nonce) / config_1.SCALE;
        assert.ok(Math.abs(roll - 24.01) < 1e-9, `roll ${roll}`);
        assert.strictEqual((0, config_1.diceWin)(roll, params), true);
        // multiplier and credit
        const mult = (0, config_1.quotedMultiplier)(params);
        assert.ok(Math.abs(mult - 1.071776550828191) < 1e-9, `mult ${mult}`);
        // The settled credit, exact to the 1e-8 unit — a `< 1e-6` tolerance here let a fixture off by
        // 66 units (0.10717700) pass.
        assert.strictEqual((0, config_1.settledCredit)(0.1, mult), 0.10717766);
    });
    it('commitment hash = SHA-256(utf8(serverSeed hex string))', () => {
        assert.strictEqual((0, rng_1.commitHash)('015307d5a3f62db476210c3797bac8b7'), '918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8');
    });
    it('client seed is load-bearing — a different client seed changes the roll', () => {
        assert.notStrictEqual((0, rng_1.diceRoll)(S, C, 0), (0, rng_1.diceRoll)(S, C + 'x', 0));
    });
});
describe('LIQD Dice game math', () => {
    it('multiplier = 99 / continuousWinChance (1% edge)', () => {
        assert.ok(Math.abs((0, config_1.quotedMultiplier)({ lower: 0, upper: 50, inverted: false }) - 1.98) < 1e-12);
        assert.ok(Math.abs((0, config_1.quotedMultiplier)({ lower: 99, upper: 100, inverted: false }) - 99) < 1e-9); // 99× = a 1% band (top of capture; live-witnessed maxOdds 9900×)
        assert.ok(Math.abs((0, config_1.quotedMultiplier)({ lower: 0, upper: 10, inverted: false }) - 9.9) < 1e-12);
        // The 9900× extreme (live-witnessed maxOdds, E14/F-LIMITS): a width-0.01 band = 0.01% win chance =
        // a single grid point, priced at 9900×. Under the half-open rule it wins on exactly 1/10,000,
        // so effective edge is exactly 1.00% (99% RTP) — NOT the 198% an inclusive-both-ends rule
        // would pay. These pin the extreme without a settled bet at it (see E14 / recommendations A2b).
        assert.ok(Math.abs((0, config_1.quotedMultiplier)({ lower: 0, upper: 0.01, inverted: false }) - 9900) < 1e-6);
        assert.strictEqual((0, config_1.discreteWinCount)({ lower: 0, upper: 0.01, inverted: false }), 1);
        assert.ok(Math.abs((0, config_1.effectiveEdge)({ lower: 0, upper: 0.01, inverted: false }) - 0.01) < 1e-12);
    });
    it('win rule is HALF-OPEN [lower, upper) and honours inverted', () => {
        const p = { lower: 25, upper: 75, inverted: false };
        assert.strictEqual((0, config_1.diceWin)(25, p), true); // lower inclusive
        assert.strictEqual((0, config_1.diceWin)(75, p), false); // upper EXCLUSIVE (E13 probe)
        assert.strictEqual((0, config_1.diceWin)(74.99, p), true);
        assert.strictEqual((0, config_1.diceWin)(24.99, p), false);
        assert.strictEqual((0, config_1.diceWin)(75, { ...p, inverted: true }), true); // complement gains the upper point
        assert.strictEqual((0, config_1.diceWin)(25, { ...p, inverted: true }), false); // complement loses the lower point
    });
    it('boundary semantics match the operator verifier probes of record (E13)', () => {
        // evidence/E13-verify-endpoint-boundary-probes.json — roll 3.61 exactly,
        // seed 015307d5a3f62db476210c3797bac8b7 / auditf2456fc140ac / nonce 1000.
        const r = (0, rng_1.diceRoll)('015307d5a3f62db476210c3797bac8b7', 'auditf2456fc140ac', 1000) / config_1.SCALE;
        assert.ok(Math.abs(r - 3.61) < 1e-9, `probe roll ${r}`);
        const probes = [
            [{ lower: 0, upper: 3.61, inverted: false }, false], // roll == upper -> LOSS
            [{ lower: 0, upper: 3.62, inverted: false }, true],
            [{ lower: 3.61, upper: 10, inverted: false }, true], // roll == lower -> WIN
            [{ lower: 3.62, upper: 10, inverted: false }, false],
            [{ lower: 0.5, upper: 3.61, inverted: true }, true], // inverted wins the excluded upper
            [{ lower: 3.61, upper: 10, inverted: true }, false], // inverted loses the included lower
            [{ lower: 3.61, upper: 100, inverted: false }, true],
        ];
        for (const [p, win] of probes) {
            assert.strictEqual((0, config_1.diceWin)(r, p), win, JSON.stringify(p));
        }
    });
    it('E13 discriminates half-open from inclusive-both-ends on exactly 2 of its 7 probes', () => {
        // HOW MUCH EVIDENCE E13 ACTUALLY IS. The evidence file concludes "All seven
        // probes are consistent with it and inconsistent with inclusive-both-ends." That is false, and
        // it overstates the only external evidence the flat-1% headline has. Five probes return the same
        // verdict under BOTH candidate rules — they are controls, not discriminators. Only the two that
        // put the roll exactly ON AN UPPER BOUND can tell the rules apart:
        //   probe 1  [0, 3.61)   roll 3.61  non-inverted  — half-open LOSES, inclusive WINS
        //   probe 5  [0.5, 3.61] roll 3.61  inverted      — half-open WINS, inclusive LOSES
        // `roll == lower` cannot discriminate: the lower bound is inclusive in both rules.
        // This test asserts the count, so the claim in the chapters is enforced rather than asserted.
        const r = 3.61;
        const probeParams = [
            { lower: 0, upper: 3.61, inverted: false },
            { lower: 0, upper: 3.62, inverted: false },
            { lower: 3.61, upper: 10, inverted: false },
            { lower: 3.62, upper: 10, inverted: false },
            { lower: 0.5, upper: 3.61, inverted: true },
            { lower: 3.61, upper: 10, inverted: true },
            { lower: 3.61, upper: 100, inverted: false },
        ];
        const inclusiveBothEnds = (roll, p) => {
            const inBand = roll >= p.lower && roll <= p.upper;
            return p.inverted ? !inBand : inBand;
        };
        const discriminating = probeParams.filter((p) => (0, config_1.diceWin)(r, p) !== inclusiveBothEnds(r, p));
        assert.strictEqual(probeParams.length, 7, 'E13 has 7 probes');
        assert.strictEqual(discriminating.length, 2, `expected 2 discriminating probes, got ${discriminating.length}: ${JSON.stringify(discriminating)}`);
        assert.deepStrictEqual(discriminating, [
            { lower: 0, upper: 3.61, inverted: false },
            { lower: 0.5, upper: 3.61, inverted: true },
        ]);
    });
    it('mode classification', () => {
        assert.strictEqual((0, config_1.bandMode)({ lower: 0, upper: 50, inverted: false }), 'under');
        assert.strictEqual((0, config_1.bandMode)({ lower: 50, upper: 100, inverted: false }), 'over');
        assert.strictEqual((0, config_1.bandMode)({ lower: 25, upper: 75, inverted: false }), 'inside');
        assert.strictEqual((0, config_1.bandMode)({ lower: 25, upper: 75, inverted: true }), 'outside');
    });
    it('discrete win chance equals the continuous width in every mode (half-open rule)', () => {
        const under50 = { lower: 0, upper: 50, inverted: false };
        const over50 = { lower: 50, upper: 100, inverted: false };
        const outside = { lower: 25, upper: 75, inverted: true };
        // half-open: every band wins on exactly 100·W of the 10,000 points — no fencepost
        assert.ok(Math.abs((0, config_1.discreteWinProbability)(under50) - 0.5) < 1e-12);
        assert.ok(Math.abs((0, config_1.discreteWinProbability)(over50) - 0.5) < 1e-12);
        assert.ok(Math.abs((0, config_1.discreteWinProbability)(outside) - 0.5) < 1e-12);
        assert.ok(Math.abs((0, config_1.effectiveEdge)(under50) - 0.01) < 1e-12);
        assert.ok(Math.abs((0, config_1.effectiveEdge)(over50) - 0.01) < 1e-12);
    });
    it('continuous win chance', () => {
        assert.strictEqual((0, config_1.continuousWinChancePct)({ lower: 0, upper: 30, inverted: false }), 30);
        assert.strictEqual((0, config_1.continuousWinChancePct)({ lower: 20, upper: 80, inverted: true }), 40);
    });
    // ── Regression guard for the ceil/floor float bug ────────────────────────────
    // Scaling band bounds with Math.ceil/Math.floor does not work: IEEE-754 puts
    // many 2-dp products just off the integer (1.1·100 = 110.00000000000001), so the
    // count lands one grid point away on 403 of 5,304 distinct captured bands. A
    // suite using only integer bounds (0/50/100), where x·100 is float-exact,
    // cannot tell the bug from the fix. These fractional-bound vectors trip
    // the float trap directly: under ceil/floor scaling every marked band fails the
    // enumeration cross-check below.
    const fractionalBands = [
        { lower: 0, upper: 39.3, inverted: false }, // 39.3·100 = 3930.0000000000005
        { lower: 10.22, upper: 66.49, inverted: false }, // both bounds off-integer
        { lower: 4.9, upper: 55.39, inverted: true },
        { lower: 38.65, upper: 73.46, inverted: true },
        { lower: 32.09, upper: 97.35, inverted: false },
        { lower: 32.13, upper: 100, inverted: false }, // over: exactly 100·W points
        { lower: 40.09, upper: 47.72, inverted: false },
        { lower: 0, upper: 1.12, inverted: false }, // smallest captured under band
    ];
    it('discreteWinCount matches literal grid enumeration on fractional bounds', () => {
        for (const p of fractionalBands) {
            let c = 0;
            for (let d = 0; d < config_1.RANGE; d++)
                if ((0, config_1.diceWin)(d / config_1.SCALE, p))
                    c++;
            assert.strictEqual((0, config_1.discreteWinCount)(p), c, JSON.stringify(p));
        }
    });
    it('closed-form edge is exactly 1.00% for every band in every mode', () => {
        // Half-open rule: winning points = 100·W exactly, so edge = 1 − (W/100)·(99/W) = 1%.
        // Under an inclusive-both-ends rule these same bands range
        // 0.116%–1.020% — this test pins the flat law the E13 probes establish.
        // ASSERTED IN EXACT INTEGERS: the float form is not equal to 0.01, it is
        // near it, and how near depends on the band — see the next test.
        for (const p of fractionalBands) {
            assert.ok((0, config_1.effectiveEdgeIsExact)(p), `${JSON.stringify(p)}: integer edge identity fails`);
        }
        // Because every band's expected return per bet is EXACTLY 0.99, a 50-nonce window can land
        // exactly on its expectation, and the Step 17 direction split must then say "equal". 25 wins of
        // `under 50` (1.98×) is 49.5 against 49.5 — the float sums give 49.49999999999998 against
        // 49.500000000000014 and would call it "below". servedReturnSign decides it in exact rationals.
        const u50 = { lower: 0, upper: 50, inverted: false };
        const window = (wins) => Array.from({ length: 50 }, (_, i) => ({ band: u50, won: i < wins }));
        assert.strictEqual((0, config_1.servedReturnSign)(window(25)), 0);
        assert.strictEqual((0, config_1.servedReturnSign)(window(24)), -1);
        assert.strictEqual((0, config_1.servedReturnSign)(window(26)), 1);
    });
    it('the float edge form departs from 0.01 by up to 5.06e-13 — half the old 1e-12 threshold', () => {
        // WHY THE IDENTITY IS INTEGRAL. A Step 15 written as |edge − 0.01| < 1e-12, with the width
        // justified as ~150x the arithmetic noise from the 6.3e-15 worst case ACROSS THE
        // CAPTURE, rests on a capture that does not contain the worst case. `continuousWinChancePct`
        // subtracts in binary64, so `100 − 99.99` is 0.010000000000005116 and the `over 99.99` band —
        // the 9900x extreme E14 recommends probing next — departs by 5.063813951489138e-13. That
        // threshold is 1.97x its own noise floor. This test pins the number so nobody re-derives a
        // float tolerance from the capture.
        const extreme = { lower: 99.99, upper: 100, inverted: false };
        const departure = Math.abs((0, config_1.effectiveEdge)(extreme) - 0.01);
        assert.strictEqual(departure, 5.063813951489138e-13);
        assert.ok(departure > 1e-12 / 2, 'the old 1e-12 threshold was under 2x this departure');
        assert.ok((0, config_1.effectiveEdgeIsExact)(extreme), 'the integer identity holds where the float one strains');
    });
    it('the integer edge identity holds over 59,998 bands across all four modes', () => {
        // Coverage for the identity itself: every 2-dp bound in the under / over / inside / outside
        // families, including the 9900x and 1.0102x extremes the capture never reached.
        let checked = 0;
        for (let lo = 0; lo < config_1.RANGE; lo++) {
            const fams = [
                { lower: lo / 100, upper: 100, inverted: false },
                { lower: lo / 100, upper: 100, inverted: true },
                { lower: 0, upper: (lo + 1) / 100, inverted: false },
                { lower: 0, upper: (lo + 1) / 100, inverted: true },
                { lower: lo / 100, upper: Math.min(100, (lo + 1) / 100 + 25), inverted: false },
                { lower: lo / 100, upper: Math.min(100, (lo + 1) / 100 + 25), inverted: true },
            ];
            for (const p of fams) {
                if ((0, config_1.continuousWinChancePct)(p) <= 0)
                    continue;
                assert.ok((0, config_1.effectiveEdgeIsExact)(p), `${JSON.stringify(p)}`);
                checked++;
            }
        }
        assert.strictEqual(checked, 59998);
    });
    it('non-2dp band bounds are rejected, not silently rounded', () => {
        assert.throws(() => (0, config_1.discreteWinCount)({ lower: 0, upper: 39.301, inverted: false }), /non-2dp band bound/);
    });
    // ── Rejection guard, force-exercised ────────────────────────────────────────
    // Zero of the 6,700 captured bets land a first HMAC chunk in the rejected tail
    // (P ≈ 1.7e-6 per draw), so without these vectors the guard is untested code. These
    // nonces were found by scanning the audit seed pair: each digest's FIRST
    // uint32 chunk is >= maxFair = 4,294,960,000, so a correct implementation must
    // skip it and take the SECOND chunk. An implementation without the guard
    // (plain modulo on chunk 0) produces a different roll for every one of these.
    // This covers the REFERENCE guard only — whether the operator's server
    // implements rejection is unobservable from the capture (see the scope note
    // in MANIFEST.md#game-and-algorithm, L11).
    it('rejection guard fires: first chunk >= maxFair is skipped, second chunk taken', () => {
        const rejectionVectors = [
            { nonce: 1520921, chunk0: 4294961212, roll: 45.60 },
            { nonce: 2388818, chunk0: 4294966436, roll: 35.84 },
            { nonce: 3289857, chunk0: 4294966973, roll: 18.16 },
        ];
        const seed = '00112233445566778899aabbccddeeff'; // audit seed pair, as in the RNG vectors above
        const clientSeed = 'audittest';
        const maxFair = Math.floor(4294967296 / config_1.RANGE) * config_1.RANGE;
        for (const v of rejectionVectors) {
            assert.ok(v.chunk0 >= maxFair, `vector precondition: chunk0 ${v.chunk0} in rejected tail`);
            const unguarded = (v.chunk0 % config_1.RANGE) / config_1.SCALE; // what a guardless implementation returns
            const roll = (0, rng_1.diceRoll)(seed, clientSeed, v.nonce) / config_1.SCALE;
            assert.ok(Math.abs(roll - v.roll) < 1e-9, `nonce ${v.nonce}: roll ${roll} != ${v.roll}`);
            assert.notStrictEqual(roll, unguarded, `nonce ${v.nonce}: guard did not fire`);
        }
    });
});

  },
  "tests/dice/runtimeTests.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * The supported runtime is declared, and this is where a reviewer finds out about it early.
 *
 * ── WHY ────────────────────────────────────────────────────────────────────────────────────────
 * The pristine package passes on Node v22.23.1 and FAILS on Node 24 — one probability differing by
 * a single ULP. The field is `cherryPickPower.pAtMinRejectable` in `outputs/report-figures.json`, a
 * binomial tail built from the `**` operator, not a chi-squared p-value; `**`, `Math.exp` and
 * `Math.log` are all implementation-approximated in ECMAScript, and this suite compares integers
 * exactly and libm-dependent floats at 1e-14 absolute + 1e-12 relative (src/diff.ts) on purpose.
 * Advertising "Node.js 20+" is therefore a claim the package cannot keep. The exact Node 24 patch release was never witnessed here, so the pin acts on the major.
 *
 * `src/runtime.ts` states the runtime that was actually validated and refuses to score on another
 * one. These tests assert the declaration is coherent and that the CURRENT runtime is a supported
 * one, so `npx mocha` says so plainly instead of surfacing it as an inscrutable statistical FAIL
 * thirty seconds into `npm run verify`.
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
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const runtime_1 = require("../../src/runtime");
describe('supported runtime', () => {
    it('this runtime is the one the package was validated on', () => {
        assert.strictEqual((0, runtime_1.isSupportedRuntime)(), true, (0, runtime_1.unsupportedRuntimeMessage)());
    });
    it('the declared runtime and package.json engines agree', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
        assert.strictEqual(pkg.engines?.node, `${runtime_1.SUPPORTED_NODE_MAJOR}.x`);
        assert.ok(runtime_1.VALIDATED_RUNTIME.includes(`v${runtime_1.SUPPORTED_NODE_MAJOR}.`), `VALIDATED_RUNTIME "${runtime_1.VALIDATED_RUNTIME}" is not a ${runtime_1.SUPPORTED_NODE_MAJOR}.x version`);
    });
    it('rejects the runtimes the package was NOT validated on', () => {
        assert.strictEqual((0, runtime_1.isSupportedRuntime)('24.13.1'), false, 'a Node 24 version string — the major the D1 failure was reported on');
        assert.strictEqual((0, runtime_1.isSupportedRuntime)('20.11.0'), false, 'the runtime the old README advertised');
        assert.strictEqual((0, runtime_1.isSupportedRuntime)('23.0.0'), false);
        assert.strictEqual((0, runtime_1.isSupportedRuntime)('22.0.0'), true);
        assert.strictEqual((0, runtime_1.nodeMajor)('24.13.1'), 24);
    });
    it('the refusal message names the runtime, the requirement and what to do', () => {
        const msg = (0, runtime_1.unsupportedRuntimeMessage)('24.13.1');
        assert.match(msg, /UNSUPPORTED RUNTIME/);
        assert.match(msg, /Running on\s+: Node v24\.13\.1/);
        assert.match(msg, /Supported\s+: Node 22\.x/);
        assert.match(msg, /Nothing was written; no evidence was touched/);
    });
});

  },
  "tests/dice/settlementTests.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Settlement arithmetic — the two-stage 8-dp rule, and the rounding ties that broke it.
 *
 * WHY IT IS INTEGER ARITHMETIC. Computing `settledCredit` as `stake × round8(m) × 1e8` in doubles
 * and calling a tie `|frac − 0.5| < 1e-6` does not survive contact with the real number system:
 * fuzzing 106,711 realistic (stake, band) pairs against an independent Python `decimal` reference
 * finds 7 mismatches — every one an exact half-even tie at a product magnitude ≥ 9e9 units, where
 * the double product no longer lands on .5 at all. The capture's own 274 ties sit near 1e7 units,
 * so the shipped verdict is not affected; a production capture at $2.50 / $25 stakes would raise
 * false FAILs on correct credits.
 *
 * The rule is therefore evaluated in exact integer (BigInt) units. Every case below is a case the
 * float rule gets wrong, or a case that pins the rounding MODE so a future "fix"
 * cannot quietly switch half-even for half-up.
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
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const config_1 = require("../../src/config");
describe('LIQD Dice settlement arithmetic', () => {
    // ── the three named regression cases ─────────────────────────────────────────
    // Expected values independently re-derived with Python's `decimal` module:
    //   (Decimal(str(stake)) * Decimal(9900/bp).quantize(1e-8, HALF_UP)).quantize(1e-8, HALF_EVEN)
    it('exact tie at 2.2e11 units rounds half-EVEN up — the case the float rule lost', () => {
        // scaled = 22297297297.5 exactly; as a double it materialises as 22297297297.499996,
        // which a `|frac − 0.5| < 1e-6` tie window does not recognise, so it rounds DOWN.
        assert.strictEqual((0, config_1.settledCredit)(2.5, 9900 / 111), 222.97297298);
        assert.strictEqual((0, config_1.settledCreditUnits)(2.5, 9900 / 111), 22297297298n);
    });
    it('exact tie rounds half-EVEN down when the quotient is already even', () => {
        assert.strictEqual((0, config_1.settledCredit)(0.1, 9900 / 5808), 0.17045454);
        assert.strictEqual((0, config_1.settledCreditUnits)(0.1, 9900 / 5808), 17045454n);
    });
    it('reproduces the report\'s worked example credit', () => {
        assert.strictEqual((0, config_1.settledCredit)(0.1, 9900 / 9237), 0.10717766);
    });
    it('the other six large-magnitude ties the float rule got wrong', () => {
        // Every one is an exact .5 tie at ≥ 9e9 units. Reference: Python decimal, HALF_EVEN.
        const cases = [
            [2.5, 177, 139.83050848],
            [2.5, 184, 134.51086958],
            [2.5, 186, 133.06451612],
            [2.5, 216, 114.58333332],
            [2.5, 244, 101.43442622],
            [2.5, 270, 91.66666668],
        ];
        for (const [stake, bp, expected] of cases) {
            assert.strictEqual((0, config_1.settledCredit)(stake, 9900 / bp), expected, `stake ${stake} bp ${bp}`);
        }
    });
    it('rounds to EVEN, not up, on a constructed tie in both directions', () => {
        // 0.5 × 1.00000001 = 0.500000005 → tie at 50000000.5 units, quotient 50000000 (even) → down.
        assert.strictEqual((0, config_1.settledCreditUnits)(0.5, 1.00000001), 50000000n);
        // 0.5 × 1.00000003 = 0.500000015 → tie at 50000001.5 units, quotient 50000001 (odd) → up.
        assert.strictEqual((0, config_1.settledCreditUnits)(0.5, 1.00000003), 50000002n);
    });
    it('a loss-sized and a whole-number credit are exact', () => {
        assert.strictEqual((0, config_1.settledCredit)(10, 1.98), 19.8);
        assert.strictEqual((0, config_1.settledCreditUnits)(10, 99), 99000000000n);
    });
    // ── the residual model — the operator's number system, not ours ──────────────
    it('a credit that IS the decimal product is reported as landing on the product', () => {
        // THE WITNESS. A `creditResidualSign` that takes the exact rational value of binary64(stake)
        // and binary64(multiplier) carries the representation error inside binary64(0.1) into the
        // comparison, and every win comes back "rounded". This bet is the counterexample that
        // settles it: bet vChEZ7Lu-yY1PMmq5fOz5, stake 0.1, band over 68.32
        // (basisPoints 3168 -> multiplier 9900/3168 = 3.125, dyadic and exact in binary64), credit
        // 0.3125. The exact decimal product is 1/10 x 25/8 = 5/16 = 0.3125 — the credit itself.
        const band = { lower: 68.32, upper: 100, inverted: false };
        assert.strictEqual((0, config_1.payoutBasisPoints)(band), 3168);
        assert.strictEqual(9900 / 3168, 3.125);
        // ...and here is the ULP gap the report must stop calling "bit-exact": the float closed form
        // returns 3.124999999999999 for the SAME band. Equal as rationals, one ULP apart as binary64.
        assert.strictEqual((0, config_1.quotedMultiplier)(band), 3.124999999999999);
        assert.strictEqual((0, config_1.creditResidualSign)(0.3125, 0.1, band), 0, 'nothing was rounded on this bet');
        assert.strictEqual((0, config_1.creditResidual)(0.3125, 0.1, band), 0);
        // The Phase-C worked example MANIFEST.md#verify-a-bet prints as exact: $10.00 x 1.98 = $19.80.
        const over50 = { lower: 50, upper: 100, inverted: false };
        assert.strictEqual((0, config_1.creditResidualSign)(19.8, 10, over50), 0);
        // And the model still SEES a real rounding when there is one: 0.1 x 9900/9237 credits
        // 0.10717766 against a product of 0.1071776550828…, i.e. the settlement rounded the player UP.
        const band9237 = { lower: 0, upper: 92.37, inverted: false };
        assert.strictEqual((0, config_1.payoutBasisPoints)(band9237), 9237);
        assert.strictEqual((0, config_1.creditResidualSign)(0.10717766, 0.1, band9237), 1);
    });
    // ── stage 1: is `round8` of the served multiplier itself tie-fragile? ─────────
    it('stage-1 has exact 8-dp ties at basisPoints 2048 and 6144, resolved half-UP (mode ASSUMED)', () => {
        // "There is no tie to lose there" is false. There are exactly two, both
        // inside the reachable range, and the audit has no evidence for the operator's stage-1 tie mode
        // because no captured bet touches either band. Stage 1 is half-UP (Math.round); stage 2 is
        // half-EVEN. At basisPoints 6144 the two modes give DIFFERENT answers, so the mode is
        // load-bearing rather than academic — recorded as an ASSUMED premise.
        const ties = [];
        for (let bp = 1; bp <= 9900; bp++) {
            const num = 9900n * 100000000n, b = BigInt(bp);
            if (2n * (num % b) === b)
                ties.push(bp); // 9900/bp * 1e8 has fractional part exactly .5
        }
        assert.deepStrictEqual(ties, [2048, 6144]);
        assert.strictEqual(9900 / 2048, 4.833984375);
        assert.strictEqual(9900 / 6144, 1.611328125);
        // Math.round is half-up: both go up.
        assert.strictEqual(Math.round((9900 / 2048) * 1e8), 483398438);
        assert.strictEqual(Math.round((9900 / 6144) * 1e8), 161132813);
        // Half-even would agree at 2048 (odd quotient rounds up anyway) and DISAGREE at 6144.
        const halfEven = (scaledTimesTwo) => {
            const q = scaledTimesTwo / 2n;
            return (q % 2n === 0n) ? q : q + 1n;
        };
        assert.strictEqual(halfEven(2n * 483398437n + 1n), 483398438n); // same as half-up
        assert.strictEqual(halfEven(2n * 161132812n + 1n), 161132812n); // differs from half-up
    });
    it('no captured bet lands on a stage-1 tie band, so the mode is unwitnessed', () => {
        const ds = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/dice-master-6700bets.json'), 'utf8'));
        const onTie = ds.bets.filter((b) => [2048, 6144].includes((0, config_1.payoutBasisPoints)(b.params)));
        assert.strictEqual(onTie.length, 0, 'a captured bet now lands on a stage-1 tie — the ASSUMED note in src/config.ts can be settled');
    });
    it('stage-1 round8(9900/bp) agrees with exact HALF-UP rounding on every reachable band', () => {
        // The served multiplier is 9900/basisPoints with basisPoints ∈ 1..9800 (maxOdds 9900× down to
        // minOdds 1.0102×). Stage 1 stays in doubles, so this sweep is what licenses that: for every
        // reachable band, Math.round(m·1e8) must equal the exact HALF-UP rounding of the binary64 value
        // of m. NOTE what this does and does not license: both sides are half-up, so
        // the ties found in the test above pass trivially and this sweep would look identical if the
        // operator rounded stage 1 half-EVEN. It licenses the DOUBLE arithmetic, not the tie MODE.
        // Exact reference without a decimal library: compare 2·(m·1e8) against 2·floor + 1 using the
        // exact numerator/denominator of the double.
        let checked = 0;
        for (let bp = 1; bp <= 9800; bp++) {
            const m = 9900 / bp;
            const scaledExact = exactTimes1e8(m); // exact rational value of m·1e8
            const jsRounded = BigInt(Math.round(m * 1e8));
            assert.strictEqual(jsRounded, roundHalfUp(scaledExact), `bp ${bp}`);
            checked++;
        }
        assert.strictEqual(checked, 9800);
    });
    it('round8 is idempotent on an already-8-dp value', () => {
        assert.strictEqual((0, config_1.round8)((0, config_1.round8)(9900 / 9237)), (0, config_1.round8)(9900 / 9237));
    });
    it('refuses to return a lossy double above 2^53 units, and stays exact in integer units', () => {
        // 9,898 x 9900 is about $98M — inside the operator's own stated limits and outside the range
        // where a credit in 1e-8 units survives a double. Silently rounding there would be the same
        // defect class the two-stage rule was rewritten to remove, so it throws instead.
        assert.throws(() => (0, config_1.settledCredit)(9898, 9900), /exceeds exact double range/);
        assert.strictEqual((0, config_1.settledCreditUnits)(9898, 9900), 9799020000000000n);
        // and the largest credit this capture actually contains is nowhere near it
        assert.strictEqual((0, config_1.settledCredit)(10, 99), 990);
    });
    it('the served-roll predicate is exact: off-grid, out-of-range and non-numeric are all rejected', () => {
        // Steps 4/5/6/13/14/18 all compare a served roll to a recomputed one through this one
        // predicate. It used to be |local − served| <= 1e-9, which admitted values that are not on
        // the 0.01 grid at all — the cases below are what an exact comparison buys.
        assert.strictEqual((0, config_1.servedRollMatches)(24.01, 24.01), true);
        assert.strictEqual((0, config_1.servedRollMatches)(0, 0), true);
        assert.strictEqual((0, config_1.servedRollMatches)(99.99, 99.99), true);
        assert.strictEqual((0, config_1.servedRollMatches)(24.010000001, 24.01), false, 'off-grid value must be rejected');
        assert.strictEqual((0, config_1.servedRollMatches)(24.01, 24.02), false);
        assert.strictEqual((0, config_1.servedRollMatches)(100, 100), false, 'above the roll ceiling');
        assert.strictEqual((0, config_1.servedRollMatches)(-0.01, -0.01), false, 'below the roll domain');
        assert.strictEqual((0, config_1.servedRollMatches)(NaN, 24.01), false);
        assert.strictEqual((0, config_1.servedRollMatches)(24.01, NaN), false);
        assert.strictEqual((0, config_1.servedRollMatches)(Infinity, Infinity), false);
    });
    it('the derived payout numerator is exactly 9900 at the audited house edge', () => {
        // Step 7 derives the served multiplier's numerator as (1 − HOUSE_EDGE)·10000 rather than
        // typing 9900, so the mutation registry's "house edge doubled → Step 7 fails" guard is true.
        assert.strictEqual((1 - config_1.HOUSE_EDGE) * 10000, 9900);
        assert.strictEqual((0, config_1.quotedMultiplier)({ lower: 99, upper: 100, inverted: false }), 99);
    });
});
/**
 * Step 20's EXPECTED-CREDIT DERIVATION — the integer-basis-point quotient.
 *
 * Step 20 rebuilds every winning credit from the band and compares it to the operator's with zero
 * tolerance. Building the multiplier with `quotedMultiplier`, the float closed form
 * `(100/winChance%)·(1 − edge)`, gives the same number as `9900/basisPoints` over the rationals
 * and a different binary64, because `continuousWinChancePct` computes `upper − lower` in binary64
 * and lands a fraction of an ULP off for many 2-dp bands. The error survives the divide and changes
 * the 8-dp stage-1 rounding, so a CORRECT operator payout is rejected as a one-unit discrepancy.
 *
 * Swept exhaustively over every 2-dp band in all four modes, the two derivations disagree on 12,046
 * bands, at exactly three basis points — 1, 2048 and 6144 — in both the non-inverted and inverted
 * families. Six classes; one representative of each is covered here at $0.10, $1 and $10, with
 * `under 0.01` as the passing control.
 */
describe('Step 20 expected-credit derivation (D16)', () => {
    /** Exactly what Step 20 computes. */
    const expectedMultiplier = (p) => 9900 / (0, config_1.payoutBasisPoints)(p);
    /** One representative per (basisPoints, mode) class where the two derivations disagree. */
    const FAILING_BANDS = [
        { label: 'over 99.99', params: { lower: 99.99, upper: 100, inverted: false }, bps: 1, floatR8: 9899.99999999, quotientR8: 9900 },
        { label: 'outside [0, 99.99)', params: { lower: 0, upper: 99.99, inverted: true }, bps: 1, floatR8: 9899.99999999, quotientR8: 9900 },
        { label: 'over 79.52', params: { lower: 79.52, upper: 100, inverted: false }, bps: 2048, floatR8: 4.83398437, quotientR8: 4.83398438 },
        { label: 'outside [0, 79.52)', params: { lower: 0, upper: 79.52, inverted: true }, bps: 2048, floatR8: 4.83398437, quotientR8: 4.83398438 },
        { label: 'inside [0.01, 61.45)', params: { lower: 0.01, upper: 61.45, inverted: false }, bps: 6144, floatR8: 1.61132812, quotientR8: 1.61132813 },
        { label: 'outside [0.02, 38.58)', params: { lower: 0.02, upper: 38.58, inverted: true }, bps: 6144, floatR8: 1.61132812, quotientR8: 1.61132813 },
    ];
    it('the six failing classes are exactly the bands where the two derivations disagree', () => {
        for (const b of FAILING_BANDS) {
            assert.strictEqual((0, config_1.payoutBasisPoints)(b.params), b.bps, b.label);
            assert.strictEqual((0, config_1.round8)((0, config_1.quotedMultiplier)(b.params)), b.floatR8, `${b.label} float path`);
            assert.strictEqual((0, config_1.round8)(expectedMultiplier(b.params)), b.quotientR8, `${b.label} quotient path`);
            assert.notStrictEqual(b.floatR8, b.quotientR8, b.label);
        }
        assert.deepStrictEqual([...new Set(FAILING_BANDS.map((b) => b.bps))].sort((a, z) => a - z), [1, 2048, 6144]);
    });
    it('ACCEPTS the correct $1 and $10 credits the float path would have rejected', () => {
        for (const b of FAILING_BANDS) {
            for (const stake of [1, 10]) {
                const correct = (0, config_1.settledCredit)(stake, expectedMultiplier(b.params));
                const floatPath = (0, config_1.settledCredit)(stake, (0, config_1.quotedMultiplier)(b.params));
                assert.notStrictEqual(floatPath, correct, `${b.label} at $${stake}: this case is supposed to expose the defect`);
                // The credit Step 20 now expects IS the correct one.
                assert.strictEqual(correct, Number((BigInt(Math.round(stake * 1e8)) * BigInt(Math.round(expectedMultiplier(b.params) * 1e8)) / 100000000n)) / 1e8);
            }
        }
        // The headline case: a $1 bet at 9900x pays $9,900.00, not $9,899.99999999.
        assert.strictEqual((0, config_1.settledCredit)(1, expectedMultiplier({ lower: 99.99, upper: 100, inverted: false })), 9900);
        assert.strictEqual((0, config_1.settledCredit)(1, (0, config_1.quotedMultiplier)({ lower: 99.99, upper: 100, inverted: false })), 9899.99999999);
    });
    it('REJECTS a one-unit incorrect credit on every failing class at every stake', () => {
        for (const b of FAILING_BANDS) {
            for (const stake of [0.1, 1, 10]) {
                const correct = (0, config_1.settledCredit)(stake, expectedMultiplier(b.params));
                assert.notStrictEqual((0, config_1.round8)(correct + 1e-8), correct, `${b.label} at $${stake}`);
                assert.notStrictEqual((0, config_1.round8)(correct - 1e-8), correct, `${b.label} at $${stake}`);
            }
        }
    });
    it('$0.10 ERASES the difference through the final rounding — which is why $1 is the vector', () => {
        for (const b of FAILING_BANDS) {
            assert.strictEqual((0, config_1.settledCredit)(0.1, expectedMultiplier(b.params)), (0, config_1.settledCredit)(0.1, (0, config_1.quotedMultiplier)(b.params)), `${b.label} at $0.10 is not a discriminating stake`);
        }
    });
    it('CONTROL — `under 0.01` agrees under both derivations at every stake', () => {
        const control = { lower: 0, upper: 0.01, inverted: false };
        assert.strictEqual((0, config_1.payoutBasisPoints)(control), 1);
        for (const stake of [0.1, 1, 10]) {
            assert.strictEqual((0, config_1.settledCredit)(stake, expectedMultiplier(control)), (0, config_1.settledCredit)(stake, (0, config_1.quotedMultiplier)(control)), `control diverged at $${stake}`);
        }
        assert.strictEqual((0, config_1.settledCredit)(1, expectedMultiplier(control)), 9900);
    });
    it('changes NO captured row — the two derivations agree on all 6,700', () => {
        const ds = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/dice-master-6700bets.json'), 'utf8'));
        let checked = 0;
        for (const bet of ds.bets) {
            if (!bet.win)
                continue;
            checked++;
            const viaQuotient = (0, config_1.settledCredit)(Number(bet.betAmount), expectedMultiplier(bet.params));
            const viaFloat = (0, config_1.settledCredit)(Number(bet.betAmount), (0, config_1.quotedMultiplier)(bet.params));
            assert.strictEqual(viaQuotient, viaFloat, `epoch-level divergence on ${JSON.stringify(bet.params)}`);
            assert.strictEqual(viaQuotient, Number(bet.winningAmount), 'the quotient path must still reproduce the operator credit');
        }
        assert.strictEqual(checked, 2807);
    });
    it('the DEFECT IS REAL rather than theoretical — 12,046 bands diverge, none of them captured', () => {
        // The exhaustive sweep, restricted here to the under/over families for runtime; the full
        // four-mode sweep was run once and is recorded in the Step 20 comment in
        // tests/steps/standardization.ts.
        let diverge = 0;
        for (let u = 1; u <= 10000; u++) {
            const p = { lower: 0, upper: u / 100, inverted: false };
            if ((0, config_1.round8)((0, config_1.quotedMultiplier)(p)) !== (0, config_1.round8)(expectedMultiplier(p)))
                diverge++;
        }
        for (let l = 0; l < 10000; l++) {
            const p = { lower: l / 100, upper: 100, inverted: false };
            if ((0, config_1.round8)((0, config_1.quotedMultiplier)(p)) !== (0, config_1.round8)(expectedMultiplier(p)))
                diverge++;
        }
        assert.ok(diverge > 0, 'the under/over sweep must contain divergent bands');
    });
});
/** Exact value of `x · 1e8` for a binary64 `x`, as a rational [numerator, denominator]. */
function exactTimes1e8(x) {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, x);
    const bits = view.getBigUint64(0);
    const exponent = Number((bits >> 52n) & 0x7ffn);
    const fraction = bits & 0xfffffffffffffn;
    let numerator, e;
    if (exponent === 0) {
        numerator = fraction;
        e = -1074;
    }
    else {
        numerator = fraction | (1n << 52n);
        e = exponent - 1075;
    }
    numerator *= 100000000n;
    return e >= 0 ? [numerator << BigInt(e), 1n] : [numerator, 1n << BigInt(-e)];
}
/** Round a non-negative exact rational to the nearest integer, ties away from zero (Math.round). */
function roundHalfUp([num, den]) {
    const q = num / den, r = num % den;
    return 2n * r >= den ? q + 1n : q;
}

  },
  "tests/dice/simChecksTests.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * Decision boundaries of the simulation-artifact checks — `src/sim-checks.ts`.
 *
 * These are the vectors for the decision boundaries that govern what Step 16 accepts and rejects.
 * They exist as unit tests, rather than only as end-to-end mutations, because the point of D4 is
 * that a step can reject VALID data: an end-to-end run on the committed artifact can only show
 * that honest data passes, never that a specific legitimate-but-unusual outcome is accepted.
 *
 *   D3 — a plotted standard error must be the standard error that (n, rtp, wins, m) implies.
 *        An unchecked `se = 123456` passes, and the chart cannot show it either.
 *   D4 — a statistic landing exactly on its theoretical value is not evidence of fabrication.
 *        Exactly 40,000 wins in 2,000,000 `over 98` bets gives RTP exactly 0.99 with probability
 *        0.0020149586. A runs z of exactly 0 with healthy variance is an ordinary result.
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
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const sim_checks_1 = require("../../src/sim-checks");
const config_1 = require("../../src/config");
const stats_1 = require("../../src/stats");
const diff_1 = require("../../src/diff");
/** The `under 50` convergence strategy: multiplier 1.98, theory 0.99. */
const M = 1.98;
const THEO = 0.99;
/** The committed schema-1 artifact's series, verbatim — the reference the checks must accept. */
const COMMITTED_POINTS = [
    { n: 1000, rtp: 1.0375200000000067, se: 0.03127046289391956 },
    { n: 10000, rtp: 0.9951479999998745, se: 0.009899866151095175 },
    { n: 100000, rtp: 0.9917819999997746, se: 0.003130649811901676 },
    { n: 1000000, rtp: 0.9894554999937634, se: 0.0009899998502624888 },
    { n: 5000000, rtp: 0.9899184240268278, se: 0.00044274145804190423 },
    { n: 10000000, rtp: 0.9900619741251958, se: 0.0003130654877432553 },
    { n: 20000000, rtp: 0.9897698251742976, se: 0.00022137072378924333 },
];
describe('simulation checks — win-count recovery (schema 1 reconstruction)', () => {
    it('recovers the integer win count behind each committed convergence point', () => {
        const expected = [524, 5026, 50090, 499725, 2499794, 5000313];
        COMMITTED_POINTS.slice(0, 6).forEach((pt, i) => {
            const rec = (0, sim_checks_1.recoverWinCount)(pt.rtp, pt.n, M);
            assert.strictEqual(rec.ok, true, rec.reason);
            assert.strictEqual(rec.wins, expected[i], `n=${pt.n}`);
            assert.strictEqual(rec.source, 'reconstructed');
        });
    });
    it('the reconstruction residual stays far inside the declared cap at the deepest checkpoint', () => {
        const rec = (0, sim_checks_1.recoverWinCount)(0.9897698251742976, 20000000, M);
        assert.strictEqual(rec.ok, true);
        assert.strictEqual(rec.wins, 9997675);
        // Measured worst case across the committed series. The cap is 0.25; this is two orders below.
        assert.ok(rec.residual < 0.01, `residual ${rec.residual} unexpectedly large`);
        assert.ok(rec.residual < sim_checks_1.RECONSTRUCTION_MAX_RESIDUAL);
    });
    it('rejects an RTP that no integer win count produces', () => {
        // Halfway between two attainable RTPs at n=1000: (524.5 · 1.98) / 1000.
        const rec = (0, sim_checks_1.recoverWinCount)((524.5 * M) / 1000, 1000, M);
        assert.strictEqual(rec.ok, false);
        assert.match(rec.reason, /no integer win count produces this RTP/);
    });
    it('rejects out-of-range and non-integer sample sizes and multipliers', () => {
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(0.99, 0, M).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(0.99, 1000.5, M).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(0.99, 1000, 0).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(Number.NaN, 1000, M).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(-0.5, 1000, M).ok, false);
        // rtp above the multiplier means more wins than bets
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(M * 1.5, 1000, M).ok, false);
    });
    it('schema 2: a stored count must agree with the RTP it claims to have produced', () => {
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, 524).ok, true);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, 524).source, 'stored');
        const bad = (0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, 600);
        assert.strictEqual(bad.ok, false);
        assert.match(bad.reason, /disagrees with the 524/);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, 524.5).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, -1).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, '524').ok, false);
    });
});
describe('a published RTP must be the return an INTEGER win count produces (D5)', () => {
    // The `over 98` band pays 49.5× on 2,000,000 bets, so 0.99000495 implies 40,000.2 wins — a
    // fractional count, i.e. a return no integer number of wins can produce. A rule that rounds it
    // to 40,000 accepts the row and the suite exits 0. The end-to-end form of this counterexample is
    // tests/forgeries/fractional-win-count.mjs, registered in tests/structural-forgeries.json.
    const BAND = { lower: 98, upper: 100, inverted: false };
    const BAND_M = (0, config_1.quotedMultiplier)(BAND); // 49.5
    const FORGED = 0.99000495;
    it('the counterexample really does imply a fractional win count', () => {
        assert.strictEqual(BAND_M, 49.5);
        assert.strictEqual((FORGED * config_1.SIM_EDGE_BETS) / BAND_M, 40000.2);
        assert.ok(!Number.isInteger((FORGED * config_1.SIM_EDGE_BETS) / BAND_M));
        // …and it is inside the old quarter-win cap, which is exactly why it passed.
        assert.ok(Math.abs(40000.2 - 40000) < sim_checks_1.RECONSTRUCTION_MAX_RESIDUAL);
    });
    it('REJECTS the reviewer\'s 0.99000495 over-98 RTP (40,000.2 wins)', () => {
        const rec = (0, sim_checks_1.recoverWinCount)(FORGED, config_1.SIM_EDGE_BETS, BAND_M);
        assert.strictEqual(rec.ok, false, 'a fractional win count must not be rounded into acceptance');
        assert.strictEqual(rec.match, 'none');
        assert.strictEqual(rec.wins, 40000); // the candidate…
        assert.strictEqual(rec.reconstructedRTP, 0.99); // …and what that candidate actually produces
        assert.match(rec.reason, /no integer win count produces this RTP/);
    });
    it('a stored schema-2 count cannot launder it either', () => {
        // A forger who also writes the rounded count gets the same answer: the RTP still is not the
        // return of 40,000 wins.
        const rec = (0, sim_checks_1.recoverWinCount)(FORGED, config_1.SIM_EDGE_BETS, BAND_M, 40000);
        assert.strictEqual(rec.ok, false);
        assert.match(rec.reason, /no integer win count produces this RTP/);
    });
    it('rejects every fractional offset down to a hundredth of a win', () => {
        for (const offset of [0.5, 0.2, 0.1, 0.05, 0.01, -0.01, -0.2]) {
            const rtp = ((40000 + offset) * BAND_M) / config_1.SIM_EDGE_BETS;
            const rec = (0, sim_checks_1.recoverWinCount)(rtp, config_1.SIM_EDGE_BETS, BAND_M);
            assert.strictEqual(rec.ok, false, `${offset} wins from an integer must be rejected (rtp ${rtp})`);
        }
    });
    it('accepts the committed over-98 row, whose count is an integer 40,217', () => {
        const rec = (0, sim_checks_1.recoverWinCount)(0.99537075, config_1.SIM_EDGE_BETS, BAND_M);
        assert.strictEqual(rec.ok, true, rec.reason);
        assert.strictEqual(rec.wins, 40217);
        assert.strictEqual(rec.match, 'exact', 'the committed artifact needs no tolerance at all');
        assert.strictEqual(rec.reconstructedRTP, 0.99537075);
    });
    it('every committed convergence point reconstructs EXACTLY — no tolerance is spent', () => {
        const r = (0, sim_checks_1.validateConvergenceSeries)(COMMITTED_POINTS, M, THEO);
        assert.strictEqual(r.ok, true, r.failures.join('; '));
        assert.strictEqual(r.exactReconstructions, COMMITTED_POINTS.length);
        r.points.forEach((p) => assert.strictEqual(p.winMatch, 'exact', `n=${p.n}`));
    });
    it('reconstructReturn replays the producer\'s accumulation, not wins × m', () => {
        // The deepest committed checkpoint: 9,997,675 wins at 1.98×. The accumulated sum and the single
        // multiplication differ, and it is the ACCUMULATION the published RTP matches.
        const wins = 9997675, n = 20000000;
        const accumulated = (0, sim_checks_1.reconstructReturn)(wins, M);
        assert.notStrictEqual(accumulated, wins * M, 'repeated addition is not the product in binary64');
        assert.strictEqual(accumulated / n, COMMITTED_POINTS[6].rtp);
    });
    it('the tolerance is DERIVED and stays orders below the counterexample', () => {
        const tol = (0, sim_checks_1.reconstructionTolerance)(40000);
        assert.ok(Math.abs(tol - 3.552e-7) < 1e-9, `tolerance ${tol}`);
        assert.ok(tol < 0.2, 'the derived bound must not reach the 0.2-win forgery');
        // It never exceeds the outer fail-closed ceiling, and it grows with the count, not with taste.
        assert.ok((0, sim_checks_1.reconstructionTolerance)(10000000) <= sim_checks_1.RECONSTRUCTION_MAX_RESIDUAL);
        assert.ok((0, sim_checks_1.reconstructionTolerance)(10000000) > (0, sim_checks_1.reconstructionTolerance)(40000));
        assert.ok((0, sim_checks_1.reconstructionTolerance)(1e9) === sim_checks_1.RECONSTRUCTION_MAX_RESIDUAL);
    });
    it('fails closed past the depth where the reconstruction is defined', () => {
        const n = 500000000, wins = 100000000;
        const rec = (0, sim_checks_1.recoverWinCount)((wins * 1) / n, n, 1);
        assert.strictEqual(rec.ok, false);
        assert.match(rec.reason, /past the depth/);
    });
    it('accepts a producer that sums in a different order (bounded, not exact)', () => {
        // A legitimate variant: the same integer count, the return formed as one multiplication. It
        // lands a few ulps from the replay and is admitted by the DERIVED bound — nothing wider.
        const wins = 1000805, n = config_1.SIM_EDGE_BETS;
        const rtp = (wins * M) / n;
        const rec = (0, sim_checks_1.recoverWinCount)(rtp, n, M);
        assert.strictEqual(rec.ok, true, rec.reason);
        assert.strictEqual(rec.wins, wins);
        assert.ok(rec.residual <= (0, sim_checks_1.reconstructionTolerance)(wins), `residual ${rec.residual}`);
    });
});
describe('simulation checks — every plotted standard error (D3)', () => {
    it('accepts the committed series exactly, and counts zero points on theory', () => {
        const r = (0, sim_checks_1.validateConvergenceSeries)(COMMITTED_POINTS, M, THEO);
        assert.strictEqual(r.ok, true, r.failures.join('; '));
        assert.strictEqual(r.exactlyOnTheory, 0);
        r.points.forEach((p) => assert.strictEqual(p.storedSE, p.expectedSE, `n=${p.n}`));
    });
    it('REJECTS the reviewer\'s se = 123456 on the first plotted point', () => {
        const mutated = COMMITTED_POINTS.map((p, i) => (i === 0 ? { ...p, se: 123456 } : p));
        const r = (0, sim_checks_1.validateConvergenceSeries)(mutated, M, THEO);
        assert.strictEqual(r.ok, false);
        assert.strictEqual(r.failures.length, 1);
        assert.match(r.failures[0], /^n=1000: stored SE 123456 != 0\.03127046289391956/);
    });
    it('rejects a standard error wrong in the last bit', () => {
        const nudged = COMMITTED_POINTS.map((p, i) => (i === 3 ? { ...p, se: p.se * (1 + Number.EPSILON) } : p));
        const r = (0, sim_checks_1.validateConvergenceSeries)(nudged, M, THEO);
        assert.strictEqual(r.ok, false, 'a one-ULP standard-error edit must not pass');
    });
    it('rejects a non-finite or absent standard error', () => {
        for (const se of [Number.NaN, Infinity, undefined, null, '0.03127046289391956']) {
            const r = (0, sim_checks_1.validateConvergenceSeries)(COMMITTED_POINTS.map((p, i) => (i === 0 ? { ...p, se } : p)), M, THEO);
            assert.strictEqual(r.ok, false, `se=${String(se)} must be rejected`);
        }
    });
    it('the SE formula is the producer\'s, expression for expression', () => {
        // Independent restatement: p = wins/n, var = p(m−rtp)² + (1−p)rtp², SE = sqrt(var/n).
        const n = 1000, wins = 524, rtp = COMMITTED_POINTS[0].rtp;
        const p = wins / n;
        const expected = Math.sqrt((p * (M - rtp) ** 2 + (1 - p) * (0 - rtp) ** 2) / n);
        assert.strictEqual((0, sim_checks_1.convergenceSE)(n, rtp, wins, M), expected);
        assert.strictEqual((0, sim_checks_1.convergenceSE)(n, rtp, wins, M), COMMITTED_POINTS[0].se);
    });
});
describe('simulation checks — cumulative consistency across nested checkpoints', () => {
    it('rejects a win count that falls between nested marks', () => {
        // Point 2 rewritten so its implied win count is below point 1's, which is impossible for
        // running totals over one sample.
        const pts = [
            { n: 1000, rtp: (524 * M) / 1000, se: (0, sim_checks_1.convergenceSE)(1000, (524 * M) / 1000, 524, M) },
            { n: 10000, rtp: (400 * M) / 10000, se: (0, sim_checks_1.convergenceSE)(10000, (400 * M) / 10000, 400, M) },
        ];
        const r = (0, sim_checks_1.validateConvergenceSeries)(pts, M, THEO);
        assert.strictEqual(r.ok, false);
        assert.match(r.failures[0], /win count fell from 524 to 400/);
    });
    it('rejects a win count that grows faster than the sample does', () => {
        const pts = [
            { n: 1000, rtp: (100 * M) / 1000, se: (0, sim_checks_1.convergenceSE)(1000, (100 * M) / 1000, 100, M) },
            { n: 2000, rtp: (1500 * M) / 2000, se: (0, sim_checks_1.convergenceSE)(2000, (1500 * M) / 2000, 1500, M) },
        ];
        const r = (0, sim_checks_1.validateConvergenceSeries)(pts, M, THEO);
        assert.strictEqual(r.ok, false);
        assert.match(r.failures[0], /win count rose by 1400 over only 1000 additional bets/);
    });
    it('rejects a non-increasing sample size', () => {
        const pts = [
            { n: 10000, rtp: (5000 * M) / 10000, se: (0, sim_checks_1.convergenceSE)(10000, (5000 * M) / 10000, 5000, M) },
            { n: 1000, rtp: (500 * M) / 1000, se: (0, sim_checks_1.convergenceSE)(1000, (500 * M) / 1000, 500, M) },
        ];
        assert.strictEqual((0, sim_checks_1.validateConvergenceSeries)(pts, M, THEO).ok, false);
    });
});
describe('an exact statistical fit is NOT evidence of fabrication (D4)', () => {
    it('accepts a consistent 40,000 / 2,000,000 `over 98` summary at exactly 0.99 RTP', () => {
        const band = { lower: 98, upper: 100, inverted: false };
        const m = (0, config_1.quotedMultiplier)(band);
        const theo = (0, config_1.theoreticalRTP)(band);
        const pr = (0, config_1.discreteWinProbability)(band);
        const wins = 40000;
        const simRtp = (wins * m) / config_1.SIM_EDGE_BETS;
        // The premise of the counterexample: this really is exactly the theoretical value.
        assert.strictEqual(m, 49.5);
        assert.strictEqual(theo, 0.99);
        assert.strictEqual(pr, 0.02);
        assert.strictEqual(simRtp, 0.99);
        assert.strictEqual(simRtp, theo);
        // …and the win count behind it is a perfectly ordinary integer, which is what the check tests.
        const rec = (0, sim_checks_1.recoverWinCount)(simRtp, config_1.SIM_EDGE_BETS, m);
        assert.strictEqual(rec.ok, true, rec.reason);
        assert.strictEqual(rec.wins, wins);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(simRtp, config_1.SIM_EDGE_BETS, m, wins).ok, true);
        // THE MIRROR RISK (G-VALID), asserted rather than assumed: the D5 fix rejects the IMPOSSIBLE
        // (40,000.2 wins), and this — a real result landing exactly on expectation — must still pass,
        // bit-for-bit, after it. Reinstating "too good to be true" from the other direction would be
        // the same defect wearing the opposite sign.
        assert.strictEqual(rec.match, 'exact');
        assert.strictEqual(rec.reconstructedRTP, theo);
        assert.strictEqual((0, sim_checks_1.reconstructReturn)(wins, m) / config_1.SIM_EDGE_BETS, 0.99);
        // Its probability is 0.0020149586… — about one run in 496, not zero.
        const logP = lnChoose(config_1.SIM_EDGE_BETS, wins) + wins * Math.log(0.02) + (config_1.SIM_EDGE_BETS - wins) * Math.log(0.98);
        assert.ok(Math.abs(Math.exp(logP) - 0.0020149586) < 1e-9, `P(X=40000) = ${Math.exp(logP)}`);
    });
    it('accepts a convergence series sitting exactly on theory, and reports it', () => {
        const pts = [1000, 10000, 100000].map((n) => ({
            n, rtp: THEO, se: (0, sim_checks_1.convergenceSE)(n, THEO, n / 2, M),
        }));
        const r = (0, sim_checks_1.validateConvergenceSeries)(pts, M, THEO);
        assert.strictEqual(r.ok, true, r.failures.join('; '));
        assert.strictEqual(r.exactlyOnTheory, 3, 'exact hits must be COUNTED, not rejected');
    });
    it('accepts a runs test with z exactly 0 and healthy variance', () => {
        // A balanced split whose observed run count is exactly its expectation.
        const n = 200000, n1 = 100000;
        const rs = (0, sim_checks_1.runsStatistic)((2 * n1 * (n - n1)) / n + 1, n1, n);
        assert.strictEqual(rs.z, 0);
        assert.strictEqual(rs.degenerate, false);
        assert.ok(rs.variance > 0, 'a balanced split has positive runs variance');
    });
    it('DOES reject a runs test with zero variance — every observation on one side', () => {
        const degenerate = (0, sim_checks_1.runsStatistic)(1, 200000, 200000);
        assert.strictEqual(degenerate.degenerate, true);
        // `-0` in IEEE-754 — the numerator is `0 · (0 − n)`. Not positive is the property that matters.
        assert.ok(!(degenerate.variance > 0), `variance ${degenerate.variance}`);
        assert.strictEqual((0, sim_checks_1.runsStatistic)(1, 0, 200000).degenerate, true);
    });
    /**
     * ── WHAT THIS MUST NOT BE ────────────────────────────────────────────────────────────────────
     * A case titled "reproduces the committed artifact's runs z from its own cell counts" that never
     * opens the artifact, uses invented counts present in no committed file, and asserts
     * `rs.z === (runs - rs.expected) / Math.sqrt(rs.variance)` is asserting the definition of the
     * quantity `runsStatistic` just returned — true for any inputs, unfalsifiable by any defect.
     * A title claiming more than the body does is the same defect class as prose that does.
     *
     * So this reads `outputs/simulation-results.json` and takes the branch the artifact's OWN declared
     * schema puts it on. Under schema 2 that is the full re-derivation. Under schema 1 — which is what
     * is committed — the cell counts do not exist, so the strong form is genuinely unavailable; this
     * asserts that ABSENCE as a measured fact rather than assuming it, and then asserts the one
     * re-derivation schema 1 does support, exactly.
     */
    it('re-derives what the COMMITTED artifact\'s own schema allows, and proves which branch that is', () => {
        const sim = JSON.parse(fs.readFileSync(path.join(__dirname, '../../outputs/simulation-results.json'), 'utf8'));
        const ser = sim?.pass1?.serial ?? {};
        const schemaVersion = Number(sim.schemaVersion ?? 1);
        assert.ok(schemaVersion === 1 || schemaVersion === sim_checks_1.SIM_SCHEMA_VERSION, `unknown artifact schema ${schemaVersion}`);
        const runsZ = Number(ser.runsZ);
        assert.ok(Number.isFinite(runsZ), 'the artifact must carry a finite runsZ under either schema');
        if (schemaVersion >= 2) {
            // STRONG FORM: (runs, n1, n) are stored, so runsZ is a derived quantity and must be re-derived
            // to the bit. Nothing here is taken on trust.
            const runs = Number(ser.runs), n1 = Number(ser.n1), n = Number(ser.n);
            assert.ok(Number.isInteger(runs) && Number.isInteger(n1) && Number.isInteger(n), `schema ${schemaVersion} must store integer cell counts, got runs=${ser.runs} n1=${ser.n1} n=${ser.n}`);
            const rs = (0, sim_checks_1.runsStatistic)(runs, n1, n);
            assert.strictEqual(rs.degenerate, false, `runs variance is 0 at n1=${n1} of n=${n}`);
            assert.strictEqual(rs.z, runsZ, `stored runsZ ${runsZ} != ${rs.z} re-derived from (runs=${runs}, n1=${n1}, n=${n})`);
            // Schema 2 also has to carry the threshold it was produced under.
            // A normal quantile through Math.log / Math.sqrt: held to the reproduction bound
            // (src/diff.ts numbersAgree, 1e-14 abs + 1e-12 rel), not bit equality — libm is not
            // guaranteed bit-identical across platforms.
            assert.ok((0, diff_1.numbersAgree)(Number(ser.zCritical), (0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN)), `stored zCritical ${ser.zCritical} != ${(0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN)} recomputed at ALPHA_SCREEN`);
            return;
        }
        // SCHEMA 1 — the committed case. The cell counts are absent, and that absence is asserted here
        // rather than assumed, so this test starts failing the moment the artifact gains them (at which
        // point the branch above takes over and the check gets strictly stronger, never quieter).
        assert.strictEqual(schemaVersion, 1);
        assert.strictEqual(ser.runs, undefined, 'schema 1 must not carry a runs count — if it does, the artifact is mislabelled');
        assert.strictEqual(ser.n1, undefined, 'schema 1 must not carry n1 — if it does, the artifact is mislabelled');
        assert.strictEqual(Number(ser.n), 200000, 'the serial depth IS stored under schema 1');
        // What schema 1 DOES support: runsP is a deterministic function of runsZ alone, so the stored
        // p-value must BE the recomputed one — to the reproduction bound (1e-14 abs + 1e-12 rel,
        // src/diff.ts numbersAgree), because erf goes through Math.exp and libm is not guaranteed
        // bit-identical across platforms. This is the assertion the old case should have made — it can
        // fail, and a fabricated or hand-edited runsP (anything beyond 1e-12 relative) makes it fail.
        assert.ok((0, diff_1.numbersAgree)(Number(ser.runsP), (0, stats_1.twoSidedNormalP)(runsZ)), `stored runsP ${ser.runsP} != ${(0, stats_1.twoSidedNormalP)(runsZ)} recomputed from runsZ ${runsZ}`);
        // And the counts really are unrecoverable from what is stored: (runs, n1) is a two-dimensional
        // preimage of a single z at fixed n, so many integer pairs reproduce this runsZ. Demonstrated,
        // not asserted in prose — if a unique preimage existed, schema 2 would be unnecessary.
        const preimages = [];
        for (let n1 = 99000; n1 <= 101000 && preimages.length < 2; n1++) {
            const { expected, variance, degenerate } = (0, sim_checks_1.runsStatistic)(0, n1, 200000);
            if (degenerate)
                continue;
            const runs = Math.round(expected + runsZ * Math.sqrt(variance));
            if ((0, sim_checks_1.runsStatistic)(runs, n1, 200000).z === runsZ)
                preimages.push([runs, n1]);
        }
        assert.ok(preimages.length >= 2, `schema 1 cannot pin the cell counts: found ${preimages.length} exact preimage(s) of runsZ=${runsZ}`);
    });
});
describe('the declared error budget describes the decision rule', () => {
    it('enumerates every screen that can move the verdict', () => {
        assert.strictEqual(sim_checks_1.SCORED_STATISTICAL_PREDICATES.length, 7);
        assert.deepStrictEqual(sim_checks_1.SCORED_STATISTICAL_PREDICATES.map((s) => s.id), ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7']);
        assert.deepStrictEqual([...new Set(sim_checks_1.SCORED_STATISTICAL_PREDICATES.map((s) => s.step))], [16, 17]);
    });
    it('the family-wise bound is ABOVE the three-screen alpha, not equal to it', () => {
        assert.ok(sim_checks_1.FAMILY_WISE_BOUND > 0.01, 'the whole family cannot be bounded by one screen group\'s alpha');
        assert.ok(Math.abs(sim_checks_1.FAMILY_WISE_BOUND - 0.0300057) < 1e-6, `bound ${sim_checks_1.FAMILY_WISE_BOUND}`);
    });
    it('STEP 16\'s own bound is above α too — it scores more than the three screens', () => {
        // "The step's level is α = 0.01" understates a step that also scores the nine effective-edge
        // band checks and the convergence band check.
        assert.ok(sim_checks_1.STEP_16_BOUND > 0.01, 'a step scoring S1-S5 is not bounded by S1-S3\'s alpha');
        assert.ok(Math.abs(sim_checks_1.STEP_16_BOUND - 0.0100057) < 1e-7, `step-16 bound ${sim_checks_1.STEP_16_BOUND}`);
        // …and the two Pass-2 screens are the rest of the family.
        assert.strictEqual(sim_checks_1.FAMILY_WISE_BOUND, sim_checks_1.STEP_16_BOUND + 0.01 + 0.01);
        const step16Screens = sim_checks_1.SCORED_STATISTICAL_PREDICATES.filter((s) => s.step === 16);
        assert.strictEqual(step16Screens.length, 5, 'Step 16 scores five statistical screens, not three');
    });
    it('the verifier declares the schema version it implements', () => {
        assert.strictEqual(sim_checks_1.SIM_SCHEMA_VERSION, 2);
    });
});
/** ln C(n, k), by log-gamma — used only to price the D4 counterexample. */
function lnChoose(n, k) {
    return lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);
}
function lnGamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
        -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++)
        ser += c[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
describe('Recomputed-float comparison (src/diff.ts numbersAgree, used by Steps 16–17)', () => {
    it('1-ulp libm drift agrees; a p moved by 1e-12 or more, or a distinct integer, does not', () => {
        // The shipped Pass-1 runs p. A second platform whose Math.exp differs in the last bit moves
        // it by one ulp; a forger moves it by more.
        const p = 0.6909641862935407;
        const ulp = 2 ** (Math.floor(Math.log2(p)) - 52);
        assert.ok((0, diff_1.numbersAgree)(p, p + ulp));
        assert.ok((0, diff_1.numbersAgree)(p, p - ulp));
        assert.ok(!(0, diff_1.numbersAgree)(p, p + 1e-12));
        assert.ok(!(0, diff_1.numbersAgree)(0.001, 0.0010000001));
        assert.ok(!(0, diff_1.numbersAgree)(99, 100));
    });
});

  },
  "tests/dice/statsTests.js": function (module, exports, require, __filename, __dirname) {
"use strict";
/**
 * The statistical reference values the verdict rests on — `src/stats.ts`.
 *
 * ── WHY ────────────────────────────────────────────────────────────────────────────────────────
 * Three different numbers can be, and have been, called "the critical z at α/3":
 *
 *   2.576236081309571   the artifact's stored `pass1.serial.zCritical` — a LEGACY field, an
 *                       approximation at the UNCORRECTED α = 0.01, never read by the verifier;
 *   2.935529862881156   what an Abramowitz & Stegun 26.2.23 `inverseCriticalZ(0.01/3)` returns —
 *                       its own error bound is 4.5e-4 and it is off by 3.3e-4 here;
 *   2.935199468866706   the actual two-sided critical z, the one a prose figure of "2.936" implies.
 *
 * ── AND A FOURTH NUMBER ────────────────────────────────────────────────────────────────────────
 * Writing the threshold as `normalQuantile(1 - ALPHA_SCREEN/2)` returns **2.9351994688666982**,
 * and **2.9351994688666987** sits beside it looking like "the actual two-sided normal quantile".
 * It is not: it is Φ⁻¹ of the ROUNDED double 0.9983333333333333, which is a different p from
 * 1 − α/2. The true critical z at ALPHA_SCREEN is 2.9351994688667059210814763461956… — nearest
 * binary64 **2.935199468866706** — so that figure is 17.3 ULP out, and an error term published
 * as "~1e-16" would really be ~1e-14.
 *
 * `inverseCriticalZ` is therefore `-normalQuantile(alpha / 2)`: `alpha / 2` is an exact halving,
 * so the rounding `1 - alpha/2` introduces (3.84e-17 in p, amplified by 1/φ(z) ≈ 186) is absent.
 * What remains is AS 241's own accuracy — about 1.3 ULP here, which this file ASSERTS rather than
 * describes as absent. Reference figures were recomputed independently at 90 decimal digits.
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
const assert = __importStar(require("node:assert"));
const stats_1 = require("../../src/stats");
const config_1 = require("../../src/config");
/**
 * Reference quantiles of the standard normal. Independent source: Python 3
 * `statistics.NormalDist().inv_cdf(p)` (CPython's own implementation of Wichura's algorithm).
 *
 * NOT claimed to be the nearest binary64 to each true quantile. That source is itself AS 241, so its
 * own error is of order 1 ULP, and an independent 90-digit recomputation puts two of
 * these rows one ULP off the true nearest double: Φ⁻¹(0.975) is 1.9599639845400538556… (nearest
 * 1.9599639845400538, tabled as 1.959963984540054) and Φ⁻¹(0.9) is 1.2815515655446005934… (nearest
 * 1.2815515655446006, tabled as 1.2815515655446004). These are reference vectors at the 1e-14 level
 * the assertion below actually uses, and the table says so rather than implying exactness.
 */
const REFERENCE_QUANTILES = [
    [0.5, 0],
    [0.9, 1.2815515655446004],
    [0.975, 1.959963984540054],
    [0.99, 2.3263478740408408],
    [0.995, 2.5758293035489004],
    // Φ⁻¹ of this ROUNDED double — confirmed nearest-binary64 by the 90-digit recomputation
    // (2.9351994688666987759…). It is NOT the critical z at ALPHA_SCREEN; see the block below.
    [0.9983333333333333, 2.9351994688666987],
    [0.999, 3.090232306167813],
    [0.000001, -4.753424308822899],
];
describe('normal quantile (AS 241)', () => {
    it('matches independent reference quantiles to within 1e-14', () => {
        for (const [p, expected] of REFERENCE_QUANTILES) {
            const got = (0, stats_1.normalQuantile)(p);
            assert.ok(Math.abs(got - expected) < 1e-14, `Φ⁻¹(${p}) = ${got}, reference ${expected}`);
        }
    });
    it('is odd about the median, to within 1e-14', () => {
        for (const p of [0.001, 0.01, 0.1, 0.3, 0.4249, 0.4251]) {
            assert.ok(Math.abs((0, stats_1.normalQuantile)(p) + (0, stats_1.normalQuantile)(1 - p)) < 1e-14, `p=${p}`);
        }
    });
    it('is continuous across the branch boundary at |p − 0.5| = 0.425', () => {
        // AS 241 switches from the central rational fit to the tail fit here; a discontinuity would
        // mean one of the two branches was transcribed wrongly.
        const below = (0, stats_1.normalQuantile)(0.5 + 0.425 - 1e-12);
        const above = (0, stats_1.normalQuantile)(0.5 + 0.425 + 1e-12);
        assert.ok(Math.abs(above - below) < 1e-10, `${below} vs ${above}`);
    });
    it('is strictly increasing', () => {
        let prev = -Infinity;
        for (let p = 0.001; p < 1; p += 0.0007) {
            const v = (0, stats_1.normalQuantile)(p);
            assert.ok(v > prev, `not increasing at p=${p}`);
            prev = v;
        }
    });
    it('returns NaN outside the open unit interval', () => {
        for (const p of [0, 1, -0.1, 1.1, Number.NaN])
            assert.ok(Number.isNaN((0, stats_1.normalQuantile)(p)));
    });
});
describe('the critical z the suite actually applies', () => {
    /**
     * The true two-sided critical z at ALPHA_SCREEN is 2.9351994688667059210814763461956…, from an
     * independent BigInt fixed-point computation at 90 decimal digits (erf by its Taylor series, π by
     * Machin's formula, the tail inverted by bisection, on the validated runtime). That
     * computation reproduces erf(1) = 0.8427007929497148693412206350826092592960… to all 40 digits and
     * returns the same binary64 as CPython for Φ⁻¹(0.995), Φ⁻¹(0.99) and Φ⁻¹(0.999).
     *
     * NEAREST_DOUBLE is the nearest binary64 to it — exact value 2.9351994688667057964437390182865…,
     * which is 1.246e-16 BELOW the true z. The true z is therefore not a double and the residual error
     * cannot be measured from inside binary64; the ULP distances below are what IS measurable here,
     * and the 90-digit figures are quoted in the comments where they matter.
     */
    const NEAREST_DOUBLE = 2.935199468866706;
    const ULP = 2 ** -51; // one ULP at this magnitude: 4.440892098500626e-16
    it('is the two-sided critical z at the Bonferroni-corrected screen level', () => {
        assert.strictEqual(config_1.ALPHA_SCREENS, 3);
        assert.strictEqual(config_1.ALPHA_SCREEN, config_1.ALPHA / 3);
        // Built from the LOWER tail: alpha/2 is an exact halving, 1 - alpha/2 is not.
        assert.strictEqual((0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN), -(0, stats_1.normalQuantile)(config_1.ALPHA_SCREEN / 2));
    });
    it('equals 2.9351994688667054, one ULP below the nearest double to the true critical z', () => {
        const z = (0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN);
        assert.strictEqual(z, 2.9351994688667054, `applied threshold ${z}`);
        assert.strictEqual(z - NEAREST_DOUBLE, -ULP, 'exactly one ULP low, not zero and not seventeen');
        // THE ERROR TERM, asserted instead of claimed away. Against the 90-digit true z the gap is
        // 5.687e-16 = 1.28 ULP — AS 241's own accuracy plus the rounding of the result into binary64.
        // It is not exact, and nothing in this package says it is.
        assert.notStrictEqual(z, NEAREST_DOUBLE, 'the applied threshold is NOT the nearest double');
    });
    it('REJECTS the `1 - alpha/2` form: the same number over the reals, 17 ULP out in binary64', () => {
        // The defect as an executable vector. Both expressions are Φ⁻¹ at the same real number;
        // only one of them is handed an argument binary64 can represent.
        const lower = -(0, stats_1.normalQuantile)(config_1.ALPHA_SCREEN / 2); // what the code applies
        const upper = (0, stats_1.normalQuantile)(1 - config_1.ALPHA_SCREEN / 2); // the form it must not apply
        assert.notStrictEqual(lower, upper, 'the two forms must be distinguishable, or there is no finding');
        assert.strictEqual(upper, 2.9351994688666982);
        assert.strictEqual((upper - NEAREST_DOUBLE) / ULP, -17, 'the retired form was 17 ULP low');
        assert.ok(Math.abs(lower - NEAREST_DOUBLE) < Math.abs(upper - NEAREST_DOUBLE), 'the lower-tail form must be the more accurate one, or the change was pointless');
        // The rounding that causes it, at the source. AS 241's tail branch computes `r = 1 - p`
        // internally, so `1 - alpha/2` is rounded on the way in and cannot be recovered on the way out:
        assert.strictEqual(config_1.ALPHA_SCREEN / 2, 0.0016666666666666668); // the halving is exact…
        assert.notStrictEqual(1 - (1 - config_1.ALPHA_SCREEN / 2), config_1.ALPHA_SCREEN / 2); // …the round trip is not
        assert.strictEqual(1 - (1 - config_1.ALPHA_SCREEN / 2), 0.0016666666666667052);
    });
    it('is still far below the retired approximation and the legacy artifact field', () => {
        const z = (0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN);
        assert.ok(Math.abs(z - 2.935529862881156) > 3e-4, 'the old approximation must not still be in use');
        assert.ok(Math.abs(z - 2.576236081309571) > 0.3, 'the artifact\'s legacy zCritical is at the UNCORRECTED alpha');
        assert.ok(z < 2.935529862881156, 'a smaller critical z rejects more often, not less');
    });
    it('reproduces the textbook two-sided criticals', () => {
        assert.ok(Math.abs((0, stats_1.inverseCriticalZ)(0.05) - 1.959963984540054) < 1e-14);
        assert.ok(Math.abs((0, stats_1.inverseCriticalZ)(0.01) - 2.5758293035489004) < 1e-14);
    });
});
describe('runs test carries its own cell counts (schema 2)', () => {
    it('emits n, n1 and the variance, and z is reproducible from them', () => {
        const series = Array.from({ length: 2001 }, (_, i) => (i % 3 === 0 ? 1 : 0));
        const r = (0, stats_1.runsTest)(series);
        assert.strictEqual(r.n, series.length);
        assert.strictEqual(r.n1, series.filter((x) => x === 1).length);
        assert.ok(r.variance > 0);
        assert.strictEqual(r.z, (r.runs - r.expected) / Math.sqrt(r.variance));
        assert.strictEqual(r.pValue, (0, stats_1.twoSidedNormalP)(r.z));
    });
    it('an all-one-side series is degenerate: zero variance, z forced to 0', () => {
        const r = (0, stats_1.runsTest)(new Array(1000).fill(1));
        assert.strictEqual(r.n1, 1000);
        assert.ok(!(r.variance > 0));
        assert.strictEqual(r.z, 0);
    });
});

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
    const s1 = (0, context_1.step)(1, 'Seed Hash Integrity', fails === 0 && checked === seeds.length ? 'PASS' : 'FAIL', `${checked}/${seeds.length} revealed seeds checked; SHA-256(utf8(serverSeed)) == hashedServerSeed; ${fails} mismatches`);
    // ── Step 2: Next-seed pre-commitment chain ──────────────────────────────────
    const byEpoch = [...seeds].sort((a, b) => a.epoch - b.epoch);
    let promoChecked = 0, promoFails = 0;
    for (let i = 0; i + 1 < byEpoch.length; i++) {
        promoChecked++;
        if (byEpoch[i].nextHashedServerSeed !== byEpoch[i + 1].hashedServerSeed)
            promoFails++;
    }
    const expectedTransitions = seeds.length - 1;
    // PRE-CAPTURE LINK. The 133 in-capture transitions show the chain was never
    // broken DURING the capture, but on their own they say nothing about epoch 0: its commitment is
    // simply the first thing the capture saw. The dataset also carries `meta.preCapture` — the seed
    // pair that was active BEFORE the first bet, with its own revealed server seed and its
    // `nextHashedServerSeed`. Two checks turn that into evidence: the pre-capture seed must hash to
    // its own commitment, and its `nextHashedServerSeed` must BE epoch 0's commitment. Together they
    // place epoch 0's commitment EARLIER IN THE CHAIN than the first bet's epoch. Without them the
    // field sits in the dataset and is read by nothing.
    //
    // WHAT IT IS NOT. A hash chain orders records; it does not date
    // them. This establishes that epoch 0's commitment was already fixed by a record the capture holds
    // from before the first bet — as recorded BY THE CAPTURE. The anchor for "before" is the auditor's
    // own capture record, not an independently authenticated timestamp, so the detail string below
    // says "conditional on the attested chronology" and names limitation L18. Wording such as
    // "the operator could not have chosen it after seeing a bet" would claim more than a matching
    // hash can carry.
    const pre = ctx.meta.preCapture;
    const epoch0 = byEpoch[0];
    let preState;
    let preOk = false;
    if (!pre || !pre.hashedServerSeed || !pre.revealedServerSeed || !pre.nextHashedServerSeed) {
        preState = 'no meta.preCapture record — epoch 0\'s commitment has no pre-capture witness';
    }
    else {
        const preCommitOk = (0, rng_1.commitHash)(pre.revealedServerSeed) === pre.hashedServerSeed;
        const preLinkOk = pre.nextHashedServerSeed === epoch0.hashedServerSeed;
        preOk = preCommitOk && preLinkOk;
        preState = preOk
            ? 'pre-capture link verified: the pair the capture recorded before the first bet reveals a seed that hashes to its own commitment, and its nextHashedServerSeed IS epoch 0\'s commitment — so epoch 0\'s commitment was already fixed by an EARLIER LINK IN THE CHAIN. A hash chain orders records, it does not date them: that this link predates the first bet is the auditor\'s capture record — an ASSUMED premise, not independently authenticated timing (declared limitation L18), so the no-post-hoc-choice reading of it is CONDITIONAL on that attested chronology'
            : `pre-capture link BROKEN (commitment ${preCommitOk ? 'ok' : 'MISMATCH'}, link to epoch 0 ${preLinkOk ? 'ok' : 'MISMATCH'})`;
    }
    const s2 = (0, context_1.step)(2, 'Next-Seed Pre-Commitment Chain', promoFails === 0 && promoChecked === expectedTransitions && preOk ? 'PASS' : 'FAIL', (promoFails === 0
        ? `${promoChecked}/${expectedTransitions} transitions: nextHashedServerSeed == next epoch's hashedServerSeed (chain INTACT)`
        : `${promoChecked - promoFails}/${expectedTransitions} match; ${promoFails} mismatch`)
        + `; ${preState}`);
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
        //   • epoch size — the capture placed exactly meta.epochSize bets per pair, so a short epoch
        //                  exposes a dropped bet ANYWHERE (interior or last), a real invariant;
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
            // G-BIND: the epoch size comes from src/config.ts, NOT from
            // `ctx.meta.epochSize`. Read from the header, this guard catches only an INCOHERENT forgery —
            // a reviewer dropped nonces 30–49 from every epoch, set `meta.epochSize = 30`, and the line
            // agreed with the shrunken data. Against a coherent shrink a header-sourced bound is not an
            // invariant at all.
            if (epochBets.length !== config_1.EXPECTED_EPOCH_SIZE) {
                hardFailures.push(`Epoch ${epochNum}: ${epochBets.length} bets != audited epoch size ${config_1.EXPECTED_EPOCH_SIZE} (src/config.ts)`);
            }
            if (ctx.meta.epochSize !== config_1.EXPECTED_EPOCH_SIZE) {
                hardFailures.push(`Epoch ${epochNum}: dataset header epochSize ${ctx.meta.epochSize} != audited epoch size ${config_1.EXPECTED_EPOCH_SIZE}`);
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
    if (epochsChecked !== seeds.length)
        hardFailures.push(`coverage: audited ${epochsChecked}/${seeds.length} epochs`);
    let s4status;
    let s4detail;
    // A reconstructable capture-retry gap is a FLAG with origin = capture — NEVER a PASS. Profile
    // DICE-04 (decided 2026-09-17): an operator-side gap or repeat is a HARD FAIL; a gap the capture
    // log attributes to an auditor-side retry, where the revealed seed reconstructs every recorded
    // bet, is disclosed with a limitation row and counted, but is verdict-neutral (origin = capture
    // is not scored against the game). Returning PASS here would erase the disclosure. On THIS capture
    // every epoch is fully contiguous 0..49 so the branch does not fire, but the mechanism is present
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
        s4detail = `${epochsChecked} epochs: single client seed each, ${config_1.EXPECTED_EPOCH_SIZE} distinct contiguous nonces 0..${config_1.EXPECTED_EPOCH_SIZE - 1} (no interior gaps, no reuse); first nonce == nonceStart (capture default 0 — not operator-witnessed in this capture) in ${epochsChecked}/${seeds.length}; ${config_1.EXPECTED_EPOCH_SIZE}/${config_1.EXPECTED_EPOCH_SIZE} bets per epoch, epoch size bound to src/config.ts not to the dataset header (G-BIND); `
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

__require('', './tests/__standalone-entry.js');
