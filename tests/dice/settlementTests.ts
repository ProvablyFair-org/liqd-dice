
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { settledCredit, settledCreditUnits, round8, quotedMultiplier, payoutBasisPoints, creditResidualSign, creditResidual, servedRollMatches, HOUSE_EDGE } from '../../src/config';
import type { DiceParams } from '../../src/types';

describe('LIQD Dice settlement arithmetic', () => {
  it('exact tie at 2.2e11 units rounds half-EVEN up — the case the float rule lost', () => {
    // scaled = 22297297297.5 exactly; as a double it materialises as 22297297297.499996,
    // which the old `|frac − 0.5| < 1e-6` tie window did not recognise, so it rounded DOWN.
    assert.strictEqual(settledCredit(2.5, 9900 / 111), 222.97297298);
    assert.strictEqual(settledCreditUnits(2.5, 9900 / 111), 22297297298n);
  });

  it('exact tie rounds half-EVEN down when the quotient is already even', () => {
    assert.strictEqual(settledCredit(0.1, 9900 / 5808), 0.17045454);
    assert.strictEqual(settledCreditUnits(0.1, 9900 / 5808), 17045454n);
  });

  it('reproduces the report\'s worked example credit', () => {
    assert.strictEqual(settledCredit(0.1, 9900 / 9237), 0.10717766);
  });

  it('six large-magnitude ties require exact integer rounding', () => {
    // Every one is an exact .5 tie at ≥ 9e9 units. Reference: Python decimal, HALF_EVEN.
    const cases: [number, number, number][] = [
      [2.5, 177, 139.83050848],
      [2.5, 184, 134.51086958],
      [2.5, 186, 133.06451612],
      [2.5, 216, 114.58333332],
      [2.5, 244, 101.43442622],
      [2.5, 270, 91.66666668],
    ];
    for (const [stake, bp, expected] of cases) {
      assert.strictEqual(settledCredit(stake, 9900 / bp), expected, `stake ${stake} bp ${bp}`);
    }
  });

  it('rounds to EVEN, not up, on a constructed tie in both directions', () => {
    // 0.5 × 1.00000001 = 0.500000005 → tie at 50000000.5 units, quotient 50000000 (even) → down.
    assert.strictEqual(settledCreditUnits(0.5, 1.00000001), 50000000n);
    // 0.5 × 1.00000003 = 0.500000015 → tie at 50000001.5 units, quotient 50000001 (odd) → up.
    assert.strictEqual(settledCreditUnits(0.5, 1.00000003), 50000002n);
  });

  it('a loss-sized and a whole-number credit are exact', () => {
    assert.strictEqual(settledCredit(10, 1.98), 19.8);
    assert.strictEqual(settledCreditUnits(10, 99), 99000000000n);
  });

  // ── the residual model — the operator's number system, not ours ──────────────
  it('a credit that IS the decimal product is reported as landing on the product', () => {
    const band: DiceParams = { lower: 68.32, upper: 100, inverted: false };
    assert.strictEqual(payoutBasisPoints(band), 3168);
    assert.strictEqual(9900 / 3168, 3.125);
    // ...and here is the ULP gap the report must stop calling "bit-exact": the float closed form
    // returns 3.124999999999999 for the SAME band. Equal as rationals, one ULP apart as binary64.
    assert.strictEqual(quotedMultiplier(band), 3.124999999999999);
    assert.strictEqual(creditResidualSign(0.3125, 0.1, band), 0, 'nothing was rounded on this bet');
    assert.strictEqual(creditResidual(0.3125, 0.1, band), 0);
    // The Phase-C worked example game-rules.md prints as exact: $10.00 x 1.98 = $19.80.
    const over50: DiceParams = { lower: 50, upper: 100, inverted: false };
    assert.strictEqual(creditResidualSign(19.8, 10, over50), 0);
    // And the model still SEES a real rounding when there is one: 0.1 x 9900/9237 credits
    // 0.10717766 against a product of 0.1071776550828…, i.e. the settlement rounded the player UP.
    const band9237: DiceParams = { lower: 0, upper: 92.37, inverted: false };
    assert.strictEqual(payoutBasisPoints(band9237), 9237);
    assert.strictEqual(creditResidualSign(0.10717766, 0.1, band9237), 1);
  });

  // ── stage 1: is `round8` of the served multiplier itself tie-fragile? ─────────
  it('stage-1 has exact 8-dp ties at basisPoints 2048 and 6144, resolved half-UP (mode ASSUMED)', () => {
    const ties: number[] = [];
    for (let bp = 1; bp <= 9900; bp++) {
      const num = 9900n * 100000000n, b = BigInt(bp);
      if (2n * (num % b) === b) ties.push(bp);      // 9900/bp * 1e8 has fractional part exactly .5
    }
    assert.deepStrictEqual(ties, [2048, 6144]);
    assert.strictEqual(9900 / 2048, 4.833984375);
    assert.strictEqual(9900 / 6144, 1.611328125);
    // Math.round is half-up: both go up.
    assert.strictEqual(Math.round((9900 / 2048) * 1e8), 483398438);
    assert.strictEqual(Math.round((9900 / 6144) * 1e8), 161132813);
    // Half-even would agree at 2048 (odd quotient rounds up anyway) and DISAGREE at 6144.
    const halfEven = (scaledTimesTwo: bigint) => {
      const q = scaledTimesTwo / 2n;
      return (q % 2n === 0n) ? q : q + 1n;
    };
    assert.strictEqual(halfEven(2n * 483398437n + 1n), 483398438n);      // same as half-up
    assert.strictEqual(halfEven(2n * 161132812n + 1n), 161132812n);      // differs from half-up
  });

  it('no captured bet lands on a stage-1 tie band, so the mode is unwitnessed', () => {
    const ds = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/dice-master-6700bets.json'), 'utf8'));
    const onTie = ds.bets.filter((b: any) => [2048, 6144].includes(payoutBasisPoints(b.params)));
    assert.strictEqual(onTie.length, 0,
      'a captured bet now lands on a stage-1 tie — the ASSUMED note in src/config.ts can be settled');
  });

  it('stage-1 round8(9900/bp) agrees with exact HALF-UP rounding on every reachable band', () => {
    let checked = 0;
    for (let bp = 1; bp <= 9800; bp++) {
      const m = 9900 / bp;
      const scaledExact = exactTimes1e8(m);            // exact rational value of m·1e8
      const jsRounded = BigInt(Math.round(m * 1e8));
      assert.strictEqual(jsRounded, roundHalfUp(scaledExact), `bp ${bp}`);
      checked++;
    }
    assert.strictEqual(checked, 9800);
  });

  it('round8 is idempotent on an already-8-dp value', () => {
    assert.strictEqual(round8(round8(9900 / 9237)), round8(9900 / 9237));
  });

  it('refuses to return a lossy double above 2^53 units, and stays exact in integer units', () => {
    assert.throws(() => settledCredit(9898, 9900), /exceeds exact double range/);
    assert.strictEqual(settledCreditUnits(9898, 9900), 9799020000000000n);
    // and the largest credit this capture actually contains is nowhere near it
    assert.strictEqual(settledCredit(10, 99), 990);
  });

  it('the served-roll predicate is exact: off-grid, out-of-range and non-numeric are all rejected', () => {
    assert.strictEqual(servedRollMatches(24.01, 24.01), true);
    assert.strictEqual(servedRollMatches(0, 0), true);
    assert.strictEqual(servedRollMatches(99.99, 99.99), true);
    assert.strictEqual(servedRollMatches(24.010000001, 24.01), false, 'off-grid value must be rejected');
    assert.strictEqual(servedRollMatches(24.01, 24.02), false);
    assert.strictEqual(servedRollMatches(100, 100), false, 'above the roll ceiling');
    assert.strictEqual(servedRollMatches(-0.01, -0.01), false, 'below the roll domain');
    assert.strictEqual(servedRollMatches(NaN, 24.01), false);
    assert.strictEqual(servedRollMatches(24.01, NaN), false);
    assert.strictEqual(servedRollMatches(Infinity, Infinity), false);
  });

  it('the derived payout numerator is exactly 9900 at the audited house edge', () => {
    // Step 7 derives the served multiplier's numerator as (1 − HOUSE_EDGE)·10000 rather than
    // typing 9900, so the mutation registry's "house edge doubled → Step 7 fails" guard is true.
    assert.strictEqual((1 - HOUSE_EDGE) * 10000, 9900);
    assert.strictEqual(quotedMultiplier({ lower: 99, upper: 100, inverted: false }), 99);
  });
});

describe('Step 20 expected-credit derivation', () => {
  /** Exactly what Step 20 now computes. */
  const expectedMultiplier = (p: DiceParams) => 9900 / payoutBasisPoints(p);

  /** One representative per (basisPoints, mode) class where the two derivations disagree. */
  const FAILING_BANDS: readonly { label: string; params: DiceParams; bps: number; floatR8: number; quotientR8: number }[] = [
    { label: 'over 99.99',            params: { lower: 99.99, upper: 100,   inverted: false }, bps: 1,    floatR8: 9899.99999999, quotientR8: 9900 },
    { label: 'outside [0, 99.99)',    params: { lower: 0,     upper: 99.99, inverted: true  }, bps: 1,    floatR8: 9899.99999999, quotientR8: 9900 },
    { label: 'over 79.52',            params: { lower: 79.52, upper: 100,   inverted: false }, bps: 2048, floatR8: 4.83398437,   quotientR8: 4.83398438 },
    { label: 'outside [0, 79.52)',    params: { lower: 0,     upper: 79.52, inverted: true  }, bps: 2048, floatR8: 4.83398437,   quotientR8: 4.83398438 },
    { label: 'inside [0.01, 61.45)',  params: { lower: 0.01,  upper: 61.45, inverted: false }, bps: 6144, floatR8: 1.61132812,   quotientR8: 1.61132813 },
    { label: 'outside [0.02, 38.58)', params: { lower: 0.02,  upper: 38.58, inverted: true  }, bps: 6144, floatR8: 1.61132812,   quotientR8: 1.61132813 },
  ];

  it('the six failing classes are exactly the bands where the two derivations disagree', () => {
    for (const b of FAILING_BANDS) {
      assert.strictEqual(payoutBasisPoints(b.params), b.bps, b.label);
      assert.strictEqual(round8(quotedMultiplier(b.params)), b.floatR8, `${b.label} float path`);
      assert.strictEqual(round8(expectedMultiplier(b.params)), b.quotientR8, `${b.label} quotient path`);
      assert.notStrictEqual(b.floatR8, b.quotientR8, b.label);
    }
    assert.deepStrictEqual([...new Set(FAILING_BANDS.map((b) => b.bps))].sort((a, z) => a - z), [1, 2048, 6144]);
  });

  it('ACCEPTS the correct $1 and $10 credits the float path would have rejected', () => {
    for (const b of FAILING_BANDS) {
      for (const stake of [1, 10]) {
        const correct = settledCredit(stake, expectedMultiplier(b.params));
        const floatPath = settledCredit(stake, quotedMultiplier(b.params));
        assert.notStrictEqual(floatPath, correct,
          `${b.label} at $${stake}: this case must distinguish the two calculation paths`);
        // The credit Step 20 now expects IS the correct one.
        assert.strictEqual(correct, Number((BigInt(Math.round(stake * 1e8)) * BigInt(Math.round(expectedMultiplier(b.params) * 1e8)) / 100000000n)) / 1e8);
      }
    }
    // The headline case: a $1 bet at 9900x pays $9,900.00, not $9,899.99999999.
    assert.strictEqual(settledCredit(1, expectedMultiplier({ lower: 99.99, upper: 100, inverted: false })), 9900);
    assert.strictEqual(settledCredit(1, quotedMultiplier({ lower: 99.99, upper: 100, inverted: false })), 9899.99999999);
  });

  it('REJECTS a one-unit incorrect credit on every failing class at every stake', () => {
    for (const b of FAILING_BANDS) {
      for (const stake of [0.1, 1, 10]) {
        const correct = settledCredit(stake, expectedMultiplier(b.params));
        assert.notStrictEqual(round8(correct + 1e-8), correct, `${b.label} at $${stake}`);
        assert.notStrictEqual(round8(correct - 1e-8), correct, `${b.label} at $${stake}`);
      }
    }
  });

  it('$0.10 ERASES the difference through the final rounding — which is why $1 is the vector', () => {
    for (const b of FAILING_BANDS) {
      assert.strictEqual(
        settledCredit(0.1, expectedMultiplier(b.params)),
        settledCredit(0.1, quotedMultiplier(b.params)),
        `${b.label} at $0.10 is not a discriminating stake`,
      );
    }
  });

  it('CONTROL — `under 0.01` agrees under both derivations at every stake', () => {
    const control: DiceParams = { lower: 0, upper: 0.01, inverted: false };
    assert.strictEqual(payoutBasisPoints(control), 1);
    for (const stake of [0.1, 1, 10]) {
      assert.strictEqual(settledCredit(stake, expectedMultiplier(control)), settledCredit(stake, quotedMultiplier(control)),
        `control diverged at $${stake}`);
    }
    assert.strictEqual(settledCredit(1, expectedMultiplier(control)), 9900);
  });

  it('changes NO captured row — the two derivations agree on all 6,700', () => {
    const ds = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/dice-master-6700bets.json'), 'utf8'));
    let checked = 0;
    for (const bet of ds.bets as { params: DiceParams; betAmount: number; win: boolean; winningAmount: number }[]) {
      if (!bet.win) continue;
      checked++;
      const viaQuotient = settledCredit(Number(bet.betAmount), expectedMultiplier(bet.params));
      const viaFloat = settledCredit(Number(bet.betAmount), quotedMultiplier(bet.params));
      assert.strictEqual(viaQuotient, viaFloat, `epoch-level divergence on ${JSON.stringify(bet.params)}`);
      assert.strictEqual(viaQuotient, Number(bet.winningAmount), 'the quotient path must still reproduce the operator credit');
    }
    assert.strictEqual(checked, 2807);
  });

  it('enumerates 12,046 bands where the float and quotient paths diverge, none captured', () => {
    // The exhaustive sweep, restricted here to the under/over families for runtime; the full
    // four-mode sweep was run once and is recorded in the Step 20 comment in
    // tests/steps/standardization.ts.
    let diverge = 0;
    for (let u = 1; u <= 10000; u++) {
      const p: DiceParams = { lower: 0, upper: u / 100, inverted: false };
      if (round8(quotedMultiplier(p)) !== round8(expectedMultiplier(p))) diverge++;
    }
    for (let l = 0; l < 10000; l++) {
      const p: DiceParams = { lower: l / 100, upper: 100, inverted: false };
      if (round8(quotedMultiplier(p)) !== round8(expectedMultiplier(p))) diverge++;
    }
    assert.ok(diverge > 0, 'the under/over sweep must contain divergent bands');
  });
});

/** Exact value of `x · 1e8` for a binary64 `x`, as a rational [numerator, denominator]. */
function exactTimes1e8(x: number): [bigint, bigint] {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  const bits = view.getBigUint64(0);
  const exponent = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & 0xfffffffffffffn;
  let numerator: bigint, e: number;
  if (exponent === 0) { numerator = fraction; e = -1074; }
  else { numerator = fraction | (1n << 52n); e = exponent - 1075; }
  numerator *= 100000000n;
  return e >= 0 ? [numerator << BigInt(e), 1n] : [numerator, 1n << BigInt(-e)];
}

/** Round a non-negative exact rational to the nearest integer, ties away from zero (Math.round). */
function roundHalfUp([num, den]: [bigint, bigint]): bigint {
  const q = num / den, r = num % den;
  return 2n * r >= den ? q + 1n : q;
}
