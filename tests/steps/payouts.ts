/**
 * Steps 7–10: Payout Integrity
 * The credited amount must equal stake × the derived multiplier, and the multiplier must
 * equal the fair-odds formula (99 / continuousWinChance) — never a trusted operator field.
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { quotedMultiplier, payoutBasisPoints, floor8CreditUnitsServed, amountUnits, creditResidualSign, creditResidual, PAYOUT_NUMERATOR, HOUSE_EDGE, EXPECTED_WIN_CHANCES, BASE_STAKE, ELEVATED_STAKE } from '../../src/config';

export function run(ctx: VerifyContext): StepResult[] {
  const { bets } = ctx;

  // ── Step 7: Multiplier derivation ────────────────────────────────────────────
  // Served multiplier on wins == PAYOUT_NUMERATOR / basisPoints, where basisPoints =
  // round(winChance% × 100) is the win chance re-expressed in hundredths of a percent.
  //
  // `basisPoints` is the AUDITOR'S construction and appears nowhere in the capture. The evidence
  // that it is the operator's form is that the quotient matches the served field bit-for-bit on
  // every captured win, while the float closed form `(100/wc)·(1−edge)` matches only some of them
  // (both counts are printed below). Pinned with strict `===`, so a served multiplier off by even
  // 1 ULP is caught.
  //
  // The numerator is DERIVED from HOUSE_EDGE, not typed as 9900: the mutation registry declares
  // that doubling HOUSE_EDGE must fail THIS step, and a hardcoded 9900 would make that declared
  // guard stop guarding. (1 − 0.01)·10000 is exactly 9900 in binary64; the assertion below keeps
  // that true if the edge ever changes to a value where it is not.
  const numeratorIntegral = Number.isInteger(PAYOUT_NUMERATOR);
  let mChecked = 0, mFails = 0, maxDev = 0, closedFormAgrees = 0;
  for (const b of bets) {
    if (!b.win) continue;
    const bp = payoutBasisPoints(b.params);                           // integer basis points (auditor-derived)
    const served = PAYOUT_NUMERATOR / bp;                             // operator's exact multiplier
    const dev = Math.abs(Number(b.multiplier) - served);
    if (dev > maxDev) maxDev = dev;
    if (Number(b.multiplier) !== served) mFails++;                    // bit-exact pin, not tolerance
    // The float closed form is the SAME rational and a DIFFERENT binary64 on many bands. Counted, so
    // the report does not call the two forms "bit-exact" equal.
    if (Number(b.multiplier) === quotedMultiplier(b.params)) closedFormAgrees++;
    mChecked++;
  }
  const s7 = step(7, 'Multiplier Derivation',
    mFails === 0 && mChecked > 0 && numeratorIntegral ? 'PASS' : 'FAIL',
    `${mChecked} winning bets: served multiplier == ${PAYOUT_NUMERATOR}/basisPoints, numerator derived as (1 − HOUSE_EDGE ${HOUSE_EDGE})·10000${numeratorIntegral ? '' : ' — NON-INTEGRAL, the derivation is unsound at this edge'} (bit-exact ===); max deviation ${maxDev.toExponential(2)}; ${mFails} mismatches. `
    + `basisPoints = round(winChance%·100) is AUDITOR-DERIVED — the field does not appear in the capture; `
    + `the float closed form (100/winChance%)·(1−edge) is the same rational but a different binary64, agreeing bit-for-bit on only ${closedFormAgrees}/${mChecked} of these wins`,
  );

  // ── Step 8: Credit arithmetic ────────────────────────────────────────────────
  // The credit is settled by the production rule, exactly:
  //   credit == floor8( stake × multiplier )   (floor8CreditUnitsServed, on the served multiplier)
  // asserted on the 1e-8 integer grid with ZERO tolerance, every input taken from its decimal text,
  // at BOTH stakes of the plan. Step 20 asserts the same rule from the band alone
  // (9900/basisPoints), never reading the served multiplier.
  let cChecked = 0, cFails = 0, cRawResidual = 0, firstCreditFail = '';
  let resBelow = 0, resAbove = 0, resExact = 0, resNet = 0, offGrid = 0;
  const perStake = new Map<string, { wins: number; ok: number; down: number; exact: number }>();
  for (const b of bets) {
    const credited = amountUnits(b.winningAmount);
    if (credited === null) offGrid++;
    const expected = b.win ? floor8CreditUnitsServed(b.betAmount, b.multiplier) : 0n;
    if (credited !== expected) {
      cFails++;
      if (!firstCreditFail) firstCreditFail = `epoch ${b.epoch} nonce ${b.nonce}: credited ${b.winningAmount} vs floor8 ${expected} units`;
    }
    if (b.win) {
      // Direction and magnitude of the settlement against the raw un-rounded product, in the
      // OPERATOR'S number system: decimal stake × the exact rational 9900/basisPoints.
      const raw = Math.abs(creditResidual(b.winningAmount, b.betAmount, b.params));
      if (raw > cRawResidual) cRawResidual = raw;
      resNet += creditResidual(b.winningAmount, b.betAmount, b.params);
      const sign = creditResidualSign(b.winningAmount, b.betAmount, b.params);
      if (sign < 0) resBelow++; else if (sign > 0) resAbove++; else resExact++;
      const k = String(b.betAmount);
      const row = perStake.get(k) ?? { wins: 0, ok: 0, down: 0, exact: 0 };
      row.wins++; if (credited === expected) row.ok++; if (sign < 0) row.down++; if (sign === 0) row.exact++;
      perStake.set(k, row);
    }
    cChecked++;
  }
  const wins = resBelow + resAbove + resExact;
  const stakeRows = [BASE_STAKE, ELEVATED_STAKE].map((k) => ({ k, r: perStake.get(k) ?? { wins: 0, ok: 0, down: 0, exact: 0 } }));
  const bothStakes = stakeRows.every(({ r }) => r.wins > 0 && r.ok === r.wins) && perStake.size === stakeRows.length;
  const s8 = step(8, 'Credit Arithmetic',
    cFails === 0 && offGrid === 0 && resAbove === 0 && cChecked === bets.length && bothStakes ? 'PASS' : 'FAIL',
    `${cChecked}/${bets.length} bets: winningAmount == floor8(stake × multiplier) exactly on the 1e-8 grid, from the served decimal text (loss ⇒ 0); ${cFails} mismatches${firstCreditFail ? ` — first: ${firstCreditFail}` : ''}; ${offGrid} amounts off the 8-dp grid; `
    + `per stake: ${stakeRows.map(({ k, r }) => `${k} USDT ${r.ok}/${r.wins} wins (${r.exact} exactly the product, ${r.down} rounded down)`).join('; ')}; `
    + `against the raw un-rounded product (decimal stake × exact 9900/basisPoints, the operator's own number system, not binary64) the settlement rounds the player DOWN on ${resBelow} and UP on ${resAbove} of ${wins} wins, and lands EXACTLY on the product on ${resExact} (no rounding at all), max |credit − stake×mult| ${cRawResidual.toExponential(2)}, net ${resNet >= 0 ? '+' : ''}${resNet.toExponential(2)} USDT; `
    + `round-down is the rule LIQD stated on 30 September 2026: a credit is never above the exact product and is below it by less than one 0.00000001 unit`,
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

  // ── Step 10: Wallet credit consistency + odds bounds ─────────────────────────
  // Wallet-denominated amounts must settle by the SAME exact rule as the game credit, and every
  // captured band's multiplier must lie inside the span the plan played.
  //
  // Three assertions, all exact:
  //   • winningAmountWallet == floor8(stakeWallet × multiplier): the same production rule
  //     Step 8 applies to the game credit, with ZERO tolerance;
  //   • winningAmountWallet == winningAmount and stakeWallet == betAmount, as decimal amounts: the
  //     wallet and game ledgers are the same money in this capture (USDT on both sides), so a
  //     divergence in either direction is a real finding rather than a rounding artefact;
  //   • the quoted multiplier of every captured band is inside [9900/maxBps, 9900/minBps] of the
  //     plan's win chances (src/config.ts EXPECTED_WIN_CHANCES). This is a bound on the CAPTURE
  //     against its plan. LIQD's own odds limits were not read (limitation L7).
  const planBps = EXPECTED_WIN_CHANCES.map((w) => Math.round(w * 100));
  const minBps = Math.min(...planBps), maxBps = Math.max(...planBps);
  let wChecked = 0, wFails = 0, wLedgerFails = 0, boundFails = 0, wMissing = 0;
  let firstWalletFail = '';
  for (const b of bets) {
    const q = quotedMultiplier(b.params);
    const bp = payoutBasisPoints(b.params);
    if (bp < minBps || bp > maxBps || !(q > 0)) boundFails++;   // exact bound on the integer basis points, no tolerance
    if (b.stakeWallet == null || b.winningAmountWallet == null) { wMissing++; continue; }
    const expW = b.win ? floor8CreditUnitsServed(b.stakeWallet, b.multiplier) : 0n;
    if (amountUnits(b.winningAmountWallet) !== expW) {
      wFails++;
      if (!firstWalletFail) firstWalletFail = `epoch ${b.epoch} nonce ${b.nonce}: wallet credit ${b.winningAmountWallet} != settled ${expW}`;
    }
    if (amountUnits(b.winningAmountWallet) !== amountUnits(b.winningAmount) || amountUnits(b.stakeWallet) !== amountUnits(b.betAmount)) wLedgerFails++;
    wChecked++;
  }
  // DECLARED LIMITATION L5 (R-CREDIT). No wallet BALANCE before/after a bet is in any production
  // dice reply, so there is no balance ledger to reconcile. stakeWallet and winningAmountWallet ARE
  // present and are checked above with zero tolerance, but they are settle-RESPONSE fields, so what
  // this step establishes is that the operator's reported credit is internally consistent with the
  // formula, not what the wallet was actually credited. Counted so the artifact carries it.
  const balanceLedgerRows = bets.filter(
    (b) => (b as unknown as { balanceOk?: unknown }).balanceOk !== null
        && (b as unknown as { balanceOk?: unknown }).balanceOk !== undefined,
  ).length;

  const s10 = step(10, 'Wallet Credit & Odds Bounds',
    wFails === 0 && wLedgerFails === 0 && boundFails === 0 && wMissing === 0 && wChecked === bets.length ? 'PASS' : 'FAIL',
    `${wChecked}/${bets.length} bets (${wMissing} missing wallet fields): winningAmountWallet == floor8(stakeWallet × multiplier) exactly (${wFails} bad${firstWalletFail ? ` — first: ${firstWalletFail}` : ''}); `
    + `wallet ledger == game ledger (winningAmountWallet == winningAmount, stakeWallet == betAmount) on ${wChecked - wLedgerFails}/${wChecked} (${wLedgerFails} divergent); `
    + `every captured band is priced inside the plan's span, win chance ${(minBps / 100).toFixed(2)}%–${(maxBps / 100).toFixed(2)}% = ${PAYOUT_NUMERATOR / maxBps}×–${PAYOUT_NUMERATOR / minBps}× (${boundFails} outside; a bound on the capture against its plan in src/config.ts: LIQD's own odds limits were not read, declared limitation L7); `
    + `wallet BALANCE ledger present on ${balanceLedgerRows}/${bets.length} bets (no balance field in the production dice replies): stakeWallet/winningAmountWallet are settle-RESPONSE fields, so this step establishes internal consistency with the formula, NOT what the wallet was credited: declared limitation L5 / R-CREDIT`,
  );

  return [s7, s8, s9, s10];
}
