/**
 * Spec self-test: docs/ALGORITHM.md vectors and properties, run against src/rng.ts.
 *
 * The vectors are the specification's §5: nine rounds of the liqd.com production capture of 7 to 10
 * November 2026 (copied from data/dice-prod-5936bets.json by bet id, every phase) and the boundary
 * probes LIQD's production verify endpoint answered on 9 November 2026 (evidence E17). The checks
 * read only src/rng.ts; the win rule and the payout (§3) are re-derived here so each vector is
 * checked input to every output.
 */
import * as assert from "assert";
// Self-test for rng.ts against the worked vectors in ALGORITHM.md §5 plus
// properties. Win rule and payout (§3) are not part of rng.ts; they are
// re-derived here only so each vector is checked input -> every output.

import { createHmac } from "crypto";
import {
  commitHash,
  sha256Buffer,
  getProvablyFairHmacSalt,
  maxFairFor,
  generateProvablyFairNumber,
  diceRoll,
} from "../../src/rng";

const EXPECTED_CHECKS = 128;

function runSelftest(): { pass: number; total: number; failed: string[] } {
  let pass = 0;
  let total = 0;
  const failed: string[] = [];
  function check(name: string, ok: boolean, detail = ""): void {
    total++;
    if (ok) pass++;
    if (!ok) failed.push(`${name}${detail ? "  (" + detail + ")" : ""}`);
  }
  function throws(fn: () => unknown): boolean {
    try { fn(); return false; } catch { return true; }
  }

  // --- exact decimal helpers (§1.1 hundredths, §3.3 1e-8 grid) -------------
  function toUnits(dec: string, places: number): bigint {
    const [i, f = ""] = dec.split(".");
    if (f.length > places) throw new Error(`too many decimals: ${dec}`);
    return BigInt(i) * 10n ** BigInt(places) + BigInt((f + "0".repeat(places)).slice(0, places));
  }
  function fmt(units: bigint, places: number): string {
    const s = units.toString().padStart(places + 1, "0");
    const out = `${s.slice(0, -places)}.${s.slice(-places)}`.replace(/0+$/, "").replace(/\.$/, "");
    return out;
  }
  // §3.1
  function winAndWidth(roll: number, lower: string, upper: string, inverted: boolean): { win: boolean; width: number } {
    const L = Number(toUnits(lower, 2));
    const U = Number(toUnits(upper, 2));
    const inBand = L <= roll && roll < U;
    return inverted ? { win: !inBand, width: 10000 - (U - L) } : { win: inBand, width: U - L };
  }
  // §3.3: amount x 9900 / width, exact, rounded DOWN to the 1e-8 grid
  function floor8(amount: string, width: number): bigint {
    return (toUnits(amount, 8) * 9900n) / BigInt(width);
  }
  // true when amount x 9900 / width is already on the 1e-8 grid (nothing is rounded)
  function onGrid(amount: string, width: number): boolean {
    return (toUnits(amount, 8) * 9900n) % BigInt(width) === 0n;
  }

  interface Vec {
    id: string; seed: string; commit: string; client: string; nonce: number;
    lower: string; upper: string; inverted: boolean; amount: string;
    hmac: string; u32: number; roll: number; win: boolean; width: number;
    mult: number; exact: boolean; won: string;
  }

  // docs/ALGORITHM.md §5, V1 to V9 (bet ids there). `exact` = the product is on the 1e-8 grid.
  const V: Vec[] = [
    { id: "V1", seed: "3085a86bd812800c76ae7d81191955b2", commit: "99d78251a09a8c5ee083928d3ff835b1bca114e1ebf86cbf338f43959a583d8d",
      client: "audit8f7ccfa4326c", nonce: 9, lower: "0", upper: "98", inverted: false, amount: "0.10000000",
      hmac: "0227b8f4a2868a7df388b2431204df236ef73adf635599eedbe030ce63562c4a", u32: 36157684, roll: 7684, win: true, width: 9800,
      mult: 1.010204081632653, exact: false, won: "0.1010204" },
    { id: "V2", seed: "463775f070cb7cb2e09940f94ee97ac3", commit: "0efdf3b9cc16b585df2d26b78c1428fa7a5768f78f2b2b040e6bd646cd34c757",
      client: "audit6fa3a34e4fd5", nonce: 54, lower: "42.79", upper: "77.79", inverted: false, amount: "0.10000000",
      hmac: "e27ebcd6adfe3b281518e9cb39b367df53a9291e05f186deb12e430225726b68", u32: 3799956694, roll: 6694, win: true, width: 3500,
      mult: 2.8285714285714287, exact: false, won: "0.28285714" },
    { id: "V3", seed: "85cb5f41035e18a2db66e0fa95a742a3", commit: "42f0b975b33c41e6f8e581ad39c6cda1fc2c2ccbff6b36788e99d58b713d7528",
      client: "audit516264facc8f", nonce: 6, lower: "14.31", upper: "49.31", inverted: true, amount: "0.10000000",
      hmac: "9136a6fa9feda6c54d57f714d47bd17dc743ba95579f032e570e21ba14c8b12d", u32: 2436278010, roll: 8010, win: true, width: 6500,
      mult: 1.523076923076923, exact: false, won: "0.15230769" },
    { id: "V4", seed: "f12e4515cea57104b9e04178548d8c20", commit: "0d877282928bdff7b8c93510034b1c0055a905a2c46307475b17d374ba928cab",
      client: "auditfc6a04215b7e", nonce: 83, lower: "0.5", upper: "99.5", inverted: true, amount: "0.10000000",
      hmac: "a33772ad8328da21abaa481519d23ba94b205f586fcb76aa345246b813b6e43e", u32: 2738320045, roll: 45, win: true, width: 100,
      mult: 99, exact: true, won: "9.9" },
    { id: "V5", seed: "425eeb1811ca501f62c67c22c3e3e464", commit: "5bef5d420546c2a23b5d1701ead71778cf2a486c7a54b30e09b8bf681ec0d286",
      client: "pfaudit-prod-dice-d1-9e7a04f27b2a", nonce: 16, lower: "35", upper: "100", inverted: false, amount: "0.10000000",
      hmac: "8e5c0dc1f77081208d71018244faf1110b0a5fb62114fe79091b08f2801b237e", u32: 2388397505, roll: 7505, win: true, width: 6500,
      mult: 1.523076923076923, exact: false, won: "0.15230769" },
    { id: "V6", seed: "426be2756dc6f4b943deeed76b081ee7", commit: "c63616b206513a87c6f6a41464be633cb3685c79d9b283bf3d7f030543468d59",
      client: "audit6d93604e032c", nonce: 1, lower: "50", upper: "100", inverted: false, amount: "10.00000000",
      hmac: "5235f88ba46f9c6b9152ab7c56b45f0f9ace2ac12740785e561f3126830fce9d", u32: 1379268747, roll: 8747, win: true, width: 5000,
      mult: 1.98, exact: true, won: "19.8" },
    { id: "V7", seed: "426be2756dc6f4b943deeed76b081ee7", commit: "c63616b206513a87c6f6a41464be633cb3685c79d9b283bf3d7f030543468d59",
      client: "audit6d93604e032c", nonce: 0, lower: "50", upper: "100", inverted: false, amount: "10.00000000",
      hmac: "37bcf51f127a5f2853c555440ac0eb6d51be863c5e884bb3fd79b607e8cffc8f", u32: 935130399, roll: 399, win: false, width: 5000,
      mult: 1.98, exact: true, won: "0" },
    { id: "V8", seed: "f8a011e47813188caa965e5e0f4c925d", commit: "c0c9028c7ba78146d573b84704013ef26739fd0e19fc962712019fec26b44285",
      client: "audit28f0a5faf51b", nonce: 117, lower: "33.62", upper: "53.62", inverted: true, amount: "0.10000000",
      hmac: "4051e9709c126422f71f3b4c21951fa78508a3dfcb943c5496cc3fa42a6ae168", u32: 1079110000, roll: 0, win: true, width: 8000,
      mult: 1.2375, exact: true, won: "0.12375" },
    { id: "V9", seed: "76f6cbe2ac74cda67b021b9f70d0084a", commit: "772b331e6b32c2d2d8231c3aa895a7393c1894ae88f8675b28e41b0c0d9ed124",
      client: "audit216e8ae924ba", nonce: 177, lower: "36.73", upper: "56.73", inverted: true, amount: "0.10000000",
      hmac: "2f98249f00ab587c3ee46376f4422ac029a4189156de4e85711760f0f9546019", u32: 798499999, roll: 9999, win: true, width: 8000,
      mult: 1.2375, exact: true, won: "0.12375" },
  ];

  for (const v of V) {
    check(`${v.id} commitHash`, commitHash(v.seed) === v.commit);
    const salt = getProvablyFairHmacSalt(v.client, v.nonce, 0);
    check(`${v.id} message`, salt === `${v.client}:${v.nonce}:0`, salt);
    const digest = createHmac("sha256", Buffer.from(v.seed, "hex")).update(Buffer.from(salt, "utf8")).digest();
    check(`${v.id} HMAC`, digest.toString("hex") === v.hmac);
    check(`${v.id} u32`, digest.readUInt32BE(0) === v.u32, String(digest.readUInt32BE(0)));
    const roll = diceRoll(v.seed, v.client, v.nonce);
    check(`${v.id} diceRoll`, roll === v.roll, String(roll));
    check(`${v.id} generateProvablyFairNumber`, generateProvablyFairNumber(v.seed, v.client, v.nonce, 0, 10000) === v.roll);
    const ww = winAndWidth(roll, v.lower, v.upper, v.inverted);
    check(`${v.id} win`, ww.win === v.win);
    check(`${v.id} width`, ww.width === v.width, String(ww.width));
    check(`${v.id} multiplier double`, 9900 / ww.width === v.mult, String(9900 / ww.width));
    check(`${v.id} product on the 1e-8 grid or not`, onGrid(v.amount, ww.width) === v.exact);
    const won = ww.win ? floor8(v.amount, ww.width) : 0n;
    check(`${v.id} amount_won`, fmt(won, 8) === v.won, fmt(won, 8));
  }

  // V10: LIQD's production verify endpoint on rolls that sit on a band bound (evidence E17, §3.1).
  // Epoch 9 of the capture, nonce 410 (never settled) rolls 25.00; epoch 16, nonce 804 rolls 75.00.
  const R_A = { seed: "edd81eacc3dd5564aa0c26709b918299", client: "auditf6f5365ea141", nonce: 410 };
  const R_B = { seed: "e42be262c0afeb4e3700d1a90580b266", client: "audit82cc2056621a", nonce: 804 };
  check("V10 diceRoll nonce 410 = 2500", diceRoll(R_A.seed, R_A.client, R_A.nonce) === 2500);
  check("V10 diceRoll nonce 804 = 7500", diceRoll(R_B.seed, R_B.client, R_B.nonce) === 7500);
  // §3.1 half-open, as LIQD's verifier answered
  check("probe R-1 over [25,100) roll 25 win", winAndWidth(2500, "25", "100", false).win === true);
  check("probe R-2 inside [25,75) roll 25 win", winAndWidth(2500, "25", "75", false).win === true);
  check("probe R-3 outside [25,75) roll 25 loss", winAndWidth(2500, "25", "75", true).win === false);
  check("probe R-4 under [0,75) roll 75 loss", winAndWidth(7500, "0", "75", false).win === false);
  check("probe R-5 inside [25,75) roll 75 loss", winAndWidth(7500, "25", "75", false).win === false);
  check("probe R-6 outside [25,75) roll 75 win", winAndWidth(7500, "25", "75", true).win === true);
  check("probe multipliers 9900/7500 and 9900/5000 as doubles", 9900 / 7500 === 1.32 && 9900 / 5000 === 1.98);

  // --- properties ----------------------------------------------------------
  const seed1 = V[0].seed;
  check("hash check true", commitHash(seed1) === V[0].commit);
  check("hash check false (seed off by one char)", commitHash(seed1.slice(0, -1) + "6") !== V[0].commit);
  check("hash check false (decoded bytes instead of ASCII)", sha256Buffer(Buffer.from(seed1, "hex")) !== V[0].commit);
  check("sha256Buffer empty", sha256Buffer(Buffer.alloc(0)) === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

  check("maxFairFor(10000) = 4294960000", maxFairFor(10000) === 4294960000);
  check("maxFairFor(1) = 2^32", maxFairFor(1) === 2 ** 32);
  check("maxFairFor(2^32) = 2^32", maxFairFor(2 ** 32) === 2 ** 32);
  check("maxFairFor(3) multiple of 3, gap < 3", maxFairFor(3) % 3 === 0 && 2 ** 32 - maxFairFor(3) < 3);

  // Bias report (§2 Step 2): rejected mass and plain-mod deviation
  const rejected = 2 ** 32 - maxFairFor(10000);
  check("rejected window = 7296", rejected === 7296);
  check("rejection probability = 7296/2^32 ~ 1.7e-6", Math.abs(rejected / 2 ** 32 - 1.7e-6) < 0.05e-6, (rejected / 2 ** 32).toExponential(3));
  const hi = Math.floor(2 ** 32 / 10000) + 1, lo = Math.floor(2 ** 32 / 10000);
  check("plain-mod counts 429497 x 7296 + 429496 x 2704 = 2^32", hi === 429497 && lo === 429496 && hi * 7296 + lo * 2704 === 2 ** 32);
  check("plain-mod per-outcome deviation <= 2^-32",
    Math.abs(hi / 2 ** 32 - 1e-4) <= 2 ** -32 && Math.abs(lo / 2 ** 32 - 1e-4) <= 2 ** -32);

  let inRange = true;
  let minR = Infinity, maxR = -Infinity;
  for (let n = 0; n < 20000; n++) {
    const r = diceRoll(seed1, "audit8f7ccfa4326c", n);
    if (!Number.isInteger(r) || r < 0 || r > 9999) inRange = false;
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
  }
  check("diceRoll integer in 0..9999 over 20000 nonces", inRange, `min ${minR} max ${maxR}`);
  let genOk = true;
  for (const range of [1, 2, 37, 10000, 2 ** 31, 2 ** 32]) {
    for (let n = 0; n < 200; n++) {
      const r = generateProvablyFairNumber(seed1, "x", n, 3, range);
      if (!Number.isInteger(r) || r < 0 || r >= range) genOk = false;
    }
  }
  check("generateProvablyFairNumber in [0, range) for ranges 1..2^32", genOk);
  check("salt cursor format", getProvablyFairHmacSalt("pfaudit-prod-dice-d1-9e7a04f27b2a", 12, 1) === "pfaudit-prod-dice-d1-9e7a04f27b2a:12:1");

  check("throws: uppercase seed", throws(() => diceRoll(seed1.toUpperCase(), "c", 0)));
  check("throws: odd-length seed", throws(() => commitHash("abc")));
  check("throws: negative nonce", throws(() => diceRoll(seed1, "c", -1)));
  check("throws: range 0", throws(() => maxFairFor(0)));
  check("throws: range > 2^32", throws(() => maxFairFor(2 ** 32 + 1)));

  return { pass, total, failed };
}

describe("LIQD Dice RNG, spec self-test (docs/ALGORITHM.md)", () => {
  it(`passes all ${EXPECTED_CHECKS} spec vector and property checks`, () => {
    const r = runSelftest();
    assert.deepStrictEqual(r.failed, []);
    assert.strictEqual(r.total, EXPECTED_CHECKS);
    assert.strictEqual(r.pass, EXPECTED_CHECKS);
  });
});
