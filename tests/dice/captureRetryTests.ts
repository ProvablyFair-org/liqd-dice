/** Local transport simulations; these tests never contact the casino. */
import * as assert from 'node:assert';
const { createBetOperation, isRetryable } = require('../../capture/bet-operation.reference.mjs');

describe('capture request retries', () => {
  it('replays the same logical bet after a timeout following settlement', async () => {
    const ledger = new Map<string, object>();
    const keys: string[] = [];
    let generated = 0;
    let requests = 0;
    const operation = createBetOperation({
      params: { lower: 0, upper: 50, inverted: false }, amount: 0.1,
      newKey: () => `request-${++generated}`,
      place: async (_params: object, _amount: number, key: string) => {
        keys.push(key);
        if (!ledger.has(key)) ledger.set(key, { betId: ledger.size + 1 });
        if (++requests === 1) throw Object.assign(new Error('response lost after settlement'), { kind: 'TRANSIENT' });
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
      place: async (_params: object, _amount: number, key: string) => key,
    };
    const first = createBetOperation(options), second = createBetOperation(options);
    assert.strictEqual(await first(), 'request-1');
    assert.strictEqual(await second(), 'request-2');
    assert.strictEqual(await first(), 'request-1');
  });

  it('keeps the submitted parameters stable when the caller edits its plan', async () => {
    const params = { lower: 0, upper: 50, inverted: false };
    const operation = createBetOperation({ params, amount: 0.1, newKey: () => 'key',
      place: async (p: object, amount: number) => ({ params: p, amount }),
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
