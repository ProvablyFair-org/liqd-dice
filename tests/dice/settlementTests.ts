/**
 * Settlement arithmetic: credit = floor8(stake × 9900/basisPoints), exact.
 *
 * The rule is measured on the production capture (data/dice-prod-5936bets.json): every winning
 * credit, at 0.10 USDT and at 10.00 USDT, is the exact product of the decimal stake and the rational
 * 9900/basisPoints, rounded DOWN to the 1e-8 grid. It is evaluated in exact integer (BigInt) units
 * from the decimal text of the served amounts, because the question is about a single 1e-8 unit and
 * a binary64 product cannot be trusted at that scale.
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  floor8CreditUnits, floor8CreditUnitsServed, amountUnits, DATASET_FILE, quotedMultiplier, payoutBasisPoints,
  creditResidualSign, creditResidual, servedRollMatches, HOUSE_EDGE, PAYOUT_NUMERATOR, BASE_STAKE, ELEVATED_STAKE,
} from '../../src/config';
import type { DiceParams, Dataset } from '../../src/types';

const ROOT = path.join(__dirname, '../..');
const prod = JSON.parse(fs.readFileSync(path.join(ROOT, DATASET_FILE), 'utf8')) as Dataset;
const wins = prod.bets.filter((b) => b.win);

describe('LIQD Dice production settlement: floor8(stake × 9900/basisPoints)', () => {
  it('reproduces every winning credit of the production capture, from the band and from the served multiplier', () => {
    assert.ok(wins.length > 0);
    for (const b of wins) {
      const served = amountUnits(b.winningAmount);
      assert.strictEqual(floor8CreditUnits(b.betAmount, b.params), served, `band path, bet ${b.id}`);
      assert.strictEqual(floor8CreditUnitsServed(b.betAmount, b.multiplier), served, `served path, bet ${b.id}`);
    }
  });

  it('holds at both stakes of the plan, with wins at each', () => {
    for (const stake of [BASE_STAKE, ELEVATED_STAKE]) {
      const w = wins.filter((b) => b.betAmount === stake);
      assert.ok(w.length > 0, `wins at ${stake}`);
      assert.ok(w.every((b) => floor8CreditUnits(b.betAmount, b.params) === amountUnits(b.winningAmount)));
    }
    assert.deepStrictEqual([...new Set(prod.bets.map((b) => b.betAmount))].sort(), [BASE_STAKE, ELEVATED_STAKE].sort());
  });

  it('never rounds a credit up, and is below the exact product by less than one 1e-8 unit', () => {
    for (const b of wins) {
      assert.ok(creditResidualSign(b.winningAmount, b.betAmount, b.params) <= 0, `bet ${b.id}`);
      const d = creditResidual(b.winningAmount, b.betAmount, b.params);
      assert.ok(d <= 0 && d > -1e-8, `bet ${b.id}: residual ${d}`);
    }
  });

  it('the rounded-down and exactly-on-the-product counts are the ones the report figures carry', () => {
    const rf = JSON.parse(fs.readFileSync(path.join(ROOT, 'outputs/report-figures.json'), 'utf8'));
    const down = wins.filter((b) => creditResidualSign(b.winningAmount, b.betAmount, b.params) < 0).length;
    const exact = wins.filter((b) => creditResidualSign(b.winningAmount, b.betAmount, b.params) === 0).length;
    assert.strictEqual(down + exact, wins.length);
    assert.strictEqual(rf.settlementResidual.roundedDown, down);
    assert.strictEqual(rf.settlementResidual.exactlyOnProduct, exact);
    assert.strictEqual(rf.settlementResidual.roundedUp, 0);
    assert.strictEqual(rf.wins, wins.length);
  });

  it('a credit is rounded down exactly when the product is off the 1e-8 grid', () => {
    for (const b of wins) {
      const stakeUnits = amountUnits(b.betAmount)!;
      const onGrid = (stakeUnits * BigInt(PAYOUT_NUMERATOR)) % BigInt(payoutBasisPoints(b.params)) === 0n;
      assert.strictEqual(creditResidualSign(b.winningAmount, b.betAmount, b.params) === 0, onGrid, `bet ${b.id}`);
    }
  });

  it('every loss pays 0', () => {
    const losses = prod.bets.filter((b) => !b.win);
    assert.ok(losses.length > 0);
    assert.ok(losses.every((b) => amountUnits(b.winningAmount) === 0n && b.multiplier === 0));
  });

  it('floor8 on worked values: an exact product, a rounded-down product, a whole-number product', () => {
    assert.strictEqual(floor8CreditUnits('0.10000000', { lower: 0, upper: 80, inverted: false }), 12375000n);   // 0.1 × 1.2375, exact
    assert.strictEqual(floor8CreditUnits('0.10000000', { lower: 2, upper: 100, inverted: false }), 10102040n);  // 0.1 × 9900/9800 = 0.101020408…
    assert.strictEqual(floor8CreditUnits('10.00000000', { lower: 50, upper: 100, inverted: false }), 1980000000n); // 10 × 1.98
    assert.strictEqual(floor8CreditUnits('0.10000000', { lower: 99, upper: 100, inverted: false }), 990000000n);  // 0.1 × 99
  });

  it('a served amount off the 8-dp grid is not read as a credit', () => {
    assert.strictEqual(amountUnits('0.10102040'), 10102040n);
    assert.strictEqual(amountUnits('0.101020405'), null);
    assert.strictEqual(amountUnits('0'), 0n);
    assert.strictEqual(amountUnits(0), 0n);
  });

  it('rejects a credit one unit above and one unit below the floor', () => {
    const b = wins.find((x) => creditResidualSign(x.winningAmount, x.betAmount, x.params) < 0)!;
    const units = amountUnits(b.winningAmount)!;
    assert.strictEqual(floor8CreditUnits(b.betAmount, b.params), units);
    assert.notStrictEqual(floor8CreditUnits(b.betAmount, b.params), units + 1n);
    assert.notStrictEqual(floor8CreditUnits(b.betAmount, b.params), units - 1n);
  });
});

describe('the served-roll predicate and the payout numerator', () => {
  it('the served-roll predicate is exact: off-grid, out-of-range and non-numeric are all rejected', () => {
    // Steps 4/5/6/13/14/18 all compare a served roll to a recomputed one through this one predicate.
    // A |local − served| <= 1e-9 comparison would admit values that are not on the 0.01 grid at all;
    // the cases below are what an exact comparison buys.
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
    assert.strictEqual(PAYOUT_NUMERATOR, 9900);
    assert.strictEqual(quotedMultiplier({ lower: 99, upper: 100, inverted: false }), 99);
  });
});

/**
 * Step 20's EXPECTED-CREDIT DERIVATION: the integer-basis-point quotient, not the float closed form.
 *
 * Step 20 rebuilds every winning credit from the band and compares it to the operator's with zero
 * tolerance. Building the multiplier with `quotedMultiplier`, the float closed form
 * `(100/winChance%)·(1 − edge)`, gives the same number as `9900/basisPoints` over the rationals and
 * can give a different binary64, because `continuousWinChancePct` computes `upper − lower` in
 * binary64. Flooring a product built on that float can land one unit below the correct credit.
 */
describe('Step 20 expected-credit derivation: quotient, not float', () => {
  const over9999: DiceParams = { lower: 99.99, upper: 100, inverted: false };

  it('over 99.99 at a stake of 1: the quotient gives 9900, the float closed form one unit less', () => {
    assert.strictEqual(payoutBasisPoints(over9999), 1);
    assert.strictEqual(floor8CreditUnits('1', over9999), 990000000000n);
    assert.strictEqual(quotedMultiplier(over9999), 9899.999999994936);
    assert.strictEqual(floor8CreditUnitsServed('1', quotedMultiplier(over9999)), 989999999999n);
  });

  it('the divergence is real: some under / over bands floor to a different credit through the float', () => {
    let diverge = 0, total = 0;
    for (let u = 1; u <= 9899; u++) {
      for (const p of [{ lower: 0, upper: u / 100, inverted: false }, { lower: (10000 - u) / 100, upper: 100, inverted: false }] as DiceParams[]) {
        total++;
        if (floor8CreditUnitsServed('1', quotedMultiplier(p)) !== floor8CreditUnits('1', p)) diverge++;
      }
    }
    assert.ok(diverge > 0 && diverge < total, `${diverge} of ${total} bands diverge`);
  });

  it('it matters on this capture: the float path floors some captured wins one unit low, the quotient none', () => {
    const viaFloat = wins.filter((b) => floor8CreditUnitsServed(b.betAmount, quotedMultiplier(b.params)) !== amountUnits(b.winningAmount));
    const viaQuotient = wins.filter((b) => floor8CreditUnits(b.betAmount, b.params) !== amountUnits(b.winningAmount));
    assert.strictEqual(viaQuotient.length, 0);
    assert.ok(viaFloat.length > 0, 'the float closed form reproduces every captured credit: the Step 20 note must be revisited');
    for (const b of viaFloat) {
      assert.strictEqual(floor8CreditUnitsServed(b.betAmount, quotedMultiplier(b.params)), amountUnits(b.winningAmount)! - 1n, `bet ${b.id}`);
    }
    const rf = JSON.parse(fs.readFileSync(path.join(ROOT, 'outputs/report-figures.json'), 'utf8'));
    assert.strictEqual(rf.settlementResidual.floatClosedFormMisses, viaFloat.length);
  });
});
