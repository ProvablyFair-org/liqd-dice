
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
    assert.strictEqual(isSupportedRuntime('24.13.1'), false, 'Node 24 is outside the supported major version');
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
