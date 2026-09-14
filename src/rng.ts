import { createHmac, createHash } from 'node:crypto';
import { RANGE, CURSOR, SCALE } from './config';

/** Commitment hash: hashedServerSeed = SHA-256( utf8_bytes( serverSeed_hex_string ) ). Stake convention. */
export function commitHash(serverSeedHexString: string): string {
  return createHash('sha256').update(serverSeedHexString, 'utf8').digest('hex');
}

/** Raw SHA-256 of a buffer — dataset integrity guard. */
export function sha256Buffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

export function getProvablyFairHmacSalt(clientSeed: string, nonce: number, cursor: number): string {
  return `${clientSeed}:${nonce}:${cursor}`;
}

/**
 * Bias-free uniform integer in [0, range). Matches the operator's fastGames helper:
 * HMAC-SHA256 keyed by the hex-decoded server seed over `clientSeed:nonce:cursor`,
 * scanning 32-bit big-endian chunks with a modulo-bias rejection guard.
 */
export function generateProvablyFairNumber(
  serverSeed: string, clientSeed: string, nonce: number, cursor: number, range: number,
): number {
  const key = Buffer.from(serverSeed, 'hex');
  const digest = createHmac('sha256', key).update(getProvablyFairHmacSalt(clientSeed, nonce, cursor)).digest();
  const maxFair = Math.floor(0x1_0000_0000 / range) * range;
  for (let offset = 0; offset + 4 <= digest.length; offset += 4) {
    const chunk = digest.readUInt32BE(offset);
    if (chunk < maxFair) return chunk % range;
  }
  return generateProvablyFairNumber(serverSeed, clientSeed, nonce, cursor + 1_000_000, range);
}

/**
 * Dice roll — a SINGLE bias-free draw in [0, 10000) at cursor 0, scaled to two decimals:
 *   roll = generateProvablyFairNumber(serverSeed, clientSeed, nonce, 0, 10000) / 100
 * yielding a value in [0.00, 99.99]. Confirmed byte-identical to the operator's
 * /api/v1/originals/dice/verify endpoint over live vectors.
 */
export function diceRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  return generateProvablyFairNumber(serverSeed, clientSeed, nonce, CURSOR, RANGE) / SCALE;
}
