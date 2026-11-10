import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { diceRoll, commitHash, generateProvablyFairNumber } from '../../src/rng';
import {
  quotedMultiplier, discreteWinProbability, discreteWinCount, effectiveEdge, effectiveEdgeIsExact,
  diceWin, diceWinInclusive, bandMode, continuousWinChancePct, payoutBasisPoints, floor8CreditUnits, amountUnits,
  RANGE, SCALE, CURSOR, PAYOUT_NUMERATOR, DATASET_FILE, E17_FILE, E17_PROBES, servedReturnSign,
} from '../../src/config';
import type { DiceParams, Dataset } from '../../src/types';

const ROOT = path.join(__dirname, '..', '..');
const ds = JSON.parse(fs.readFileSync(path.join(ROOT, DATASET_FILE), 'utf8')) as Dataset;
const e17 = JSON.parse(fs.readFileSync(path.join(ROOT, E17_FILE), 'utf8')) as {
  probes: { id: string; set: string; onBound: string | null; mode: string | null; pair: { epoch: number; nonce: number; settled: boolean }; status: number; request: { body: string }; body: string }[];
};
const seedOfEpoch = new Map(ds.seeds.map((s) => [s.epoch, s]));
const betById = (id: string) => { const b = ds.bets.find((x) => x.id === id); assert.ok(b, `bet ${id} is in the dataset`); return b!; };

describe('LIQD Dice RNG', () => {
  // SECOND CHECK, not the source: src/rng.ts implements docs/ALGORITHM.md (its own spec vectors are
  // tests/dice/rngSpecTests.ts). diceRoll returns integer hundredths, so rolls are compared as
  // diceRoll / SCALE. Every vector here is production material: rounds of the scored dataset read by
  // bet id, LIQD's stored verify reply for them, and the boundary probes of evidence E17.

  it('reproduces LIQD\'s production verify endpoint on every boundary probe of record (E17)', () => {
    assert.strictEqual(e17.probes.length, E17_PROBES);
    for (const pr of e17.probes) {
      const rq = JSON.parse(pr.request.body) as { serverSeed: string; clientSeed: string; nonce: number; params: DiceParams };
      const out = (JSON.parse(pr.body) as { outcome: { roll: number; win: boolean; multiplier: number } }).outcome;
      const roll = diceRoll(rq.serverSeed, rq.clientSeed, rq.nonce) / SCALE;
      assert.strictEqual(pr.status, 200, pr.id);
      assert.strictEqual(out.roll, roll, `${pr.id} roll`);
      assert.strictEqual(out.win, diceWin(roll, rq.params), `${pr.id} win`);
      assert.strictEqual(out.multiplier, out.win ? PAYOUT_NUMERATOR / payoutBasisPoints(rq.params) : 0, `${pr.id} multiplier`);
    }
  });

  it('draws are integers in [0, 10000)', () => {
    for (const b of ds.bets.slice(0, 64)) {
      const draw = generateProvablyFairNumber(seedOfEpoch.get(b.epoch)!.serverSeed!, b.clientSeed, b.nonce, CURSOR, RANGE);
      assert.ok(Number.isInteger(draw) && draw >= 0 && draw < RANGE);
    }
  });

  it('recomputes captured winning rounds of every phase from their revealed seeds, roll to credit', () => {
    // One win per phase id, by bet id (docs/ALGORITHM.md §5, V1, V4, V5, V6): the roll, the win, the
    // served multiplier and the credit floor8(stake × 9900/basisPoints).
    const cases: [string, string, number, string][] = [
      ['JOaaqudLC5XcE2aFNic0w', 'A', 76.84, '0.10102040'],     // under 98: rounded down from 0.10102040816…
      ['iMgu6U7RKoct0VAxgLffJ', 'A+', 0.45, '9.90000000'],     // 1% win chance, 99×
      ['ljxzosACO18qUy31tkwlA', 'D', 75.05, '0.15230769'],     // player-set client seed
      ['EdvA4OjCUyOffdOqerqJ5', 'C', 87.47, '19.80000000'],    // 10.00 USDT on over 50
    ];
    for (const [id, phaseId, roll, credit] of cases) {
      const b = betById(id);
      const seed = seedOfEpoch.get(b.epoch)!;
      assert.strictEqual(b.phaseId, phaseId, id);
      assert.strictEqual(commitHash(seed.serverSeed!), b.hashedServerSeed, `${id} commitment`);
      assert.strictEqual(diceRoll(seed.serverSeed!, b.clientSeed, b.nonce) / SCALE, roll, `${id} roll`);
      assert.strictEqual(b.roll, roll);
      assert.strictEqual(diceWin(roll, b.params), true);
      assert.strictEqual(b.multiplier, PAYOUT_NUMERATOR / payoutBasisPoints(b.params), `${id} multiplier`);
      // The settled credit, exact to the 1e-8 unit, from the band (never the served multiplier).
      assert.strictEqual(floor8CreditUnits(b.betAmount, b.params), amountUnits(credit), `${id} credit`);
      assert.strictEqual(b.winningAmount, credit);
    }
  });

  it('commitment hash = SHA-256(utf8(serverSeed hex string))', () => {
    // Epoch 0 of the capture: the seed LIQD revealed hashes, as text, to the commitment it had served
    // for it; hashing the 16 decoded bytes instead does not (docs/ALGORITHM.md §1.2, vector V1).
    const s0 = seedOfEpoch.get(0)!;
    assert.strictEqual(s0.serverSeed, '3085a86bd812800c76ae7d81191955b2');
    assert.strictEqual(commitHash(s0.serverSeed!), s0.hashedServerSeed);
    assert.strictEqual(commitHash(s0.serverSeed!), betById('JOaaqudLC5XcE2aFNic0w').hashedServerSeed);
    for (const s of ds.seeds) assert.strictEqual(commitHash(s.serverSeed!), s.hashedServerSeed, `epoch ${s.epoch}`);
  });

  it('client seed is load-bearing: a different client seed changes the roll', () => {
    const s = seedOfEpoch.get(0)!;
    assert.notStrictEqual(diceRoll(s.serverSeed!, s.clientSeed, 0), diceRoll(s.serverSeed!, s.clientSeed + 'x', 0));
  });
});

describe('LIQD Dice game math', () => {
  it('multiplier = 99 / continuousWinChance (1% edge)', () => {
    assert.ok(Math.abs(quotedMultiplier({ lower: 0, upper: 50, inverted: false }) - 1.98) < 1e-12);
    assert.ok(Math.abs(quotedMultiplier({ lower: 99, upper: 100, inverted: false }) - 99) < 1e-9);   // 99× = a 1% band, the top of the capture
    assert.ok(Math.abs(quotedMultiplier({ lower: 0, upper: 10, inverted: false }) - 9.9) < 1e-12);
    // The narrowest band of the price grid: a width-0.01 band = 0.01% win chance = a single grid
    // point, priced at 9900×. Under the half-open rule it wins on exactly 1/10,000, so its effective
    // edge is exactly 1.00% (99% RTP), not the 198% an inclusive-both-ends rule would pay. The
    // capture does not reach it (its top is 99×); these pin the model there.
    assert.ok(Math.abs(quotedMultiplier({ lower: 0, upper: 0.01, inverted: false }) - 9900) < 1e-6);
    assert.strictEqual(discreteWinCount({ lower: 0, upper: 0.01, inverted: false }), 1);
    assert.ok(Math.abs(effectiveEdge({ lower: 0, upper: 0.01, inverted: false }) - 0.01) < 1e-12);
  });

  it('win rule is HALF-OPEN [lower, upper) and honours inverted', () => {
    const p = { lower: 25, upper: 75, inverted: false };
    assert.strictEqual(diceWin(25, p), true);      // lower inclusive
    assert.strictEqual(diceWin(75, p), false);     // upper EXCLUSIVE (E17 probe R-5)
    assert.strictEqual(diceWin(74.99, p), true);
    assert.strictEqual(diceWin(24.99, p), false);
    assert.strictEqual(diceWin(75, { ...p, inverted: true }), true);   // complement gains the upper point
    assert.strictEqual(diceWin(25, { ...p, inverted: true }), false);  // complement loses the lower point
  });

  it('boundary semantics match the production verifier probes of record (E17), probe by probe', () => {
    // evidence/E17-prod-verify-boundary-probes-2026-11-09.json: what LIQD's verify endpoint on
    // liqd.com returned for a roll exactly on a band bound, in the four modes.
    const win = (id: string) => (JSON.parse(e17.probes.find((p) => p.id === id)!.body) as { outcome: { win: boolean; roll: number } }).outcome;
    // roll == lower bound: the band wins, its inverted complement loses
    assert.deepStrictEqual([win('R-1').roll, win('R-1').win], [25, true]);    // over [25, 100)
    assert.deepStrictEqual([win('R-2').roll, win('R-2').win], [25, true]);    // inside [25, 75)
    assert.deepStrictEqual([win('R-3').roll, win('R-3').win], [25, false]);   // outside [25, 75)
    // roll == upper bound: the band loses, its inverted complement wins
    assert.deepStrictEqual([win('R-4').roll, win('R-4').win], [75, false]);   // under [0, 75)
    assert.deepStrictEqual([win('R-5').roll, win('R-5').win], [75, false]);   // inside [25, 75)
    assert.deepStrictEqual([win('R-6').roll, win('R-6').win], [75, true]);    // outside [25, 75)
    // the range edges: roll 0.00 wins under, roll 99.99 on an upper bound of 99.99 loses inside
    assert.deepStrictEqual([win('E-1').roll, win('E-1').win], [0, true]);
    assert.deepStrictEqual([win('E-3').roll, win('E-3').win], [99.99, false]);
  });

  it('E17: which probes separate half-open from inclusive-both-ends, counted', () => {
    // HOW MUCH EVIDENCE E17 IS. A probe tells the two rules apart only when the roll sits on a
    // reachable UPPER bound: `roll == lower` wins under both rules, and a control 0.01 off a bound is
    // decided the same way by both. The count is asserted so the report's sentence is enforced.
    const rows = e17.probes.map((pr) => {
      const rq = JSON.parse(pr.request.body) as { serverSeed: string; clientSeed: string; nonce: number; params: DiceParams };
      const roll = diceRoll(rq.serverSeed, rq.clientSeed, rq.nonce) / SCALE;
      const out = (JSON.parse(pr.body) as { outcome: { win: boolean } }).outcome;
      return { id: pr.id, roll, p: rq.params, win: out.win, settled: pr.pair.settled };
    });
    const disc = rows.filter((r) => diceWin(r.roll, r.p) !== diceWinInclusive(r.roll, r.p));
    assert.deepStrictEqual(disc.map((r) => r.id).sort(), ['E-3', 'E-4', 'R-4', 'R-5', 'R-6', 'S-4', 'S-5', 'S-6']);
    assert.ok(disc.every((r) => r.win === diceWin(r.roll, r.p)), 'every discriminating probe follows half-open');
    assert.ok(disc.every((r) => r.roll === r.p.upper), 'a discriminating probe is a roll on an upper bound');
    assert.deepStrictEqual([...new Set(disc.map((r) => bandMode(r.p)))].sort(), ['inside', 'outside', 'under']);
    // roll == lower bound: 7 probes, every one a win for the non-inverted band and a loss for the inverted one
    const lower = rows.filter((r) => r.roll === r.p.lower);
    assert.strictEqual(lower.length, 7);
    assert.ok(lower.every((r) => r.win === !r.p.inverted));
    // 6 of the 23 use nonces that were never settled in the capture (set R)
    assert.strictEqual(rows.filter((r) => !r.settled).length, 6);
  });

  it('mode classification', () => {
    assert.strictEqual(bandMode({ lower: 0, upper: 50, inverted: false }), 'under');
    assert.strictEqual(bandMode({ lower: 50, upper: 100, inverted: false }), 'over');
    assert.strictEqual(bandMode({ lower: 25, upper: 75, inverted: false }), 'inside');
    assert.strictEqual(bandMode({ lower: 25, upper: 75, inverted: true }), 'outside');
  });

  it('discrete win chance equals the continuous width in every mode (half-open rule)', () => {
    const under50 = { lower: 0, upper: 50, inverted: false };
    const over50 = { lower: 50, upper: 100, inverted: false };
    const outside = { lower: 25, upper: 75, inverted: true };
    // half-open: every band wins on exactly 100·W of the 10,000 points — no fencepost
    assert.ok(Math.abs(discreteWinProbability(under50) - 0.5) < 1e-12);
    assert.ok(Math.abs(discreteWinProbability(over50) - 0.5) < 1e-12);
    assert.ok(Math.abs(discreteWinProbability(outside) - 0.5) < 1e-12);
    assert.ok(Math.abs(effectiveEdge(under50) - 0.01) < 1e-12);
    assert.ok(Math.abs(effectiveEdge(over50) - 0.01) < 1e-12);
  });

  it('continuous win chance', () => {
    assert.strictEqual(continuousWinChancePct({ lower: 0, upper: 30, inverted: false }), 30);
    assert.strictEqual(continuousWinChancePct({ lower: 20, upper: 80, inverted: true }), 40);
  });

  // ── Regression guard for the ceil/floor float bug ────────────────────────────
  // Scaling band bounds with Math.ceil/Math.floor does not work: IEEE-754 puts
  // many 2-dp products just off the integer (1.1·100 = 110.00000000000001), so the
  // count lands one grid point away on such bands. A
  // suite using only integer bounds (0/50/100), where x·100 is float-exact,
  // cannot tell the bug from the fix. These fractional-bound vectors trip
  // the float trap directly: under ceil/floor scaling every marked band fails the
  // enumeration cross-check below.
  const fractionalBands: DiceParams[] = [
    { lower: 0, upper: 39.3, inverted: false },      // 39.3·100 = 3930.0000000000005
    { lower: 10.22, upper: 66.49, inverted: false }, // both bounds off-integer
    { lower: 4.9, upper: 55.39, inverted: true },
    { lower: 38.65, upper: 73.46, inverted: true },
    { lower: 32.09, upper: 97.35, inverted: false },
    { lower: 32.13, upper: 100, inverted: false },   // over: exactly 100·W points
    { lower: 40.09, upper: 47.72, inverted: false },
    { lower: 0, upper: 1.12, inverted: false },      // a narrow under band
  ];

  it('discreteWinCount matches literal grid enumeration on fractional bounds', () => {
    for (const p of fractionalBands) {
      let c = 0;
      for (let d = 0; d < RANGE; d++) if (diceWin(d / SCALE, p)) c++;
      assert.strictEqual(discreteWinCount(p), c, JSON.stringify(p));
    }
  });

  it('closed-form edge is exactly 1.00% for every band in every mode', () => {
    // Half-open rule: winning points = 100·W exactly, so edge = 1 − (W/100)·(99/W) = 1%.
    // Under an inclusive-both-ends rule these same bands range
    // 0.116%–1.020%: this test pins the flat law the E17 probes establish.
    // ASSERTED IN EXACT INTEGERS: the float form is not equal to 0.01, it is
    // near it, and how near depends on the band — see the next test.
    for (const p of fractionalBands) {
      assert.ok(effectiveEdgeIsExact(p), `${JSON.stringify(p)}: integer edge identity fails`);
    }
    // Because every band's expected return per bet is EXACTLY 0.99, a window can land
    // exactly on its expectation, and the Step 17 direction split must then say "equal". 25 wins of
    // `under 50` (1.98×) is 49.5 against 49.5 — the float sums give 49.49999999999998 against
    // 49.500000000000014 and would call it "below". servedReturnSign decides it in exact rationals.
    const u50 = { lower: 0, upper: 50, inverted: false };
    const window = (wins: number) => Array.from({ length: 50 }, (_, i) => ({ band: u50, won: i < wins }));
    assert.strictEqual(servedReturnSign(window(25)), 0);
    assert.strictEqual(servedReturnSign(window(24)), -1);
    assert.strictEqual(servedReturnSign(window(26)), 1);
  });

  it('the float edge form departs from 0.01 by up to 5.06e-13 — half the old 1e-12 threshold', () => {
    // WHY THE IDENTITY IS INTEGRAL. A Step 15 written as |edge − 0.01| < 1e-12, with the width
    // sized on the float noise of the captured bands, rests on a capture that does not contain the
    // worst case. `continuousWinChancePct` subtracts in binary64, so `100 − 99.99` is
    // 0.010000000000005116 and the `over 99.99` band departs by 5.063813951489138e-13: such a
    // threshold would be under 2x its own noise floor. This test pins the number so nobody
    // re-derives a float tolerance from the capture.
    const extreme: DiceParams = { lower: 99.99, upper: 100, inverted: false };
    const departure = Math.abs(effectiveEdge(extreme) - 0.01);
    assert.strictEqual(departure, 5.063813951489138e-13);
    assert.ok(departure > 1e-12 / 2, 'the old 1e-12 threshold was under 2x this departure');
    assert.ok(effectiveEdgeIsExact(extreme), 'the integer identity holds where the float one strains');
  });

  it('the integer edge identity holds over 59,998 bands across all four modes', () => {
    // Coverage for the identity itself: every 2-dp bound in the under / over / inside / outside
    // families, including the widths the capture did not play.
    let checked = 0;
    for (let lo = 0; lo < RANGE; lo++) {
      const fams: DiceParams[] = [
        { lower: lo / 100, upper: 100, inverted: false },
        { lower: lo / 100, upper: 100, inverted: true },
        { lower: 0, upper: (lo + 1) / 100, inverted: false },
        { lower: 0, upper: (lo + 1) / 100, inverted: true },
        { lower: lo / 100, upper: Math.min(100, (lo + 1) / 100 + 25), inverted: false },
        { lower: lo / 100, upper: Math.min(100, (lo + 1) / 100 + 25), inverted: true },
      ];
      for (const p of fams) {
        if (continuousWinChancePct(p) <= 0) continue;
        assert.ok(effectiveEdgeIsExact(p), `${JSON.stringify(p)}`);
        checked++;
      }
    }
    assert.strictEqual(checked, 59998);
  });

  it('non-2dp band bounds are rejected, not silently rounded', () => {
    assert.throws(() => discreteWinCount({ lower: 0, upper: 39.301, inverted: false }),
      /non-2dp band bound/);
  });

  // ── Rejection guard, force-exercised ────────────────────────────────────────
  // A first HMAC chunk in the rejected tail has probability about 1.7e-6 per draw, so a capture
  // of a few thousand rounds is not expected to contain one, and without these vectors the guard
  // would be untested code. The nonces were found by scanning an auditor-made seed pair (not a LIQD
  // seed): each digest's FIRST uint32 chunk is >= maxFair = 4,294,960,000, so a correct
  // implementation must skip it and take the SECOND chunk. An implementation without the guard
  // (plain modulo on chunk 0) produces a different roll for every one of these.
  // This covers the REFERENCE guard only: whether the operator's server implements rejection is not
  // observable from the capture (see the scope note in MANIFEST.md#game-and-algorithm, L11).
  it('rejection guard fires: first chunk >= maxFair is skipped, second chunk taken', () => {
    const rejectionVectors: Array<{ nonce: number; chunk0: number; roll: number }> = [
      { nonce: 1520921, chunk0: 4294961212, roll: 45.60 },
      { nonce: 2388818, chunk0: 4294966436, roll: 35.84 },
      { nonce: 3289857, chunk0: 4294966973, roll: 18.16 },
    ];
    const seed = '00112233445566778899aabbccddeeff';  // auditor-made seed pair
    const clientSeed = 'audittest';
    const maxFair = Math.floor(0x1_0000_0000 / RANGE) * RANGE;
    for (const v of rejectionVectors) {
      assert.ok(v.chunk0 >= maxFair, `vector precondition: chunk0 ${v.chunk0} in rejected tail`);
      const unguarded = (v.chunk0 % RANGE) / SCALE;   // what a guardless implementation returns
      const roll = diceRoll(seed, clientSeed, v.nonce) / SCALE;
      assert.ok(Math.abs(roll - v.roll) < 1e-9, `nonce ${v.nonce}: roll ${roll} != ${v.roll}`);
      assert.notStrictEqual(roll, unguarded, `nonce ${v.nonce}: guard did not fire`);
    }
  });
});
