/**
 * Step 22 — Live-Sample Serial Independence (informational; profile check DICE-22, policy
 * INFORMATIONAL — 2026-09-29).
 *
 * WHAT IT CARRIES. DICE-22 asserts the captured rolls fit the uniform lattice AND show no serial
 * dependence, informational only. The uniform-lattice-fit half is the pooled real-roll χ² in
 * Step 17, recomputed from the dataset on all 6,700 rolls — and it too is INFORMATIONAL: a fit
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
 * WHY IT NEVER BEARS THE VERDICT. A 6,700-roll serial screen has little power and the profile fixes
 * DICE-22 at policy INFORMATIONAL (2026-09-29). So when the screen trips this step returns INFO,
 * which verify.ts reports but never counts as a flag and never lets change the verdict (Full Pass,
 * exit 0).
 * The authoritative serial-independence evidence remains the Pass-1 simulation over fresh seeds
 * (Step 16), whose 200,000-roll screen has the power this 6,700-roll one does not. This step is the
 * live-sample cross-check the profile asks for, at the power a live sample affords.
 *
 * THE THRESHOLD is the framework's cross-game serial-independence rule — |lag1 z| < 3 AND runs
 * p ≥ 0.01 — the same rule the Pass-1 serial screen and every sibling audit apply, not a bespoke
 * bound invented here. Runs are taken about the 50.00 midpoint of the [0.00, 99.99] roll range.
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { lag1Autocorrelation, runsTest } from '../../src/stats';
import { EXPECTED_BETS } from '../../src/config';

/** Framework cross-game serial-independence thresholds (informational live-fit). */
const LAG1_Z_MAX = 3;
const RUNS_P_MIN = 0.01;
/** Midpoint of the [0.00, 99.99] roll range — the runs test's dichotomy. */
const ROLL_MIDPOINT = 50;

export function run(ctx: VerifyContext): StepResult[] {
  // Capture order: the dataset array as loaded (chronological within the capture). A per-bet nonce
  // reorder would be caught by Step 4; here the ORDER itself is the object under test.
  const rolls = ctx.bets.map((b) => Number(b.roll));
  const n = rolls.length;

  // Population bound to the code constant (G-BIND): the serial screen must run on the whole audited
  // population, not on whatever count the dataset header claims. Step 11 / DICE-05 already binds
  // bets.length to EXPECTED_BETS; this re-asserts it locally so a truncated input cannot quietly
  // shrink the sample the screen is computed over.
  const populationOk = n === EXPECTED_BETS;

  const lag1 = lag1Autocorrelation(rolls);
  const lag1Z = lag1 * Math.sqrt(n);
  const runsSeq = rolls.map((r) => (r >= ROLL_MIDPOINT ? 1 : 0));
  const runs = runsTest(runsSeq);

  const independent = populationOk
    && Number.isFinite(lag1Z) && Math.abs(lag1Z) < LAG1_Z_MAX
    && runs.variance > 0 && runs.pValue >= RUNS_P_MIN;

  const detail =
    `serial independence of the ${n} captured rolls in capture order (pinned population ${EXPECTED_BETS}${populationOk ? '' : ' — MISMATCH'}): `
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
      ? step(22, 'Live-Sample Serial Independence (informational)', 'PASS', detail)
      : step(22, 'Live-Sample Serial Independence (informational)', 'INFO', detail),
  ];
}
