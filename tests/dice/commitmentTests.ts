import * as assert from 'node:assert';
import { run } from '../steps/commitment';
import type { VerifyContext } from '../steps/context';
import type { Dataset } from '../../src/types';

const dataset: Dataset = require('../../data/dice-master-6700bets.json');
function checkPreCapture(preCapture: unknown) {
  const seedMap = new Map(dataset.seeds.map(s => [s.hashedServerSeed, s.serverSeed!]));
  const byHash = new Map(dataset.seeds.map(s => [s.hashedServerSeed,
    dataset.bets.filter(b => b.hashedServerSeed === s.hashedServerSeed)]));
  const ctx = {
    bets: dataset.bets, seeds: dataset.seeds, seedMap, byHash,
    meta: { ...dataset.meta, preCapture },
  } as VerifyContext;
  const saved = console.log;
  try {
    console.log = () => {};
    return run(ctx).find(result => result.step === 2)!;
  } finally { console.log = saved; }
}

describe('pre-capture commitment evidence', () => {
  it('accepts the recorded hash and link to epoch zero', () => {
    assert.strictEqual(checkPreCapture(dataset.meta.preCapture).status, 'PASS');
  });
  it('fails when the record or a required field is absent', () => {
    const pre = dataset.meta.preCapture as Record<string, unknown>;
    for (const missing of [undefined, null, {},
      { ...pre, hashedServerSeed: null }, { ...pre, revealedServerSeed: null },
      { ...pre, nextHashedServerSeed: null }]) {
      assert.strictEqual(checkPreCapture(missing).status, 'FAIL');
    }
  });
  it('fails when the revealed seed or epoch-zero link is changed', () => {
    const pre = dataset.meta.preCapture as Record<string, unknown>;
    assert.strictEqual(checkPreCapture({ ...pre, revealedServerSeed: '0'.repeat(64) }).status, 'FAIL');
    assert.strictEqual(checkPreCapture({ ...pre, nextHashedServerSeed: '0'.repeat(64) }).status, 'FAIL');
  });
});
