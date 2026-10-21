/**
 * Spec self-test: docs/ALGORITHM.md vectors and properties, run against src/rng.ts.
 *
 * Written by the clean-room implementer together with src/rng.ts, from docs/ALGORITHM.md and the module
 * interface alone (never from LIQD's code). Integrated 20 Oct 2026: the checks are unchanged; only the
 * import path, the mocha wrapper and the reporting (failures collected instead of printed) were adapted.
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

const EXPECTED_CHECKS = 84;

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
  // §3.3 stage 1: 9900/width rounded to nearest at 8 decimals (half-up on a tie, O3)
  function m8Units(width: number): bigint {
    const num = 9900n * 10n ** 8n;
    const w = BigInt(width);
    let q = num / w;
    const r = num % w;
    if (2n * r >= w) q += 1n;
    return q;
  }
  // §3.3 stage 2: amount x m8 at 1e-16, half-even to 1e-8
  function stage2(amount: string, m8: bigint): { raw: bigint; won: bigint } {
    const raw = toUnits(amount, 8) * m8; // scale 1e-16
    const base = 10n ** 8n;
    let q = raw / base;
    const r = raw % base;
    if (2n * r > base || (2n * r === base && q % 2n === 1n)) q += 1n;
    return { raw, won: q };
  }

  interface Vec {
    id: string; seed: string; commit: string; client: string; nonce: number;
    lower: string; upper: string; inverted: boolean; amount: string;
    hmac: string; u32: number; roll: number; win: boolean; width: number;
    mult: number; m8?: string; raw?: string; won: string;
  }

  const V: Vec[] = [
    { id: "V1", seed: "015307d5a3f62db476210c3797bac8b7", commit: "918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8",
      client: "auditf2456fc140ac", nonce: 0, lower: "0", upper: "92.37", inverted: false, amount: "0.1",
      hmac: "475461d14638cca3e385e940e763bf808fa6ef6c05f1a83c333dc25e586c5b6e", u32: 1196712401, roll: 2401, win: true, width: 9237,
      mult: 1.071776550828191, m8: "1.07177655", raw: "0.107177655", won: "0.10717766" },
    { id: "V2", seed: "36a8d90f5e7cd710ae29bfc89eb709c7", commit: "11ff13d04fe380139447a5c1643da301ee883ee6e3e10e11b0b5f56189c651f9",
      client: "audit4195522a3970", nonce: 47, lower: "99", upper: "100", inverted: false, amount: "0.1",
      hmac: "bd93f34cf8d0aef107a4d487d17b8fd5373d9599badd953830bddccece381674", u32: 3180589900, roll: 9900, win: true, width: 100,
      mult: 99, won: "9.9" },
    { id: "V3", seed: "015307d5a3f62db476210c3797bac8b7", commit: "918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8",
      client: "auditf2456fc140ac", nonce: 18, lower: "10.22", upper: "66.49", inverted: false, amount: "0.1",
      hmac: "4d760f8d17c14858f9b7fe6568156de067a40dbffb23c68d5743767c5eb1ce1d", u32: 1299582861, roll: 2861, win: true, width: 5627,
      mult: 1.759374444641905, m8: "1.75937444", raw: "0.175937444", won: "0.17593744" },
    { id: "V4", seed: "015307d5a3f62db476210c3797bac8b7", commit: "918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8",
      client: "auditf2456fc140ac", nonce: 41, lower: "46.27", upper: "56.35", inverted: true, amount: "0.1",
      hmac: "cab70be16f56a77447dd92143b4a3f1e81609922136bc8781b491589383a53f9", u32: 3400993761, roll: 3761, win: true, width: 8992,
      mult: 1.1009786476868328, m8: "1.10097865", raw: "0.110097865", won: "0.11009786" },
    { id: "V5", seed: "bfde02800431d623efda4473c8966a25", commit: "a315d0f959b19e8a2762fa90abde4b94c1915528e296d92a85b5db2921cf8ffa",
      client: "audit085813da8559", nonce: 0, lower: "50", upper: "100", inverted: false, amount: "10",
      hmac: "7abf491376aafaeb9efd6de1ed3651eef9c2a91eed254d1f780152c41a31fa3d", u32: 2059356435, roll: 6435, win: true, width: 5000,
      mult: 1.98, won: "19.8" },
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
    const m8 = m8Units(ww.width);
    if (v.m8) check(`${v.id} m8`, fmt(m8, 8) === v.m8, fmt(m8, 8));
    const s2 = stage2(v.amount, m8);
    if (v.raw) check(`${v.id} amount x m8`, fmt(s2.raw, 16) === v.raw, fmt(s2.raw, 16));
    check(`${v.id} amount_won`, fmt(s2.won, 8) === v.won, fmt(s2.won, 8));
  }

  // V6: LIQD verify endpoint roll
  check("V6 diceRoll nonce 1000", diceRoll("015307d5a3f62db476210c3797bac8b7", "auditf2456fc140ac", 1000) === 361);
  check("V6 display 3.61", (diceRoll("015307d5a3f62db476210c3797bac8b7", "auditf2456fc140ac", 1000) / 100).toFixed(2) === "3.61");

  // §3.1 half-open probes from the spec (roll 361)
  check("probe [0,3.61) loss", winAndWidth(361, "0", "3.61", false).win === false);
  check("probe [3.61,10) win", winAndWidth(361, "3.61", "10", false).win === true);
  check("probe inverted [0.5,3.61] win", winAndWidth(361, "0.5", "3.61", true).win === true);
  check("probe inverted [3.61,10] loss", winAndWidth(361, "3.61", "10", true).win === false);
  check("probe [3.61,100] win", winAndWidth(361, "3.61", "100", false).win === true);
  check("probe widths 362/639/9689/9639 multipliers",
    9900 / winAndWidth(361, "0", "3.62", false).width === 27.34806629834254 &&
    9900 / 639 === 15.492957746478874 && 9900 / 9689 === 1.0217772731964083 && 9900 / 9639 === 1.0270774976657329);

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
    const r = diceRoll(seed1, "auditf2456fc140ac", n);
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
  check("salt cursor format", getProvablyFairHmacSalt("pfaudit-1787856766341-124", 12, 1) === "pfaudit-1787856766341-124:12:1");

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
