#!/usr/bin/env node
// Capture reference for qa.liqd.com; transport setup and credentials are required.
// Not part of offline verification. Before production use, implement and validate
// the capture requirements in AUDIT_CONTEXT.md §13, including durable recovery
// after uncertain settlement or rotation and reconciliation with operator records.
// Dataset provenance and differences from the retained capture: §3 and §14.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
// Session-side module; shipped in this repo as capture/rng.reference.mjs (same code).
import { diceRoll, diceWin, diceWinChancePct, diceMultiplier, commitHash } from './rng.reference.mjs';
import { createClientSeedChooser } from './client-seed.reference.mjs';
import { createBetOperation, isRetryable } from './bet-operation.reference.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, 'outputs');
const CHECKPOINT = join(OUT_DIR, 'dice-capture-checkpoint.json');

// ── CLI ───────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n, d) => { const h = argv.find((a) => a === `--${n}` || a.startsWith(`--${n}=`)); if (!h) return d; const eq = h.indexOf('='); return eq === -1 ? true : h.slice(eq + 1); };
const PROBE = !!flag('probe', false);
const RESUME = !!flag('resume', false);
const DEMO = !!flag('demo', false);
const CURRENCY = String(flag('currency', 'USDC'));
const DELAY_BET = Number(flag('delay', 350));
const DELAY_ROTATE = 1200;
const TOTAL_OVERRIDE = flag('total', null);
const HOUSE_EDGE = 0.01;

const EPOCH = 50;
const AMT_LOW = 0.10, AMT_STAKE = 10;
const MAX_TRANSIENT = 40, REQ_TIMEOUT = 20000, SAVE_EVERY = 10;

const BASE = 'https://qa.liqd.com/api/v1';
const EP = {
  active: `${BASE}/fast-games/provably-fair/active`,
  rotate: `${BASE}/fast-games/provably-fair/rotate`,
  bet:    `${BASE}/originals/dice/place-bet`,
  verify: `${BASE}/originals/dice/verify`,
};
const COOKIE = process.env.LIQD_COOKIE || '';
// Cloudflare's clearance is User-Agent-bound: the UA MUST match the browser that
// solved the challenge. set-cookie.sh exports LIQD_UA from the copied cURL; fall back
// to a current Chrome/macOS string only if it wasn't captured.
const UA = process.env.LIQD_UA || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
const STAMP = Date.now();

// ── Band configs ───────────────────────────────────────────────────────────────
// originals-dice limits (get-game-settings id 34): minOdds 1.0102, maxOdds 99 →
// multiplier = 99/winChance% must stay in [1.0102, 99], so win chance ∈ ~[1%, 98%].
const under = (upper) => ({ lower: 0, upper, inverted: false });
const over  = (lower) => ({ lower, upper: 100, inverted: false });
const inside = (lower, upper) => ({ lower, upper, inverted: false });
const outside = (lower, upper) => ({ lower, upper, inverted: true }); // "inverted" mode
const round2 = (x) => Math.round(x * 100) / 100;

// Random target across ALL FOUR modes — the LIQD analogue of HB/Duel dice "random target".
// Win chance uniform in [1.02%, 98%] (mult ~1.0206×…97×, inside the odds window); each mode
// maps that win chance to a valid band, so Phase A sweeps the full outcome + payout space.
function randParams() {
  const wc = round2(1.02 + Math.random() * (98 - 1.02));
  const mode = Math.floor(Math.random() * 4);
  if (mode === 0) return under(wc);                                   // [0, wc]
  if (mode === 1) return over(round2(100 - wc));                     // [100-wc, 100]
  if (mode === 2) { const lo = round2(Math.random() * (100 - wc)); return inside(lo, round2(Math.min(100, lo + wc))); }
  const w = round2(100 - wc); const lo = round2(Math.random() * (100 - w)); return outside(lo, round2(Math.min(100, lo + w)));
}

// ── Plan: mirrors the PF.org standard dice capture (HB/Duel) — 6,700 bets, 50/seed ──
//   A 5,000 random target (all modes)     — full-range outcome uniformity + payout sweep
//   B 1,000 fixed high-multiplier tail     — 500 over(98) ~2% (49.5×) + 500 over(99) ~1% (99×, maxOdds)
//   C   200 @ $10 fixed over(50)           — stake independence
//   D   500 random target, custom pfaudit  — client-seed control
function buildEpochs() {
  const epochs = [];
  const epR = (phase, amount, seedTag) => epochs.push({ phase, amount, seedTag, bets: Array.from({ length: EPOCH }, () => ({ params: randParams() })) });
  const epF = (phase, amount, seedTag, params) => epochs.push({ phase, amount, seedTag, bets: Array.from({ length: EPOCH }, () => ({ params })) });
  for (let e = 0; e < 100; e++) epR('A', AMT_LOW, 'audit');            // A — 5,000 random
  for (let e = 0; e < 10; e++) epF('B', AMT_LOW, 'audit', over(98));   // B1 — 500 @ over 98 (~2%, 49.5×)
  for (let e = 0; e < 10; e++) epF('B', AMT_LOW, 'audit', over(99));   // B2 — 500 @ over 99 (~1%, 99× maxOdds)
  for (let e = 0; e < 4;  e++) epF('C', AMT_STAKE, 'audit', over(50)); // C — 200 @ $10
  for (let e = 0; e < 10; e++) epR('D', AMT_LOW, 'pfaudit');           // D — 500 random, custom seeds
  return epochs;
}
function buildSmoke(total) {
  const epochs = []; let made = 0;
  while (made < total) { const n = Math.min(EPOCH, total - made); epochs.push({ phase: 'A', amount: AMT_LOW, seedTag: 'audit', bets: Array.from({ length: n }, () => ({ params: randParams() })) }); made += n; }
  return epochs;
}
let EPOCHS = TOTAL_OVERRIDE != null ? buildSmoke(Number(TOTAL_OVERRIDE)) : buildEpochs();
const TOTAL_BETS = EPOCHS.reduce((s, e) => s + e.bets.length, 0);

// ── Dataset ─────────────────────────────────────────────────────────────────────
let dataset = {
  meta: {
    audit: 'liqd Dice', platform: 'qa.liqd.com', gameId: 'originals-dice', schema: 'liqd-dice-capture-v1',
    houseEdge: HOUSE_EDGE, currency: CURRENCY, epochSize: EPOCH, plannedTotal: TOTAL_BETS,
    limits: { minOdds: 1.0102, maxOdds: 99, minBetUsdc: 0.1, maxBetUsdc: 9898 },
    diceModel: { range: 10000, cursor: 0, rollCeiling: 99.99, params: ['lower', 'upper', 'inverted'] },
    phases: { A: { bets: 5000, target: 'random' }, B: { bets: 1000, target: 'over98+over99' }, C: { bets: 200, amount: AMT_STAKE, target: 'over50' }, D: { bets: 500, target: 'random', customSeeds: true } },
    startedAt: null, finishedAt: null, progress: {}, preCapture: null,
  },
  seeds: [], bets: [],
};

// ── Utils / rendering ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const randHex = (n) => randomBytes(n).toString('hex');
const idemKey = () => `dice-${STAMP}-${randHex(8)}`;
const clientSeedChooser = createClientSeedChooser({ randomBytes, now });
const clientSeedFor = (E, tag, commitment, commitmentSource) =>
  clientSeedChooser.chooseAfterCommitment({ epoch: E, tag, commitment, commitmentSource });
const bandLabel = (p) => p.inverted ? `!${p.lower}-${p.upper}` : (p.lower === 0 ? `<${p.upper}` : (p.upper === 100 ? `>${p.lower}` : `${p.lower}-${p.upper}`));
const isTTY = !!process.stdout.isTTY;
const cols = () => process.stdout.columns || 100;
const comma = (n) => Number(n).toLocaleString('en-US');
const C = { reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m', gray: '\x1b[90m', green: '\x1b[92m', cyan: '\x1b[96m', mag: '\x1b[95m', yellow: '\x1b[93m', blue: '\x1b[94m', red: '\x1b[91m', orange: '\x1b[38;5;208m' };
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const CLR = '\r\x1b[2K';
function fmtTime(s) { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}h${String(m).padStart(2, '0')}m` : m ? `${m}m${String(x).padStart(2, '0')}s` : `${x}s`; }
function smoothBar(frac, width) { frac = Math.max(0, Math.min(1, frac)); const parts = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉']; const exact = frac * width, full = Math.floor(exact), partial = parts[Math.floor((exact - full) * 8)] || ''; const empty = Math.max(0, width - full - (partial ? 1 : 0)); return C.green + '█'.repeat(full) + partial + C.reset + C.gray + '·'.repeat(empty) + C.reset; }
const phaseBadge = (p) => (({ A: C.cyan, B: C.mag, C: C.yellow, D: C.blue, E: C.orange }[p]) || C.cyan) + C.bold + `[${p}]` + C.reset;
function logAbove(msg) { if (isTTY) process.stdout.write(CLR); console.log(msg); }
let lastDraw = 0;
function draw(i, phase, label, rate, t0, last) {
  const t = Date.now(); if (t - lastDraw < 80 && i < TOTAL_BETS) return; lastDraw = t;
  const frac = i / TOTAL_BETS, el = (t - t0) / 1000, eta = rate > 0 ? (TOTAL_BETS - i) / rate : 0, pct = (frac * 100).toFixed(1) + '%';
  if (!isTTY) { if (i % 100 === 0 || i === TOTAL_BETS) console.log(`${pct}  ${i}/${TOTAL_BETS}  [${phase}] ${label}  ${rate.toFixed(0)}/s  ETA ${fmtTime(eta)}`); return; }
  const left = `${phaseBadge(phase)} ${C.bold}${pct.padStart(6)}${C.reset} ${C.gray}${comma(i)}/${comma(TOTAL_BETS)}${C.reset} `;
  const meta = `${C.dim}${label}  ${rate.toFixed(0)}/s  ${fmtTime(el)}${C.reset}${C.gray}·ETA ${C.reset}${C.dim}${fmtTime(eta)}${C.reset}`;
  let drop = `  ${C.gray}${last}${C.reset}`, w = cols() - 1;
  let barW = w - strip(left).length - strip(meta).length - strip(drop).length - 3;
  if (barW < 12) { drop = ''; barW = w - strip(left).length - strip(meta).length - 3; }
  barW = Math.max(8, barW);
  process.stdout.write(`${CLR}${left}${smoothBar(frac, barW)}  ${meta}${drop}`);
}

const HERE_REQ = join(HERE, 'req.py');
const PY_BIN = process.env.LIQD_PYTHON || 'python3';
const CURL_BIN = process.env.LIQD_CURL || '';   // set to a curl-impersonate binary to use it instead
class HttpError extends Error { constructor(m, k) { super(m); this.kind = k; } }
function transport(method, url, body) {
  return new Promise((resolve, reject) => {
    const done = (err, stdout, stderr) => {
      if (err && err.code === 'ENOENT') return reject(new HttpError(`${CURL_BIN || PY_BIN} not found`, 'AUTH'));
      if (err && !stdout) return reject(new HttpError('transport ' + (err.killed ? 'timeout' : (stderr || err.message).slice(0, 120)), 'TRANSIENT'));
      const out = String(stdout);
      if (CURL_BIN) {
        const i = out.lastIndexOf('\n__STATUS__');
        if (i === -1) return reject(new HttpError('curl: no status marker — ' + out.slice(0, 120), 'TRANSIENT'));
        return resolve({ status: Number(out.slice(i + 11).trim()), text: out.slice(0, i) });
      }
      // python req.py prints "<status>\n<body>"
      const nl = out.indexOf('\n');
      const status = Number(out.slice(0, nl).trim());
      const text = out.slice(nl + 1);
      if (/__NO_CURL_CFFI__/.test(text)) return reject(new HttpError('curl_cffi missing — run:  pip3 install curl_cffi', 'AUTH'));
      if (/__REQ_ERR__/.test(text)) return reject(new HttpError('transport ' + text.slice(0, 120), 'TRANSIENT'));
      resolve({ status, text });
    };
    const opts = { maxBuffer: 8 * 1024 * 1024, timeout: REQ_TIMEOUT + 5000 };
    if (CURL_BIN) {
      const args = ['-sS', '--compressed', '--max-time', String(Math.ceil(REQ_TIMEOUT / 1000)), '-X', method, '-b', COOKIE,
        '-H', 'Accept: application/json', '-H', 'Origin: https://qa.liqd.com', '-H', 'Referer: https://qa.liqd.com/originals/dice',
        '-w', '\n__STATUS__%{http_code}'];
      if (body) { args.push('-H', 'Content-Type: application/json', '--data-raw', JSON.stringify(body)); }
      args.push(url);
      execFile(CURL_BIN, args, opts, done);
    } else {
      const child = execFile(PY_BIN, [HERE_REQ, method, url], opts, done);
      child.stdin.end(body ? JSON.stringify(body) : '');
    }
  });
}
async function http(method, url, body) {
  if (!COOKIE) throw new HttpError('LIQD_COOKIE empty — source ./set-cookie.sh', 'AUTH');
  const { status, text } = await transport(method, url, body);
  if (status === 401 || status === 403) throw new HttpError(`${status} auth rejected`, 'AUTH');
  if (/cf-mitigated|Just a moment|__cf_chl|challenge-platform/i.test(text)) throw new HttpError('Cloudflare challenge — Chrome-TLS transport rejected (curl_cffi installed?)', 'AUTH');
  if (/Cloudflare Access|<!DOCTYPE html|<html/i.test(text)) throw new HttpError('Cloudflare Access sign-in — cookie expired', 'AUTH');
  if (status === 429) throw new HttpError('429 rate limited', 'TRANSIENT');
  if (status >= 500) throw new HttpError(`${status} server error`, 'TRANSIENT');
  let json; try { json = JSON.parse(text); } catch { throw new HttpError(`${status} non-JSON: ${text.slice(0, 120)}`, 'TRANSIENT'); }
  if (json && Array.isArray(json.errors) && json.errors.length) {
    const code = json.errors[0]?.errorCode;
    const e = new HttpError('api error: ' + JSON.stringify(json.errors).slice(0, 200), 'API'); e.code = code; throw e;
  }
  return json && json.data !== undefined ? json.data : json;
}
async function retry(fn, label, onStatus) {
  let attempt = 0;
  for (;;) {
    try { return await fn(); }
    catch (e) { if (!isRetryable(e)) throw e; attempt++; if (attempt >= MAX_TRANSIENT) throw new HttpError(`${label} failed after ${attempt} retries: ${e.message}`, 'TRANSIENT'); const wait = Math.min(2000 * attempt, 30000); if (onStatus) onStatus(`${label} hiccup: ${e.message.slice(0, 40)} — retry ${attempt}/${MAX_TRANSIENT} in ${Math.round(wait / 1000)}s`); await sleep(wait); }
  }
}
const pick = (o, ...k) => { for (const x of k) if (o && o[x] != null) return o[x]; return undefined; };
const readActive = (a) => ({ hashedServerSeed: pick(a, 'activeServerSeedHash', 'hashedServerSeed'), nextHashedServerSeed: pick(a, 'nextServerSeedHash', 'nextHashedServerSeed'), clientSeed: pick(a, 'activeClientSeed', 'clientSeed'), nonce: pick(a, 'nonce') });
const readRotate = (r) => ({ revealedServerSeed: pick(r, 'revealedServerSeed', 'serverSeed'), hashedServerSeed: pick(r, 'activeServerSeedHash', 'hashedServerSeed'), nextHashedServerSeed: pick(r, 'nextServerSeedHash', 'nextHashedServerSeed'), clientSeed: pick(r, 'clientSeed', 'activeClientSeed'), nonce: pick(r, 'nonce') });
const getActive = async () => readActive(await http('GET', EP.active));
const rotate = async (clientSeed) => readRotate(await http('POST', EP.rotate, { clientSeed }));

function required(value, field, envelope) {
  if (value === undefined || value === null || value === '') {
    throw Object.assign(new Error(`capture: settle response is missing required field \`${field}\` — refusing to synthesize it. Envelope: ${JSON.stringify(envelope).slice(0, 400)}`), { kind: 'SCHEMA' });
  }
  return value;
}
function requiredNumber(value, field, envelope) {
  const n = Number(required(value, field, envelope));
  if (!Number.isFinite(n)) {
    throw Object.assign(new Error(`capture: settle response field \`${field}\` is not a finite number (${JSON.stringify(value)})`), { kind: 'SCHEMA' });
  }
  return n;
}

async function placeBet(params, amount, idempotencyKey = idemKey()) {
  const s = await http('POST', EP.bet, { idempotencyKey, stake: String(amount), params });
  const round = s.round || {};
  const w = (round.wagers || []).find((x) => x.betType === 'main') || (round.wagers || [])[0] || {};
  const oc = w.outcome || {};
  const win = required(oc.win, 'round.wagers[].outcome.win', s);
  return {
    raw: s,
    id: required(round.betId ?? round.roundId, 'round.betId', s),                  // RESPONSE
    nonce: requiredNumber(s.consumedNonce ?? round.nonce ?? s.provablyFair?.nonce, 'consumedNonce', s), // RESPONSE
    clientSeed: round.clientSeed ?? s.provablyFair?.clientSeed,                    // RESPONSE, may be absent → CACHED at the call site
    clientSeedFromResponse: (round.clientSeed ?? s.provablyFair?.clientSeed) != null,
    serverSeedId: round.serverSeedId,                                             // RESPONSE
    roll: requiredNumber(oc.roll, 'round.wagers[].outcome.roll', s),               // RESPONSE, NORMALIZED
    rollRaw: String(required(oc.roll, 'round.wagers[].outcome.roll', s)),          // RESPONSE, verbatim text
    win,                                                                          // RESPONSE, verbatim
    // On a LOSS the operator returns multiplier 0 / winningAmount 0; that is a real settlement and
    // `required` accepts it. What is refused is an ABSENT field, which is not a settlement at all.
    multiplier: requiredNumber(oc.multiplier, 'round.wagers[].outcome.multiplier', s),   // RESPONSE, NORMALIZED
    multiplierRaw: String(required(oc.multiplier, 'round.wagers[].outcome.multiplier', s)),
    result: required(w.result, 'round.wagers[].result', s),                        // RESPONSE
    betAmount: requiredNumber(w.stake, 'round.wagers[].stake', s),                 // RESPONSE, NORMALIZED (String→Number)
    betAmountRaw: String(required(w.stake, 'round.wagers[].stake', s)),            // RESPONSE, verbatim text
    winningAmount: requiredNumber(w.winningAmount, 'round.wagers[].winningAmount', s),   // RESPONSE, NORMALIZED
    winningAmountRaw: String(required(w.winningAmount, 'round.wagers[].winningAmount', s)),
    // Wallet-denominated debit/credit. NOT required: the operator does not promise them, and a
    // capture that fabricated them would be inventing the very evidence L5 says is missing.
    stakeWallet: w.stakeWallet != null ? Number(w.stakeWallet) : undefined,        // RESPONSE if present
    winningAmountWallet: w.winningAmountWallet != null ? Number(w.winningAmountWallet) : undefined,
    balance: undefined, // ABSENT BY CONTRACT — no running wallet balance in the dice settle response (L5)
  };
}

// ── Checkpoint ─────────────────────────────────────────────────────────────────
function save() { dataset.meta.progress.savedAt = now(); dataset.meta.progress.bets = dataset.bets.length; dataset.meta.progress.seeds = dataset.seeds.length; writeFileSync(CHECKPOINT, JSON.stringify(dataset, null, 2)); }
function load() { if (!existsSync(CHECKPOINT)) { console.log('No checkpoint — starting fresh.'); return 0; } dataset = JSON.parse(readFileSync(CHECKPOINT, 'utf8')); const done = dataset.seeds.filter((s) => s.serverSeed != null).length; dataset.seeds = dataset.seeds.slice(0, done); dataset.bets = dataset.bets.filter((b) => b.epoch < done); console.log(`Resumed: ${done} revealed epochs, ${dataset.bets.length} bets. Continuing at epoch ${done}.`); return done; }

// ── Inline verify ─────────────────────────────────────────────────────────────────
// Per bet: (1) roll recomputes from the revealed seed and equals the served roll;
// (2) win flag agrees with the recomputed band rule; (3) served multiplier matches the
// fair-odds model (99/winChance%) within display rounding; (4) credited winningAmount ==
// stake × the SERVED multiplier (operator arithmetic is self-consistent). Wallet-denominated
// amounts (stakeWallet/winningAmountWallet) are captured for the money-path record.
function verifyEpoch(E, hashedServerSeed, revealedServerSeed) {
  const commitOk = commitHash(revealedServerSeed) === hashedServerSeed;
  let checked = 0, bad = 0, creditChecked = 0, creditBad = 0, multChecked = 0, multBad = 0;
  const epochBets = dataset.bets.filter((b) => b.epoch === E).sort((a, c) => (a.nonce ?? 0) - (c.nonce ?? 0));
  for (const b of epochBets) {
    const localRoll = diceRoll(revealedServerSeed, b.clientSeed, b.nonce);
    const localWin = diceWin(localRoll, b.params);
    b.localRoll = localRoll; b.localWin = localWin;
    b.verified = Math.abs(localRoll - Number(b.roll)) < 1e-9 && (b.win == null || localWin === !!b.win);
    checked++; if (!b.verified) bad++;
    const bet = Number(b.betAmount), win = Number(b.winningAmount || 0), served = Number(b.multiplier || 0);
    // fair-odds model vs served multiplier (allow the operator's display rounding)
    if (b.win) { const model = diceMultiplier(b.params, HOUSE_EDGE); b.modelMultiplier = model; b.multOk = Math.abs(served - model) <= 0.01; multChecked++; if (!b.multOk) multBad++; }
    // operator arithmetic: credited amount == stake × the served multiplier
    const expWin = b.win ? bet * served : 0;
    b.creditedOk = Math.abs(win - expWin) < 1e-6; creditChecked++; if (!b.creditedOk) creditBad++;
    // wallet-denominated credit consistency (1:1 for USDC; guards non-1:1 currencies)
    if (b.winningAmountWallet != null && b.stakeWallet != null) {
      const expWinW = b.win ? Number(b.stakeWallet) * served : 0;
      b.walletOk = Math.abs(Number(b.winningAmountWallet) - expWinW) < 1e-6;
    }
  }
  return { commitOk, checked, bad, creditChecked, creditBad, multChecked, multBad, balChecked: 0, balBad: 0 };
}

// ── Probe ────────────────────────────────────────────────────────────────────────
async function runProbe() {
  console.log('\n── PROBE ── endpoints + local verification (6 bets: 4 modes + 2 odds boundaries)\n');
  const a = await getActive();
  console.log(`GET /active → hash=${a.hashedServerSeed} clientSeed=${a.clientSeed} nonce=${a.nonce}`);
  // 4 modes + the two odds extremes the full run leans on: over(99)=maxOdds 99×, under(1.5)=~66×.
  const plan = [under(50), over(50), inside(25, 75), outside(25, 75), over(99), under(1.5)];
  for (const params of plan) {
    const s = await placeBet(params, AMT_LOW);
    dataset.bets.push({ epoch: 0, params, nonce: s.nonce, clientSeed: s.clientSeed ?? a.clientSeed, hashedServerSeed: a.hashedServerSeed, roll: s.roll, win: s.win, multiplier: s.multiplier, result: s.result, betAmount: s.betAmount, winningAmount: s.winningAmount, stakeWallet: s.stakeWallet, winningAmountWallet: s.winningAmountWallet, balance: s.balance });
    console.log(`  bet ${bandLabel(params)} → nonce=${s.nonce} roll=${s.roll} win=${s.win} mult=${s.multiplier} winAmt=${s.winningAmount} bal=${s.balance ?? '—'}`);
    await sleep(DELAY_BET);
  }
  console.log('\nRotating to reveal...');
  // The commitment for the epoch this seed belongs to is `a.nextHashedServerSeed`, already
  // received in the `active` response above — so it precedes the draw, by construction.
  const r = await rotate(clientSeedFor(1, 'audit', a.nextHashedServerSeed, 'provably-fair/active').clientSeed);
  const v = verifyEpoch(0, a.hashedServerSeed, r.revealedServerSeed);
  console.log('\n── VERIFY ──');
  console.log(`  commit SHA256(utf8(serverSeed)) == active hash : ${v.commitOk ? '✅ MATCH' : '❌ MISMATCH'}`);
  console.log(`  local roll recompute == served roll : ${v.checked - v.bad}/${v.checked} ${v.bad ? '❌' : '✅'}`);
  console.log(`  served multiplier == fair model (99/winChance) : ${v.multChecked - v.multBad}/${v.multChecked} ${v.multBad ? '❌' : '✅'}`);
  console.log(`  credited winningAmount == stake × served multiplier : ${v.creditChecked - v.creditBad}/${v.creditChecked} ${v.creditBad ? '❌' : '✅'}`);
  console.log(`  wallet amounts captured (stakeWallet/winningAmountWallet) : ${dataset.bets.filter((b) => b.winningAmountWallet != null).length}/${dataset.bets.length}`);
  console.log(v.commitOk && v.bad === 0 && v.creditBad === 0 ? '\n✅ Confirmed end-to-end. Ready for `npm run capture`.\n' : '\n⚠️  Not green — stop and investigate (dump dataset.bets[0..3].raw).\n');
}

// ── Capture ──────────────────────────────────────────────────────────────────────
async function runCapture(startEpoch) {
  if (!dataset.meta.startedAt) dataset.meta.startedAt = now();
  const done = dataset.bets.length;
  const turnover = (5000 + 1000 + 500) * AMT_LOW + 200 * AMT_STAKE;
  console.log(`\n── CAPTURE ── ${TOTAL_BETS} bets · ${EPOCHS.length} epochs · ${EPOCH}/seed`);
  console.log(`   A 5,000 random · B 1,000 tail (over98/over99) · C 200@$${AMT_STAKE} · D 500 (pfaudit)   turnover ≈ ${turnover.toFixed(0)} ${CURRENCY} · EV cost ≈ ${(turnover * HOUSE_EDGE).toFixed(2)} ${CURRENCY}\n`);
  let t0 = Date.now(), placed = done, lastResult = '';
  const onStatus = (msg) => { if (isTTY) process.stdout.write(`${CLR}  ${C.yellow}⟳${C.reset} ${C.dim}${msg}${C.reset}`); else console.log(msg); };

  let cur;
  if (startEpoch === 0) {
    const pre = await retry(() => getActive(), 'active', onStatus);
    dataset.meta.preCapture = { at: now(), hashedServerSeed: pre.hashedServerSeed, clientSeed: pre.clientSeed, nonce: pre.nonce, nextHashedServerSeed: pre.nextHashedServerSeed, revealedServerSeed: null, commitVerified: null };
    logAbove(`${C.dim}current seed snapshot — hash ${String(pre.hashedServerSeed).slice(0, 12)}… nonce ${pre.nonce}${C.reset}`);
    // `pre.nextHashedServerSeed` is the commitment that will be active for epoch 0; it was read
    // and recorded in meta.preCapture above, BEFORE this client seed is drawn.
    const seed0 = clientSeedFor(0, EPOCHS[0].seedTag, pre.nextHashedServerSeed, 'provably-fair/active');
    dataset.meta.preCapture.nextClientSeedChoice = seed0;
    cur = await retry(() => rotate(seed0.clientSeed), 'rotate', onStatus);
    dataset.meta.preCapture.revealedServerSeed = cur.revealedServerSeed;
    dataset.meta.preCapture.commitVerified = cur.revealedServerSeed ? commitHash(cur.revealedServerSeed) === dataset.meta.preCapture.hashedServerSeed : null;
    logAbove(`${C.dim}rotated to a fresh seed; starting clean at epoch 0 nonce 0${C.reset}`);
  } else {
    cur = await retry(() => getActive(), 'active', onStatus);
    logAbove(`${C.dim}resume: continuing from the current active seed (chain-preserving) at epoch ${startEpoch}${C.reset}`);
  }
  const startSeed = (E) => { dataset.seeds[E] = { epoch: E, phase: EPOCHS[E].phase, at: now(), clientSeed: cur.clientSeed, hashedServerSeed: cur.hashedServerSeed, nextHashedServerSeed: cur.nextHashedServerSeed, serverSeed: null, nonceStart: cur.nonce ?? 0, nonceEnd: null, commitVerified: null, chainLinkOk: null }; };
  startSeed(startEpoch);

  for (let E = startEpoch; E < EPOCHS.length; E++) {
    const epc = EPOCHS[E];
    for (let j = 0; j < epc.bets.length; j++) {
      const { params } = epc.bets[j];
      const betOperation = createBetOperation({ params, amount: epc.amount, newKey: idemKey, place: placeBet });
      let s;
      try { s = await retry(betOperation, 'bet', onStatus); }
      catch (e) {
        // A validation reject (e.g. a band outside the odds window) must not halt the run —
        // no nonce is consumed on a reject, so skip this bet and carry on. AUTH still bubbles.
        if (e.kind === 'API') { logAbove(`  ${C.yellow}skip${C.reset} ${bandLabel(params)} rejected: ${String(e.message).slice(0, 80)}`); continue; }
        throw e;
      }
      dataset.bets.push({
        at: now(), epoch: E, phase: epc.phase,                                    // CAPTURE-COMPUTED
        id: s.id,                                                                 // RESPONSE
        params,                                                                   // REQUEST — the band WE sent; the API does not echo it
        nonce: s.nonce,                                                           // RESPONSE
        clientSeed: s.clientSeed ?? cur.clientSeed,                               // RESPONSE, or CACHED rotate state if absent
        serverSeedId: s.serverSeedId,                                             // RESPONSE
        hashedServerSeed: cur.hashedServerSeed,                                   // CACHED — the epoch commitment from active/rotate, not this response
        roll: s.roll, rollRaw: s.rollRaw,                                         // RESPONSE (normalized + verbatim)
        win: s.win,                                                               // RESPONSE
        multiplier: s.multiplier, multiplierRaw: s.multiplierRaw,                 // RESPONSE (normalized + verbatim)
        result: s.result,                                                         // RESPONSE
        betAmount: s.betAmount, betAmountRaw: s.betAmountRaw,                     // RESPONSE (normalized + verbatim)
        winningAmount: s.winningAmount, winningAmountRaw: s.winningAmountRaw,     // RESPONSE (normalized + verbatim)
        stakeWallet: s.stakeWallet, winningAmountWallet: s.winningAmountWallet,   // RESPONSE if present, else absent
        balance: s.balance,                                                       // ABSENT BY CONTRACT (L5)
        localRoll: null, localWin: null, verified: null, creditedOk: null, balanceOk: null,  // CAPTURE-COMPUTED
        origins: {
          response: ['id', 'nonce', 'serverSeedId', 'roll', 'win', 'multiplier', 'result', 'betAmount', 'winningAmount']
            .concat(s.stakeWallet != null ? ['stakeWallet'] : [])
            .concat(s.winningAmountWallet != null ? ['winningAmountWallet'] : []),
          request: ['params'],
          cached: ['hashedServerSeed'].concat(s.clientSeedFromResponse ? [] : ['clientSeed']),
          normalized: { 'roll|multiplier|betAmount|winningAmount': 'String|number -> Number; verbatim text kept in the *Raw twins' },
          absentByContract: ['balance'],
          captureComputed: ['at', 'epoch', 'phase', 'localRoll', 'localWin', 'verified', 'creditedOk', 'balanceOk'],
        },
      });
      placed++;
      lastResult = `${bandLabel(params)} n=${s.nonce} roll=${s.roll} ${s.win ? 'x' + s.multiplier : 'loss'}`;
      const el = (Date.now() - t0) / 1000, rate = (placed - done) / Math.max(0.001, el);
      draw(placed, epc.phase, bandLabel(params), rate, t0, lastResult);
      if (placed % SAVE_EVERY === 0) save();
      await sleep(DELAY_BET);
    }
    await sleep(DELAY_ROTATE);
    const nextTag = E + 1 < EPOCHS.length ? EPOCHS[E + 1].seedTag : 'audit';
    // The commitment for epoch E+1 is `cur.nextHashedServerSeed` — pre-committed by the operator
    // and recorded on THIS epoch's seed row before any of epoch E's bets were placed. The chooser
    // throws if it is absent, so a capture cannot silently fall back to a predictable seed.
    const nextChoice = clientSeedFor(E + 1, nextTag, cur.nextHashedServerSeed, 'provably-fair/rotate');
    const next = await retry(() => rotate(nextChoice.clientSeed), 'rotate', onStatus);
    const sd = dataset.seeds[E];
    // Record the commitment associated with this client-seed choice.
    sd.nextClientSeedChoice = nextChoice;
    sd.serverSeed = next.revealedServerSeed;
    sd.nonceEnd = dataset.bets[dataset.bets.length - 1].nonce;
    const v = verifyEpoch(E, sd.hashedServerSeed, next.revealedServerSeed);
    sd.chainLinkOk = sd.nextHashedServerSeed != null ? sd.nextHashedServerSeed === next.hashedServerSeed : null;
    sd.commitVerified = v.commitOk && v.bad === 0 && v.creditBad === 0;
    sd.creditVerified = v.creditBad === 0; sd.multVerified = v.multBad === 0;
    const mark = (ok, na) => na ? `${C.gray}n/a${C.reset}` : ok ? `${C.green}OK${C.reset}` : `${C.red}FAIL${C.reset}`;
    const multStr = v.multChecked > 0 ? `  ${C.dim}mult${C.reset} ${v.multChecked - v.multBad}/${v.multChecked} ${v.multBad ? C.red + '✘' : C.green + '✓'}${C.reset}` : '';
    logAbove(`  ${v.commitOk && !v.bad && !v.creditBad && sd.chainLinkOk !== false ? C.green + '✔' : C.red + '✘'}${C.reset} epoch ${String(E).padStart(3)} ${phaseBadge(epc.phase)} ${C.dim}commit${C.reset} ${mark(v.commitOk)}  ${C.dim}chain${C.reset} ${mark(sd.chainLinkOk, sd.chainLinkOk == null)}  ${C.dim}roll${C.reset} ${v.checked - v.bad}/${v.checked} ${v.bad ? C.red + '✘' : C.green + '✓'}${C.reset}  ${C.dim}credit${C.reset} ${v.creditChecked - v.creditBad}/${v.creditChecked} ${v.creditBad ? C.red + '✘' : C.green + '✓'}${C.reset}${multStr}`);
    if (sd.chainLinkOk === false) logAbove(`  ${C.red}⚠️  CHAIN BROKEN${C.reset} at epoch ${E}. Do not ship.`);
    if (v.creditBad) logAbove(`  ${C.red}⚠️  ${v.creditBad} bets: winningAmount != stake × served multiplier${C.reset} at epoch ${E}. Payout arithmetic issue — investigate.`);
    if (v.multBad) logAbove(`  ${C.yellow}⚠️  ${v.multBad} bets: served multiplier deviates >0.01 from the fair model${C.reset} at epoch ${E} — measure the effective edge.`);
    save(); cur = next; if (E + 1 < EPOCHS.length) startSeed(E + 1);
  }
  finalize(t0);
}

// Discrete edge scan — the exploit/bug watch. Per bet, the QUOTED win multiplier comes from the
// band params (99/continuousWinChance, = the served multiplier on wins), and the TRUE win
// probability from the integer roll grid (0..9999 → /100, band half-open). edge = 1 − p×mult is
// deterministic (no variance). Aggregated by mode so boundary/discretisation pockets surface;
// any bet with edge < 0 is player-favourable (a real +EV exploit).
function edgeScan() {
  const contWC = (p) => { const w = p.upper - p.lower; return p.inverted ? 100 - w : w; };
  const quoted = (p) => 99 / contWC(p);
  const discP = (p) => { const lo = Math.ceil(p.lower * 100), hi = Math.floor(p.upper * 100); const inB = hi < lo ? 0 : Math.min(9999, hi) - Math.max(0, lo) + 1; return (p.inverted ? 10000 - inB : inB) / 10000; };
  const modeOf = (p) => p.inverted ? 'outside' : (p.lower === 0 ? 'under' : (p.upper === 100 ? 'over' : 'inside'));
  const byMode = {}; const perBet = []; let favorable = 0;
  for (const b of dataset.bets) {
    if (b.params == null) continue;
    const q = quoted(b.params), p = discP(b.params), edge = 1 - p * q;
    if (edge < -1e-9) favorable++;
    const m = modeOf(b.params); (byMode[m] ||= { n: 0, sum: 0, min: Infinity, max: -Infinity });
    const g = byMode[m]; g.n++; g.sum += edge; if (edge < g.min) g.min = edge; if (edge > g.max) g.max = edge;
    perBet.push({ mode: m, band: `${b.params.inverted ? '!' : ''}[${b.params.lower},${b.params.upper}]`, wc: contWC(b.params), mult: q, edge });
  }
  return { byMode, perBet, favorable };
}

function finalize(t0) {
  const verified = dataset.bets.filter((b) => b.verified === true).length;
  const failed = dataset.bets.filter((b) => b.verified === false).length;
  dataset.meta.progress.status = dataset.bets.length >= TOTAL_BETS ? 'completed' : 'partial';
  dataset.meta.finishedAt = now();
  const outFile = join(OUT_DIR, `liqd-dice-${dataset.bets.length}bets.json`);
  writeFileSync(outFile, JSON.stringify(dataset, null, 2)); save();
  const byPhase = {}; for (const b of dataset.bets) byPhase[b.phase] = (byPhase[b.phase] || 0) + 1;
  if (isTTY) process.stdout.write(CLR);
  const nullSeeds = dataset.seeds.filter((s) => s.serverSeed == null).length;
  const chainBroken = dataset.seeds.filter((s) => s.chainLinkOk === false).length;
  console.log('\n── DONE ──');
  console.log(`  bets   : ${dataset.bets.length}/${TOTAL_BETS}   by phase: ${JSON.stringify(byPhase)}`);
  console.log(`  epochs : ${dataset.seeds.length} (${dataset.seeds.filter((s) => s.commitVerified).length} commit-verified)`);
  console.log(`  chain  : ${dataset.seeds.filter((s) => s.chainLinkOk === true).length} links OK${chainBroken ? `   ❌ ${chainBroken} BROKEN` : '  ✅'}`);
  console.log(`  local-verified bets : ${verified}${failed ? `   ❌ FAILED ${failed}` : '  ✅'}`);
  console.log(`  dataset: ${outFile}`);
  if (!nullSeeds && !failed && !chainBroken) console.log('\n  ✅ 100% verifiable: every seed revealed, every roll recomputed, chain intact.');
  else console.log('\n  ❌ Integrity issue — do NOT ship. Run --resume.');

  // ── Edge / payout scan (bug + exploit watch) ──
  const scan = edgeScan();
  const totStake = dataset.bets.reduce((s, b) => s + Number(b.betAmount || 0), 0);
  const totWon = dataset.bets.reduce((s, b) => s + Number(b.winningAmount || 0), 0);
  const meanEdge = scan.perBet.reduce((s, r) => s + r.edge, 0) / scan.perBet.length;
  console.log(`\n── EDGE SCAN ── empirical RTP ${(totWon / totStake * 100).toFixed(2)}% (variance) · deterministic mean edge ${(meanEdge * 100).toFixed(4)}% (target ${(HOUSE_EDGE * 100).toFixed(2)}%)`);
  console.log(`  player-favourable bets (edge < 0) : ${scan.favorable}  ${scan.favorable ? C.red + '⚠️ EXPLOIT' + C.reset : '✅'}`);
  console.log(`  edge by mode (mean / min / max %):`);
  for (const [m, g] of Object.entries(scan.byMode)) console.log(`     ${m.padEnd(8)} n=${String(g.n).padStart(4)}  mean ${(g.sum / g.n * 100).toFixed(3)}  min ${(g.min * 100).toFixed(3)}  max ${(g.max * 100).toFixed(3)}`);
  const lowest = [...scan.perBet].sort((a, b) => a.edge - b.edge).slice(0, 8);
  console.log(`  lowest-edge bets (boundary effect at high multiplier):`);
  for (const r of lowest) console.log(`     ${r.mode.padEnd(8)} ${r.band.padEnd(18)} wc ${r.wc.toFixed(2)}%  mult ${r.mult.toFixed(3)}  edge ${(r.edge * 100).toFixed(4)}%`);
  dataset.meta.edgeSummary = { meanEdge, favorable: scan.favorable, byMode: Object.fromEntries(Object.entries(scan.byMode).map(([m, g]) => [m, { n: g.n, mean: g.sum / g.n, min: g.min, max: g.max }])) };
  writeFileSync(join(OUT_DIR, `liqd-dice-${dataset.bets.length}bets.json`), JSON.stringify(dataset, null, 2));
}

// ── Closeout + SIGINT ──────────────────────────────────────────────────────────
async function closeout(reason) {
  const E = dataset.seeds.length - 1; if (E < 0) { save(); return; }
  const sd = dataset.seeds[E]; const n = dataset.bets.filter((b) => b.epoch === E).length;
  if (sd && sd.serverSeed == null && n > 0) {
    try {
      console.log(`\nCloseout (${reason}): revealing epoch ${E} (${n} bets)...`);
      const next = await rotate(clientSeedFor(E + 1, 'audit', sd.nextHashedServerSeed, 'provably-fair/rotate').clientSeed);
      sd.serverSeed = next.revealedServerSeed; sd.nonceEnd = dataset.bets.filter((b) => b.epoch === E).slice(-1)[0]?.nonce ?? sd.nonceEnd;
      const v = verifyEpoch(E, sd.hashedServerSeed, next.revealedServerSeed);
      sd.chainLinkOk = sd.nextHashedServerSeed != null ? sd.nextHashedServerSeed === next.hashedServerSeed : null;
      sd.commitVerified = v.commitOk && v.bad === 0;
      console.log(`  epoch ${E} revealed: commit ${v.commitOk ? 'OK' : 'FAIL'}, ${v.checked - v.bad}/${v.checked} rolls recomputed ${v.bad ? '❌' : '✅'}`);
    } catch (e) { console.log(`  ⚠️  closeout reveal failed: ${e.message} — --resume to re-capture epoch ${E}.`); }
  }
  save();
}
let closing = false;
process.on('SIGINT', async () => { if (closing) { console.log('\nForce quit.'); process.exit(1); } closing = true; console.log('\n\nInterrupted — closing the chain (Ctrl-C again to force)...'); try { await closeout('interrupt'); } catch (e) { console.log('closeout error: ' + e.message); } console.log('Resume with --resume.'); process.exit(0); });

// ── Demo ────────────────────────────────────────────────────────────────────────
async function runDemo() {
  console.log(`${C.dim}DEMO — synthetic render, no bets, no auth${C.reset}\n`);
  const t0 = Date.now(); let i = 0;
  for (let E = 0; E < EPOCHS.length; E++) { const epc = EPOCHS[E]; for (let j = 0; j < epc.bets.length; j++) { i++; const p = epc.bets[j].params; const rate = i / Math.max(0.001, (Date.now() - t0) / 1000); draw(i, epc.phase, bandLabel(p), rate, t0, `${bandLabel(p)} ${Math.random() < 0.5 ? 'loss' : 'x' + diceMultiplier(p).toFixed(2)}`); await sleep(1); } logAbove(`  ${C.green}✔${C.reset} epoch ${String(E).padStart(3)} ${phaseBadge(epc.phase)} ${C.dim}commit${C.reset} ${C.green}OK${C.reset}  ${C.dim}chain${C.reset} ${C.green}OK${C.reset}  ${C.dim}roll${C.reset} ${epc.bets.length}/${epc.bets.length} ${C.green}✓${C.reset}`); }
  if (isTTY) process.stdout.write(CLR);
  console.log(`\n${C.green}✅ demo complete${C.reset} — the live run renders exactly like this.\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────────
(async () => {
  console.log('='.repeat(64) + '\n  liqd Dice capture\n' + '='.repeat(64));
  if (DEMO) { await runDemo(); return; }
  if (!COOKIE) { console.log('\n❌ LIQD_COOKIE not set. Run:  source ./set-cookie.sh\n'); process.exit(1); }
  try {
    if (PROBE) { await runProbe(); return; }
    const startEpoch = RESUME ? load() : 0;
    await runCapture(startEpoch);
  } catch (e) {
    if (e.kind === 'AUTH') { logAbove(`\n${C.yellow}⏸  Auth lost${C.reset} — ${e.message}`); try { await closeout('auth'); } catch {} console.log(`\n${C.bold}Cookie expired. Refresh + resume:${C.reset}\n  source ./set-cookie.sh\n  npm run resume\n`); process.exit(2); }
    logAbove(`\n${C.red}FATAL${C.reset} — ${e.message}`); try { await closeout('fatal'); } catch {} console.log(`\nResume with:  npm run resume\n`); process.exit(1);
  }
})();
