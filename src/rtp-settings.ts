/**
 * RTP-CLAIM wiring — LIQD Dice: the per-setting exact RTP table and the claim it is held to.
 *
 * The rule is src/rtp-claim.ts, a byte-identical copy of the framework's core/rtp-claim.ts (its
 * SHA-256 is compared by conformance C-13), and the enforcement switch RTP_CLAIM_RULE_ENFORCED is
 * this package's src/rtp-claim-switch.ts, read by that copy. Rule 1.2.0 (Methodology v1.1) 2026-10-14: the claim
 * source names the game page, one of the rule's six places (decision D3); an enforced miss would be RTP FIGURE OVERSTATED. Rule 1.0.0 agreed
 * 2026-09-29.
 *
 * SETTINGS. The price of a band depends only on its width: every band width on the roll grid whose
 * multiplier is above 1×, in basis points bp = 1 … 9899 (src/config.ts PRICE_GRID_MIN_BPS /
 * PRICE_GRID_MAX_BPS; multiplier 9900/bp), 9,899 settings; normal and inverted bands of the same
 * width are the same price. This is the whole grid, not LIQD's accepted range: the capture played
 * 1 % … 98 %, and LIQD's own limits were not read (MANIFEST limitation L7).
 * EXACT RTP. The half-open band wins on exactly bp of the 10,000 draws (src/config.ts discreteWinCount)
 * × the quoted multiplier PAYOUT_NUMERATOR / bp = 9900/bp (the exact quotient the operator serves,
 * src/config.ts PAYOUT_NUMERATOR). The round-down of a credit to 8 decimals lowers a settled RTP by
 * less than one 0.00000001 unit per win (outputs/report-figures.json settledRtp), which is not in
 * this table.
 * CLAIM. Flat 1 % house edge = RTP 99/100: the figure the live page shows the player (liqd.com
 * "Edge: 1.00%", RTP 99%, read 2026-10-01, evidence/rtp-page-labels-2026-10-01.json), the same as
 * HOUSE_EDGE = 0.01 (src/config.ts).
 *
 *   npm run rtp-claim:write    rewrite outputs/rtp-claim-table.json and print its SHA-256 to pin
 */
import * as path from 'path';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { RtpClaim, RtpClaimAccumulator, RtpClaimResult, rtpClaimTable, rtpClaimGate, RtpClaimGate } from './rtp-claim';
import { RANGE, PAYOUT_NUMERATOR, PRICE_GRID_MIN_BPS, PRICE_GRID_MAX_BPS } from './config';

export const RTP_CLAIM: RtpClaim = {
  kind: 'flat',
  rtp: '0.99',
  source: 'LIQD Dice: the game page liqd.com/originals/dice shows "Released: September 2026 | Edge: 1.00%" and RTP 99% (read 2026-10-01, evidence/rtp-page-labels-2026-10-01.json). Same figure as HOUSE_EDGE = 0.01, a flat 1 % house edge (src/config.ts HOUSE_EDGE; declaration outcome.edge.claimed 0.01)',
};

/** The scored step that carries DICE-19 (src/profile-map.ts). */
export const RTP_CLAIM_STEP = 15;

export const RTP_CLAIM_TABLE = path.join(__dirname, '..', 'outputs', 'rtp-claim-table.json');
/** SHA-256 of the committed table — re-pin with the run that rewrote it (npm run rtp-claim:write). */
export const RTP_CLAIM_TABLE_SHA256 = '4c1c589c87cc3351209005e145311f400bc07d994519d4e940e19ed6e3c17707';

export function computeRtpClaim(): RtpClaimResult {
  if (!Number.isInteger(PAYOUT_NUMERATOR)) throw new Error('PAYOUT_NUMERATOR is not an integer');
  const acc = new RtpClaimAccumulator(RTP_CLAIM);
  for (let bp = PRICE_GRID_MIN_BPS; bp <= PRICE_GRID_MAX_BPS; bp++) {
    // P(win) × multiplier = bp/RANGE × PAYOUT_NUMERATOR/bp
    acc.add(`win chance ${(bp / 100).toFixed(2)}%`, BigInt(bp) * BigInt(PAYOUT_NUMERATOR), BigInt(RANGE) * BigInt(bp));
  }
  return acc.result();
}

export function rtpClaimTableText(r: RtpClaimResult): string {
  return rtpClaimTable(r, {
    package: 'liqd/dice', game: 'dice',
    settingSpace: 'every band width on the roll grid whose multiplier is above 1x, win chance 0.01 % … 98.99 % in basis points (multiplier 9900/bp); the production capture played 1 % … 98 %',
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
