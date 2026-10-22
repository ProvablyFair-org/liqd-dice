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
 *   `points[].rtp` = 1.0375…              a WINDOW RTP legitimately ABOVE 1 — a short window mean is
 *                                         bounded by the paytable's largest multiplier, not by 1
 *   `serial.lag1` = 0.0027…               an autocorrelation, so [-1, 1] and often negative
 *   `serial.lag1Z` / `runsZ` / `.z`       signed z-scores, unbounded either way
 *   `cherryPickExpected` = 5.871…         an EXPECTED count, a REAL that is legitimately not an integer
 *   `expectedUpperBoundHits` = 0.4106     an expected count legitimately < 1
 *   `theoreticalEdgePct` = 1.0000…        an edge percent that can be NEGATIVE (player-favourable)
 *   `realizedRtpPct` = 103.56             a realised RTP over a finite sample, legitimately > 100
 *   `netUsdc` = 4.9e-8                     a signed settlement residual, either sign
 *
 * Because a mistake in this table would either wave through a forgery or reject an honest audit,
 * Step 19 (`tests/steps/standardization.ts`) asserts BOTH directions against the committed
 * artifacts on every run: every numeric leaf satisfies its domain, AND every numeric leaf PATH is
 * covered by an explicit rule. There is no silent fallback — a new numeric field with no declared
 * domain FAILS Step 19, so the class cannot reopen quietly.
 */

import {
  RANGE, SCALE, CURSOR, HOUSE_EDGE, MIN_ODDS, MAX_ODDS,
  SIM_UNIFORMITY_DRAWS, SIM_SERIAL_DRAWS, SIM_EDGE_BETS, SIM_RTP_BETS,
  SIM_TARGETS, SIM_TARGET_BETS, SIM_TARGET_SEED_COUNTER_BASE, SIM_TARGET_SEEDS_EACH,
  SIM_CHERRY_BINS, SIM_CHERRY_WINDOW, SIM_PASS2_NONCES, SIM_PASS2_EARLY_WINDOW,
  EXPECTED_BETS, EXPECTED_SEEDS,
} from './config';

export interface Domain {
  /** Short name used in the failure message. */
  readonly label: string;
  readonly ok: (v: number) => boolean;
}

const D = (label: string, ok: (v: number) => boolean): Domain => ({ label, ok });

// ── Primitive domains ────────────────────────────────────────────────────────────────────────────

/** Any real number that is not NaN/Infinity. The weakest domain; used only where the quantity
 *  genuinely has no physical bound (signed z-scores, signed residuals, signed deviations). */
export const FINITE = D('a finite number', v => Number.isFinite(v));
export const NONNEG_REAL = D('a non-negative real', v => Number.isFinite(v) && v >= 0);
export const POSITIVE_REAL = D('a strictly positive real', v => Number.isFinite(v) && v > 0);
export const NONNEG_INT = D('a non-negative integer', v => Number.isInteger(v) && v >= 0);
export const PROBABILITY = D('a probability in [0,1]', v => Number.isFinite(v) && v >= 0 && v <= 1);
export const CORRELATION = D('a correlation in [-1,1]', v => Number.isFinite(v) && v >= -1 && v <= 1);
export const PERCENT = D('a percentage in [0,100]', v => Number.isFinite(v) && v >= 0 && v <= 100);
/** A chi-squared statistic is a sum of squares over positive expectations. */
export const CHI_SQUARED = D('a non-negative chi-squared statistic', v => Number.isFinite(v) && v >= 0);

export const exactly = (target: number, what: string): Domain =>
  D(`exactly ${target} (${what})`, v => v === target);

export const intAtMost = (max: number, what: string): Domain =>
  D(`an integer in [0, ${max}] (${what})`, v => Number.isInteger(v) && v >= 0 && v <= max);

export const intBetween = (lo: number, hi: number, what: string): Domain =>
  D(`an integer in [${lo}, ${hi}] (${what})`, v => Number.isInteger(v) && v >= lo && v <= hi);

export const realBetween = (lo: number, hi: number, what: string): Domain =>
  D(`a real in [${lo}, ${hi}] (${what})`, v => Number.isFinite(v) && v >= lo && v <= hi);

// ── Derived domains — bounds from src/config.ts, never from a scored artifact ─────────────────────

/** The audited populations, stated in source (G-BIND). */
const SEED_COUNT = intAtMost(EXPECTED_SEEDS, 'audited seed population');
const BET_COUNT = intAtMost(EXPECTED_BETS, 'audited bet population');
const EPOCH_IDX = intAtMost(EXPECTED_SEEDS - 1, 'epoch index within the audited population');
const EXPECTED_OVER_SEEDS = realBetween(0, EXPECTED_SEEDS, 'expected count over the seed population');
const EXPECTED_OVER_BETS = realBetween(0, EXPECTED_BETS, 'expected count over the bet population');

/** A band bound (lower/upper) is a value on the 0..100 percent axis the roll grid maps onto. */
const BAND_BOUND = realBetween(0, SCALE, 'band bound on the 0..100 axis');
/** A served roll is draw/SCALE, so it lies in [0, (RANGE-1)/SCALE] = [0, 99.99]. */
const ROLL_VALUE = realBetween(0, (RANGE - 1) / SCALE, 'a roll value on the 2-dp grid');
/** A quoted multiplier lies within the operator's declared odds limits. */
const MULTIPLIER = realBetween(MIN_ODDS, MAX_ODDS, 'quoted multiplier within [MIN_ODDS, MAX_ODDS]');
/**
 * The attainable range of any PAYOUT AVERAGE — a theoretical RTP, a simulated RTP, or a WINDOW RTP.
 * A mean of drawn multipliers cannot fall outside 0 and the largest multiplier the game can pay
 * (MAX_ODDS). NOT [0,1]: a short window legitimately averages above 1 (`points[].rtp` = 1.0375). */
const RTP = realBetween(0, MAX_ODDS, 'attainable payout average in [0, MAX_ODDS]');
/** An RTP expressed as a PERCENT, so 100× the RTP domain — realizedRtpPct = 103.56 is honest. */
const RTP_PCT = realBetween(0, MAX_ODDS * SCALE, 'attainable payout average as a percent');
/**
 * A house-edge PERCENT. edge = 1 − RTP with RTP ∈ [0, MAX_ODDS], so as a percent it runs from
 * 100·(1 − MAX_ODDS) (a maximally player-favourable band) up to 100 (a zero-return band). Only the
 * impossible — an edge above 100% — is rejected; a negative edge is a real, disclosable outcome. */
const EDGE_PCT = realBetween(100 * (1 - MAX_ODDS), 100, 'house edge as a percent');

// ── The rule table ────────────────────────────────────────────────────────────────────────────────

export interface Rule {
  /** Matches a COLLAPSED leaf path: array indices are rendered as `[]`. */
  readonly path: RegExp;
  readonly domain: Domain;
}

/** Collapse `a.b[3].c` to `a.b[].c` so one rule covers every element of a list. */
export function collapsePath(path: string): string {
  return path.replace(/\[\d+\]/g, '[]');
}

/**
 * Every numeric leaf of each committed artifact, with the domain it physically admits.
 * Ordering matters: the FIRST matching rule wins, so narrower (anchored) patterns come first.
 */
export function domainRules(): Record<string, Rule[]> {
  return {
    // ── outputs/simulation-results.json ──────────────────────────────────────────────────────────
    'simulation-results.json': [
      // artifact schema version (1 = raw statistics only, 2 = also the integer counts behind them,
      // 3 = schema 2 plus the 98-target edge convergence and its cross-target mean).
      { path: /^\.schemaVersion$/, domain: intBetween(1, 3, 'artifact schema version') },
      // model: config echoes — must equal the src/config.ts constants exactly.
      { path: /^\.model\.range$/, domain: exactly(RANGE, 'RANGE') },
      { path: /^\.model\.cursor$/, domain: exactly(CURSOR, 'CURSOR') },
      { path: /^\.model\.scale$/, domain: exactly(SCALE, 'SCALE') },
      { path: /^\.model\.houseEdge$/, domain: exactly(HOUSE_EDGE, 'HOUSE_EDGE') },

      // pass1 — uniformity
      { path: /^\.pass1\.draws$/, domain: exactly(SIM_UNIFORMITY_DRAWS, 'SIM_UNIFORMITY_DRAWS') },
      { path: /^\.pass1\.uniformity\.bins$/, domain: intBetween(1, RANGE, 'histogram bins over the roll grid') },
      { path: /^\.pass1\.uniformity\.n$/, domain: exactly(SIM_UNIFORMITY_DRAWS, 'SIM_UNIFORMITY_DRAWS') },
      { path: /^\.pass1\.uniformity\.chi2$/, domain: CHI_SQUARED },
      { path: /^\.pass1\.uniformity\.df$/, domain: intBetween(1, RANGE, 'chi-squared degrees of freedom') },
      { path: /^\.pass1\.uniformity\.pValue$/, domain: PROBABILITY },

      // pass1 — serial screen
      { path: /^\.pass1\.serial\.n$/, domain: exactly(SIM_SERIAL_DRAWS, 'SIM_SERIAL_DRAWS') },
      { path: /^\.pass1\.serial\.lag1$/, domain: CORRELATION },
      { path: /^\.pass1\.serial\.(lag1Z|runsZ)$/, domain: FINITE },
      { path: /^\.pass1\.serial\.zCritical$/, domain: NONNEG_REAL },
      { path: /^\.pass1\.serial\.runsP$/, domain: PROBABILITY },
      // schema-2 runs cell counts (make runsZ re-derivable): a runs count and the count on one
      // side are integers in [0, n]; the expected count and variance are non-negative reals.
      { path: /^\.pass1\.serial\.runs$/, domain: intBetween(1, SIM_SERIAL_DRAWS, 'Wald–Wolfowitz runs count') },
      { path: /^\.pass1\.serial\.n1$/, domain: intBetween(0, SIM_SERIAL_DRAWS, 'observations on one side of the midpoint') },
      { path: /^\.pass1\.serial\.runsExpected$/, domain: POSITIVE_REAL },
      { path: /^\.pass1\.serial\.runsVariance$/, domain: NONNEG_REAL },

      // pass1 — RTP convergence
      { path: /^\.pass1\.rtpConvergence\.params\.(lower|upper)$/, domain: BAND_BOUND },
      { path: /^\.pass1\.rtpConvergence\.multiplier$/, domain: MULTIPLIER },
      { path: /^\.pass1\.rtpConvergence\.n$/, domain: exactly(SIM_RTP_BETS, 'SIM_RTP_BETS') },
      { path: /^\.pass1\.rtpConvergence\.marks\[\]$/, domain: intBetween(1, SIM_RTP_BETS, 'a convergence sample size') },
      { path: /^\.pass1\.rtpConvergence\.(theoreticalRTP|finalRTP|finalRTPRunning)$/, domain: RTP },
      { path: /^\.pass1\.rtpConvergence\.points\[\]\.n$/, domain: intBetween(1, SIM_RTP_BETS, 'a convergence sample size') },
      { path: /^\.pass1\.rtpConvergence\.points\[\]\.wins$/, domain: intBetween(0, SIM_RTP_BETS, 'schema-2 integer win count behind a convergence point') },
      { path: /^\.pass1\.rtpConvergence\.points\[\]\.rtp$/, domain: RTP },
      { path: /^\.pass1\.rtpConvergence\.points\[\]\.se$/, domain: NONNEG_REAL },

      // pass1 — effective-edge bands
      { path: /^\.pass1\.effectiveEdge\[\]\.params\.(lower|upper)$/, domain: BAND_BOUND },
      { path: /^\.pass1\.effectiveEdge\[\]\.quotedMultiplier$/, domain: MULTIPLIER },
      { path: /^\.pass1\.effectiveEdge\[\]\.discreteWinPct$/, domain: PERCENT },
      { path: /^\.pass1\.effectiveEdge\[\]\.(theoreticalRTP|simulatedRTP)$/, domain: RTP },
      { path: /^\.pass1\.effectiveEdge\[\]\.theoreticalEdgePct$/, domain: EDGE_PCT },
      { path: /^\.pass1\.effectiveEdge\[\]\.deltaSE$/, domain: FINITE },
      { path: /^\.pass1\.effectiveEdge\[\]\.tolSE$/, domain: POSITIVE_REAL },
      { path: /^\.pass1\.effectiveEdge\[\]\.n$/, domain: exactly(SIM_EDGE_BETS, 'SIM_EDGE_BETS') },
      { path: /^\.pass1\.effectiveEdge\[\]\.wins$/, domain: intBetween(0, SIM_EDGE_BETS, 'schema-2 integer win count behind a band RTP') },
      { path: /^\.pass1\.effectiveEdge\[\]\.se$/, domain: NONNEG_REAL },

      // pass1 — edge convergence on the 98 over-mode targets, each with its per-mark running series
      { path: /^\.pass1\.targets\[\]\.params\.(lower|upper)$/, domain: BAND_BOUND },
      { path: /^\.pass1\.targets\[\]\.seedCounterFirst$/, domain: intBetween(SIM_TARGET_SEED_COUNTER_BASE, SIM_TARGET_SEED_COUNTER_BASE + (SIM_TARGETS.length - 1) * SIM_TARGET_SEEDS_EACH, 'a target\'s first position in the pinned seed stream') },
      { path: /^\.pass1\.targets\[\]\.seedCounterCount$/, domain: exactly(SIM_TARGET_SEEDS_EACH, 'SIM_TARGET_SEEDS_EACH') },
      { path: /^\.pass1\.targets\[\]\.quotedMultiplier$/, domain: MULTIPLIER },
      { path: /^\.pass1\.targets\[\]\.discreteWinPct$/, domain: PERCENT },
      { path: /^\.pass1\.targets\[\]\.(theoreticalRTP|simulatedRTP)$/, domain: RTP },
      { path: /^\.pass1\.targets\[\]\.theoreticalEdgePct$/, domain: EDGE_PCT },
      { path: /^\.pass1\.targets\[\]\.deltaSE$/, domain: FINITE },
      { path: /^\.pass1\.targets\[\]\.tolSE$/, domain: POSITIVE_REAL },
      { path: /^\.pass1\.targets\[\]\.n$/, domain: exactly(SIM_TARGET_BETS, 'SIM_TARGET_BETS') },
      { path: /^\.pass1\.targets\[\]\.wins$/, domain: intBetween(0, SIM_TARGET_BETS, 'integer win count behind a target RTP') },
      { path: /^\.pass1\.targets\[\]\.se$/, domain: NONNEG_REAL },
      { path: /^\.pass1\.targets\[\]\.marks\[\]\.n$/, domain: intBetween(1, SIM_TARGET_BETS, 'a per-target sample size') },
      { path: /^\.pass1\.targets\[\]\.marks\[\]\.wins$/, domain: intBetween(0, SIM_TARGET_BETS, 'integer win count at a mark') },
      { path: /^\.pass1\.targets\[\]\.marks\[\]\.rtp$/, domain: RTP },
      { path: /^\.pass1\.targets\[\]\.marks\[\]\.se$/, domain: NONNEG_REAL },

      // pass1 — the 98-target mean RTP series (the convergence chart)
      { path: /^\.pass1\.targetConvergence\.targets$/, domain: exactly(SIM_TARGETS.length, 'SIM_TARGETS.length') },
      { path: /^\.pass1\.targetConvergence\.perTargetBets$/, domain: exactly(SIM_TARGET_BETS, 'SIM_TARGET_BETS') },
      { path: /^\.pass1\.targetConvergence\.totalBets$/, domain: exactly(SIM_TARGETS.length * SIM_TARGET_BETS, 'SIM_TARGETS.length × SIM_TARGET_BETS') },
      { path: /^\.pass1\.targetConvergence\.marks\[\]$/, domain: intBetween(1, SIM_TARGET_BETS, 'a per-target sample size') },
      { path: /^\.pass1\.targetConvergence\.(theoreticalRTP|finalRTP)$/, domain: RTP },
      { path: /^\.pass1\.targetConvergence\.(finalSE|finalDeltaSE)$/, domain: NONNEG_REAL },
      { path: /^\.pass1\.targetConvergence\.points\[\]\.n$/, domain: intBetween(1, SIM_TARGET_BETS, 'a per-target sample size') },
      { path: /^\.pass1\.targetConvergence\.points\[\]\.rtp$/, domain: RTP },
      { path: /^\.pass1\.targetConvergence\.points\[\]\.se$/, domain: NONNEG_REAL },

      // pass2 — cherry-pick screen + exact null
      { path: /^\.pass2\.seedsTested$/, domain: SEED_COUNT },
      { path: /^\.pass2\.(nullPartitions|nullSupportValues)$/, domain: NONNEG_INT },
      { path: /^\.pass2\.cherryWindow$/, domain: exactly(SIM_CHERRY_WINDOW, 'SIM_CHERRY_WINDOW') },
      { path: /^\.pass2\.cherryBins$/, domain: exactly(SIM_CHERRY_BINS, 'SIM_CHERRY_BINS') },
      { path: /^\.pass2\.(cherrySeedAlphaNominal|cherrySeedAlphaAchieved|cherryPickP0|cherryPickBinomialP|cherryPickAlpha)$/, domain: PROBABILITY },
      { path: /^\.pass2\.cherryPickFlags$/, domain: SEED_COUNT },
      { path: /^\.pass2\.cherryPickExpected$/, domain: EXPECTED_OVER_SEEDS },
      { path: /^\.pass2\.pooledRealRollUniformity\.n$/, domain: BET_COUNT },
      { path: /^\.pass2\.pooledRealRollUniformity\.chi2$/, domain: CHI_SQUARED },
      { path: /^\.pass2\.pooledRealRollUniformity\.df$/, domain: intBetween(1, RANGE, 'chi-squared degrees of freedom') },
      { path: /^\.pass2\.pooledRealRollUniformity\.pValue$/, domain: PROBABILITY },
      { path: /^\.pass2\.perSeed\[\]\.epoch$/, domain: EPOCH_IDX },
      // earlySq/lateSq are sums of squared bin counts over one window — a non-negative real.
      { path: /^\.pass2\.perSeed\[\]\.(earlySq|lateSq)$/, domain: NONNEG_REAL },
      { path: /^\.pass2\.perSeed\[\]\.(earlyChi2|lateChi2)$/, domain: CHI_SQUARED },
      { path: /^\.pass2\.perSeed\[\]\.(earlyP|lateP)$/, domain: PROBABILITY },

      // pass2 — served-band payout-weighted return scan (DICE-21, load-bearing). A return / expected
      // return / variance is a non-negative real; the aggregate z is a signed z-score; the aggregate
      // p and alpha are probabilities; the direction counts and epoch count are over the seed
      // population; the detection power is a non-negative pp value.
      { path: /^\.pass2\.servedBand\.nonces$/, domain: exactly(SIM_PASS2_NONCES, 'SIM_PASS2_NONCES') },
      { path: /^\.pass2\.servedBand\.earlyWindow$/, domain: exactly(SIM_PASS2_EARLY_WINDOW, 'SIM_PASS2_EARLY_WINDOW') },
      { path: /^\.pass2\.servedBand\.alpha$/, domain: PROBABILITY },
      { path: /^\.pass2\.servedBand\.epochs$/, domain: SEED_COUNT },
      { path: /^\.pass2\.servedBand\.(totalEarlyReturn|totalEarlyExpected|totalEarlyVar)$/, domain: NONNEG_REAL },
      { path: /^\.pass2\.servedBand\.(directionBelow|directionAbove)$/, domain: SEED_COUNT },
      { path: /^\.pass2\.servedBand\.aggEarlyZ$/, domain: FINITE },
      { path: /^\.pass2\.servedBand\.aggEarlyP$/, domain: PROBABILITY },
      { path: /^\.pass2\.servedBand\.minDetectablePerBetPct$/, domain: NONNEG_REAL },
      { path: /^\.pass2\.servedBand\.perEpoch\[\]\.(earlyN|refN)$/, domain: intBetween(0, SIM_PASS2_NONCES, 'nonces in a Pass-2 window') },
      { path: /^\.pass2\.servedBand\.perEpoch\[\]\.(earlyReturn|earlyExpected|earlyVar|refReturn|refExpected|refVar)$/, domain: NONNEG_REAL },
    ],

    // ── outputs/report-figures.json ────────────────────────────────────────────────────────────────
    'report-figures.json': [
      { path: /^\.bets$/, domain: BET_COUNT },
      { path: /^\.wins$/, domain: BET_COUNT },

      { path: /^\.settledRtp\.(belowNominal|aboveNominal|exactlyNominal)$/, domain: BET_COUNT },
      { path: /^\.settledRtp\.(minPct|maxPct|nominalPct)$/, domain: RTP_PCT },

      { path: /^\.settlementResidual\.(roundedDown|roundedUp|exactlyOnProduct|exactTies)$/, domain: BET_COUNT },
      { path: /^\.settlementResidual\.maxAbsUsdc$/, domain: NONNEG_REAL },
      { path: /^\.settlementResidual\.netUsdc$/, domain: FINITE },

      { path: /^\.boundary\.(betsWithReachableUpperBound|betsWithUnreachableUpperBound|observedUpperBoundHits|observedLowerBoundHits|betsWhereBoundaryModelsDisagree|winFlagsReproducedHalfOpen|winFlagsReproducedInclusiveBothEnds)$/, domain: BET_COUNT },
      { path: /^\.boundary\.expectedUpperBoundHits$/, domain: EXPECTED_OVER_BETS },

      { path: /^\.cherryPickPower\.seeds$/, domain: SEED_COUNT },
      { path: /^\.cherryPickPower\.(nullFlagRate|pAtMinRejectable|alpha|seedAlphaNominal)$/, domain: PROBABILITY },
      { path: /^\.cherryPickPower\.expectedFlags$/, domain: EXPECTED_OVER_SEEDS },
      { path: /^\.cherryPickPower\.minRejectableFlags$/, domain: SEED_COUNT },

      { path: /^\.phaseD\.(firstEpoch|lastEpoch)$/, domain: EPOCH_IDX },
      { path: /^\.phaseD\.epochs$/, domain: SEED_COUNT },
      { path: /^\.phaseD\.bets$/, domain: BET_COUNT },
      { path: /^\.phaseD\.(stakedUsdc|paidUsdc|expectedUsdc)$/, domain: NONNEG_REAL },
      { path: /^\.phaseD\.z$/, domain: FINITE },

      { path: /^\.live\.(wageredUsdc|returnedUsdc)$/, domain: NONNEG_REAL },
      { path: /^\.live\.realizedRtpPct$/, domain: RTP_PCT },
      { path: /^\.live\.meanRoll$/, domain: ROLL_VALUE },
    ],
  };
}

export interface DomainViolation {
  path: string;
  value: number;
  expected: string;
}

/** Collect every numeric leaf of `doc` as `[collapsedPath, value]`. */
export function numericLeaves(doc: unknown, path = '', out: [string, number][] = []): [string, number][] {
  if (typeof doc === 'number') { out.push([collapsePath(path), doc]); return out; }
  if (doc === null || typeof doc !== 'object') return out;
  if (Array.isArray(doc)) {
    doc.forEach((v, i) => numericLeaves(v, `${path}[${i}]`, out));
    return out;
  }
  for (const [k, v] of Object.entries(doc as Record<string, unknown>)) numericLeaves(v, `${path}.${k}`, out);
  return out;
}

/**
 * Validate every numeric leaf of `doc` against `rules`.
 *
 * A leaf matched by NO rule is a violation in its own right (`uncovered`). That is deliberate: an
 * unbounded new field is precisely how this class reopens, and a silent fallback to "must be finite"
 * would have accepted the impossible `-1`.
 */
export function validateDomains(doc: unknown, rules: Rule[]): { violations: DomainViolation[]; uncovered: string[]; checked: number } {
  const violations: DomainViolation[] = [];
  const uncovered: string[] = [];
  const leaves = numericLeaves(doc);
  for (const [p, v] of leaves) {
    const rule = rules.find(r => r.path.test(p));
    if (!rule) {
      if (!uncovered.includes(p)) uncovered.push(p);
      continue;
    }
    if (!rule.domain.ok(v)) violations.push({ path: p, value: v, expected: rule.domain.label });
  }
  return { violations, uncovered, checked: leaves.length };
}

/** One-line summaries for a step's detail string. */
export function describeDomainFailures(artifact: string, r: { violations: DomainViolation[]; uncovered: string[] }): string[] {
  const out: string[] = [];
  for (const v of r.violations.slice(0, 4)) {
    out.push(`${artifact}${v.path} = ${v.value} is not ${v.expected}`);
  }
  if (r.violations.length > 4) out.push(`${artifact}: +${r.violations.length - 4} more impossible value(s)`);
  for (const p of r.uncovered.slice(0, 4)) {
    out.push(`${artifact}${p} has no declared value domain (add one in src/domains.ts)`);
  }
  if (r.uncovered.length > 4) out.push(`${artifact}: +${r.uncovered.length - 4} more undeclared field(s)`);
  return out;
}
