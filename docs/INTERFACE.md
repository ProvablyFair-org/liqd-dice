# Module interface the audit package expects (written by the auditor, not from the casino)

Write `rng.ts` (TypeScript, strict, Node `crypto` only, no dependencies) exporting exactly these names.
Semantics come from ALGORITHM.md; this file only fixes names, types and the package's own conventions.
Where the spec leaves plain mod vs rejection open, implement what the spec says to implement.

```ts
// The commitment the casino publishes for a server seed, lowercase hex (per the spec's commitment section).
export function commitHash(serverSeedHexString: string): string;
// SHA-256 of a byte buffer, lowercase hex.
export function sha256Buffer(buf: Buffer): string;
// The HMAC message for (clientSeed, nonce, cursor), exactly as the spec builds it.
export function getProvablyFairHmacSalt(clientSeed: string, nonce: number, cursor: number): string;
// Exclusive upper end of the accepted 32-bit window for a draw over `range` outcomes.
export function maxFairFor(range: number): number;
// The accepted draw in [0, range) for (seeds, nonce, cursor), per the spec's chunk/rejection rule. Throw if none accepted.
export function generateProvablyFairNumber(serverSeed: string, clientSeed: string, nonce: number, cursor: number, range: number): number;
// The dice roll as an INTEGER in hundredths, 0..9999 (i.e. 0.00..99.99 x 100), cursor 0.
export function diceRoll(serverSeed: string, clientSeed: string, nonce: number): number;
```
Win rule and payout are NOT part of this module; implement only the above.
