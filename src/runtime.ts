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

/** The Node major version this package is validated for and will run on. */
export const SUPPORTED_NODE_MAJOR = 22;

/** The exact runtime every committed figure was produced on. */
export const VALIDATED_RUNTIME = 'Node.js v22.23.1 (npm 10.9.8)';

export function nodeMajor(version: string = process.versions.node): number {
  return Number(version.split('.')[0]);
}

export function isSupportedRuntime(version: string = process.versions.node): boolean {
  return nodeMajor(version) === SUPPORTED_NODE_MAJOR;
}

export function unsupportedRuntimeMessage(version: string = process.versions.node): string {
  return [
    '',
    '══════════════════════════════════════════════════════════',
    '  UNSUPPORTED RUNTIME — verification refused',
    '══════════════════════════════════════════════════════════',
    `  Running on   : Node v${version}`,
    `  Supported    : Node ${SUPPORTED_NODE_MAJOR}.x`,
    `  Validated on : ${VALIDATED_RUNTIME}`,
    '',
    '  This suite compares stored statistics against recomputation: integers exactly, and',
    '  libm-dependent floats at 1e-14 absolute + 1e-12 relative (src/diff.ts). Its',
    '  probabilities are built from ** and from Math.exp/Math.log, which ECMAScript leaves',
    '  implementation-approximated, so a different V8 can move them — that is how',
    '  report-figures.json disagreed on cherryPickPower.pAtMinRejectable under Node 24.',
    '  Rather than widen the comparison — which is what makes a forged artifact visible —',
    '  this package refuses to score itself on a runtime it was not validated on.',
    '',
    `  Install Node ${SUPPORTED_NODE_MAJOR}.x and re-run. Nothing was written; no evidence was touched.`,
    '══════════════════════════════════════════════════════════',
    '',
  ].join('\n');
}

/** Refuse to run on an unvalidated runtime. Called before any scored step, and before any write. */
export function assertSupportedRuntime(): void {
  if (isSupportedRuntime()) return;
  console.error(unsupportedRuntimeMessage());
  process.exit(1);
}
