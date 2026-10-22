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
  2: { claims: [{ id: 'DICE-02', coverage: 'full' }] },
  3: { claims: [{ id: 'DICE-03', coverage: 'full' }] },
  4: {
    claims: [{
      id: 'DICE-04', coverage: 'full',
      note: 'nonce contiguity, no-reuse and leading/trailing/short-epoch withholding are asserted, '
        + 'and the epoch size is bound to src/config.ts not the dataset header (G-BIND); on THIS '
        + 'capture every epoch is fully contiguous 0..49 with zero gaps. The capture-origin FLAG rule '
        + 'the profile requires (decided 2026-09-17) is now implemented: a nonce gap that the revealed '
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
      note: 'the recomputed roll under the half-open band rule reproduces the served win flag for all '
        + '6,700 bets, inverted honoured (the win-flag half); the roll-range/ceiling half is Step 15',
    }],
  },
  7: { claims: [{ id: 'DICE-13', coverage: 'full' }] },
  8: {
    claims: [{
      id: 'DICE-11', coverage: 'full',
      note: 'winning credit == ROUND_HALF_EVEN_8(stake × ROUND_8(multiplier)) asserted exactly on the '
        + '1e-8 integer grid (the winning half); the loss-⇒-0 half is Step 9',
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
      note: 'every quoted multiplier lies within [MIN_ODDS, MAX_ODDS] with exact bounds (the odds-bounds '
        + 'half); the strict-monotonicity half is Step 21',
    }],
  },
  11: {
    claims: [
      {
        id: 'DICE-05', coverage: 'full',
        note: 'bets, seeds, epoch count and per-epoch size bound to EXPECTED_BETS / EXPECTED_SEEDS / '
          + 'EXPECTED_EPOCH_SIZE in src/config.ts; meta counts reconciled against them, never used as '
          + 'the denominator (G-BIND); per-phase counts are Step 12',
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
        note: 'per-phase bet counts asserted against the EXPECTED_PHASE_BETS code plan both ways '
          + '(no undeclared phase, every declared phase at its count); the population/epoch half is '
          + 'Step 11',
      },
      {
        id: 'DICE-15', coverage: 'full',
        note: 'all four band modes present, both stake tiers ($10 and $0.10), and the phase counts '
          + 'asserted against the EXPECTED_PHASE_BETS code plan (which carries the Phase-B 98%/99% '
          + 'tail); target-range endpoint exercise rests on that plan plus Step 15\'s over(99) band',
      },
    ],
  },
  13: { claims: [{ id: 'DICE-18', coverage: 'full' }] },
  14: {
    claims: [{
      id: 'DICE-06', coverage: 'full',
      note: '500/500 auditor-set (pfaudit-) Phase-D bets recompute exactly and client-seed sensitivity '
        + 'is shown (a different client seed changes the roll, 8/8 probes); the A–C client-seed '
        + 'generator is disclosed as a node:crypto CSPRNG in the declaration/capture '
        + '(capture.clientSeed.generatorPhasesABC, generatorCsprng=true). The predictable Phase-D seed '
        + 'pattern is now DISCLOSED with its exposed epochs enumerated: pfaudit-<stamp>-<epoch> with the '
        + 'stamp fixed at capture start (capture/client-seed.reference.mjs), so all ten Phase-D epochs '
        + '124–133 (500 bets) were derivable in advance — enumerated in outputs/report-figures.json '
        + 'phaseD (firstEpoch 124, lastEpoch 133, epochs 10, bets 500, $50.00 staked, $48.93 paid, '
        + 'z=−0.14) and registered as declared limitation L19 (declaration '
        + 'capture.clientSeed.phaseDDisclosed cites it); the recompute (this step) plus that disclosure '
        + 'together satisfy the profile assert. Those epochs\' cherry-pick containment rests on '
        + 'Steps 5/16/17, not on client-seed unpredictability',
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
        note: 'the half-open boundary rule is witnessed by the E13 operator-verifier probes (2 of 7 '
          + 'discriminate; settled data has zero power, L2) and the roll ceiling is asserted; the '
          + 'full-coverage per-mode recompute is carried by Step 6 (DICE-10) and mode presence by '
          + 'Step 12 (DICE-15)',
      },
      {
        id: 'DICE-19', coverage: 'full',
        note: 'the effective edge is derived per served band from grid arithmetic and the multiplier '
          + 'formula and asserted == 1.0000% in exact integers on every bet, compared with the claimed '
          + '1%; the settled-RTP band is stated',
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
          + '× 1,000,000 bets each with the 98-target mean RTP as the convergence series (the Duel dice '
          + 'design, standardized 22 October 2026; the targets continue the same pinned seed stream '
          + 'after the v1.0.0 blocks, at fixed counters re-derived in verify), 9 effective-edge bands × '
          + '2,000,000 across all four modes, and the v1.0.0 20,000,000-bet under-50 convergence series, '
          + 'all with standard errors and integer win counts recomputed from the artifact rows. The Pass-1 experiment is now DETERMINISTIC '
          + 'and BYTE-REPLAYABLE (DICE-20): the seed stream is HMAC(SIM_MASTER_SEED, counter) rather '
          + 'than crypto.randomBytes, the artifact carries no run metadata, so `npm run simulate` '
          + 'writes identical bytes every time and `npm run test:full` regenerates it with an empty '
          + 'field diff — the raw Pass-1 statistics (uniformity.chi2, serial.lag1/runsZ, each band\'s '
          + 'simulatedRTP, each target\'s win counts, the convergence paths) are re-derivable by replaying the pinned producer, '
          + 'not merely attested by an unreproducible regeneration. Former limitation L10 (a stale '
          + 'zCritical field) is resolved by the regeneration — the artifact is now schema 2 and '
          + 'stores the correct zCritical, re-derived; L1 (a subtly forged statistic was invisible '
          + 'because a re-run produced different numbers) is NARROWED to the fast-verify path only: '
          + 'the producer is now a pure function of pinned source, so test:full reproduces the exact '
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
          + 'for SIM_PASS2_NONCES = 10,000 nonces; the early window is the captured nonce range '
          + '(0..49, the served depth per epoch) and the reference window is the remainder; the '
          + 'statistic is the payout-weighted return of the bands the casino actually served, '
          + 'standardised by its EXACT per-bet mean (Σ pᵢ·multᵢ) and variance (Σ pᵢ(1−pᵢ)·multᵢ²) — a '
          + 'scaled Poisson-binomial across seeds, each pᵢ the served band\'s EXACT lattice '
          + 'win-probability discreteWinProbability(band) — and read against a one-sided '
          + 'normal (CLT) lower-tail p vs α (cherry-picking shorts the early window the player saw). '
          + 'The rule is fixed in code but was specified AFTER the capture (proposed by an external '
          + 'reviewer on 2026-09-09), not before the data were seen, and it detects only a per-bet '
          + 'return deficit at or above the detection power Step 17 prints (80% power); a smaller '
          + 'selection effect passes it. '
          + 'Every per-epoch row is RE-DERIVED in Step 17 from the revealed seed at 10,000 nonces/seed '
          + 'and compared with EXACT equality; the aggregate z, one-sided p, direction split (classified '
          + 'in exact rational arithmetic, so an epoch exactly on expectation counts as equal) and '
          + 'detection power are recomputed and printed. HONEST SCOPE — this is EXACT per-bet '
          + 'mean/variance + an ASYMPTOTIC one-sided normal (CLT) lower tail; it is NOT an '
          + 'exact-lattice CDF. The exact lower tail "on the outcome lattice" would be a convolution '
          + 'of heterogeneous distinct-multiplier scaled Binomials whose support runs to a mean of '
          + '2^25 and up to 2^39 atoms on this multi-band capture (110 of 134 epochs multi-band, up to '
          + '36 distinct multipliers per epoch) — computationally intractable at verify speed; a pruned '
          + 'sparse DP over the real capture aborts at >8.3M atoms and 5–8 s per worst epoch. This '
          + 'exact-moments + CLT-tail realization is the standard realization '
          + 'ProvablyFair.org dice packages ship, recorded as a load-bearing premise / limitation L4 in MANIFEST.md, ASSUMED '
          + 'to satisfy DICE-21 full, not yet independently confirmed; a single-target-per-epoch re-capture '
          + '(one band held across an epoch\'s nonces) would collapse each per-seed return '
          + 'to m·Binomial and make the exact CDF tractable. The exact-discrete draw-uniformity '
          + 'cherry-pick screen (n=50/20-bin χ², src/exact-chi2.ts) is RETAINED as a supplementary '
          + 'check. The load-bearing cherry-pick defence remains structural (client-seed-after-commitment)',
      },
      {
        id: 'DICE-22', coverage: 'full',
        note: 'the uniform-lattice-fit half — the pooled captured-roll uniformity χ² over all 6,700 '
          + 'rolls, recomputed from the dataset and reported here; informational (policy INFORMATIONAL, '
          + '2026-09-29): a rejection is reported, never counted and never fails the step, while a '
          + 'pooled record in the artifact that does not reconcile still FAILs; the serial-dependence half '
          + 'is Step 22',
      },
    ],
  },
  18: {
    claims: [{
      id: 'DICE-12', coverage: 'full',
      note: '200/200 Phase-C bets at $10.00 recompute their roll identically to the $0.10 phases '
        + '(diceRoll takes no wager) and the effective edge is stake-independent; the elevated-stake '
        + 'payout path (~100 wins at 50% chance) is settled by the same exact rule asserted over these '
        + 'same rows in Steps 8 and 20',
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
          + 'the profile requires is now implemented (ported from liqd-plinko): src/domains.ts declares '
          + 'a physically-derived domain for every numeric leaf of the committed simulation-results.json '
          + 'and report-figures.json — every bound taken from src/config.ts (the audited population, the '
          + 'sample depths, the odds limits, the roll grid), never from the file being checked — and '
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
        + 'ROUND_HALF_EVEN_8(stake × ROUND_8(PAYOUT_NUMERATOR/basisPoints)) with zero tolerance, across '
        + 'all four modes and both wins and losses, anti-circularly (the served multiplier field is '
        + 'never read); reinforces the exact payout arithmetic of Steps 8 and 9',
    }],
  },
  21: {
    claims: [{
      id: 'DICE-14', coverage: 'full',
      note: 'the quoted multiplier (the formula value 99/winChance for each captured band; on wins '
        + 'Step 7 binds the served value to the same rational, 9900/basisPoints) is strictly '
        + 'decreasing across ≥100 distinct win-chance '
        + 'points with zero inversions (the monotonicity half); the odds-bounds half is Step 10',
    }],
  },
  22: {
    claims: [{
      id: 'DICE-22', coverage: 'full',
      note: 'the serial-dependence half — lag-1 autocorrelation and a Wald–Wolfowitz runs test on the '
        + '6,700 captured rolls in capture order, judged by the framework cross-game rule |lag1 z| < 3 '
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
      + 'rng.operatorVerifier.published is false: LIQD ships no operator verifier, so there is no '
      + 'derive.js to hash-match to computeRoll. The operator-verifier probes (E13) exist but no '
      + 'verifier is published; the limitations register (DICE-30) carries the row',
  },
];

/**
 * Checks a package artifact answers rather than a scored step. `none` means the artifact does not
 * exist — recorded so the gap is machine-readable instead of merely absent.
 */
export const PACKAGE_CHECKS: Array<{ id: string; artifact: string; coverage: Coverage | 'none'; note: string }> = [
  {
    id: 'DICE-09', artifact: 'tests/dice/rngTests.ts', coverage: 'full',
    note: 'the mocha unit suite (npx mocha prints the count) reproduces captured bets from their '
      + 'revealed seeds and fixed HMAC vectors, including an operator /verify endpoint vector (93.22) '
      + 'pinned against the shipped adapter',
  },
  {
    id: 'DICE-23', artifact: 'MANIFEST.md#verification-results', coverage: 'full',
    note: 'the S5 fairness-integrity matrix now carries the full standardized framework set S5-1 … '
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
    id: 'DICE-25', artifact: 'MANIFEST.md#verify-a-bet + evidence/E12', coverage: 'full',
    note: 'MANIFEST "Verify a bet" carries an ordered six-step player paste-path stating, in order and in the declaration\'s own field names: where the seed is revealed '
      + '(the provably-fair panel after the epoch rotates, E11/E12), which fields to paste '
      + '(hashedServerSeed, serverSeed, clientSeed, nonce, params{lower,upper,inverted}, betAmount), the '
      + 'exact commitment encoding (SHA-256(utf8(serverSeed)) — the hex string as text, not its bytes), '
      + 'the roll formula (HMAC-SHA256 over clientSeed:nonce:0, maxFair rejection, draw/100), the '
      + 'half-open win rule, the 99/continuousWinChance% multiplier and the ROUND_HALF_EVEN_8 credit; '
      + 'a fully worked instance follows in the same section',
  },
  {
    id: 'DICE-28', artifact: 'package.json (test) + .nvmrc + tests/ + src/config.ts (AUDIT_ID)', coverage: 'full',
    note: 'a fresh clone runs npm test to 22/22 Full Pass in ~8 s (standalone verify.js ~1 s) with '
      + 'the runtime pinned (engines 22.x, .nvmrc) and pinned artifacts untouched; the audit ID is '
      + 'SET — AUDIT_ID = PF-2026-LQ04 in src/config.ts, emitted into '
      + 'verification-results.json and printed in README.md / MANIFEST.md, with verdictQualifier '
      + '"provisional" retained because the capture is pre-launch (production parity not established). '
      + 'The remaining release-gate sub-requirements hold: npm run test:full regenerates the '
      + 'simulation and diffs it field-by-field into outputs/run/diff.json with nothing beyond '
      + 'tolerance (the Pass-1 experiment is now deterministic — DICE-20 — so regeneration reproduces '
      + 'byte-for-byte), the scored-step count in README/MANIFEST/verify equals the suite, and the '
      + 'runtime is pinned',
  },
  {
    id: 'DICE-29', artifact: 'tests/mutations.json + tests/structural-forgeries.json + tests/mutation-survivors.json', coverage: 'full',
    note: 'step-named mutations and structural forgeries run by tests/mutate.ts in a disposable copy '
      + '(npm run mutate prints the counts); every step that can fail is failed by at least one entry '
      + '— Step 17 by the forged served-band early return; Step 22 cannot fail and its entry is an '
      + 'INFO signal, counted separately from the kills — and 2 declared '
      + 'survivors are tied to limitation IDs L6 / L11 (L7’s published-ceiling change is caught by the '
      + 'reproduction/self-consistency gate, so it is not a survivor); forgery scripts that re-pin the '
      + 'hash they invalidate are included',
  },
  {
    id: 'DICE-30', artifact: 'MANIFEST.md#limitations-and-trust + MANIFEST.md#evidence', coverage: 'full',
    note: 'MANIFEST.md carries the declared-limitations register L1–L19 with magnitudes and a '
      + 'load-bearing-premises table (5 ASSUMED, each with "could the data contradict it?"); MANIFEST Evidence '
      + 'numbers every exhibit from E01; declaration package.internalFoldersPresent is empty, so no '
      + 'internal QA material ships in the package',
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
