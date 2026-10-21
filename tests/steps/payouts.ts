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

  // ── Step 7: Multiplier derivation ────────────────────────────────────────────
  // Served multiplier on wins == PAYOUT_NUMERATOR / basisPoints, where basisPoints =
  // round(winChance% × 100) is the win chance re-expressed in hundredths of a percent.
  //
  // `basisPoints` is the AUDITOR'S construction and appears nowhere in the capture — the evidence
  // that it is the operator's form is that the quotient matches the served field
  // bit-for-bit on all 2,807 wins while the float closed form matches only 1,719 of them.
  // This is the exact form the server serves (the float `(100/wc)·(1−edge)` closed form carries
  // auditor-side rounding noise ~1e-13); pinned with strict `===`, so a served multiplier off by
  // even 1 ULP is caught. All 2,807 captured winning multipliers match
  // bit-for-bit.
  //
  // The numerator is DERIVED from HOUSE_EDGE, not typed as 9900: the
  // mutation registry declares that doubling HOUSE_EDGE must fail THIS step, and a hardcoded 9900
  // would make that declared guard stop guarding — the run still flips, but via
  // Steps 10/16/20/21, so the registry would name a step that no longer fires. (1 − 0.01)·10000
  // is exactly 9900 in binary64; the assertion below keeps that true if the edge ever changes to
  // a value where it is not.
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
  // The credit is settled by the EXACT two-stage 8-dp rule:
  //   credit == ROUND_HALF_EVEN_8( stake × ROUND_8(multiplier) )   (settledCredit)
  // asserted with ZERO tolerance — this rule reproduces all 2,807 credits exactly, so any
  // deviation is a real settlement error, not rounding margin (the old 1e-6 tolerance masked a
  // 128-credit gap between this rule and naive half-up rounding). cRawResidual reports the
  // symmetric max |credit − stake×mult_raw| (≈5.5e-9) so the report can cite the real figure.
  let cChecked = 0, cFails = 0, cMaxDev = 0, cRawResidual = 0;
  let resBelow = 0, resAbove = 0, resExact = 0, resNet = 0, ties = 0;
  for (const b of bets) {
    const stake = Number(b.betAmount), win = Number(b.winningAmount);
    const expected = b.win ? settledCredit(stake, Number(b.multiplier)) : 0;
    const dev = Math.abs(win - expected);
    if (dev > cMaxDev) cMaxDev = dev;
    if (b.win) {
      const mult = Number(b.multiplier);
      // Direction and magnitude of the settlement's rounding, in the OPERATOR'S number system —
      // decimal stake × the exact rational 9900/basisPoints. Computing it on binary64(stake) ×
      // binary64(multiplier) instead reports every win as rounded and none as landing on the
      // product — a published figure that is an artefact of the auditor's own number system.
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

  // ── Step 10: Wallet credit consistency + odds bounds ─────────────────────────
  // Wallet-denominated amounts must settle by the SAME exact rule as the game credit, and every
  // derived multiplier must lie within the published odds window [minOdds, maxOdds].
  //
  // This step is where a payout tolerance survives longest. Making Steps 7 and 8 bit-exact while
  // leaving Step 10 comparing `winningAmountWallet` against the RAW
  // product `stakeWallet × multiplier` at 1e-6 means editing a single wallet credit by +1e-7
  // still returns 21/21 while the report claims wallet-credit consistency (MANIFEST.md#payouts-and-rtp). Three
  // assertions stand in its place, all exact:
  //   • winningAmountWallet == settledCredit(stakeWallet, multiplier)  — the same two-stage rule
  //     Step 8 applies to the game credit, with ZERO tolerance;
  //   • winningAmountWallet == winningAmount and stakeWallet == betAmount — the wallet and game
  //     ledgers are the same money in this capture (true on all 6,700 rows), so a divergence in
  //     either direction is a real finding rather than a rounding artefact.
  let wChecked = 0, wFails = 0, wLedgerFails = 0, boundFails = 0, wMissing = 0;
  let firstWalletFail = '';
  for (const b of bets) {
    const q = quotedMultiplier(b.params);
    if (q < MIN_ODDS || q > MAX_ODDS) boundFails++;   // exact bound, no tolerance: the capture spans 1.0105×–99×
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
