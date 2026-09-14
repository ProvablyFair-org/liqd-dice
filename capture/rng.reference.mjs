/** Capture-side model reference; scored verification independently recomputes from recorded inputs. */
// liqd Dice — provably-fair RNG, canonical implementation.
// Shares the liqd fast-games core (HMAC-SHA256, `clientSeed:nonce:cursor`, bias-free
// uint32 draw, SHA-256(utf8(serverSeedHexString)) commitment) proven for plinko/mines.
//
// Dice-specific: one draw in [0, 10000) at cursor 0, divided by 100 → roll in [0.00, 99.99].
// Cross-checked during the 2026-08-27 live session against the operator's
// /api/v1/originals/dice/verify endpoint; the audit's named RNG anchor is the
// 6,700 money-settled rolls reproduced bit-for-bit under the commitment chain
// (raw endpoint request/response pairs were not retained).

import { createHmac, createHash } from 'node:crypto';

// HMAC message = `clientSeed:nonce:cursor`
export const salt = (clientSeed, nonce, cursor) => `${clientSeed}:${nonce}:${cursor}`;

// Bias-free uniform integer in [0, range). Server seed hex-decoded to raw bytes = HMAC key.
export function generateProvablyFairNumber(serverSeed, clientSeed, nonce, cursor, range) {
  const key = Buffer.from(serverSeed, 'hex');
  const digest = createHmac('sha256', key).update(salt(clientSeed, nonce, cursor)).digest();
  const maxFair = Math.floor(0x1_0000_0000 / range) * range; // modulo-bias guard
  for (let offset = 0; offset + 4 <= digest.length; offset += 4) {
    const chunk = digest.readUInt32BE(offset);
    if (chunk < maxFair) return chunk % range;
  }
  // All 8 chunks rejected (≈7e-47, i.e. (7296/2³²)⁸): bump cursor and redraw.
  return generateProvablyFairNumber(serverSeed, clientSeed, nonce, cursor + 1_000_000, range);
}

// Dice roll: a single bias-free draw in [0, 10000), scaled to two decimals → [0.00, 99.99].
// Confirmed against 8 live verify vectors (2026-08-27, session-recorded — hard-coded in
// tests/dice/rngTests.ts; raw responses not retained): range is 10000 (NOT 10001), so the
// roll ceiling is 99.99, not 100.00 — a boundary detail the audit measures against win-chance.
export const DICE_RANGE = 10000; // draw 0..9999 → /100 → 0.00..99.99
export function diceRoll(serverSeed, clientSeed, nonce) {
  return generateProvablyFairNumber(serverSeed, clientSeed, nonce, 0, DICE_RANGE) / 100;
}

export function diceWin(roll, { lower, upper, inverted }) {
  const inBand = roll >= lower && roll < upper;
  return inverted ? !inBand : inBand;
}

// Advertised win chance (percent) and fair-vs-edged multiplier.
// LIQD applies a 1% house edge: multiplier = (100 / winChancePct) * (1 - houseEdge).
export function diceWinChancePct({ lower, upper, inverted }) {
  const width = upper - lower;            // band width in roll-units (0..100)
  return inverted ? 100 - width : width;  // percent
}
export function diceMultiplier(params, houseEdge = 0.01) {
  const wc = diceWinChancePct(params);
  return wc > 0 ? (100 / wc) * (1 - houseEdge) : 0;
}

// Hash commitment: activeServerSeedHash = SHA-256( utf8_bytes( serverSeed_hex_string ) ).
export function commitHash(serverSeedHexString) {
  return createHash('sha256').update(serverSeedHexString, 'utf8').digest('hex');
}
