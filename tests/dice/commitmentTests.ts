import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { run } from '../steps/commitment';
import type { VerifyContext } from '../steps/context';
import type { Dataset, CaptureRecord } from '../../src/types';
import { DATASET_FILE, EXPECTED_CAPTURES } from '../../src/config';

const dataset = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', DATASET_FILE), 'utf8')) as Dataset;

/** Step 2 on the dataset with capture file `index` carrying `preCapture` instead of its own record. */
function checkPreCapture(index: number, preCapture: unknown) {
  const seedMap = new Map(dataset.seeds.map(s => [s.hashedServerSeed, s.serverSeed!]));
  const byHash = new Map(dataset.seeds.map(s => [s.hashedServerSeed,
    dataset.bets.filter(b => b.hashedServerSeed === s.hashedServerSeed)]));
  const captures = dataset.meta.captures.map((c) => (c.index === index ? { ...c, preCapture } : c)) as CaptureRecord[];
  const ctx = {
    bets: dataset.bets, seeds: dataset.seeds, seedMap, byHash,
    meta: { ...dataset.meta, captures },
  } as VerifyContext;
  const saved = console.log;
  try {
    console.log = () => {};
    return run(ctx).find(result => result.step === 2)!;
  } finally { console.log = saved; }
}

describe('pre-capture commitment evidence, one anchor per capture file', () => {
  it('the dataset holds the audited number of capture files, each with its own anchor', () => {
    assert.strictEqual(dataset.meta.captures.length, EXPECTED_CAPTURES);
  });
  it('accepts the recorded hash and link to the first epoch of every file', () => {
    for (const c of dataset.meta.captures) assert.strictEqual(checkPreCapture(c.index, c.preCapture).status, 'PASS');
  });
  it('fails when the record or a required field is absent, in any file', () => {
    for (const c of dataset.meta.captures) {
      const pre = c.preCapture as unknown as Record<string, unknown>;
      for (const missing of [undefined, null, {},
        { ...pre, hashedServerSeed: null }, { ...pre, revealedServerSeed: null },
        { ...pre, nextHashedServerSeed: null }]) {
        assert.strictEqual(checkPreCapture(c.index, missing).status, 'FAIL', `file ${c.index}`);
      }
    }
  });
  it('fails when the revealed seed or the link to the first epoch is changed, in any file', () => {
    for (const c of dataset.meta.captures) {
      const pre = c.preCapture as unknown as Record<string, unknown>;
      assert.strictEqual(checkPreCapture(c.index, { ...pre, revealedServerSeed: '0'.repeat(64) }).status, 'FAIL');
      assert.strictEqual(checkPreCapture(c.index, { ...pre, nextHashedServerSeed: '0'.repeat(64) }).status, 'FAIL');
    }
  });
  it('fails when a capture file is dropped from the header', () => {
    const seedMap = new Map(dataset.seeds.map(s => [s.hashedServerSeed, s.serverSeed!]));
    const byHash = new Map(dataset.seeds.map(s => [s.hashedServerSeed, dataset.bets.filter(b => b.hashedServerSeed === s.hashedServerSeed)]));
    const ctx = { bets: dataset.bets, seeds: dataset.seeds, seedMap, byHash, meta: { ...dataset.meta, captures: dataset.meta.captures.slice(1) } } as VerifyContext;
    const saved = console.log;
    try { console.log = () => {}; assert.strictEqual(run(ctx).find(r => r.step === 2)!.status, 'FAIL'); } finally { console.log = saved; }
  });
});
