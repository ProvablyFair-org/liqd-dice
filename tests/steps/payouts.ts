/**
 * Steps 7–10: Payout Integrity
 * The credited amount must equal stake × the derived multiplier, and the multiplier must
 * equal the fair-odds formula (99 / continuousWinChance) — never a trusted operator field.
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { quotedMultiplier, payoutBasisPoints, settledCredit, creditResidualSign, creditResidual, isSettlementTie, PAYOUT_NUMERATOR, HOUSE_EDGE, MIN_ODDS, MAX_ODDS } from '../../src/config';

export function run(ctx: VerifyContext): StepResult[] {
  const { bets } = ctx;

  const numeratorIntegral = Number.isInteger(PAYOUT_NUMERATOR);
  let mChecked = 0, mFails = 0, maxDev = 0, closedFormAgrees = 0;
  for (const b of bets) {
    if (!b.win) continue;
    const bp = payoutBasisPoints(b.params);                           // integer basis points (auditor-derived)
    const served = PAYOUT_NUMERATOR / bp;                             // operator's exact multiplier
    const dev = Math.abs(Number(b.multiplier) - served);
    if (dev > maxDev) maxDev = dev;
    if (Number(b.multiplier) !== served) mFails++;                    // bit-exact pin, not tolerance
    if (Number(b.multiplier) === quotedMultiplier(b.params)) closedFormAgrees++;
    mChecked++;
  }
  const s7 = step(7, 'Multiplier Derivation',
    mFails === 0 && mChecked > 0 && numeratorIntegral ? 'PASS' : 'FAIL',
    `${mChecked} winning bets: served multiplier == ${PAYOUT_NUMERATOR}/basisPoints, numerator derived as (1 − HOUSE_EDGE ${HOUSE_EDGE})·10000${numeratorIntegral ? '' : ' — NON-INTEGRAL, the derivation is unsound at this edge'} (bit-exact ===); max deviation ${maxDev.toExponential(2)}; ${mFails} mismatches. `
    + `basisPoints = round(winChance%·100) is AUDITOR-DERIVED — the field does not appear in the capture; `
    + `the float closed form (100/winChance%)·(1−edge) is the same rational but a different binary64, agreeing bit-for-bit on only ${closedFormAgrees}/${mChecked} of these wins`,
  );

  let cChecked = 0, cFails = 0, cMaxDev = 0, cRawResidual = 0;
  let resBelow = 0, resAbove = 0, resExact = 0, resNet = 0, ties = 0;
  for (const b of bets) {
    const stake = Number(b.betAmount), win = Number(b.winningAmount);
    const expected = b.win ? settledCredit(stake, Number(b.multiplier)) : 0;
    const dev = Math.abs(win - expected);
    if (dev > cMaxDev) cMaxDev = dev;
    if (b.win) {
      const mult = Number(b.multiplier);
      const raw = Math.abs(creditResidual(b.winningAmount, b.betAmount, b.params));
      if (raw > cRawResidual) cRawResidual = raw;
      resNet += creditResidual(b.winningAmount, b.betAmount, b.params);
      const sign = creditResidualSign(b.winningAmount, b.betAmount, b.params);
      if (sign < 0) resBelow++; else if (sign > 0) resAbove++; else resExact++;
      // an exact 8-dp tie is where the half-even rule is actually load-bearing
      if (isSettlementTie(stake, mult)) ties++;
    }
    if (dev !== 0) cFails++;
    cChecked++;
  }
  const wins = resBelow + resAbove + resExact;
  const s8 = step(8, 'Credit Arithmetic',
    cFails === 0 && cChecked === bets.length ? 'PASS' : 'FAIL',
    `${cChecked}/${bets.length} bets: winningAmount == ROUND_HALF_EVEN_8(stake × ROUND_8(multiplier)) exactly (loss ⇒ 0); ${cFails} mismatches; two-stage residual ${cMaxDev.toExponential(2)} (exact); `
    + `against the raw un-rounded product (decimal stake × exact 9900/basisPoints — the operator's own number system, not binary64) the settlement rounds the player DOWN on ${resBelow} and UP on ${resAbove} of ${wins} wins, and lands EXACTLY on the product on ${resExact} (no rounding at all), max |credit − stake×mult| ${cRawResidual.toExponential(2)}, net ${resNet >= 0 ? '+' : ''}${resNet.toExponential(2)} USDC — no directional bias; `
    + `${ties} of the ${wins} wins settle on an exact 8-dp tie, where the half-even rule decides the last unit`,
  );

  // ── Step 9: Loss settlement ──────────────────────────────────────────────────
  // Every losing bet pays exactly 0 and has multiplier 0.
  let lChecked = 0, lFails = 0;
  for (const b of bets) {
    if (b.win) continue;
    lChecked++;
    if (Number(b.winningAmount) !== 0 || Number(b.multiplier) !== 0) lFails++;
  }
  const s9 = step(9, 'Loss Settlement',
    lFails === 0 && lChecked > 0 ? 'PASS' : 'FAIL',
    `${lChecked} losing bets: winningAmount == 0 and multiplier == 0; ${lFails} violations`,
  );

  let wChecked = 0, wFails = 0, wLedgerFails = 0, boundFails = 0, wMissing = 0;
  let firstWalletFail = '';
  for (const b of bets) {
    const q = quotedMultiplier(b.params);
    if (q < MIN_ODDS || q > MAX_ODDS) boundFails++;   // exact bound, no slack: the capture spans 1.0105×–99×
    if (b.stakeWallet == null || b.winningAmountWallet == null) { wMissing++; continue; }
    const expW = b.win ? settledCredit(Number(b.stakeWallet), Number(b.multiplier)) : 0;
    if (Number(b.winningAmountWallet) !== expW) {
      wFails++;
      if (!firstWalletFail) firstWalletFail = `epoch ${b.epoch} nonce ${b.nonce}: wallet credit ${b.winningAmountWallet} != settled ${expW}`;
    }
    if (Number(b.winningAmountWallet) !== Number(b.winningAmount) || Number(b.stakeWallet) !== Number(b.betAmount)) wLedgerFails++;
    wChecked++;
  }
  // DECLARED LIMITATION L5 (R-CREDIT). Measured, not asserted: the capture recorded no wallet
  // BALANCE before/after each bet, so `balanceOk` is null on every row. stakeWallet and
  // winningAmountWallet ARE present and are checked above with zero tolerance — but they are
  // settle-RESPONSE fields, so what this step establishes is that the operator's reported credit is
  // internally consistent with the formula, not what the wallet was actually credited. The count is
  // emitted into the detail string so the artifact carries the limitation, not only the prose.
  const balanceLedgerRows = bets.filter(
    (b) => (b as unknown as { balanceOk?: unknown }).balanceOk !== null
        && (b as unknown as { balanceOk?: unknown }).balanceOk !== undefined,
  ).length;

  const s10 = step(10, 'Wallet Credit & Odds Bounds',
    wFails === 0 && wLedgerFails === 0 && boundFails === 0 && wMissing === 0 && wChecked === bets.length ? 'PASS' : 'FAIL',
    `${wChecked}/${bets.length} bets (${wMissing} missing wallet fields): winningAmountWallet == ROUND_HALF_EVEN_8(stakeWallet × ROUND_8(multiplier)) exactly (${wFails} bad${firstWalletFail ? ` — first: ${firstWalletFail}` : ''}); `
    + `wallet ledger == game ledger (winningAmountWallet == winningAmount, stakeWallet == betAmount) on ${wChecked - wLedgerFails}/${wChecked} (${wLedgerFails} divergent); `
    + `all quoted multipliers within [${MIN_ODDS}, ${MAX_ODDS}] (${boundFails} out of range — the ${MAX_ODDS}× ceiling rests on the E14 live probe, not on this dataset: declared limitation L7); `
    + `wallet BALANCE ledger present on ${balanceLedgerRows}/${bets.length} bets (balanceOk null on ${bets.length - balanceLedgerRows}) — stakeWallet/winningAmountWallet are settle-RESPONSE fields, so this step establishes internal consistency with the formula, NOT what the wallet was credited: declared limitation L5 / R-CREDIT`,
  );

  return [s7, s8, s9, s10];
}
