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

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SUPPORTED_NODE_MAJOR, VALIDATED_RUNTIME, nodeMajor, isSupportedRuntime, unsupportedRuntimeMessage } from '../../src/runtime';

describe('supported runtime', () => {
  it('this runtime is the one the package was validated on', () => {
    assert.strictEqual(isSupportedRuntime(), true,
      unsupportedRuntimeMessage());
  });

  it('the declared runtime and package.json engines agree', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
    assert.strictEqual(pkg.engines?.node, `${SUPPORTED_NODE_MAJOR}.x`);
    assert.ok(VALIDATED_RUNTIME.includes(`v${SUPPORTED_NODE_MAJOR}.`),
      `VALIDATED_RUNTIME "${VALIDATED_RUNTIME}" is not a ${SUPPORTED_NODE_MAJOR}.x version`);
  });

  it('rejects the runtimes the package was NOT validated on', () => {
    assert.strictEqual(isSupportedRuntime('24.13.1'), false, 'a Node 24 version string — the major the D1 failure was reported on');
    assert.strictEqual(isSupportedRuntime('20.11.0'), false, 'the runtime the old README advertised');
    assert.strictEqual(isSupportedRuntime('23.0.0'), false);
    assert.strictEqual(isSupportedRuntime('22.0.0'), true);
    assert.strictEqual(nodeMajor('24.13.1'), 24);
  });

  it('the refusal message names the runtime, the requirement and what to do', () => {
    const msg = unsupportedRuntimeMessage('24.13.1');
    assert.match(msg, /UNSUPPORTED RUNTIME/);
    assert.match(msg, /Running on\s+: Node v24\.13\.1/);
    assert.match(msg, /Supported\s+: Node 22\.x/);
    assert.match(msg, /Nothing was written; no evidence was touched/);
  });
});
