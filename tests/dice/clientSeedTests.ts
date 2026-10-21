/**
 * Client-seed selection ordering, with controlled dependencies — `capture/client-seed.reference.mjs`.
 *
 * ── WHY ────────────────────────────────────────────────────────────────────────────────────────
 * The 2026-08-27 capture built Phase D's client seeds as `pfaudit-${STAMP}-${epoch}` from one
 * process-start timestamp, so the next nine were fully determined by any one of them. The audit
 * leaned on those bets for the claim that the operator cannot pre-evaluate candidate server seeds
 * against a client seed it does not know. A predictable value submitted after a commitment does not
 * deliver that: whoever chooses future server seeds already knows the client seed.
 *
 * The properties asserted here are the ones the claim needs — and they are asserted by INJECTING
 * the randomness source and observing the call order, because "the code looks like it does this"
 * is not evidence that it does.
 *
 *   1. no client seed exists before the commitment has been received and recorded;
 *   2. the CSPRNG is called once per epoch, after that check, with fresh material each time;
 *   3. no client seed is constructed solely from a timestamp or a counter;
 *   4. the commitment that preceded each choice is recorded.
 *
 * WHAT THIS DOES NOT ESTABLISH — and neither does any test in this file — is that the commitment
 * was PUBLISHED before the choice in any sense a third party could check. What is recorded is the
 * auditor's own account of the auditor's own ordering. Independent authentication of the commitment
 * chronology needs a witness outside the capture; it is listed as future evidence, not claimed here.
 * A statistical test of a handful of client seeds would not prove unpredictability either, so there
 * is deliberately no such test below.
 */

import * as assert from 'node:assert';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClientSeedChooser } = require('../../capture/client-seed.reference.mjs');

const COMMITMENT_A = 'a'.repeat(64);
const COMMITMENT_B = 'b'.repeat(64);

/** A randomness source that records every call and returns distinct, non-repeating material. */
function trackedRandom(log: string[]) {
  let calls = 0;
  return (n: number) => {
    calls++;
    log.push(`randomBytes(${n})#${calls}`);
    return { toString: () => String(calls).padStart(n * 2, '0') };
  };
}

describe('client-seed selection ordering (D5)', () => {
  it('REFUSES to generate before the commitment has been received', () => {
    const log: string[] = [];
    const chooser = createClientSeedChooser({ randomBytes: trackedRandom(log) });
    for (const commitment of [undefined, null, '', 'not-a-hash', 'a'.repeat(63), 'A'.repeat(64)]) {
      assert.throws(
        () => chooser.chooseAfterCommitment({ epoch: 3, tag: 'pfaudit', commitment }),
        /refusing to generate before the server commitment/,
        `commitment ${JSON.stringify(commitment)} must be refused`,
      );
    }
    assert.deepStrictEqual(log, [], 'the CSPRNG must not be touched when the commitment is missing');
    assert.strictEqual(chooser.record.length, 0);
  });

  it('the commitment check happens BEFORE the CSPRNG call, per epoch', () => {
    const log: string[] = [];
    const chooser = createClientSeedChooser({
      randomBytes: (n: number) => { log.push('random'); return { toString: () => 'ab'.repeat(n) }; },
    });
    // A failed attempt, then a successful one: the ordering shows in the log.
    assert.throws(() => chooser.chooseAfterCommitment({ epoch: 0, tag: 'audit', commitment: null }));
    log.push('commitment-received');
    chooser.chooseAfterCommitment({ epoch: 0, tag: 'audit', commitment: COMMITMENT_A });
    assert.deepStrictEqual(log, ['commitment-received', 'random'],
      'randomness must be drawn only after the commitment is in hand');
  });

  it('calls the generator exactly once per epoch, with fresh material each time', () => {
    const log: string[] = [];
    const chooser = createClientSeedChooser({ randomBytes: trackedRandom(log) });
    const seeds = [0, 1, 2, 3, 4].map((epoch) =>
      chooser.chooseAfterCommitment({ epoch, tag: 'pfaudit', commitment: COMMITMENT_A }).clientSeed);
    assert.strictEqual(log.length, 5, 'one CSPRNG call per epoch, no more and no fewer');
    assert.strictEqual(new Set(seeds).size, 5, 'every epoch gets distinct material');
    assert.deepStrictEqual(log, [1, 2, 3, 4, 5].map((i) => `randomBytes(16)#${i}`));
  });

  it('no client seed is a function of the timestamp and epoch alone', () => {
    // The exact failure mode: same clock, same epoch sequence, two runs. Under a
    // `pfaudit-${STAMP}-${E}` scheme these two arrays are identical.
    const frozenClock = () => '2026-09-10T00:00:00.000Z';
    const run = () => {
      let calls = 0;
      const chooser = createClientSeedChooser({
        randomBytes: (n: number) => { calls++; return { toString: () => `${calls}${Math.random()}`.padEnd(n * 2, '0').slice(0, n * 2) }; },
        now: frozenClock,
      });
      return [0, 1, 2].map((epoch) =>
        chooser.chooseAfterCommitment({ epoch, tag: 'pfaudit', commitment: COMMITMENT_A }).clientSeed);
    };
    const a = run(), b = run();
    a.forEach((seed, i) => assert.notStrictEqual(seed, b[i],
      `epoch ${i}: a frozen clock and a fixed epoch must NOT reproduce the client seed`));
    // …and the seed carries at least 128 bits of fresh material beyond its label.
    a.forEach((seed) => assert.ok(seed.split('-').pop()!.length >= 32, `too little entropy in ${seed}`));
  });

  it('records which commitment preceded each choice', () => {
    const chooser = createClientSeedChooser({ randomBytes: trackedRandom([]) });
    chooser.chooseAfterCommitment({ epoch: 7, tag: 'audit', commitment: COMMITMENT_A, commitmentSource: 'provably-fair/active' });
    chooser.chooseAfterCommitment({ epoch: 8, tag: 'audit', commitment: COMMITMENT_B, commitmentSource: 'provably-fair/rotate' });
    assert.deepStrictEqual(chooser.record.map((r: any) => [r.epoch, r.precededByCommitment, r.commitmentSource]), [
      [7, COMMITMENT_A, 'provably-fair/active'],
      [8, COMMITMENT_B, 'provably-fair/rotate'],
    ]);
    assert.ok(chooser.record.every((r: any) => r.entropySource === 'csprng'));
  });

  it('the label may keep an epoch prefix — the unpredictable part is separate', () => {
    const chooser = createClientSeedChooser({ randomBytes: trackedRandom([]) });
    const { clientSeed } = chooser.chooseAfterCommitment({ epoch: 124, tag: 'pfaudit', commitment: COMMITMENT_A });
    assert.ok(clientSeed.startsWith('pfaudit-124-'), clientSeed);
    assert.notStrictEqual(clientSeed, 'pfaudit-124');
  });

  it('rejects a configuration with too little entropy, rather than accepting it quietly', () => {
    assert.throws(() => createClientSeedChooser({ randomBytes: trackedRandom([]), entropyBytes: 4 }), /at least 16/);
    assert.throws(() => createClientSeedChooser({} as any), /randomBytes is required/);
  });

  it('the HISTORICAL dataset is unchanged — its Phase-D seeds still show the defect', () => {
    // The correction is documentary for the shipped capture. Do not "fix" the artifact of record.
    const ds = require('../../data/dice-master-6700bets.json');
    const phaseD = ds.bets.filter((b: any) => b.phase === 'D');
    assert.strictEqual(phaseD.length, 500);
    assert.ok(phaseD.every((b: any) => /^pfaudit-\d+-\d+$/.test(b.clientSeed)),
      'the historical Phase-D client seeds must be preserved exactly as captured');
    // …and they really are predictable from one another: same stamp, consecutive epoch index.
    const stamps = new Set(phaseD.map((b: any) => b.clientSeed.split('-')[1]));
    assert.strictEqual(stamps.size, 1, 'one process-start stamp across all of Phase D — this is the defect, recorded');
  });
});
