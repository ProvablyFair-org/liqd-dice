#!/usr/bin/env node
/**
 * Reproduction of docs/ALGORITHM.md §7: every count the specification cites, recomputed from the
 * production dataset and the boundary-probe record with Node's crypto only. It imports nothing from
 * src/ or tests/: the candidates it tries are written out here, so the table in §2 can be re-run.
 *
 *   node scripts/algorithm-spec-check.mjs
 */
import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ds = JSON.parse(readFileSync(join(ROOT, 'data/dice-prod-5936bets.json'), 'utf8'));
const e17 = JSON.parse(readFileSync(join(ROOT, 'evidence/E17-prod-verify-boundary-probes-2026-11-09.json'), 'utf8'));
const seedOf = new Map(ds.seeds.map((s) => [s.epoch, s]));
const N = 10000, LIMIT = Math.floor(2 ** 32 / N) * N;
const served = (b) => Math.round(b.roll * 100);
const out = (s) => console.log(s);

// §1.2 commitment
const sha = (x) => createHash('sha256').update(x).digest('hex');
const ascii = ds.seeds.filter((s) => sha(Buffer.from(s.serverSeed, 'ascii')) === s.hashedServerSeed).length;
const bytes = ds.seeds.filter((s) => sha(Buffer.from(s.serverSeed, 'hex')) === s.hashedServerSeed).length;
const betsAscii = ds.bets.filter((b) => sha(Buffer.from(seedOf.get(b.epoch).serverSeed, 'ascii')) === b.hashedServerSeed).length;
out(`commitment SHA-256(ASCII seed) == hashedServerSeed: seed records ${ascii}/${ds.seeds.length}, bets ${betsAscii}/${ds.bets.length}; SHA-256(decoded bytes): seed records ${bytes}/${ds.seeds.length}`);
const pre = ds.meta.captures.filter((c) => sha(Buffer.from(c.preCapture.revealedServerSeed, 'ascii')) === c.preCapture.hashedServerSeed).length;
out(`pre-capture seeds: ${pre}/${ds.meta.captures.length} hash to their commitment; all ${ds.seeds.length + ds.meta.captures.length} revealed seeds are 32 lowercase hex: ${[...ds.seeds.map((s) => s.serverSeed), ...ds.meta.captures.map((c) => c.preCapture.revealedServerSeed)].every((x) => /^[0-9a-f]{32}$/.test(x))}`);
let links = 0, linkOk = 0, anchors = 0;
for (const c of ds.meta.captures) {
  const ss = ds.seeds.filter((s) => s.capture === c.index);
  for (let i = 0; i + 1 < ss.length; i++) { links++; if (ss[i].nextHashedServerSeed === ss[i + 1].hashedServerSeed) linkOk++; }
  if (c.preCapture.nextHashedServerSeed === ss[0].hashedServerSeed) anchors++;
}
out(`forward chain next -> active inside each capture file: ${linkOk}/${links}; pre-capture link to the file's first epoch: ${anchors}/${ds.meta.captures.length}`);

// §2 candidates: key form x message format x byte mapping
const keys = { 'hex-decoded bytes': (s) => Buffer.from(s, 'hex'), 'ASCII string': (s) => Buffer.from(s, 'ascii') };
const msgs = { 'c:n:0': (c, n) => `${c}:${n}:0`, 'c:n': (c, n) => `${c}:${n}`, 'c-n': (c, n) => `${c}-${n}`, 'cn': (c, n) => `${c}${n}`, 'n:c': (c, n) => `${n}:${c}` };
const maps = {
  'u32 big-endian mod 10000, rejection >= LIMIT': (d) => { for (let i = 0; i + 4 <= 32; i += 4) { const v = d.readUInt32BE(i); if (v < LIMIT) return v % N; } return -1; },
  'u32 big-endian mod 10000, no rejection': (d) => d.readUInt32BE(0) % N,
  'u32 big-endian mod 10001': (d) => d.readUInt32BE(0) % 10001,
  'u32 little-endian mod 10000': (d) => d.readUInt32LE(0) % N,
  'float from 4 bytes x 10000, floored': (d) => Math.floor((d[0] / 256 + d[1] / 65536 + d[2] / 16777216 + d[3] / 4294967296) * N),
  'float from 4 bytes x 10001, floored': (d) => Math.floor((d[0] / 256 + d[1] / 65536 + d[2] / 16777216 + d[3] / 4294967296) * 10001),
  'u32 x 10000 / 2^32, floored': (d) => Math.floor(d.readUInt32BE(0) * N / 2 ** 32),
  'float from 8 bytes x 10000, floored': (d) => { let f = 0; for (let i = 0; i < 8; i++) f += d[i] / 256 ** (i + 1); return Math.floor(f * N); },
  '52-bit float x 10000, floored': (d) => Math.floor(Number(BigInt('0x' + d.subarray(0, 7).toString('hex')) >> 4n) / 2 ** 52 * N),
  'whole digest as big integer mod 10000': (d) => Number(BigInt('0x' + d.toString('hex')) % 10000n),
  '5-hex windows < 10^6, mod 10000': (d) => { const h = d.toString('hex'); for (let i = 0; i + 5 <= h.length; i += 5) { const v = parseInt(h.slice(i, i + 5), 16); if (v < 1000000) return v % N; } return -1; },
};
const results = [];
for (const [kn, kf] of Object.entries(keys)) for (const [mn, mf] of Object.entries(msgs)) {
  const digests = ds.bets.map((b) => createHmac('sha256', kf(seedOf.get(b.epoch).serverSeed)).update(mf(b.clientSeed, b.nonce), 'utf8').digest());
  for (const [pn, pf] of Object.entries(maps)) results.push({ how: `HMAC key ${kn}, message ${mn}, ${pn}`, n: ds.bets.filter((b, i) => pf(digests[i]) === served(b)).length });
}
// plain SHA-256(seed text + message), first-u32 mod 10000, once per message format
for (const [mn, mf] of Object.entries(msgs)) results.push({ how: `SHA-256(seed text + ${mn}), u32 big-endian mod 10000`, n: ds.bets.filter((b) => createHash('sha256').update(seedOf.get(b.epoch).serverSeed + mf(b.clientSeed, b.nonce)).digest().readUInt32BE(0) % N === served(b)).length });
results.sort((a, z) => z.n - a.n);
out(`roll candidates tried: ${results.length}`);
for (const r of results.filter((x) => x.n === ds.bets.length)) out(`  ${r.n}/${ds.bets.length}  ${r.how}`);
out(`  best of the other ${results.filter((x) => x.n !== ds.bets.length).length}: ${results.find((x) => x.n !== ds.bets.length).n}/${ds.bets.length}`);
const digestOf = (b) => createHmac('sha256', Buffer.from(seedOf.get(b.epoch).serverSeed, 'hex')).update(`${b.clientSeed}:${b.nonce}:0`, 'utf8').digest();
out(`captured rounds whose first chunk is >= LIMIT (rejection path taken): ${ds.bets.filter((b) => digestOf(b).readUInt32BE(0) >= LIMIT).length}`);
const rolls = ds.bets.map(served);
out(`served roll range in hundredths: ${Math.min(...rolls)} .. ${Math.max(...rolls)}`);

// §3.1 win rule candidates
const hundred = (x) => Math.round(x * 100);
const rule = { 'half-open [L, U)': (r, L, U) => L <= r && r < U, 'inclusive [L, U]': (r, L, U) => L <= r && r <= U, 'open-lower (L, U]': (r, L, U) => L < r && r <= U };
for (const [name, f] of Object.entries(rule)) {
  const ok = ds.bets.filter((b) => { const inB = f(served(b), hundred(b.params.lower), hundred(b.params.upper)); return (b.params.inverted ? !inB : inB) === b.win; }).length;
  let pOk = 0;
  for (const p of e17.probes) { const rq = JSON.parse(p.request.body), rp = JSON.parse(p.body).outcome; const r = Math.round(rp.roll * 100); const inB = f(r, hundred(rq.params.lower), hundred(rq.params.upper)); if ((rq.params.inverted ? !inB : inB) === rp.win) pOk++; }
  out(`win rule ${name}: settled rounds ${ok}/${ds.bets.length}; verifier boundary probes (E17) ${pOk}/${e17.probes.length}`);
}
out(`settled rounds with the roll on the lower bound: ${ds.bets.filter((b) => served(b) === hundred(b.params.lower)).length}; on the upper bound: ${ds.bets.filter((b) => served(b) === hundred(b.params.upper)).length}`);

// §3.2 multiplier
const width = (p) => (p.inverted ? N - (hundred(p.upper) - hundred(p.lower)) : hundred(p.upper) - hundred(p.lower));
const wins = ds.bets.filter((b) => b.win), losses = ds.bets.filter((b) => !b.win);
out(`multiplier == double(9900 / width) on wins: ${wins.filter((b) => b.multiplier === 9900 / width(b.params)).length}/${wins.length}; == 99 / (width/100): ${wins.filter((b) => b.multiplier === 99 / (width(b.params) / 100)).length}; == 0.99 / (width/10000): ${wins.filter((b) => b.multiplier === 0.99 / (width(b.params) / N)).length}; losses with multiplier 0: ${losses.filter((b) => b.multiplier === 0).length}/${losses.length}`);
out(`captured widths: ${[...new Set(ds.bets.map((b) => width(b.params)))].sort((a, z) => a - z).join(', ')}`);

// §3.3 settlement: amount x 9900 / width on exact integers, by rounding mode
const units = (s) => { const [i, f = ''] = String(s).split('.'); return BigInt(i) * 100000000n + BigInt((f + '00000000').slice(0, 8)); };
const modes = { down: (n, d) => n / d, 'half-up': (n, d) => (2n * n + d) / (2n * d), 'half-even': (n, d) => { const q = n / d, r = n % d; return 2n * r > d || (2n * r === d && q % 2n === 1n) ? q + 1n : q; }, up: (n, d) => (n + d - 1n) / d };
const cnt = {}; for (const [k, f] of Object.entries(modes)) cnt[k] = wins.filter((b) => f(units(b.betAmount) * 9900n, BigInt(width(b.params))) === units(b.winningAmount)).length;
out(`winningAmount == round(amount x 9900 / width, 8 dp) on ${wins.length} wins, by mode: ${Object.entries(cnt).map(([k, n]) => `${k} ${n}`).join(', ')}`);
const offGrid = wins.filter((b) => (units(b.betAmount) * 9900n) % BigInt(width(b.params)) !== 0n).length;
out(`wins whose exact product is not on the 1e-8 grid: ${offGrid} (all settled at the rounded-down amount: ${wins.filter((b) => (units(b.betAmount) * 9900n) % BigInt(width(b.params)) !== 0n && units(b.winningAmount) === units(b.betAmount) * 9900n / BigInt(width(b.params))).length}); on the grid: ${wins.length - offGrid}`);
out(`losses paying 0: ${losses.filter((b) => units(b.winningAmount) === 0n).length}/${losses.length}`);
out(`stakeWallet == betAmount and winningAmountWallet == winningAmount: ${ds.bets.filter((b) => units(b.stakeWallet) === units(b.betAmount) && units(b.winningAmountWallet) === units(b.winningAmount)).length}/${ds.bets.length}`);
out(`stakes captured: ${[...new Set(ds.bets.map((b) => b.betAmount))].join(', ')} ${ds.meta.currency}`);
// LIQD's verifier: stored reply per round, and the boundary probes
out(`LIQD verify reply == served roll, win, multiplier: ${ds.bets.filter((b) => b.verifier.outcome.roll === b.roll && b.verifier.outcome.win === b.win && b.verifier.outcome.multiplier === b.multiplier).length}/${ds.bets.length}`);
let pRoll = 0; for (const p of e17.probes) { const rq = JSON.parse(p.request.body); const d = createHmac('sha256', Buffer.from(rq.serverSeed, 'hex')).update(`${rq.clientSeed}:${rq.nonce}:0`, 'utf8').digest(); if (d.readUInt32BE(0) % N === Math.round(JSON.parse(p.body).outcome.roll * 100)) pRoll++; }
out(`E17 probes: roll of this specification == LIQD's verifier roll on ${pRoll}/${e17.probes.length}`);
out(`client seeds: ${ds.seeds.filter((s) => /^audit[0-9a-f]{12}$/.test(s.clientSeed)).length} of form audit + 12 hex (17 characters), ${ds.seeds.filter((s) => /^pfaudit-prod-dice-d\d-[0-9a-f]{12}$/.test(s.clientSeed)).length} player-set of 33 characters; all ASCII: ${ds.seeds.every((s) => /^[\x20-\x7e]+$/.test(s.clientSeed))}; nonces per epoch start at ${[...new Set(ds.seeds.map((s) => s.nonceStart))].join(',')}`);
