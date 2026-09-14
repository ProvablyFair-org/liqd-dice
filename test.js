/** Generated from committed sources. Rebuild: npm run build:standalone. Check: npm run check:standalone. */
'use strict';

const nodeTest = require('node:test');
const wrap = fn => typeof fn !== 'function' ? fn : function () {
  return fn.call({ timeout() {}, slow() {}, retries() {} });
};
for (const name of ['describe', 'it']) {
  const original = nodeTest[name];
  const bound = (description, fn) => original(description, wrap(fn));
  for (const mode of ['skip', 'only', 'todo']) {
    bound[mode] = (description, fn) => original[mode](description, wrap(fn));
  }
  globalThis[name] = bound;
}
for (const name of ['before', 'after', 'beforeEach', 'afterEach']) {
  globalThis[name] = fn => nodeTest[name](wrap(fn));
}

const path = require('node:path');
const nodeRequire = require;
const modules = {
"src/chart.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderConvergenceChart = renderConvergenceChart;
function renderConvergenceChart(rtp) {
    const pts = rtp.points;
    const W = 900, H = 420, ml = 70, mr = 30, mt = 30, mb = 50;
    const iw = W - ml - mr, ih = H - mt - mb;
    const xs = pts.map(p => Math.log10(p.n));
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const ymin = 0.95, ymax = 1.05;
    const X = (n) => ml + (Math.log10(n) - xmin) / (xmax - xmin) * iw;
    const Y = (v) => mt + (ymax - v) / (ymax - ymin) * ih;
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.n).toFixed(1)},${Y(p.rtp).toFixed(1)}`).join(' ');
    const bandTop = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.n).toFixed(1)},${Y(Math.min(ymax, p.rtp + 5 * p.se)).toFixed(1)}`).join(' ');
    const bandBot = pts.slice().reverse().map((p) => `L${X(p.n).toFixed(1)},${Y(Math.max(ymin, p.rtp - 5 * p.se)).toFixed(1)}`).join(' ');
    const theoY = Y(rtp.theoreticalRTP);
    const xticks = pts.map(p => `<text x="${X(p.n).toFixed(1)}" y="${H - mb + 18}" font-size="11" text-anchor="middle" fill="#666">${p.n >= 1e6 ? p.n / 1e6 + 'M' : p.n >= 1e3 ? p.n / 1e3 + 'k' : p.n}</text>`).join('');
    const yticks = [0.95, 0.97, 0.99, 1.01, 1.03, 1.05].map(v => `<line x1="${ml}" y1="${Y(v).toFixed(1)}" x2="${W - mr}" y2="${Y(v).toFixed(1)}" stroke="#eee"/><text x="${ml - 8}" y="${(Y(v) + 4).toFixed(1)}" font-size="11" text-anchor="end" fill="#666">${(v * 100).toFixed(0)}%</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="system-ui,sans-serif">
<rect width="${W}" height="${H}" fill="#fff"/>${yticks}${xticks}
<path d="${bandTop} ${bandBot} Z" fill="#3b82f6" opacity="0.12"/>
<line x1="${ml}" y1="${theoY.toFixed(1)}" x2="${W - mr}" y2="${theoY.toFixed(1)}" stroke="#16a34a" stroke-dasharray="5,4" stroke-width="1.5"/>
<text x="${W - mr}" y="${(theoY - 6).toFixed(1)}" font-size="11" text-anchor="end" fill="#16a34a">theoretical RTP ${(rtp.theoreticalRTP * 100).toFixed(2)}%</text>
<path d="${line}" fill="none" stroke="#1e3a8a" stroke-width="2"/>
<text x="${ml}" y="18" font-size="13" font-weight="600" fill="#111">Dice RTP convergence — under 50 (1.98×), ±5·SE band (SE = σ/√n)</text>
<text x="${(ml + iw / 2).toFixed(0)}" y="${H - 8}" font-size="11" text-anchor="middle" fill="#666">bets (log scale)</text>
</svg>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>Dice RTP convergence</title></head><body style="margin:24px;font-family:system-ui">${svg}</body></html>`;
}

},
"src/config.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYOUT_NUMERATOR = exports.SIM_RTP_STRATEGY = exports.SIM_EDGE_BANDS = exports.SIMULATION_HTML_SHA256 = exports.SIMULATION_SHA256 = exports.EXPECTED_PHASE_BETS = exports.EXPECTED_EPOCH_SIZE = exports.EXPECTED_SEEDS = exports.EXPECTED_BETS = exports.DATASET_SHA256 = exports.ALPHA_SCREEN = exports.ALPHA_SCREENS = exports.ALPHA = exports.SIM_CHERRY_SEED_ALPHA = exports.SIM_CHERRY_WINDOW = exports.SIM_CHERRY_BINS = exports.SIM_RTP_MARKS = exports.SIM_RTP_BETS = exports.SIM_EDGE_BETS = exports.SIM_SERIAL_DRAWS = exports.SIM_UNIFORMITY_DRAWS = exports.MAX_ODDS = exports.MIN_ODDS = exports.HOUSE_EDGE = exports.SCALE = exports.CURSOR = exports.RANGE = void 0;
exports.bandKey = bandKey;
exports.continuousWinChancePct = continuousWinChancePct;
exports.payoutBasisPoints = payoutBasisPoints;
exports.quotedMultiplier = quotedMultiplier;
exports.discreteWinCount = discreteWinCount;
exports.discreteWinProbability = discreteWinProbability;
exports.diceWin = diceWin;
exports.effectiveEdge = effectiveEdge;
exports.effectiveEdgeIsExact = effectiveEdgeIsExact;
exports.theoreticalRTP = theoreticalRTP;
exports.servedRollMatches = servedRollMatches;
exports.round8 = round8;
exports.creditResidualSign = creditResidualSign;
exports.creditResidual = creditResidual;
exports.settledCreditUnits = settledCreditUnits;
exports.settledCredit = settledCredit;
exports.isSettlementTie = isSettlementTie;
exports.bandMode = bandMode;
exports.RANGE = 10000;
exports.CURSOR = 0;
exports.SCALE = 100;
exports.HOUSE_EDGE = 0.01;
exports.MIN_ODDS = 1.0102;
exports.MAX_ODDS = 9900;
exports.SIM_UNIFORMITY_DRAWS = 2000000;
exports.SIM_SERIAL_DRAWS = 200000;
exports.SIM_EDGE_BETS = 2000000;
exports.SIM_RTP_BETS = 20000000;
exports.SIM_RTP_MARKS = [1000, 10000, 100000, 1000000, 5000000, 10000000, exports.SIM_RTP_BETS];
exports.SIM_CHERRY_BINS = 20;
exports.SIM_CHERRY_WINDOW = 50;
exports.SIM_CHERRY_SEED_ALPHA = 0.05;
exports.ALPHA = 0.01;
exports.ALPHA_SCREENS = 3;
exports.ALPHA_SCREEN = exports.ALPHA / exports.ALPHA_SCREENS;
exports.DATASET_SHA256 = 'ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34';
exports.EXPECTED_BETS = 6700;
exports.EXPECTED_SEEDS = 134;
exports.EXPECTED_EPOCH_SIZE = 50;
exports.EXPECTED_PHASE_BETS = { A: 5000, B: 1000, C: 200, D: 500 };
exports.SIMULATION_SHA256 = '3da35d94342153d4f5345f5e8bdbc3cdfef5139bd752d3680898b35ffcbceebd';
exports.SIMULATION_HTML_SHA256 = 'dadbd1859cff586eb42b96212d8d4271d578f9235d2a0bdbfe27d1dcf978f9be';
exports.SIM_EDGE_BANDS = [
    { label: 'under 50 (1.98×)', params: { lower: 0, upper: 50, inverted: false } },
    { label: 'over 50 (1.98×)', params: { lower: 50, upper: 100, inverted: false } },
    { label: 'under 10 (9.9×)', params: { lower: 0, upper: 10, inverted: false } },
    { label: 'over 90 (9.9×)', params: { lower: 90, upper: 100, inverted: false } },
    { label: 'inside 25-75 (1.98×)', params: { lower: 25, upper: 75, inverted: false } },
    { label: 'outside 25-75 (1.98×)', params: { lower: 25, upper: 75, inverted: true } },
    { label: 'over 98 (49.5×)', params: { lower: 98, upper: 100, inverted: false } },
    { label: 'over 99 (99×)', params: { lower: 99, upper: 100, inverted: false } },
    { label: 'under 1 (99×)', params: { lower: 0, upper: 1, inverted: false } },
];
exports.SIM_RTP_STRATEGY = { lower: 0, upper: 50, inverted: false };
function bandKey(p) {
    return `${p.lower}|${p.upper}|${p.inverted ? 1 : 0}`;
}
function continuousWinChancePct(p) {
    const width = p.upper - p.lower;
    return p.inverted ? 100 - width : width;
}
exports.PAYOUT_NUMERATOR = (1 - exports.HOUSE_EDGE) * 10000;
function payoutBasisPoints(p) {
    return Math.round(continuousWinChancePct(p) * 100);
}
function quotedMultiplier(p) {
    const wc = continuousWinChancePct(p);
    return wc > 0 ? (100 / wc) * (1 - exports.HOUSE_EDGE) : 0;
}
function discreteWinCount(p) {
    const lo = Math.round(p.lower * exports.SCALE);
    const hi = Math.round(p.upper * exports.SCALE);
    if (Math.abs(p.lower * exports.SCALE - lo) > 1e-6 || Math.abs(p.upper * exports.SCALE - hi) > 1e-6) {
        throw new Error(`non-2dp band bound: ${JSON.stringify(p)}`);
    }
    const inBand = Math.max(0, Math.min(exports.RANGE, hi) - Math.max(0, lo));
    return p.inverted ? exports.RANGE - inBand : inBand;
}
function discreteWinProbability(p) {
    return discreteWinCount(p) / exports.RANGE;
}
function diceWin(roll, p) {
    const inBand = roll >= p.lower && roll < p.upper;
    return p.inverted ? !inBand : inBand;
}
function effectiveEdge(p) {
    return 1 - discreteWinProbability(p) * quotedMultiplier(p);
}
function effectiveEdgeIsExact(p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        return false;
    if (!Number.isInteger(exports.PAYOUT_NUMERATOR))
        return false;
    return 100 * discreteWinCount(p) * exports.PAYOUT_NUMERATOR === (exports.PAYOUT_NUMERATOR / 100) * exports.RANGE * bps;
}
function theoreticalRTP(p) {
    return discreteWinProbability(p) * quotedMultiplier(p);
}
function servedRollMatches(served, recomputed) {
    if (!Number.isFinite(served) || !Number.isFinite(recomputed))
        return false;
    const units = Math.round(served * exports.SCALE);
    if (units / exports.SCALE !== served)
        return false;
    if (units < 0 || units >= exports.RANGE)
        return false;
    return served === recomputed;
}
function round8(x) {
    return Math.round(x * 1e8) / 1e8;
}
const UNITS_PER_WHOLE = 100000000n;
const HALF_UNIT = 50000000n;
function creditResidualSign(credit, stake, p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        return 0;
    const [cn, cd] = decimalFraction(credit);
    const [sn, sd] = decimalFraction(stake);
    const num = BigInt(exports.PAYOUT_NUMERATOR);
    const lhs = cn * sd * BigInt(bps);
    const rhs = sn * cd * num;
    return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}
function creditResidual(credit, stake, p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        return 0;
    const [cn, cd] = decimalFraction(credit);
    const [sn, sd] = decimalFraction(stake);
    const num = BigInt(exports.PAYOUT_NUMERATOR);
    const rn = cn * sd * BigInt(bps) - sn * num * cd;
    const rd = cd * sd * BigInt(bps);
    return Number(rn) / Number(rd);
}
function decimalFraction(x) {
    const s = typeof x === 'string' ? x.trim() : String(x);
    const m = /^(-?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m)
        throw new Error(`decimalFraction: not a decimal literal: ${s}`);
    const sign = m[1] === '-' ? -1n : 1n;
    const intPart = m[2] || '0';
    const fracPart = m[3] || '';
    const exp = m[4] ? Number(m[4]) : 0;
    let n = sign * BigInt(intPart + fracPart);
    let d = 10n ** BigInt(fracPart.length);
    if (exp > 0)
        n *= 10n ** BigInt(exp);
    else if (exp < 0)
        d *= 10n ** BigInt(-exp);
    return [n, d];
}
function settledCreditUnits(stake, multiplier) {
    const stakeUnits = BigInt(Math.round(stake * 1e8));
    const multUnits = BigInt(Math.round(multiplier * 1e8));
    const product = stakeUnits * multUnits;
    let q = product / UNITS_PER_WHOLE;
    const r = product % UNITS_PER_WHOLE;
    if (r > HALF_UNIT)
        q += 1n;
    else if (r === HALF_UNIT && (q % 2n) === 1n)
        q += 1n;
    return q;
}
function settledCredit(stake, multiplier) {
    const units = settledCreditUnits(stake, multiplier);
    if (units > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error(`settledCredit: ${units} units exceeds exact double range — use settledCreditUnits`);
    }
    return Number(units) / 1e8;
}
function isSettlementTie(stake, multiplier) {
    const product = BigInt(Math.round(stake * 1e8)) * BigInt(Math.round(multiplier * 1e8));
    return product % UNITS_PER_WHOLE === HALF_UNIT;
}
function bandMode(p) {
    if (p.inverted)
        return 'outside';
    if (p.lower === 0)
        return 'under';
    if (p.upper === 100)
        return 'over';
    return 'inside';
}

},
"src/exact-chi2.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exactNull = exactNull;
exports.squareSum = squareSum;
exports.chi2FromSquareSum = chi2FromSquareSum;
exports.upperTailBySquareSum = upperTailBySquareSum;
exports.achievedSeedAlpha = achievedSeedAlpha;
exports.cherryFlagRate = cherryFlagRate;
const config_1 = require("./config");
const BINS = config_1.SIM_CHERRY_BINS;
const WINDOW = config_1.SIM_CHERRY_WINDOW;
function factorials(upTo) {
    const f = [1n];
    for (let i = 1; i <= upTo; i++)
        f.push(f[i - 1] * BigInt(i));
    return f;
}
function build() {
    const fact = factorials(Math.max(WINDOW, BINS));
    const counts = new Map();
    const parts = [];
    let partitions = 0;
    const rec = (remaining, maxPart, depth) => {
        if (remaining === 0) {
            partitions++;
            let s = 0;
            let denom = 1n;
            const multiplicity = new Map();
            for (let i = 0; i < depth; i++) {
                const v = parts[i];
                s += v * v;
                denom *= fact[v];
                multiplicity.set(v, (multiplicity.get(v) ?? 0) + 1);
            }
            multiplicity.set(0, BINS - depth);
            let arrangeDenom = 1n;
            for (const m of multiplicity.values())
                arrangeDenom *= fact[m];
            const ways = (fact[WINDOW] / denom) * (fact[BINS] / arrangeDenom);
            counts.set(s, (counts.get(s) ?? 0n) + ways);
            return;
        }
        if (depth === BINS)
            return;
        const hi = Math.min(remaining, maxPart);
        for (let v = hi; v >= 1; v--) {
            if (v * (BINS - depth) < remaining)
                break;
            parts[depth] = v;
            rec(remaining - v, v, depth + 1);
        }
    };
    rec(WINDOW, WINDOW, 0);
    const total = BigInt(BINS) ** BigInt(WINDOW);
    const support = [...counts.keys()].sort((a, b) => a - b);
    const totalNum = Number(total);
    const probability = support.map((s) => Number(counts.get(s)) / totalNum);
    const upperTail = new Array(support.length);
    let acc = 0;
    for (let i = support.length - 1; i >= 0; i--) {
        acc += probability[i];
        upperTail[i] = acc;
    }
    return { support, probability, upperTail, partitions };
}
let cached = null;
function exactNull() {
    if (!cached)
        cached = build();
    return cached;
}
function squareSum(draws) {
    const per = config_1.RANGE / BINS;
    const h = new Array(BINS).fill(0);
    for (const d of draws)
        h[Math.min(BINS - 1, Math.floor(d / per))]++;
    let s = 0;
    for (const v of h)
        s += v * v;
    return s;
}
function chi2FromSquareSum(s) {
    const e = WINDOW / BINS;
    return (s - (WINDOW * WINDOW) / BINS) / e;
}
function upperTailBySquareSum(s) {
    const { support, upperTail } = exactNull();
    let lo = 0, hi = support.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (support[mid] < s)
            lo = mid + 1;
        else
            hi = mid;
    }
    return lo < support.length ? upperTail[lo] : 0;
}
function achievedSeedAlpha() {
    const { support, upperTail } = exactNull();
    for (let i = 0; i < support.length; i++)
        if (upperTail[i] < config_1.SIM_CHERRY_SEED_ALPHA)
            return upperTail[i];
    return 0;
}
function cherryFlagRate() {
    const a = achievedSeedAlpha();
    return a * (1 - a);
}

},
"src/rng.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitHash = commitHash;
exports.sha256Buffer = sha256Buffer;
exports.getProvablyFairHmacSalt = getProvablyFairHmacSalt;
exports.generateProvablyFairNumber = generateProvablyFairNumber;
exports.diceRoll = diceRoll;
const node_crypto_1 = require("node:crypto");
const config_1 = require("./config");
function commitHash(serverSeedHexString) {
    return (0, node_crypto_1.createHash)('sha256').update(serverSeedHexString, 'utf8').digest('hex');
}
function sha256Buffer(buf) {
    return (0, node_crypto_1.createHash)('sha256').update(buf).digest('hex');
}
function getProvablyFairHmacSalt(clientSeed, nonce, cursor) {
    return `${clientSeed}:${nonce}:${cursor}`;
}
function generateProvablyFairNumber(serverSeed, clientSeed, nonce, cursor, range) {
    const key = Buffer.from(serverSeed, 'hex');
    const digest = (0, node_crypto_1.createHmac)('sha256', key).update(getProvablyFairHmacSalt(clientSeed, nonce, cursor)).digest();
    const maxFair = Math.floor(4294967296 / range) * range;
    for (let offset = 0; offset + 4 <= digest.length; offset += 4) {
        const chunk = digest.readUInt32BE(offset);
        if (chunk < maxFair)
            return chunk % range;
    }
    return generateProvablyFairNumber(serverSeed, clientSeed, nonce, cursor + 1000000, range);
}
function diceRoll(serverSeed, clientSeed, nonce) {
    return generateProvablyFairNumber(serverSeed, clientSeed, nonce, config_1.CURSOR, config_1.RANGE) / config_1.SCALE;
}

},
"src/runtime.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATED_RUNTIME = exports.SUPPORTED_NODE_MAJOR = void 0;
exports.nodeMajor = nodeMajor;
exports.isSupportedRuntime = isSupportedRuntime;
exports.unsupportedRuntimeMessage = unsupportedRuntimeMessage;
exports.assertSupportedRuntime = assertSupportedRuntime;
exports.SUPPORTED_NODE_MAJOR = 22;
exports.VALIDATED_RUNTIME = 'Node.js v22.23.1';
function nodeMajor(version = process.versions.node) {
    return Number(version.split('.')[0]);
}
function isSupportedRuntime(version = process.versions.node) {
    return nodeMajor(version) === exports.SUPPORTED_NODE_MAJOR;
}
function unsupportedRuntimeMessage(version = process.versions.node) {
    return [
        '',
        '══════════════════════════════════════════════════════════',
        '  UNSUPPORTED RUNTIME — verification refused',
        '══════════════════════════════════════════════════════════',
        `  Running on   : Node v${version}`,
        `  Supported    : Node ${exports.SUPPORTED_NODE_MAJOR}.x`,
        `  Validated on : ${exports.VALIDATED_RUNTIME}`,
        '',
        '  This suite compares stored statistics against recomputation with exact equality.',
        '  Statistical functions can differ in their final bits across runtime versions.',
        '  Use the supported runtime to reproduce these exact comparisons.',
        '',
        `  Install Node ${exports.SUPPORTED_NODE_MAJOR}.x and re-run. Nothing was written; no evidence was touched.`,
        '══════════════════════════════════════════════════════════',
        '',
    ].join('\n');
}
function assertSupportedRuntime() {
    if (isSupportedRuntime())
        return;
    console.error(unsupportedRuntimeMessage());
    process.exit(1);
}

},
"src/sim-checks.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAMILY_WISE_BOUND = exports.STEP_16_BOUND = exports.SCORED_STATISTICAL_PREDICATES = exports.RECONSTRUCTION_MAX_WINS = exports.RECONSTRUCTION_MAX_RESIDUAL = exports.SIM_SCHEMA_VERSION = void 0;
exports.reconstructReturn = reconstructReturn;
exports.reconstructionTolerance = reconstructionTolerance;
exports.recoverWinCount = recoverWinCount;
exports.convergenceSE = convergenceSE;
exports.validateConvergenceSeries = validateConvergenceSeries;
exports.runsStatistic = runsStatistic;
exports.SIM_SCHEMA_VERSION = 2;
exports.RECONSTRUCTION_MAX_RESIDUAL = 0.25;
exports.RECONSTRUCTION_MAX_WINS = 50000000;
function reconstructReturn(wins, multiplier) {
    let won = 0;
    for (let k = 0; k < wins; k++)
        won += multiplier;
    return won;
}
function reconstructionTolerance(wins) {
    const derived = wins * (wins + 2) * Number.EPSILON;
    const floor = 4 * Number.EPSILON * Math.max(1, wins);
    return Math.min(exports.RECONSTRUCTION_MAX_RESIDUAL, Math.max(derived, floor));
}
function recoverWinCount(rtp, n, multiplier, stored) {
    const fail = (reason, wins = NaN, residual = NaN, source = 'reconstructed', reconstructedRTP = NaN) => ({ ok: false, wins, residual, source, match: 'none', reconstructedRTP, reason });
    if (!Number.isFinite(rtp) || !Number.isFinite(n) || !Number.isFinite(multiplier))
        return fail('non-finite input');
    if (!Number.isInteger(n) || n <= 0)
        return fail(`sample size ${n} is not a positive integer`);
    if (!(multiplier > 0))
        return fail(`multiplier ${multiplier} is not positive`);
    if (rtp < 0)
        return fail(`rtp ${rtp} is negative`);
    const raw = (rtp * n) / multiplier;
    if (!Number.isFinite(raw))
        return fail('rtp·n/m is not finite');
    const wins = Math.round(raw);
    const residual = Math.abs(raw - wins);
    if (residual > exports.RECONSTRUCTION_MAX_RESIDUAL) {
        return fail(`rtp ${rtp} at n=${n} implies ${raw} wins, ${residual} from the nearest integer (cap ${exports.RECONSTRUCTION_MAX_RESIDUAL}) — no integer win count produces this RTP`, wins, residual);
    }
    if (wins < 0 || wins > n)
        return fail(`recovered win count ${wins} is outside [0, ${n}]`, wins, residual);
    if (wins > exports.RECONSTRUCTION_MAX_WINS) {
        return fail(`recovered win count ${wins} is past the depth (${exports.RECONSTRUCTION_MAX_WINS}) at which this reconstruction is defined — a deeper artifact must store its counts (schema ${exports.SIM_SCHEMA_VERSION})`, wins, residual);
    }
    const reconstructedReturn = reconstructReturn(wins, multiplier);
    const reconstructedRTP = reconstructedReturn / n;
    const tol = reconstructionTolerance(wins);
    const match = reconstructedRTP === rtp
        ? 'exact'
        : (residual <= tol ? 'bounded' : 'none');
    if (match === 'none') {
        return fail(`rtp ${rtp} at n=${n} implies ${raw} wins; the candidate integer count ${wins} reconstructs to `
            + `${reconstructedRTP} (return ${reconstructedReturn} over ${n} bets), ${residual} wins away and outside `
            + `the derived arithmetic tolerance ${tol} — no integer win count produces this RTP`, wins, residual, 'reconstructed', reconstructedRTP);
    }
    const how = match === 'exact'
        ? `count ${wins} reconstructs EXACTLY to the published RTP (return ${reconstructedReturn} over ${n} bets)`
        : `count ${wins} reconstructs to ${reconstructedRTP}, ${residual} wins from the published RTP — inside the derived tolerance ${tol}`;
    if (stored !== undefined) {
        if (typeof stored !== 'number' || !Number.isInteger(stored)) {
            return fail(`stored win count ${JSON.stringify(stored)} is not an integer`, wins, residual, 'stored', reconstructedRTP);
        }
        if (stored < 0 || stored > n)
            return fail(`stored win count ${stored} is outside [0, ${n}]`, stored, residual, 'stored', reconstructedRTP);
        if (stored !== wins) {
            return fail(`stored win count ${stored} disagrees with the ${wins} the published RTP implies`, stored, residual, 'stored', reconstructedRTP);
        }
        return { ok: true, wins: stored, residual, source: 'stored', match, reconstructedRTP, reason: `stored count agrees with the RTP it is supposed to have produced — ${how}` };
    }
    return { ok: true, wins, residual, source: 'reconstructed', match, reconstructedRTP, reason: `reconstructed from rtp·n/m and verified — ${how}` };
}
function convergenceSE(n, rtp, wins, multiplier) {
    const p = wins / n;
    const varr = p * (multiplier - rtp) ** 2 + (1 - p) * (0 - rtp) ** 2;
    return Math.sqrt(varr / n);
}
function validateConvergenceSeries(points, multiplier, theoreticalRTP) {
    const out = [];
    const failures = [];
    let exactlyOnTheory = 0;
    let exactReconstructions = 0;
    let prevN = 0, prevWins = 0;
    for (const pt of points) {
        const typesOk = typeof pt?.n === 'number' && typeof pt?.rtp === 'number' && typeof pt?.se === 'number';
        const n = Number(pt?.n), rtp = Number(pt?.rtp), storedSE = Number(pt?.se);
        const rec = typesOk
            ? recoverWinCount(rtp, n, multiplier, pt?.wins)
            : { ok: false, wins: NaN, residual: NaN, source: 'reconstructed', match: 'none', reconstructedRTP: NaN, reason: `n/rtp/se must be JSON numbers (got ${typeof pt?.n}/${typeof pt?.rtp}/${typeof pt?.se})` };
        const onTheory = typesOk && rtp === theoreticalRTP;
        if (onTheory)
            exactlyOnTheory++;
        if (rec.ok && rec.match === 'exact')
            exactReconstructions++;
        let ok = rec.ok;
        let reason = rec.reason;
        if (ok) {
            if (!(n > prevN)) {
                ok = false;
                reason = `sample size ${n} does not exceed the previous checkpoint's ${prevN}`;
            }
            else if (rec.wins < prevWins) {
                ok = false;
                reason = `win count fell from ${prevWins} to ${rec.wins} between nested checkpoints`;
            }
            else if (rec.wins - prevWins > n - prevN) {
                ok = false;
                reason = `win count rose by ${rec.wins - prevWins} over only ${n - prevN} additional bets`;
            }
        }
        const expectedSE = ok ? convergenceSE(n, rtp, rec.wins, multiplier) : NaN;
        if (ok && !(Number.isFinite(storedSE) && storedSE === expectedSE)) {
            ok = false;
            reason = `stored SE ${storedSE} != ${expectedSE} recomputed from (n=${n}, rtp=${rtp}, wins=${rec.wins}, m=${multiplier})`;
        }
        if (!ok)
            failures.push(`n=${Number.isFinite(n) ? n : String(pt?.n)}: ${reason}`);
        out.push({ n, ok, wins: rec.wins, winSource: rec.source, winMatch: rec.match, expectedSE, storedSE, exactlyOnTheory: onTheory, reason });
        if (rec.ok) {
            prevN = n;
            prevWins = rec.wins;
        }
    }
    return { ok: failures.length === 0 && out.length > 0, points: out, exactlyOnTheory, exactReconstructions, failures };
}
function runsStatistic(runs, n1, n) {
    const n2 = n - n1;
    const expected = (2 * n1 * n2) / n + 1;
    const variance = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));
    const degenerate = !(variance > 0);
    const z = degenerate ? 0 : (runs - expected) / Math.sqrt(variance);
    return { expected, variance, z, degenerate };
}
exports.SCORED_STATISTICAL_PREDICATES = [
    { id: 'S1', step: 16, screen: 'Pass-1 draw uniformity χ², two-sided (upper: non-uniform; lower: too uniform)', size: 'α/3 = 3.333e-3' },
    { id: 'S2', step: 16, screen: 'Pass-1 lag-1 autocorrelation |z| vs the two-sided critical z', size: 'α/3 = 3.333e-3' },
    { id: 'S3', step: 16, screen: 'Pass-1 Wald–Wolfowitz runs test, two-sided', size: 'α/3 = 3.333e-3' },
    { id: 'S4', step: 16, screen: 'nine effective-edge bands, each |simRTP − theory| ≤ 5·SE + 1e-4', size: '≈5.73e-7 per band, ≈5.16e-6 over nine' },
    { id: 'S5', step: 16, screen: 'RTP-convergence final point within 5·SE + 1e-4 of theory', size: '≈5.73e-7' },
    { id: 'S6', step: 17, screen: 'cherry-pick flag count, exact one-sided binomial', size: '≤ α = 0.01 (discrete, achieved size below α)' },
    { id: 'S7', step: 17, screen: 'pooled real-roll uniformity χ², one-sided upper tail', size: 'α = 0.01' },
];
exports.STEP_16_BOUND = 0.01 + 9 * 5.733e-7 + 5.733e-7;
exports.FAMILY_WISE_BOUND = exports.STEP_16_BOUND + 0.01 + 0.01;

},
"src/stats.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combination = combination;
exports.binomialTailP = binomialTailP;
exports.regularizedGamma = regularizedGamma;
exports.logGamma = logGamma;
exports.chiSquaredPValue = chiSquaredPValue;
exports.chiSquaredTest = chiSquaredTest;
exports.lag1Autocorrelation = lag1Autocorrelation;
exports.runsTest = runsTest;
exports.normalQuantile = normalQuantile;
exports.inverseCriticalZ = inverseCriticalZ;
exports.twoSidedNormalP = twoSidedNormalP;
function combination(n, k) {
    if (k < 0 || k > n)
        return 0;
    if (k === 0 || k === n)
        return 1;
    k = Math.min(k, n - k);
    let c = 1;
    for (let i = 0; i < k; i++) {
        c = (c * (n - i)) / (i + 1);
    }
    return c;
}
function binomialTailP(n, k, p) {
    if (k <= 0)
        return 1;
    if (k > n)
        return 0;
    let s = 0;
    for (let i = k; i <= n; i++)
        s += combination(n, i) * p ** i * (1 - p) ** (n - i);
    return Math.min(1, s);
}
function regularizedGamma(a, x) {
    if (x < 0 || a <= 0)
        return NaN;
    if (x === 0)
        return 0;
    const gln = logGamma(a);
    if (x < a + 1) {
        let ap = a;
        let sum = 1 / a;
        let del = sum;
        for (let n = 0; n < 200; n++) {
            ap += 1;
            del *= x / ap;
            sum += del;
            if (Math.abs(del) < Math.abs(sum) * 1e-14)
                break;
        }
        return sum * Math.exp(-x + a * Math.log(x) - gln);
    }
    else {
        let b = x + 1 - a;
        let c = 1 / 1e-300;
        let d = 1 / b;
        let h = d;
        for (let i = 1; i <= 200; i++) {
            const an = -i * (i - a);
            b += 2;
            d = an * d + b;
            if (Math.abs(d) < 1e-300)
                d = 1e-300;
            c = b + an / c;
            if (Math.abs(c) < 1e-300)
                c = 1e-300;
            d = 1 / d;
            const delta = d * c;
            h *= delta;
            if (Math.abs(delta - 1) < 1e-14)
                break;
        }
        return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
    }
}
function logGamma(x) {
    const c = [
        76.18009172947146, -86.50532032941677, 24.01409824083091,
        -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
    ];
    let y = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++)
        ser += c[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function chiSquaredPValue(chiSq, df) {
    return 1 - regularizedGamma(df / 2, chiSq / 2);
}
function chiSquaredTest(observed, expected) {
    if (observed.length !== expected.length)
        throw new Error('length mismatch');
    const obs = [...observed];
    const exp = [...expected];
    while (obs.length > 2 && exp[0] < 5) {
        obs[1] += obs[0];
        exp[1] += exp[0];
        obs.shift();
        exp.shift();
    }
    while (obs.length > 2 && exp[exp.length - 1] < 5) {
        const n = obs.length;
        obs[n - 2] += obs[n - 1];
        exp[n - 2] += exp[n - 1];
        obs.pop();
        exp.pop();
    }
    let chi2 = 0;
    for (let i = 0; i < obs.length; i++) {
        if (exp[i] > 0)
            chi2 += (obs[i] - exp[i]) ** 2 / exp[i];
    }
    const df = obs.length - 1;
    return { chi2, df, pValue: chiSquaredPValue(chi2, df) };
}
function lag1Autocorrelation(series) {
    const n = series.length;
    let mean = 0;
    for (let i = 0; i < n; i++)
        mean += series[i];
    mean /= n;
    let num = 0, den = 0;
    for (let i = 0; i < n - 1; i++)
        num += (series[i] - mean) * (series[i + 1] - mean);
    for (let i = 0; i < n; i++)
        den += (series[i] - mean) ** 2;
    return den === 0 ? 0 : num / den;
}
function runsTest(series) {
    const n = series.length;
    let n1 = 0, runs = 1;
    let prev = series[0];
    if (prev === 1)
        n1++;
    for (let i = 1; i < n; i++) {
        if (series[i] === 1)
            n1++;
        if (series[i] !== prev) {
            runs++;
            prev = series[i];
        }
    }
    const n2 = n - n1;
    const expected = (2 * n1 * n2) / n + 1;
    const varRuns = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));
    const z = varRuns > 0 ? (runs - expected) / Math.sqrt(varRuns) : 0;
    const pValue = 2 * (1 - normalCDF(Math.abs(z)));
    return { runs, expected, z, pValue, n, n1, variance: varRuns };
}
function normalQuantile(p) {
    if (!(p > 0 && p < 1))
        return NaN;
    const q = p - 0.5;
    let r;
    if (Math.abs(q) <= 0.425) {
        r = 0.180625 - q * q;
        return q * (((((((2509.0809287301226727 * r + 33430.575583588128105) * r + 67265.770927008700853) * r + 45921.953931549871457) * r + 13731.693765509461125) * r + 1971.5909503065514427) * r + 133.14166789178437745) * r + 3.387132872796366608)
            / (((((((5226.495278852545925 * r + 28729.085735721942674) * r + 39307.89580009271061) * r + 21213.794301586595867) * r + 5394.1960214247511077) * r + 687.1870074920579083) * r + 42.313330701600911252) * r + 1);
    }
    r = q < 0 ? p : 1 - p;
    r = Math.sqrt(-Math.log(r));
    let val;
    if (r <= 5) {
        r -= 1.6;
        val = (((((((7.7454501427834140764e-4 * r + 0.0227238449892691845833) * r + 0.24178072517745061177) * r + 1.27045825245236838258) * r + 3.64784832476320460504) * r + 5.7694972214606914055) * r + 4.6303378461565452959) * r + 1.42343711074968357734)
            / (((((((1.05075007164441684324e-9 * r + 5.475938084995344946e-4) * r + 0.0151986665636164571966) * r + 0.14810397642748007459) * r + 0.68976733498510000455) * r + 1.6763848301838038494) * r + 2.05319162663775882187) * r + 1);
    }
    else {
        r -= 5;
        val = (((((((2.01033439929228813265e-7 * r + 2.71155556874348757815e-5) * r + 0.0012426609473880784386) * r + 0.026532189526576123093) * r + 0.29656057182850489123) * r + 1.7848265399172913358) * r + 5.4637849111641143699) * r + 6.6579046435011037772)
            / (((((((2.04426310338993978564e-15 * r + 1.4215117583164458887e-7) * r + 1.8463183175100546818e-5) * r + 7.868691311456132591e-4) * r + 0.0148753612908506148525) * r + 0.13692988092273580531) * r + 0.59983220655588793769) * r + 1);
    }
    return q < 0 ? -val : val;
}
function inverseCriticalZ(alpha) {
    return -normalQuantile(alpha / 2);
}
function normalCDF(z) {
    return 0.5 * (1 + erf(z / Math.SQRT2));
}
function twoSidedNormalP(z) {
    return 2 * (1 - normalCDF(Math.abs(z)));
}
function erf(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
        - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return Math.sign(x) * y;
}

},
"tests/__standalone-entry.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./dice/artifactTests");
require("./dice/captureRetryTests");
require("./dice/clientSeedTests");
require("./dice/commitmentTests");
require("./dice/exactNullTests");
require("./dice/rngTests");
require("./dice/runtimeTests");
require("./dice/settlementTests");
require("./dice/simChecksTests");
require("./dice/statsTests");

},
"tests/dice/artifactTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const node_crypto_1 = require("node:crypto");
const config_1 = require("../../src/config");
const chart_1 = require("../../src/chart");
const REPO = path.join(__dirname, '../..');
const sha = (p) => (0, node_crypto_1.createHash)('sha256').update(fs.readFileSync(p)).digest('hex');
const SIM_JSON = path.join(REPO, 'outputs/simulation-results.json');
const SIM_HTML = path.join(REPO, 'outputs/rtp-convergence.html');
const DATASET = path.join(REPO, 'data/dice-master-6700bets.json');
describe('LIQD Dice artifacts of record', () => {
    it('data/dice-master-6700bets.json hash matches DATASET_SHA256', () => {
        assert.strictEqual(sha(DATASET), config_1.DATASET_SHA256);
    });
    it('outputs/simulation-results.json hash matches SIMULATION_SHA256', () => {
        assert.strictEqual(sha(SIM_JSON), config_1.SIMULATION_SHA256, 'the committed simulation is not the pinned one — re-pin in src/config.ts if the regeneration was deliberate');
    });
    it('outputs/rtp-convergence.html hash matches SIMULATION_HTML_SHA256', () => {
        assert.strictEqual(sha(SIM_HTML), config_1.SIMULATION_HTML_SHA256);
    });
    it('the committed chart IS the committed convergence series, byte for byte', () => {
        const sim = JSON.parse(fs.readFileSync(SIM_JSON, 'utf8'));
        const rendered = (0, chart_1.renderConvergenceChart)(sim.pass1.rtpConvergence);
        assert.strictEqual(rendered, fs.readFileSync(SIM_HTML, 'utf8'), 'the chart and the JSON come from different simulation runs');
    });
    it('the dataset carries the audited population (G-BIND, constants not header fields)', () => {
        const ds = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
        assert.strictEqual(ds.bets.length, config_1.EXPECTED_BETS);
        assert.strictEqual(ds.seeds.length, config_1.EXPECTED_SEEDS);
        const perEpoch = new Map();
        for (const b of ds.bets)
            perEpoch.set(b.epoch, (perEpoch.get(b.epoch) ?? 0) + 1);
        assert.strictEqual(perEpoch.size, config_1.EXPECTED_SEEDS);
        for (const [e, n] of perEpoch)
            assert.strictEqual(n, config_1.EXPECTED_EPOCH_SIZE, `epoch ${e}`);
        const byPhase = {};
        for (const b of ds.bets)
            byPhase[b.phase] = (byPhase[b.phase] ?? 0) + 1;
        assert.deepStrictEqual(byPhase, { ...config_1.EXPECTED_PHASE_BETS });
        assert.strictEqual(ds.meta.plannedTotal, config_1.EXPECTED_BETS);
        assert.strictEqual(ds.meta.epochSize, config_1.EXPECTED_EPOCH_SIZE);
    });
});

},
"tests/dice/captureRetryTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const { createBetOperation, isRetryable } = require('../../capture/bet-operation.reference.mjs');
describe('capture request retries', () => {
    it('replays the same logical bet after a timeout following settlement', async () => {
        const ledger = new Map();
        const keys = [];
        let generated = 0;
        let requests = 0;
        const operation = createBetOperation({
            params: { lower: 0, upper: 50, inverted: false }, amount: 0.1,
            newKey: () => `request-${++generated}`,
            place: async (_params, _amount, key) => {
                keys.push(key);
                if (!ledger.has(key))
                    ledger.set(key, { betId: ledger.size + 1 });
                if (++requests === 1)
                    throw Object.assign(new Error('response lost after settlement'), { kind: 'TRANSIENT' });
                return ledger.get(key);
            },
        });
        await assert.rejects(operation(), /response lost/);
        assert.deepStrictEqual(await operation(), { betId: 1 });
        assert.deepStrictEqual(keys, ['request-1', 'request-1']);
        assert.strictEqual(ledger.size, 1);
        assert.strictEqual(generated, 1);
    });
    it('allocates a different identity for the next logical bet', async () => {
        let generated = 0;
        const options = {
            params: { lower: 0, upper: 50, inverted: false }, amount: 0.1,
            newKey: () => `request-${++generated}`,
            place: async (_params, _amount, key) => key,
        };
        const first = createBetOperation(options), second = createBetOperation(options);
        assert.strictEqual(await first(), 'request-1');
        assert.strictEqual(await second(), 'request-2');
        assert.strictEqual(await first(), 'request-1');
    });
    it('keeps the submitted parameters stable when the caller edits its plan', async () => {
        const params = { lower: 0, upper: 50, inverted: false };
        const operation = createBetOperation({ params, amount: 0.1, newKey: () => 'key',
            place: async (p, amount) => ({ params: p, amount }),
        });
        params.upper = 99;
        const submitted = await operation();
        assert.deepStrictEqual(submitted, { params: { lower: 0, upper: 50, inverted: false }, amount: 0.1 });
        assert.ok(Object.isFrozen(submitted.params));
    });
    it('retries transient errors and stops on schema, API, authentication or unknown errors', () => {
        assert.strictEqual(isRetryable({ kind: 'TRANSIENT' }), true);
        for (const error of [{ kind: 'SCHEMA' }, { kind: 'API' }, { kind: 'AUTH' }, new Error('unknown'), null]) {
            assert.strictEqual(isRetryable(error), false);
        }
    });
});

},
"tests/dice/clientSeedTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const { createClientSeedChooser } = require('../../capture/client-seed.reference.mjs');
const COMMITMENT_A = 'a'.repeat(64);
const COMMITMENT_B = 'b'.repeat(64);
function trackedRandom(log) {
    let calls = 0;
    return (n) => {
        calls++;
        log.push(`randomBytes(${n})#${calls}`);
        return { toString: () => String(calls).padStart(n * 2, '0') };
    };
}
describe('client-seed selection ordering', () => {
    it('REFUSES to generate before the commitment has been received', () => {
        const log = [];
        const chooser = createClientSeedChooser({ randomBytes: trackedRandom(log) });
        for (const commitment of [undefined, null, '', 'not-a-hash', 'a'.repeat(63), 'A'.repeat(64)]) {
            assert.throws(() => chooser.chooseAfterCommitment({ epoch: 3, tag: 'pfaudit', commitment }), /refusing to generate before the server commitment/, `commitment ${JSON.stringify(commitment)} must be refused`);
        }
        assert.deepStrictEqual(log, [], 'the CSPRNG must not be touched when the commitment is missing');
        assert.strictEqual(chooser.record.length, 0);
    });
    it('the commitment check happens BEFORE the CSPRNG call, per epoch', () => {
        const log = [];
        const chooser = createClientSeedChooser({
            randomBytes: (n) => { log.push('random'); return { toString: () => 'ab'.repeat(n) }; },
        });
        assert.throws(() => chooser.chooseAfterCommitment({ epoch: 0, tag: 'audit', commitment: null }));
        log.push('commitment-received');
        chooser.chooseAfterCommitment({ epoch: 0, tag: 'audit', commitment: COMMITMENT_A });
        assert.deepStrictEqual(log, ['commitment-received', 'random'], 'randomness must be drawn only after the commitment is in hand');
    });
    it('calls the generator exactly once per epoch, with fresh material each time', () => {
        const log = [];
        const chooser = createClientSeedChooser({ randomBytes: trackedRandom(log) });
        const seeds = [0, 1, 2, 3, 4].map((epoch) => chooser.chooseAfterCommitment({ epoch, tag: 'pfaudit', commitment: COMMITMENT_A }).clientSeed);
        assert.strictEqual(log.length, 5, 'one CSPRNG call per epoch, no more and no fewer');
        assert.strictEqual(new Set(seeds).size, 5, 'every epoch gets distinct material');
        assert.deepStrictEqual(log, [1, 2, 3, 4, 5].map((i) => `randomBytes(16)#${i}`));
    });
    it('no client seed is a function of the timestamp and epoch alone', () => {
        const frozenClock = () => '2026-09-10T00:00:00.000Z';
        const run = (material) => {
            let calls = 0;
            const chooser = createClientSeedChooser({
                randomBytes: (n) => { calls++; return { toString: () => `${calls}${material.repeat(n * 2)}`.slice(0, n * 2) }; },
                now: frozenClock,
            });
            return [0, 1, 2].map((epoch) => chooser.chooseAfterCommitment({ epoch, tag: 'pfaudit', commitment: COMMITMENT_A }).clientSeed);
        };
        const a = run('a'), b = run('b');
        a.forEach((seed, i) => assert.notStrictEqual(seed, b[i], `epoch ${i}: a frozen clock and a fixed epoch must NOT reproduce the client seed`));
        a.forEach((seed) => assert.ok(seed.split('-').pop().length >= 32, `too little entropy in ${seed}`));
    });
    it('records which commitment preceded each choice', () => {
        const chooser = createClientSeedChooser({ randomBytes: trackedRandom([]) });
        chooser.chooseAfterCommitment({ epoch: 7, tag: 'audit', commitment: COMMITMENT_A, commitmentSource: 'provably-fair/active' });
        chooser.chooseAfterCommitment({ epoch: 8, tag: 'audit', commitment: COMMITMENT_B, commitmentSource: 'provably-fair/rotate' });
        assert.deepStrictEqual(chooser.record.map((r) => [r.epoch, r.precededByCommitment, r.commitmentSource]), [
            [7, COMMITMENT_A, 'provably-fair/active'],
            [8, COMMITMENT_B, 'provably-fair/rotate'],
        ]);
        assert.ok(chooser.record.every((r) => r.entropySource === 'csprng'));
    });
    it('the label may keep an epoch prefix — the unpredictable part is separate', () => {
        const chooser = createClientSeedChooser({ randomBytes: trackedRandom([]) });
        const { clientSeed } = chooser.chooseAfterCommitment({ epoch: 124, tag: 'pfaudit', commitment: COMMITMENT_A });
        assert.ok(clientSeed.startsWith('pfaudit-124-'), clientSeed);
        assert.notStrictEqual(clientSeed, 'pfaudit-124');
    });
    it('rejects a configuration with too little entropy, rather than accepting it quietly', () => {
        assert.throws(() => createClientSeedChooser({ randomBytes: trackedRandom([]), entropyBytes: 4 }), /at least 16/);
        assert.throws(() => createClientSeedChooser({}), /randomBytes is required/);
    });
    it('preserves the recorded dataset and identifies its predictable Phase-D seeds', () => {
        const ds = require('../../data/dice-master-6700bets.json');
        const phaseD = ds.bets.filter((b) => b.phase === 'D');
        assert.strictEqual(phaseD.length, 500);
        assert.ok(phaseD.every((b) => /^pfaudit-\d+-\d+$/.test(b.clientSeed)), 'Phase-D client seeds must be preserved exactly as captured');
        const stamps = new Set(phaseD.map((b) => b.clientSeed.split('-')[1]));
        assert.strictEqual(stamps.size, 1, 'one process-start stamp across all of Phase D');
    });
});

},
"tests/dice/commitmentTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const commitment_1 = require("../steps/commitment");
const dataset = require('../../data/dice-master-6700bets.json');
function checkPreCapture(preCapture) {
    const seedMap = new Map(dataset.seeds.map(s => [s.hashedServerSeed, s.serverSeed]));
    const byHash = new Map(dataset.seeds.map(s => [s.hashedServerSeed,
        dataset.bets.filter(b => b.hashedServerSeed === s.hashedServerSeed)]));
    const ctx = {
        bets: dataset.bets, seeds: dataset.seeds, seedMap, byHash,
        meta: { ...dataset.meta, preCapture },
    };
    const saved = console.log;
    try {
        console.log = () => { };
        return (0, commitment_1.run)(ctx).find(result => result.step === 2);
    }
    finally {
        console.log = saved;
    }
}
describe('pre-capture commitment evidence', () => {
    it('accepts the recorded hash and link to epoch zero', () => {
        assert.strictEqual(checkPreCapture(dataset.meta.preCapture).status, 'PASS');
    });
    it('fails when the record or a required field is absent', () => {
        const pre = dataset.meta.preCapture;
        for (const missing of [undefined, null, {},
            { ...pre, hashedServerSeed: null }, { ...pre, revealedServerSeed: null },
            { ...pre, nextHashedServerSeed: null }]) {
            assert.strictEqual(checkPreCapture(missing).status, 'FAIL');
        }
    });
    it('fails when the revealed seed or epoch-zero link is changed', () => {
        const pre = dataset.meta.preCapture;
        assert.strictEqual(checkPreCapture({ ...pre, revealedServerSeed: '0'.repeat(64) }).status, 'FAIL');
        assert.strictEqual(checkPreCapture({ ...pre, nextHashedServerSeed: '0'.repeat(64) }).status, 'FAIL');
    });
});

},
"tests/dice/exactNullTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const exact_chi2_1 = require("../../src/exact-chi2");
const config_1 = require("../../src/config");
const N = config_1.SIM_CHERRY_WINDOW;
const B = config_1.SIM_CHERRY_BINS;
function dpDistribution(n, b) {
    const C = [];
    for (let i = 0; i <= n; i++) {
        const row = new Float64Array(n + 1);
        row[0] = 1;
        for (let k = 1; k <= i; k++)
            row[k] = C[i - 1][k - 1] + (k <= i - 1 ? C[i - 1][k] : 0);
        C.push(row);
    }
    let layer = [];
    for (let j = 0; j <= n; j++) {
        const a = new Float64Array(j * j + 1);
        a[j * j] = 1;
        layer.push(a);
    }
    for (let bins = 2; bins <= b; bins++) {
        const next = [];
        for (let j = 0; j <= n; j++) {
            const out = new Float64Array(j * j + 1);
            const p = 1 / bins;
            for (let h = 0; h <= j; h++) {
                const w = C[j][h] * Math.pow(p, h) * Math.pow(1 - p, j - h);
                if (w === 0)
                    continue;
                const prev = layer[j - h], shift = h * h;
                for (let s = 0; s < prev.length; s++)
                    if (prev[s] !== 0)
                        out[s + shift] += w * prev[s];
            }
            next.push(out);
        }
        layer = next;
    }
    return layer[n];
}
describe('LIQD Dice — exact Pass-2 null', () => {
    const nul = (0, exact_chi2_1.exactNull)();
    it('enumerates every partition of 50 into at most 20 parts', () => {
        assert.strictEqual(nul.partitions, 181274);
    });
    it('the statistic has 832 attainable values, spanning the equidistributed and degenerate extremes', () => {
        assert.strictEqual(nul.support.length, 832);
        assert.strictEqual(nul.support[0], 130);
        assert.strictEqual(nul.support[nul.support.length - 1], N * N);
    });
    it('is a probability distribution (total mass 1 to 1e-12)', () => {
        const mass = nul.probability.reduce((a, b) => a + b, 0);
        assert.ok(Math.abs(mass - 1) < 1e-12, `mass ${mass}`);
        assert.ok(nul.probability.every((p) => p > 0));
    });
    it('agrees with an INDEPENDENT dynamic-programming derivation to 1e-12 relative', () => {
        const dp = dpDistribution(N, B);
        let maxRel = 0;
        for (let i = 0; i < nul.support.length; i++) {
            const s = nul.support[i], exact = nul.probability[i];
            const rel = Math.abs(dp[s] - exact) / exact;
            if (rel > maxRel)
                maxRel = rel;
        }
        assert.ok(maxRel < 1e-12, `max relative difference ${maxRel}`);
        const support = new Set(nul.support);
        for (let s = 0; s < dp.length; s++)
            if (!support.has(s))
                assert.strictEqual(dp[s], 0, `s=${s}`);
    });
    it('upper tails are monotone and end at the point mass of the extreme', () => {
        for (let i = 1; i < nul.support.length; i++) {
            assert.ok(nul.upperTail[i] <= nul.upperTail[i - 1], `tail not monotone at ${nul.support[i]}`);
        }
        assert.ok(Math.abs(nul.upperTail[0] - 1) < 1e-12);
        assert.strictEqual(nul.upperTail[nul.upperTail.length - 1], nul.probability[nul.probability.length - 1]);
        assert.strictEqual((0, exact_chi2_1.upperTailBySquareSum)(N * N + 1), 0);
        assert.ok(Math.abs((0, exact_chi2_1.upperTailBySquareSum)(0) - 1) < 1e-12);
    });
    it('the ACHIEVED per-window rejection is 0.0459237601, not the nominal 0.05', () => {
        const a = (0, exact_chi2_1.achievedSeedAlpha)();
        assert.ok(a < config_1.SIM_CHERRY_SEED_ALPHA, 'achieved rate must be below the nominal one');
        assert.strictEqual(a.toFixed(10), '0.0459237601');
        assert.strictEqual((0, exact_chi2_1.upperTailBySquareSum)(202), a);
        assert.strictEqual((0, exact_chi2_1.chi2FromSquareSum)(202), 30.8);
        const idx = nul.support.indexOf(202);
        assert.ok(idx > 0);
        assert.ok(nul.upperTail[idx - 1] >= config_1.SIM_CHERRY_SEED_ALPHA, `tail at the next attainable value ${nul.support[idx - 1]} is ${nul.upperTail[idx - 1]}, which would also reject`);
    });
    it('the compound flag rate is a·(1 − a) = 0.0438147684', () => {
        const a = (0, exact_chi2_1.achievedSeedAlpha)();
        assert.strictEqual((0, exact_chi2_1.cherryFlagRate)(), a * (1 - a));
        assert.strictEqual((0, exact_chi2_1.cherryFlagRate)().toFixed(10), '0.0438147684');
    });
    it('squareSum bins the window exactly as χ² = (Σh² − n²/B)/(n/B)', () => {
        const per = config_1.RANGE / B;
        const draws = [];
        for (let i = 0; i < N; i++)
            draws.push(Math.floor((i % B) * per));
        const h = new Array(B).fill(0);
        for (const d of draws)
            h[Math.min(B - 1, Math.floor(d / per))]++;
        const bySum = h.reduce((a, v) => a + v * v, 0);
        assert.strictEqual((0, exact_chi2_1.squareSum)(draws), bySum);
        const e = N / B;
        const byDefinition = h.reduce((a, v) => a + (v - e) ** 2 / e, 0);
        assert.ok(Math.abs((0, exact_chi2_1.chi2FromSquareSum)(bySum) - byDefinition) < 1e-9);
    });
    it('all 50 draws in one bin is the maximum statistic and has the smallest possible tail', () => {
        const draws = new Array(N).fill(0);
        assert.strictEqual((0, exact_chi2_1.squareSum)(draws), N * N);
        assert.strictEqual((0, exact_chi2_1.upperTailBySquareSum)(N * N), nul.probability[nul.probability.length - 1]);
    });
});

},
"tests/dice/rngTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
describe('LIQD Dice RNG', () => {
    const S = '00112233445566778899aabbccddeeff';
    const C = 'audittest';
    const serverVectors = [
        [0, 93.22], [1, 0.79], [2, 81.91], [3, 97.36],
        [4, 90.34], [5, 64.99], [6, 9.48], [7, 93.41],
    ];
    it('reproduces the operator verify endpoint byte-for-byte (8 vectors)', () => {
        for (const [nonce, roll] of serverVectors) {
            assert.ok(Math.abs((0, rng_1.diceRoll)(S, C, nonce) - roll) < 1e-9, `nonce ${nonce}: ${(0, rng_1.diceRoll)(S, C, nonce)} != ${roll}`);
        }
    });
    it('draws are bias-free integers in [0, 10000) at cursor 0', () => {
        for (const [nonce] of serverVectors) {
            const draw = (0, rng_1.generateProvablyFairNumber)(S, C, nonce, config_1.CURSOR, config_1.RANGE);
            assert.ok(Number.isInteger(draw) && draw >= 0 && draw < config_1.RANGE);
        }
    });
    it('recomputes a real captured winning bet from its revealed seed', () => {
        const serverSeed = '015307d5a3f62db476210c3797bac8b7';
        const clientSeed = 'auditf2456fc140ac';
        const nonce = 0;
        const params = { lower: 0, upper: 92.37, inverted: false };
        const roll = (0, rng_1.diceRoll)(serverSeed, clientSeed, nonce);
        assert.ok(Math.abs(roll - 24.01) < 1e-9, `roll ${roll}`);
        assert.strictEqual((0, config_1.diceWin)(roll, params), true);
        const mult = (0, config_1.quotedMultiplier)(params);
        assert.ok(Math.abs(mult - 1.071776550828191) < 1e-9, `mult ${mult}`);
        assert.ok(Math.abs(0.1 * mult - 0.10717766) < 1e-6);
    });
    it('commitment hash = SHA-256(utf8(serverSeed hex string))', () => {
        assert.strictEqual((0, rng_1.commitHash)('015307d5a3f62db476210c3797bac8b7'), '918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8');
    });
    it('client seed is load-bearing — a different client seed changes the roll', () => {
        assert.notStrictEqual((0, rng_1.diceRoll)(S, C, 0), (0, rng_1.diceRoll)(S, C + 'x', 0));
    });
});
describe('LIQD Dice game math', () => {
    it('multiplier = 99 / continuousWinChance (1% edge)', () => {
        assert.ok(Math.abs((0, config_1.quotedMultiplier)({ lower: 0, upper: 50, inverted: false }) - 1.98) < 1e-12);
        assert.ok(Math.abs((0, config_1.quotedMultiplier)({ lower: 99, upper: 100, inverted: false }) - 99) < 1e-9);
        assert.ok(Math.abs((0, config_1.quotedMultiplier)({ lower: 0, upper: 10, inverted: false }) - 9.9) < 1e-12);
        assert.ok(Math.abs((0, config_1.quotedMultiplier)({ lower: 0, upper: 0.01, inverted: false }) - 9900) < 1e-6);
        assert.strictEqual((0, config_1.discreteWinCount)({ lower: 0, upper: 0.01, inverted: false }), 1);
        assert.ok(Math.abs((0, config_1.effectiveEdge)({ lower: 0, upper: 0.01, inverted: false }) - 0.01) < 1e-12);
    });
    it('win rule is HALF-OPEN [lower, upper) and honours inverted', () => {
        const p = { lower: 25, upper: 75, inverted: false };
        assert.strictEqual((0, config_1.diceWin)(25, p), true);
        assert.strictEqual((0, config_1.diceWin)(75, p), false);
        assert.strictEqual((0, config_1.diceWin)(74.99, p), true);
        assert.strictEqual((0, config_1.diceWin)(24.99, p), false);
        assert.strictEqual((0, config_1.diceWin)(75, { ...p, inverted: true }), true);
        assert.strictEqual((0, config_1.diceWin)(25, { ...p, inverted: true }), false);
    });
    it('boundary semantics match the operator verifier probes of record (E13)', () => {
        const r = (0, rng_1.diceRoll)('015307d5a3f62db476210c3797bac8b7', 'auditf2456fc140ac', 1000);
        assert.ok(Math.abs(r - 3.61) < 1e-9, `probe roll ${r}`);
        const probes = [
            [{ lower: 0, upper: 3.61, inverted: false }, false],
            [{ lower: 0, upper: 3.62, inverted: false }, true],
            [{ lower: 3.61, upper: 10, inverted: false }, true],
            [{ lower: 3.62, upper: 10, inverted: false }, false],
            [{ lower: 0.5, upper: 3.61, inverted: true }, true],
            [{ lower: 3.61, upper: 10, inverted: true }, false],
            [{ lower: 3.61, upper: 100, inverted: false }, true],
        ];
        for (const [p, win] of probes) {
            assert.strictEqual((0, config_1.diceWin)(r, p), win, JSON.stringify(p));
        }
    });
    it('E13 discriminates half-open from inclusive-both-ends on exactly 2 of its 7 probes', () => {
        const r = 3.61;
        const probeParams = [
            { lower: 0, upper: 3.61, inverted: false },
            { lower: 0, upper: 3.62, inverted: false },
            { lower: 3.61, upper: 10, inverted: false },
            { lower: 3.62, upper: 10, inverted: false },
            { lower: 0.5, upper: 3.61, inverted: true },
            { lower: 3.61, upper: 10, inverted: true },
            { lower: 3.61, upper: 100, inverted: false },
        ];
        const inclusiveBothEnds = (roll, p) => {
            const inBand = roll >= p.lower && roll <= p.upper;
            return p.inverted ? !inBand : inBand;
        };
        const discriminating = probeParams.filter((p) => (0, config_1.diceWin)(r, p) !== inclusiveBothEnds(r, p));
        assert.strictEqual(probeParams.length, 7, 'E13 has 7 probes');
        assert.strictEqual(discriminating.length, 2, `expected 2 discriminating probes, got ${discriminating.length}: ${JSON.stringify(discriminating)}`);
        assert.deepStrictEqual(discriminating, [
            { lower: 0, upper: 3.61, inverted: false },
            { lower: 0.5, upper: 3.61, inverted: true },
        ]);
    });
    it('mode classification', () => {
        assert.strictEqual((0, config_1.bandMode)({ lower: 0, upper: 50, inverted: false }), 'under');
        assert.strictEqual((0, config_1.bandMode)({ lower: 50, upper: 100, inverted: false }), 'over');
        assert.strictEqual((0, config_1.bandMode)({ lower: 25, upper: 75, inverted: false }), 'inside');
        assert.strictEqual((0, config_1.bandMode)({ lower: 25, upper: 75, inverted: true }), 'outside');
    });
    it('discrete win chance equals the continuous width in every mode (half-open rule)', () => {
        const under50 = { lower: 0, upper: 50, inverted: false };
        const over50 = { lower: 50, upper: 100, inverted: false };
        const outside = { lower: 25, upper: 75, inverted: true };
        assert.ok(Math.abs((0, config_1.discreteWinProbability)(under50) - 0.5) < 1e-12);
        assert.ok(Math.abs((0, config_1.discreteWinProbability)(over50) - 0.5) < 1e-12);
        assert.ok(Math.abs((0, config_1.discreteWinProbability)(outside) - 0.5) < 1e-12);
        assert.ok(Math.abs((0, config_1.effectiveEdge)(under50) - 0.01) < 1e-12);
        assert.ok(Math.abs((0, config_1.effectiveEdge)(over50) - 0.01) < 1e-12);
    });
    it('continuous win chance', () => {
        assert.strictEqual((0, config_1.continuousWinChancePct)({ lower: 0, upper: 30, inverted: false }), 30);
        assert.strictEqual((0, config_1.continuousWinChancePct)({ lower: 20, upper: 80, inverted: true }), 40);
    });
    const fractionalBands = [
        { lower: 0, upper: 39.3, inverted: false },
        { lower: 10.22, upper: 66.49, inverted: false },
        { lower: 4.9, upper: 55.39, inverted: true },
        { lower: 38.65, upper: 73.46, inverted: true },
        { lower: 32.09, upper: 97.35, inverted: false },
        { lower: 32.13, upper: 100, inverted: false },
        { lower: 40.09, upper: 47.72, inverted: false },
        { lower: 0, upper: 1.12, inverted: false },
    ];
    it('discreteWinCount matches literal grid enumeration on fractional bounds', () => {
        for (const p of fractionalBands) {
            let c = 0;
            for (let d = 0; d < config_1.RANGE; d++)
                if ((0, config_1.diceWin)(d / config_1.SCALE, p))
                    c++;
            assert.strictEqual((0, config_1.discreteWinCount)(p), c, JSON.stringify(p));
        }
    });
    it('closed-form edge is exactly 1.00% for every band in every mode', () => {
        for (const p of fractionalBands) {
            assert.ok((0, config_1.effectiveEdgeIsExact)(p), `${JSON.stringify(p)}: integer edge identity fails`);
        }
    });
    it('the float edge form departs from 0.01 by up to 5.06e-13 — half the old 1e-12 threshold', () => {
        const extreme = { lower: 99.99, upper: 100, inverted: false };
        const departure = Math.abs((0, config_1.effectiveEdge)(extreme) - 0.01);
        assert.strictEqual(departure, 5.063813951489138e-13);
        assert.ok(departure > 1e-12 / 2, 'the old 1e-12 threshold was under 2x this departure');
        assert.ok((0, config_1.effectiveEdgeIsExact)(extreme), 'the integer identity holds where the float one strains');
    });
    it('the integer edge identity holds over 59,998 bands across all four modes', () => {
        let checked = 0;
        for (let lo = 0; lo < config_1.RANGE; lo++) {
            const fams = [
                { lower: lo / 100, upper: 100, inverted: false },
                { lower: lo / 100, upper: 100, inverted: true },
                { lower: 0, upper: (lo + 1) / 100, inverted: false },
                { lower: 0, upper: (lo + 1) / 100, inverted: true },
                { lower: lo / 100, upper: Math.min(100, (lo + 1) / 100 + 25), inverted: false },
                { lower: lo / 100, upper: Math.min(100, (lo + 1) / 100 + 25), inverted: true },
            ];
            for (const p of fams) {
                if ((0, config_1.continuousWinChancePct)(p) <= 0)
                    continue;
                assert.ok((0, config_1.effectiveEdgeIsExact)(p), `${JSON.stringify(p)}`);
                checked++;
            }
        }
        assert.strictEqual(checked, 59998);
    });
    it('non-2dp band bounds are rejected, not silently rounded', () => {
        assert.throws(() => (0, config_1.discreteWinCount)({ lower: 0, upper: 39.301, inverted: false }), /non-2dp band bound/);
    });
    it('rejection guard fires: first chunk >= maxFair is skipped, second chunk taken', () => {
        const rejectionVectors = [
            { nonce: 1520921, chunk0: 4294961212, roll: 45.60 },
            { nonce: 2388818, chunk0: 4294966436, roll: 35.84 },
            { nonce: 3289857, chunk0: 4294966973, roll: 18.16 },
        ];
        const seed = '00112233445566778899aabbccddeeff';
        const clientSeed = 'audittest';
        const maxFair = Math.floor(4294967296 / config_1.RANGE) * config_1.RANGE;
        for (const v of rejectionVectors) {
            assert.ok(v.chunk0 >= maxFair, `vector precondition: chunk0 ${v.chunk0} in rejected tail`);
            const unguarded = (v.chunk0 % config_1.RANGE) / config_1.SCALE;
            const roll = (0, rng_1.diceRoll)(seed, clientSeed, v.nonce);
            assert.ok(Math.abs(roll - v.roll) < 1e-9, `nonce ${v.nonce}: roll ${roll} != ${v.roll}`);
            assert.notStrictEqual(roll, unguarded, `nonce ${v.nonce}: guard did not fire`);
        }
    });
});

},
"tests/dice/runtimeTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const runtime_1 = require("../../src/runtime");
describe('supported runtime', () => {
    it('this runtime is the one the package was validated on', () => {
        assert.strictEqual((0, runtime_1.isSupportedRuntime)(), true, (0, runtime_1.unsupportedRuntimeMessage)());
    });
    it('the declared runtime and package.json engines agree', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
        assert.strictEqual(pkg.engines?.node, `${runtime_1.SUPPORTED_NODE_MAJOR}.x`);
        assert.ok(runtime_1.VALIDATED_RUNTIME.includes(`v${runtime_1.SUPPORTED_NODE_MAJOR}.`), `VALIDATED_RUNTIME "${runtime_1.VALIDATED_RUNTIME}" is not a ${runtime_1.SUPPORTED_NODE_MAJOR}.x version`);
    });
    it('rejects the runtimes the package was NOT validated on', () => {
        assert.strictEqual((0, runtime_1.isSupportedRuntime)('24.13.1'), false, 'Node 24 is outside the supported major version');
        assert.strictEqual((0, runtime_1.isSupportedRuntime)('20.11.0'), false, 'the runtime the old README advertised');
        assert.strictEqual((0, runtime_1.isSupportedRuntime)('23.0.0'), false);
        assert.strictEqual((0, runtime_1.isSupportedRuntime)('22.0.0'), true);
        assert.strictEqual((0, runtime_1.nodeMajor)('24.13.1'), 24);
    });
    it('the refusal message names the runtime, the requirement and what to do', () => {
        const msg = (0, runtime_1.unsupportedRuntimeMessage)('24.13.1');
        assert.match(msg, /UNSUPPORTED RUNTIME/);
        assert.match(msg, /Running on\s+: Node v24\.13\.1/);
        assert.match(msg, /Supported\s+: Node 22\.x/);
        assert.match(msg, /Nothing was written; no evidence was touched/);
    });
});

},
"tests/dice/settlementTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const config_1 = require("../../src/config");
describe('LIQD Dice settlement arithmetic', () => {
    it('exact tie at 2.2e11 units rounds half-EVEN up — the case the float rule lost', () => {
        assert.strictEqual((0, config_1.settledCredit)(2.5, 9900 / 111), 222.97297298);
        assert.strictEqual((0, config_1.settledCreditUnits)(2.5, 9900 / 111), 22297297298n);
    });
    it('exact tie rounds half-EVEN down when the quotient is already even', () => {
        assert.strictEqual((0, config_1.settledCredit)(0.1, 9900 / 5808), 0.17045454);
        assert.strictEqual((0, config_1.settledCreditUnits)(0.1, 9900 / 5808), 17045454n);
    });
    it('reproduces the report\'s worked example credit', () => {
        assert.strictEqual((0, config_1.settledCredit)(0.1, 9900 / 9237), 0.10717766);
    });
    it('six large-magnitude ties require exact integer rounding', () => {
        const cases = [
            [2.5, 177, 139.83050848],
            [2.5, 184, 134.51086958],
            [2.5, 186, 133.06451612],
            [2.5, 216, 114.58333332],
            [2.5, 244, 101.43442622],
            [2.5, 270, 91.66666668],
        ];
        for (const [stake, bp, expected] of cases) {
            assert.strictEqual((0, config_1.settledCredit)(stake, 9900 / bp), expected, `stake ${stake} bp ${bp}`);
        }
    });
    it('rounds to EVEN, not up, on a constructed tie in both directions', () => {
        assert.strictEqual((0, config_1.settledCreditUnits)(0.5, 1.00000001), 50000000n);
        assert.strictEqual((0, config_1.settledCreditUnits)(0.5, 1.00000003), 50000002n);
    });
    it('a loss-sized and a whole-number credit are exact', () => {
        assert.strictEqual((0, config_1.settledCredit)(10, 1.98), 19.8);
        assert.strictEqual((0, config_1.settledCreditUnits)(10, 99), 99000000000n);
    });
    it('a credit that IS the decimal product is reported as landing on the product', () => {
        const band = { lower: 68.32, upper: 100, inverted: false };
        assert.strictEqual((0, config_1.payoutBasisPoints)(band), 3168);
        assert.strictEqual(9900 / 3168, 3.125);
        assert.strictEqual((0, config_1.quotedMultiplier)(band), 3.124999999999999);
        assert.strictEqual((0, config_1.creditResidualSign)(0.3125, 0.1, band), 0, 'nothing was rounded on this bet');
        assert.strictEqual((0, config_1.creditResidual)(0.3125, 0.1, band), 0);
        const over50 = { lower: 50, upper: 100, inverted: false };
        assert.strictEqual((0, config_1.creditResidualSign)(19.8, 10, over50), 0);
        const band9237 = { lower: 0, upper: 92.37, inverted: false };
        assert.strictEqual((0, config_1.payoutBasisPoints)(band9237), 9237);
        assert.strictEqual((0, config_1.creditResidualSign)(0.10717766, 0.1, band9237), 1);
    });
    it('stage-1 has exact 8-dp ties at basisPoints 2048 and 6144, resolved half-UP (mode ASSUMED)', () => {
        const ties = [];
        for (let bp = 1; bp <= 9900; bp++) {
            const num = 9900n * 100000000n, b = BigInt(bp);
            if (2n * (num % b) === b)
                ties.push(bp);
        }
        assert.deepStrictEqual(ties, [2048, 6144]);
        assert.strictEqual(9900 / 2048, 4.833984375);
        assert.strictEqual(9900 / 6144, 1.611328125);
        assert.strictEqual(Math.round((9900 / 2048) * 1e8), 483398438);
        assert.strictEqual(Math.round((9900 / 6144) * 1e8), 161132813);
        const halfEven = (scaledTimesTwo) => {
            const q = scaledTimesTwo / 2n;
            return (q % 2n === 0n) ? q : q + 1n;
        };
        assert.strictEqual(halfEven(2n * 483398437n + 1n), 483398438n);
        assert.strictEqual(halfEven(2n * 161132812n + 1n), 161132812n);
    });
    it('no captured bet lands on a stage-1 tie band, so the mode is unwitnessed', () => {
        const ds = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/dice-master-6700bets.json'), 'utf8'));
        const onTie = ds.bets.filter((b) => [2048, 6144].includes((0, config_1.payoutBasisPoints)(b.params)));
        assert.strictEqual(onTie.length, 0, 'a captured bet now lands on a stage-1 tie — the ASSUMED note in src/config.ts can be settled');
    });
    it('stage-1 round8(9900/bp) agrees with exact HALF-UP rounding on every reachable band', () => {
        let checked = 0;
        for (let bp = 1; bp <= 9800; bp++) {
            const m = 9900 / bp;
            const scaledExact = exactTimes1e8(m);
            const jsRounded = BigInt(Math.round(m * 1e8));
            assert.strictEqual(jsRounded, roundHalfUp(scaledExact), `bp ${bp}`);
            checked++;
        }
        assert.strictEqual(checked, 9800);
    });
    it('round8 is idempotent on an already-8-dp value', () => {
        assert.strictEqual((0, config_1.round8)((0, config_1.round8)(9900 / 9237)), (0, config_1.round8)(9900 / 9237));
    });
    it('refuses to return a lossy double above 2^53 units, and stays exact in integer units', () => {
        assert.throws(() => (0, config_1.settledCredit)(9898, 9900), /exceeds exact double range/);
        assert.strictEqual((0, config_1.settledCreditUnits)(9898, 9900), 9799020000000000n);
        assert.strictEqual((0, config_1.settledCredit)(10, 99), 990);
    });
    it('the served-roll predicate is exact: off-grid, out-of-range and non-numeric are all rejected', () => {
        assert.strictEqual((0, config_1.servedRollMatches)(24.01, 24.01), true);
        assert.strictEqual((0, config_1.servedRollMatches)(0, 0), true);
        assert.strictEqual((0, config_1.servedRollMatches)(99.99, 99.99), true);
        assert.strictEqual((0, config_1.servedRollMatches)(24.010000001, 24.01), false, 'off-grid value must be rejected');
        assert.strictEqual((0, config_1.servedRollMatches)(24.01, 24.02), false);
        assert.strictEqual((0, config_1.servedRollMatches)(100, 100), false, 'above the roll ceiling');
        assert.strictEqual((0, config_1.servedRollMatches)(-0.01, -0.01), false, 'below the roll domain');
        assert.strictEqual((0, config_1.servedRollMatches)(NaN, 24.01), false);
        assert.strictEqual((0, config_1.servedRollMatches)(24.01, NaN), false);
        assert.strictEqual((0, config_1.servedRollMatches)(Infinity, Infinity), false);
    });
    it('the derived payout numerator is exactly 9900 at the audited house edge', () => {
        assert.strictEqual((1 - config_1.HOUSE_EDGE) * 10000, 9900);
        assert.strictEqual((0, config_1.quotedMultiplier)({ lower: 99, upper: 100, inverted: false }), 99);
    });
});
describe('Step 20 expected-credit derivation', () => {
    const expectedMultiplier = (p) => 9900 / (0, config_1.payoutBasisPoints)(p);
    const FAILING_BANDS = [
        { label: 'over 99.99', params: { lower: 99.99, upper: 100, inverted: false }, bps: 1, floatR8: 9899.99999999, quotientR8: 9900 },
        { label: 'outside [0, 99.99)', params: { lower: 0, upper: 99.99, inverted: true }, bps: 1, floatR8: 9899.99999999, quotientR8: 9900 },
        { label: 'over 79.52', params: { lower: 79.52, upper: 100, inverted: false }, bps: 2048, floatR8: 4.83398437, quotientR8: 4.83398438 },
        { label: 'outside [0, 79.52)', params: { lower: 0, upper: 79.52, inverted: true }, bps: 2048, floatR8: 4.83398437, quotientR8: 4.83398438 },
        { label: 'inside [0.01, 61.45)', params: { lower: 0.01, upper: 61.45, inverted: false }, bps: 6144, floatR8: 1.61132812, quotientR8: 1.61132813 },
        { label: 'outside [0.02, 38.58)', params: { lower: 0.02, upper: 38.58, inverted: true }, bps: 6144, floatR8: 1.61132812, quotientR8: 1.61132813 },
    ];
    it('the six failing classes are exactly the bands where the two derivations disagree', () => {
        for (const b of FAILING_BANDS) {
            assert.strictEqual((0, config_1.payoutBasisPoints)(b.params), b.bps, b.label);
            assert.strictEqual((0, config_1.round8)((0, config_1.quotedMultiplier)(b.params)), b.floatR8, `${b.label} float path`);
            assert.strictEqual((0, config_1.round8)(expectedMultiplier(b.params)), b.quotientR8, `${b.label} quotient path`);
            assert.notStrictEqual(b.floatR8, b.quotientR8, b.label);
        }
        assert.deepStrictEqual([...new Set(FAILING_BANDS.map((b) => b.bps))].sort((a, z) => a - z), [1, 2048, 6144]);
    });
    it('ACCEPTS the correct $1 and $10 credits the float path would have rejected', () => {
        for (const b of FAILING_BANDS) {
            for (const stake of [1, 10]) {
                const correct = (0, config_1.settledCredit)(stake, expectedMultiplier(b.params));
                const floatPath = (0, config_1.settledCredit)(stake, (0, config_1.quotedMultiplier)(b.params));
                assert.notStrictEqual(floatPath, correct, `${b.label} at $${stake}: this case must distinguish the two calculation paths`);
                assert.strictEqual(correct, Number((BigInt(Math.round(stake * 1e8)) * BigInt(Math.round(expectedMultiplier(b.params) * 1e8)) / 100000000n)) / 1e8);
            }
        }
        assert.strictEqual((0, config_1.settledCredit)(1, expectedMultiplier({ lower: 99.99, upper: 100, inverted: false })), 9900);
        assert.strictEqual((0, config_1.settledCredit)(1, (0, config_1.quotedMultiplier)({ lower: 99.99, upper: 100, inverted: false })), 9899.99999999);
    });
    it('REJECTS a one-unit incorrect credit on every failing class at every stake', () => {
        for (const b of FAILING_BANDS) {
            for (const stake of [0.1, 1, 10]) {
                const correct = (0, config_1.settledCredit)(stake, expectedMultiplier(b.params));
                assert.notStrictEqual((0, config_1.round8)(correct + 1e-8), correct, `${b.label} at $${stake}`);
                assert.notStrictEqual((0, config_1.round8)(correct - 1e-8), correct, `${b.label} at $${stake}`);
            }
        }
    });
    it('$0.10 ERASES the difference through the final rounding — which is why $1 is the vector', () => {
        for (const b of FAILING_BANDS) {
            assert.strictEqual((0, config_1.settledCredit)(0.1, expectedMultiplier(b.params)), (0, config_1.settledCredit)(0.1, (0, config_1.quotedMultiplier)(b.params)), `${b.label} at $0.10 is not a discriminating stake`);
        }
    });
    it('CONTROL — `under 0.01` agrees under both derivations at every stake', () => {
        const control = { lower: 0, upper: 0.01, inverted: false };
        assert.strictEqual((0, config_1.payoutBasisPoints)(control), 1);
        for (const stake of [0.1, 1, 10]) {
            assert.strictEqual((0, config_1.settledCredit)(stake, expectedMultiplier(control)), (0, config_1.settledCredit)(stake, (0, config_1.quotedMultiplier)(control)), `control diverged at $${stake}`);
        }
        assert.strictEqual((0, config_1.settledCredit)(1, expectedMultiplier(control)), 9900);
    });
    it('changes NO captured row — the two derivations agree on all 6,700', () => {
        const ds = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/dice-master-6700bets.json'), 'utf8'));
        let checked = 0;
        for (const bet of ds.bets) {
            if (!bet.win)
                continue;
            checked++;
            const viaQuotient = (0, config_1.settledCredit)(Number(bet.betAmount), expectedMultiplier(bet.params));
            const viaFloat = (0, config_1.settledCredit)(Number(bet.betAmount), (0, config_1.quotedMultiplier)(bet.params));
            assert.strictEqual(viaQuotient, viaFloat, `epoch-level divergence on ${JSON.stringify(bet.params)}`);
            assert.strictEqual(viaQuotient, Number(bet.winningAmount), 'the quotient path must still reproduce the operator credit');
        }
        assert.strictEqual(checked, 2807);
    });
    it('enumerates 12,046 bands where the float and quotient paths diverge, none captured', () => {
        let diverge = 0;
        for (let u = 1; u <= 10000; u++) {
            const p = { lower: 0, upper: u / 100, inverted: false };
            if ((0, config_1.round8)((0, config_1.quotedMultiplier)(p)) !== (0, config_1.round8)(expectedMultiplier(p)))
                diverge++;
        }
        for (let l = 0; l < 10000; l++) {
            const p = { lower: l / 100, upper: 100, inverted: false };
            if ((0, config_1.round8)((0, config_1.quotedMultiplier)(p)) !== (0, config_1.round8)(expectedMultiplier(p)))
                diverge++;
        }
        assert.ok(diverge > 0, 'the under/over sweep must contain divergent bands');
    });
});
function exactTimes1e8(x) {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, x);
    const bits = view.getBigUint64(0);
    const exponent = Number((bits >> 52n) & 0x7ffn);
    const fraction = bits & 0xfffffffffffffn;
    let numerator, e;
    if (exponent === 0) {
        numerator = fraction;
        e = -1074;
    }
    else {
        numerator = fraction | (1n << 52n);
        e = exponent - 1075;
    }
    numerator *= 100000000n;
    return e >= 0 ? [numerator << BigInt(e), 1n] : [numerator, 1n << BigInt(-e)];
}
function roundHalfUp([num, den]) {
    const q = num / den, r = num % den;
    return 2n * r >= den ? q + 1n : q;
}

},
"tests/dice/simChecksTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const sim_checks_1 = require("../../src/sim-checks");
const config_1 = require("../../src/config");
const stats_1 = require("../../src/stats");
const M = 1.98;
const THEO = 0.99;
const COMMITTED_POINTS = [
    { n: 1000, rtp: 1.0375200000000067, se: 0.03127046289391956 },
    { n: 10000, rtp: 0.9951479999998745, se: 0.009899866151095175 },
    { n: 100000, rtp: 0.9917819999997746, se: 0.003130649811901676 },
    { n: 1000000, rtp: 0.9894554999937634, se: 0.0009899998502624888 },
    { n: 5000000, rtp: 0.9899184240268278, se: 0.00044274145804190423 },
    { n: 10000000, rtp: 0.9900619741251958, se: 0.0003130654877432553 },
    { n: 20000000, rtp: 0.9897698251742976, se: 0.00022137072378924333 },
];
describe('simulation checks — win-count recovery (schema 1 reconstruction)', () => {
    it('recovers the integer win count behind each committed convergence point', () => {
        const expected = [524, 5026, 50090, 499725, 2499794, 5000313];
        COMMITTED_POINTS.slice(0, 6).forEach((pt, i) => {
            const rec = (0, sim_checks_1.recoverWinCount)(pt.rtp, pt.n, M);
            assert.strictEqual(rec.ok, true, rec.reason);
            assert.strictEqual(rec.wins, expected[i], `n=${pt.n}`);
            assert.strictEqual(rec.source, 'reconstructed');
        });
    });
    it('the reconstruction residual stays far inside the declared cap at the deepest checkpoint', () => {
        const rec = (0, sim_checks_1.recoverWinCount)(0.9897698251742976, 20000000, M);
        assert.strictEqual(rec.ok, true);
        assert.strictEqual(rec.wins, 9997675);
        assert.ok(rec.residual < 0.01, `residual ${rec.residual} unexpectedly large`);
        assert.ok(rec.residual < sim_checks_1.RECONSTRUCTION_MAX_RESIDUAL);
    });
    it('rejects an RTP that no integer win count produces', () => {
        const rec = (0, sim_checks_1.recoverWinCount)((524.5 * M) / 1000, 1000, M);
        assert.strictEqual(rec.ok, false);
        assert.match(rec.reason, /no integer win count produces this RTP/);
    });
    it('rejects out-of-range and non-integer sample sizes and multipliers', () => {
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(0.99, 0, M).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(0.99, 1000.5, M).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(0.99, 1000, 0).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(Number.NaN, 1000, M).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(-0.5, 1000, M).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(M * 1.5, 1000, M).ok, false);
    });
    it('schema 2: a stored count must agree with the RTP it claims to have produced', () => {
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, 524).ok, true);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, 524).source, 'stored');
        const bad = (0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, 600);
        assert.strictEqual(bad.ok, false);
        assert.match(bad.reason, /disagrees with the 524/);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, 524.5).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, -1).ok, false);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(COMMITTED_POINTS[0].rtp, 1000, M, '524').ok, false);
    });
});
describe('a published RTP must be the return an INTEGER win count produces', () => {
    const BAND = { lower: 98, upper: 100, inverted: false };
    const BAND_M = (0, config_1.quotedMultiplier)(BAND);
    const FORGED = 0.99000495;
    it('the counterexample really does imply a fractional win count', () => {
        assert.strictEqual(BAND_M, 49.5);
        assert.strictEqual((FORGED * config_1.SIM_EDGE_BETS) / BAND_M, 40000.2);
        assert.ok(!Number.isInteger((FORGED * config_1.SIM_EDGE_BETS) / BAND_M));
        assert.ok(Math.abs(40000.2 - 40000) < sim_checks_1.RECONSTRUCTION_MAX_RESIDUAL);
    });
    it('REJECTS the reviewer\'s 0.99000495 over-98 RTP (40,000.2 wins)', () => {
        const rec = (0, sim_checks_1.recoverWinCount)(FORGED, config_1.SIM_EDGE_BETS, BAND_M);
        assert.strictEqual(rec.ok, false, 'a fractional win count must not be rounded into acceptance');
        assert.strictEqual(rec.match, 'none');
        assert.strictEqual(rec.wins, 40000);
        assert.strictEqual(rec.reconstructedRTP, 0.99);
        assert.match(rec.reason, /no integer win count produces this RTP/);
    });
    it('a stored schema-2 count cannot launder it either', () => {
        const rec = (0, sim_checks_1.recoverWinCount)(FORGED, config_1.SIM_EDGE_BETS, BAND_M, 40000);
        assert.strictEqual(rec.ok, false);
        assert.match(rec.reason, /no integer win count produces this RTP/);
    });
    it('rejects every fractional offset down to a hundredth of a win', () => {
        for (const offset of [0.5, 0.2, 0.1, 0.05, 0.01, -0.01, -0.2]) {
            const rtp = ((40000 + offset) * BAND_M) / config_1.SIM_EDGE_BETS;
            const rec = (0, sim_checks_1.recoverWinCount)(rtp, config_1.SIM_EDGE_BETS, BAND_M);
            assert.strictEqual(rec.ok, false, `${offset} wins from an integer must be rejected (rtp ${rtp})`);
        }
    });
    it('accepts the committed over-98 row, whose count is an integer 40,217', () => {
        const rec = (0, sim_checks_1.recoverWinCount)(0.99537075, config_1.SIM_EDGE_BETS, BAND_M);
        assert.strictEqual(rec.ok, true, rec.reason);
        assert.strictEqual(rec.wins, 40217);
        assert.strictEqual(rec.match, 'exact', 'the committed artifact needs no tolerance at all');
        assert.strictEqual(rec.reconstructedRTP, 0.99537075);
    });
    it('every committed convergence point reconstructs EXACTLY — no tolerance is spent', () => {
        const r = (0, sim_checks_1.validateConvergenceSeries)(COMMITTED_POINTS, M, THEO);
        assert.strictEqual(r.ok, true, r.failures.join('; '));
        assert.strictEqual(r.exactReconstructions, COMMITTED_POINTS.length);
        r.points.forEach((p) => assert.strictEqual(p.winMatch, 'exact', `n=${p.n}`));
    });
    it('reconstructReturn replays the producer\'s accumulation, not wins × m', () => {
        const wins = 9997675, n = 20000000;
        const accumulated = (0, sim_checks_1.reconstructReturn)(wins, M);
        assert.notStrictEqual(accumulated, wins * M, 'repeated addition is not the product in binary64');
        assert.strictEqual(accumulated / n, COMMITTED_POINTS[6].rtp);
    });
    it('the tolerance is DERIVED and stays orders below the counterexample', () => {
        const tol = (0, sim_checks_1.reconstructionTolerance)(40000);
        assert.ok(Math.abs(tol - 3.552e-7) < 1e-9, `tolerance ${tol}`);
        assert.ok(tol < 0.2, 'the derived bound must not reach the 0.2-win forgery');
        assert.ok((0, sim_checks_1.reconstructionTolerance)(10000000) <= sim_checks_1.RECONSTRUCTION_MAX_RESIDUAL);
        assert.ok((0, sim_checks_1.reconstructionTolerance)(10000000) > (0, sim_checks_1.reconstructionTolerance)(40000));
        assert.ok((0, sim_checks_1.reconstructionTolerance)(1e9) === sim_checks_1.RECONSTRUCTION_MAX_RESIDUAL);
    });
    it('fails closed past the depth where the reconstruction is defined', () => {
        const n = 500000000, wins = 100000000;
        const rec = (0, sim_checks_1.recoverWinCount)((wins * 1) / n, n, 1);
        assert.strictEqual(rec.ok, false);
        assert.match(rec.reason, /past the depth/);
    });
    it('accepts a producer that sums in a different order (bounded, not exact)', () => {
        const wins = 1000805, n = config_1.SIM_EDGE_BETS;
        const rtp = (wins * M) / n;
        const rec = (0, sim_checks_1.recoverWinCount)(rtp, n, M);
        assert.strictEqual(rec.ok, true, rec.reason);
        assert.strictEqual(rec.wins, wins);
        assert.ok(rec.residual <= (0, sim_checks_1.reconstructionTolerance)(wins), `residual ${rec.residual}`);
    });
});
describe('simulation checks — every plotted standard error', () => {
    it('accepts the committed series exactly, and counts zero points on theory', () => {
        const r = (0, sim_checks_1.validateConvergenceSeries)(COMMITTED_POINTS, M, THEO);
        assert.strictEqual(r.ok, true, r.failures.join('; '));
        assert.strictEqual(r.exactlyOnTheory, 0);
        r.points.forEach((p) => assert.strictEqual(p.storedSE, p.expectedSE, `n=${p.n}`));
    });
    it('REJECTS the reviewer\'s se = 123456 on the first plotted point', () => {
        const mutated = COMMITTED_POINTS.map((p, i) => (i === 0 ? { ...p, se: 123456 } : p));
        const r = (0, sim_checks_1.validateConvergenceSeries)(mutated, M, THEO);
        assert.strictEqual(r.ok, false);
        assert.strictEqual(r.failures.length, 1);
        assert.match(r.failures[0], /^n=1000: stored SE 123456 != 0\.03127046289391956/);
    });
    it('rejects a standard error wrong in the last bit', () => {
        const nudged = COMMITTED_POINTS.map((p, i) => (i === 3 ? { ...p, se: p.se * (1 + Number.EPSILON) } : p));
        const r = (0, sim_checks_1.validateConvergenceSeries)(nudged, M, THEO);
        assert.strictEqual(r.ok, false, 'a one-ULP standard-error edit must not pass');
    });
    it('rejects a non-finite or absent standard error', () => {
        for (const se of [Number.NaN, Infinity, undefined, null, '0.03127046289391956']) {
            const r = (0, sim_checks_1.validateConvergenceSeries)(COMMITTED_POINTS.map((p, i) => (i === 0 ? { ...p, se } : p)), M, THEO);
            assert.strictEqual(r.ok, false, `se=${String(se)} must be rejected`);
        }
    });
    it('the SE formula is the producer\'s, expression for expression', () => {
        const n = 1000, wins = 524, rtp = COMMITTED_POINTS[0].rtp;
        const p = wins / n;
        const expected = Math.sqrt((p * (M - rtp) ** 2 + (1 - p) * (0 - rtp) ** 2) / n);
        assert.strictEqual((0, sim_checks_1.convergenceSE)(n, rtp, wins, M), expected);
        assert.strictEqual((0, sim_checks_1.convergenceSE)(n, rtp, wins, M), COMMITTED_POINTS[0].se);
    });
});
describe('simulation checks — cumulative consistency across nested checkpoints', () => {
    it('rejects a win count that falls between nested marks', () => {
        const pts = [
            { n: 1000, rtp: (524 * M) / 1000, se: (0, sim_checks_1.convergenceSE)(1000, (524 * M) / 1000, 524, M) },
            { n: 10000, rtp: (400 * M) / 10000, se: (0, sim_checks_1.convergenceSE)(10000, (400 * M) / 10000, 400, M) },
        ];
        const r = (0, sim_checks_1.validateConvergenceSeries)(pts, M, THEO);
        assert.strictEqual(r.ok, false);
        assert.match(r.failures[0], /win count fell from 524 to 400/);
    });
    it('rejects a win count that grows faster than the sample does', () => {
        const pts = [
            { n: 1000, rtp: (100 * M) / 1000, se: (0, sim_checks_1.convergenceSE)(1000, (100 * M) / 1000, 100, M) },
            { n: 2000, rtp: (1500 * M) / 2000, se: (0, sim_checks_1.convergenceSE)(2000, (1500 * M) / 2000, 1500, M) },
        ];
        const r = (0, sim_checks_1.validateConvergenceSeries)(pts, M, THEO);
        assert.strictEqual(r.ok, false);
        assert.match(r.failures[0], /win count rose by 1400 over only 1000 additional bets/);
    });
    it('rejects a non-increasing sample size', () => {
        const pts = [
            { n: 10000, rtp: (5000 * M) / 10000, se: (0, sim_checks_1.convergenceSE)(10000, (5000 * M) / 10000, 5000, M) },
            { n: 1000, rtp: (500 * M) / 1000, se: (0, sim_checks_1.convergenceSE)(1000, (500 * M) / 1000, 500, M) },
        ];
        assert.strictEqual((0, sim_checks_1.validateConvergenceSeries)(pts, M, THEO).ok, false);
    });
});
describe('an exact statistical fit is NOT evidence of fabrication', () => {
    it('accepts a consistent 40,000 / 2,000,000 `over 98` summary at exactly 0.99 RTP', () => {
        const band = { lower: 98, upper: 100, inverted: false };
        const m = (0, config_1.quotedMultiplier)(band);
        const theo = (0, config_1.theoreticalRTP)(band);
        const pr = (0, config_1.discreteWinProbability)(band);
        const wins = 40000;
        const simRtp = (wins * m) / config_1.SIM_EDGE_BETS;
        assert.strictEqual(m, 49.5);
        assert.strictEqual(theo, 0.99);
        assert.strictEqual(pr, 0.02);
        assert.strictEqual(simRtp, 0.99);
        assert.strictEqual(simRtp, theo);
        const rec = (0, sim_checks_1.recoverWinCount)(simRtp, config_1.SIM_EDGE_BETS, m);
        assert.strictEqual(rec.ok, true, rec.reason);
        assert.strictEqual(rec.wins, wins);
        assert.strictEqual((0, sim_checks_1.recoverWinCount)(simRtp, config_1.SIM_EDGE_BETS, m, wins).ok, true);
        assert.strictEqual(rec.match, 'exact');
        assert.strictEqual(rec.reconstructedRTP, theo);
        assert.strictEqual((0, sim_checks_1.reconstructReturn)(wins, m) / config_1.SIM_EDGE_BETS, 0.99);
        const logP = lnChoose(config_1.SIM_EDGE_BETS, wins) + wins * Math.log(0.02) + (config_1.SIM_EDGE_BETS - wins) * Math.log(0.98);
        assert.ok(Math.abs(Math.exp(logP) - 0.0020149586) < 1e-9, `P(X=40000) = ${Math.exp(logP)}`);
    });
    it('accepts a convergence series sitting exactly on theory, and reports it', () => {
        const pts = [1000, 10000, 100000].map((n) => ({
            n, rtp: THEO, se: (0, sim_checks_1.convergenceSE)(n, THEO, n / 2, M),
        }));
        const r = (0, sim_checks_1.validateConvergenceSeries)(pts, M, THEO);
        assert.strictEqual(r.ok, true, r.failures.join('; '));
        assert.strictEqual(r.exactlyOnTheory, 3, 'exact hits must be COUNTED, not rejected');
    });
    it('accepts a runs test with z exactly 0 and healthy variance', () => {
        const n = 200000, n1 = 100000;
        const rs = (0, sim_checks_1.runsStatistic)((2 * n1 * (n - n1)) / n + 1, n1, n);
        assert.strictEqual(rs.z, 0);
        assert.strictEqual(rs.degenerate, false);
        assert.ok(rs.variance > 0, 'a balanced split has positive runs variance');
    });
    it('DOES reject a runs test with zero variance — every observation on one side', () => {
        const degenerate = (0, sim_checks_1.runsStatistic)(1, 200000, 200000);
        assert.strictEqual(degenerate.degenerate, true);
        assert.ok(!(degenerate.variance > 0), `variance ${degenerate.variance}`);
        assert.strictEqual((0, sim_checks_1.runsStatistic)(1, 0, 200000).degenerate, true);
    });
    it('re-derives what the COMMITTED artifact\'s own schema allows, and proves which branch that is', () => {
        const sim = JSON.parse(fs.readFileSync(path.join(__dirname, '../../outputs/simulation-results.json'), 'utf8'));
        const ser = sim?.pass1?.serial ?? {};
        const schemaVersion = Number(sim.schemaVersion ?? 1);
        assert.ok(schemaVersion === 1 || schemaVersion === sim_checks_1.SIM_SCHEMA_VERSION, `unknown artifact schema ${schemaVersion}`);
        const runsZ = Number(ser.runsZ);
        assert.ok(Number.isFinite(runsZ), 'the artifact must carry a finite runsZ under either schema');
        if (schemaVersion >= 2) {
            const runs = Number(ser.runs), n1 = Number(ser.n1), n = Number(ser.n);
            assert.ok(Number.isInteger(runs) && Number.isInteger(n1) && Number.isInteger(n), `schema ${schemaVersion} must store integer cell counts, got runs=${ser.runs} n1=${ser.n1} n=${ser.n}`);
            const rs = (0, sim_checks_1.runsStatistic)(runs, n1, n);
            assert.strictEqual(rs.degenerate, false, `runs variance is 0 at n1=${n1} of n=${n}`);
            assert.strictEqual(rs.z, runsZ, `stored runsZ ${runsZ} != ${rs.z} re-derived from (runs=${runs}, n1=${n1}, n=${n})`);
            assert.strictEqual(Number(ser.zCritical), (0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN));
            return;
        }
        assert.strictEqual(schemaVersion, 1);
        assert.strictEqual(ser.runs, undefined, 'schema 1 must not carry a runs count — if it does, the artifact is mislabelled');
        assert.strictEqual(ser.n1, undefined, 'schema 1 must not carry n1 — if it does, the artifact is mislabelled');
        assert.strictEqual(Number(ser.n), 200000, 'the serial depth IS stored under schema 1');
        assert.strictEqual(Number(ser.runsP), (0, stats_1.twoSidedNormalP)(runsZ), `stored runsP ${ser.runsP} != ${(0, stats_1.twoSidedNormalP)(runsZ)} recomputed from runsZ ${runsZ}`);
        const preimages = [];
        for (let n1 = 99000; n1 <= 101000 && preimages.length < 2; n1++) {
            const { expected, variance, degenerate } = (0, sim_checks_1.runsStatistic)(0, n1, 200000);
            if (degenerate)
                continue;
            const runs = Math.round(expected + runsZ * Math.sqrt(variance));
            if ((0, sim_checks_1.runsStatistic)(runs, n1, 200000).z === runsZ)
                preimages.push([runs, n1]);
        }
        assert.ok(preimages.length >= 2, `schema 1 cannot pin the cell counts: found ${preimages.length} exact preimage(s) of runsZ=${runsZ}`);
    });
});
describe('the declared error budget describes the decision rule', () => {
    it('enumerates every screen that can move the verdict', () => {
        assert.strictEqual(sim_checks_1.SCORED_STATISTICAL_PREDICATES.length, 7);
        assert.deepStrictEqual(sim_checks_1.SCORED_STATISTICAL_PREDICATES.map((s) => s.id), ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7']);
        assert.deepStrictEqual([...new Set(sim_checks_1.SCORED_STATISTICAL_PREDICATES.map((s) => s.step))], [16, 17]);
    });
    it('the family-wise bound is ABOVE the three-screen alpha, not equal to it', () => {
        assert.ok(sim_checks_1.FAMILY_WISE_BOUND > 0.01, 'the whole family cannot be bounded by one screen group\'s alpha');
        assert.ok(Math.abs(sim_checks_1.FAMILY_WISE_BOUND - 0.0300057) < 1e-6, `bound ${sim_checks_1.FAMILY_WISE_BOUND}`);
    });
    it('STEP 16\'s own bound is above α too — it scores more than the three screens', () => {
        assert.ok(sim_checks_1.STEP_16_BOUND > 0.01, 'a step scoring S1-S5 is not bounded by S1-S3\'s alpha');
        assert.ok(Math.abs(sim_checks_1.STEP_16_BOUND - 0.0100057) < 1e-7, `step-16 bound ${sim_checks_1.STEP_16_BOUND}`);
        assert.strictEqual(sim_checks_1.FAMILY_WISE_BOUND, sim_checks_1.STEP_16_BOUND + 0.01 + 0.01);
        const step16Screens = sim_checks_1.SCORED_STATISTICAL_PREDICATES.filter((s) => s.step === 16);
        assert.strictEqual(step16Screens.length, 5, 'Step 16 scores five statistical screens, not three');
    });
    it('the verifier declares the schema version it implements', () => {
        assert.strictEqual(sim_checks_1.SIM_SCHEMA_VERSION, 2);
    });
});
function lnChoose(n, k) {
    return lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);
}
function lnGamma(x) {
    const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
        -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++)
        ser += c[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

},
"tests/dice/statsTests.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("node:assert"));
const stats_1 = require("../../src/stats");
const config_1 = require("../../src/config");
const REFERENCE_QUANTILES = [
    [0.5, 0],
    [0.9, 1.2815515655446004],
    [0.975, 1.959963984540054],
    [0.99, 2.3263478740408408],
    [0.995, 2.5758293035489004],
    [0.9983333333333333, 2.9351994688666987],
    [0.999, 3.090232306167813],
    [0.000001, -4.753424308822899],
];
describe('normal quantile (AS 241)', () => {
    it('matches independent reference quantiles to within 1e-14', () => {
        for (const [p, expected] of REFERENCE_QUANTILES) {
            const got = (0, stats_1.normalQuantile)(p);
            assert.ok(Math.abs(got - expected) < 1e-14, `Φ⁻¹(${p}) = ${got}, reference ${expected}`);
        }
    });
    it('is odd about the median, to within 1e-14', () => {
        for (const p of [0.001, 0.01, 0.1, 0.3, 0.4249, 0.4251]) {
            assert.ok(Math.abs((0, stats_1.normalQuantile)(p) + (0, stats_1.normalQuantile)(1 - p)) < 1e-14, `p=${p}`);
        }
    });
    it('is continuous across the branch boundary at |p − 0.5| = 0.425', () => {
        const below = (0, stats_1.normalQuantile)(0.5 + 0.425 - 1e-12);
        const above = (0, stats_1.normalQuantile)(0.5 + 0.425 + 1e-12);
        assert.ok(Math.abs(above - below) < 1e-10, `${below} vs ${above}`);
    });
    it('is strictly increasing', () => {
        let prev = -Infinity;
        for (let p = 0.001; p < 1; p += 0.0007) {
            const v = (0, stats_1.normalQuantile)(p);
            assert.ok(v > prev, `not increasing at p=${p}`);
            prev = v;
        }
    });
    it('returns NaN outside the open unit interval', () => {
        for (const p of [0, 1, -0.1, 1.1, Number.NaN])
            assert.ok(Number.isNaN((0, stats_1.normalQuantile)(p)));
    });
});
describe('the critical z the suite actually applies', () => {
    const NEAREST_DOUBLE = 2.935199468866706;
    const ULP = 2 ** -51;
    it('is the two-sided critical z at the Bonferroni-corrected screen level', () => {
        assert.strictEqual(config_1.ALPHA_SCREENS, 3);
        assert.strictEqual(config_1.ALPHA_SCREEN, config_1.ALPHA / 3);
        assert.strictEqual((0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN), -(0, stats_1.normalQuantile)(config_1.ALPHA_SCREEN / 2));
    });
    it('equals 2.9351994688667054, one ULP below the nearest double to the true critical z', () => {
        const z = (0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN);
        assert.strictEqual(z, 2.9351994688667054, `applied threshold ${z}`);
        assert.strictEqual(z - NEAREST_DOUBLE, -ULP, 'exactly one ULP low, not zero and not seventeen');
        assert.notStrictEqual(z, NEAREST_DOUBLE, 'the applied threshold is NOT the nearest double');
    });
    it('REJECTS the `1 - alpha/2` form: the same number over the reals, 17 ULP out in binary64', () => {
        const lower = -(0, stats_1.normalQuantile)(config_1.ALPHA_SCREEN / 2);
        const upper = (0, stats_1.normalQuantile)(1 - config_1.ALPHA_SCREEN / 2);
        assert.notStrictEqual(lower, upper, 'the two forms must be distinguishable, or there is no finding');
        assert.strictEqual(upper, 2.9351994688666982);
        assert.strictEqual((upper - NEAREST_DOUBLE) / ULP, -17, 'the upper-tail form is 17 ULP low');
        assert.ok(Math.abs(lower - NEAREST_DOUBLE) < Math.abs(upper - NEAREST_DOUBLE), 'the lower-tail form must be the more accurate one, or the change was pointless');
        assert.strictEqual(config_1.ALPHA_SCREEN / 2, 0.0016666666666666668);
        assert.notStrictEqual(1 - (1 - config_1.ALPHA_SCREEN / 2), config_1.ALPHA_SCREEN / 2);
        assert.strictEqual(1 - (1 - config_1.ALPHA_SCREEN / 2), 0.0016666666666667052);
    });
    it('distinguishes the precise quantile from an approximation and the uncorrected schema-1 field', () => {
        const z = (0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN);
        assert.ok(Math.abs(z - 2.935529862881156) > 3e-4, 'the critical value must use the precise quantile');
        assert.ok(Math.abs(z - 2.576236081309571) > 0.3, 'the artifact\'s schema-1 zCritical is at the UNCORRECTED alpha');
        assert.ok(z < 2.935529862881156, 'a smaller critical z rejects more often, not less');
    });
    it('reproduces the textbook two-sided criticals', () => {
        assert.ok(Math.abs((0, stats_1.inverseCriticalZ)(0.05) - 1.959963984540054) < 1e-14);
        assert.ok(Math.abs((0, stats_1.inverseCriticalZ)(0.01) - 2.5758293035489004) < 1e-14);
    });
});
describe('runs test carries its own cell counts (schema 2)', () => {
    it('emits n, n1 and the variance, and z is reproducible from them', () => {
        const series = Array.from({ length: 2001 }, (_, i) => (i % 3 === 0 ? 1 : 0));
        const r = (0, stats_1.runsTest)(series);
        assert.strictEqual(r.n, series.length);
        assert.strictEqual(r.n1, series.filter((x) => x === 1).length);
        assert.ok(r.variance > 0);
        assert.strictEqual(r.z, (r.runs - r.expected) / Math.sqrt(r.variance));
        assert.strictEqual(r.pValue, (0, stats_1.twoSidedNormalP)(r.z));
    });
    it('an all-one-side series is degenerate: zero variance, z forced to 0', () => {
        const r = (0, stats_1.runsTest)(new Array(1000).fill(1));
        assert.strictEqual(r.n1, 1000);
        assert.ok(!(r.variance > 0));
        assert.strictEqual(r.z, 0);
    });
});

},
"tests/steps/commitment.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
function run(ctx) {
    const { seeds, byHash, bets, seedMap } = ctx;
    let checked = 0, fails = 0;
    for (const s of seeds) {
        if (!s.serverSeed)
            continue;
        if ((0, rng_1.commitHash)(s.serverSeed) !== s.hashedServerSeed)
            fails++;
        checked++;
    }
    const s1 = (0, context_1.step)(1, 'Seed Hash Integrity', fails === 0 && checked === seeds.length ? 'PASS' : 'FAIL', `${checked}/${seeds.length} revealed seeds checked; SHA-256(utf8(serverSeed)) == hashedServerSeed; ${fails} mismatches`);
    const byEpoch = [...seeds].sort((a, b) => a.epoch - b.epoch);
    let promoChecked = 0, promoFails = 0;
    for (let i = 0; i + 1 < byEpoch.length; i++) {
        promoChecked++;
        if (byEpoch[i].nextHashedServerSeed !== byEpoch[i + 1].hashedServerSeed)
            promoFails++;
    }
    const expectedTransitions = seeds.length - 1;
    const pre = ctx.meta.preCapture;
    const epoch0 = byEpoch[0];
    let preState;
    let preOk = false;
    if (!pre || !pre.hashedServerSeed || !pre.revealedServerSeed || !pre.nextHashedServerSeed) {
        preState = 'no meta.preCapture record — epoch 0\'s commitment has no pre-capture witness';
    }
    else {
        const preCommitOk = (0, rng_1.commitHash)(pre.revealedServerSeed) === pre.hashedServerSeed;
        const preLinkOk = pre.nextHashedServerSeed === epoch0?.hashedServerSeed;
        preOk = preCommitOk && preLinkOk;
        preState = preOk
            ? 'pre-capture seed hash and link to epoch zero verified; pre-bet timing is conditional on auditor-attested chronology (AUDIT_CONTEXT.md §11, L18)'
            : `pre-capture link BROKEN (commitment ${preCommitOk ? 'ok' : 'MISMATCH'}, link to epoch 0 ${preLinkOk ? 'ok' : 'MISMATCH'})`;
    }
    const s2 = (0, context_1.step)(2, 'Next-Seed Pre-Commitment Chain', promoFails === 0 && promoChecked === expectedTransitions && preOk ? 'PASS' : 'FAIL', (promoFails === 0
        ? `${promoChecked}/${expectedTransitions} transitions: nextHashedServerSeed == next epoch's hashedServerSeed (chain INTACT)`
        : `${promoChecked - promoFails}/${expectedTransitions} match; ${promoFails} mismatch`)
        + `; ${preState}`);
    const betsByEpoch = new Map();
    for (const b of bets) {
        const arr = betsByEpoch.get(b.epoch) ?? [];
        arr.push(b);
        betsByEpoch.set(b.epoch, arr);
    }
    let epochsMultipleHashes = 0;
    for (const [, epochBets] of betsByEpoch) {
        const hashes = new Set(epochBets.map(b => b.hashedServerSeed));
        if (hashes.size !== 1)
            epochsMultipleHashes++;
    }
    const s3CoverageOk = betsByEpoch.size === seeds.length;
    const s3 = (0, context_1.step)(3, 'Hash Consistency Within Epoch', epochsMultipleHashes === 0 && s3CoverageOk ? 'PASS' : 'FAIL', `${betsByEpoch.size}/${seeds.length} epochs: all bets within each epoch share the same hashedServerSeed; ${epochsMultipleHashes} violations`);
    const hardFailures = [];
    const disclosedGaps = [];
    let epochsChecked = 0;
    let trailingAuditorRecorded = false;
    for (const [hash, epochBets] of byHash) {
        const sorted = [...epochBets].sort((a, b) => a.nonce - b.nonce);
        const nonces = sorted.map(b => b.nonce);
        const epochNum = sorted[0].epoch;
        const phase = sorted[0].phase;
        const clientSeeds = new Set(sorted.map(b => b.clientSeed));
        if (clientSeeds.size !== 1)
            hardFailures.push(`Epoch ${epochNum}: ${clientSeeds.size} distinct client seeds`);
        const nonceSet = new Set(nonces);
        const minNonce = Math.min(...nonces);
        const maxNonce = Math.max(...nonces);
        if (nonceSet.size !== nonces.length) {
            hardFailures.push(`Epoch ${epochNum}: nonce reuse — ${nonces.length} bets but only ${nonceSet.size} distinct nonces`);
        }
        const missing = [];
        for (let n = minNonce; n <= maxNonce; n++)
            if (!nonceSet.has(n))
                missing.push(n);
        const seedEntry = seeds.find(s => s.hashedServerSeed === hash);
        if (!seedEntry) {
            hardFailures.push(`Epoch ${epochNum}: no seed entry for hash ${hash.slice(0, 12)}…`);
        }
        else {
            if (seedEntry.nonceStart != null && minNonce !== seedEntry.nonceStart) {
                hardFailures.push(`Epoch ${epochNum}: first observed nonce ${minNonce} != operator post-rotation nonce ${seedEntry.nonceStart} (leading bets withheld?)`);
            }
            if (epochBets.length !== config_1.EXPECTED_EPOCH_SIZE) {
                hardFailures.push(`Epoch ${epochNum}: ${epochBets.length} bets != audited epoch size ${config_1.EXPECTED_EPOCH_SIZE} (src/config.ts)`);
            }
            if (ctx.meta.epochSize !== config_1.EXPECTED_EPOCH_SIZE) {
                hardFailures.push(`Epoch ${epochNum}: dataset header epochSize ${ctx.meta.epochSize} != audited epoch size ${config_1.EXPECTED_EPOCH_SIZE}`);
            }
            if (seedEntry.operatorBetCount != null) {
                if (maxNonce !== seedEntry.operatorBetCount - 1) {
                    hardFailures.push(`Epoch ${epochNum}: last observed nonce ${maxNonce} != operator bet count ${seedEntry.operatorBetCount} - 1 (trailing bets withheld?)`);
                }
            }
            else {
                if (seedEntry.nonceEnd != null && maxNonce !== seedEntry.nonceEnd) {
                    hardFailures.push(`Epoch ${epochNum}: record inconsistent, max nonce ${maxNonce} != recorded nonceEnd ${seedEntry.nonceEnd}`);
                }
                trailingAuditorRecorded = true;
            }
        }
        if (missing.length > 0) {
            const ss = seedMap.get(hash);
            let allVerify = ss !== undefined;
            if (ss) {
                for (const b of sorted) {
                    const served = Number(b.roll);
                    const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce);
                    if (!(0, config_1.servedRollMatches)(served, local)) {
                        allVerify = false;
                        break;
                    }
                }
            }
            if (allVerify)
                disclosedGaps.push(`epoch ${epochNum} (Phase ${phase}), nonce ${missing.join(',')} orphaned; all recorded bets verify`);
            else
                hardFailures.push(`Epoch ${epochNum}: unverifiable nonce gap at ${missing.join(',')}`);
        }
        epochsChecked++;
    }
    if (epochsChecked !== seeds.length)
        hardFailures.push(`coverage: audited ${epochsChecked}/${seeds.length} epochs`);
    let s4status;
    let s4detail;
    if (hardFailures.length > 0) {
        s4status = 'FAIL';
        s4detail = `${hardFailures.length} violations: ${hardFailures.slice(0, 3).join('; ')}`;
    }
    else if (disclosedGaps.length > 0) {
        s4status = 'PASS';
        s4detail = `${epochsChecked} epochs: single client seed each, nonces contiguous; ${disclosedGaps.length} disclosed capture-retry gap (${disclosedGaps.join('; ')}).`;
    }
    else {
        s4status = 'PASS';
        s4detail = `${epochsChecked} epochs: single client seed each, ${config_1.EXPECTED_EPOCH_SIZE} distinct contiguous nonces 0..${config_1.EXPECTED_EPOCH_SIZE - 1} (no interior gaps, no reuse); first nonce == nonceStart (capture default 0 — not operator-witnessed in this capture) in ${epochsChecked}/${seeds.length}; ${config_1.EXPECTED_EPOCH_SIZE}/${config_1.EXPECTED_EPOCH_SIZE} bets per epoch, epoch size bound to src/config.ts not to the dataset header (G-BIND); `
            + (trailingAuditorRecorded
                ? 'trailing bound is auditor-recorded; no operator end counter was retained (AUDIT_CONTEXT.md §11, L13)'
                : 'trailing bound operator-witnessed via operatorBetCount');
    }
    const s4 = (0, context_1.step)(4, 'Nonce Audit', s4status, s4detail);
    return [s1, s2, s3, s4];
}

},
"tests/steps/context.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step = step;
function step(num, name, status, detail) {
    const tag = status === 'PASS' ? '[PASS]' : status === 'FLAG' ? '[FLAG]' : '[FAIL]';
    console.log(`  ${tag} Step ${num} — ${name}`);
    if (status !== 'PASS')
        console.log(`         ${detail}`);
    return { step: num, name, status, detail };
}

}
};
const cache = Object.create(null);
function load(from, spec) {
  if (!spec.startsWith('.')) return nodeRequire(spec);
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
  const id = [base, base + '.js', base + '/index.js'].find(p => Object.hasOwn(modules, p));
  if (!id) return nodeRequire(path.join(__dirname, base));
  if (cache[id]) return cache[id].exports;
  const module = { exports: {} };
  cache[id] = module;
  modules[id](module, module.exports, s => load(id, s), path.join(__dirname, id), path.dirname(path.join(__dirname, id)));
  return module.exports;
}
load('', './tests/__standalone-entry.js');
