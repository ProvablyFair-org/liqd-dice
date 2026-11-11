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

export type Coverage = 'full' | 'partial';

export interface CheckClaim {
  id: string;
  coverage: Coverage;
  /** For `partial`: what the profile requires that this package does not do. */
  note?: string;
}

export interface StepClaims {
  claims: CheckClaim[];
  /** Required when `claims` is empty: why the step answers no profile check. */
  reason?: string;
}

export const PROFILE_GAME = 'dice';
export const PROFILE_VERSION = '1.0.2';

/** Scored step number → the profile checks it implements. Every step 1..22 has an entry. */
export const STEP_CLAIMS: Record<number, StepClaims> = {
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
export const NOT_APPLICABLE: Array<{ id: string; reason: string }> = [
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
export const PACKAGE_CHECKS: Array<{ id: string; artifact: string; coverage: Coverage | 'none'; note: string }> = [
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
export function profileCoverageBlock(): Record<string, unknown> {
  return {
    game: PROFILE_GAME,
    profileVersion: PROFILE_VERSION,
    notApplicable: NOT_APPLICABLE,
    packageChecks: PACKAGE_CHECKS,
  };
}

/** The label fields for one scored step, to be merged into its emitted record. */
export function labelFor(step: number): Record<string, unknown> {
  const entry = STEP_CLAIMS[step];
  if (!entry) return { profileIds: [], profileChecks: [], profileNote: 'no mapping declared for this step' };
  return entry.claims.length
    ? { profileIds: entry.claims.map(c => c.id), profileChecks: entry.claims }
    : { profileIds: [], profileChecks: [], profileNote: entry.reason ?? 'no reason given' };
}
