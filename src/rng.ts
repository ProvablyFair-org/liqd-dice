/**
 * PROVENANCE (header rewritten on 10 Nov 2026; everything below this comment is the
 * module byte for byte as integrated on 20 Oct 2026).
 *
 * This module was BUILT FROM A WRITTEN SPECIFICATION, not ported from LIQD's code: the implementer
 * read only a specification and a module-interface file (docs/INTERFACE.md), and never opened
 * LIQD's code or its client bundle. The specification shipped in this release, docs/ALGORITHM.md, is
 * re-grounded on production sources only (LIQD's public pages, the liqd.com production capture of
 * 7 to 10 November 2026 and LIQD's production verify endpoint); the derivation it specifies is the
 * one this module implements, and tests/dice/rngSpecTests.ts runs the specification's production
 * vectors against it.
 *
 * LIQD's own verifier is NOT the source of this module. Its replies are run as a SECOND CHECK: the
 * stored verify reply of every captured round (Step 6) and the boundary probes of evidence E17
 * (Step 15, tests/dice/rngTests.ts). The audit's draw-bias bound is src/bias.ts, built on this
 * module's maxFairFor.
 *
 * Units: diceRoll returns the roll as an INTEGER in hundredths (0..9999); callers divide by
 * SCALE (src/config.ts) for the 0.00..99.99 value LIQD serves. Server seeds must be lowercase hex
 * (the commitment is over the seed text); every captured seed is.
 *
 * Agreement with the capture is re-measured on every run: Step 5 of `npm run verify` recomputes
 * every captured roll with this module, and Step 1 every commitment.
 *
 * An input no captured round reaches: when all eight chunks of a digest are rejected this module
 * throws. LIQD's public technical page describes a redraw at cursor + 1,000,000 for that case
 * (specification O2); it has probability about (1.7e-6)^8 per draw and was not observed (L11).
 */
// LIQD Dice outcome derivation, clean-room implementation.
// Built only from ALGORITHM.md (the spec) and INTERFACE.md (export names/types).
// Section references below (e.g. "§1.2") point into ALGORITHM.md.

import { createHash, createHmac } from "crypto";

// §1.1: the server seed is lowercase hex (32 chars witnessed). We require
// non-empty, even-length, lowercase hex so that both the ASCII form (used by
// the commitment) and the decoded-byte form (used as HMAC key) are unambiguous.
// Uppercase is rejected because it would decode to the same key but hash to a
// different commitment.
const HEX_SEED = /^(?:[0-9a-f]{2})+$/;

function assertServerSeed(serverSeed: string): void {
  if (typeof serverSeed !== "string" || !HEX_SEED.test(serverSeed)) {
    throw new Error("serverSeed must be non-empty, even-length, lowercase hex");
  }
}

function assertNonNegInt(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
}

const TWO_POW_32 = 0x1_0000_0000;

// SHA-256 over raw bytes, lowercase hex.
export function sha256Buffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

// §1.2: the published commitment is SHA-256 over the seed's ASCII characters,
// NOT over the bytes the hex decodes to.
export function commitHash(serverSeedHexString: string): string {
  assertServerSeed(serverSeedHexString);
  return sha256Buffer(Buffer.from(serverSeedHexString, "ascii"));
}

// §2 Step 1: message = clientSeed ":" nonce ":" cursor, nonce and cursor as
// plain base-10 with no padding. Encoding to bytes (UTF-8, O7) happens at the
// HMAC call site.
export function getProvablyFairHmacSalt(clientSeed: string, nonce: number, cursor: number): string {
  if (typeof clientSeed !== "string") throw new Error("clientSeed must be a string");
  assertNonNegInt("nonce", nonce);
  assertNonNegInt("cursor", cursor);
  return `${clientSeed}:${nonce.toString(10)}:${cursor.toString(10)}`;
}

// §2 Step 2: LIMIT = floor(2^32 / N) * N. A 32-bit chunk is accepted only if
// it is strictly below this value, so every residue mod N is equally likely.
export function maxFairFor(range: number): number {
  if (!Number.isSafeInteger(range) || range < 1 || range > TWO_POW_32) {
    throw new Error("range must be an integer in [1, 2^32]");
  }
  return Math.floor(TWO_POW_32 / range) * range;
}

// §2 Step 1: HMAC-SHA256 keyed by the hex-DECODED server seed, over the UTF-8
// message.
function hmacDigest(serverSeed: string, clientSeed: string, nonce: number, cursor: number): Buffer {
  assertServerSeed(serverSeed);
  const key = Buffer.from(serverSeed, "hex");
  const message = Buffer.from(getProvablyFairHmacSalt(clientSeed, nonce, cursor), "utf8");
  return createHmac("sha256", key).update(message).digest();
}

// §2 Step 2: walk the 32-byte digest in eight 4-byte big-endian chunks; the
// first chunk below LIMIT gives the draw as chunk mod range. If all eight are
// rejected the spec has no settled continuation (O2), so we throw rather than
// invent one.
export function generateProvablyFairNumber(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  cursor: number,
  range: number,
): number {
  const limit = maxFairFor(range);
  const digest = hmacDigest(serverSeed, clientSeed, nonce, cursor);
  for (let i = 0; i + 4 <= digest.length; i += 4) {
    const v = digest.readUInt32BE(i);
    if (v < limit) return v % range;
  }
  throw new Error("all 32-bit chunks of the digest were rejected (spec O2: continuation unspecified)");
}

// §2 Step 2: the dice roll is the draw over N = 10000 outcomes at cursor 0,
// an integer in hundredths (0..9999 shown as 0.00..99.99).
export function diceRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  return generateProvablyFairNumber(serverSeed, clientSeed, nonce, 0, 10000);
}
