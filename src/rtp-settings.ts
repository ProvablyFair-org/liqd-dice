/**
 * RTP-CLAIM wiring — LIQD Dice: the per-setting exact RTP table and the claim it is held to.
 *
 * The rule is src/rtp-claim.ts, a byte-identical copy of the framework's core/rtp-claim.ts (its
 * SHA-256 is compared by conformance C-13), and the enforcement switch RTP_CLAIM_RULE_ENFORCED is
 * this package's src/rtp-claim-switch.ts, read by that copy. Rule 1.2.0 (Methodology v1.1) 2026-10-14: the claim
 * source names the game page, one of the rule's six places (decision D3); an enforced miss would be RTP FIGURE OVERSTATED. Rule 1.0.0 agreed
 * 2026-09-29.
 *
 * SETTINGS. The price of a band depends only on its width: every legal win chance in basis points,
 * bp = 1 … 9800 (multiplier 9900/bp between MIN_ODDS 1.0102 and MAX_ODDS 9900, src/config.ts:37-38)
 * — 9,800 settings; normal and inverted bands of the same width are the same price.
 * EXACT RTP. The half-open band wins on exactly bp of the 10,000 draws (src/config.ts discreteWinCount)
 * × the quoted multiplier PAYOUT_NUMERATOR / bp = 9900/bp (the exact quotient the operator serves,
 * src/config.ts PAYOUT_NUMERATOR). The two-stage 8-dp settlement moves a settled RTP by at most ~5.2e-8
 * (declaration outcome.edge.derived), which is not in this table.
 * CLAIM. Flat 1 % house edge = RTP 99/100: the figure the live page shows the player (liqd.com
 * "Edge: 1.00%", RTP 99%, read 2026-10-01, evidence/rtp-page-labels-2026-10-01.json), the same as
 * HOUSE_EDGE = 0.01 (src/config.ts:36; declaration outcome.edge.claimed 0.01).
 *
 *   npm run rtp-claim:write    rewrite outputs/rtp-claim-table.json and print its SHA-256 to pin
 */
import * as path from 'path';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { RtpClaim, RtpClaimAccumulator, RtpClaimResult, rtpClaimTable, rtpClaimGate, RtpClaimGate } from './rtp-claim';
import { RANGE, PAYOUT_NUMERATOR, MIN_ODDS, MAX_ODDS } from './config';

export const RTP_CLAIM: RtpClaim = {
  kind: 'flat',
  rtp: '0.99',
  source: 'LIQD Dice: the game page liqd.com/originals/dice shows "Released: September 2026 | Edge: 1.00%" and RTP 99% (read 2026-10-01, evidence/rtp-page-labels-2026-10-01.json). Same figure as HOUSE_EDGE = 0.01, a flat 1 % house edge (src/config.ts:36; declaration outcome.edge.claimed 0.01)',
};

/** The scored step that carries DICE-19 (src/profile-map.ts). */
export const RTP_CLAIM_STEP = 15;

export const RTP_CLAIM_TABLE = path.join(__dirname, '..', 'outputs', 'rtp-claim-table.json');
/** SHA-256 of the committed table — re-pin with the run that rewrote it (npm run rtp-claim:write). */
export const RTP_CLAIM_TABLE_SHA256 = '075811c734cfbf4bdf1b374d8aac719f823caad23a86a3e30b73cb02b056ee06';

export function computeRtpClaim(): RtpClaimResult {
  if (!Number.isInteger(PAYOUT_NUMERATOR)) throw new Error('PAYOUT_NUMERATOR is not an integer');
  const acc = new RtpClaimAccumulator(RTP_CLAIM);
  for (let bp = 1; bp <= RANGE; bp++) {
    const mult = PAYOUT_NUMERATOR / bp;
    if (mult < MIN_ODDS || mult > MAX_ODDS) continue;          // not a legal price
    // P(win) × multiplier = bp/RANGE × PAYOUT_NUMERATOR/bp
    acc.add(`win chance ${(bp / 100).toFixed(2)}%`, BigInt(bp) * BigInt(PAYOUT_NUMERATOR), BigInt(RANGE) * BigInt(bp));
  }
  return acc.result();
}

export function rtpClaimTableText(r: RtpClaimResult): string {
  return rtpClaimTable(r, {
    package: 'liqd/dice', game: 'dice',
    settingSpace: 'every legal band width, win chance 0.01 % … 98.00 % in basis points (multiplier 9900/bp within MIN_ODDS … MAX_ODDS)',
    rtpMethod: 'exact rational: bp/10000 winning draws × the quoted multiplier 9900/bp',
  });
}

export function runRtpClaimGate(): RtpClaimGate {
  const r = computeRtpClaim();
  return rtpClaimGate(r, rtpClaimTableText(r), RTP_CLAIM_TABLE, RTP_CLAIM_TABLE_SHA256);
}

if (require.main === module) {
  const text = rtpClaimTableText(computeRtpClaim());
  fs.writeFileSync(RTP_CLAIM_TABLE, text);
  console.log(`wrote outputs/rtp-claim-table.json sha256 ${createHash('sha256').update(text).digest('hex')}`);
}
