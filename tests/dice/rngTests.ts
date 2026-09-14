import * as assert from 'node:assert';
import { diceRoll, commitHash, generateProvablyFairNumber } from '../../src/rng';
import {
  quotedMultiplier, discreteWinProbability, discreteWinCount, effectiveEdge, effectiveEdgeIsExact,
  diceWin, bandMode, continuousWinChancePct, RANGE, SCALE, CURSOR,
} from '../../src/config';
import type { DiceParams } from '../../src/types';

describe('LIQD Dice RNG', () => {
  // Vectors derived during the 2026-08-27 live session from the operator's
  // /api/v1/originals/dice/verify endpoint (read-only). Raw request/response pairs
  // were not retained, so these are session-recorded values, not a shipped capture;
  // the audit's named RNG anchor is the 6,700 settled rolls (Step 5).
  const S = '00112233445566778899aabbccddeeff';
  const C = 'audittest';
  const serverVectors: [number, number][] = [
    [0, 93.22], [1, 0.79], [2, 81.91], [3, 97.36],
    [4, 90.34], [5, 64.99], [6, 9.48], [7, 93.41],
  ];

  it('reproduces the operator verify endpoint byte-for-byte (8 vectors)', () => {
    for (const [nonce, roll] of serverVectors) {
      assert.ok(Math.abs(diceRoll(S, C, nonce) - roll) < 1e-9, `nonce ${nonce}: ${diceRoll(S, C, nonce)} != ${roll}`);
    }
  });

  it('draws are bias-free integers in [0, 10000) at cursor 0', () => {
    for (const [nonce] of serverVectors) {
      const draw = generateProvablyFairNumber(S, C, nonce, CURSOR, RANGE);
      assert.ok(Number.isInteger(draw) && draw >= 0 && draw < RANGE);
    }
  });

  it('recomputes a real captured winning bet from its revealed seed', () => {
    const serverSeed = '015307d5a3f62db476210c3797bac8b7';
    const clientSeed = 'auditf2456fc140ac';
    const nonce = 0;
    const params = { lower: 0, upper: 92.37, inverted: false };
    const roll = diceRoll(serverSeed, clientSeed, nonce);
    assert.ok(Math.abs(roll - 24.01) < 1e-9, `roll ${roll}`);
    assert.strictEqual(diceWin(roll, params), true);
    // multiplier and credit
    const mult = quotedMultiplier(params);
    assert.ok(Math.abs(mult - 1.071776550828191) < 1e-9, `mult ${mult}`);
    assert.ok(Math.abs(0.1 * mult - 0.10717766) < 1e-6);
  });

  it('commitment hash = SHA-256(utf8(serverSeed hex string))', () => {
    assert.strictEqual(
      commitHash('015307d5a3f62db476210c3797bac8b7'),
      '918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8',
    );
  });

  it('client seed is load-bearing — a different client seed changes the roll', () => {
    assert.notStrictEqual(diceRoll(S, C, 0), diceRoll(S, C + 'x', 0));
  });
});

describe('LIQD Dice game math', () => {
  it('multiplier = 99 / continuousWinChance (1% edge)', () => {
    assert.ok(Math.abs(quotedMultiplier({ lower: 0, upper: 50, inverted: false }) - 1.98) < 1e-12);
    assert.ok(Math.abs(quotedMultiplier({ lower: 99, upper: 100, inverted: false }) - 99) < 1e-9);   // 99× = a 1% band (top of capture; live-witnessed maxOdds 9900×)
    assert.ok(Math.abs(quotedMultiplier({ lower: 0, upper: 10, inverted: false }) - 9.9) < 1e-12);
    // The 9900× extreme (live-witnessed maxOdds, E14/F-LIMITS): a width-0.01 band = 0.01% win chance =
    // a single grid point, priced at 9900×. Under the half-open rule it wins on exactly 1/10,000,
    // so effective edge is exactly 1.00% (99% RTP) — NOT the 198% an inclusive-both-ends rule
    // would pay. These pin the extreme without a settled bet at it (see E14 / recommendations A2b).
    assert.ok(Math.abs(quotedMultiplier({ lower: 0, upper: 0.01, inverted: false }) - 9900) < 1e-6);
    assert.strictEqual(discreteWinCount({ lower: 0, upper: 0.01, inverted: false }), 1);
    assert.ok(Math.abs(effectiveEdge({ lower: 0, upper: 0.01, inverted: false }) - 0.01) < 1e-12);
  });

  it('win rule is HALF-OPEN [lower, upper) and honours inverted', () => {
    const p = { lower: 25, upper: 75, inverted: false };
    assert.strictEqual(diceWin(25, p), true);      // lower inclusive
    assert.strictEqual(diceWin(75, p), false);     // upper EXCLUSIVE (E13 probe)
    assert.strictEqual(diceWin(74.99, p), true);
    assert.strictEqual(diceWin(24.99, p), false);
    assert.strictEqual(diceWin(75, { ...p, inverted: true }), true);   // complement gains the upper point
    assert.strictEqual(diceWin(25, { ...p, inverted: true }), false);  // complement loses the lower point
  });

  it('boundary semantics match the operator verifier probes of record (E13)', () => {
    // evidence/E13-verify-endpoint-boundary-probes.json — roll 3.61 exactly,
    // seed 015307d5a3f62db476210c3797bac8b7 / auditf2456fc140ac / nonce 1000.
    const r = diceRoll('015307d5a3f62db476210c3797bac8b7', 'auditf2456fc140ac', 1000);
    assert.ok(Math.abs(r - 3.61) < 1e-9, `probe roll ${r}`);
    const probes: Array<[DiceParams, boolean]> = [
      [{ lower: 0,    upper: 3.61, inverted: false }, false], // roll == upper -> LOSS
      [{ lower: 0,    upper: 3.62, inverted: false }, true ],
      [{ lower: 3.61, upper: 10,   inverted: false }, true ], // roll == lower -> WIN
      [{ lower: 3.62, upper: 10,   inverted: false }, false],
      [{ lower: 0.5,  upper: 3.61, inverted: true  }, true ], // inverted wins the excluded upper
      [{ lower: 3.61, upper: 10,   inverted: true  }, false], // inverted loses the included lower
      [{ lower: 3.61, upper: 100,  inverted: false }, true ],
    ];
    for (const [p, win] of probes) {
      assert.strictEqual(diceWin(r, p), win, JSON.stringify(p));
    }
  });

  it('E13 discriminates half-open from inclusive-both-ends on exactly 2 of its 7 probes', () => {
    const r = 3.61;
    const probeParams: DiceParams[] = [
      { lower: 0,    upper: 3.61, inverted: false },
      { lower: 0,    upper: 3.62, inverted: false },
      { lower: 3.61, upper: 10,   inverted: false },
      { lower: 3.62, upper: 10,   inverted: false },
      { lower: 0.5,  upper: 3.61, inverted: true  },
      { lower: 3.61, upper: 10,   inverted: true  },
      { lower: 3.61, upper: 100,  inverted: false },
    ];
    const inclusiveBothEnds = (roll: number, p: DiceParams) => {
      const inBand = roll >= p.lower && roll <= p.upper;
      return p.inverted ? !inBand : inBand;
    };
    const discriminating = probeParams.filter((p) => diceWin(r, p) !== inclusiveBothEnds(r, p));
    assert.strictEqual(probeParams.length, 7, 'E13 has 7 probes');
    assert.strictEqual(discriminating.length, 2,
      `expected 2 discriminating probes, got ${discriminating.length}: ${JSON.stringify(discriminating)}`);
    assert.deepStrictEqual(discriminating, [
      { lower: 0,   upper: 3.61, inverted: false },
      { lower: 0.5, upper: 3.61, inverted: true  },
    ]);
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

  const fractionalBands: DiceParams[] = [
    { lower: 0, upper: 39.3, inverted: false },      // 39.3·100 = 3930.0000000000005
    { lower: 10.22, upper: 66.49, inverted: false }, // both bounds off-integer
    { lower: 4.9, upper: 55.39, inverted: true },
    { lower: 38.65, upper: 73.46, inverted: true },
    { lower: 32.09, upper: 97.35, inverted: false },
    { lower: 32.13, upper: 100, inverted: false },   // over: exactly 100·W points
    { lower: 40.09, upper: 47.72, inverted: false },
    { lower: 0, upper: 1.12, inverted: false },      // smallest captured under band
  ];

  it('discreteWinCount matches literal grid enumeration on fractional bounds', () => {
    for (const p of fractionalBands) {
      let c = 0;
      for (let d = 0; d < RANGE; d++) if (diceWin(d / SCALE, p)) c++;
      assert.strictEqual(discreteWinCount(p), c, JSON.stringify(p));
    }
  });

  it('closed-form edge is exactly 1.00% for every band in every mode', () => {
    for (const p of fractionalBands) {
      assert.ok(effectiveEdgeIsExact(p), `${JSON.stringify(p)}: integer edge identity fails`);
    }
  });

  it('the float edge form departs from 0.01 by up to 5.06e-13 — half the old 1e-12 threshold', () => {
    const extreme: DiceParams = { lower: 99.99, upper: 100, inverted: false };
    const departure = Math.abs(effectiveEdge(extreme) - 0.01);
    assert.strictEqual(departure, 5.063813951489138e-13);
    assert.ok(departure > 1e-12 / 2, 'the old 1e-12 threshold was under 2x this departure');
    assert.ok(effectiveEdgeIsExact(extreme), 'the integer identity holds where the float one strains');
  });

  it('the integer edge identity holds over 59,998 bands across all four modes', () => {
    // Coverage for the identity itself: every 2-dp bound in the under / over / inside / outside
    // families, including the 9900x and 1.0102x extremes the capture never reached.
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

  it('rejection guard fires: first chunk >= maxFair is skipped, second chunk taken', () => {
    const rejectionVectors: Array<{ nonce: number; chunk0: number; roll: number }> = [
      { nonce: 1520921, chunk0: 4294961212, roll: 45.60 },
      { nonce: 2388818, chunk0: 4294966436, roll: 35.84 },
      { nonce: 3289857, chunk0: 4294966973, roll: 18.16 },
    ];
    const seed = '00112233445566778899aabbccddeeff';  // audit seed pair, as in the RNG vectors above
    const clientSeed = 'audittest';
    const maxFair = Math.floor(0x1_0000_0000 / RANGE) * RANGE;
    for (const v of rejectionVectors) {
      assert.ok(v.chunk0 >= maxFair, `vector precondition: chunk0 ${v.chunk0} in rejected tail`);
      const unguarded = (v.chunk0 % RANGE) / SCALE;   // what a guardless implementation returns
      const roll = diceRoll(seed, clientSeed, v.nonce);
      assert.ok(Math.abs(roll - v.roll) < 1e-9, `nonce ${v.nonce}: roll ${roll} != ${v.roll}`);
      assert.notStrictEqual(roll, unguarded, `nonce ${v.nonce}: guard did not fire`);
    }
  });
});
